import { ACTIVE_TOOLS } from "./src/data/tools.ts";
import {
  assembleLiteraturePromptA,
  assembleLiteraturePromptB,
  assemblePromptA,
  assemblePromptB,
  analyzePromptA,
  analyzePromptB,
  projectOptionalText,
  normalizePromptLineEndings,
} from "./src/lib/promptAssembler.ts";
import { saveToolData, loadToolData, clearToolData, saveSharedResearchContext, loadSharedResearchContext } from "./src/lib/storage.ts";

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

console.log("=== RUNNING 44 MANDATORY TESTS: CARI LITERATUR PROMPT A & B ===");

const t3 = ACTIVE_TOOLS.find((t) => t.slug === "cari-literatur-awal");

// ==========================================
// BAGIAN A: TEMPLATE A TESTS (1 - 10)
// ==========================================
console.log("\n--- BAGIAN A: TEMPLATE PROMPT A TESTS ---");

const resA_empty = assembleLiteraturePromptA({});
const staticA = resA_empty.breakdown.staticText;
assert(staticA <= 1600, `1. Static upper bound Prompt A maksimal 1.600 karakter (aktual: ${staticA})`);

const maxContextA = {
  prodi: "A".repeat(100),
  area_eksplorasi: "B".repeat(350),
  fenomena_awal: "C".repeat(800),
  prioritas_sumber: "D".repeat(250),
  rentang_publikasi: "E".repeat(100),
  kata_kunci: "F".repeat(200),
  fokus_literatur: "G".repeat(250),
  hal_belum_ditentukan: "H".repeat(150),
};
const resA_max = assembleLiteraturePromptA(maxContextA);
assert(resA_max.totalLength <= 3800, `2. Konteks maksimum menghasilkan total maksimal 3.800 (aktual: ${resA_max.totalLength})`);

const phenom800 = "Fenomena empiris S1: " + "X".repeat(779);
assert(phenom800.length === 800, "Phenomenon test string tepat 800 karakter");
const resA_phenom800 = assembleLiteraturePromptA({
  prodi: "Akuntansi",
  area: "Audit AI",
  fenomena: phenom800,
});
assert(resA_phenom800.prompt.includes(phenom800), "3. Fenomena tepat 800 karakter masuk utuh ke Prompt A");
assert(resA_phenom800.phenomenonPreserved === true, "3b. phenomenonPreserved flag is true");

const prodi100 = "P".repeat(100);
const area350 = "Q".repeat(350);
const resA_core = assembleLiteraturePromptA({
  prodi: prodi100,
  area: area350,
  fenomena: "Fenomena uji",
});
assert(resA_core.prompt.includes(prodi100) && resA_core.prompt.includes(area350), "4. Prodi 100 dan area 350 masuk utuh");

// 8 Routing fields test
assert(resA_max.prompt.includes("Prodi:") &&
       resA_max.prompt.includes("Area:") &&
       resA_max.prompt.includes("Fenomena:") &&
       resA_max.prompt.includes("Prioritas:") &&
       resA_max.prompt.includes("Rentang:") &&
       resA_max.prompt.includes("Kata Kunci:") &&
       resA_max.prompt.includes("Fokus:") &&
       resA_max.prompt.includes("Belum Ditentukan:"), "5. Seluruh 8 routing field terpasang tepat");

assert(resA_empty.prompt.includes("Tolak Research Report AI"), "6. Research Report dilarang");
assert(resA_empty.prompt.includes("Deduplikasi; pakai versi terbaik"), "7. Deduplikasi versi terbaik disyaratkan");
assert(resA_empty.prompt.includes("Source Import Cards native"), "8. Output wajib Source Import Cards native");
assert(resA_empty.prompt.includes("Jangan auto-import"), "9. Instruksi tombol import bawaan terverifikasi");
assert(resA_empty.prompt.includes("Dilarang membuat sintesis, gap, novelty, judul, variabel final, atau draft Bab 1."), "10. Prompt A tidak meminta sintesis atau gap");

// ==========================================
// BAGIAN B: TEMPLATE B TESTS (11 - 25)
// ==========================================
console.log("\n--- BAGIAN B: TEMPLATE PROMPT B TESTS ---");

const resB_empty = assembleLiteraturePromptB({});
const staticB = resB_empty.breakdown.staticText;
assert(staticB <= 1788, `11. Static upper bound Prompt B maksimal 1.788 karakter (aktual: ${staticB})`);

const maxContextB = {
  prodi: "A".repeat(100),
  area_eksplorasi: "B".repeat(350),
  fenomena_awal: "C".repeat(800),
  fokus_literatur: "D".repeat(500),
  hal_belum_ditentukan: "E".repeat(250),
};
const resB_max = assembleLiteraturePromptB(maxContextB);
assert(resB_max.totalLength <= 3788, `12. Konteks maksimum menghasilkan total maksimal 3.788 (aktual: ${resB_max.totalLength})`);

const resB_phenom800 = assembleLiteraturePromptB({
  prodi: "Akuntansi",
  area: "Audit AI",
  fenomena: phenom800,
});
assert(resB_phenom800.prompt.includes(phenom800), "13. Fenomena tepat 800 karakter masuk utuh ke Prompt B");

const overB = {
  prodi: "Akuntansi",
  area: "Audit AI",
  fenomena: "Fenomena uji",
  fokus_literatur: "Fokus mendalam ".repeat(50), // > 500
  hal_belum_ditentukan: "Hal belum ditentukan ".repeat(30), // > 250
};
const resB_over = assembleLiteraturePromptB(overB);
assert(resB_over.compactedFields.includes("fokus_literatur") && resB_over.compactedFields.includes("hal_belum_ditentukan"), "14. Fokus maksimal 500 dan hal belum ditentukan maksimal 250 dipadatkan");

assert(resB_empty.prompt.includes("INTI + PENDUKUNG + PERLU CEK MANUAL + ABAIKAN = TOTAL NOTEBOOK"), "15. Rekonsiliasi memuat empat kategori");
assert(resB_empty.prompt.includes("PERLU CEK MANUAL: metadata/akses butuh konfirmasi"), "16. PERLU CEK MANUAL dibedakan dari ABAIKAN");
assert(resB_empty.prompt.includes("INTI: relevan langsung, metode/hasil terbaca") && resB_empty.prompt.includes("PENDUKUNG (maks. 5): tak langsung"), "17. INTI dan PENDUKUNG dispesifikasikan");
assert(resB_empty.prompt.includes("ABAIKAN: Research Report AI, duplikat, retracted, atau tanpa badan artikel"), "18. Sumber tak valid masuk ABAIKAN");
assert(resB_empty.prompt.includes("ABAIKAN: Research Report AI"), "19. Research Report masuk ABAIKAN");
assert(resB_empty.prompt.includes("MATRIKS BUKTI (maks. 16)"), "20. Matriks maksimal 16");
assert(resB_empty.prompt.includes("ID sumber + sitasi native NotebookLM") && resB_empty.prompt.includes("Satu klaim-satu sumber; tanpa sitasi dilarang"), "21. Klaim tanpa sitasi native dilarang");
assert(resB_empty.prompt.includes("Review/SLR bukan bukti empiris independen"), "22. Review/SLR bukan bukti empiris independen");
assert(resB_empty.prompt.includes("labeli preprint/working paper/tesis"), "23. Preprint/working paper/tesis diberi label");
assert(resB_empty.prompt.includes("Bandingkan hanya jika setara"), "24. Gate perbandingan konstruk tetap ada");
assert(resB_empty.prompt.includes("Dilarang membuat gap otomatis, kesimpulan final, judul, novelty, variabel final"), "25. Prompt B tidak menetapkan research gap atau judul");

// ==========================================
// BAGIAN C: ASSEMBLER & INVARIANTS (26 - 38)
// ==========================================
console.log("\n--- BAGIAN C: ASSEMBLER TESTS ---");

assert(resA_max.totalLength === resA_max.prompt.length, "26. totalLength === prompt.length for Prompt A");
assert(resB_max.totalLength === resB_max.prompt.length, "26b. totalLength === prompt.length for Prompt B");

const lineEndingTest = "Line1\r\nLine2\rLine3\nLine4";
const normalized = normalizePromptLineEndings(lineEndingTest);
assert(!normalized.includes("\r") && normalized === "Line1\nLine2\nLine3\nLine4", "27. Line ending selalu \\n");

assert(resA_max.prompt === resA_max.prompt.trim(), "28. Tidak ada newline tersembunyi di awal/akhir Prompt A");
assert(resB_max.prompt === resB_max.prompt.trim(), "28b. Tidak ada newline tersembunyi di awal/akhir Prompt B");

const emptyOptionalInput = { prodi: "Akuntansi", area: "Audit", fenomena: "Fenomena 1" };
const resA_noOpt = assembleLiteraturePromptA(emptyOptionalInput);
assert(!resA_noOpt.prompt.includes("Prioritas:") && !resA_noOpt.prompt.includes("Rentang:") && !resA_noOpt.prompt.includes("Kata Kunci:") && !resA_noOpt.prompt.includes("Fokus:") && !resA_noOpt.prompt.includes("Belum Ditentukan:"), "29. Field opsional kosong menghapus seluruh barisnya di Prompt A");

const resB_noOpt = assembleLiteraturePromptB(emptyOptionalInput);
assert(!resB_noOpt.prompt.includes("Fokus:") && !resB_noOpt.prompt.includes("Lainnya:"), "29b. Field opsional kosong menghapus seluruh barisnya di Prompt B");

const originalForm = { fokus_aspek: "Fokus yang sangat panjang sekali ".repeat(20) };
const originalFormCopy = JSON.parse(JSON.stringify(originalForm));
projectOptionalText(originalForm.fokus_aspek, 100);
assert(originalForm.fokus_aspek === originalFormCopy.fokus_aspek, "30. Optional compaction tidak mengubah state form");

const projWordBound = projectOptionalText("Sistem perbankan syariah terdesentralisasi Indonesia dan tata kelola", 35);
assert(projWordBound.projected.endsWith("...") && !projWordBound.projected.includes("terdesen..."), "31. Pemadatan tidak memotong di tengah kata");

assert(resA_max.prompt.endsWith("Tulis statistik singkat (jumlah valid & catatan aspek yang kurang), lalu STOP."), "32. Baris terakhir kondisi valid >= 8 tidak terpotong");
assert(!resA_max.compactedFields.includes("fenomena") && !resA_max.compactedFields.includes("fenomena_awal"), "33. Fenomena tidak pernah masuk compactedFields");

assert(resA_phenom800.phenomenonLength === 800 && resA_phenom800.prompt.includes(phenom800), "34. Fenomena sebelum dan sesudah assembly identik");
assert(resA_max.totalLength <= 3900 && resB_max.totalLength <= 3900, "35. Total prompt tidak melebihi 3.900");

// Internal overflow test simulation
const analysisA_normal = analyzePromptA(t3, { prodi: "Akuntansi", area_eksplorasi: "Audit AI", fenomena_awal: phenom800 });
assert(analysisA_normal.status === "SAFE" || analysisA_normal.status === "WARNING", "36. Status valid untuk input standar");

const analysisB_compact = analyzePromptB(t3, overB);
assert(analysisB_compact.status === "READY_WITH_OPTIONAL_COMPACTION", "37. Warning optional compaction tidak memblokir tombol");

// Verify that error messages do NOT blame phenomenon
const analysisA_metrics = analyzePromptA(t3, maxContextA);
assert(analysisA_metrics.longestField?.id !== "error_fenomena", "38. Pesan error tidak menyuruh meringkas fenomena");

// ==========================================
// BAGIAN D: FIXTURE SCREENSHOT (39 - 41)
// ==========================================
console.log("\n--- BAGIAN D: FIXTURE SCREENSHOT ---");

const prefix383 = "Peningkatan adopsi audit berbasis AI oleh Kantor Akuntan Publik di Indonesia periode 2021-2024 yang menyebabkan disparitas kepatuhan dokumentasi audit. ";
const fixture383 = prefix383 + "K".repeat(383 - prefix383.length);
assert(fixture383.length === 383, `Fixture fenomena screenshot adalah 383 chars (aktual: ${fixture383.length})`);

const screenshotData = {
  prodi: "Akuntansi",
  area_eksplorasi: "Implementasi teknologi audit AI pada KAP di Indonesia dan implikasinya terhadap kualitas audit laporan keuangan emiten di BEI selama periode pasca-pandemi", // ~164 chars
  fenomena_awal: fixture383,
};

const fixtureResA = assembleLiteraturePromptA(screenshotData);
const fixtureResB = assembleLiteraturePromptB(screenshotData);
const fixtureAnalysisA = analyzePromptA(t3, screenshotData);
const fixtureAnalysisB = analyzePromptB(t3, screenshotData);

assert(fixtureResA.isValid === true && fixtureResA.totalLength <= 3900, `Screenshot Prompt A valid (${fixtureResA.totalLength} <= 3900)`);
assert(fixtureResB.isValid === true && fixtureResB.totalLength <= 3900, `Screenshot Prompt B valid (${fixtureResB.totalLength} <= 3900)`);
assert(fixtureResA.prompt.includes(fixture383), "Fenomena 383 karakter masuk utuh di Prompt A");
assert(fixtureResB.prompt.includes(fixture383), "Fenomena 383 karakter masuk utuh di Prompt B");
assert(fixtureAnalysisA.status === "SAFE", `Prompt A status adalah SAFE (${fixtureResA.totalLength})`);
assert(fixtureAnalysisB.status === "SAFE", `Prompt B status adalah SAFE (${fixtureResB.totalLength})`);

// ==========================================
// BAGIAN E: REGRESSION FLOW (39 - 44)
// ==========================================
console.log("\n--- BAGIAN E: REGRESSION FLOW ---");

saveSharedResearchContext({
  prodi: "Sistem Informasi",
  areaEksplorasi: "Evaluasi User Experience LLM",
  fenomenaSummary: "Fenomena handoff 123",
});
const shared = loadSharedResearchContext();
assert(shared?.areaEksplorasi === "Evaluasi User Experience LLM" && shared?.fenomenaSummary === "Fenomena handoff 123", "39. Data Tool Fenomena masuk ke Area dan Fenomena yang tepat");

const commonContext = {
  prodi: "Sistem Informasi",
  area_eksplorasi: "Area Test",
  fenomena_awal: "Fenomena Bersama 999",
};
const pA = assemblePromptA(t3, commonContext);
const pB = assemblePromptB(t3, commonContext);
assert(pA.includes("Fenomena Bersama 999") && pB.includes("Fenomena Bersama 999"), "40. Prompt A dan B menggunakan fenomena yang sama");

const updatedContext = { ...commonContext, fenomena_awal: "Fenomena Baru Diubah 888" };
const pA_up = assemblePromptA(t3, updatedContext);
const pB_up = assemblePromptB(t3, updatedContext);
assert(pA_up.includes("Fenomena Baru Diubah 888") && pB_up.includes("Fenomena Baru Diubah 888"), "41. Mengubah fenomena memperbarui kedua prompt");

saveToolData("cari-literatur-awal", { fenomena_awal: "Data lama" });
clearToolData("cari-literatur-awal");
const cleared = loadToolData("cari-literatur-awal");
assert(!cleared.fenomena_awal, "42. Reset membersihkan prompt dan status validasi lama");

assert(t3.nextStep?.href === "/tools/bedah-hasil-notebooklm" && t3.previousStep?.href === "/tools/cari-fenomena-awal", "43. Navigasi antartool tetap berfungsi");

console.log("\n=== 44/44 TESTS EXECUTION COMPLETED ===");
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) {
  process.exit(1);
}
