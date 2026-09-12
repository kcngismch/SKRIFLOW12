import { ACTIVE_TOOLS, getToolBySlug } from "./src/data/tools.ts";
import {
  assemblePrompt,
  assemblePromptA,
  assemblePromptB,
  analyzePromptA,
  analyzePromptB,
  countPromptCharacters,
} from "./src/lib/promptAssembler.ts";
import { validateForm } from "./src/lib/validation.ts";
import {
  loadToolData,
  saveToolData,
  clearToolData,
} from "./src/lib/storage.ts";
import { copyToClipboard, copyPromptAndOpenPlatform } from "./src/lib/clipboard.ts";

console.log("=== RUNNING TEST SUITE: PROMPT B SOURCE ID REMOVAL (MICRO PATCH) ===");

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

// 1. TOOL REGISTRATION & CATALOG TESTS
// ==========================================
console.log("\n=== 1. TOOL REGISTRATION & CATALOG TESTS ===");
assert(ACTIVE_TOOLS.length === 5, "Tepat 5 tool aktif dalam katalog (4 bedah + Susun Bab 1)");

const t1 = getToolBySlug("cari-ide-skripsi");
const t2 = getToolBySlug("cari-fenomena-awal");
const t3 = getToolBySlug("cari-literatur-awal");
const t4 = getToolBySlug("bedah-hasil-notebooklm");

assert(t1 !== undefined, "Tool 1 (cari-ide-skripsi) terdaftar");
assert(t2 !== undefined, "Tool 2 (cari-fenomena-awal) terdaftar");
assert(t3 !== undefined, "Tool 3 (cari-literatur-awal) terdaftar");
assert(t4 !== undefined, "Tool 4 (bedah-hasil-notebooklm) terdaftar");

// 2. SEQUENTIAL NAVIGATION TESTS
// ==========================================
console.log("\n=== 2. SEQUENTIAL NAVIGATION TESTS ===");
assert(t1.nextStep.href === "/tools/cari-fenomena-awal", "Tool 1 nextStep -> cari-fenomena-awal");
assert(t2.nextStep.href === "/tools/cari-literatur-awal", "Tool 2 nextStep -> cari-literatur-awal");
assert(t3.nextStep.href === "/tools/bedah-hasil-notebooklm", "Tool 3 nextStep -> bedah-hasil-notebooklm");

// 3. TOOL 1 & TOOL 2 REGRESSION TESTS
// ==========================================
console.log("\n=== 3. TOOL 1 & TOOL 2 REGRESSION TESTS ===");
assert(t1.fields.length === 10, "Tool 1 memiliki tepat 10 fields");
assert(t2.fields.length === 7, "Tool 2 memiliki tepat 7 fields");

const promptT1 = assemblePrompt(t1, { prodi: "Teknik Informatika", minat: "NLP" });
assert(promptT1.includes("[PERAN]") && promptT1.toLowerCase().includes("area eksplorasi"), "Tool 1 menghasilkan prompt eksplorasi yang valid");

const promptT2 = assemblePrompt(t2, { prodi: "Manajemen", area_eksplorasi: "Pemasaran digital UMKM", cakupan_fenomena: "indonesia", rentang_fenomena: "five_years" });
assert(promptT2.includes("[PERAN]") && promptT2.includes("2–4 kandidat fenomena"), "Tool 2 menghasilkan prompt fenomena yang valid");

// 4. TOOL 3 FIELD MAXLENGTH CALIBRATION
// ==========================================
console.log("\n=== 4. TOOL 3 FIELD MAXLENGTH CALIBRATION ===");
assert(t3.fields.length === 15, "Tool 3 memiliki tepat 15 fields");
const fieldProdi = t3.fields.find((f) => f.id === "prodi");
const fieldArea = t3.fields.find((f) => f.id === "area_eksplorasi");
const fieldFenomena = t3.fields.find((f) => f.id === "fenomena_awal");

assert(fieldProdi.maxLength === 100, "prodi maxLength adalah 100");
assert(fieldArea.maxLength === 350, "area_eksplorasi maxLength adalah 350");
assert(fieldFenomena.maxLength === 800, "fenomena_awal maxLength adalah 800");

// Baseline sample data
const sampleBaseT3 = {
  prodi: "Akuntansi",
  area_eksplorasi: "Implementasi teknologi AI pada audit",
  fenomena_awal: "Peningkatan adopsi audit berbasis AI oleh KAP di Indonesia periode 2021-2024",
  prioritas_sumber: "campuran",
  rentang_tahun: "10 tahun terakhir",
  avoidances: "tidak mau wawancara atau survei",
  pendekatan: "kuantitatif",
  preferensi_data: "data sekunder",
};
const promptA = assemblePromptA(t3, sampleBaseT3);
const promptB = assemblePromptB(t3, sampleBaseT3);

// Worst-case payloads (100, 350, 800)
const worstCaseValues = {
  prodi: "A".repeat(100),
  area_eksplorasi: "B".repeat(350),
  fenomena_awal: "C".repeat(800),
  prioritas_sumber: "campuran",
  rentang_tahun: "D".repeat(30),
  pendekatan: "mixed methods (kombinasi)",
  preferensi_data: "data sekunder (laporan, bps, idx, dll.)",
  akses_data_catatan: "E".repeat(60),
  avoidances: "F".repeat(60),
  target_waktu: "santai / tidak ada tenggat ketat",
  kata_kunci: "G".repeat(60),
  fokus_aspek: "H".repeat(80),
  hal_terbuka: "I".repeat(80),
};

const worstPromptA = assemblePromptA(t3, worstCaseValues);
const worstPromptB = assemblePromptB(t3, worstCaseValues);
const worstCaseFinalA = countPromptCharacters(worstPromptA);
const worstCaseFinalB = countPromptCharacters(worstPromptB);

const staticA = analyzePromptA(t3, {}).staticTemplateLength;
const staticB = analyzePromptB(t3, {}).staticTemplateLength;

// ==========================================
// 5. 29 MANDATORY TESTS FOR PROMPT BUDGET & PHENOMENON INTEGRITY
// ==========================================
console.log("\n=== 5. MANDATORY TESTS FOR PROMPT BUDGET & PHENOMENON INTEGRITY ===");

// --- Kategori 1: Perhitungan Dasar ---
console.log("\n--- A. Perhitungan Dasar ---");
assert(staticB <= 1788, `1. Template statis Langkah 2 (${staticB} chars) <= 1788 karakter`);
assert(staticA <= 1600, `1b. Template statis Langkah 1 (${staticA} chars) <= 1600 karakter`);

const testFinalPrompt = assemblePromptB(t3, sampleBaseT3);
assert(testFinalPrompt.length === countPromptCharacters(testFinalPrompt), "2. Total dihitung dari string final yang benar-benar disalin");
assert(testFinalPrompt.includes("\n") && testFinalPrompt.includes("Prodi:") && testFinalPrompt.includes("Area:"), "3. Newline, label, dan pemisah ikut dihitung");

const promptBNoOptional = assemblePromptB(t3, { prodi: "Akuntansi", area_eksplorasi: "Area 1", fenomena_awal: "Fenomena 1" });
assert(!promptBNoOptional.includes("Fokus:") && !promptBNoOptional.includes("Lainnya:"), "4. Baris optional kosong tidak ikut dihitung atau dirender");

const analysisBTest = analyzePromptB(t3, sampleBaseT3);
assert(analysisBTest.finalLength === testFinalPrompt.length, "5. Counter UI sama dengan finalPrompt.length");
assert(analysisBTest.breakdown.total === testFinalPrompt.length, "5b. Breakdown total sama dengan finalPrompt.length");

// --- Kategori 2: Perlindungan Fenomena ---
console.log("\n--- B. Perlindungan Fenomena ---");
const phenom383 = "X".repeat(383);
const promptWith383 = assemblePromptB(t3, { prodi: "Akuntansi", area_eksplorasi: "Audit AI", fenomena_awal: phenom383 });
assert(promptWith383.includes(phenom383), "6. Fenomena 383 karakter masuk 100% utuh verbatim");

const phenom800 = "Fenomena akuntansi audit empiris di BEI: " + "Y".repeat(759);
assert(phenom800.length === 800, "Fixture fenomena panjang tepat 800 karakter");
const promptWith800 = assemblePromptB(t3, { prodi: "Akuntansi", area_eksplorasi: "Audit AI", fenomena_awal: phenom800 });
assert(promptWith800.includes(phenom800), "7. Fenomena tepat 800 karakter masuk 100% utuh verbatim");
assert(!promptWith800.includes(phenom800.slice(0, 500) + "..."), "8. Tidak ada ellipsis pada fenomena");
assert(promptWith800.includes(phenom800.slice(-50)), "9. Tidak ada pemotongan kata di akhir fenomena");

const formValuesBefore = { prodi: "Akuntansi", area_eksplorasi: "Audit AI", fenomena_awal: phenom800 };
assemblePromptB(t3, formValuesBefore);
assert(formValuesBefore.fenomena_awal === phenom800, "10. Nilai fenomena di form tidak berubah setelah generate prompt");

saveToolData("cari-literatur-awal", formValuesBefore);
const loadedFromStorage = loadToolData("cari-literatur-awal");
assert(loadedFromStorage.fenomena_awal === phenom800, "11. Nilai fenomena di persistence storage tidak berubah");
clearToolData("cari-literatur-awal");

// Warning never blames phenomenon
assert(analysisBTest.status !== "BLOCKED", "13. Status tidak BLOCKED untuk input valid");

// --- Kategori 3: Kondisi Screenshot ---
console.log("\n--- C. Kondisi Screenshot ---");
const prefix383 = "Peningkatan adopsi audit berbasis AI oleh KAP di Indonesia periode 2021-2024 yang menyebabkan perbedaan efisiensi pelaporan ";
const screenshotFixture = {
  prodi: "Akuntansi",
  area_eksplorasi: "Implementasi teknologi AI pada audit KAP di Indonesia",
  fenomena_awal: prefix383 + "Z".repeat(383 - prefix383.length),
};
assert(screenshotFixture.fenomena_awal.length === 383, `Fixture fenomena screenshot adalah 383 chars (aktual: ${screenshotFixture.fenomena_awal.length})`);
const screenshotPromptB = assemblePromptB(t3, screenshotFixture);
const screenshotAnalysisB = analyzePromptB(t3, screenshotFixture);

assert(screenshotPromptB.length <= 3900, `Screenshot Test: Total (${screenshotPromptB.length} chars) <= 3900`);
assert(screenshotPromptB.includes(screenshotFixture.fenomena_awal), "Screenshot Test: Fenomena 383 karakter tetap utuh");
assert(screenshotAnalysisB.status === "SAFE" || screenshotAnalysisB.status === "WARNING" || screenshotAnalysisB.status === "READY_WITH_OPTIONAL_COMPACTION", "Screenshot Test: Status prompt valid dan siap disalin");

// --- Kategori 4: Batas Maksimum ---
console.log("\n--- D. Batas Maksimum & Compaction ---");
const maxEssentialInputs = {
  prodi: "A".repeat(100),
  area_eksplorasi: "B".repeat(350),
  fenomena_awal: "C".repeat(800),
};
const maxEssentialPromptB = assemblePromptB(t3, maxEssentialInputs);
assert(maxEssentialPromptB.length <= 3900, `14. Max inputs (100 + 350 + 800) menghasilkan prompt valid (${maxEssentialPromptB.length} <= 3900)`);
assert(maxEssentialPromptB.includes("C".repeat(800)), "14b. Fenomena 800 karakter tetap utuh pada max essential input");

const maxFullInputs = {
  prodi: "A".repeat(100),
  area_eksplorasi: "B".repeat(350),
  fenomena_awal: "C".repeat(800),
  fokus_aspek: "Fokus aspek pemetaan literatur yang sangat panjang dan mendalam secara terperinci. ".repeat(15),
  hal_terbuka: "Hal yang masih belum ditentukan dan sangat mendalam pada penelitian skripsi akuntansi. ".repeat(15),
};
const maxFullPromptB = assemblePromptB(t3, maxFullInputs);
const maxFullAnalysisB = analyzePromptB(t3, maxFullInputs);

assert(maxFullPromptB.length <= 3900, `15. Prompt B dengan fokus & unresolved panjang tetap <= 3900 (${maxFullPromptB.length} chars)`);
assert(maxFullPromptB.includes("C".repeat(800)), "15b. Fenomena tetap utuh saat fokus dan unresolved panjang");
assert(maxFullAnalysisB.isOptionalCompacted === true, "16. Konteks opsional dipadatkan saat ruang terbatas");
assert(maxFullAnalysisB.status === "READY_WITH_OPTIONAL_COMPACTION", "16b. Status READY_WITH_OPTIONAL_COMPACTION diset");
assert(maxFullInputs.fokus_aspek.length > 500, "17. Nilai form fokus_aspek asli tetap utuh");

assert(worstCaseFinalA <= 3900, `18a. Total worstCaseFinalA (${worstCaseFinalA}) <= 3900`);
assert(worstCaseFinalB <= 3900, `18b. Total worstCaseFinalB (${worstCaseFinalB}) <= 3900`);
assert(maxFullAnalysisB.remainingLength === 3900 - maxFullPromptB.length, "19. Remaining length akurat");

// --- Kategori 5: Regresi Akademik ---
console.log("\n--- E. Regresi Akademik ---");
assert(promptB.includes("DIABAIKAN: Research Report/laporan AI") || promptB.includes("Research Report"), "21. Larangan Research Report tetap ada di Prompt B");
assert(promptA.includes("Research Report"), "21b. Larangan Research Report tetap ada di Prompt A");
assert(promptB.includes("KELAYAKAN & PRINSIP:"), "22. Gate kelayakan & prinsip tetap ada");
assert(promptB.includes("INTI:") && promptB.includes("PENDUKUNG (maks. 5)"), "23. Spesifikasi naskah inti & pendukung tetap ada");
assert(promptB.includes("Jika INTI <8: tetap susun Paket Bukti sementara"), "24. Aturan sumber kurang dari 8 tetap ada");
assert(promptB.includes("SOURCE REGISTER"), "25. Source Register tetap diminta");
assert(promptB.includes("MATRIKS BUKTI (maks. 16)"), "26. Matriks Bukti tetap diminta");
assert(promptB.includes("sitasi native NotebookLM"), "27. Citation marker NotebookLM tetap diminta");
assert(promptB.includes("Review/SLR bukan bukti empiris independen"), "28. Review tidak diperlakukan sebagai bukti empiris independen");
assert(promptB.includes("Dilarang membuat gap otomatis, kesimpulan final, judul, novelty, variabel final"), "29. Larangan gap, judul, novelty, variabel, teori, metode final");

// Form validation
const validFenomena800 = validateForm(t3.fields, { prodi: "Akuntansi", area_eksplorasi: "AI Audit", fenomena_awal: "A".repeat(800) });
assert(validFenomena800.isValid, "Fenomena 800 valid pada form validator");

const invalidFenomena801 = validateForm(t3.fields, { prodi: "Akuntansi", area_eksplorasi: "AI Audit", fenomena_awal: "A".repeat(801) });
assert(!invalidFenomena801.isValid && invalidFenomena801.errors.fenomena_awal.includes("kelebihan 1 karakter"), "Fenomena 801 ditolak form validator");

// Storage isolation
saveToolData("cari-literatur-awal", { prodi: "Akuntansi", avoidances: "gamau wawancara", preferensi_data: "data sekunder" });
const savedData = loadToolData("cari-literatur-awal");
assert(savedData.avoidances === "gamau wawancara" && savedData.preferensi_data === "data sekunder", "Constraint mahasiswa tetap tersimpan di storage");
clearToolData("cari-literatur-awal");

// Clipboard helpers
assert(typeof copyToClipboard === "function" && typeof copyPromptAndOpenPlatform === "function", "Global clipboard helpers tersedia");

console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}
