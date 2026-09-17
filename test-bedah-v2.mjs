import assert from "node:assert";
import {
  parseBedahTransfer,
  parseBab1FoundationTransfer,
  calculateDataReadiness,
  validateLiteratureEvidencePackage,
  generateBedahFixFormatPrompt4A,
  generateBedahFixStructurePrompt4A,
  generateBab1FoundationFixFormatPrompt,
  generateBab1FoundationFixStructurePrompt,
} from "./src/lib/bedahParser.ts";
import {
  assembleBedahPrompt,
  analyzeBedahPrompt,
  assembleBedahPrompt4B,
  analyzeBedahPrompt4B,
} from "./src/lib/promptAssembler.ts";

console.log("=== RUNNING TOOL 4 V2 COMPREHENSIVE ACCEPTANCE TEST SUITE ===");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Test A: Tolerant Validation of Literature Package
// -----------------------------------------------------------------------------
test("Test A1: Detects Prompt A Output pasted erroneously into Tool 4", () => {
  const promptAText = `=== SOURCE IMPORT CARDS (AUTO-IMPORT) ===\n[PERAN] MENGUMPULKAN SUMBER AKADEMIK`;
  const result = validateLiteratureEvidencePackage(promptAText);
  assert.strictEqual(result.isPromptAOutput, true);
  assert.strictEqual(result.status, "PAKET_TIDAK_DIKENALI");
});

test("Test A2: Validates full Prompt B Literature Evidence Package", () => {
  const fullPkg = `A. KONTEKS MAHASISWA\nProdi: Akuntansi\n\nB. STATUS SUMBER\nTotal: 5\n\nC. SOURCE REGISTER\n[S01] INTI - Viesta (2023)\n\nD. MATRIKS BUKTI\n| B01 | S01 | Pengaruh konservatisme terhadap ERC |\n\nE. STOP\nPAKET INI HANYA MEMETAKAN BUKTI`;
  const result = validateLiteratureEvidencePackage(fullPkg);
  assert.strictEqual(result.status, "STRUKTUR_LENGKAP");
  assert.strictEqual(result.hasSourceRegister, true);
  assert.strictEqual(result.hasMatriksBukti, true);
});

// -----------------------------------------------------------------------------
// Test B: Prompt 4A Assembly & Budget
// -----------------------------------------------------------------------------
test("Test B1: Assembles Prompt 4A with V2 marker & rules", () => {
  const prompt = assembleBedahPrompt({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    selectedPhenomenon: {
      name: "Fenomena ERC Fluktuatif",
      phenomenonSummary: "Terjadi penurunan respon laba pada sektor infrastruktur 2017-2021.",
      status: "TERKONFIRMASI",
      candidateId: "C01",
    },
    literatureEvidencePackage: "C. SOURCE REGISTER\n[S01] INTI - Viesta (2023)\nD. MATRIKS BUKTI\n| B01 | S01 | ERC signifikan |",
  });

  assert.ok(prompt.includes("=== BEGIN SKRIFLOW_DIRECTION_V2 ==="));
  assert.ok(prompt.includes("=== END SKRIFLOW_DIRECTION_V2 ==="));
  assert.ok(prompt.includes("DEFINISI AKADEMIK YANG WAJIB DIGUNAKAN"));
  assert.ok(prompt.includes("ATURAN KOMPARABILITAS STUDI"));
  assert.ok(prompt.includes("Dilarang menggunakan status TERBUKTI"));

  const analysis = analyzeBedahPrompt({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    literatureEvidencePackage: "Sample literature",
  });
  assert.strictEqual(analysis.status, "SAFE");
});

// -----------------------------------------------------------------------------
// Test C: DirectionV2 Parser - Valid V2 Output
// -----------------------------------------------------------------------------
const sampleValidV2Json = {
  schema_version: 2,
  automatic_selection: false,
  input_audit: {
    status: "CUKUP_UNTUK_ARAH",
    phenomenon_source_count: 2,
    core_source_count: 3,
    supporting_source_count: 2,
    ignored_source_count: 1,
    source_integrity_notes: ["Semua sumber empiris lengkap"],
    main_limitations: ["Rentang waktu 2017-2021"],
    recovery_actions: [],
  },
  calibrated_phenomenon: {
    summary: "Penurunan konsistensi respon laba sektor infrastruktur.",
    empirical_problem: "Variasi ERC yang tajam antar subsektor infrastruktur.",
    knowledge_problem: "Belum dipetakan peran konservatisme akuntansi pada periode regulasi baru.",
    scope: {
      object_or_population: "Emiten infrastruktur BEI",
      geography: "Indonesia",
      reference_period: "2017-2021",
      event_or_context: "Pembangunan infrastruktur masif",
    },
    evidence: [
      {
        source_id: "S01",
        source_title: "Viesta (2023)",
        claim: "Variasi ERC terlihat pada emiten infrastruktur",
        evidence_location: "Hal 4",
        context: "BEI 2017-2021",
        limitations: "Hanya sektor infrastruktur",
      },
    ],
    why_it_matters: [
      {
        statement: "Kualitas laba krusial bagi kredibilitas laporan keuangan",
        source_ids: ["S01"],
        limitations: "Konteks pasar berkembang",
      },
    ],
    what_is_not_proven: ["Pengaruh makroekonomi tidak diuji"],
    prohibited_claims: ["Jangan klaim seluruh BUMN rugi"],
  },
  knowledge_map: {
    established_knowledge: [
      {
        statement: "Konservatisme berpengaruh terhadap kualitas laba",
        source_ids: ["S01"],
        scope_limit: "Sektor infrastruktur",
      },
    ],
    relatively_consistent_findings: [
      {
        statement: "Ukuran perusahaan konsisten berpengaruh positif",
        source_ids: ["S01", "S02"],
        comparability_note: "Sama-sama menggunakan log total aset",
      },
    ],
    differing_findings: [
      {
        statement: "Leverage berpengaruh pada Viesta tapi tidak pada Surya",
        source_ids: ["S01", "S02"],
        comparability: "SEBANDING",
        explanation: "Perbedaan periode sampel",
      },
    ],
    measurement_limits: ["Pengukuran ERC menggunakan CAR 3 hari"],
    context_limits: ["Hanya pasar modal Indonesia"],
    data_limits: ["Laporan keuangan tahunan"],
    methodological_limits: ["Regresi data panel random effect"],
    conclusions_not_allowed: ["Tidak dapat digeneralisasi ke perbankan"],
  },
  comparability_groups: [
    {
      id: "CG01",
      source_ids: ["S01", "S02"],
      construct_or_predictor: "Konservatisme Akuntansi",
      outcome: "Kualitas Laba",
      proxies: ["Givoly & Hayn (2000)"],
      objects_and_periods: ["BEI 2017-2021 vs BEI 2015-2019"],
      relationship_type: "Pengaruh Langsung",
      comparability: "SEBANDING",
      reason: "Konstruk dan proksi identik",
    },
  ],
  candidate_gaps: [
    {
      id: "G01",
      gap_type: "EMPIRICAL_INCONSISTENCY",
      statement: "Inkonsistensi pengaruh leverage terhadap respon laba pada emiten beraset intensif.",
      what_is_known: ["Leverage memengaruhi risiko keuangan"],
      what_is_unexplained: "Apakah leverage mendistorsi ERC saat terjadi restrukturisasi aset",
      phenomenon_link: "Terkait dengan variasi leverage di sektor infrastruktur",
      source_ids: ["S01", "S02"],
      comparability_basis: "Pengujian proksi DER pada sektor beraset tetap tinggi",
      strength: "DIDUKUNG_DALAM_PAKET",
      scope_limits: ["Perusahaan non-keuangan"],
      verification_needed: ["Periksa struktur utang jangka panjang"],
      prohibited_claims: ["Jangan simpulkan utang selalu menurunkan ERC"],
      assessment: {
        phenomenon_relevance: "KUAT",
        traceability: "KUAT",
        comparability: "KUAT",
        evidence_strength: "KUAT",
        feasibility: "KUAT",
        overclaim_risk: "RENDAH",
      },
    },
  ],
  directions: [
    {
      id: "D01",
      name: "Pengujian Peran Konservatisme pada Respon Laba Emiten Infrastruktur",
      problem_focus: "Menjelaskan bagaimana konservatisme memitigasi volatilitas respon laba.",
      phenomenon_link: "Menjawab fenomena penurunan respon pasar terhadap laba.",
      gap_ids: ["G01"],
      anchor_source_ids: ["S01", "S02"],
      potential_unit_of_analysis: ["Perusahaan"],
      potential_objects: ["Emiten infrastruktur BEI"],
      potential_constructs: ["Konservatisme Akuntansi", "Leverage", "ERC"],
      candidate_outcomes: ["Earnings Response Coefficient"],
      previously_used_proxies: ["Accumulated Accruals", "CAR (-1, +1)"],
      data_needs: ["Laporan Keuangan Tahunan 2018-2023", "Harga Saham Harian"],
      data_sources_to_check: ["IDX", "Yahoo Finance"],
      possible_design_families: ["Kuantitatif Asosiatif Regresi Panel"],
      constraint_fit: "KUAT",
      workload: "SEDANG",
      main_work: ["Ekstraksi data laporan keuangan", "Perhitungan CAR", "Estimasi regresi panel"],
      academic_risks: ["Heteroskedastisitas data panel"],
      data_risks: ["Kelengkapan publikasi laporan keuangan"],
      scope_boundaries: {
        in_scope: ["Sektor infrastruktur"],
        out_of_scope: ["Sektor perbankan"],
      },
      unresolved_items: ["Penentuan event window 3 hari atau 5 hari"],
      data_verification_questions: [
        {
          id: "Q01",
          question: "Apakah laporan keuangan emiten infrastruktur 2018-2023 lengkap di IDX?",
          critical: true,
          related_data_need: "Laporan Keuangan Tahunan",
        },
        {
          id: "Q02",
          question: "Apakah data harga saham harian tersedia tanpa missing values?",
          critical: true,
          related_data_need: "Harga Saham Harian",
        },
      ],
      readiness: "LAYAK_DIPERIKSA",
    },
    {
      id: "D02",
      name: "Dampak Pengungkapan Tata Kelola terhadap Kualitas Laba",
      problem_focus: "Menguji moderasi tata kelola pada respon laba.",
      phenomenon_link: "Terkait pengawasan manajemen laba.",
      gap_ids: ["G01"],
      anchor_source_ids: ["S01"],
      potential_unit_of_analysis: ["Perusahaan"],
      potential_objects: ["Emiten LQ45"],
      potential_constructs: ["GCG", "ERC"],
      candidate_outcomes: ["ERC"],
      previously_used_proxies: ["Komite Audit", "CAR"],
      data_needs: ["Laporan Tahunan"],
      data_sources_to_check: ["IDX"],
      possible_design_families: ["Regresi Data Panel"],
      constraint_fit: "SEDANG",
      workload: "SEDANG",
      main_work: ["Scoring tata kelola"],
      academic_risks: ["Subjektivitas checklist"],
      data_risks: ["Ketersediaan annual report"],
      scope_boundaries: { in_scope: ["LQ45"], out_of_scope: ["Non-listed"] },
      unresolved_items: ["Item skor GCG"],
      data_verification_questions: [
        {
          id: "Q03",
          question: "Apakah annual report memuat profil komite audit?",
          critical: true,
          related_data_need: "Annual Report",
        },
      ],
      readiness: "LAYAK_DIPERIKSA",
    },
  ],
  comparison_summary: "Arah D01 memiliki kedekatan empiris tertinggi dengan fenomena yang diajukan.",
  conditional_recommendation: {
    recommended_direction_ids: ["D01"],
    reasoning: "D01 didukung oleh bukti primer dari paket dan ketersediaan data sekunder yang jelas.",
    conditions: ["Data harga saham harian lengkap", "Model panel diuji kelayakannya"],
    not_a_selection: true,
  },
  guidance_points: ["Konfirmasi proksi konservatisme dengan dosen"],
  recovery_actions: [],
};

test("Test C1: Parses DirectionV2 transfer block successfully", () => {
  const rawOutput = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(sampleValidV2Json, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(rawOutput);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.version, 2);
  assert.ok(res.dataV2);
  assert.strictEqual(res.dataV2.schema_version, 2);
  assert.strictEqual(res.dataV2.directions.length, 2);
  assert.strictEqual(res.dataV2.candidate_gaps[0].id, "G01");
});

test("Test C2: Backward compatibility parses DirectionV1 block", () => {
  const v1Payload = {
    schema_version: 1,
    input_status: "BUKTI_CUKUP_UNTUK_DIBEDAH",
    automatic_selection: false,
    calibrated_phenomenon: {
      summary: "Fenomena ringkas V1",
    },
    candidate_gaps: [
      {
        id: "G01",
        gap_type: "EMPIRICAL",
        statement: "Gap V1",
        anchor_sources: ["Viesta (2023)"],
        strength: "TERDUKUNG_KUAT",
      },
    ],
    directions: [
      {
        id: "D01",
        name: "Arah V1",
        problem_focus: "Fokus V1",
        gap_ids: ["G01"],
        anchor_sources: ["Viesta (2023)"],
        readiness: "KUAT",
        constraint_fit: "KUAT",
      },
      {
        id: "D02",
        name: "Arah V2",
        problem_focus: "Fokus V2",
        gap_ids: ["G01"],
        anchor_sources: ["Viesta (2023)"],
        readiness: "SEDANG",
        constraint_fit: "SEDANG",
      },
    ],
  };

  const rawOutput = `=== BEGIN SKRIFLOW_DIRECTION_V1 ===\n${JSON.stringify(v1Payload, null, 2)}\n=== END SKRIFLOW_DIRECTION_V1 ===`;
  const res = parseBedahTransfer(rawOutput);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.version, 1);
  assert.ok(res.dataV1);
  assert.strictEqual(res.dataV1.schema_version, 1);
});

// -----------------------------------------------------------------------------
// Test D: Feasibility Gate Deterministic Calculations
// -----------------------------------------------------------------------------
const mockQuestions = [
  { id: "Q01", question: "Laporan keuangan lengkap?", critical: true, related_data_need: "Lapkeu" },
  { id: "Q02", question: "Data harga saham tersedia?", critical: true, related_data_need: "Harga Saham" },
  { id: "Q03", question: "Data tambahan wawancara?", critical: false, related_data_need: "Wawancara" },
];

test("Test D1: Feasibility returns DATA_READY when all critical are SUDAH_DIPASTIKAN and access note exists", () => {
  const answers = {
    Q01: "SUDAH_DIPASTIKAN",
    Q02: "SUDAH_DIPASTIKAN",
    Q03: "BELUM_DIPASTIKAN",
  };
  const readiness = calculateDataReadiness(mockQuestions, answers, "Data IDX sudah diunduh.");
  assert.strictEqual(readiness, "DATA_READY");
});

test("Test D2: Feasibility returns DATA_CONDITIONAL when some critical are BELUM_DIPASTIKAN", () => {
  const answers = {
    Q01: "SUDAH_DIPASTIKAN",
    Q02: "BELUM_DIPASTIKAN",
    Q03: "BELUM_DIPASTIKAN",
  };
  const readiness = calculateDataReadiness(mockQuestions, answers, "Masih cek sebagian");
  assert.strictEqual(readiness, "DATA_CONDITIONAL");
});

test("Test D3: Feasibility returns DATA_BLOCKED when any critical is TIDAK_TERSEDIA", () => {
  const answers = {
    Q01: "TIDAK_TERSEDIA",
    Q02: "SUDAH_DIPASTIKAN",
  };
  const readiness = calculateDataReadiness(mockQuestions, answers, "Perusahaan menolak data");
  assert.strictEqual(readiness, "DATA_BLOCKED");
});

// -----------------------------------------------------------------------------
// Test E: Tahap 4B Prompt Assembly & Budget
// -----------------------------------------------------------------------------
test("Test E1: Assembles Prompt 4B focused exclusively on selected direction", () => {
  const prompt4B = assembleBedahPrompt4B({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    calibratedPhenomenon: sampleValidV2Json.calibrated_phenomenon,
    selectedDirection: sampleValidV2Json.directions[0],
    associatedGaps: sampleValidV2Json.candidate_gaps,
    relevantLiteratureEvidence: "[S01] Viesta (2023) - ERC signifikan pada halaman 4-9.",
    feasibilityState: {
      directionId: "D01",
      answers: { Q01: "SUDAH_DIPASTIKAN", Q02: "SUDAH_DIPASTIKAN" },
      accessNotes: "Data IDX lengkap",
      computedReadiness: "DATA_READY",
      lastUpdated: new Date().toISOString(),
    },
  });

  assert.ok(prompt4B.includes("=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ==="));
  assert.ok(prompt4B.includes("=== END SKRIFLOW_BAB1_FOUNDATION_V1 ==="));
  assert.ok(prompt4B.includes("D01"));
  assert.ok(prompt4B.includes("Pengujian Peran Konservatisme pada Respon Laba Emiten Infrastruktur"));
  assert.ok(prompt4B.includes("Status Kesiapan Data: DATA_READY"));
  // Ensure unselected direction D02 is NOT in the prompt
  assert.ok(!prompt4B.includes("D02"));
});

// -----------------------------------------------------------------------------
// Test F: Bab 1 Foundation Transfer Parser & Reconciliation
// -----------------------------------------------------------------------------
const sampleValidFoundationJson = {
  schema_version: 1,
  foundation_status: "BAB1_READY",
  status_reason: "Fondasi logis lengkap dengan data siap.",
  blocking_items: [],
  selected_direction: {
    id: "D01",
    name: "Pengujian Peran Konservatisme pada Respon Laba Emiten Infrastruktur",
    student_selected: true,
    selection_reason: "Paling sesuai dengan ketersediaan data sekunder",
    direction_readiness: "LAYAK_DIPERIKSA",
    data_readiness: "DATA_READY",
  },
  problem_structure: {
    empirical_phenomenon: "Penurunan konsistensi respon laba sektor infrastruktur.",
    empirical_problem: "Variasi respon laba antar emiten.",
    knowledge_problem: "Belum jelasnya peran konservatisme akuntansi.",
    candidate_gap_statement: "Inkonsistensi pengaruh leverage terhadap respon laba.",
    gap_ids: ["G01"],
    gap_strengths: ["DIDUKUNG_DALAM_PAKET"],
    provisional_research_problem: "Bagaimana konservatisme memitigasi dampak distorsi leverage terhadap respon pasar?",
  },
  research_logic_chain: [
    { order: 1, stage: "CONTEXT", statement: "Pembangunan infrastruktur masif.", evidence_source_ids: ["S01"], limitations: "2017-2021" },
    { order: 2, stage: "PHENOMENON", statement: "Penurunan konsistensi respon laba.", evidence_source_ids: ["S01"], limitations: "Infrastruktur" },
    { order: 3, stage: "EMPIRICAL_PROBLEM", statement: "Fluktuasi respon pasar atas laba yang dilaporkan.", evidence_source_ids: ["S01"], limitations: "Non-keuangan" },
    { order: 4, stage: "PRIOR_KNOWLEDGE", statement: "Konservatisme berhubungan dengan kualitas laba.", evidence_source_ids: ["S01"], limitations: "Panel" },
    { order: 5, stage: "KNOWLEDGE_LIMIT", statement: "Studi terdahulu berbeda hasil pada variabel kontrol leverage.", evidence_source_ids: ["S01", "S02"], limitations: "Data sekunder" },
    { order: 6, stage: "RESEARCH_DIRECTION", statement: "Memeriksa konservatisme dan respon laba.", evidence_source_ids: ["S01"], limitations: "Regresi panel" },
    { order: 7, stage: "RESEARCH_QUESTION", statement: "Apakah konservatisme memoderasi hubungan leverage dan ERC?", evidence_source_ids: ["S01"], limitations: "Sampel BEI" },
  ],
  candidate_research_questions: [
    {
      id: "RQ01",
      question: "Apakah konservatisme akuntansi berpengaruh positif terhadap Earnings Response Coefficient pada emiten sektor infrastruktur?",
      linked_gap_ids: ["G01"],
      linked_source_ids: ["S01"],
      assumptions: ["Pasar bereaksi efisien bentuk setengah kuat"],
      unresolved_terms: ["Event window CAR"],
    },
  ],
  candidate_objectives: [
    {
      id: "OBJ01",
      linked_question_id: "RQ01",
      objective: "Menganalisis dan membuktikan pengaruh konservatisme akuntansi terhadap Earnings Response Coefficient pada emiten infrastruktur.",
    },
  ],
  provisional_contributions: {
    empirical: ["Menyediakan bukti empiris kualitas laba sektor infrastruktur periode pembangunan masif."],
    practical: ["Bahan pertimbangan investor dalam membaca laporan keuangan beraset intensif."],
    academic: ["Memperkaya literatur akuntansi keuangan mengenai peran mitigasi konservatisme."],
    methodological: ["Menggunakan proksi akrual non-operasional pada sektor spesifik."],
    prohibited_contribution_claims: ["Jangan klaim menemukan teori baru akuntansi."],
  },
  tentative_scope: {
    unit_of_analysis: "Perusahaan (Firm-level)",
    object_or_population: "Emiten sektor infrastruktur yang terdaftar di BEI",
    geography: "Indonesia",
    event_or_context: "Periode pelaporan keuangan 2018-2023",
    potential_period: "2018-2023",
    potential_data_sources: ["Laporan Keuangan Tahunan IDX", "Data Saham Yahoo Finance"],
    in_scope: ["Emiten infrastruktur terdaftar aktif"],
    out_of_scope: ["Emiten yang delisting atau laporan keuangan tidak lengkap"],
    unresolved_items: ["Penentuan kriteria outlier"],
  },
  working_title_previews: [
    {
      id: "T01",
      title: "Pengaruh Konservatisme Akuntansi terhadap Kualitas Laba pada Perusahaan Sektor Infrastruktur di Bursa Efek Indonesia",
      label: "GAMBARAN_BUKAN_JUDUL_FINAL",
      assumptions: ["Data lengkap 2018-2023"],
      missing_decisions: ["Variabel kontrol tambahan"],
    },
  ],
  background_map: [
    {
      order: 1,
      function: "SPECIFIC_CONTEXT",
      key_message: "Konteks peran strategis pelaporan keuangan emiten sektor infrastruktur di Indonesia.",
      safe_claims: [{ claim_id: "CLM01", statement: "Sektor infrastruktur membutuhkan modal besar dan pelaporan transparan.", source_ids: ["S01"] }],
      prohibited_claims: ["Jangan klaim seluruh emiten rugi"],
      transition_to_next: "Namun transparansi ini menghadapi tantangan volatilitas pasar.",
      missing_information: [],
      readiness: "READY",
    },
    {
      order: 2,
      function: "OBJECT_AND_SCOPE",
      key_message: "Karakteristik emiten infrastruktur dengan aset tetap tinggi dan leverage signifikan.",
      safe_claims: [{ claim_id: "CLM02", statement: "Struktur aset infrastruktur didominasi aset jangka panjang.", source_ids: ["S01"] }],
      prohibited_claims: [],
      transition_to_next: "Struktur aset ini memengaruhi pembentukan laba akuntansi.",
      missing_information: [],
      readiness: "READY",
    },
    {
      order: 3,
      function: "EMPIRICAL_PHENOMENON",
      key_message: "Fenomena penurunan konsistensi respon laba pasar (ERC) pada periode pengamatan.",
      safe_claims: [{ claim_id: "CLM03", statement: "Terjadi variasi signifikan pada respon pasar terhadap laba.", source_ids: ["S01"] }],
      prohibited_claims: [],
      transition_to_next: "Variasi respon ini mengindikasikan adanya keraguan atas kualitas laba.",
      missing_information: [],
      readiness: "READY",
    },
    {
      order: 4,
      function: "WHY_IT_IS_A_PROBLEM",
      key_message: "Mengapa penurunan respon laba menjadi persoalan kredibilitas informasi bagi investor.",
      safe_claims: [{ claim_id: "CLM04", statement: "Respon laba rendah mencerminkan ketidakpastian arus kas masa depan.", source_ids: ["S01"] }],
      prohibited_claims: [],
      transition_to_next: "Literatur akuntansi menawarkan mekanisme kehati-hatian untuk mengatasi ini.",
      missing_information: [],
      readiness: "READY",
    },
    {
      order: 5,
      function: "PRIOR_RESEARCH",
      key_message: "Tinjauan studi terdahulu mengenai hubungan konservatisme dan respon laba.",
      safe_claims: [{ claim_id: "CLM05", statement: "Konservatisme terbukti meningkatkan reliabilitas laba.", source_ids: ["S01", "S02"] }],
      prohibited_claims: [],
      transition_to_next: "Akan tetapi hasil empiris masih menunjukkan ketidakkonsistenan.",
      missing_information: [],
      readiness: "READY",
    },
    {
      order: 6,
      function: "KNOWLEDGE_LIMIT_OR_GAP",
      key_message: "Keterbatasan pengetahuan mengenai peran konservatisme saat emiten memiliki tingkat leverage tinggi.",
      safe_claims: [{ claim_id: "CLM06", statement: "Studi sebelumnya menghasilkan temuan leverage yang kontradiktif.", source_ids: ["S01", "S02"] }],
      prohibited_claims: [],
      transition_to_next: "Oleh karena itu diperlukan pengujian terfokus pada sektor infrastruktur.",
      missing_information: [],
      readiness: "READY",
    },
    {
      order: 7,
      function: "URGENCY_AND_DIRECTION",
      key_message: "Urgensi dan arah penelitian untuk menguji kembali peran konservatisme pada emiten infrastruktur.",
      safe_claims: [{ claim_id: "CLM07", statement: "Penelitian ini fokus menguji peran mitigasi konservatisme pada ERC.", source_ids: ["S01"] }],
      prohibited_claims: [],
      transition_to_next: "Bagian berikutnya merumuskan pertanyaan penelitian formal.",
      missing_information: [],
      readiness: "READY",
    },
  ],
  evidence_ledger: [
    { claim_id: "CLM01", claim: "Sektor modal besar", source_id: "S01", evidence_location: "Hal 2", original_context: "BEI", bab1_function: "Konteks", usage_limit: "Hanya konteks" },
    { claim_id: "CLM02", claim: "Aset jangka panjang", source_id: "S01", evidence_location: "Hal 3", original_context: "BEI", bab1_function: "Objek", usage_limit: "Hanya latar belakang" },
    { claim_id: "CLM03", claim: "Variasi ERC", source_id: "S01", evidence_location: "Hal 4", original_context: "BEI", bab1_function: "Fenomena", usage_limit: "Klaim fenomena" },
    { claim_id: "CLM04", claim: "Respon laba rendah", source_id: "S01", evidence_location: "Hal 5", original_context: "BEI", bab1_function: "Masalah", usage_limit: "Masalah praktis" },
    { claim_id: "CLM05", claim: "Konservatisme & ERC", source_id: "S01", evidence_location: "Hal 7", original_context: "BEI", bab1_function: "Literatur", usage_limit: "Studi terdahulu" },
    { claim_id: "CLM06", claim: "Inkonsistensi leverage", source_id: "S02", evidence_location: "Hal 8", original_context: "BEI", bab1_function: "Gap", usage_limit: "Kandidat gap" },
    { claim_id: "CLM07", claim: "Fokus arah penelitian", source_id: "S01", evidence_location: "Hal 9", original_context: "BEI", bab1_function: "Arah", usage_limit: "Arah penelitian" },
  ],
  feasibility_summary: {
    confirmed_data: ["Laporan keuangan IDX 2018-2023"],
    unconfirmed_data: [],
    unavailable_data: [],
    implications: ["Dapat dilanjutkan ke penyusunan Bab 1"],
  },
  supervisor_questions: ["Apakah model regresi data panel fixed effect atau random effect yang lebih disukai?"],
  unresolved_decisions: ["Event window CAR 3 hari vs 5 hari"],
  prohibited_claims: ["Jangan klaim sudah membuktikan hubungan sebab akibat mutlak"],
  recovery_actions: [],
};

test("Test F1: Parses Bab1FoundationV1 block successfully", () => {
  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(sampleValidFoundationJson, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_READY",
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  assert.strictEqual(res.data.foundation_status, "BAB1_READY");
  assert.strictEqual(res.data.background_map.length, 7);
  assert.strictEqual(res.data.candidate_research_questions.length, 1);
  assert.strictEqual(res.data.candidate_objectives.length, 1);
});

test("Test F2: Deterministic Status Reconciliation downgrades to BAB1_BLOCKED if data is DATA_BLOCKED", () => {
  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(sampleValidFoundationJson, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_BLOCKED",
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.foundation_status, "BAB1_BLOCKED");
});

test("Test F3: Deterministic Status Reconciliation caps at BAB1_CONDITIONAL if data is DATA_CONDITIONAL", () => {
  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(sampleValidFoundationJson, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_CONDITIONAL",
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.foundation_status, "BAB1_CONDITIONAL");
});

// -----------------------------------------------------------------------------
// Test G: Repair Prompt Generators & Analyzers
// -----------------------------------------------------------------------------
test("Test G1: Generates repair prompts for 4A and 4B", () => {
  const fixFormat4A = generateBedahFixFormatPrompt4A("invalid text", ["Trailing comma"]);
  assert.ok(fixFormat4A.includes("=== BEGIN SKRIFLOW_DIRECTION_V2 ==="));
  assert.ok(fixFormat4A.includes("Trailing comma"));

  const fixStruct4A = generateBedahFixStructurePrompt4A("invalid text", ["directions kurang"]);
  assert.ok(fixStruct4A.includes("=== BEGIN SKRIFLOW_DIRECTION_V2 ==="));
  assert.ok(fixStruct4A.includes("directions kurang"));

  const fixFormat4B = generateBab1FoundationFixFormatPrompt("invalid text", ["JSON fence"]);
  assert.ok(fixFormat4B.includes("=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ==="));
  assert.ok(fixFormat4B.includes("JSON fence"));

  const fixStruct4B = generateBab1FoundationFixStructurePrompt("invalid text", ["background_map kurang"]);
  assert.ok(fixStruct4B.includes("=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ==="));
  assert.ok(fixStruct4B.includes("background_map kurang"));

  const analysis4B = analyzeBedahPrompt4B({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    calibratedPhenomenon: sampleValidV2Json.calibrated_phenomenon,
    selectedDirection: sampleValidV2Json.directions[0],
    associatedGaps: sampleValidV2Json.candidate_gaps,
    relevantLiteratureEvidence: "[S01] Viesta (2023)",
    feasibilityState: {
      directionId: "D01",
      answers: {},
      accessNotes: "notes",
      computedReadiness: "DATA_READY",
      lastUpdated: new Date().toISOString(),
    },
  });
  assert.strictEqual(analysis4B.status, "SAFE");
});

// -----------------------------------------------------------------------------
// Test H: Specific Acceptance Tests from Academic QC Patch Specification
// -----------------------------------------------------------------------------
test("Test H1: Rejects V2 with 1 direction (strictly mandates 2–4 directions)", () => {
  const singleDirJson = {
    ...sampleValidV2Json,
    directions: [sampleValidV2Json.directions[0]],
  };
  const rawOutput = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(singleDirJson, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(rawOutput);
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes("2–4 arah"));
});

test("Test H2: Parses full V2 with evidence_basis, measurement_focus, claim_boundary, gap_status, and source_weights", () => {
  const richV2Json = {
    ...sampleValidV2Json,
    evidence_basis: {
      observed_phenomenon: ["Fluktuasi ERC pada emiten infrastruktur 2017-2021."],
      prior_study_findings: ["Viesta (2023) menemukan pengaruh konservatisme pada ERC."],
      not_yet_established: ["Apakah leverage mendistorsi hubungan saat restrukturisasi aset."],
    },
    source_weights: [
      { source_id: "S01", weight: "UTAMA", reason: "Artikel peer-reviewed full-text" },
      { source_id: "S02", weight: "PENDUKUNG", reason: "Working paper pendukung" },
    ],
    candidate_gaps: [
      {
        ...sampleValidV2Json.candidate_gaps[0],
        gap_status: "CUKUP_DIDUKUNG",
      },
    ],
    directions: [
      {
        ...sampleValidV2Json.directions[0],
        conditional_badge: "Paling Dekat dengan Fenomena",
        measurement_focus: {
          primary_outcome: "Earnings Response Coefficient (ERC)",
          supporting_outcome: null,
          non_equivalence_note: "ERC tidak dapat disamakan dengan return saham biasa atau harga saham.",
        },
        claim_boundary: {
          safe_to_say: ["Beberapa studi melaporkan respon pasar yang berbeda pada konteks berbeda."],
          not_safe_to_say: ["Belum aman menyatakan publikasi laba menyebabkan perubahan harga saham."],
        },
      },
      {
        ...sampleValidV2Json.directions[1],
        conditional_badge: "Data Perlu Dicek",
        measurement_focus: {
          primary_outcome: "Kualitas Laba (Discretionary Accruals)",
          supporting_outcome: "ERC",
          non_equivalence_note: "Discretionary accruals dan ERC adalah konstruk berbeda.",
        },
        claim_boundary: {
          safe_to_say: ["Tata kelola diuji terhadap kualitas pelaporan keuangan."],
          not_safe_to_say: ["Belum aman mengklaim tata kelola menjamin harga saham naik."],
        },
      },
    ],
  };

  const rawOutput = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(richV2Json, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(rawOutput);
  assert.strictEqual(res.success, true);
  assert.ok(res.dataV2);
  assert.strictEqual(res.dataV2.evidence_basis.observed_phenomenon.length, 1);
  assert.strictEqual(res.dataV2.source_weights[0].weight, "UTAMA");
  assert.strictEqual(res.dataV2.candidate_gaps[0].gap_status, "CUKUP_DIDUKUNG");
  assert.strictEqual(res.dataV2.directions[0].conditional_badge, "Paling Dekat dengan Fenomena");
  assert.strictEqual(res.dataV2.directions[0].measurement_focus.primary_outcome, "Earnings Response Coefficient (ERC)");
  assert.strictEqual(res.dataV2.directions[0].claim_boundary.safe_to_say.length, 1);
  assert.strictEqual(res.dataV2.directions[0].claim_boundary.not_safe_to_say.length, 1);
});

test("Test H3: Backward compatibility allows older V2 without new fields to parse with defaults", () => {
  // sampleValidV2Json doesn't have evidence_basis, measurement_focus, claim_boundary, etc.
  const rawOutput = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(sampleValidV2Json, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(rawOutput);
  assert.strictEqual(res.success, true);
  assert.ok(res.dataV2);
  // Default values populated: DIDUKUNG_DALAM_PAKET correctly maps to CUKUP_DIDUKUNG
  assert.strictEqual(res.dataV2.candidate_gaps[0].gap_status, "CUKUP_DIDUKUNG");
  assert.strictEqual(res.dataV2.directions[0].measurement_focus.primary_outcome, "Earnings Response Coefficient");
  assert.ok(Array.isArray(res.dataV2.directions[0].claim_boundary.safe_to_say));
});

test("Test REG1: anchor_source_ids dikarang (tidak ada di Source Register) ditolak", () => {
  const withRegister = {
    ...sampleValidV2Json,
    source_weights: [
      { source_id: "S3", weight: "UTAMA" },
      { source_id: "S6", weight: "PENDUKUNG" },
    ],
    directions: sampleValidV2Json.directions.map((d, i) => ({
      ...d,
      anchor_source_ids: i === 0 ? ["S3"] : ["S99"],
    })),
  };
  const raw = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(withRegister, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(raw);
  assert.strictEqual(res.success, false);
  assert.ok(
    res.errorDetails.some((d) => d.includes("S99") && d.includes("tidak ada di Source Register")),
    `errorDetails harus menyebut S99 tidak ada di register, dapat: ${JSON.stringify(res.errorDetails)}`,
  );
});

test("Test REG2: anchor_source_ids yang ada di Source Register tetap diterima (dan register bentuk [] / lowercase cocok)", () => {
  const withRegister = {
    ...sampleValidV2Json,
    source_weights: [
      { source_id: "[s3]", weight: "UTAMA" },
      { source_id: "S6", weight: "PENDUKUNG" },
    ],
    directions: sampleValidV2Json.directions.map((d, i) => ({
      ...d,
      anchor_source_ids: i === 0 ? ["S3", "S6"] : ["s6"],
    })),
  };
  const raw = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(withRegister, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(raw);
  assert.strictEqual(res.success, true, `harus lolos, error: ${res.error}`);
  assert.deepStrictEqual(res.dataV2.directions[0].anchor_source_ids, ["S3", "S6"]);
});

test("Test REG3: tanpa source_weights (payload lama) anchor_source_ids tidak divalidasi ke register", () => {
  // sampleValidV2Json tidak punya source_weights; arahnya memakai ID yang tidak ada di register mana pun.
  const raw = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(sampleValidV2Json, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res = parseBedahTransfer(raw);
  assert.strictEqual(res.success, true, `kompatibilitas ke belakang harus tetap jalan, error: ${res.error}`);
});

test("Test H4: Non-critical question marked TIDAK_TERSEDIA produces DATA_CONDITIONAL, not DATA_BLOCKED", () => {
  const questions = [
    { id: "Q01", question: "Data kritis lapkeu", critical: true, related_data_need: "Lapkeu" },
    { id: "Q02", question: "Data nonkritis tambahan", critical: false, related_data_need: "Tambahan" },
  ];
  const answers = {
    Q01: "SUDAH_DIPASTIKAN",
    Q02: "TIDAK_TERSEDIA", // Non-critical unavailable
  };
  const readiness = calculateDataReadiness(questions, answers, "Catatan akses ada");
  assert.strictEqual(readiness, "DATA_CONDITIONAL");
});

test("Test H5: Critical question marked TIDAK_TERSEDIA produces DATA_BLOCKED", () => {
  const questions = [
    { id: "Q01", question: "Data kritis lapkeu", critical: true, related_data_need: "Lapkeu" },
    { id: "Q02", question: "Data nonkritis tambahan", critical: false, related_data_need: "Tambahan" },
  ];
  const answers = {
    Q01: "TIDAK_TERSEDIA", // Critical unavailable
    Q02: "SUDAH_DIPASTIKAN",
  };
  const readiness = calculateDataReadiness(questions, answers, "Catatan akses");
  assert.strictEqual(readiness, "DATA_BLOCKED");
});

test("Test H6: Assemble Prompt 4B injects measurement_focus, claim_boundary, and gap_status", () => {
  const prompt4B = assembleBedahPrompt4B({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    calibratedPhenomenon: sampleValidV2Json.calibrated_phenomenon,
    selectedDirection: {
      ...sampleValidV2Json.directions[0],
      measurement_focus: {
        primary_outcome: "Earnings Response Coefficient (ERC)",
        supporting_outcome: null,
        non_equivalence_note: "ERC tidak setara dengan return saham biasa.",
      },
      claim_boundary: {
        safe_to_say: ["Respon pasar berbeda pada konteks berbeda."],
        not_safe_to_say: ["Jangan simpulkan laba menyebabkan harga naik."],
      },
    },
    associatedGaps: [
      {
        ...sampleValidV2Json.candidate_gaps[0],
        gap_status: "CUKUP_DIDUKUNG",
      },
    ],
    relevantLiteratureEvidence: "[S01] Viesta (2023)",
    feasibilityState: {
      directionId: "D01",
      answers: { Q01: "SUDAH_DIPASTIKAN" },
      accessNotes: "Data IDX",
      computedReadiness: "DATA_READY",
      lastUpdated: new Date().toISOString(),
    },
  });

  assert.ok(prompt4B.includes("Fokus Pengukuran (Measurement Focus):"));
  assert.ok(prompt4B.includes("Ukuran/Hasil Utama: Earnings Response Coefficient (ERC)"));
  assert.ok(prompt4B.includes("ERC tidak setara dengan return saham biasa."));
  assert.ok(prompt4B.includes("Batas Klaim Aman (Claim Boundary):"));
  assert.ok(prompt4B.includes("Respon pasar berbeda pada konteks berbeda."));
  assert.ok(prompt4B.includes("Jangan simpulkan laba menyebabkan harga naik."));
  assert.ok(prompt4B.includes("Status Gap: CUKUP_DIDUKUNG"));
});

// -----------------------------------------------------------------------------
// Test I: Continuation Micro-Patch Acceptance Tests (Patch 1 - 6)
// -----------------------------------------------------------------------------
test("Test I1: Prompt 4B carries [KLASIFIKASI BOBOT SUMBER], preserves IDs, and defaults unclassified to PERLU_DIPERIKSA", () => {
  const prompt4B = assembleBedahPrompt4B({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    calibratedPhenomenon: sampleValidV2Json.calibrated_phenomenon,
    selectedDirection: sampleValidV2Json.directions[0],
    associatedGaps: sampleValidV2Json.candidate_gaps,
    relevantLiteratureEvidence: "[S01] Viesta (2023)\n[ID-99] Unweighted Source",
    feasibilityState: {
      directionId: "D01",
      answers: { Q01: "SUDAH_DIPASTIKAN", Q02: "SUDAH_DIPASTIKAN" },
      accessNotes: "Data IDX",
      computedReadiness: "DATA_READY",
      lastUpdated: new Date().toISOString(),
    },
    sourceWeights: [
      { source_id: "S01", weight: "UTAMA", reason: "Jurnal peer-reviewed terindeks" },
      { source_id: "S02", weight: "PENDUKUNG", reason: "Working paper" },
    ],
  });

  assert.ok(prompt4B.includes("[KLASIFIKASI BOBOT SUMBER]"));
  assert.ok(prompt4B.includes("- [S01] — [UTAMA]"));
  assert.ok(prompt4B.includes("- [S02] — [PENDUKUNG]"));
  // Source S01 preserved exactly
  assert.ok(prompt4B.includes("S01"));
  // Rules in prompt
  assert.ok(prompt4B.includes("Klaim utama Bab 1 harus ditopang minimal satu sumber UTAMA"));
  assert.ok(prompt4B.includes("Sumber PENDUKUNG boleh digunakan untuk konteks atau penguat"));
  assert.ok(prompt4B.includes("Sumber PERLU_DIPERIKSA tidak boleh digunakan untuk klaim siap tulis"));
  // Academic language guideline without 'santai'
  assert.ok(prompt4B.includes("Gunakan bahasa ilmiah mahasiswa S1 yang jelas, natural, runtut, dan baku"));
  assert.ok(!prompt4B.includes("santai namun baku"));
});

test("Test I2: EMPIRICAL_FACT without sources is rejected", () => {
  const invalidFoundation = JSON.parse(JSON.stringify(sampleValidFoundationJson));
  invalidFoundation.background_map[0].safe_claims[0].claim_type = "EMPIRICAL_FACT";
  invalidFoundation.background_map[0].safe_claims[0].source_ids = [];

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(invalidFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw);
  assert.strictEqual(res.success, false);
  assert.ok(res.errorDetails.some((d) => d.includes("Fakta empiris wajib memiliki minimal satu source_id")));
});

test("Test I3: CROSS_SOURCE_SYNTHESIS with fewer than 2 unique sources is rejected", () => {
  const invalidFoundation = JSON.parse(JSON.stringify(sampleValidFoundationJson));
  invalidFoundation.background_map[4].safe_claims[0].claim_type = "CROSS_SOURCE_SYNTHESIS";
  invalidFoundation.background_map[4].safe_claims[0].source_ids = ["S01"]; // Only 1 source!

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(invalidFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw);
  assert.strictEqual(res.success, false);
  assert.ok(res.errorDetails.some((d) => d.includes("Sintesis lintas sumber wajib memuat minimal 2 source_id unik")));
});

test("Test I4: RESEARCHER_DECISION with source_ids: [] and decision_basis is accepted and not forced into ledger", () => {
  const validWithDecision = JSON.parse(JSON.stringify(sampleValidFoundationJson));
  // Replace claim in urgency section with researcher decision
  validWithDecision.background_map[6].safe_claims = [
    {
      claim_id: "DEC01",
      statement: "Peneliti membatasi objek pada emiten infrastruktur BUMN.",
      claim_type: "RESEARCHER_DECISION",
      source_ids: [],
      decision_basis: "Dibatasi berdasarkan ketersediaan data sekunder di BEI.",
    },
  ];
  // DEC01 is NOT in evidence_ledger!

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(validWithDecision, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  const decClaim = res.data.background_map[6].safe_claims[0];
  assert.strictEqual(decClaim.claim_type, "RESEARCHER_DECISION");
  assert.strictEqual(decClaim.source_ids.length, 0);
  assert.strictEqual(decClaim.decision_basis, "Dibatasi berdasarkan ketersediaan data sekunder di BEI.");
});

test("Test I5: Legacy single source_id in evidence_ledger is normalized to source_ids array", () => {
  const legacyFoundation = JSON.parse(JSON.stringify(sampleValidFoundationJson));
  legacyFoundation.evidence_ledger[0] = {
    claim_id: "CLM01",
    claim: "Sektor modal besar",
    source_id: "S01", // Legacy single source_id
    evidence_location: "Hal 2",
    original_context: "BEI",
    bab1_function: "Konteks",
    usage_limit: "Hanya konteks",
  };
  delete legacyFoundation.evidence_ledger[0].source_ids;

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(legacyFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  assert.deepStrictEqual(res.data.evidence_ledger[0].source_ids, ["S01"]);
});

test("Test I6: Evidence Ledger supports multiple sources and source_weights for synthesis claim", () => {
  const multiSourceFoundation = JSON.parse(JSON.stringify(sampleValidFoundationJson));
  multiSourceFoundation.evidence_ledger[4] = {
    claim_id: "CLM05",
    claim: "Konservatisme berhubungan positif dengan reliabilitas laba",
    claim_type: "CROSS_SOURCE_SYNTHESIS",
    source_ids: ["S01", "S02"],
    source_weights: [
      { source_id: "S01", weight: "UTAMA" },
      { source_id: "S02", weight: "PENDUKUNG" },
    ],
    evidence_location: "Hal 7 & Hal 12",
    original_context: "BEI 2017-2021",
    bab1_function: "Literatur",
    usage_limit: "Studi terdahulu",
    support_status: "READY_TO_DRAFT",
    decision_basis: null,
  };

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(multiSourceFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  assert.strictEqual(res.data.evidence_ledger[4].source_ids.length, 2);
  assert.strictEqual(res.data.evidence_ledger[4].source_weights[0].weight, "UTAMA");
  assert.strictEqual(res.data.evidence_ledger[4].support_status, "READY_TO_DRAFT");
});

test("Test I7: Claim supported ONLY by PERLU_DIPERIKSA cannot be READY_TO_DRAFT (downgraded to NEEDS_VERIFICATION)", () => {
  const checkFoundation = JSON.parse(JSON.stringify(sampleValidFoundationJson));
  checkFoundation.evidence_ledger[0] = {
    claim_id: "CLM01",
    claim: "Klaim dari sumber meragukan",
    claim_type: "EMPIRICAL_FACT",
    source_ids: ["S99"],
    source_weights: [{ source_id: "S99", weight: "PERLU_DIPERIKSA" }],
    evidence_location: "Hal 2",
    original_context: "BEI",
    bab1_function: "Konteks",
    usage_limit: "Hanya konteks",
    support_status: "READY_TO_DRAFT", // Disallowed with only PERLU_DIPERIKSA!
    decision_basis: null,
  };

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(checkFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  // Must be downgraded
  assert.strictEqual(res.data.evidence_ledger[0].support_status, "NEEDS_VERIFICATION");
});

test("Test I8: Without Tool 2 phenomenon (LITERATURE_INDICATED), foundation is capped at BAB1_CONDITIONAL and EMPIRICAL_PHENOMENON is NEEDS_VERIFICATION", () => {
  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(sampleValidFoundationJson, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "LITERATURE_INDICATED", // No Tool 2 phenomenon!
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  // Capped at BAB1_CONDITIONAL even if data is DATA_READY
  assert.strictEqual(res.data.foundation_status, "BAB1_CONDITIONAL");
  assert.strictEqual(res.data.phenomenon_basis_status, "LITERATURE_INDICATED");

  // Paragraph EMPIRICAL_PHENOMENON must be NEEDS_VERIFICATION
  const phenSec = res.data.background_map.find((sec) => sec.function === "EMPIRICAL_PHENOMENON");
  assert.ok(phenSec);
  assert.strictEqual(phenSec.readiness, "NEEDS_VERIFICATION");
  assert.ok(phenSec.missing_information.some((m) => m.includes("Tool 2")));
  assert.ok(res.data.recovery_actions.some((a) => a.includes("Tool 2")));
});

test("Test I9: With verified Tool 2 phenomenon (VERIFIED_REAL_WORLD), status BAB1_READY is allowed when data is ready", () => {
  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(sampleValidFoundationJson, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data);
  assert.strictEqual(res.data.foundation_status, "BAB1_READY");
  assert.strictEqual(res.data.phenomenon_basis_status, "VERIFIED_REAL_WORLD");
});

test("Test I10: Prompt 4A and 4B enforce 2–4 directions and consistent academic instructions", () => {
  const prompt4A = assembleBedahPrompt({
    prodi: "Akuntansi",
    areaEksplorasi: "Kualitas Laba",
    literatureEvidencePackage: "C. SOURCE REGISTER\n[S01] INTI\nD. MATRIKS BUKTI\n| B01 | S01 | Bukti |",
  });
  assert.ok(prompt4A.includes("2–4 alternatif arah penelitian"));
  assert.ok(!prompt4A.includes("3–4 alternatif arah"));
});

console.log("\n============================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================");

if (failed > 0) {
  process.exit(1);
}
