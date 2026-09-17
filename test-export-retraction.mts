/**
 * Tes ekspor (RTF + BibTeX) dan deteksi retraksi.
 * Jalankan: npx tsx test-export-retraction.mts
 *
 * Semua fungsi di sini murni (tanpa jaringan) kecuali yang diberi tanda.
 */
import assert from "node:assert/strict";
import { escapeRtf, keRtf, keBibtex, entriKeBibtex, namaFileAman } from "./src/lib/ekspor";
import { petakanRetraksi, cariStatus, kumpulkanDoiSah, urlBatchRetraksi } from "./src/lib/retraction";
import {
  doiUntukRingkasan,
  bacaRingkasanS2,
  idOpenAlexDariUrls,
  bacaPaperTerkait,
  bacaKandidatJudul,
  cariRingkasan,
  bodyS2Batch,
  petaTerkait,
  ambilTerkait,
  kumpulkanSemuaId,
  AMBANG_COCOK,
  TERKAIT_MAKS_PER_SUMBER,
} from "./src/lib/literaturTerkait";
import {
  siapkanIstilah,
  bacaTerjemahan,
  terjemahanTetap,
  gabungKataKunci,
  urlTerjemahan,
  istilahLayakDiterjemahkan,
} from "./src/lib/istilahEn";

let lulus = 0;
const ok = (nama: string, fn: () => void) => {
  try {
    fn();
    lulus++;
    console.log(`  ok  ${nama}`);
  } catch (e) {
    console.error(`  GAGAL  ${nama}\n        ${(e as Error).message}`);
    process.exitCode = 1;
  }
};

console.log("\n[1] escapeRtf — huruf Indonesia & karakter khusus");
ok("huruf beraksen jadi \\uN?", () => {
  assert.equal(escapeRtf("é"), "\\u233?");
  assert.equal(escapeRtf("ü"), "\\u252?");
});
ok("kurung dan backslash di-escape (kalau tidak, RTF rusak)", () => {
  assert.equal(escapeRtf("{a}\\b"), "\\{a\\}\\\\b");
});
ok("baris baru jadi \\line, bukan newline mentah", () => {
  assert.ok(escapeRtf("a\nb").includes("\\line"));
  assert.ok(!escapeRtf("a\nb").includes("\n"));
});
ok("teks biasa tidak berubah — 'Tahun 2024 (PSAK 117)'", () => {
  assert.equal(escapeRtf("Tahun 2024 (PSAK 117)"), "Tahun 2024 (PSAK 117)");
});

console.log("\n[2] keRtf — struktur dokumen");
ok("dokumen dibungkus {\\rtf1 ...}", () => {
  const d = keRtf([{ teks: "Bab 1" }]);
  assert.ok(d.startsWith("{\\rtf1\\ansi"));
  assert.ok(d.endsWith("}"));
});
ok("judul pakai \\qc dan tebal", () => {
  const d = keRtf([{ teks: "Latar Belakang", gaya: "judul" }]);
  assert.ok(d.includes("\\qc\\b"));
});
ok("paragraf isi rata kiri-kanan (\\qj) + spasi 1,5", () => {
  assert.ok(keRtf([{ teks: "x" }]).includes("\\qj"));
  assert.ok(keRtf([{ teks: "x" }]).includes("\\sl360"));
});
ok("tiap blok ditutup satu \\par dan blok berikutnya mulai \\pard", () => {
  // 3 blok => 3 penanda awal paragraf, 3 penutup.
  const d = keRtf([{ teks: "a" }, { teks: "b" }, { teks: "c" }]);
  // "/\\par(?!d)/" — tanpa (?!d), "\\par" ikut mencocoki "\\pard" dan hitungannya dobel.
  assert.equal((d.match(/\\par(?!d)/g) || []).length, 3);
  assert.equal((d.match(/\\pard/g) || []).length, 3);
});
ok("kurung kurawal di isi tidak membuat dokumen rusak (brace seimbang)", () => {
  const d = keRtf([{ teks: "Pengungkapan {PSAK 117}" }]);
  const buka = (d.match(/(?<!\\)\{/g) || []).length;
  const tutup = (d.match(/(?<!\\)\}/g) || []).length;
  assert.equal(buka, tutup, `brace tidak seimbang: ${buka} vs ${tutup}`);
});

console.log("\n[3] BibTeX");
ok("entri jurnal jadi @article, bukan @misc", () => {
  const b = entriKeBibtex({ title: "T", journal: "Jurnal Akuntansi" }, 0);
  assert.ok(b.startsWith("@article{"));
});
ok("field kosong DILEWATI (tidak jadi 'author = {}')", () => {
  const b = entriKeBibtex({ title: "Hanya Judul" }, 0);
  assert.ok(!b.includes("author = {}"));
  assert.ok(!b.includes("year = {}"));
  assert.ok(b.includes("title = {Hanya Judul}"));
});
ok("kunci unik untuk dua entri tanpa penulis & tahun sama", () => {
  const a = entriKeBibtex({ title: "Sama" }, 0);
  const c = entriKeBibtex({ title: "Sama" }, 1);
  const kunci = (s: string) => /^@\w+\{([^,]+),/.exec(s)![1];
  assert.notEqual(kunci(a), kunci(c));
});
ok("SETIAP entri diawali @ (tanpa ini, .bib tidak bisa diimpor)", () => {
  for (const e of [{ title: "Jurnal", journal: "J" }, { title: "Tanpa jurnal" }]) {
    assert.ok(entriKeBibtex(e, 0).startsWith("@"), "entri harus mulai dengan @");
  }
  const doc = keBibtex([{ title: "A" }, { title: "B", journal: "J" }]);
  assert.equal((doc.match(/^@/gm) || []).length, 2, "semua entri di dokumen harus mulai dengan @");
});
ok("entri tanpa judul DAN tanpa DOI dilewati", () => {
  const b = keBibtex([{ title: "Ada" }, { sourceId: "SRC-99" }, { doi: "10.1/x" }]);
  assert.equal((b.match(/^@/gm) || []).length, 2);
});
ok("sourceId tetap tercatat supaya bisa dilacak ke paket asalnya", () => {
  assert.ok(entriKeBibtex({ title: "T", sourceId: "SRC-04" }, 0).includes("SRC-04"));
});

console.log("\n[4] namaFileAman");
ok("karakter terlarang Windows dibuang", () => {
  const n = namaFileAman('Bab 1: "latar/be*lakang"', "rtf");
  assert.ok(!/[\\/:*?"<>|]/.test(n));
  assert.ok(n.endsWith(".rtf"));
});
ok("spasi jadi tanda hubung", () => {
  assert.equal(namaFileAman("Bab 1 Latar Belakang", "rtf"), "Bab-1-Latar-Belakang.rtf");
});
ok("nama kosong tetap menghasilkan berkas sah", () => {
  assert.equal(namaFileAman("", "rtf"), "skriflow.rtf");
});

console.log("\n[5] retraksi — parsing");
ok("is_retracted:true terbaca sebagai ditarik", () => {
  const p = petakanRetraksi({ results: [{ doi: "https://doi.org/10.1/x", is_retracted: true }] });
  assert.equal(p["10.1/x"].ditarik, true);
});
ok("prefix https://doi.org/ dinormalkan", () => {
  const p = petakanRetraksi({ results: [{ doi: "https://doi.org/10.1/x", is_retracted: false }] });
  assert.ok(p["10.1/x"], "kunci harus DOI polos");
});
ok("respons cacat -> peta kosong, bukan melempar error", () => {
  assert.deepEqual(petakanRetraksi(null), {});
  assert.deepEqual(petakanRetraksi({ results: "bukan array" }), {});
  assert.deepEqual(petakanRetraksi({}), {});
});
ok("artikel tanpa flag ditarik diperlakukan TIDAK ditarik (jangan menuduh)", () => {
  const p = petakanRetraksi({ results: [{ doi: "10.1/y" }] });
  assert.equal(p["10.1/y"].ditarik, false);
});
ok("cariStatus tahan beda kapitalisasi DOI", () => {
  const p = petakanRetraksi({ results: [{ doi: "10.1016/S0140-6736(97)11096-0", is_retracted: true }] });
  assert.equal(cariStatus(p, "10.1016/s0140-6736(97)11096-0")?.ditarik, true);
});

console.log("\n[6] retraksi — kumpulan DOI");
// CATATAN: format DOI yang sah wajib "10.NNNN/" (4-9 digit). Fixture seperti
// "10.1/x" DITOLAK doiSah dan membuat tes gagal karena alasan yang salah.
const D = (n: number) => `10.1234/x${n}`;

ok("DOI tidak sah ('-', 'N/A') tidak ikut dikirim", () => {
  const d = kumpulkanDoiSah([{ doi: "-" }, { doi: "N/A" }, { doi: "10.1234/ok" }]);
  assert.deepEqual(d, ["10.1234/ok"]);
});
ok("DOI ganda hanya dikirim sekali", () => {
  assert.equal(kumpulkanDoiSah([{ doi: D(1) }, { doi: D(1) }]).length, 1);
});
ok("maksimal 50 DOI per permintaan (batas OpenAlex per-page)", () => {
  const banyak = Array.from({ length: 80 }, (_, i) => ({ doi: D(i) }));
  assert.equal(kumpulkanDoiSah(banyak).length, 50);
});
ok("URL batch memuat semua DOI dengan pemisah |", () => {
  const u = urlBatchRetraksi([D(1), D(2)]);
  assert.ok(u.includes(`${D(1)}|${D(2)}`));
  assert.ok(u.includes("is_retracted"));
});

console.log("\n[7] istilah Inggris (MyMemory)");
ok("istilah baku TIDAK lewat mesin — 'laba rugi' -> 'profit and loss'", () => {
  assert.equal(terjemahanTetap("laba rugi"), "profit and loss");
  assert.equal(terjemahanTetap("  Pengendalian Internal  "), "internal control");
});
ok("istilah terlalu pendek / tanpa huruf dibuang", () => {
  assert.equal(istilahLayakDiterjemahkan("ab"), false);
  assert.equal(istilahLayakDiterjemahkan("123"), false);
  assert.equal(istilahLayakDiterjemahkan(""), false);
  assert.equal(istilahLayakDiterjemahkan("audit"), true);
});
ok("duplikat dibuang tanpa peduli kapitalisasi", () => {
  assert.deepEqual(siapkanIstilah(["Audit", "audit", "AUDIT"]), ["Audit"]);
});
ok("urutan asli dipertahankan, jumlah dibatasi 12 per permintaan", () => {
  const banyak = Array.from({ length: 20 }, (_, i) => `istilah${i}`);
  const h = siapkanIstilah(banyak);
  assert.equal(h.length, 12);
  assert.equal(h[0], "istilah0");
});
ok("respons tanpa terjemahan -> '' (bukan crash)", () => {
  assert.equal(bacaTerjemahan(null), "");
  assert.equal(bacaTerjemahan({}), "");
  assert.equal(bacaTerjemahan({ responseData: { translatedText: "  " } }), "");
});
ok("peringatan kuota MyMemory TIDAK ditampilkan sebagai terjemahan", () => {
  assert.equal(bacaTerjemahan({ responseData: { translatedText: "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS" } }), "");
  assert.equal(bacaTerjemahan({ responseData: { translatedText: "QUERY LENGTH LIMIT EXCEEDED" } }), "");
});
ok("terjemahan normal dibaca apa adanya", () => {
  assert.equal(bacaTerjemahan({ responseData: { translatedText: " insurance disclosure " } }), "insurance disclosure");
});
ok("URL memakai langpair id|en dan istilah ter-encode", () => {
  const u = urlTerjemahan("laba rugi");
  assert.ok(u.includes("langpair=id%7Cen") || u.includes("langpair=id|en"));
  assert.ok(u.includes("laba%20rugi"));
});
ok("gabungan kata kunci memuat versi Indonesia DAN Inggris", () => {
  const g = gabungKataKunci([
    { istilah: "pengungkapan", inggris: "disclosure", dariKamus: false },
    { istilah: "laba rugi", inggris: "profit and loss", dariKamus: true },
  ]);
  assert.ok(g.includes("pengungkapan") && g.includes("disclosure"));
  assert.ok(g.includes("laba rugi") && g.includes("profit and loss"));
});

console.log("\n[8] ringkasan & literatur terkait (Semantic Scholar + OpenAlex)");
ok("hanya DOI sah yang dikirim", () => {
  assert.deepEqual(doiUntukRingkasan([{ doi: "-" }, { doi: "10.1038/nature12373" }]), ["10.1038/nature12373"]);
});
ok("DOI ganda sekali saja", () => {
  assert.equal(doiUntukRingkasan([{ doi: "10.1038/x1" }, { doi: "10.1038/x1" }]).length, 1);
});
ok("body S2 memakai bentuk DOI:<doi>", () => {
  const b = JSON.parse(bodyS2Batch(["10.1038/x1"]));
  assert.deepEqual(b.ids, ["DOI:10.1038/x1"]);
});
ok("PENTING: S2 mengembalikan null di tengah — indeks harus tetap cocok", () => {
  // Permintaan [A, B], B tidak ada di S2 -> elemen ke-2 null.
  const peta = bacaRingkasanS2(
    [{ tldr: { text: "Ringkasan A" }, title: "A", year: 2020 }, null],
    ["10.1038/aaa", "10.1038/bbb"]
  );
  assert.equal(peta["10.1038/aaa"].ringkasan, "Ringkasan A");
  assert.equal(peta["10.1038/bbb"].ringkasan, "", "B harus dapat entri kosong, bukan ringkasan A");
});
ok("entri tanpa tldr tetap tercatat judulnya", () => {
  const peta = bacaRingkasanS2([{ title: "Tanpa Ringkasan", year: 2019 }], ["10.1038/ccc"]);
  assert.equal(peta["10.1038/ccc"].judul, "Tanpa Ringkasan");
  assert.equal(peta["10.1038/ccc"].ringkasan, "");
});
ok("respons cacat -> peta kosong, bukan error", () => {
  assert.deepEqual(bacaRingkasanS2(null, ["10.1038/a"]), {});
  assert.deepEqual(bacaRingkasanS2("bukan array", ["10.1038/a"]), {});
});
ok("cariRingkasan tahan beda kapitalisasi DOI", () => {
  const peta = bacaRingkasanS2([{ tldr: { text: "X" } }], ["10.1038/AbC"]);
  assert.equal(cariRingkasan(peta, "10.1038/abc")?.ringkasan, "X");
});
ok("id OpenAlex diekstrak dari URL, duplikat dibuang", () => {
  const ids = idOpenAlexDariUrls([
    "https://openalex.org/W2368732888",
    "https://openalex.org/W2368732888",
    "https://openalex.org/W2364813980",
    "bukan url",
  ]);
  assert.deepEqual(ids, ["W2368732888", "W2364813980"]);
});
ok("daftar id dibatasi 50 secara default (batas resolve_openalex)", () => {
  const banyak = Array.from({ length: 300 }, (_, i) => `https://openalex.org/W${i}`);
  assert.equal(idOpenAlexDariUrls(banyak).length, 50);
});
ok("batas id bisa diatur pemanggil", () => {
  const banyak = Array.from({ length: 30 }, (_, i) => `https://openalex.org/W${i}`);
  assert.equal(idOpenAlexDariUrls(banyak, 8).length, 8);
});
ok("paper terkait dibaca: judul wajib, DOI prefix https dibuang", () => {
  const t = bacaPaperTerkait({
    results: [
      { id: "https://openalex.org/W1", doi: "https://doi.org/10.1038/x", title: "Paper A", publication_year: 2021 },
      { id: "https://openalex.org/W2", title: "", publication_year: 2021 },
    ],
  });
  assert.equal(t.length, 1, "entri tanpa judul dibuang");
  assert.equal(t[0].doi, "10.1038/x");
  assert.equal(t[0].openalexId, "W1");
});
ok("respons terkait cacat -> daftar kosong", () => {
  assert.deepEqual(bacaPaperTerkait(null), []);
  assert.deepEqual(bacaPaperTerkait({ results: {} }), []);
});

console.log("\n[9] sumber TANPA DOI — dicarikan lewat judul (kasus nyata di Tool 5)");
// Kasus nyata: 21 sumber paket Tool 4, 0 punya DOI (laporan tahunan, siaran pers
// OJK, standar IAI). Versi pertama panel diam saja untuk kasus ini.
const JUDUL_NYATA = "Kesiapan dan Tantangan Perusahaan Asuransi di Indonesia dalam Menerapkan PSAK 74";

ok("judul identik lolos ambang dan DOInya diambil", () => {
  const k = bacaKandidatJudul(
    { results: [{ doi: "https://doi.org/10.1234/kesiapan", title: JUDUL_NYATA, publication_year: 2023, related_works: ["https://openalex.org/W1"] }] },
    JUDUL_NYATA
  );
  assert.equal(k.length, 1);
  assert.equal(k[0].doi, "10.1234/kesiapan");
  assert.deepEqual(k[0].relatedIds, ["W1"]);
  assert.ok(k[0].skor >= AMBANG_COCOK);
});
ok("judul BEDA (karya orang lain) DITOLAK — jangan salah tempel ringkasan", () => {
  const k = bacaKandidatJudul(
    { results: [{ doi: "https://doi.org/10.1/y", title: "Pengaruh Pupuk terhadap Hasil Panen Padi di Jawa" }] },
    JUDUL_NYATA
  );
  assert.equal(k.length, 0, "judul tidak mirip harus dibuang, bukan dipasangkan");
});
ok("kandidat terbaik dipilih saat ada beberapa hasil", () => {
  const k = bacaKandidatJudul(
    {
      results: [
        { doi: "https://doi.org/10.1234/lain", title: "Manajemen Risiko Perbankan Syariah" },
        { doi: "https://doi.org/10.1234/cocok", title: JUDUL_NYATA },
      ],
    },
    JUDUL_NYATA
  );
  assert.equal(k.length, 1);
  assert.equal(k[0].doi, "10.1234/cocok");
});
ok("hasil tanpa DOI sah dilewati", () => {
  const k = bacaKandidatJudul({ results: [{ title: JUDUL_NYATA }] }, JUDUL_NYATA);
  assert.equal(k.length, 0);
});
ok("respons cacat -> kandidat kosong", () => {
  assert.deepEqual(bacaKandidatJudul(null, "x"), []);
  assert.deepEqual(bacaKandidatJudul({ results: "bukan array" }, "x"), []);
});

console.log("\n[10] penempelan karya serupa — tidak boleh nyasar ke sumber lain");
ok("petaTerkait + ambilTerkait mengembalikan karya MILIK sumber itu", () => {
  const peta = petaTerkait([
    { openalexId: "W1", judul: "Karya A" },
    { openalexId: "W2", judul: "Karya B" },
  ]);
  const hasil = ambilTerkait(peta, ["W2"]);
  assert.equal(hasil.length, 1);
  assert.equal(hasil[0].judul, "Karya B");
});
ok("id yang tidak ada di peta dilewati, bukan jadi entri kosong", () => {
  const peta = petaTerkait([{ openalexId: "W1", judul: "A" }]);
  assert.equal(ambilTerkait(peta, ["W9", "W1"]).length, 1);
});
ok("karya serupa dibatasi 5 per sumber", () => {
  const peta = petaTerkait(Array.from({ length: 12 }, (_, i) => ({ openalexId: `W${i}`, judul: `K${i}` })));
  assert.equal(ambilTerkait(peta, Array.from({ length: 12 }, (_, i) => `W${i}`)).length, TERKAIT_MAKS_PER_SUMBER);
});
ok("kumpulkanSemuaId membuang duplikat antar-sumber", () => {
  assert.deepEqual(kumpulkanSemuaId([["W1", "W2"], ["W2", "W3"]]), ["W1", "W2", "W3"]);
});
ok("total id dibatasi 50 (agar resolve tidak jadi permintaan raksasa)", () => {
  const besar = [Array.from({ length: 80 }, (_, i) => `W${i}`)];
  assert.equal(kumpulkanSemuaId(besar).length, 50);
});

console.log(`\n${lulus} lulus, ${process.exitCode ? "ADA GAGAL" : "0 gagal"}\n`);
