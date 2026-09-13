/**
 * Uji Tahap 4C: parser draf + pemeriksa draf.
 * Jalankan: npx tsx scratch/verify-draft-4c.mts
 */
import { parseBab1FoundationTransfer, parseBab1DraftTransfer, periksaDrafBab1, hitungKata } from "./src/lib/bedahParser";
import { assembleBedahPrompt4C } from "./src/lib/promptAssembler";
import { readFileSync } from "node:fs";
import { ACTIVE_TOOLS } from "./src/data/tools";

let lulus = 0;
let gagal = 0;
function cek(nama: string, kondisi: boolean, detail?: string) {
  if (kondisi) {
    lulus++;
    console.log(`  OK   ${nama}`);
  } else {
    gagal++;
    console.log(`  GAGAL ${nama}${detail ? ` :: ${detail}` : ""}`);
  }
}

// Default ke fixture di repo: berkas cache lama bisa hilang sehingga test gagal
// karena alasan yang tidak ada hubungannya dengan kode.
const DOC = process.env.DOC || "fixtures/fondasi-4b-asli.txt";
const raw = readFileSync(DOC, "utf8");
const S = "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===";
const E = "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===";
// Dokumen memuat 2 pasang marker: contoh di dalam prompt 4B, lalu output asli.
// Ambil pasangan TERAKHIR (output asli).
const blok = raw.slice(raw.lastIndexOf(S), raw.lastIndexOf(E) + E.length);
const fondasi = parseBab1FoundationTransfer(blok);
cek("fondasi 4B terparse", fondasi.success === true, JSON.stringify(fondasi.errorDetails));
const f = fondasi.data!;

console.log("\n[1] Prompt 4C");
const prompt = assembleBedahPrompt4C({ prodi: "akuntansi", areaEksplorasi: "uji", foundation: f });
cek("prompt memuat penanda draft", prompt.includes("SKRIFLOW_BAB1_DRAFT_V1"));
cek("prompt memuat target total 1000–1300", prompt.includes("1000–1300 kata"));
cek("prompt memuat tiap fungsi peta", (f.background_map || []).every((p) => prompt.includes(p.function)));
cek("prompt memuat tiap claim_id ledger", (f.evidence_ledger || []).every((e) => prompt.includes(e.claim_id)));
cek("prompt melarang ngarang sitasi", /Jangan mengarang sitasi/.test(prompt));
cek("prompt melarang gap sintetis", /belum ada penelitian tentang/.test(prompt));
cek("prompt menjelaskan claim_ids wajib", /WAJIB berasal dari satu atau lebih claim_id/.test(prompt));
cek("prompt memuat aturan DO_NOT_USE", /DO_NOT_USE tidak boleh muncul/.test(prompt));
console.log(`  panjang prompt: ${prompt.length} karakter`);

console.log("\n[2] Parser draf — kasus bahagia");
const drafBagus = {
  schema_version: 1,
  draft_status: "DRAFT_COMPLETE",
  foundation_status_ref: f.foundation_status,
  word_count_total: 0,
  target_words_total: f.target_words_total || 1150,
  background: (f.background_map || []).map((p, i) => ({
    order: p.order,
    function: p.function,
    paragraph_text: Array.from({ length: 150 }, (_, k) => `kata${k}`).join(" ") + ".",
    claim_ids: (f.evidence_ledger || []).slice(i, i + 1).map((e) => e.claim_id),
    researcher_decision_note: null,
    withheld_claims: [],
  })),
  skipped_sections: [],
  used_claim_ids: (f.evidence_ledger || []).map((e) => e.claim_id),
  avoided_claims: [],
  consistency_notes: [],
  prohibited_claims_respected: [],
  unresolved_notes: [],
};
const r1 = parseBab1DraftTransfer(
  `=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n${JSON.stringify(drafBagus)}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ===`,
  { foundation: f }
);
cek("parse sukses", r1.success === true, r1.errorDetails?.join(" | "));
cek("7 paragraf kebaca", r1.data?.background.length === 7, String(r1.data?.background.length));
cek("word_count dihitung ulang tool", r1.data?.background[0].word_count === 150, String(r1.data?.background[0].word_count));
const kritis = (r1.findings || []).filter((x) => x.severity === "CRITICAL");
cek("draf bersih tanpa temuan CRITICAL", kritis.length === 0, kritis.map((x) => x.code).join(","));

console.log("\n[3] Parser draf — penolakan");
cek(
  "tolak marker hilang",
  parseBab1DraftTransfer("tidak ada marker").success === false
);
cek(
  "tolak json rusak",
  parseBab1DraftTransfer("=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n{bukan json}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ===").success === false
);
cek(
  "tolak background kosong",
  parseBab1DraftTransfer(
    '=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n{"schema_version":1,"background":[]}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ==='
  ).success === false
);
cek(
  "tolak schema_version salah",
  parseBab1DraftTransfer(
    '=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n{"schema_version":2,"background":[{"order":1,"function":"SPECIFIC_CONTEXT","paragraph_text":"a","claim_ids":[]}]}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ==='
  ).success === false
);

console.log("\n[4] Pemeriksa draf — kode temuan");
const idKlaim = (f.evidence_ledger || [])[0]?.claim_id || "CLM01";
const base = () => JSON.parse(JSON.stringify(drafBagus));

function temuanCode(mutasi: (d: typeof drafBagus) => void): string[] {
  const d = base();
  mutasi(d);
  return periksaDrafBab1(d as never, f).map((x) => x.code);
}

const kasus: Array<[string, () => string[], string]> = [
  ["CLAIM_ID_UNKNOWN", () => temuanCode((d) => ((d.background[0] as never as { claim_ids: string[] }).claim_ids = ["CLM99"])), "CLM99"],
  ["WORD_COUNT_OUT_OF_RANGE", () => temuanCode((d) => (d.background.forEach((p) => ((p as never as { paragraph_text: string }).paragraph_text = "kata kata.")))), "pendek"],
  ["ABSOLUTE_CLAIM_PHRASE", () => temuanCode((d) => ((d.background[0] as never as { paragraph_text: string }).paragraph_text += " Belum ada penelitian tentang hal ini.")), "absolut"],
  ["CAUSAL_CLAIM_FROM_CORRELATION", () => temuanCode((d) => ((d.background[1] as never as { paragraph_text: string }).paragraph_text += " Pengungkapan ini menyebabkan naiknya kepercayaan investor.")), "kausal"],
  ["BLOCKED_SECTION_WRITTEN", () => {
    const f2 = JSON.parse(JSON.stringify(f));
    f2.background_map[0].readiness = "BLOCKED";
    const d = base();
    return periksaDrafBab1(d as never, f2).map((x) => x.code);
  }, "blocked"],
  ["PARAGRAPH_FUNCTION_MISMATCH", () => temuanCode((d) => d.background.pop()!), "kurang 1"],
];

kasus.forEach(([kode, fn, ket]) => {
  const codes = fn();
  cek(`terdeteksi ${kode} (${ket})`, codes.includes(kode as never), `dapat: ${[...new Set(codes)].join(",")}`);
});

console.log("\n[5] Guard sadar-negasi (klaim terlarang di dalam kalimat batas BUKAN pelanggaran)");
const dNegasi = base();
dNegasi.background[3].paragraph_text =
  Array.from({ length: 150 }, (_, k) => `kata${k}`).join(" ") +
  " Perlu dicatat bahwa hasil ini tidak menyebabkan perubahan pada laporan lain.";
const codeNegasi = periksaDrafBab1(dNegasi as never, f).map((x) => x.code);
cek("kalimat 'tidak menyebabkan' tidak dilaporkan sebagai kausal", !codeNegasi.includes("CAUSAL_CLAIM_FROM_CORRELATION" as never), codeNegasi.join(","));

console.log("\n[6] Hitung kata");
cek("hitungKata dasar", hitungKata("satu dua tiga") === 3);
cek("hitungKata string kosong", hitungKata("") === 0);
cek("hitungKata spasi berlebih", hitungKata("  satu   dua  ") === 2);


console.log("\n[7] Red line kontrak: 4A/4B tidak berubah, 4C tahap terpisah");
import { assembleBedahPrompt } from "./src/lib/promptAssembler";
const prompt4A = assembleBedahPrompt({ prodi: "akuntansi", areaEksplorasi: "uji", literatureEvidencePackage: "" });
cek("4A masih melarang menulis draft Bab 1", prompt4A.includes("Jangan menulis draft Bab 1"));
cek("4C hanya boleh jalan setelah fondasi 4B ada", assembleBedahPrompt4C({ prodi: "a", areaEksplorasi: "b", foundation: f }).includes(f.foundation_status));


console.log("\n[8] Outline latar belakang (jalur tanpa AI)");
import { susunOutlineLatarBelakang } from "./src/lib/bab1Outline";
const outline = susunOutlineLatarBelakang(f);
cek("outline memuat semua 7 fungsi paragraf", (f.background_map || []).every((p) => outline.includes(`Paragraf ${p.order}`)));
cek("outline memuat tiap pesan utama", (f.background_map || []).every((p) => outline.includes(p.key_message)));
cek("outline memuat setiap claim_id", (f.evidence_ledger || []).every((e) => outline.includes(`[${e.claim_id}]`)));
cek("outline memuat sumber tiap klaim aman", (f.background_map || []).length > 0);
cek("outline memuat klaim terlarang (global)", (f.prohibited_claims || []).slice(0, 3).every((c) => outline.includes(c)));
cek("outline memuat larangan per paragraf", (f.background_map || []).flatMap((p) => p.prohibited_claims || []).slice(0, 3).every((c) => outline.includes(c)));
cek("outline memuat rumusan masalah + tujuan", (f.candidate_research_questions || []).length > 0 && (f.candidate_objectives || []).length > 0);
cek("outline memuat target panjang total", outline.includes("1000-1300 kata"));
cek("outline menyatakan ini kerangka bukan tulisan jadi", outline.includes("KERANGKA, bukan tulisan jadi"));
const outlineTanpaPanjang = susunOutlineLatarBelakang(f, { sertakanBatasPanjang: false });
cek("opsi tanpa batas panjang benar-benar mencopot target", !outlineTanpaPanjang.includes("1000-1300 kata"));
const outlineBlocked = susunOutlineLatarBelakang({ ...f, background_map: f.background_map.map((p, i) => (i === 0 ? { ...p, readiness: "BLOCKED" as const } : p)) });
cek("paragraf BLOCKED diberi tanda jangan ditulis dulu", outlineBlocked.includes("STATUS: BLOKIR"));
cek("outline tidak mengklaim sebagai tulisan siap kirim", !/siap dikumpulkan|siap diserahkan/i.test(outline));

console.log("\n[9] Pemisahan Tool 4 vs Tool 5 (Susun Bab 1)");
const srcBedah = readFileSync("src/components/generator/BedahToolContainer.tsx", "utf8");
const srcBab1 = readFileSync("src/components/generator/Bab1ToolContainer.tsx", "utf8");
cek("Tool 4 tidak lagi punya blok Tahap 5 (uji kelayakan)", !srcBedah.includes("TAHAP 5: FEASIBILITY GATE"));
cek("Tool 4 tidak lagi punya blok Tahap 6-9", !srcBedah.includes("TAHAP 6:") && !srcBedah.includes("TAHAP 9:"));
cek("Tool 4 tidak lagi memuat prompt 4B/4C", !srcBedah.includes("assembleBedahPrompt4B") && !srcBedah.includes("assembleBedahPrompt4C"));
cek("Tool 4 mengarahkan ke /tools/susun-bab-1", srcBedah.includes("/tools/susun-bab-1"));
cek("Tool 5 memuat blok Tahap 5-9", ["TAHAP 5: FEASIBILITY GATE", "TAHAP 6:", "TAHAP 7:", "TAHAP 8:", "TAHAP 9:"].every((s) => srcBab1.includes(s)));
cek("Tool 5 memuat dua jalur Bab 1", srcBab1.includes("Kerangka saja") && srcBab1.includes("Draf siap tempel"));
cek("Tool 5 baca arah dari Tool 4 (bukan menyimpan sendiri)", srcBab1.includes("loadSelectedDirectionId"));
cek(
  "reset Tool 5 TIDAK menghapus arah terpilih milik Tool 4",
  !/handleConfirmReset[\s\S]{0,1200}?clearSelectedDirectionId/.test(srcBab1),
);
cek("modal reset Tool 5 terpasang di JSX", srcBab1.includes("ResetConfirmModal"));
const t5 = ACTIVE_TOOLS.find((t) => t.slug === "susun-bab-1");
cek("Tool 5 terdaftar di katalog", !!t5);
cek("Tool 5 berlabel 'Susun Bab 1'", t5?.name === "Susun Bab 1");

console.log("\n[10] Alur 4C -> 4D tegas: NotebookLM menulis, ChatGPT merapikan");
// Cacat yang dicegah: tiga tombol platform berjajar setara di Tahap 4C membuat
// mahasiswa tidak tahu mana yang dulu. Alur harus eksplisit di dalam halaman.
cek("Tahap 4C memuat urutan langkah bernomor", /Alurnya empat langkah/.test(srcBab1));
// Addendum D: seluruh prompt jadi berkas sumber, chat box cuma perintah pendek
cek("langkah 1 = unduh berkas sumber", /Langkah 1: Unduh Berkas Sumber/.test(srcBab1));
cek("langkah 2 = salin perintah pendek", /Langkah 2: Salin Perintah Pendek/.test(srcBab1));
cek("langkah 3 = buka NotebookLM", /Langkah 3: Buka NotebookLM/.test(srcBab1));
cek("langkah 4 = tempel hasil draf", /Langkah 4: Tempel hasil draf/.test(srcBab1));
cek("langkah 5 = ChatGPT merapikan bahasa", /Langkah 5: Buka ChatGPT/.test(srcBab1));
cek("tidak ada lagi tombol salin prompt panjang 4C", !/Salin Prompt Tahap 4C/.test(srcBab1));
cek("berkas sumber bisa diunduh sebagai file", /skriflow-berkas-sumber-4C\.txt/.test(srcBab1));
cek("isi berkas sumber bisa diperiksa mahasiswa", /Lihat isi berkas sumber/.test(srcBab1));
cek("perintah pendek ditampilkan sebagai yang ditempel", /Perintah pendek ini yang ditempel di kolom chat/.test(srcBab1));
cek("draf dari tempat lain diarahkan ke Langkah 4, bukan Langkah 2", /Boleh ditempel di Langkah 4/.test(srcBab1));
cek("Tahap 4C menyuruh lanjut ke 4D tanpa syarat", /Lanjut ke Tahap 4D/.test(srcBab1));
cek("tombol NotebookLM di 4C tampil sebagai tombol utama (bukan outline abu)", /bg-\[#[0-9A-Fa-f]{6}\] px-5 py-3 text-xs font-bold text-\[#[0-9A-Fa-f]{6}\][\s\S]{0,200}Langkah 3: Buka NotebookLM/.test(srcBab1));
cek("NotebookLM tidak lagi ditawarkan di 4D (kerjanya sudah selesai)", !/href="https:\/\/notebooklm\.google\.com"[\s\S]{0,400}generatedPrompt4D/.test(srcBab1));
cek("ChatGPT di 4D ditandai langkah 5", /Langkah 5: Buka ChatGPT/.test(srcBab1));
// Bahasa NotebookLM SELALU kaku — 4D tidak boleh ditawarkan sebagai pilihan.
cek("Tahap 4D berlabel WAJIB, bukan opsional", /Poles Bahasa Draf \(Wajib\)/.test(srcBab1));
cek("tidak ada kata 'Opsional' di judul tahap 4D", !/Poles Bahasa Draf \(Opsional\)/.test(srcBab1));
cek("tidak ada tawaran melewati 4D", !/boleh dilewati/i.test(srcBab1) && !/kalau draf 4C sudah enak dibaca/i.test(srcBab1));
cek("halaman menyatakan bahasa NotebookLM selalu kaku", /Bahasa NotebookLM selalu kaku/.test(srcBab1));
cek("langkah 3 menyebut 4D wajib, bukan pilihan", /Tahap ini wajib,\s*\n?\s*bukan pilihan/.test(srcBab1));
cek("tidak ada lagi baris 'Tidak memakai NotebookLM? Boleh juga:'", !/Tidak memakai NotebookLM\? Boleh juga/.test(srcBab1));
cek("draf dari tempat lain tetap wajib lewat 4D", /tetap wajib lewat Tahap 4D/.test(srcBab1));

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
