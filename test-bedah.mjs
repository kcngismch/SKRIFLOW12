import { getToolBySlug } from "./src/data/tools.ts";
import {
  assembleBedahPrompt,
  countPromptCharacters,
} from "./src/lib/promptAssembler.ts";
import {
  validateLiteratureEvidencePackage,
  parseBedahTransfer,
  computeBedahInputFingerprint,
} from "./src/lib/bedahParser.ts";
import {
  saveBedahDraft,
  loadBedahDraft,
  clearBedahDraft,
  saveResearchFoundationBrief,
  loadResearchFoundationBrief,
  clearResearchFoundationBrief,
} from "./src/lib/storage.ts";
import { BEDAH_LIMITS, getBedahPromptBudgetStatus, NOTEBOOKLM_LIMITS } from "./src/config/promptLimits.ts";

console.log("=== RUNNING TEST SUITE: TOOL 4 BEDAH FENOMENA & LITERATUR ===");

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

// Sample Fixtures
const fixturePhenomenon = {
  candidateId: "F01",
  name: "Adopsi Audit Generative AI di KAP Big Four Indonesia",
  status: "SIAP_DIBAWA",
  phenomenonType: "PERISTIWA_EMPERIS",
  phenomenonSummary: "KAP Big Four di Indonesia mulai menerapkan tools AI generatif untuk sampling audit transaksi perbankan pada tahun 2023-2024.",
  observedCondition: "Peningkatan efisiensi waktu audit sebesar 30% namun terdapat risiko halusinasi output.",
  relationToArea: "Secara langsung menguji integrasi AI pada praktik audit eksternal.",
  scope: {
    objectOrPopulation: "KAP Big Four Jakarta",
    geography: "Indonesia",
    referencePeriod: "2023-2024",
  },
  evidence: [
    {
      claim: "Penggunaan Copilot internal oleh 4 KAP besar di Jakarta",
      source_title: "Laporan Tren Audit 2024",
      source_publisher: "IAPI",
      source_year: 2024,
      source_type: "ORGANIZATIONAL_REPORT",
      source_url: "https://iapi.or.id/laporan-audit-2024",
      evidence_location: "Halaman 15-18",
      accessibility: "DAPAT_DIAKSES_PUBLIK",
    },
  ],
  triangulationNote: "Dikonfirmasi melalui rilis pers dan wawancara pimpinan KAP.",
  whatIsNotProven: "Belum terbukti apakah AI menggantikan opini profesional auditor senior.",
  unresolvedItems: ["Regulasi OJK terkait audit AI", "Standar kepatuhan SPAP"],
  sourceConfirmationCount: 1,
  fingerprint: "fen_fp_test_123",
};

const fixtureLiteratureValid = `### PAKET BUKTI LITERATUR

#### A. KONTEKS
- Prodi: Akuntansi
- Area: Auditing dan Generative AI
- Fenomena: Adopsi AI di KAP

#### B. STATUS SUMBER
Total notebook = 10 (8 inti + 2 pendukung + 0 diabaikan)

#### C. SOURCE REGISTER
| Kategori | Judul | Penulis–Tahun | Jenis/Status | Publikasi | Konteks/Data/Metode |
|---|---|---|---|---|---|
| INTI | Generative AI in Financial Auditing | Smith et al. (2023) | Empiris | Journal of Accounting Research | 120 auditor eksperimen |
| INTI | Algorithmic Risk in Assurance | Doe & Brown (2024) | Empiris | Auditing: A Journal of Practice & Theory | 85 KAP survei |

#### D. MATRIKS BUKTI
| Kode | Fungsi | Klaim Netral | Sumber | Konteks | Batas Penggunaan |
|---|---|---|---|---|---|
| B01 | TEMUAN | Studi melaporkan efisiensi waktu sampling audit meningkat 25% | Smith et al. (2023) — Generative AI in Audit | Eksperimen lab KAP | Batas pada sampel simulasi |
| B02 | KETERBATASAN | Keterbatasan model pada deteksi fraud kompleks | Doe & Brown (2024) — Algorithmic Risk | Survei KAP AS | Batas sampel AS |

#### E. PENUTUP
Paket ini hanya memetakan bukti dari sumber notebook. Belum ditetapkan research gap, arah penelitian, judul, variabel, teori, metode, objek, atau teknik analisis. STOP.`;

const fixtureTransferJSON = `Output penjelasan pendahuluan dari ChatGPT...

=== BEGIN SKRIFLOW_DIRECTION_V1 ===
{
  "schema_version": 1,
  "input_status": "BUKTI_CUKUP_UNTUK_DIBEDAH",
  "automatic_selection": false,
  "calibrated_phenomenon": {
    "summary": "Adopsi AI generative pada KAP Big Four di Indonesia menunjukkan efisiensi proses sampling.",
    "scope": "KAP Big Four Jakarta, Indonesia",
    "reference_period": "2023-2024",
    "anchor_sources": ["Smith et al. (2023)", "IAPI (2024)"],
    "what_is_not_proven": ["Penggantian penuh pertimbangan profesional auditor"],
    "prohibited_claims": ["AI pasti menurunkan kualitas audit"]
  },
  "candidate_gaps": [
    {
      "id": "G01",
      "gap_type": "CONTEXTUAL",
      "statement": "Mayoritas studi empiris menguji adopsi AI audit di negara maju, sementara adaptasi regulasi dan SPAP di emerging markets belum terjelaskan secara memadai.",
      "what_is_known": ["Efisiensi waktu sampling meningkat di lingkungan lab AS"],
      "what_is_unexplained": "Bagaimana interaksi auditor dengan SPAP lokal saat menggunakan AI generatif",
      "anchor_sources": ["Smith et al. (2023) — Generative AI in Audit", "Doe & Brown (2024) — Algorithmic Risk"],
      "strength": "TERDUKUNG_KUAT",
      "scope_limits": ["KAP di emerging markets"],
      "verification_needed": ["Standar SPAP terbaru IAPI"],
      "prohibited_claims": ["Belum pernah ada yang meneliti AI"]
    }
  ],
  "directions": [
    {
      "id": "D01",
      "name": "Evaluasi Kepatuhan SPAP pada Penggunaan AI Sampling",
      "problem_focus": "Menganalisis bagaimana auditor menavigasi standar SPAP saat memanfaatkan AI generatif untuk prosedur substantive test.",
      "phenomenon_link": "Menjawab kekhawatiran kepatuhan yang muncul saat KAP Big Four mulai mengadopsi Copilot di Jakarta.",
      "gap_ids": ["G01"],
      "anchor_sources": ["Smith et al. (2023)", "Doe & Brown (2024)"],
      "data_needs": ["Kuesioner/survei persepsi auditor", "Dokumentasi kebijakan KAP"],
      "data_sources_to_check": ["IAPI", "Auditor KAP Big Four"],
      "possible_design_families": ["Kuantitatif deskriptif / survei terstruktur"],
      "constraint_fit": "KUAT",
      "main_work": ["Menyusun instrumen kepatuhan", "Mengumpulkan data auditor"],
      "academic_risks": ["Akses responden auditor KAP yang sibuk"],
      "data_risks": ["Kerahasiaan prosedur audit KAP"],
      "unresolved_items": ["Akses ke auditor KAP Big Four"],
      "readiness": "KUAT",
      "background_map": [
        {
          "order": 1,
          "function": "Latar belakang adopsi AI di bidang akuntansi & audit",
          "anchor_sources": ["Smith et al. (2023)"],
          "safe_claims": ["AI generatif mulai diadopsi dalam praktik audit"],
          "prohibited_claims": ["Semua KAP telah beralih ke AI"]
        }
      ]
    },
    {
      "id": "D02",
      "name": "Dampak Perceived Risk AI terhadap Skeptisisme Profesional",
      "problem_focus": "Menguji apakah risiko halusinasi AI memengaruhi tingkat skeptisisme auditor saat mereview temuan.",
      "phenomenon_link": "Berkaitan langsung dengan risiko halusinasi yang teramati pada fenomena awal.",
      "gap_ids": ["G01"],
      "anchor_sources": ["Doe & Brown (2024)"],
      "data_needs": ["Eksperimen skenario audit atau survei"],
      "data_sources_to_check": ["Auditor senior KAP"],
      "possible_design_families": ["Kuantitatif eksperimen 2x2 atau survei regresi"],
      "constraint_fit": "SEDANG",
      "main_work": ["Menyusun skenario audit fraud", "Uji beda skeptisisme"],
      "academic_risks": ["Validitas internal skenario eksperimen"],
      "data_risks": ["Jumlah sampel eksperimen terbatas"],
      "unresolved_items": ["Kesiapan desain eksperimen"],
      "readiness": "SEDANG",
      "background_map": [
        {
          "order": 1,
          "function": "Pengenalan fenomena risiko AI",
          "anchor_sources": ["Doe & Brown (2024)"],
          "safe_claims": ["Auditor menghadapi ketidakpastian akurasi output AI"],
          "prohibited_claims": ["Auditor pasti bersikap malas"]
        }
      ]
    }
  ],
  "guidance_points": [
    "Konfirmasi ke dosen pembimbing apakah fokus pada kepatuhan SPAP lebih disukai dibanding eksperimen perilaku.",
    "Tanyakan akses ke data auditor KAP Big Four di Jakarta."
  ],
  "recovery_actions": []
}
=== END SKRIFLOW_DIRECTION_V1 ===
Teks penutup setelah JSON...`;

// =========================================================================
// 1. HANDOFF TESTS
// =========================================================================
console.log("\n=== 1. HANDOFF TESTS ===");

const bedahInputFixture = {
  prodi: "Akuntansi",
  areaEksplorasi: "Auditing & Generative AI",
  selectedPhenomenon: fixturePhenomenon,
  studentConstraints: {
    preferredApproach: "Kuantitatif",
    preferredData: "Data Sekunder / Survei",
    existingDataAccess: "Dosen pembimbing memiliki kontak di KAP",
    dataAccessNotes: "Perlu surat izin riset resmi",
    avoidedActivities: "Wawancara mendalam yang memakan waktu lama",
    timeCondition: "6 bulan target kelulusan",
    additionalNotes: "Fokus pada KAP di Jakarta",
  },
  additionalNotes: "Fokus pada KAP di Jakarta",
  supervisorDirection: "Gunakan jurnal terindeks Scopus Q1/Q2",
  literatureEvidencePackage: fixtureLiteratureValid,
};

const bedahPrompt = assembleBedahPrompt(bedahInputFixture);

assert(bedahPrompt.includes("- Program Studi: Akuntansi"), "1. Prodi terbawa");
assert(bedahPrompt.includes("- Area Eksplorasi: Auditing & Generative AI"), "2. Area eksplorasi terbawa");
assert(bedahPrompt.includes("Ringkasan Fenomena: KAP Big Four di Indonesia mulai menerapkan tools AI"), "3. Summary fenomena terbawa");
assert(bedahPrompt.includes("Penggunaan Copilot internal oleh 4 KAP besar"), "4. Full evidence fenomena terbawa");
assert(bedahPrompt.includes("Apa yang Belum Terbukti: Belum terbukti apakah AI menggantikan"), "5. what_is_not_proven terbawa");
assert(bedahPrompt.includes("- Pendekatan yang Disukai: Kuantitatif"), "6. Constraints pendekatan terbawa");
assert(bedahPrompt.includes("- Arahan Dosen: Gunakan jurnal terindeks Scopus Q1/Q2"), "7. Arahan dosen terbawa");
assert(!bedahPrompt.includes("undefined") && !bedahPrompt.includes("null") && !bedahPrompt.includes("[object Object]"), "8. Tidak ada undefined/null/[object Object]");

// =========================================================================
// 2. VALIDATOR PAKET BUKTI TESTS
// =========================================================================
console.log("\n=== 2. VALIDATOR PAKET BUKTI TESTS ===");

const valFull = validateLiteratureEvidencePackage(fixtureLiteratureValid);
assert(valFull.status === "STRUKTUR_LENGKAP", "9. Heading lengkap diterima sebagai STRUKTUR_LENGKAP");
assert(valFull.hasKonteks && valFull.hasStatusSumber && valFull.hasSourceRegister && valFull.hasMatriksBukti && valFull.hasStopSentence, "10. Semua komponen inti terdeteksi");

const fixtureVariation = `## A. Konteks
Prodi: Akuntansi
## B. Status Sumber
Total: 10
## C. Source Register
INTI - Smith 2023
## D. Matriks Bukti
| Kode | B01 |
## E. Penutup
STOP.`;
const valVariation = validateLiteratureEvidencePackage(fixtureVariation);
assert(valVariation.status === "STRUKTUR_LENGKAP" || valVariation.status === "STRUKTUR_PERLU_DIPERIKSA", "11. Variasi level heading diterima");

const promptAWrongInput = `[PERAN]\nBantu mengumpulkan sumber akademik\n\n[IMPORT]\nSource Import Cards\n1. Smith et al. (2023)\n2. Doe & Brown (2024)`;
const valPromptA = validateLiteratureEvidencePackage(promptAWrongInput);
assert(valPromptA.status === "PAKET_TIDAK_DIKENALI" && valPromptA.isPromptAOutput, "12. Prompt A berupa daftar sumber ditolak sebagai PAKET_TIDAK_DIKENALI");

const researchReportInput = `### RESEARCH REPORT NOTEBOOKLM\n#### C. SOURCE REGISTER\n| Kategori | Judul | Penulis | Jenis |\n| INTI | Research Report AI | Smith (2024) | Report |\n#### D. MATRIKS BUKTI\n| B01 | TEMUAN | Bukti temuan report | Smith (2024) | Konteks | Batas |\n#### E. PENUTUP\nSTOP.`;
const valReport = validateLiteratureEvidencePackage(researchReportInput);
assert(valReport.status === "STRUKTUR_LENGKAP" || valReport.status === "STRUKTUR_PERLU_DIPERIKSA", "13. Research Report dengan matriks bukti tidak diblokir");

const valEmpty = validateLiteratureEvidencePackage("");
assert(valEmpty.status === "PAKET_TIDAK_DIKENALI", "14. Paket kosong ditolak");

// =========================================================================
// 3. PROMPT ASSEMBLER TESTS
// =========================================================================
console.log("\n=== 3. PROMPT ASSEMBLER TESTS ===");

assert(bedahPrompt.includes("DEFINISI AKADEMIK YANG WAJIB DIGUNAKAN") && bedahPrompt.includes("Fenomena empiris"), "15. Meminta definisi akademik terpisah");
assert(bedahPrompt.includes("Rumuskan 2–4 kandidat gap"), "16. Meminta kandidat gap terverifikasi");
assert(bedahPrompt.includes("Rumuskan 2–4 alternatif arah penelitian"), "17. Meminta 2-4 alternatif arah penelitian");
assert(bedahPrompt.includes("=== BEGIN SKRIFLOW_DIRECTION_V2 ==="), "19. Meminta transfer JSON V2");
assert(bedahPrompt.includes("Jangan menetapkan judul final") && bedahPrompt.includes("variabel final"), "20. Tidak meminta judul dan tidak mengunci variabel");
assert(bedahPrompt.includes("possible_design_families"), "21. Metode hanya disebut sebagai keluarga desain");
assert(bedahPrompt.includes("Jangan melakukan pencarian web"), "22. Tidak meminta pencarian web");

// =========================================================================
// 4. CHARACTER GUARD TESTS
// =========================================================================
console.log("\n=== 4. CHARACTER GUARD TESTS ===");

assert(BEDAH_LIMITS.safeTarget === 55000, "23. Bedah safe target 55.000");
assert(BEDAH_LIMITS.hardLimit === 70000, "24. Bedah hard limit 70.000");
assert(getBedahPromptBudgetStatus(55000) === "SAFE", "25. 55000 -> SAFE");
assert(getBedahPromptBudgetStatus(55001) === "WARNING", "26. 55001 -> WARNING");
assert(getBedahPromptBudgetStatus(70001) === "BLOCKED", "27. 70001 -> BLOCKED");

const emojiText = "Audit AI 🚀📊🤖";
assert(countPromptCharacters(emojiText) === Array.from(emojiText).length, "28. Emoji dihitung via Array.from()");

// NotebookLM invariant preservation
assert(NOTEBOOKLM_LIMITS.safeTarget === 3500 && NOTEBOOKLM_LIMITS.hardLimit === 3900, "29. NotebookLM limits tetap 3500 / 3900");

// =========================================================================
// 5. PARSER TESTS
// =========================================================================
console.log("\n=== 5. PARSER TESTS ===");

const parseRes = parseBedahTransfer(fixtureTransferJSON);
assert(parseRes.success && parseRes.data !== undefined, "30. Marker valid dan JSON valid berhasil diparse");
assert(parseRes.data.schema_version === 1, "31. schema_version === 1 terverifikasi");
assert(parseRes.data.candidate_gaps.length === 1, "32. candidate_gaps diekstrak");
assert(parseRes.data.directions.length === 2, "33. directions diekstrak (2 arah)");
assert(parseRes.data.directions[0].gap_ids[0] === "G01", "34. gap_ids merujuk G01 yang valid");

const parseNoMarker = parseBedahTransfer("Hanya teks biasa tanpa marker skriflow");
assert(!parseNoMarker.success && parseNoMarker.error.includes("tidak ditemukan"), "35. Marker hilang ditolak dengan error spesifik");

const parseBadJSON = parseBedahTransfer("=== BEGIN SKRIFLOW_DIRECTION_V1 ===\n{ invalid_json: true\n=== END SKRIFLOW_DIRECTION_V1 ===");
assert(!parseBadJSON.success && parseBadJSON.error.includes("JSON tidak valid"), "36. Format JSON tidak valid ditolak");

const parseInvalidGapRef = parseBedahTransfer(`=== BEGIN SKRIFLOW_DIRECTION_V1 ===
{
  "schema_version": 1,
  "input_status": "BUKTI_CUKUP_UNTUK_DIBEDAH",
  "automatic_selection": false,
  "calibrated_phenomenon": { "summary": "test" },
  "candidate_gaps": [{ "id": "G01", "gap_type": "EMPIRICAL", "statement": "test", "what_is_known": [], "what_is_unexplained": "", "anchor_sources": ["s1"], "strength": "TERDUKUNG_KUAT" }],
  "directions": [
    { "id": "D01", "name": "Arah 1", "problem_focus": "f1", "phenomenon_link": "p1", "gap_ids": ["G99_NON_EXISTENT"], "anchor_sources": ["s1"], "data_needs": [], "data_sources_to_check": [], "possible_design_families": [], "constraint_fit": "KUAT", "main_work": [], "academic_risks": [], "data_risks": [], "unresolved_items": [], "readiness": "KUAT", "background_map": [] },
    { "id": "D02", "name": "Arah 2", "problem_focus": "f2", "phenomenon_link": "p2", "gap_ids": ["G01"], "anchor_sources": ["s1"], "data_needs": [], "data_sources_to_check": [], "possible_design_families": [], "constraint_fit": "KUAT", "main_work": [], "academic_risks": [], "data_risks": [], "unresolved_items": [], "readiness": "KUAT", "background_map": [] }
  ]
}
=== END SKRIFLOW_DIRECTION_V1 ===`);
assert(!parseInvalidGapRef.success && parseInvalidGapRef.errorDetails.some((e) => e.includes("G99_NON_EXISTENT")), "37. Gap reference tidak ditemukan ditolak");

// =========================================================================
// 6. PERSISTENCE & FINGERPRINT TESTS
// =========================================================================
console.log("\n=== 6. PERSISTENCE & FINGERPRINT TESTS ===");

const fp1 = computeBedahInputFingerprint(fixturePhenomenon, fixtureLiteratureValid, { pendekatan: "kuantitatif" }, "arahan 1");
const fp2 = computeBedahInputFingerprint(fixturePhenomenon, fixtureLiteratureValid, { pendekatan: "kuantitatif" }, "arahan 1");
assert(fp1 === fp2, "38. Fingerprint stabil untuk input identik");

const fpChanged = computeBedahInputFingerprint(fixturePhenomenon, fixtureLiteratureValid + " ekstra", { pendekatan: "kuantitatif" }, "arahan 1");
assert(fp1 !== fpChanged, "39. Fingerprint berubah jika input berubah (stale detection)");

clearBedahDraft();
saveBedahDraft("Draft Literatur Test");
assert(loadBedahDraft() === "Draft Literatur Test", "40. Draft literatur tersimpan dan terbaca");
clearBedahDraft();

const sampleBrief = {
  schemaVersion: 1,
  prodi: "Akuntansi",
  areaEksplorasi: "Auditing AI",
  calibratedPhenomenon: { summary: "test phen" },
  phenomenonEvidence: [],
  problemFocus: "focus 1",
  selectedGap: [],
  selectedDirection: {
    directionId: "D01",
    name: "Arah 1",
    problemFocus: "f1",
    phenomenonLink: "p1",
    gapIds: ["G01"],
    anchorSources: ["s1"],
    dataNeeds: [],
    possibleDesignFamilies: [],
    readiness: "KUAT",
  },
  anchorSources: ["s1"],
  dataNeeds: ["d1"],
  dataReadinessStatus: "DATA_TERKONFIRMASI",
  dataSourcesToCheck: [],
  possibleDesignFamilies: ["kuantitatif"],
  studentConstraints: {},
  academicRisks: [],
  dataRisks: [],
  backgroundMap: [],
  guidancePoints: [],
  unresolvedItems: [],
  recoveryActions: [],
  inputFingerprint: fp1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

saveResearchFoundationBrief(sampleBrief);
const loadedBrief = loadResearchFoundationBrief();
assert(loadedBrief !== null && loadedBrief.schemaVersion === 1 && loadedBrief.selectedDirection.directionId === "D01", "41. Research Foundation Brief tersimpan dan terbaca dengan schema_version 1");
clearResearchFoundationBrief();

// =========================================================================
// 7. REGRESSION & CATALOG TESTS
// =========================================================================
console.log("\n=== 7. REGRESSION & CATALOG TESTS ===");

const t4 = getToolBySlug("bedah-hasil-notebooklm");
assert(t4 !== undefined, "42. Tool Bedah terdaftar di catalog");
assert(t4.name === "Bedah Fenomena & Literatur", "43. Nama Tool Bedah adalah 'Bedah Fenomena & Literatur'");
assert(t4.previousStep.href === "/tools/cari-literatur-awal", "44. Previous step -> /tools/cari-literatur-awal");
assert(t4.nextStep.href === "/tools", "45. Next step -> /tools");

console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}
