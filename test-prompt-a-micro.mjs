import { getToolBySlug } from "./src/data/tools.ts";
import {
  assembleLiteraturePromptA,
  assembleLiteraturePromptB,
  analyzePromptA,
} from "./src/lib/promptAssembler.ts";

console.log("=== RUNNING 5 ACCEPTANCE TESTS: MICRO-PATCH PROMPT A ===\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

const t3 = getToolBySlug("cari-literatur-awal");

// ----------------------------------------------------
// TEST 1 — SELURUH DATA TERISI (ACCEPTANCE TEST 1)
// ----------------------------------------------------
console.log("--- TEST 1: SELURUH DATA TERISI ---");
const test1Input = {
  prodi: "akuntansi",
  area_eksplorasi: "Kualitas dan karakteristik informasi laporan keuangan perusahaan publik serta kondisi respons pasar modal yang dapat diamati dari data historis.",
  fenomena_awal: "Sejumlah bukti empiris mendokumentasikan bahwa publikasi informasi laba atau laporan keuangan di pasar Indonesia diikuti pola perubahan return abnormal dan/atau aktivitas perdagangan dalam periode sekitar pengumuman. Besaran, waktu, dan bentuk respons tidak seragam antarperiode atau kelompok perusahaan, sehingga fenomenanya dapat diperiksa sebagai pola respons pasar yang teramati.",
  prioritas_sumber: "Gabungkan sumber Indonesia dan internasional yang paling relevan; jangan memaksakan kuota.",
  rentang_tahun: "10 tahun terakhir",
  kata_kunci: "kualitas laporan keuangan, kualitas informasi akuntansi",
  fokus_aspek: "", // kosong
  hal_terbuka: "Periode sampel lengkap pada beberapa artikel",
};

const res1 = assembleLiteraturePromptA(test1Input);
const analysis1 = analyzePromptA(t3, test1Input);

assert(res1.prompt.includes("Prodi: akuntansi"), "1.1 Prodi masuk pada label yang benar");
assert(res1.prompt.includes("Area: Kualitas dan karakteristik informasi laporan keuangan perusahaan publik serta kondisi respons pasar modal yang dapat diamati dari data historis."), "1.2 Area masuk pada label yang benar");
assert(res1.prompt.includes("Fenomena: Sejumlah bukti empiris mendokumentasikan bahwa publikasi informasi laba atau laporan keuangan di pasar Indonesia diikuti pola perubahan return abnormal dan/atau aktivitas perdagangan dalam periode sekitar pengumuman. Besaran, waktu, dan bentuk respons tidak seragam antarperiode atau kelompok perusahaan, sehingga fenomenanya dapat diperiksa sebagai pola respons pasar yang teramati."), "1.3 Fenomena masuk utuh tanpa pemotongan");
assert(res1.prompt.includes("Prioritas: Gabungkan sumber Indonesia dan internasional yang paling relevan; jangan memaksakan kuota."), "1.4 Prioritas masuk pada label yang benar");
assert(res1.prompt.includes("Rentang: 10 tahun terakhir"), "1.5 Rentang masuk pada label yang benar");
assert(res1.prompt.includes("Kata Kunci: kualitas laporan keuangan, kualitas informasi akuntansi"), "1.6 Kata Kunci masuk pada label yang benar");
assert(!res1.prompt.includes("Fokus:"), "1.7 Baris Fokus: tidak muncul karena kosong");
assert(res1.prompt.includes("Belum Ditentukan: Periode sampel lengkap pada beberapa artikel"), "1.8 Baris Belum Ditentukan: muncul");
assert(!res1.prompt.includes("undefined") && !res1.prompt.includes("null") && !res1.prompt.includes("{{"), "1.9 Tidak ada placeholder mentah atau undefined/null");
assert(res1.prompt.includes("Tolak Research Report AI"), "1.10 Prompt memuat larangan Research Report");
assert(res1.prompt.includes("Hanya PDF/HTML berbadan artikel"), "1.11 Prompt memuat aturan direct PDF/full-text HTML");
assert(res1.prompt.includes("Jangan auto-import"), "1.12 Prompt memuat larangan auto-import");
assert(res1.totalLength <= 3900, `1.13 Panjang runtime Test 1 (${res1.totalLength}) <= 3900`);
assert(analysis1.status === "SAFE", `1.14 Status Test 1 adalah SAFE (${res1.totalLength} <= 3500)`);

// ----------------------------------------------------
// TEST 2 — KEDUA FIELD OPSIONAL KOSONG (ACCEPTANCE TEST 2)
// ----------------------------------------------------
console.log("\n--- TEST 2: KEDUA FIELD OPSIONAL KOSONG ---");
const test2Input = {
  prodi: "akuntansi",
  area_eksplorasi: "Area Eksplorasi Akuntansi",
  fenomena_awal: "Fenomena empiris teramati di pasar modal",
  prioritas_sumber: "",
  rentang_tahun: "",
  kata_kunci: "",
  fokus_aspek: "",
  hal_terbuka: "",
};
const res2 = assembleLiteraturePromptA(test2Input);
const analysis2 = analyzePromptA(t3, test2Input);

assert(!res2.prompt.includes("Fokus:"), "2.1 Baris Fokus: hilang seluruhnya");
assert(!res2.prompt.includes("Belum Ditentukan:"), "2.2 Baris Belum Ditentukan: hilang seluruhnya");
assert(!res2.prompt.includes("Prioritas:"), "2.3 Baris Prioritas: hilang seluruhnya");
assert(!res2.prompt.includes("Rentang:"), "2.4 Baris Rentang: hilang seluruhnya");
assert(!res2.prompt.includes("Kata Kunci:"), "2.5 Baris Kata Kunci: hilang seluruhnya");
assert(!res2.prompt.includes("\n\n\n"), "2.6 Tidak ada line kosong berlebihan");
assert(res2.isValid === true && analysis2.status === "SAFE", "2.7 Prompt tetap valid dan dapat disalin");

// ----------------------------------------------------
// TEST 3 — FIELD MENCAPAI BATAS (ACCEPTANCE TEST 3)
// ----------------------------------------------------
console.log("\n--- TEST 3: FIELD MENCAPAI BATAS ---");
const test3Input = {
  prodi: "P".repeat(100),
  area_eksplorasi: "A".repeat(350),
  fenomena_awal: "F".repeat(800),
  prioritas_sumber: "S".repeat(250),
  rentang_tahun: "R".repeat(100),
  kata_kunci: "K".repeat(200),
  fokus_aspek: "O".repeat(250),
  hal_terbuka: "B".repeat(150),
};
const res3 = assembleLiteraturePromptA(test3Input);
const analysis3 = analyzePromptA(t3, test3Input);

assert(res3.prompt.includes("P".repeat(100)), "3.1 Prodi 100 karakter masuk utuh");
assert(res3.prompt.includes("A".repeat(350)), "3.2 Area 350 karakter masuk utuh");
assert(res3.prompt.includes("F".repeat(800)), "3.3 Fenomena 800 karakter masuk utuh");
assert(res3.prompt.includes("S".repeat(250)), "3.4 Prioritas 250 karakter masuk utuh");
assert(res3.prompt.includes("R".repeat(100)), "3.5 Rentang 100 karakter masuk utuh");
assert(res3.prompt.includes("K".repeat(200)), "3.6 Kata Kunci 200 karakter masuk utuh");
assert(res3.prompt.includes("O".repeat(250)), "3.7 Fokus 250 karakter masuk utuh");
assert(res3.prompt.includes("B".repeat(150)), "3.8 Belum Ditentukan 150 karakter masuk utuh");
assert(res3.totalLength === res3.prompt.length, "3.9 Counter sesuai JavaScript .length");
assert(res3.totalLength <= 3900, `3.10 Runtime (${res3.totalLength}) <= 3900 tanpa silent truncation`);
assert(analysis3.status === "WARNING", `3.11 Status pada batas maksimum adalah WARNING (${res3.totalLength} > 3500)`);

// ----------------------------------------------------
// TEST 4 — RUNTIME LEBIH DARI 3.900 (ACCEPTANCE TEST 4)
// ----------------------------------------------------
console.log("\n--- TEST 4: INPUT PENUH DIPADATKAN OTOMATIS (bukan diblokir) ---");
// Perilaku lama: input penuh -> prompt > 3.900 -> BLOCKED, tombol Salin mati,
// mahasiswa mentok. Perilaku baru: konteks opsional dipadatkan bertingkat sampai
// muat, sedangkan konteks inti (prodi/area/fenomena) tidak pernah dipotong.
const test4OverInput = {
  prodi: "P".repeat(100),
  area_eksplorasi: "A".repeat(350),
  fenomena_awal: "F".repeat(800),
  prioritas_sumber: "S".repeat(250),
  rentang_tahun: "R".repeat(100),
  kata_kunci: "K".repeat(200),
  fokus_aspek: "O".repeat(900), // field terpanjang
  hal_terbuka: "B".repeat(150),
};
const res4 = assembleLiteraturePromptA(test4OverInput);
const analysis4 = analyzePromptA(t3, test4OverInput);

assert(res4.totalLength <= 3900, `4.1 Runtime total (${res4.totalLength}) <= 3900`);
assert(res4.isValid === true, "4.2 isValid adalah true (tombol Salin tetap aktif)");
assert(analysis4.status === "READY_WITH_OPTIONAL_COMPACTION", `4.3 Status READY_WITH_OPTIONAL_COMPACTION (dapat: ${analysis4.status})`);
assert(res4.compactedFields.length > 0, "4.4 field yang dipadatkan dilaporkan ke mahasiswa");
assert(res4.phenomenonPreserved === true, "4.5 fenomena tidak pernah dipotong");
assert(!res4.compactedFields.includes("fenomena"), "4.6 fenomena tidak masuk daftar yang dipadatkan");
assert(res4.prompt.includes("F".repeat(800)), "4.7 teks fenomena 800 char tetap utuh di prompt");
assert(analysis4.longestField !== null && analysis4.longestField.length > 0, "4.8 longestField dilaporkan untuk mengarahkan perbaikan");

// 4B. Yang benar-benar tidak bisa dipadatkan tetap diblokir: template statis +
// konteks inti saja sudah melebihi batas.
const test4TakBisaDipadatkan = {
  prodi: "P".repeat(5000), // melampaui batas field inti
  area_eksplorasi: "A".repeat(5000),
  fenomena_awal: "F".repeat(5000),
};
const res4b = assembleLiteraturePromptA(test4TakBisaDipadatkan);
assert(res4b.isValid === false, "4.9 konteks inti kelewat besar tetap diblokir (bukan diam-diam dipotong)");

// ----------------------------------------------------
// TEST 5 — REGRESSION (ACCEPTANCE TEST 5)
// ----------------------------------------------------
console.log("\n--- TEST 5: REGRESSION TESTS ---");
const resB_sample = assembleLiteraturePromptB(test1Input);
assert(resB_sample.prompt.includes("Audit sumber individual notebook dan susun Paket Bukti."), "5.1 Prompt B tetap utuh");
assert(resB_sample.prompt.includes("MATRIKS BUKTI (maks. 16)"), "5.2 Prompt B matriks bukti tetap ada");
assert(resB_sample.prompt.includes("INTI + PENDUKUNG + PERLU CEK MANUAL + ABAIKAN = TOTAL NOTEBOOK"), "5.3 Prompt B rekonsiliasi tetap ada");

const resA_fresh = assembleLiteraturePromptA(test1Input);
assert(resA_fresh.prompt.includes(test1Input.fenomena_awal), "5.4 Data fenomena tetap terbawa ke Prompt A");
assert(resB_sample.prompt.includes(test1Input.fenomena_awal), "5.5 Data fenomena tetap terbawa ke Prompt B");

console.log(`\n=== ALL ACCEPTANCE TESTS PASSED: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
}
