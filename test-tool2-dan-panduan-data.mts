// Pengalaman Aul: "tools 2 tambahin rekomendasi juga" + "tools 5 bagian uji kelayakan
// data, coba diarahkan lebih sederhana lagi, cari dimana, keyword seperti apa, di
// website seperti apa".
//
// Yang diuji adalah SIFAT, bukan susunan kata:
//  - rekomendasi Tool 2 hanya bicara soal URUTAN PEMERIKSAAN (bukan judul/gap/novelty);
//  - kandidat berstatus JANGAN_DIGUNAKAN tidak pernah disarankan;
//  - alasan selalu menyebut angka/keadaan yang bisa dicek mahasiswa;
//  - panduan cari data (Addendum E) bertahan kalau field baru tidak ada (paket lama).
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  rekomendasiFenomena,
} from "./src/lib/fenomenaRekomendasi";
import { parseBedahTransfer } from "./src/lib/bedahParser";
import { JENIS_SITUS_DATA } from "./src/types/tool";
import type { RawPhenomenonCandidate } from "./src/types/tool";

let lulus = 0;
const cek = (nama: string, fn: () => void) => {
  fn();
  lulus++;
  console.log(`  ok  ${nama}`);
};

const buat = (over: Partial<RawPhenomenonCandidate>): RawPhenomenonCandidate =>
  ({
    id: "P01",
    name: "Fenomena uji",
    phenomenon_type: "MASALAH_TERDEFINISI",
    phenomenon_summary: "ringkasan",
    observed_condition: "kondisi",
    scope: { object_or_population: "petani", geography: "Jawa Barat", reference_period: "2020-2024" },
    relation_to_area: "terkait",
    evidence: [],
    quality: { relevance: "SEDANG", traceability: "SEDANG", source_independence: "SEDANG" },
    status: "PERLU_DIPERIKSA",
    ...over,
  }) as RawPhenomenonCandidate;

const bukti = (n: number, judulBeda = true) =>
  Array.from({ length: n }, (_, i) => ({
    source_title: judulBeda ? `Sumber ${i + 1}` : "Sumber sama",
    url: `https://contoh.go.id/${i + 1}`,
    source_type: "LAPORAN_RESMI",
    supports: "mendukung",
  })) as unknown as RawPhenomenonCandidate["evidence"];

console.log("\n[REKOMENDASI TOOL 2]");

cek("kandidat SIAP_DIBAWA dengan bukti kuat menduduki urutan pertama", () => {
  const hasil = rekomendasiFenomena([
    buat({ id: "P01", status: "PERLU_DIPERIKSA", evidence: bukti(1) }),
    buat({ id: "P02", status: "SIAP_DIBAWA", evidence: bukti(5), keywords_id: ["a"], keywords_en: ["b"] }),
  ]);
  assert.equal(hasil.utamaId, "P02");
});

cek("kandidat JANGAN_DIGUNAKAN tidak pernah jadi kandidat utama", () => {
  const hasil = rekomendasiFenomena([
    buat({ id: "P01", status: "JANGAN_DIGUNAKAN", evidence: bukti(9), keywords_id: ["a"], keywords_en: ["b"] }),
    buat({ id: "P02", status: "PERLU_DIPERIKSA", evidence: bukti(1) }),
  ]);
  assert.equal(hasil.utamaId, "P02");
  assert.ok(!hasil.peringkat.some((p, i) => i === 0 && p.status === "JANGAN_DIGUNAKAN"));
});

cek("pengantar menyatakan ini soal urutan pemeriksaan, bukan penentuan judul/gap/novelty", () => {
  const hasil = rekomendasiFenomena([buat({})]);
  assert.match(hasil.pengantar, /urutan pemeriksaan/i);
  assert.match(hasil.pengantar, /bukan penentuan judul/i);
});

cek("alasan menyebut angka nyata yang bisa dicek mahasiswa", () => {
  const hasil = rekomendasiFenomena([buat({ id: "P01", evidence: bukti(5), status: "SIAP_DIBAWA" })]);
  const teks = hasil.peringkat[0].alasan.join(" ");
  assert.match(teks, /5/, `alasan tidak menyebut jumlah bukti: ${teks}`);
  assert.match(teks, /5 sumber berbeda/, `alasan tidak menyebut jumlah sumber unik: ${teks}`);
});

cek("semua kandidat tidak layak -> ditandai jelas, tidak dipaksa menyarankan", () => {
  const hasil = rekomendasiFenomena([
    buat({ id: "P01", status: "JANGAN_DIGUNAKAN" }),
    buat({ id: "P02", status: "JANGAN_DIGUNAKAN" }),
  ]);
  assert.equal(hasil.semuaTidakLayak, true);
});

cek("latar belakang Tool 1 dipakai sebagai bahan, bukan ditebak", () => {
  const hasil = rekomendasiFenomena([buat({ id: "P01", unresolved_items: ["kontak narasumber belum ada"] })]);
  assert.ok(hasil.peringkat[0].catatan.some((c) => /kontak narasumber belum ada/.test(c)));
});

console.log("\n[PANDUAN CARI DATA — ADDENDUM E]");

cek("jenis situs = daftar tertutup, tidak menerima nilai karangan", () => {
  assert.ok(JENIS_SITUS_DATA.includes("BPS"));
  assert.ok(JENIS_SITUS_DATA.includes("LAINNYA"));
  assert.equal((JENIS_SITUS_DATA as readonly string[]).includes("SITUS_KARANGAN"), false);
});

cek("paket 4B ASLI (tanpa field panduan) tetap lolos — Addendum E tidak memutus paket lama", () => {
  const asli = fs.readFileSync("fixtures/direction-4a-asli.txt", "utf-8");
  const hasil = parseBedahTransfer(asli);
  assert.equal(hasil.success, true, `paket asli harus tetap lolos: ${hasil.error}`);
});

cek("paket 4B yang MEMUAT panduan: panduan terbaca apa adanya", () => {
  const asli = fs.readFileSync("fixtures/direction-4a-asli.txt", "utf-8");
  const payload = JSON.parse(asli.slice(asli.indexOf("{", asli.indexOf("BEGIN")), asli.lastIndexOf("}") + 1));
  const q = payload.directions[0].data_verification_questions[0];
  q.where_to_look = ["BPS — Statistik Kriminal"];
  q.search_keywords = ["tingkat kriminalitas per provinsi"];
  q.site_type = "BPS";
  const mentah = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(payload)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const hasil = parseBedahTransfer(mentah);
  assert.equal(hasil.success, true, `harus lolos: ${hasil.error}`);
  const keluar = (hasil as unknown as { dataV2: { directions: Array<{ data_verification_questions: Array<Record<string, unknown>> }> } })
    .dataV2.directions[0].data_verification_questions[0];
  assert.deepEqual(keluar.where_to_look, ["BPS — Statistik Kriminal"]);
  assert.deepEqual(keluar.search_keywords, ["tingkat kriminalitas per provinsi"]);
  assert.equal(keluar.site_type, "BPS");
});

cek("jenis situs di luar daftar dibuang, bukan diteruskan apa adanya", () => {
  const asli = fs.readFileSync("fixtures/direction-4a-asli.txt", "utf-8");
  const payload = JSON.parse(asli.slice(asli.indexOf("{", asli.indexOf("BEGIN")), asli.lastIndexOf("}") + 1));
  payload.directions[0].data_verification_questions[0].site_type = "SITUS_KARANGAN";
  const mentah = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(payload)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const hasil = parseBedahTransfer(mentah);
  assert.equal(hasil.success, true);
  const keluar = (hasil as unknown as { dataV2: { directions: Array<{ data_verification_questions: Array<Record<string, unknown>> }> } })
    .dataV2.directions[0].data_verification_questions[0];
  assert.equal(keluar.site_type, undefined, "nilai tak dikenal harus dibuang");
});

console.log(`\nRINGKASAN: ${lulus} lulus, 0 gagal`);
