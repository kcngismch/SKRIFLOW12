import assert from "node:assert";
import {
  assembleBedahPrompt4B,
  extractDocumentTypeFromSourceRegister,
} from "./src/lib/promptAssembler.ts";
import {
  parseBab1FoundationTransfer,
  parseBedahTransfer,
} from "./src/lib/bedahParser.ts";
import {
  deriveDirectionRiskLevel,
  formatConstraintFitLabel,
  formatWorkloadLabel,
  getStudentLabel,
} from "./src/lib/studentLanguage.ts";

console.log("=== RUNNING TOOL 4 MICRO-PATCH REGRESSION TEST SUITE ===\n");

// ---------------------------------------------------------------------------
// 1. PATCH 1: Valid null & JSON schema in assembleBedahPrompt4B
// ---------------------------------------------------------------------------
{
  const prompt4B = assembleBedahPrompt4B({
    prodi: "Akuntansi",
    areaEksplorasi: "Audit Automation",
    calibratedPhenomenon: {
      canonical_title: "Audit Title",
      summary: "Audit Summary",
      status_reason: "Valid",
      anchor_evidence: [],
      candidate_units_of_analysis: [],
      what_is_safe_to_say: [],
      what_is_not_proven: [],
      prohibited_claims: [],
      recommended_next_step: "Next",
    },
    selectedDirection: {
      id: "DIR-01",
      name: "Direction 1",
      workload: "SEDANG",
      workload_risk: "RENDAH",
      constraint_fit: "KUAT",
      readiness: "SIAP_DIKEMBANGKAN",
      target_outcomes: ["Outcome 1"],
      anchor_source_ids: ["S01"],
      gap_ids: ["GAP-01"],
      data_verification_questions: [],
      data_needs: ["Data 1"],
    },
    associatedGaps: [
      {
        id: "GAP-01",
        gap_type: "EMPIRICAL_PARADOX",
        statement: "Gap 1 Statement",
        strength: "KUAT",
        what_is_known: ["Known"],
        what_is_unexplained: "Unexplained",
        source_ids: ["S01"],
      },
    ],
    relevantLiteratureEvidence: `
| ID | Kategori | Judul | Penulis | Jenis | Publikasi | Sampel | Bukti |
| S01 | INTI | Audit Tech | Smith (2022) | Empirical | JAR | 150 KAP | Full-text |
| S02 | PENDUKUNG | Audit Review | Miller (2020) | Review | JAL | - | Full-text |
`,
    feasibilityState: {
      answers: {},
      computedReadiness: "DATA_READY",
      criticalDataMissing: false,
      hasBlockingIssues: false,
    },
    sourceWeights: [
      { source_id: "S01", weight: "UTAMA", reason: "Inti" },
      { source_id: "S02", weight: "PENDUKUNG", reason: "Pendukung" },
    ],
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });

  const startMarker = "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===";
  const endMarker = "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===";
  const startIndex = prompt4B.indexOf(startMarker);
  const endIndex = prompt4B.indexOf(endMarker);

  assert.ok(startIndex !== -1 && endIndex !== -1, "Prompt 4B contains SKRIFLOW_BAB1_FOUNDATION_V1 marker");
  const jsonStr = prompt4B.substring(startIndex + startMarker.length, endIndex).trim();

  let parsedTemplate;
  try {
    parsedTemplate = JSON.parse(jsonStr);
  } catch (err) {
    assert.fail(`JSON template in Prompt 4B must be valid parseable JSON: ${err.message}`);
  }

  assert.strictEqual(parsedTemplate.schema_version, 1);
  // Verify decision_basis is null for non-researcher decision
  const empClaim = parsedTemplate.background_map[0].safe_claims[0];
  assert.strictEqual(empClaim.decision_basis, null, "Empirical claim has null decision_basis without syntax corruption");
  console.log("✅ [PASS] Patch 1: Prompt 4B JSON template parses with valid null and no corrupted quotes");
}

// ---------------------------------------------------------------------------
// 2. PATCH 2: RESEARCHER_DECISION strict validation
// ---------------------------------------------------------------------------
{
  const baseFoundation = {
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
      methodological_contribution: "Metodologis",
    },
    tentative_scope: {
      unit_of_analysis: "KAP",
      observation_context: "BEI",
      provisional_period: "2020-2023",
      boundary_justification: "Ketersediaan data",
    },
    working_title_previews: [
      { option_number: 1, title_text: "Pengaruh A terhadap B", style_note: "Kuantitatif" },
    ],
    background_map: [
      {
        section_number: 1,
        section_name: "Latar Belakang 1",
        function: "PRACTICAL_CONTEXT",
        core_message: "Konteks",
        safe_claims: [{ claim_id: "C01", statement: "Klaim", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }],
        transition_to_next: "Transisi",
        readiness: "READY",
        missing_information: [],
      },
      { section_number: 2, section_name: "2", function: "EMPIRICAL_PHENOMENON", core_message: "Fenomena", safe_claims: [{ claim_id: "C02", statement: "Klaim", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 3, section_name: "3", function: "WHY_IT_IS_A_PROBLEM", core_message: "Masalah", safe_claims: [{ claim_id: "C03", statement: "Klaim", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 4, section_name: "4", function: "PRIOR_STUDIES_AND_CONTROVERSY", core_message: "Literatur", safe_claims: [{ claim_id: "C04", statement: "Klaim", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 5, section_name: "5", function: "RESEARCH_GAP", core_message: "Gap", safe_claims: [{ claim_id: "C05", statement: "Klaim", claim_type: "CROSS_SOURCE_SYNTHESIS", source_ids: ["S01", "S02"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 6, section_name: "6", function: "PROPOSED_RESOLUTION", core_message: "Solusi", safe_claims: [{ claim_id: "C06", statement: "Klaim", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      {
        section_number: 7,
        section_name: "7",
        function: "URGENCY_AND_DIRECTION",
        core_message: "Arah",
        safe_claims: [
          {
            claim_id: "DEC-01",
            statement: "Fokus dibatasi pada sektor manufaktur",
            claim_type: "RESEARCHER_DECISION",
            source_ids: [],
            decision_basis: "", // EMPTY DECISION BASIS!
          },
        ],
        transition_to_next: "Selesai",
        readiness: "READY",
        missing_information: [],
      },
    ],
    evidence_ledger: [
      { claim_id: "C01", claim: "Klaim 1", source_ids: ["S01"], evidence_location: "Hal 1", original_context: "BEI", bab1_function: "Konteks", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C02", claim: "Klaim 2", source_ids: ["S01"], evidence_location: "Hal 2", original_context: "BEI", bab1_function: "Fenomena", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C03", claim: "Klaim 3", source_ids: ["S01"], evidence_location: "Hal 3", original_context: "BEI", bab1_function: "Masalah", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C04", claim: "Klaim 4", source_ids: ["S01"], evidence_location: "Hal 4", original_context: "BEI", bab1_function: "Literatur", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C05", claim: "Klaim 5", source_ids: ["S01", "S02"], evidence_location: "Hal 5", original_context: "BEI", bab1_function: "Gap", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C06", claim: "Klaim 6", source_ids: ["S01"], evidence_location: "Hal 6", original_context: "BEI", bab1_function: "Solusi", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
    ],
    feasibility_summary: { confirmed_data: ["BEI"], unconfirmed_data: [], unavailable_data: [], implications: [] },
    supervisor_questions: ["Pertanyaan?"],
    unresolved_decisions: ["Keputusan?"],
    prohibited_claims: ["Jangan klaim kausal mutlak"],
    recovery_actions: [],
  };

  // 2a: Empty decision_basis MUST be rejected with specific message
  const rawInvalid = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(baseFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const resInvalid = parseBab1FoundationTransfer(rawInvalid, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    knownSourceIds: ["S01", "S02"],
  });

  assert.strictEqual(resInvalid.success, false, "Empty decision_basis must fail validation");
  assert.ok(
    resInvalid.errorDetails.some((e) =>
      e.includes("belum memiliki dasar keputusan. Isi decision_basis dengan alasan konkret")
    ),
    "Error message explains why decision_basis is required and how to fill it"
  );

  // 2b: Non-empty decision_basis succeeds
  const validFoundation = JSON.parse(JSON.stringify(baseFoundation));
  validFoundation.background_map[6].safe_claims[0].decision_basis = "Berdasarkan kemudahan akses data BEI dan arahan dosen pembimbing.";
  const rawValid = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(validFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const resValid = parseBab1FoundationTransfer(rawValid, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    knownSourceIds: ["S01", "S02"],
  });

  assert.strictEqual(resValid.success, true, "Valid decision_basis passes validation");
  console.log("✅ [PASS] Patch 2: Strict validation for RESEARCHER_DECISION rejects empty basis and accepts valid explanation");
}

// ---------------------------------------------------------------------------
// 3. PATCH 3: Source weight reconciliation & unknown source rejection
// ---------------------------------------------------------------------------
{
  const testFoundation = {
    schema_version: 1,
    foundation_status: "BAB1_READY",
    status_reason: "Fondasi siap.",
    blocking_items: [],
    selected_direction: {
      id: "DIR-01",
      name: "Direction 1",
      student_selected: true,
      selection_reason: "Pilihan",
      direction_readiness: "SIAP_DIKEMBANGKAN",
      data_readiness: "DATA_READY",
    },
    problem_structure: { core_problem: "CP", practical_symptoms: ["PS"], empirical_tension: "ET", theoretical_anchor: "TA", why_urgent_now: "WUN" },
    research_logic_chain: [
      { stage_index: 1, stage_name: "Konteks", main_argument: "Arg 1" },
      { stage_index: 2, stage_name: "Fenomena", main_argument: "Arg 2" },
      { stage_index: 3, stage_name: "Masalah", main_argument: "Arg 3" },
      { stage_index: 4, stage_name: "Literatur", main_argument: "Arg 4" },
      { stage_index: 5, stage_name: "Gap", main_argument: "Arg 5" },
    ],
    candidate_research_questions: [{ id: "RQ-01", question: "Q1", question_type: "PENGARUH", related_gap_id: "GAP-01" }],
    candidate_objectives: [{ id: "OBJ-01", objective: "O1", related_question_id: "RQ-01" }],
    provisional_contributions: { theoretical_contribution: "TC", practical_contribution: "PC", methodological_contribution: "MC" },
    tentative_scope: { unit_of_analysis: "UA", observation_context: "OC", provisional_period: "PP", boundary_justification: "BJ" },
    working_title_previews: [{ option_number: 1, title_text: "T1", style_note: "N1" }],
    background_map: [
      { section_number: 1, section_name: "1", function: "PRACTICAL_CONTEXT", core_message: "M1", safe_claims: [{ claim_id: "C01", statement: "S1", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 2, section_name: "2", function: "EMPIRICAL_PHENOMENON", core_message: "M2", safe_claims: [{ claim_id: "C02", statement: "S2", claim_type: "EMPIRICAL_FACT", source_ids: ["S02"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 3, section_name: "3", function: "WHY_IT_IS_A_PROBLEM", core_message: "M3", safe_claims: [{ claim_id: "C03", statement: "S3", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 4, section_name: "4", function: "PRIOR_STUDIES_AND_CONTROVERSY", core_message: "M4", safe_claims: [{ claim_id: "C04", statement: "S4", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 5, section_name: "5", function: "RESEARCH_GAP", core_message: "M5", safe_claims: [{ claim_id: "C05", statement: "S5", claim_type: "CROSS_SOURCE_SYNTHESIS", source_ids: ["S01", "S02"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 6, section_name: "6", function: "PROPOSED_RESOLUTION", core_message: "M6", safe_claims: [{ claim_id: "C06", statement: "S6", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 7, section_name: "7", function: "URGENCY_AND_DIRECTION", core_message: "M7", safe_claims: [{ claim_id: "C07", statement: "S7", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    ],
    evidence_ledger: [
      { claim_id: "C01", claim: "Klaim 1", source_ids: ["S01"], source_weights: [{ source_id: "S01", weight: "PENDUKUNG" }], evidence_location: "Hal 1", original_context: "BEI", bab1_function: "Konteks", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C02", claim: "Klaim 2", source_ids: ["S02"], evidence_location: "Hal 2", original_context: "BEI", bab1_function: "Fenomena", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C03", claim: "Klaim 3", source_ids: ["S01"], evidence_location: "Hal 3", original_context: "BEI", bab1_function: "Masalah", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C04", claim: "Klaim 4", source_ids: ["S01"], evidence_location: "Hal 4", original_context: "BEI", bab1_function: "Literatur", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C05", claim: "Klaim 5", source_ids: ["S01", "S02"], evidence_location: "Hal 5", original_context: "BEI", bab1_function: "Gap", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C06", claim: "Klaim 6", source_ids: ["S01"], evidence_location: "Hal 6", original_context: "BEI", bab1_function: "Solusi", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
      { claim_id: "C07", claim: "Klaim 7", source_ids: ["S01"], evidence_location: "Hal 7", original_context: "BEI", bab1_function: "Arah", usage_limit: "Aman", support_status: "READY_TO_DRAFT" },
    ],
    feasibility_summary: { confirmed_data: [], unconfirmed_data: [], unavailable_data: [], implications: [] },
    supervisor_questions: [],
    unresolved_decisions: [],
    prohibited_claims: [],
    recovery_actions: [],
  };

  // 3a: Model erroneously changed S01 to PENDUKUNG in C01, but 4A canonical weight is UTAMA
  const raw = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(testFoundation, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const res = parseBab1FoundationTransfer(raw, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    sourceWeights: [
      { source_id: "S01", weight: "UTAMA", reason: "Sumber inti" },
      { source_id: "S02", weight: "PENDUKUNG", reason: "Sumber pendukung" },
    ],
  });

  assert.strictEqual(res.success, true);
  // S01 must be normalized back to UTAMA
  assert.strictEqual(res.data.evidence_ledger[0].source_weights[0].weight, "UTAMA");
  // Non-blocking warning recorded — teks yang dibaca mahasiswa memakai LABEL, bukan enum mentah
  assert.ok(
    res.warnings &&
      res.warnings.some((w) => w.includes("Bobot S01 disesuaikan dari Sumber Pendukung menjadi Sumber Utama"))
  );
  // Guard aturan "jangan bocorkan enum ke mahasiswa": enum mentah tidak boleh muncul di pesan warning
  assert.ok(
    !res.warnings.some((w) => /\b(PENDUKUNG|UTAMA|PERLU_DIPERIKSA)\b/.test(w)),
    "enum mentah (PENDUKUNG/UTAMA/PERLU_DIPERIKSA) tidak boleh bocor ke pesan warning"
  );

  // 3b: C02 is a primary claim (Fenomena) supported ONLY by S02 (PENDUKUNG) -> downgraded to NEEDS_VERIFICATION
  assert.strictEqual(res.data.evidence_ledger[1].support_status, "NEEDS_VERIFICATION");

  // 3c: Unknown source in output 4B triggers blocking validation error
  const withUnknownSource = JSON.parse(JSON.stringify(testFoundation));
  withUnknownSource.evidence_ledger[0].source_ids = ["S99"]; // S99 does not exist in 4A!
  const rawUnknown = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(withUnknownSource, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const resUnknown = parseBab1FoundationTransfer(rawUnknown, {
    expectedDirectionId: "DIR-01",
    dataReadiness: "DATA_READY",
    knownSourceIds: ["S01", "S02"],
  });
  assert.strictEqual(resUnknown.success, false);
  assert.ok(resUnknown.errorDetails.some((e) => e.includes("S99") && e.includes("tidak ditemukan dalam Paket Bukti")));

  console.log("✅ [PASS] Patch 3: Source weight reconciliation restores 4A canonical weights, protects primary claims, and blocks unknown sources");
}

// ---------------------------------------------------------------------------
// 4. PATCH 4: Decouple document_type from weight
// ---------------------------------------------------------------------------
{
  const sampleRegister = `
| ID | Kategori | Judul | Penulis | Jenis | Publikasi | Sampel | Bukti |
| S01 | PENDUKUNG | Corporate Governance Report | KNKG (2021) | Institutional Report | KNKG | BUMN | Full-text |
| S02 | INTI | Ownership and Earnings | Smith (2022) | Empirical Article | JAR | 200 Emiten | Full-text |
| S03 | PENDUKUNG | Financial Regulations | OJK (2020) | Regulation | OJK | Peraturan | Full-text |
`;

  assert.strictEqual(extractDocumentTypeFromSourceRegister("S01", sampleRegister), "Institutional Report");
  assert.strictEqual(extractDocumentTypeFromSourceRegister("S02", sampleRegister), "Empirical Article");
  assert.strictEqual(extractDocumentTypeFromSourceRegister("S03", sampleRegister), "Regulation");
  console.log("✅ [PASS] Patch 4: Decoupled document_type correctly extracted from Source Register table");
}

// ---------------------------------------------------------------------------
// 5. PATCH 5: phenomenon_basis_status explicit handling
// ---------------------------------------------------------------------------
{
  const baseData = {
    schema_version: 1,
    foundation_status: "BAB1_READY",
    status_reason: "Semua siap.",
    blocking_items: [],
    selected_direction: { id: "D01", name: "Arah 1", student_selected: true, selection_reason: "Pilihan", direction_readiness: "SIAP", data_readiness: "DATA_READY" },
    problem_structure: { core_problem: "CP", practical_symptoms: ["PS"], empirical_tension: "ET", theoretical_anchor: "TA", why_urgent_now: "WUN" },
    research_logic_chain: [
      { stage_index: 1, stage_name: "K", main_argument: "A1" },
      { stage_index: 2, stage_name: "F", main_argument: "A2" },
      { stage_index: 3, stage_name: "M", main_argument: "A3" },
      { stage_index: 4, stage_name: "L", main_argument: "A4" },
      { stage_index: 5, stage_name: "G", main_argument: "A5" },
    ],
    candidate_research_questions: [{ id: "RQ-01", question: "Q1", question_type: "PENGARUH", related_gap_id: "GAP-01" }],
    candidate_objectives: [{ id: "OBJ-01", objective: "O1", related_question_id: "RQ-01" }],
    provisional_contributions: { theoretical_contribution: "TC", practical_contribution: "PC", methodological_contribution: "MC" },
    tentative_scope: { unit_of_analysis: "UA", observation_context: "OC", provisional_period: "PP", boundary_justification: "BJ" },
    working_title_previews: [{ option_number: 1, title_text: "T1", style_note: "N1" }],
    background_map: [
      { section_number: 1, section_name: "1", function: "PRACTICAL_CONTEXT", core_message: "M1", safe_claims: [{ claim_id: "C01", statement: "S1", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 2, section_name: "2", function: "EMPIRICAL_PHENOMENON", core_message: "M2", safe_claims: [{ claim_id: "C02", statement: "S2", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 3, section_name: "3", function: "WHY_IT_IS_A_PROBLEM", core_message: "M3", safe_claims: [{ claim_id: "C03", statement: "S3", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 4, section_name: "4", function: "PRIOR_STUDIES_AND_CONTROVERSY", core_message: "M4", safe_claims: [{ claim_id: "C04", statement: "S4", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 5, section_name: "5", function: "RESEARCH_GAP", core_message: "M5", safe_claims: [{ claim_id: "C05", statement: "S5", claim_type: "CROSS_SOURCE_SYNTHESIS", source_ids: ["S01", "S02"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 6, section_name: "6", function: "PROPOSED_RESOLUTION", core_message: "M6", safe_claims: [{ claim_id: "C06", statement: "S6", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
      { section_number: 7, section_name: "7", function: "URGENCY_AND_DIRECTION", core_message: "M7", safe_claims: [{ claim_id: "C07", statement: "S7", claim_type: "EMPIRICAL_FACT", source_ids: ["S01"] }], transition_to_next: "T", readiness: "READY", missing_information: [] },
    ],
    evidence_ledger: [
      { claim_id: "C01", claim: "K1", source_ids: ["S01"], evidence_location: "H1", original_context: "BEI", bab1_function: "Konteks", usage_limit: "A", support_status: "READY_TO_DRAFT" },
      { claim_id: "C02", claim: "K2", source_ids: ["S01"], evidence_location: "H2", original_context: "BEI", bab1_function: "Fenomena", usage_limit: "A", support_status: "READY_TO_DRAFT" },
      { claim_id: "C03", claim: "K3", source_ids: ["S01"], evidence_location: "H3", original_context: "BEI", bab1_function: "Masalah", usage_limit: "A", support_status: "READY_TO_DRAFT" },
      { claim_id: "C04", claim: "K4", source_ids: ["S01"], evidence_location: "H4", original_context: "BEI", bab1_function: "Literatur", usage_limit: "A", support_status: "READY_TO_DRAFT" },
      { claim_id: "C05", claim: "K5", source_ids: ["S01", "S02"], evidence_location: "H5", original_context: "BEI", bab1_function: "Gap", usage_limit: "A", support_status: "READY_TO_DRAFT" },
      { claim_id: "C06", claim: "K6", source_ids: ["S01"], evidence_location: "H6", original_context: "BEI", bab1_function: "Solusi", usage_limit: "A", support_status: "READY_TO_DRAFT" },
      { claim_id: "C07", claim: "K7", source_ids: ["S01"], evidence_location: "H7", original_context: "BEI", bab1_function: "Arah", usage_limit: "A", support_status: "READY_TO_DRAFT" },
    ],
    feasibility_summary: { confirmed_data: [], unconfirmed_data: [], unavailable_data: [], implications: [] },
    supervisor_questions: [],
    unresolved_decisions: [],
    prohibited_claims: [],
    recovery_actions: [],
  };

  // 5a: MISSING phenomenon basis status forces BAB1_BLOCKED
  const rawMissing = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(baseData, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const resMissing = parseBab1FoundationTransfer(rawMissing, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "MISSING",
  });
  assert.strictEqual(resMissing.success, true);
  assert.strictEqual(resMissing.data.foundation_status, "BAB1_BLOCKED");
  assert.strictEqual(resMissing.data.phenomenon_basis_status, "MISSING");
  assert.ok(resMissing.data.recovery_actions.some((a) => a.includes("Tool 2")));

  // 5b: LITERATURE_INDICATED caps at BAB1_CONDITIONAL
  const rawLit = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(baseData, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const resLit = parseBab1FoundationTransfer(rawLit, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "LITERATURE_INDICATED",
  });
  assert.strictEqual(resLit.success, true);
  assert.strictEqual(resLit.data.foundation_status, "BAB1_CONDITIONAL");
  assert.strictEqual(resLit.data.phenomenon_basis_status, "LITERATURE_INDICATED");

  // 5c: VERIFIED_REAL_WORLD allows BAB1_READY
  const rawVer = `=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===\n${JSON.stringify(baseData, null, 2)}\n=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===`;
  const resVer = parseBab1FoundationTransfer(rawVer, {
    expectedDirectionId: "D01",
    dataReadiness: "DATA_READY",
    phenomenonBasisStatus: "VERIFIED_REAL_WORLD",
  });
  assert.strictEqual(resVer.success, true);
  assert.strictEqual(resVer.data.foundation_status, "BAB1_READY");
  assert.strictEqual(resVer.data.phenomenon_basis_status, "VERIFIED_REAL_WORLD");

  console.log("✅ [PASS] Patch 5: phenomenon_basis_status explicitly determines foundation status and recovery actions");
}

// ---------------------------------------------------------------------------
// 6. PATCH 6: Card direction footer risk and constraint fit separation
// ---------------------------------------------------------------------------
{
  // Test risk derivation logic
  assert.strictEqual(deriveDirectionRiskLevel("RENDAH", "TINGGI"), "RENDAH", "Explicit workload_risk takes precedence");
  assert.strictEqual(deriveDirectionRiskLevel(null, "TINGGI"), "TINGGI", "Fallback to workload when workload_risk is missing");
  assert.strictEqual(deriveDirectionRiskLevel(null, "SEDANG"), "SEDANG");
  assert.strictEqual(deriveDirectionRiskLevel(null, "RINGAN"), "RENDAH");

  // Test label formatting helpers
  assert.strictEqual(formatConstraintFitLabel("KUAT"), "KUAT");
  assert.strictEqual(formatWorkloadLabel("SEDANG"), "SEDANG");
  assert.strictEqual(formatWorkloadLabel("RINGAN"), "RINGAN");

  console.log("✅ [PASS] Patch 6: Risk derivation decoupled from constraint_fit and helper labels verified");
}

console.log("\n============================================================");
console.log("ALL TOOL 4 MICRO-PATCH REGRESSION TESTS PASSED (6/6)");
console.log("============================================================");
