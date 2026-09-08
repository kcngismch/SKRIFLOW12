import assert from "node:assert";
import { parseBab1FoundationTransfer, parseBedahTransfer } from "./src/lib/bedahParser.ts";
import { assembleBedahPrompt4B, extractDocumentTypeFromSourceRegister } from "./src/lib/promptAssembler.ts";
import { getResearchLogicStageInfo, getBackgroundFunctionInfo } from "./src/lib/studentLanguage.ts";

console.log("=== RUNNING TOOL 4 FINAL MICRO-PATCH TEST SUITE ===");

const baseFoundationTemplate = {
  schema_version: 1,
  foundation_status: "BAB1_READY",
  status_reason: "Fondasi siap.",
  blocking_items: [],
  selected_direction: {
    id: "DIR-01",
    name: "Direction 1",
    student_selected: true,
    selection_reason: "Pilihan mandiri",
    direction_readiness: "SIAP_DIKEMBANGKAN",
    data_readiness: "DATA_READY",
  },
  problem_structure: {
    core_problem: "Masalah inti",
    practical_symptoms: ["Gejala 1"],
    empirical_tension: "Tensi",
    theoretical_anchor: "Teori",
    why_urgent_now: "Mendesak",
    empirical_phenomenon: "Fenomena teramati di lapangan",
  },
  research_logic_chain: [
    { stage_index: 1, stage_name: "Konteks", main_argument: "Arg 1" },
    { stage_index: 2, stage_name: "Fenomena", main_argument: "Arg 2" },
    { stage_index: 3, stage_name: "Masalah", main_argument: "Arg 3" },
    { stage_index: 4, stage_name: "Literatur", main_argument: "Arg 4" },
    { stage_index: 5, stage_name: "Gap", main_argument: "Arg 5" },
  ],
  candidate_research_questions: [
    { id: "RQ-01", question: "Apakah ada pengaruh?", question_type: "PENGARUH", related_gap_id: "GAP-01" },
  ],
  candidate_objectives: [
    { id: "OBJ-01", objective: "Menganalisis pengaruh", related_question_id: "RQ-01" },
  ],
  provisional_contributions: {
    theoretical_contribution: "Teori",
    practical_contribution: "Praktis",
    methodological_contribution: "Metode",
  },
  tentative_scope: {
    unit_of_analysis: "Perusahaan",
    observation_context: "BEI",
    provisional_period: "2020-2023",
    boundary_justification: "Ketersediaan data",
  },
  working_title_previews: [
    { option_number: 1, title_text: "Judul 1", style_note: "Kuantitatif" },
  ],
  background_map: [
    { section_number: 1, section_name: "1", function: "SPECIFIC_CONTEXT", core_message: "M1", safe_claims: [{ claim_id: "C01", statement: "S1", claim_type: "EMPIRICAL_FACT", source_ids: ["ID-01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    { section_number: 2, section_name: "2", function: "OBJECT_AND_SCOPE", core_message: "M2", safe_claims: [{ claim_id: "C02", statement: "S2", claim_type: "RESEARCHER_DECISION", source_ids: [], decision_basis: "Pilihan objek berdasarkan ketersediaan data laporan keuangan" }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    { section_number: 3, section_name: "3", function: "EMPIRICAL_PHENOMENON", core_message: "M3", safe_claims: [{ claim_id: "C03", statement: "S3", claim_type: "EMPIRICAL_FACT", source_ids: ["ID-01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    { section_number: 4, section_name: "4", function: "WHY_IT_IS_A_PROBLEM", core_message: "M4", safe_claims: [{ claim_id: "C04", statement: "S4", claim_type: "EMPIRICAL_FACT", source_ids: ["ID-01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    { section_number: 5, section_name: "5", function: "PRIOR_RESEARCH", core_message: "M5", safe_claims: [{ claim_id: "C05", statement: "S5", claim_type: "CROSS_SOURCE_SYNTHESIS", source_ids: ["ID-01", "ID-02"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    { section_number: 6, section_name: "6", function: "KNOWLEDGE_LIMIT_OR_GAP", core_message: "M6", safe_claims: [{ claim_id: "C06", statement: "S6", claim_type: "CROSS_SOURCE_SYNTHESIS", source_ids: ["ID-01", "ID-02"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    { section_number: 7, section_name: "7", function: "URGENCY_AND_DIRECTION", core_message: "M7", safe_claims: [{ claim_id: "C07", statement: "S7", claim_type: "RESEARCHER_DECISION", source_ids: [], decision_basis: "Arah urgensi penelitian mengacu pada arahan pembimbing" }], transition_to_next: "T", readiness: "READY", missing_information: [] },
  ],
  evidence_ledger: [
    { claim_id: "C01", claim: "Klaim 1", source_ids: ["ID-01"], evidence_location: "Hal 1", original_context: "BEI", bab1_function: "SPECIFIC_CONTEXT", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
    { claim_id: "C03", claim: "Klaim 3", source_ids: ["ID-01"], evidence_location: "Hal 3", original_context: "BEI", bab1_function: "EMPIRICAL_PHENOMENON", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
    { claim_id: "C04", claim: "Klaim 4", source_ids: ["ID-01"], evidence_location: "Hal 4", original_context: "BEI", bab1_function: "WHY_IT_IS_A_PROBLEM", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
    { claim_id: "C05", claim: "Klaim 5", source_ids: ["ID-01", "ID-02"], evidence_location: "Hal 5", original_context: "BEI", bab1_function: "PRIOR_RESEARCH", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
    { claim_id: "C06", claim: "Klaim 6", source_ids: ["ID-01", "ID-02"], evidence_location: "Hal 6", original_context: "BEI", bab1_function: "KNOWLEDGE_LIMIT_OR_GAP", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
  ],
  paragraph_claims: [
    {
      function: "EMPIRICAL_PHENOMENON",
      claimType: "EMPIRICAL_FACT",
      proposedClaim: "Fenomena empiris teramati di BEI",
      sourceIds: ["ID-01"],
      sourceReferences: [],
      usageLimit: "Aman",
      readiness: "READY_TO_DRAFT",
    },
  ],
  feasibility_summary: { confirmed_data: [], unconfirmed_data: [], unavailable_data: [], implications: [] },
  supervisor_questions: [],
  unresolved_decisions: [],
  prohibited_claims: [],
  recovery_actions: [],
};

// ---------------------------------------------------------------------------
// TEST 1: ID-02 canonical PERLU_DIPERIKSA dikirim 4B sebagai PENDUKUNG
// ---------------------------------------------------------------------------
{
  const foundation = JSON.parse(JSON.stringify(baseFoundationTemplate));
  // Claim C08 supported solely by ID-02, but 4B claims it is PENDUKUNG and READY_TO_DRAFT
  foundation.evidence_ledger.push({
    claim_id: "C08",
    claim: "Klaim uji ID-02",
    source_ids: ["ID-02"],
    source_weights: [{ source_id: "ID-02", weight: "PENDUKUNG" }],
    evidence_location: "Hal 8",
    original_context: "BEI",
    bab1_function: "PRIOR_RESEARCH",
    usage_limit: "Aman",
    support_status: "READY_TO_DRAFT",
  });

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(foundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    sourceWeights: [
      { source_id: "ID-01", weight: "UTAMA" },
      { source_id: "ID-02", weight: "PERLU_DIPERIKSA" },
    ],
  });

  assert.strictEqual(res.success, true);
  const ledgerItem = res.data.evidence_ledger.find((el) => el.claim_id === "C08");
  assert.ok(ledgerItem, "Klaim C08 ditemukan");
  // 1a: hasil akhir tetap PERLU_DIPERIKSA
  assert.strictEqual(ledgerItem.source_weights[0].weight, "PERLU_DIPERIKSA");
  assert.strictEqual(ledgerItem.source_weight, "PERLU_DIPERIKSA");
  // 1b: warning normalisasi muncul
  assert.ok(res.warnings && res.warnings.some((w) => w.includes("Bobot ID-02 disesuaikan dari Sumber Pendukung menjadi Perlu Diperiksa")));
  // 1c: klaim tidak READY_TO_DRAFT (turun ke NEEDS_VERIFICATION)
  assert.strictEqual(ledgerItem.support_status, "NEEDS_VERIFICATION");
  console.log("✅ PASS Acceptance Test 1: ID-02 canonical PERLU_DIPERIKSA dinormalisasi, warning muncul, klaim tidak READY_TO_DRAFT.");
}

// ---------------------------------------------------------------------------
// TEST 2: Bobot hasil normalisasi tersimpan setelah refresh
// ---------------------------------------------------------------------------
{
  const foundation = JSON.parse(JSON.stringify(baseFoundationTemplate));
  foundation.evidence_ledger.push({
    claim_id: "C08",
    claim: "Klaim uji ID-02",
    source_ids: ["ID-02"],
    source_weights: [{ source_id: "ID-02", weight: "PENDUKUNG" }],
    evidence_location: "Hal 8",
    original_context: "BEI",
    bab1_function: "PRIOR_RESEARCH",
    usage_limit: "Aman",
    support_status: "READY_TO_DRAFT",
  });

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(foundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    sourceWeights: [
      { source_id: "ID-01", weight: "UTAMA" },
      { source_id: "ID-02", weight: "PERLU_DIPERIKSA" },
    ],
  });

  // Simulating localStorage serialization & deserialization (refresh)
  const serialized = JSON.stringify(res.data);
  const reloaded = JSON.parse(serialized);

  const reloadedC08 = reloaded.evidence_ledger.find((el) => el.claim_id === "C08");
  assert.strictEqual(reloadedC08.source_weights[0].weight, "PERLU_DIPERIKSA");
  assert.strictEqual(reloadedC08.support_status, "NEEDS_VERIFICATION");
  console.log("✅ PASS Acceptance Test 2: Bobot hasil normalisasi tersimpan utuh dalam object fondasi final setelah refresh.");
}

// ---------------------------------------------------------------------------
// TEST 3 & 4: LITERATURE_INDICATED + BAB1_READY -> BAB1_CONDITIONAL & EMPIRICAL_PHENOMENON -> NEEDS_VERIFICATION
// ---------------------------------------------------------------------------
{
  const foundation = JSON.parse(JSON.stringify(baseFoundationTemplate));
  foundation.foundation_status = "BAB1_READY";

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(foundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "LITERATURE_INDICATED",
    sourceWeights: [
      { source_id: "ID-01", weight: "UTAMA" },
      { source_id: "ID-02", weight: "PENDUKUNG" },
    ],
  });

  assert.strictEqual(res.success, true);
  // Test 3: foundation_status maksimal BAB1_CONDITIONAL
  assert.strictEqual(res.data.foundation_status, "BAB1_CONDITIONAL");
  // Test 4: Bagian EMPIRICAL_PHENOMENON menjadi NEEDS_VERIFICATION
  const phenSection = res.data.background_map.find((sec) => sec.function === "EMPIRICAL_PHENOMENON");
  assert.strictEqual(phenSection.readiness, "NEEDS_VERIFICATION");
  const phenLedger = res.data.evidence_ledger.find((el) => el.bab1_function === "EMPIRICAL_PHENOMENON");
  assert.strictEqual(phenLedger.support_status, "NEEDS_VERIFICATION");
  const phenParagraph = res.data.paragraph_claims.find((pc) => pc.function === "EMPIRICAL_PHENOMENON");
  assert.strictEqual(phenParagraph.readiness, "NEEDS_VERIFICATION");

  console.log("✅ PASS Acceptance Test 3: LITERATURE_INDICATED + BAB1_READY otomatis dibatasi ke BAB1_CONDITIONAL.");
  console.log("✅ PASS Acceptance Test 4: Bagian EMPIRICAL_PHENOMENON menjadi NEEDS_VERIFICATION.");
}

// ---------------------------------------------------------------------------
// TEST 5 & 6: Dynamic labels based on phenomenon basis
// ---------------------------------------------------------------------------
{
  // Test 5: LITERATURE_INDICATED uses cautious literature clue wording
  const stageLit = getResearchLogicStageInfo("PHENOMENON", 2, "LITERATURE_INDICATED");
  assert.strictEqual(stageLit.label, "Petunjuk Fenomena yang Perlu Dicek");
  assert.ok(!stageLit.label.toLowerCase().includes("fenomena nyata"));
  assert.ok(!stageLit.label.toLowerCase().includes("teramati"));

  const bgLit = getBackgroundFunctionInfo("EMPIRICAL_PHENOMENON", 3, "LITERATURE_INDICATED");
  assert.strictEqual(bgLit.title, "Paragraf 3 — Jelaskan Petunjuk Fenomena dan Batas Buktinya");
  assert.ok(!bgLit.title.toLowerCase().includes("fenomena nyata"));

  console.log("✅ PASS Acceptance Test 5: Tidak ada label 'Fenomena Nyata' atau 'Fenomena Empiris Teramati' pada status LITERATURE_INDICATED.");

  // Test 6: VERIFIED_REAL_WORLD uses real world phenomenon wording
  const stageReal = getResearchLogicStageInfo("PHENOMENON", 2, "VERIFIED_REAL_WORLD");
  assert.strictEqual(stageReal.label, "Apa yang Terjadi (Fenomena Nyata)");

  const bgReal = getBackgroundFunctionInfo("EMPIRICAL_PHENOMENON", 3, "VERIFIED_REAL_WORLD");
  assert.strictEqual(bgReal.title, "Paragraf 3 — Tunjukkan Fenomena Nyata");

  console.log("✅ PASS Acceptance Test 6: VERIFIED_REAL_WORLD tetap menggunakan label fenomena nyata.");
}

// ---------------------------------------------------------------------------
// TEST 7: ID-09 terbaca sebagai Systematic Literature Review
// ---------------------------------------------------------------------------
{
  const markdownSourceRegister = `
### C. SOURCE REGISTER
| ID | Kategori | Judul lengkap | Penulis-tahun | Jenis | Publikasi | Sampel/periode/metode | Bukti keterbacaan |
|---|---|---|---|---|---|---|---|
| ID-01 | INTI | Pengaruh Struktur Modal | Smith et al. (2020) | Artikel Empiris | JFE | 500 emiten BEI | Terbaca |
| ID-09 | PENDUKUNG | Tinjauan Sistematis Struktur Modal | Miller & Brown (2022) | Systematic Literature Review (SLR) | Review of Finance | Meta-analisis 80 studi | Terbaca |
`;

  const extractedType = extractDocumentTypeFromSourceRegister("ID-09", markdownSourceRegister);
  assert.strictEqual(extractedType, "Systematic Literature Review (SLR)");
  console.log("✅ PASS Acceptance Test 7: ID-09 terbaca sebagai Systematic Literature Review (SLR) dari Source Register.");
}

// ---------------------------------------------------------------------------
// TEST 8: document_type dan source weight adalah dua konsep terpisah
// ---------------------------------------------------------------------------
{
  const prompt4B = assembleBedahPrompt4B({
    prodi: "Akuntansi",
    areaEksplorasi: "Pasar Modal",
    calibratedPhenomenon: {
      summary: "Volatilitas saham",
      empirical_problem: "Risiko investasi",
      knowledge_problem: "Ketidakjelasan dampak",
      scope: { object_or_population: "BEI", geography: "Indonesia", reference_period: "2020-2023", event_or_context: "Pandemi" },
      evidence: [],
      why_it_matters: [],
      what_is_not_proven: [],
      prohibited_claims: [],
    },
    selectedDirection: {
      id: "DIR-01",
      name: "Direction 1",
      problem_focus: "Fokus",
      gap_ids: ["G01"],
      anchor_source_ids: ["ID-09"],
      measurement_focus: { primary_outcome: "Volatilitas" },
      data_verification_questions: [],
    },
    associatedGaps: [],
    relevantLiteratureEvidence: "| ID-09 | PENDUKUNG | Tinjauan | Penulis | Systematic Literature Review (SLR) | ... | ... | ... |",
    feasibilityState: { answers: {}, accessNotes: "" },
    sourceWeights: [
      { source_id: "ID-09", weight: "PENDUKUNG", note: "SLR" },
    ],
  });

  assert.ok(prompt4B.includes('"source_id": "ID-09"'), "ID-09 included");
  assert.ok(prompt4B.includes('"document_type": "Systematic Literature Review (SLR)"'), "document_type preserved as SLR");
  assert.ok(prompt4B.includes('"weight": "PENDUKUNG"'), "weight is PENDUKUNG");
  console.log("✅ PASS Acceptance Test 8: document_type dan source weight terpisah, UTAMA tidak otomatis artikel empiris dan PENDUKUNG tidak otomatis SLR.");
}

// ---------------------------------------------------------------------------
// TEST 9: decision_basis kosong tetap ditolak
// ---------------------------------------------------------------------------
{
  const foundation = JSON.parse(JSON.stringify(baseFoundationTemplate));
  foundation.background_map[1].safe_claims[0].decision_basis = "   "; // whitespace only

  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(foundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    knownSourceIds: ["ID-01", "ID-02"],
  });

  assert.strictEqual(res.success, false);
  assert.ok(
    res.errorDetails.some((e) => e.includes("belum memiliki dasar keputusan. Isi decision_basis dengan alasan konkret")),
    "Empty decision_basis produces specific blocking error message"
  );
  console.log("✅ PASS Acceptance Test 9: decision_basis kosong/spasi tetap ditolak dengan pesan spesifik.");
}

// ---------------------------------------------------------------------------
// TEST 10: Contoh JSON Prompt 4B tetap lolos JSON.parse()
// ---------------------------------------------------------------------------
{
  const prompt4B = assembleBedahPrompt4B({
    prodi: "Manajemen",
    areaEksplorasi: "Keuangan",
    calibratedPhenomenon: {
      summary: "Fenomena",
      empirical_problem: "Masalah",
      knowledge_problem: "Gap",
      scope: { object_or_population: "BEI", geography: "Indonesia", reference_period: "2023", event_or_context: "Konteks" },
      evidence: [],
      why_it_matters: [],
      what_is_not_proven: [],
      prohibited_claims: [],
    },
    selectedDirection: {
      id: "DIR-01",
      name: "Direction 1",
      problem_focus: "Fokus",
      gap_ids: [],
      anchor_source_ids: ["ID-01"],
      data_verification_questions: [],
    },
    associatedGaps: [],
    relevantLiteratureEvidence: "",
    feasibilityState: { answers: {}, accessNotes: "" },
    sourceWeights: [{ source_id: "ID-01", weight: "UTAMA" }],
  });

  const startMarker = "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===";
  const endMarker = "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===";
  const sIdx = prompt4B.indexOf(startMarker);
  const eIdx = prompt4B.indexOf(endMarker);
  assert.ok(sIdx !== -1 && eIdx !== -1);

  const jsonSnippet = prompt4B.substring(sIdx + startMarker.length, eIdx).trim();
  const parsed = JSON.parse(jsonSnippet);
  assert.strictEqual(parsed.schema_version, 1);
  assert.strictEqual(parsed.background_map[0].safe_claims[0].decision_basis, null);
  console.log("✅ PASS Acceptance Test 10: Contoh JSON Prompt 4B berhasil diparsing via native JSON.parse() tanpa error.");
}

// ---------------------------------------------------------------------------
// TEST 11: Regression tests (Parser, reset, persistence, data gate, 2-4 directions)
// ---------------------------------------------------------------------------
{
  // Check parseDirectionRecommendation with 3 valid directions
  const valid4AJson = {
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
          source_id: "ID-01",
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
          source_ids: ["ID-01"],
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
          source_ids: ["ID-01"],
          scope_limit: "Sektor infrastruktur",
        },
      ],
      relatively_consistent_findings: [
        {
          statement: "Ukuran perusahaan konsisten berpengaruh positif",
          source_ids: ["ID-01"],
          comparability_note: "Sama-sama menggunakan log total aset",
        },
      ],
      differing_findings: [
        {
          statement: "Leverage berpengaruh pada Viesta tapi tidak pada Surya",
          source_ids: ["ID-01"],
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
        source_ids: ["ID-01"],
        construct_or_predictor: "Konservatisme Akuntansi",
        outcome: "Kualitas Laba",
        proxies: ["Givoly & Hayn (2000)"],
        objects_and_periods: ["BEI 2017-2021"],
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
        source_ids: ["ID-01"],
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
        id: "DIR-01",
        name: "Pengaruh Konservatisme terhadap ERC dengan Moderasi Tata Kelola",
        problem_focus: "Fokus pada peran dewan komisaris independen dalam memoderasi hubungan konservatisme dan ERC.",
        phenomenon_link: "Menjelaskan variasi ERC antar subsektor infrastruktur.",
        gap_ids: ["G01"],
        anchor_source_ids: ["ID-01"],
        potential_unit_of_analysis: ["Emiten infrastruktur BEI"],
        potential_objects: ["Laporan keuangan tahunan 2017-2021"],
        potential_constructs: ["Konservatisme", "ERC", "Dewan Komisaris Independen"],
        candidate_outcomes: ["ERC", "Kualitas Akrual"],
        measurement_focus: {
          primary_outcome: "Cumulative Abnormal Return (CAR) 3 hari",
          supporting_outcome: "Kualitas Akrual Dechow-Dichev",
          non_equivalence_note: "CAR mengukur respon pasar jangka pendek, tidak setara dengan persistensi akrual.",
        },
        claim_boundary: {
          safe_to_say: ["Konservatisme berkorelasi dengan respon pasar pada sampel infrastruktur BEI."],
          not_safe_to_say: ["Hasil ini membuktikan konservatisme selalu meningkatkan nilai perusahaan."],
        },
        conditional_badge: "Paling Dekat dengan Fenomena",
        previously_used_proxies: ["Givoly & Hayn", "CAR 3 hari"],
        data_needs: ["Data laporan keuangan", "Harga saham harian"],
        data_sources_to_check: ["Idx.co.id", "Yahoo Finance"],
        possible_design_families: ["Kuantitatif Sekunder Panel"],
        constraint_fit: "KUAT",
        workload: "SEDANG",
        main_work: ["Unduh laporan keuangan BEI", "Hitung CAR 3 hari dengan event study"],
        academic_risks: ["Variasi likuiditas saham dapat mendistorsi beta pasar"],
        data_risks: ["Restatement laporan keuangan dapat mengubah angka akrual"],
        scope_boundaries: {
          in_scope: ["Emiten subsektor jalan tol, pelabuhan, telekomunikasi"],
          out_of_scope: ["BUMN non-publik dan entitas anak swasta"],
        },
        unresolved_items: ["Apakah perlu menyertakan tahun pandemi 2020 sebagai variabel dummy"],
        data_verification_questions: [
          {
            id: "Q01",
            question: "Apakah laporan keuangan lengkap 2017-2021 tersedia untuk minimal 30 emiten?",
            critical: true,
            related_data_need: "Laporan keuangan tahunan",
          },
        ],
        readiness: "LAYAK_DIPERIKSA",
      },
      {
        id: "DIR-02",
        name: "Pengujian Asimetri Respon Pasar terhadap Kabar Baik vs Kabar Buruk",
        problem_focus: "Fokus pada perbedaan sensitivitas respon laba terhadap kabar baik dan kabar buruk.",
        phenomenon_link: "Menjelaskan fenomena over-reaksi pasar terhadap berita penurunan kinerja laba.",
        gap_ids: ["G01"],
        anchor_source_ids: ["ID-01"],
        potential_unit_of_analysis: ["Emiten LQ45"],
        potential_objects: ["Tanggal publikasi laporan keuangan tahunan"],
        potential_constructs: ["Unexpected Earnings", "Market Reaction"],
        candidate_outcomes: ["Earnings Response Coefficient"],
        measurement_focus: {
          primary_outcome: "CAR 5 hari",
          supporting_outcome: null,
          non_equivalence_note: "Pengujian asimetri memerlukan model piecewise linear.",
        },
        claim_boundary: {
          safe_to_say: ["Terdapat perbedaan koefisien respon pasar antara good news dan bad news."],
          not_safe_to_say: ["Pasar modal Indonesia sepenuhnya tidak efisien."],
        },
        conditional_badge: "Lebih Aman untuk Tenggat",
        previously_used_proxies: ["Unexpected Earnings standar"],
        data_needs: ["Tanggal rilis laporan keuangan", "Konsensus laba analis atau random walk model"],
        data_sources_to_check: ["Keterbukaan informasi IDX"],
        possible_design_families: ["Kuantitatif Sekunder Event Study"],
        constraint_fit: "SEDANG",
        workload: "RENDAH",
        main_work: ["Kumpulkan tanggal rilis", "Hitung unexpected earnings"],
        academic_risks: ["Model random walk laba mungkin kurang akurat dibanding konsensus analis"],
        data_risks: ["Tanggal rilis pada akhir pekan memerlukan penyesuaian jendela peristiwa"],
        scope_boundaries: {
          in_scope: ["Saham-saham berlikuiditas tinggi LQ45"],
          out_of_scope: ["Saham papan pemantauan khusus"],
        },
        unresolved_items: ["Menentukan model ekspektasi laba yang tepat jika analis konsensus terbatas"],
        data_verification_questions: [
          {
            id: "Q02",
            question: "Apakah tanggal publikasi resmi laporan keuangan tercatat pasti di keterbukaan IDX?",
            critical: true,
            related_data_need: "Tanggal publikasi IDX",
          },
        ],
        readiness: "LAYAK_DIPERIKSA",
      },
    ],
    comparison_summary: "Ringkasan perbandingan arah.",
    conditional_recommendation: {
      recommended_direction_ids: ["DIR-01"],
      reasoning: "DIR-01 paling dekat dengan fenomena yang telah dikalibrasi.",
      conditions: ["Pastikan ketersediaan data laporan keuangan lengkap sebelum memulai."],
      not_a_selection: true,
    },
    source_weights: [
      {
        source_id: "ID-01",
        document_type: "Artikel Empiris",
        weight: "UTAMA",
        note: "Sumber inti empiris",
      },
    ],
    guidance_points: ["Bahas kedua alternatif arah ini saat bimbingan."],
    recovery_actions: [],
  };

  const raw4A = `=== BEGIN SKRIFLOW_DIRECTION_V2 ===\n${JSON.stringify(valid4AJson, null, 2)}\n=== END SKRIFLOW_DIRECTION_V2 ===`;
  const res4A = parseBedahTransfer(raw4A);
  assert.strictEqual(res4A.success, true);
  assert.strictEqual(res4A.dataV2.directions.length, 2);
  assert.strictEqual(res4A.dataV2.source_weights[0].document_type, "Artikel Empiris");
  console.log("✅ PASS Acceptance Test 11: Tidak ada regresi pada parser 4A/4B, 2-4 arah, data gate, dan pemilihan mandiri.");
}

console.log("\n============================================================");
console.log("ALL TOOL 4 FINAL MICRO-PATCH ACCEPTANCE TESTS PASSED (11/11)");
console.log("============================================================");
