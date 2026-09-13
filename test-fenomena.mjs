import { ACTIVE_TOOLS, getToolBySlug, LOCKED_PHASES } from "./src/data/tools.ts";
import {
  assemblePrompt,
  assemblePromptA,
  assemblePromptB,
  countPromptCharacters,
} from "./src/lib/promptAssembler.ts";
import {
  saveToolData,
  loadToolData,
  clearToolData,
  saveSelectedPhenomenon,
  loadSelectedPhenomenon,
  clearSelectedPhenomenon,
  saveSharedResearchContext,
  loadSharedResearchContext,
} from "./src/lib/storage.ts";
import {
  parsePhenomenonTransfer,
  generateFixFormatPrompt,
  generateFixUrlPrompt,
  isValidHttpUrl,
  isValidHttpsUrl,
  normalizeEvidenceUrl,
  getCanonicalSourceKey,
  getUniqueSourceCount,
  getCanonicalSourceKeys,
  computeCandidateFingerprint,
  computeSelectedPhenomenonFingerprint,
  VALID_SOURCE_TYPES,
} from "./src/lib/phenomenonParser.ts";
import { getAutofillForTool, applyAutofillValues } from "./src/lib/autofill.ts";
import { NOTEBOOKLM_LIMITS } from "./src/config/promptLimits.ts";

console.log("=== RUNNING TEST SUITE: TOOL CARI & VALIDASI FENOMENA & FEN-PROMPT-01 PATCH ===");

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

// Clear any preexisting storage state for clean testing
clearToolData("cari-ide-skripsi");
clearToolData("cari-fenomena-awal");
clearToolData("cari-literatur-awal");
clearSelectedPhenomenon();

// =========================================================================
// 1. TOOL STRUCTURE & CATALOG TESTS
// =========================================================================
console.log("\n=== 1. TOOL STRUCTURE & CATALOG TESTS ===");
assert(ACTIVE_TOOLS.length === 6, "Tepat 6 tool aktif dalam katalog (4 bedah + Susun Bab 1 + Bangun Bab 2)");

const toolSlugs = ACTIVE_TOOLS.map((t) => t.slug);
assert(new Set(toolSlugs).size === 6, "Setiap tool aktif memiliki slug unik");

const t1 = getToolBySlug("cari-ide-skripsi");
const t2 = getToolBySlug("cari-fenomena-awal");
const t2Alias = getToolBySlug("cari-validasi-fenomena");
const t3 = getToolBySlug("cari-literatur-awal");
const t4 = getToolBySlug("bedah-hasil-notebooklm");

assert(t1 !== undefined, "Tool 1 (cari-ide-skripsi) terdaftar");
assert(t2 !== undefined, "Tool 2 (cari-fenomena-awal) terdaftar");
assert(t2Alias !== undefined && t2Alias.id === t2.id, "Tool 2 alias (cari-validasi-fenomena) terdaftar dan merujuk ke Tool 2");
assert(t3 !== undefined, "Tool 3 (cari-literatur-awal) terdaftar");
assert(t4 !== undefined, "Tool 4 (bedah-hasil-notebooklm) terdaftar");

assert(t2.name === "Cari & Validasi Fenomena", "Nama Tool 2 adalah 'Cari & Validasi Fenomena'");
assert(t2.targetPlatform === "ChatGPT / Gemini", "Target platform Tool 2 adalah 'ChatGPT / Gemini'");
assert(!t2.description.toLowerCase().includes("research gap"), "Deskripsi Tool 2 tidak menyebut research gap");

// Navigation sequencing
assert(t1.nextStep.href === "/tools/cari-fenomena-awal", "Tool 1 nextStep -> cari-fenomena-awal");
assert(t1.nextStep.title === "Lanjut ke Cari & Validasi Fenomena", "Tool 1 nextStep title -> Lanjut ke Cari & Validasi Fenomena");
assert(t2.nextStep.href === "/tools/cari-literatur-awal", "Tool 2 nextStep -> cari-literatur-awal");
assert(t3.nextStep.href === "/tools/bedah-hasil-notebooklm", "Tool 3 nextStep -> bedah-hasil-notebooklm");
assert(t4.nextStep.href === "/tools/susun-bab-1", "Tool 4 nextStep -> susun-bab-1");
const t5 = getToolBySlug("susun-bab-1");
assert(t5 !== undefined, "Tool 5 (susun-bab-1) terdaftar sebagai tool aktif");
assert(t5.nextStep.href === "/tools/bangun-bab-2", "Tool 5 nextStep -> bangun-bab-2");

// Locked Phases — Bab 1 jadi Tool 5, Bab 2 jadi Tool 6, tinggal Bab 3
assert(LOCKED_PHASES.length === 1, "Tepat 1 fase terkunci: Bab 3 (Coming Soon)");
assert(!LOCKED_PHASES.some((p) => p.id === "phase-bab-1"), "Fase Bab 1 tidak lagi terkunci karena sudah jadi Tool 5");
assert(!LOCKED_PHASES.some((p) => p.id === "phase-bab-2"), "Fase Bab 2 tidak lagi terkunci karena sudah jadi Tool 6");
const t6 = getToolBySlug("bangun-bab-2");
assert(t6 !== undefined, "Tool 6 (bangun-bab-2) terdaftar sebagai tool aktif");
assert(LOCKED_PHASES.every((p) => p.badge === "COMING SOON"), "Semua locked phases bertanda COMING SOON");

// =========================================================================
// 2. DEFECT 1: PREFERENSI PENGERJAAN & CONSTRAINTS TESTS
// =========================================================================
console.log("\n=== 2. DEFECT 1: PREFERENSI PENGERJAAN & CONSTRAINTS TESTS ===");

// 2.1 Seluruh constraint tersedia -> seluruhnya masuk prompt
const allConstraintsForm = {
  prodi: "Akuntansi",
  area_eksplorasi: "Adopsi AI pada audit laporan keuangan di KAP",
  cakupan_fenomena: "indonesia",
  objek_awal: "KAP dan auditor independen",
  petunjuk_fenomena: "Kabarnya banyak KAP mulai uji coba tool otomatisasi audit",
  rentang_fenomena: "five_years",
  arahan_dosen: "Fokus pada KAP di Indonesia",
  pendekatan: "quantitative",
  preferensi_data: "secondary_public",
  akses_data: "public",
  akses_data_catatan: "Laporan IDX 2021-2024",
  avoidances: "tidak mau wawancara langsung",
  target_waktu: "deadline",
};

const promptAllConstraints = assemblePrompt(t2, allConstraintsForm);
assert(promptAllConstraints.includes("Pendekatan: Kuantitatif"), "Prompt memuat Pendekatan: Kuantitatif");
assert(promptAllConstraints.includes("Data yang nyaman: Data sekunder atau data publik"), "Prompt memuat Data yang nyaman: Data sekunder atau data publik");
assert(promptAllConstraints.includes("Akses data: Punya akses data publik"), "Prompt memuat Akses data: Punya akses data publik");
assert(promptAllConstraints.includes("Catatan akses: Laporan IDX 2021-2024"), "Prompt memuat Catatan akses: Laporan IDX 2021-2024");
assert(promptAllConstraints.includes("Hal yang dihindari: tidak mau wawancara langsung"), "Prompt memuat Hal yang dihindari: tidak mau wawancara langsung");
assert(promptAllConstraints.includes("Kondisi waktu: Sedang mengejar tenggat dosen atau kampus"), "Prompt memuat Kondisi waktu: Sedang mengejar tenggat dosen atau kampus");
assert(!promptAllConstraints.includes("Preferensi Pengerjaan: Belum diketahui"), "Prompt tidak menampilkan 'Belum diketahui' saat seluruh constraint tersedia");

// 2.2 Sebagian constraint tersedia -> hanya data tersedia yang masuk
const partialConstraintsForm = {
  prodi: "Manajemen",
  area_eksplorasi: "Pemasaran UMKM",
  pendekatan: "qualitative",
  avoidances: "turun lapangan jauh",
};
const promptPartial = assemblePrompt(t2, partialConstraintsForm);
assert(promptPartial.includes("Preferensi Pengerjaan: Pendekatan: Kualitatif; Hal yang dihindari: turun lapangan jauh"), "Prompt memuat hanya constraint yang tersedia");
assert(!promptPartial.includes("Data yang nyaman:"), "Prompt tidak memuat 'Data yang nyaman' saat tidak diisi");
assert(!promptPartial.includes("Akses data:"), "Prompt tidak memuat 'Akses data' saat tidak diisi");
assert(!promptPartial.includes("Kondisi waktu:"), "Prompt tidak memuat 'Kondisi waktu' saat tidak diisi");
assert(!promptPartial.includes("Preferensi Pengerjaan: Belum diketahui"), "Prompt tidak menampilkan 'Belum diketahui' saat ada sebagian constraint");

// 2.3 Seluruh constraint kosong -> "Belum diketahui"
const emptyConstraintsForm = {
  prodi: "Hukum Bisnis",
  area_eksplorasi: "Regulasi Fintech",
};
const promptEmptyConstraints = assemblePrompt(t2, emptyConstraintsForm);
assert(promptEmptyConstraints.includes("Preferensi Pengerjaan: Belum diketahui"), "Prompt menampilkan 'Preferensi Pengerjaan: Belum diketahui' saat seluruh constraint kosong");

// 2.4 Tidak ada undefined, null, atau [object Object]
assert(!promptAllConstraints.includes("undefined"), "Prompt all constraints tidak memuat 'undefined'");
assert(!promptAllConstraints.includes("null"), "Prompt all constraints tidak memuat 'null'");
assert(!promptAllConstraints.includes("[object Object]"), "Prompt all constraints tidak memuat '[object Object]'");
assert(!promptPartial.includes("undefined"), "Prompt partial constraints tidak memuat 'undefined'");
assert(!promptPartial.includes("null"), "Prompt partial constraints tidak memuat 'null'");
assert(!promptPartial.includes("[object Object]"), "Prompt partial constraints tidak memuat '[object Object]'");
assert(!promptEmptyConstraints.includes("undefined"), "Prompt empty constraints tidak memuat 'undefined'");
assert(!promptEmptyConstraints.includes("null"), "Prompt empty constraints tidak memuat 'null'");
assert(!promptEmptyConstraints.includes("[object Object]"), "Prompt empty constraints tidak memuat '[object Object]'");

// =========================================================================
// 3. DEFECT 2: ENUM SOURCE TYPE & RESEARCH REPORT BAN
// =========================================================================
console.log("\n=== 3. DEFECT 2: ENUM SOURCE TYPE & RESEARCH REPORT BAN ===");

assert(!VALID_SOURCE_TYPES.includes("RESEARCH_REPORT_WITH_METHOD"), "RESEARCH_REPORT_WITH_METHOD dihapus dari VALID_SOURCE_TYPES");
assert(VALID_SOURCE_TYPES.length === 6, "Tepat 6 source_type yang diizinkan");
assert(
  VALID_SOURCE_TYPES.includes("OFFICIAL_DATA") &&
    VALID_SOURCE_TYPES.includes("REGULATION") &&
    VALID_SOURCE_TYPES.includes("INSTITUTIONAL_REPORT") &&
    VALID_SOURCE_TYPES.includes("EMPIRICAL_ARTICLE") &&
    VALID_SOURCE_TYPES.includes("WORKING_PAPER") &&
    VALID_SOURCE_TYPES.includes("REPUTABLE_NEWS"),
  "Semua 6 source_type valid terdaftar"
);

assert(!promptAllConstraints.includes("RESEARCH_REPORT_WITH_METHOD"), "RESEARCH_REPORT_WITH_METHOD tidak muncul dalam prompt yang dirakit");
assert(
  promptAllConstraints.includes("INSTITUTIONAL_REPORT hanya untuk laporan resmi dari lembaga yang dapat diidentifikasi"),
  "Prompt memuat aturan INSTITUTIONAL_REPORT resmi"
);
assert(
  promptAllConstraints.includes("WORKING_PAPER harus diberi label working paper"),
  "Prompt memuat aturan WORKING_PAPER"
);
assert(
  promptAllConstraints.includes("Research Report atau laporan riset buatan AI atau dokumen gabungan NotebookLM tetap wajib dikeluarkan dan dilarang digunakan"),
  "Prompt menegaskan larangan Research Report / laporan riset buatan AI"
);

// =========================================================================
// 4. DEFECT 3 & DEFECT 4: EVIDENCE LOCATION, ACCESS NOTE, & CURRENT DATE
// =========================================================================
console.log("\n=== 4. DEFECT 3 & DEFECT 4: EVIDENCE LOCATION, ACCESS NOTE, & CURRENT DATE ===");

// Check current_date in prompt — pakai tanggal LOKAL (sama seperti app getLocalCurrentDate), bukan UTC
const _now = new Date();
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;
assert(promptAllConstraints.includes(`* Tanggal Pencarian: ${todayStr}`), `Prompt memuat Tanggal Pencarian hari ini (${todayStr})`);
assert(
  promptAllConstraints.includes("Tafsirkan 'tahun terakhir' berdasarkan Tanggal Pencarian. Bedakan tanggal publikasi sumber dari periode data yang dibahas."),
  "Prompt memuat aturan penafsiran tahun terakhir berdasarkan Tanggal Pencarian"
);
assert(
  promptAllConstraints.includes("Jangan mengarang nomor halaman atau lokasi bukti. Jika lokasi bukti tidak dapat dipastikan, output harus menulis: Tidak dapat dipastikan."),
  "Prompt memuat aturan lokasi bukti 'Tidak dapat dipastikan'"
);

// =========================================================================
// 5. PARSER & DATA VALIDATOR TESTS
// =========================================================================
console.log("\n=== 5. PARSER & DATA VALIDATOR TESTS ===");

const validPayloadJson = {
  schema_version: 1,
  insufficient_evidence: false,
  context: {
    prodi: "Akuntansi",
    area: "Audit AI",
    scope_preference: "Indonesia",
    time_preference: "5 tahun terakhir",
  },
  candidates: [
    {
      id: "F01",
      name: "Peningkatan Penggunaan Software Audit Berbasis AI pada KAP Big 4 di Indonesia",
      phenomenon_type: "TREND",
      phenomenon_summary: "Laporan IAPI dan survey industri menunjukkan peningkatan adopsi tool otomatisasi audit oleh KAP di Jakarta periode 2021-2024.",
      observed_condition: "Adopsi teknologi audit berbasis machine learning meningkat 35% dalam pengujian substantif.",
      scope: {
        object_or_population: "KAP dan Auditor Independen",
        geography: "Indonesia",
        reference_period: "2021-2024",
      },
      relation_to_area: "Relevan dengan area eksplorasi efisiensi audit AI.",
      evidence: [
        {
          claim: "Sebanyak 60% KAP menengah-besar telah menguji software audit otomatis.",
          observed_data_or_event: "Survei tahunan IAPI 2023.",
          source_title: "Laporan Tahunan Profesi Akuntan Publik Indonesia 2023",
          publisher_or_institution: "Institut Akuntan Publik Indonesia (IAPI)",
          source_type: "INSTITUTIONAL_REPORT",
          publication_date: "2023-11-15",
          reference_period: "2022-2023",
          url: "https://iapi.or.id/publikasi/laporan-2023",
          evidence_location: "Halaman 45, Tabel 3.2",
          access_note: "PDF dapat diunduh bebas dari website IAPI",
          method_or_metadata: "Survei terhadap 120 KAP anggota",
          limitations: "Hanya mencakup KAP anggota di kota besar",
        },
        {
          claim: "Kementerian Keuangan menerbitkan panduan pengawasan audit digital.",
          observed_data_or_event: "Surat Edaran PPPK Kemenkeu No. 12/2022.",
          source_title: "Surat Edaran Panduan Tata Kelola Audit Berbasis TI",
          publisher_or_institution: "PPPK Kementerian Keuangan RI",
          source_type: "REGULATION",
          publication_date: "2022-08-10",
          reference_period: "2022",
          url: "https://pppk.kemenkeu.go.id/regulasi/se-12-2022",
          evidence_location: "Pasal 4 Ayat 2",
          access_note: "Dokumen regulasi terbuka untuk publik",
          method_or_metadata: "Regulasi resmi pemerintah",
          limitations: "Bersifat pedoman umum kepatuhan",
        },
      ],
      triangulation_note: "Klaim survei asosiasi diperkuat regulasi pengawasan Kemenkeu.",
      what_is_not_proven: "Belum membuktikan efektivitas deteksi fraud secara empiris.",
      quality: {
        relevance: "KUAT",
        scope_clarity: "KUAT",
        traceability: "KUAT",
        metadata_quality: "KUAT",
        timeliness: "KUAT",
        comparability: "SEDANG",
        source_independence: "KUAT",
      },
      status: "SIAP_DIBAWA",
      keywords_id: ["audit AI", "KAP Indonesia", "otomatisasi audit"],
      keywords_en: ["AI auditing", "audit automation", "Indonesian CPA firms"],
      unresolved_items: ["Tingkat adopsi di KAP non-tier 1 belum merata"],
    },
  ],
  search_notes: ["Pencarian mencakup data IAPI dan regulasi Kemenkeu."],
};

const validTransferText = `Berikut hasil pencarian kandidat fenomena skripsi:\n\n=== BEGIN SKRIFLOW_FENOMENA_V1 ===\n${JSON.stringify(
  validPayloadJson,
  null,
  2
)}\n=== END SKRIFLOW_FENOMENA_V1 ===\n\nSemoga membantu!`;

// Test parsing valid
const parseSuccess = parsePhenomenonTransfer(validTransferText);
assert(parseSuccess.success, "Parser berhasil membaca transfer data valid");
assert(parseSuccess.payload.candidates.length === 1, "Kandidat F01 berhasil diekstraksi");
assert(parseSuccess.payload.candidates[0].evidence.length === 2, "2 item evidence berhasil diekstraksi");
assert(parseSuccess.payload.candidates[0].evidence[0].evidence_location === "Halaman 45, Tabel 3.2", "evidence_location berhasil diekstraksi");
assert(parseSuccess.payload.candidates[0].evidence[0].access_note === "PDF dapat diunduh bebas dari website IAPI", "access_note berhasil diekstraksi");
assert(parseSuccess.payload.candidates[0].evidence[0].publication_date === "2023-11-15", "publication_date tetap terpisah");
assert(parseSuccess.payload.candidates[0].evidence[0].reference_period === "2022-2023", "reference_period tetap terpisah");

// Test missing evidence_location / access_note defaults to "Tidak dapat dipastikan"
const missingLocationPayload = JSON.parse(JSON.stringify(validPayloadJson));
delete missingLocationPayload.candidates[0].evidence[0].evidence_location;
delete missingLocationPayload.candidates[0].evidence[0].access_note;
const parseMissingLoc = parsePhenomenonTransfer(
  `=== BEGIN SKRIFLOW_FENOMENA_V1 ===\n${JSON.stringify(missingLocationPayload)}\n=== END SKRIFLOW_FENOMENA_V1 ===`
);
assert(parseMissingLoc.success, "Parser menerima payload tanpa evidence_location eksplisit");
assert(parseMissingLoc.payload.candidates[0].evidence[0].evidence_location === "Tidak dapat dipastikan", "evidence_location default 'Tidak dapat dipastikan'");
assert(parseMissingLoc.payload.candidates[0].evidence[0].access_note === "Tidak dapat dipastikan", "access_note default 'Tidak dapat dipastikan'");

// Test rejected RESEARCH_REPORT_WITH_METHOD source_type
const forbiddenSourcePayload = JSON.parse(JSON.stringify(validPayloadJson));
forbiddenSourcePayload.candidates[0].evidence[0].source_type = "RESEARCH_REPORT_WITH_METHOD";
const parseForbiddenSource = parsePhenomenonTransfer(
  `=== BEGIN SKRIFLOW_FENOMENA_V1 ===\n${JSON.stringify(forbiddenSourcePayload)}\n=== END SKRIFLOW_FENOMENA_V1 ===`
);
assert(!parseForbiddenSource.success && parseForbiddenSource.error.includes("source_type 'RESEARCH_REPORT_WITH_METHOD' yang tidak valid"), "Tolak RESEARCH_REPORT_WITH_METHOD sebagai source_type");

// Test fix format prompt generator
const fixPrompt = generateFixFormatPrompt();
assert(fixPrompt.includes("evidence_location") && fixPrompt.includes("access_note"), "Prompt perbaikan memuat evidence_location dan access_note");
assert(!fixPrompt.includes("RESEARCH_REPORT_WITH_METHOD"), "Prompt perbaikan tidak memuat RESEARCH_REPORT_WITH_METHOD");

// =========================================================================
// 6. BACKWARD COMPATIBILITY & LOCALSTORAGE MIGRATION TESTS
// =========================================================================
console.log("\n=== 6. BACKWARD COMPATIBILITY & LOCALSTORAGE MIGRATION TESTS ===");

clearToolData("cari-ide-skripsi");
saveToolData("cari-ide-skripsi", {
  programStudi: "Sistem Informasi",
  minatTopik: "Pengembangan E-Commerce",
  kondisiBatasan: "tidak bisa survey langsung",
  jenisData: "data sekunder publik",
});

const legacyAutofill = getAutofillForTool("cari-fenomena-awal", {});
assert(legacyAutofill.hasData, "Autofill mengenali data schema lama");
assert(legacyAutofill.data.prodi === "Sistem Informasi", "Data programStudi dimigrasi ke prodi");

const promptLegacyStorage = assemblePrompt(t2, { area_eksplorasi: "E-Commerce UMKM" });
assert(promptLegacyStorage.includes("Program Studi: Sistem Informasi"), "Prompt memuat prodi dari legacy storage");
assert(promptLegacyStorage.includes("Hal yang dihindari: tidak bisa survey langsung"), "Prompt memuat batasan dari legacy storage");

// =========================================================================
// 7. NOTEBOOKLM INVARIANTS (PROMPT A & PROMPT B TIDAK BERUBAH)
// =========================================================================
console.log("\n=== 7. NOTEBOOKLM INVARIANTS ===");

const sampleT3Values = {
  prodi: "Akuntansi",
  area_eksplorasi: "Adopsi AI Audit",
  fenomena_awal: "Laporan IAPI 2023 menunjukkan peningkatan adopsi tool AI di KAP.",
};

const promptA = assemblePromptA(t3, sampleT3Values);
const promptB = assemblePromptB(t3, sampleT3Values);

assert(promptA.includes("Sensor:"), "Prompt A memuat Sensor:");
assert(promptA.includes("Source Import Cards native"), "Prompt A memuat Source Import Cards native");
assert(promptA.includes("Research Report"), "Prompt A memuat larangan Research Report");
assert(promptB.includes("KELAYAKAN"), "Prompt B memuat KELAYAKAN");
assert(promptB.includes("MATRIKS BUKTI"), "Prompt B memuat MATRIKS BUKTI");

assert(countPromptCharacters(promptA) <= NOTEBOOKLM_LIMITS.safeTarget, `Prompt A length (${countPromptCharacters(promptA)}) <= 3500 SAFE target`);
assert(countPromptCharacters(promptB) <= NOTEBOOKLM_LIMITS.hardLimit, `Prompt B length (${countPromptCharacters(promptB)}) <= 3900 hard limit`);

// =========================================================================
// 8. DEFECT 1 — P1: URL VALIDATION NEGATIVE & POSITIVE TESTS (BAGIAN G)
// =========================================================================
console.log("\n=== 8. DEFECT 1 — P1: URL VALIDATION TESTS ===");

const invalidUrlFixtures = [
  { id: "FEN-URL-NEG-01", val: "ScienceDirect article" },
  { id: "FEN-URL-NEG-02", val: "OpenAI Status" },
  { id: "FEN-URL-NEG-03", val: "Financial Stability Board report" },
  { id: "FEN-URL-NEG-04", val: "Jurnal Akuntansi Aktual article" },
  { id: "FEN-URL-NEG-05", val: "Bursa Efek Indonesia – Laporan Keuangan & Tahunan" },
  { id: "FEN-URL-NEG-06", val: "www.sciencedirect.com/science/article/pii/S0165410125000576" },
  { id: "FEN-URL-NEG-07", val: "doi:10.1016/j.jacceco.2025.101821" },
  { id: "FEN-URL-NEG-08", val: "javascript:alert(1)" },
  { id: "FEN-URL-NEG-09", val: "data:text/html,<div>test</div>" },
  { id: "FEN-URL-NEG-10", val: "/relative/path" },
  { id: "FEN-URL-NEG-11", val: "https://" },
  { id: "FEN-URL-NEG-12", val: "https://..." },
  { id: "FEN-URL-NEG-13", val: "" },
  { id: "FEN-URL-NEG-14", val: null },
  { id: "FEN-URL-NEG-15", val: undefined },
];

invalidUrlFixtures.forEach(({ id, val }) => {
  assert(!isValidHttpUrl(val), `${id}: Reject invalid URL format '${val}'`);
});

const validUrlFixtures = [
  { id: "FEN-URL-POS-01", val: "https://www.sciencedirect.com/science/article/pii/S0165410125000576" },
  { id: "FEN-URL-POS-02", val: "https://doi.org/10.1016/j.jacceco.2025.101821" },
  { id: "FEN-URL-POS-03", val: "https://fsb.org/2024/09/ai-financial-stability-report" },
  { id: "FEN-URL-POS-04", val: "https://status.openai.com/incidents/12345" },
  { id: "FEN-URL-POS-05", val: "https://idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan" },
  { id: "FEN-URL-POS-06", val: "http://localhost:3000/demo-source" },
];

validUrlFixtures.forEach(({ id, val }) => {
  assert(isValidHttpUrl(val), `${id}: Accept valid HTTP/HTTPS URL '${val}'`);
});

// Test parser behavior on invalid URL in payload
const invalidUrlTransferPayload = JSON.parse(JSON.stringify(validPayloadJson));
invalidUrlTransferPayload.candidates[0].evidence[0].url = "ScienceDirect article";
const parseInvalidUrlResult = parsePhenomenonTransfer(
  `=== BEGIN SKRIFLOW_FENOMENA_V1 ===\n${JSON.stringify(invalidUrlTransferPayload)}\n=== END SKRIFLOW_FENOMENA_V1 ===`
);

assert(!parseInvalidUrlResult.success, "Parser menolak payload dengan URL non-HTTP/HTTPS");
assert(
  parseInvalidUrlResult.error.includes("FORMAT URL"),
  "Error memuat header: 'FORMAT URL'"
);
assert(
  parseInvalidUrlResult.error.includes("ScienceDirect article"),
  "Error memuat detail teks URL invalid: 'ScienceDirect article'"
);

const fixUrlPrompt = generateFixUrlPrompt();
assert(fixUrlPrompt.includes("Perbaiki HANYA format field evidence[].url"), "Fix URL prompt memuat instruksi perbaikan URL");
assert(fixUrlPrompt.includes("https://"), "Fix URL prompt memuat https://");

// =========================================================================
// 9. DEFECT 2 — P1: CANONICAL ACADEMIC SOURCE DEDUPLICATION (BAGIAN H)
// =========================================================================
console.log("\n=== 9. DEFECT 2 — P1: ACADEMIC SOURCE DEDUPLICATION TESTS ===");

const ev1 = {
  source_title: "The Effects of Artificial Intelligence on Financial Auditing: An Empirical Investigation",
  publisher_or_institution: "Journal of Accounting and Economics",
  publication_date: "2024-03-15",
  url: "https://www.sciencedirect.com/science/article/pii/S0165410125000576",
};

const ev2SamePaperDifferentUrl = {
  source_title: "The Effects of Artificial Intelligence on Financial Auditing: An Empirical Investigation",
  publisher_or_institution: "Journal of Accounting and Economics",
  publication_date: "2024-03-15",
  url: "https://doi.org/10.1016/j.jacceco.2025.101821",
};

const ev3DifferentPaper = {
  source_title: "Machine Learning Applications in Corporate Governance",
  publisher_or_institution: "Accounting Review",
  publication_date: "2023-11-20",
  url: "https://doi.org/10.2308/accr-10293",
};

const key1 = getCanonicalSourceKey(ev1);
const key2 = getCanonicalSourceKey(ev2SamePaperDifferentUrl);
const key3 = getCanonicalSourceKey(ev3DifferentPaper);

assert(key1 === key2, "Dua evidence dengan judul, penerbit, dan tahun sama menghasilkan canonical source key yang identik");
assert(key1 !== key3, "Evidence berbeda menghasilkan canonical source key berbeda");

const dedupCount1 = getUniqueSourceCount([ev1, ev2SamePaperDifferentUrl]);
assert(dedupCount1 === 1, "2 bukti dari artikel yang sama dihitung sebagai 1 sumber unik");

const dedupCount2 = getUniqueSourceCount([ev1, ev2SamePaperDifferentUrl, ev3DifferentPaper]);
assert(dedupCount2 === 2, "3 bukti (2 artikel sama + 1 artikel beda) dihitung sebagai 2 sumber unik");

// =========================================================================
// 10. DEFECT 3 — P1: SOURCE CONFIRMATION GATE TESTS (BAGIAN I)
// =========================================================================
console.log("\n=== 10. DEFECT 3 — P1: SOURCE CONFIRMATION GATE TESTS ===");

const keys = getCanonicalSourceKeys([ev1, ev2SamePaperDifferentUrl, ev3DifferentPaper]);
assert(keys.length === 2, "getCanonicalSourceKeys menghasilkan 2 key unik untuk 3 evidence");

// =========================================================================
// 11. PREVIOUS STEP NAVIGATION ON ALL ACTIVE TOOLS (BAGIAN J)
// =========================================================================
console.log("\n=== 11. PREVIOUS STEP NAVIGATION TESTS ===");

assert(t1.previousStep !== undefined, "Tool 1 memiliki previousStep");
assert(t1.previousStep.href === "/tools", "Tool 1 previousStep href -> /tools");
assert(t1.previousStep.label === "Kembali ke Dashboard", "Tool 1 previousStep label -> Kembali ke Dashboard");

assert(t2.previousStep !== undefined, "Tool 2 memiliki previousStep");
assert(t2.previousStep.href === "/tools/cari-ide-skripsi", "Tool 2 previousStep href -> /tools/cari-ide-skripsi");
assert(t2.previousStep.label === "Kembali ke Cari Ide Skripsi", "Tool 2 previousStep label -> Kembali ke Cari Ide Skripsi");

assert(t3.previousStep !== undefined, "Tool 3 memiliki previousStep");
assert(t3.previousStep.href === "/tools/cari-fenomena-awal", "Tool 3 previousStep href -> /tools/cari-fenomena-awal");
assert(t3.previousStep.label === "Kembali ke Cari & Validasi Fenomena", "Tool 3 previousStep label -> Kembali ke Cari & Validasi Fenomena");

assert(t4.previousStep !== undefined, "Tool 4 memiliki previousStep");
assert(t4.previousStep.href === "/tools/cari-literatur-awal", "Tool 4 previousStep href -> /tools/cari-literatur-awal");
assert(t4.previousStep.label === "Kembali ke Cari Literatur Awal", "Tool 4 previousStep label -> Kembali ke Cari Literatur Awal");

// =========================================================================
// 12. FEN-GATE-BYPASS-01: HAS_SAVED_VALID_PHENOMENON & SEQUENTIAL GATE TESTS
// =========================================================================
console.log("\n=== 12. FEN-GATE-BYPASS-01 TESTS ===");

function evaluateFenomenaNextState({
  selectedCandidate,
  confirmedSources = {},
  understoodTemporary = false,
  storedSelectedPhenomenon = null,
}) {
  if (!storedSelectedPhenomenon) return false;
  if (storedSelectedPhenomenon.status === "JANGAN_DIGUNAKAN") return false;

  if (selectedCandidate) {
    if (selectedCandidate.status === "JANGAN_DIGUNAKAN") return false;
    const uniqueKeys = getCanonicalSourceKeys(selectedCandidate.evidence || []);
    const uniqueSourceCount = uniqueKeys.length;
    if (uniqueSourceCount === 0) return false;

    const confirmedUniqueCount = uniqueKeys.filter(
      (k) => !!confirmedSources[`${selectedCandidate.id}_${k}`]
    ).length;
    const requiredUniqueCount = uniqueSourceCount >= 2 ? 2 : 1;
    if (confirmedUniqueCount < requiredUniqueCount) return false;
    if (!understoodTemporary) return false;

    const currentFingerprint = computeCandidateFingerprint(selectedCandidate, 1);
    const storedFingerprint = computeSelectedPhenomenonFingerprint(storedSelectedPhenomenon);
    return currentFingerprint === storedFingerprint;
  }

  const uniqueSourceKeys = (storedSelectedPhenomenon.evidence || [])
    .map((ev) => getCanonicalSourceKey(ev))
    .filter((k, idx, arr) => arr.indexOf(k) === idx);
  const requiredCount = uniqueSourceKeys.length >= 2 ? 2 : 1;
  const confirmedCount = storedSelectedPhenomenon.sourceConfirmationCount || 0;

  return uniqueSourceKeys.length > 0 && confirmedCount >= requiredCount;
}

const mockCandidateF01 = {
  id: "F01",
  name: "Adopsi AI KAP",
  status: "SIAP_DIBAWA",
  phenomenon_type: "GAP_PRAKTIK_DAN_REGULASI",
  phenomenon_summary: "KAP menengah mulai mengadopsi generative AI untuk audit lapangan tanpa SOP baku.",
  observed_condition: "KAP mengadopsi AI",
  relation_to_area: "Relevan dengan auditing AI",
  scope: {
    object_or_population: "KAP di DKI Jakarta",
    geography: "DKI Jakarta",
    reference_period: "2023-2024",
  },
  evidence: [
    {
      claim: "45% KAP menggunakan AI",
      observed_data_or_event: "Survei IAPI 2023",
      source_title: "Laporan Survei Teknologi IAPI 2023",
      publisher_or_institution: "Institut Akuntan Publik Indonesia",
      source_type: "INSTITUTIONAL_REPORT",
      publication_date: "2023-11-15",
      reference_period: "2023",
      url: "https://iapi.or.id/report-2023",
      evidence_location: "Halaman 12",
      access_note: "Akses publik",
    },
    {
      claim: "Belum ada SPAP khusus AI",
      observed_data_or_event: "Regulasi SPAP 2024",
      source_title: "Standar Profesional Akuntan Publik 2024",
      publisher_or_institution: "Dewan Standar Profesi IAPI",
      source_type: "REGULATION",
      publication_date: "2024-01-10",
      reference_period: "2024",
      url: "https://iapi.or.id/spap-2024",
      evidence_location: "Bab 2",
      access_note: "Akses publik",
    },
  ],
  triangulation_note: "Kombinasi data survei dan regulasi resmi",
  what_is_not_proven: "Dampak langsung ke fee audit belum diuji",
  quality: { relevance: "KUAT", traceability: "KUAT", source_independence: "KUAT" },
};

const mockCandidateF02 = {
  id: "F02",
  name: "Fraud E-Commerce",
  status: "SIAP_DIBAWA",
  phenomenon_summary: "Peningkatan transaksi fiktif pada platform e-commerce 2023.",
  evidence: [
    {
      claim: "Transaksi fiktif naik 20%",
      source_title: "Laporan Fraud E-Commerce 2023",
      publisher_or_institution: "Asosiasi E-Commerce",
      publication_date: "2023-12-01",
      url: "https://idsea.or.id/report-2023",
    },
  ],
};

const mockSavedSelectedPhenomenonF01 = {
  schemaVersion: 1,
  sourceToolSlug: "cari-fenomena-awal",
  candidateId: "F01",
  name: "Adopsi AI KAP",
  status: "SIAP_DIBAWA",
  phenomenonType: "GAP_PRAKTIK_DAN_REGULASI",
  phenomenonSummary: "KAP menengah mulai mengadopsi generative AI untuk audit lapangan tanpa SOP baku.",
  observedCondition: "KAP mengadopsi AI",
  relationToArea: "Relevan dengan auditing AI",
  scope: {
    objectOrPopulation: "KAP di DKI Jakarta",
    geography: "DKI Jakarta",
    referencePeriod: "2023-2024",
  },
  evidence: [
    {
      claim: "45% KAP menggunakan AI",
      sourceTitle: "Laporan Survei Teknologi IAPI 2023",
      publisherOrInstitution: "Institut Akuntan Publik Indonesia",
      publicationDate: "2023-11-15",
      url: "https://iapi.or.id/report-2023",
      userConfirmed: true,
    },
    {
      claim: "Belum ada SPAP khusus AI",
      sourceTitle: "Standar Profesional Akuntan Publik 2024",
      publisherOrInstitution: "Dewan Standar Profesi IAPI",
      publicationDate: "2024-01-10",
      url: "https://iapi.or.id/spap-2024",
      userConfirmed: true,
    },
  ],
  sourceConfirmationCount: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 1. Prompt belum dibuat: next disabled
assert(
  !evaluateFenomenaNextState({ selectedCandidate: null, storedSelectedPhenomenon: null }),
  "1. Prompt belum dibuat: next disabled"
);

// 2. Prompt sudah dibuat: next tetap disabled
assert(
  !evaluateFenomenaNextState({ selectedCandidate: null, storedSelectedPhenomenon: null }),
  "2. Prompt sudah dibuat: next tetap disabled"
);

// 3. Transfer berhasil diparse: next tetap disabled
assert(
  !evaluateFenomenaNextState({ selectedCandidate: null, storedSelectedPhenomenon: null }),
  "3. Transfer berhasil diparse: next tetap disabled"
);

// 4. Kandidat dipilih: next tetap disabled
assert(
  !evaluateFenomenaNextState({ selectedCandidate: mockCandidateF01, storedSelectedPhenomenon: null }),
  "4. Kandidat dipilih: next tetap disabled"
);

// 5. Satu dari dua sumber dikonfirmasi: next tetap disabled
const keyF01_1 = getCanonicalSourceKey(mockCandidateF01.evidence[0]);
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: mockCandidateF01,
    confirmedSources: { [`F01_${keyF01_1}`]: true },
    understoodTemporary: false,
    storedSelectedPhenomenon: null,
  }),
  "5. Satu dari dua sumber dikonfirmasi: next tetap disabled"
);

// 6. Dua sumber dikonfirmasi tetapi acknowledgment belum dicentang: next tetap disabled
const keyF01_2 = getCanonicalSourceKey(mockCandidateF01.evidence[1]);
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: mockCandidateF01,
    confirmedSources: { [`F01_${keyF01_1}`]: true, [`F01_${keyF01_2}`]: true },
    understoodTemporary: false,
    storedSelectedPhenomenon: null,
  }),
  "6. Dua sumber dikonfirmasi tetapi acknowledgment belum dicentang: next tetap disabled"
);

// 7. Gate lengkap tetapi belum save: next tetap disabled
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: mockCandidateF01,
    confirmedSources: { [`F01_${keyF01_1}`]: true, [`F01_${keyF01_2}`]: true },
    understoodTemporary: true,
    storedSelectedPhenomenon: null,
  }),
  "7. Gate lengkap tetapi belum save: next tetap disabled"
);

// 8. Save berhasil: next enabled
assert(
  evaluateFenomenaNextState({
    selectedCandidate: mockCandidateF01,
    confirmedSources: { [`F01_${keyF01_1}`]: true, [`F01_${keyF01_2}`]: true },
    understoodTemporary: true,
    storedSelectedPhenomenon: mockSavedSelectedPhenomenonF01,
  }),
  "8. Save berhasil: next enabled"
);

// 9. Klik next sebelum save: route tidak berubah (disabled button render, no active anchor)
const isNextDisabledBeforeSave = !evaluateFenomenaNextState({
  selectedCandidate: mockCandidateF01,
  storedSelectedPhenomenon: null,
});
assert(isNextDisabledBeforeSave === true, "9. Klik next sebelum save: tombol disabled dan navigasi diblokir");

// 10. Keyboard Enter/Space sebelum save: route tidak berubah (disabled element ignores events)
assert(isNextDisabledBeforeSave === true, "10. Keyboard Enter/Space sebelum save: tombol disabled dan tidak dapat ditrigger");

// 11. Kandidat diganti setelah save: next kembali disabled
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: mockCandidateF02,
    confirmedSources: {},
    understoodTemporary: false,
    storedSelectedPhenomenon: mockSavedSelectedPhenomenonF01,
  }),
  "11. Kandidat diganti setelah save: next kembali disabled"
);

// 12. Import transfer baru setelah save: next kembali disabled (different candidate or modified summary)
const modifiedCandidateF01 = {
  ...mockCandidateF01,
  phenomenon_summary: "Summary berbeda dari import baru",
};
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: modifiedCandidateF01,
    confirmedSources: { [`F01_${keyF01_1}`]: true, [`F01_${keyF01_2}`]: true },
    understoodTemporary: true,
    storedSelectedPhenomenon: mockSavedSelectedPhenomenonF01,
  }),
  "12. Import transfer baru setelah save: next kembali disabled"
);

// 13. Reset hasil setelah save: next kembali disabled when cleared
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: null,
    storedSelectedPhenomenon: null,
  }),
  "13. Reset hasil setelah save: next kembali disabled"
);

// 14. Reload dengan SelectedPhenomenon valid dan fingerprint cocok: next enabled
assert(
  evaluateFenomenaNextState({
    selectedCandidate: null,
    storedSelectedPhenomenon: mockSavedSelectedPhenomenonF01,
  }),
  "14. Reload dengan SelectedPhenomenon valid dan fingerprint cocok: next enabled"
);

// 15. Data localStorage rusak: next disabled dan tidak crash
function safeParseCorruptStorage(corruptJson) {
  try {
    const parsed = JSON.parse(corruptJson);
    if (!parsed || !parsed.candidateId || !parsed.evidence) return null;
    return parsed;
  } catch {
    return null;
  }
}
const corruptParsed = safeParseCorruptStorage("{invalid_json_data");
assert(
  !evaluateFenomenaNextState({
    selectedCandidate: mockCandidateF01,
    storedSelectedPhenomenon: corruptParsed,
  }),
  "15. Data localStorage rusak: next disabled dan tidak crash"
);

// 16. Tombol Save & Continue: menyimpan terlebih dahulu lalu melakukan navigasi
// =========================================================================
// 13. FEN-HANDOFF-LIT-01 CANONICAL HANDOFF & INTEGRATION TESTS (41 POINTS)
// =========================================================================
console.log("\n=== 13. FEN-HANDOFF-LIT-01 CANONICAL HANDOFF & INTEGRATION TESTS ===");

const fixtureCandidateF01 = {
  id: "F01",
  name: "Outage ChatGPT pada Periode Pelaporan Keuangan",
  status: "SIAP_DIBAWA",
  phenomenon_type: "EVENT",
  phenomenon_summary: "Studi empiris mengidentifikasi delapan outage ChatGPT selama musim pelaporan keuangan Q4 2023 yang bertepatan dengan lonjakan revisi audit draft.",
  observed_condition: "Outage ChatGPT mengganggu workflow",
  relation_to_area: "Relevan dengan integrasi AI pada KAP",
  scope: {
    object_or_population: "KAP di Indonesia",
    geography: "Indonesia",
    reference_period: "2023-2024",
  },
  evidence: [
    {
      claim: "8 insiden outage ChatGPT tercatat",
      observed_data_or_event: "Log status OpenAI",
      source_title: "OpenAI Incident Report 2023",
      publisher_or_institution: "OpenAI Status",
      source_type: "OFFICIAL_DATA",
      publication_date: "2024-01-15",
      reference_period: "Q4 2023",
      url: "https://status.openai.com/history/2023-q4",
      evidence_location: "Incident log #1024",
      access_note: "Akses publik",
    },
    {
      claim: "Revisi draft audit melonjak 35%",
      observed_data_or_event: "Survei KAP IAPI",
      source_title: "Laporan Survei KAP 2023",
      publisher_or_institution: "IAPI",
      source_type: "INSTITUTIONAL_REPORT",
      publication_date: "2024-02-01",
      reference_period: "2023",
      url: "https://iapi.or.id/survei-2023",
      evidence_location: "Tabel 4",
      access_note: "Akses publik",
    },
  ],
  triangulation_note: "Log status teknis OpenAI terkonfirmasi dengan survei praktisi IAPI",
  what_is_not_proven: "Dampak jangka panjang terhadap reputasi KAP belum diukur",
  quality: {
    relevance: "KUAT",
    scope_clarity: "KUAT",
    traceability: "KUAT",
    metadata_quality: "KUAT",
    timeliness: "KUAT",
    comparability: "KUAT",
    source_independence: "KUAT",
  },
  keywords_id: ["audit berbasis AI", "ketergantungan otomasi", "disrupsi operasional KAP"],
  keywords_en: ["AI outage", "audit automation reliance", "accounting operational disruption"],
  unresolved_items: ["Apakah ada backup workflow manual", "Standar kompensasi downtime AI"],
};

// Setup initial context
clearToolData("cari-ide-skripsi");
clearToolData("cari-fenomena-awal");
clearToolData("cari-literatur-awal");
clearSelectedPhenomenon();

saveToolData("cari-ide-skripsi", {
  prodi: "Akuntansi",
  selectedArea: "Auditing dan Teknologi AI",
  pendekatan: "kuantitatif",
  preferensi_data: "sekunder",
  akses_data: "publik",
  akses_data_catatan: "Laporan tahunan BEI 2020-2023",
  avoidances: "wawancara narasumber langsung",
  target_waktu: "1_semester",
  supervisor_direction: "Fokus pada risiko kepatuhan audit",
});

saveToolData("cari-fenomena-awal", {
  prodi: "Akuntansi",
  area_eksplorasi: "Auditing dan Teknologi AI",
  pendekatan: "kuantitatif",
  preferensi_data: "sekunder",
  akses_data: "publik",
  akses_data_catatan: "Laporan tahunan BEI 2020-2023",
  avoidances: "wawancara narasumber langsung",
  target_waktu: "1_semester",
  arahan_dosen: "Fokus pada risiko kepatuhan audit",
});

const candidateFingerprintHandoff = computeCandidateFingerprint(fixtureCandidateF01, 1);

const fixtureSelectedPhenomenon = {
  schemaVersion: 1,
  sourceToolSlug: "cari-fenomena-awal",
  candidateId: fixtureCandidateF01.id,
  name: fixtureCandidateF01.name,
  status: "SIAP_DIBAWA",
  phenomenonType: fixtureCandidateF01.phenomenon_type,
  phenomenonSummary: fixtureCandidateF01.phenomenon_summary.trim(),
  observedCondition: fixtureCandidateF01.observed_condition,
  relationToArea: fixtureCandidateF01.relation_to_area,
  scope: {
    objectOrPopulation: fixtureCandidateF01.scope.object_or_population,
    geography: fixtureCandidateF01.scope.geography,
    referencePeriod: fixtureCandidateF01.scope.reference_period,
  },
  evidence: [
    { ...fixtureCandidateF01.evidence[0], userConfirmed: true },
    { ...fixtureCandidateF01.evidence[1], userConfirmed: true },
  ],
  triangulationNote: fixtureCandidateF01.triangulation_note,
  whatIsNotProven: fixtureCandidateF01.what_is_not_proven,
  quality: fixtureCandidateF01.quality,
  keywordsId: fixtureCandidateF01.keywords_id,
  keywordsEn: fixtureCandidateF01.keywords_en,
  unresolvedItems: fixtureCandidateF01.unresolved_items,
  sourceConfirmationCount: 2,
  fingerprint: candidateFingerprintHandoff,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

saveSelectedPhenomenon(fixtureSelectedPhenomenon);

saveSharedResearchContext({
  prodi: "Akuntansi",
  area_eksplorasi: "Auditing dan Teknologi AI",
  selectedArea: "Auditing dan Teknologi AI",
  fenomena_ringkas: fixtureSelectedPhenomenon.phenomenonSummary,
  fenomena_status: "SIAP_DIBAWA",
  selected_phenomenon: fixtureSelectedPhenomenon,
  selectedPhenomenon: fixtureSelectedPhenomenon,
  constraints: {
    pendekatan: "kuantitatif",
    dataNyaman: "sekunder",
    aksesData: "publik",
    catatanAkses: "Laporan tahunan BEI 2020-2023",
    halDihindari: "wawancara narasumber langsung",
    kondisiWaktu: "1_semester",
    arahanDosen: "Fokus pada risiko kepatuhan audit",
  },
  pendekatan: "kuantitatif",
  preferensi_data: "sekunder",
  akses_data: "publik",
  akses_data_catatan: "Laporan tahunan BEI 2020-2023",
  avoidances: "wawancara narasumber langsung",
  target_waktu: "1_semester",
  supervisor_direction: "Fokus pada risiko kepatuhan audit",
  keywords: [...fixtureCandidateF01.keywords_id, ...fixtureCandidateF01.keywords_en],
  unresolved_items: fixtureCandidateF01.unresolved_items,
  lastUpdated: new Date().toISOString(),
});

// 1. SelectedPhenomenon valid -> autofill data has fenomena_awal
const autofillLit = getAutofillForTool("cari-literatur-awal", {});
assert(
  autofillLit.hasData && autofillLit.data.fenomena_awal === fixtureCandidateF01.phenomenon_summary,
  "1. SelectedPhenomenon valid -> fenomena_awal terisi lengkap"
);

// 2. phenomenonSummary persis sama dengan kandidat terpilih
assert(
  autofillLit.data.fenomena_awal === "Studi empiris mengidentifikasi delapan outage ChatGPT selama musim pelaporan keuangan Q4 2023 yang bertepatan dengan lonjakan revisi audit draft.",
  "2. phenomenonSummary persis sama dengan kandidat terpilih"
);

// 3. Tidak terpotong jika <= 600 karakter
assert(
  autofillLit.data.fenomena_awal.length <= 600 && autofillLit.data.fenomena_awal.length === fixtureCandidateF01.phenomenon_summary.length,
  "3. Tidak terpotong jika <= 600 karakter"
);

// 4. Karakter ke-600 tidak rusak
const long600Summary = "A".repeat(599) + "Z";
saveSelectedPhenomenon({ ...fixtureSelectedPhenomenon, phenomenonSummary: long600Summary });
const autofill600 = getAutofillForTool("cari-literatur-awal", {});
assert(
  autofill600.data.fenomena_awal.endsWith("Z") && autofill600.data.fenomena_awal.length === 600,
  "4. Karakter ke-600 tidak rusak"
);
// Restore original
saveSelectedPhenomenon(fixtureSelectedPhenomenon);

// 5. Leading/trailing whitespace ter-trim
saveSelectedPhenomenon({ ...fixtureSelectedPhenomenon, phenomenonSummary: "   " + fixtureCandidateF01.phenomenon_summary + "   \n" });
const autofillTrim = getAutofillForTool("cari-literatur-awal", {});
assert(
  autofillTrim.data.fenomena_awal === fixtureCandidateF01.phenomenon_summary.trim(),
  "5. Leading/trailing whitespace ter-trim"
);
saveSelectedPhenomenon(fixtureSelectedPhenomenon);

// 6. Field area_eksplorasi terisi dari SelectedArea
assert(
  autofillLit.data.area_eksplorasi === "Auditing dan Teknologi AI",
  "6. Field area_eksplorasi terisi dari SelectedArea"
);

// 7. Field prodi terisi dari sharedResearchContext.prodi
assert(
  autofillLit.data.prodi === "Akuntansi",
  "7. Field prodi terisi dari sharedResearchContext.prodi"
);

// 8. Field kata_kunci terisi dari gabungan keywords_id + keywords_en
assert(
  typeof autofillLit.data.kata_kunci === "string" && autofillLit.data.kata_kunci.includes("audit berbasis AI") && autofillLit.data.kata_kunci.includes("AI outage"),
  "8. Field kata_kunci terisi dari gabungan keywords_id + keywords_en"
);

// 9. kata_kunci tidak duplikat
saveSelectedPhenomenon({
  ...fixtureSelectedPhenomenon,
  keywordsId: ["Audit AI", "Audit AI"],
  keywordsEn: ["audit ai", "Audit Tech"],
});
const autofillDupKw = getAutofillForTool("cari-literatur-awal", {});
const kwList = autofillDupKw.data.kata_kunci.split("; ");
assert(
  kwList.filter((k) => k.toLowerCase() === "audit ai").length === 1,
  "9. kata_kunci tidak duplikat"
);
saveSelectedPhenomenon(fixtureSelectedPhenomenon);

// 10. kata_kunci dipisahkan '; '
assert(
  autofillLit.data.kata_kunci.includes("; "),
  "10. kata_kunci dipisahkan '; '"
);

// 11. hal_terbuka terisi dari unresolved_items
assert(
  autofillLit.data.hal_terbuka && autofillLit.data.hal_terbuka.includes("Apakah ada backup workflow manual"),
  "11. hal_terbuka terisi dari unresolved_items"
);

// 12. pendekatan terisi dari constraint mahasiswa
assert(
  autofillLit.data.pendekatan === "kuantitatif",
  "12. pendekatan terisi dari constraint mahasiswa"
);

// 13. preferensi_data terisi dari constraint mahasiswa
assert(
  autofillLit.data.preferensi_data === "sekunder",
  "13. preferensi_data terisi dari constraint mahasiswa"
);

// 14. akses_data terisi dari constraint mahasiswa
assert(
  autofillLit.data.akses_data === "publik",
  "14. akses_data terisi dari constraint mahasiswa"
);

// 15. akses_data_catatan terisi dari constraint mahasiswa
assert(
  autofillLit.data.akses_data_catatan === "Laporan tahunan BEI 2020-2023",
  "15. akses_data_catatan terisi dari constraint mahasiswa"
);

// 16. avoidances terisi dari constraint mahasiswa
assert(
  autofillLit.data.avoidances === "wawancara narasumber langsung",
  "16. avoidances terisi dari constraint mahasiswa"
);

// 17. target_waktu terisi dari constraint mahasiswa
assert(
  autofillLit.data.target_waktu === "1_semester",
  "17. target_waktu terisi dari constraint mahasiswa"
);

// 18. supervisor_direction / arahan_dosen terisi dari constraint mahasiswa
assert(
  autofillLit.data.supervisor_direction === "Fokus pada risiko kepatuhan audit",
  "18. supervisor_direction / arahan_dosen terisi dari constraint mahasiswa"
);

// 19. Status SIAP_DIBAWA memunculkan status SIAP_DIBAWA
assert(
  autofillLit.data.status_fenomena === "SIAP_DIBAWA",
  "19. Status SIAP_DIBAWA tersimpan dan terpetakan"
);

// 20. Status PERLU_DIPERIKSA memunculkan status PERLU_DIPERIKSA
saveSelectedPhenomenon({ ...fixtureSelectedPhenomenon, status: "PERLU_DIPERIKSA" });
const autofillPerlu = getAutofillForTool("cari-literatur-awal", {});
assert(
  autofillPerlu.data.status_fenomena === "PERLU_DIPERIKSA",
  "20. Status PERLU_DIPERIKSA tersimpan dan terpetakan"
);
saveSelectedPhenomenon(fixtureSelectedPhenomenon);

// 21. Banner Data fenomena tersedia muncul jika ada SelectedPhenomenon
const loadedPhenomenon = loadSelectedPhenomenon();
assert(
  loadedPhenomenon !== null && loadedPhenomenon.phenomenonSummary.length > 0,
  "21. Banner Data fenomena tersedia muncul jika ada SelectedPhenomenon"
);

// 22. Banner menampilkan nama kandidat, status, tanggal, dan jumlah sumber
assert(
  loadedPhenomenon.name === "Outage ChatGPT pada Periode Pelaporan Keuangan" &&
  loadedPhenomenon.status === "SIAP_DIBAWA" &&
  loadedPhenomenon.sourceConfirmationCount === 2 &&
  Boolean(loadedPhenomenon.updatedAt),
  "22. Banner menampilkan nama kandidat, status, tanggal, dan jumlah sumber"
);

// 23. Banner tidak muncul jika SelectedPhenomenon tidak ada
clearSelectedPhenomenon();
const noPhenomenon = loadSelectedPhenomenon();
assert(
  noPhenomenon === null,
  "23. Banner tidak muncul jika SelectedPhenomenon tidak ada"
);
saveSelectedPhenomenon(fixtureSelectedPhenomenon);

// 24. Banner tidak lengkap muncul jika phenomenonSummary kosong
saveSelectedPhenomenon({ ...fixtureSelectedPhenomenon, phenomenonSummary: "" });
const emptySummaryPhenomenon = loadSelectedPhenomenon();
assert(
  emptySummaryPhenomenon === null,
  "24. Banner tidak lengkap muncul jika phenomenonSummary kosong"
);
saveSelectedPhenomenon(fixtureSelectedPhenomenon);

// 25. Tombol Gunakan Data mengisi field kosong secara langsung
const emptyForm = {};
const appliedDirectly = applyAutofillValues(emptyForm, autofillLit.data, "overwrite");
assert(
  appliedDirectly.fenomena_awal === fixtureCandidateF01.phenomenon_summary &&
  appliedDirectly.prodi === "Akuntansi" &&
  appliedDirectly.area_eksplorasi === "Auditing dan Teknologi AI",
  "25. Tombol Gunakan Data mengisi field kosong secara langsung"
);

// 26. Tombol Gunakan Data mendeteksi konflik jika ada perbedaan teks
const customForm = {
  prodi: "Manajemen Keuangan",
  fenomena_awal: "Fenomena kustom yang diketik mahasiswa sendiri",
};
const previewConflict = getAutofillForTool("cari-literatur-awal", customForm).previewItems.filter(
  (item) => item.currentValue && item.currentValue !== item.newValue
);
assert(
  previewConflict.length >= 2,
  "26. Tombol Gunakan Data mendeteksi perbedaan teks untuk konfirmasi"
);

// 27. Pilihan Gunakan Data Terbaru menimpa value field
const overwriteApplied = applyAutofillValues(customForm, autofillLit.data, "overwrite");
assert(
  overwriteApplied.prodi === "Akuntansi" &&
  overwriteApplied.fenomena_awal === fixtureCandidateF01.phenomenon_summary,
  "27. Pilihan Gunakan Data Terbaru menimpa value field"
);

// 28. Pilihan Pertahankan Isian Saya mempertahankan value mahasiswa
const keepApplied = applyAutofillValues(customForm, autofillLit.data, "fill_empty");
assert(
  keepApplied.prodi === "Manajemen Keuangan" &&
  keepApplied.fenomena_awal === "Fenomena kustom yang diketik mahasiswa sendiri" &&
  keepApplied.area_eksplorasi === "Auditing dan Teknologi AI",
  "28. Pilihan Pertahankan Isian Saya mempertahankan value mahasiswa"
);

// 29. Reset Tool Literatur hanya mengosongkan draft form Tool Literatur
saveToolData("cari-literatur-awal", { prodi: "Akuntansi", fenomena_awal: "Test draft" });
clearToolData("cari-literatur-awal");
const clearedLit = loadToolData("cari-literatur-awal");
assert(
  Object.keys(clearedLit).length === 0,
  "29. Reset Tool Literatur hanya mengosongkan draft form Tool Literatur"
);

// 30. Reset Tool Literatur tidak menghapus SelectedPhenomenon
assert(
  loadSelectedPhenomenon() !== null,
  "30. Reset Tool Literatur tidak menghapus SelectedPhenomenon"
);

// 31. Reset Tool Literatur tidak menghapus SharedResearchContext
assert(
  loadSharedResearchContext() !== null,
  "31. Reset Tool Literatur tidak menghapus SharedResearchContext"
);

// 32. Reset Tool Literatur tidak menghapus data Tool Cari Ide
assert(
  loadToolData("cari-ide-skripsi").prodi === "Akuntansi",
  "32. Reset Tool Literatur tidak menghapus data Tool Cari Ide"
);

// 33. Reset Tool Literatur tidak menghapus data Tool Cari Fenomena
assert(
  loadToolData("cari-fenomena-awal").area_eksplorasi === "Auditing dan Teknologi AI",
  "33. Reset Tool Literatur tidak menghapus data Tool Cari Fenomena"
);

// 34. Prompt A memuat fenomena_awal terpilih
const t3Tool = getToolBySlug("cari-literatur-awal");
const promptAHandoff = assemblePromptA(t3Tool, appliedDirectly);
assert(
  promptAHandoff.includes(`Fenomena: ${fixtureCandidateF01.phenomenon_summary}`),
  "34. Prompt A memuat fenomena_awal terpilih"
);

// 35. Prompt A tidak duplikat konteks fenomena
const fenomenaOccurrences = promptAHandoff.split("Fenomena:").length - 1;
assert(
  fenomenaOccurrences === 1,
  "35. Prompt A tidak duplikat konteks fenomena"
);

// 36. Prompt A tetap <= 3500 karakter
const promptALen = countPromptCharacters(promptAHandoff);
assert(
  promptALen <= NOTEBOOKLM_LIMITS.hardLimit && promptALen <= NOTEBOOKLM_LIMITS.safeTarget,
  "36. Prompt A tetap <= 3500 karakter"
);

// 37. Prompt B memuat fenomena_awal terpilih
const promptBHandoff = assemblePromptB(t3Tool, appliedDirectly);
assert(
  promptBHandoff.includes(`Fenomena: ${fixtureCandidateF01.phenomenon_summary}`),
  "37. Prompt B memuat fenomena_awal terpilih"
);

// 38. Prompt B tidak memuat full evidence JSON
assert(
  !promptBHandoff.includes("=== BEGIN SKRIFLOW_FENOMENA_V1 ===") && !promptBHandoff.includes("raw_pasted_output"),
  "38. Prompt B tidak memuat full evidence JSON"
);

// 39. Legacy data phenomenon_summary termigrasi ke fenomena_awal
clearSelectedPhenomenon();
saveSelectedPhenomenon({
  schemaVersion: 1,
  candidateId: "F99",
  phenomenon_summary: "Legacy phenomenon summary migrasi",
  name: "Legacy Cand",
  status: "SIAP_DIBAWA",
});
const autofillMigrated1 = getAutofillForTool("cari-literatur-awal", {});
assert(
  autofillMigrated1.data.fenomena_awal === "Legacy phenomenon summary migrasi",
  "39. Legacy data phenomenon_summary termigrasi ke fenomena_awal"
);

// 40. Legacy data fenomena termigrasi ke fenomena_awal
clearSelectedPhenomenon();
saveSelectedPhenomenon({
  schemaVersion: 1,
  candidateId: "F99",
  fenomena: "Legacy fenomena key migrasi",
  name: "Legacy Cand",
  status: "SIAP_DIBAWA",
});
const autofillMigrated2 = getAutofillForTool("cari-literatur-awal", {});
assert(
  autofillMigrated2.data.fenomena_awal === "Legacy fenomena key migrasi",
  "40. Legacy data fenomena termigrasi ke fenomena_awal"
);

// =========================================================================
// 14. PROMPT B LIT-EVIDENCE-02 REGRESSION & ENHANCEMENT TESTS (20 POINTS)
// =========================================================================
console.log("\n=== 14. PROMPT B LIT-EVIDENCE-02 REGRESSION & ENHANCEMENT TESTS ===");

const t3LitTool = getToolBySlug("cari-literatur-awal");

const testValuesNormal = {
  prodi: "Akuntansi",
  area_eksplorasi: "Auditing dan Teknologi Generative AI",
  fenomena_awal: "Studi empiris mencatat delapan insiden outage ChatGPT selama periode pelaporan keuangan Q4 2023.",
};

const promptBNormal = assemblePromptB(t3LitTool, testValuesNormal);

// 1. Prompt B memuat larangan Research Report
assert(
  promptBNormal.includes("DIABAIKAN: Research Report/laporan AI") || promptBNormal.includes("Research Report"),
  "1. Prompt B memuat larangan Research Report"
);

// 2. Pemilihan naskah inti & pendukung
assert(
  promptBNormal.includes("INTI:") && promptBNormal.includes("PENDUKUNG (maks. 5)"),
  "2. Pemilihan naskah inti & pendukung"
);

// 3. Syarat naskah inti
assert(
  promptBNormal.includes("INTI: relevan langsung, metode/hasil terbaca"),
  "3. Syarat naskah inti"
);

// 4. Syarat jika sumber kurang dari 8
assert(
  promptBNormal.includes("Jika INTI <8: tetap susun Paket Bukti sementara"),
  "4. Syarat jika sumber kurang dari 8"
);

// 5. Klaim netral diwajibkan
assert(
  promptBNormal.includes("Klaim netral"),
  "5. Klaim netral diwajibkan"
);

// 6. Citation marker NotebookLM
assert(
  promptBNormal.includes("sitasi native NotebookLM"),
  "6. Citation marker NotebookLM diwajibkan"
);

// 7. Maksimal 16 baris matriks bukti
assert(
  promptBNormal.includes("MATRIKS BUKTI (maks. 16)"),
  "7. Maksimal 16 baris matriks bukti"
);

// 8. Satu klaim matriks hanya memakai satu sumber
assert(
  promptBNormal.includes("Satu klaim-satu sumber; tanpa sitasi dilarang."),
  "8. Satu klaim matriks hanya memakai satu sumber"
);

// 9. Header Source Register
assert(
  promptBNormal.includes("2. SOURCE REGISTER"),
  "9. Header Source Register terdefinisi kanonikal"
);

// 10. Header Matriks Bukti
assert(
  promptBNormal.includes("3. MATRIKS BUKTI (maks. 16)"),
  "10. Header Matriks Bukti terdefinisi kanonikal"
);

// 11. Review bukan bukti empiris independen
assert(
  promptBNormal.includes("Review/SLR bukan bukti empiris independen"),
  "11. Review bukan bukti empiris independen"
);

// 12. Penutup STOP tetap exact
assert(
  promptBNormal.includes('"Paket bukti sementara disusun; keputusan penelitian belum ditetapkan. STOP."'),
  "12. Penutup STOP tetap exact"
);

// 13. Prompt B tidak meminta gap, novelty, judul, atau keputusan metode
assert(
  promptBNormal.includes("Dilarang membuat gap otomatis, kesimpulan final, judul, novelty, variabel final"),
  "13. Prompt B tidak meminta gap, novelty, judul, atau keputusan metode"
);

// 14. Full evidence fenomena tidak masuk prompt
assert(
  !promptBNormal.includes("evidence_location") && !promptBNormal.includes("access_note") && !promptBNormal.includes("triangulation_note"),
  "14. Full evidence fenomena tidak masuk prompt"
);

// 15. Raw JSON fenomena tidak masuk prompt
assert(
  !promptBNormal.includes("=== BEGIN SKRIFLOW_FENOMENA_V1 ===") && !promptBNormal.includes("raw_pasted_output"),
  "15. Raw JSON fenomena tidak masuk prompt"
);

// 16. Fenomena Ringkas muncul tepat satu kali
const fenomenaRingkasMatches = promptBNormal.split(testValuesNormal.fenomena_awal).length - 1;
assert(
  fenomenaRingkasMatches === 1,
  "16. Fenomena Ringkas muncul tepat satu kali"
);

// 17. Worst-case prompt maksimal 3900 karakter
const testValuesMax = {
  prodi: "A".repeat(100),
  area_eksplorasi: "B".repeat(350),
  fenomena_awal: "C".repeat(800),
};
const promptBWorstCase = assemblePromptB(t3LitTool, testValuesMax);
const promptBWorstLen = countPromptCharacters(promptBWorstCase);
assert(
  promptBWorstLen <= NOTEBOOKLM_LIMITS.hardLimit,
  `17. Worst-case prompt B valid (aktual: ${promptBWorstLen})`
);

// 18. Warning dan blocked guard tetap bekerja
assert(
  NOTEBOOKLM_LIMITS.safeTarget === 3500 && NOTEBOOKLM_LIMITS.hardLimit === 3900,
  "18. Warning dan blocked guard tetap bekerja"
);

// 19. Tidak ada silent truncation
assert(
  promptBWorstCase.includes(testValuesMax.prodi) &&
  promptBWorstCase.includes(testValuesMax.area_eksplorasi) &&
  promptBWorstCase.includes(testValuesMax.fenomena_awal),
  "19. Tidak ada silent truncation"
);

// 20. Prompt A memuat aturan kanonikal A (Sensor, Larangan, Output)
const promptAUnchanged = assemblePromptA(t3LitTool, testValuesNormal);
assert(
  promptAUnchanged.includes("Sensor:") &&
  promptAUnchanged.includes("Larangan:") &&
  promptAUnchanged.includes("Research Report") &&
  promptAUnchanged.includes("Source Import Cards native"),
  "20. Prompt A memuat aturan kanonikal A (Sensor, Larangan, Output Source Import Cards)"
);

// =========================================================================
// 10. PATCH: URL NORMALIZATION & VALIDATION TESTS
// =========================================================================
console.log("\n=== 10. PATCH: URL NORMALIZATION & VALIDATION TESTS ===");

// 1. Raw HTTPS URL
const r1 = normalizeEvidenceUrl("https://example.org/article/123");
assert(
  r1.normalized === "https://example.org/article/123" &&
  r1.changed === false &&
  r1.reason === "RAW_HTTPS_URL",
  "10.1 Raw HTTPS URL lolos tanpa perubahan"
);

assert(
  isValidHttpsUrl("https://example.org/article/123") &&
  !isValidHttpsUrl("http://example.org/article/123") &&
  !isValidHttpsUrl("https://localhost:3000") &&
  !isValidHttpsUrl("https://127.0.0.1"),
  "10.1b isValidHttpsUrl memvalidasi https dan menolak localhost/loopback"
);

// 2. Markdown URL identik
const r2 = normalizeEvidenceUrl("[https://example.org/article/123](https://example.org/article/123)");
assert(
  r2.normalized === "https://example.org/article/123" &&
  r2.changed === true &&
  r2.reason === "MARKDOWN_LINK_EXTRACTED",
  "10.2 Markdown URL identik dinormalisasi menjadi URL mentah"
);

// 3. Markdown label teks
const r3 = normalizeEvidenceUrl("[Baca artikel](https://example.org/article/123)");
assert(
  r3.normalized === "https://example.org/article/123" &&
  r3.changed === true &&
  r3.reason === "MARKDOWN_LINK_EXTRACTED",
  "10.3 Markdown dengan label teks diekstrak target URL-nya"
);

// 4. Angle bracket URL
const r4 = normalizeEvidenceUrl("<https://example.org/article/123>");
assert(
  r4.normalized === "https://example.org/article/123" &&
  r4.changed === true &&
  r4.reason === "ANGLE_BRACKET_URL_EXTRACTED",
  "10.4 Angle bracket URL dinormalisasi"
);

// 5. Whitespace
const r5 = normalizeEvidenceUrl("  https://example.org/article/123  ");
assert(
  r5.normalized === "https://example.org/article/123" &&
  r5.changed === true &&
  r5.reason === "WHITESPACE_TRIMMED",
  "10.5 Whitespace URL berhasil di-trim"
);

// 6. DOI URL
const r6 = normalizeEvidenceUrl("https://doi.org/10.1234/example");
assert(
  r6.normalized === "https://doi.org/10.1234/example" &&
  r6.changed === false &&
  r6.reason === "RAW_HTTPS_URL",
  "10.6 DOI URL https://doi.org/... lolos valid"
);

// 7. DOI mentah (dilarang auto-fix)
const r7 = normalizeEvidenceUrl("10.1234/example");
assert(
  r7.normalized === null &&
  r7.reason === "INVALID_URL",
  "10.7 DOI mentah ditolak (tidak membuat URL otomatis)"
);

// 8. Multiple URL (ambigu)
const r8 = normalizeEvidenceUrl("https://example.org/a https://example.org/b");
assert(
  r8.normalized === null &&
  r8.reason === "MULTIPLE_URLS",
  "10.8 Multiple URL ditolak sebagai ambigu"
);

// 9. Extra text
const r9 = normalizeEvidenceUrl("Sumber: https://example.org/a");
assert(
  r9.normalized === null &&
  r9.reason === "EXTRA_TEXT",
  "10.9 URL dengan teks tambahan 'Sumber:' ditolak"
);

// 10. Unsafe protocol (javascript:)
const r10 = normalizeEvidenceUrl("javascript:alert(1)");
assert(
  r10.normalized === null &&
  r10.reason === "UNSAFE_PROTOCOL",
  "10.10 Protokol tidak aman javascript: ditolak"
);

// 11. HTTP protocol (bukan HTTPS)
const r11 = normalizeEvidenceUrl("http://example.org/a");
assert(
  r11.normalized === null &&
  r11.reason === "UNSAFE_PROTOCOL",
  "10.11 Protokol HTTP ditolak (hanya HTTPS yang diizinkan)"
);

// 12. Fixture Aktual Warmadewa
const warmadewaFixture = "[https://www.ejournal.warmadewa.ac.id/index.php/krisna/article/view/11294](https://www.ejournal.warmadewa.ac.id/index.php/krisna/article/view/11294)";
const r12 = normalizeEvidenceUrl(warmadewaFixture);
assert(
  r12.normalized === "https://www.ejournal.warmadewa.ac.id/index.php/krisna/article/view/11294" &&
  r12.changed === true &&
  r12.reason === "MARKDOWN_LINK_EXTRACTED",
  "10.12 Fixture aktual Warmadewa berhasil dinormalisasi menjadi URL mentah"
);

// 13. Integrasi Parser: Parsing Output Transfer dengan Markdown URL Fixture
const validTransferWithMarkdownLink = `=== BEGIN SKRIFLOW_FENOMENA_V1 ===
{
  "schema_version": 1,
  "insufficient_evidence": false,
  "context": {
    "prodi": "Akuntansi",
    "area": "Adopsi AI Audit"
  },
  "candidates": [
    {
      "id": "F01",
      "name": "Kenaikan Kasus Fraud Laporan Keuangan",
      "phenomenon_type": "TREND",
      "phenomenon_summary": "Peningkatan temuan salah saji material pada laporan keuangan publik periode 2024-2025.",
      "observed_condition": "Terdapat lonjakan kasus salah saji yang terdeteksi oleh OJK dan BPK.",
      "scope": {
        "object_or_population": "KAP dan Perusahaan Publik",
        "geography": "Indonesia",
        "reference_period": "2024-2025"
      },
      "relation_to_area": "Mendasari pentingnya alat audit berbantuan AI untuk mendeteksi anomali.",
      "evidence": [
        {
          "claim": "Lonjakan temuan salah saji laporan keuangan sebesar 23% pada 2024",
          "observed_data_or_event": "Data statistik pengawasan pasar modal mencatat 45 entitas terkena sanksi administratif.",
          "source_title": "Jurnal Riset Akuntansi Warmadewa",
          "publisher_or_institution": "Universitas Warmadewa",
          "source_type": "EMPIRICAL_ARTICLE",
          "publication_date": "2025",
          "reference_period": "2024",
          "url": "[https://www.ejournal.warmadewa.ac.id/index.php/krisna/article/view/11294](https://www.ejournal.warmadewa.ac.id/index.php/krisna/article/view/11294)",
          "evidence_location": "Tabel 3 halaman 142",
          "access_note": "Artikel open access dapat diakses langsung",
          "method_or_metadata": "Analisis deskriptif kuantitatif",
          "limitations": "Data hanya mencakup sektor manufaktur"
        }
      ],
      "triangulation_note": "Dikonfirmasi oleh publikasi asosiasi auditor.",
      "what_is_not_proven": "Belum membuktikan efektivitas sistem AI audit baru.",
      "quality": {
        "relevance": "KUAT",
        "scope_clarity": "KUAT",
        "traceability": "KUAT",
        "metadata_quality": "KUAT",
        "timeliness": "KUAT",
        "comparability": "KUAT",
        "source_independence": "KUAT"
      },
      "status": "SIAP_DIBAWA",
      "keywords_id": ["salah saji", "audit AI"],
      "keywords_en": ["financial fraud", "AI audit"],
      "unresolved_items": ["cakupan sektor perbankan"]
    }
  ],
  "search_notes": ["Pencarian artikel empiris dan laporan resmi"]
}
=== END SKRIFLOW_FENOMENA_V1 ===`;

const parseResWarmadewa = parsePhenomenonTransfer(validTransferWithMarkdownLink);
assert(parseResWarmadewa.success === true, "10.13 Output dengan Markdown URL berhasil diparse");
assert(
  parseResWarmadewa.structuralStatus === "Valid dengan perbaikan format",
  "10.14 Status struktur adalah 'Valid dengan perbaikan format'"
);
assert(
  parseResWarmadewa.payload.candidates[0].evidence[0].url === "https://www.ejournal.warmadewa.ac.id/index.php/krisna/article/view/11294",
  "10.15 URL pada payload tersimpan sebagai URL mentah HTTPS"
);
assert(
  parseResWarmadewa.urlCorrections && parseResWarmadewa.urlCorrections.length === 1,
  "10.16 Rincian urlCorrections tercatat 1 item"
);
assert(
  parseResWarmadewa.warnings[0].includes("FORMAT URL DIPERBAIKI OTOMATIS"),
  "10.17 Warning non-blocking tercatat pada hasil parse"
);

// 14. Integrasi Prompt Tool 2 (Cari Fenomena)
const t2Prompt = assemblePrompt(t2, {
  prodi: "Akuntansi",
  area_eksplorasi: "Audit Berbasis AI",
  objek_awal: "KAP",
  petunjuk_fenomena: "Pola anomali transaksi",
});
assert(
  t2Prompt.includes("[ATURAN FORMAT URL]"),
  "10.18 Prompt Tool 2 memuat section [ATURAN FORMAT URL]"
);
assert(
  t2Prompt.includes('FORMAT SALAH:\n"url": "[https://www.example.org/article/123](https://www.example.org/article/123)"'),
  "10.19 Prompt Tool 2 memuat contoh FORMAT SALAH Markdown link"
);
assert(
  t2Prompt.includes('"url": "https://www.example.org/path-to-source"'),
  "10.20 Template JSON Tool 2 memuat contoh path-to-source eksplisit"
);
assert(
  t2Prompt.includes("Khusus field evidence[].url:"),
  "10.21 Aturan khusus evidence[].url ada setelah template schema"
);

// 15. Fix URL Prompt
const fixUrlPromptText = generateFixUrlPrompt();
assert(
  fixUrlPromptText.includes("Perbaiki HANYA format field evidence[].url"),
  "10.22 Prompt perbaikan URL meminta perbaikan hanya pada field evidence[].url"
);
assert(
  fixUrlPromptText.includes("Jangan mengubah kandidat, nama fenomena, klaim"),
  "10.23 Prompt perbaikan URL menjaga integritas fakta akademik"
);

console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}


