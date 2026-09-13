import { ACTIVE_TOOLS, getToolBySlug } from "./src/data/tools.ts";
import {
  RESEARCH_FIELD_LIMITS,
  NOTEBOOK_PROMPT_PROJECTION_LIMITS,
  SHARED_FIELD_CONTRACTS,
} from "./src/config/researchFieldLimits.ts";
import { validateResearchHandoff, reconcileLegacyHandoff } from "./src/lib/handoffValidator.ts";
import { parseIdeaTransferV3, generateIdeaLengthRepairPrompt } from "./src/lib/ideaParser.ts";
import { parsePhenomenonTransfer, generatePhenomenonLengthRepairPrompt } from "./src/lib/phenomenonParser.ts";
import { assemblePromptA, assemblePromptB, assemblePrompt } from "./src/lib/promptAssembler.ts";
import { validateForm } from "./src/lib/validation.ts";
import { getAutofillForTool } from "./src/lib/autofill.ts";

console.log("=== RUNNING 25 MANDATORY CROSS-TOOL CHARACTER LIMIT SYNC TESTS ===\n");

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

// 1. Central Constant Contract
console.log("--- GRUP 1: CENTRAL CONSTANTS & SHARED CONTRACTS ---");
assert(RESEARCH_FIELD_LIMITS.programStudy === 100, "1. programStudy canonical limit is exactly 100");
assert(RESEARCH_FIELD_LIMITS.explorationArea === 350, "2. explorationArea canonical limit is exactly 350");
assert(RESEARCH_FIELD_LIMITS.literatureArea === 350, "3. literatureArea canonical limit is exactly 350");
assert(RESEARCH_FIELD_LIMITS.areaHandoffSummary === 350, "4. areaHandoffSummary canonical limit is exactly 350");
assert(RESEARCH_FIELD_LIMITS.selectedPhenomenon === 800, "5. selectedPhenomenon canonical limit is exactly 800");
assert(RESEARCH_FIELD_LIMITS.literatureFocus === 800, "6. literatureFocus canonical limit is exactly 800");
assert(RESEARCH_FIELD_LIMITS.unresolvedLiteratureItems === 800, "7. unresolvedLiteratureItems canonical limit is exactly 800");
assert(RESEARCH_FIELD_LIMITS.publicationRange === 100, "8. publicationRange canonical limit is exactly 100");
assert(RESEARCH_FIELD_LIMITS.literatureKeywords === 600, "9. literatureKeywords canonical limit is exactly 600");
assert(RESEARCH_FIELD_LIMITS.accessNotes === 400, "10. accessNotes canonical limit is exactly 400");
assert(RESEARCH_FIELD_LIMITS.avoidanceNotes === 400, "11. avoidanceNotes canonical limit is exactly 400");
assert(RESEARCH_FIELD_LIMITS.lecturerDirection === 500, "12. lecturerDirection canonical limit is exactly 500");
assert(RESEARCH_FIELD_LIMITS.generalConstraints === 500, "13. generalConstraints canonical limit is exactly 500");

// 2. Active Tool Catalog Field Limit Inheritance
console.log("\n--- GRUP 2: CATALOG INHERITANCE ACROSS ALL 4 TOOLS ---");
const t1 = getToolBySlug("cari-ide-skripsi");
const t2 = getToolBySlug("cari-fenomena-awal");
const t3 = getToolBySlug("cari-literatur-awal");
const t4 = getToolBySlug("bedah-hasil-notebooklm");

assert(t1.fields.find(f => f.id === "prodi").maxLength === 100, "14. Tool 1 prodi maxLength is 100");
assert(t2.fields.find(f => f.id === "prodi").maxLength === 100, "15. Tool 2 prodi maxLength is 100");
assert(t3.fields.find(f => f.id === "prodi").maxLength === 100, "16. Tool 3 prodi maxLength is 100");

assert(t2.fields.find(f => f.id === "area_eksplorasi").maxLength === 350, "17. Tool 2 area_eksplorasi maxLength is 350");
assert(t3.fields.find(f => f.id === "area_eksplorasi").maxLength === 350, "18. Tool 3 area_eksplorasi maxLength is 350");

assert(t3.fields.find(f => f.id === "fenomena_awal").maxLength === 800, "19. Tool 3 fenomena_awal maxLength is 800");
assert(t4.fields.find(f => f.id === "fenomena_awal").maxLength === 800, "20. Tool 4 fenomena_awal maxLength is 800");

assert(t1.fields.find(f => f.id === "avoidances").maxLength === 400, "21. Tool 1 avoidances maxLength is 400");
assert(t3.fields.find(f => f.id === "avoidances").maxLength === 400, "22. Tool 3 avoidances maxLength is 400");

assert(t1.fields.find(f => f.id === "supervisor_direction").maxLength === 500, "23. Tool 1 supervisor_direction maxLength is 500");
assert(t2.fields.find(f => f.id === "arahan_dosen").maxLength === 500, "24. Tool 2 arahan_dosen maxLength is 500");
assert(t3.fields.find(f => f.id === "supervisor_direction").maxLength === 500, "25. Tool 3 supervisor_direction maxLength is 500");
assert(t4.fields.find(f => f.id === "supervisor_direction").maxLength === 500, "26. Tool 4 supervisor_direction maxLength is 500");

// 3. Prompt Instructions
console.log("\n--- GRUP 3: PROMPT INSTRUCTIONS & AI TASK SPECIFICATIONS ---");
const promptT1 = assemblePrompt(t1, { prodi: "Akuntansi", minat: "Audit" });
assert(promptT1.includes("350 karakter"), "27. Tool 1 prompt instructs AI that area handoff summary is max 350 chars");

assert(t2.promptConfig.rules.some(r => r.includes("800 karakter")), "28. Tool 2 prompt rules specify phenomenon_summary max 800 chars");
assert(t2.promptConfig.outputFormat[0].includes("800 karakter"), "29. Tool 2 prompt outputFormat specifies phenomenon_summary max 800 chars");

// 4. Parser Enforcement & Length Repair Prompt Generation
console.log("\n--- GRUP 4: PARSER ENFORCEMENT & REPAIR PROMPT GENERATION ---");

// Test Tool 1 parser rejects handoff area_text > 350
const longAreaText = "A".repeat(351);
const rawIdeaPayloadOverLimit = `=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Audit Otomasi",
      "scope_summary": "Cakupan area",
      "academic_connection": "Keterkaitan",
      "interest_connection": "Hubungan",
      "data_provenance": [{ "data_form": "Laporan", "origin": "PUBLIC_SECONDARY", "access_status": "INDICATED", "methodological_note": "Catatan" }],
      "research_context": { "potential_actors": ["Auditor"], "potential_entities": ["KAP"], "potential_documents": ["Laporan"], "potential_data_artifacts": ["Opini"], "potential_geographies": ["Indonesia"] },
      "scope_boundary": { "in_scope": ["KAP"], "out_of_scope": ["Internal"], "boundary_note": "Batas" },
      "phenomenon_search_brief": "Petunjuk",
      "phenomenon_search_directions": [{ "label": "Arah 1", "direction_type": "ADOPTION", "search_question": "Apakah KAP sudah mengadopsi?", "observable_signals": ["Sinyal"], "priority_source_types": ["REGULATION"] }],
      "literature_search_seeds": { "concepts": ["Audit"], "keywords_id": ["audit"], "keywords_en": ["audit"] },
      "research_shape_preview": { "possible_focus": "Fokus", "likely_evidence_needed": ["Bukti"], "illustrative_title_pattern": "Evaluasi [aspek] dalam [konteks] pada [objek].", "unresolved_before_title": ["Fenomena"], "warning": "Peringatan" },
      "constraint_fit": { "status": "SELARAS_SEMENTARA", "reason": "Alasan", "assumptions": ["Asumsi"], "risks": ["Risiko"] },
      "unresolved_items": ["Hal"],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "${longAreaText}",
        "actor_text": "Auditor",
        "entity_text": "KAP",
        "document_text": "Laporan",
        "data_artifact_text": "Opini",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["KAP"],
        "out_of_scope": ["Internal"],
        "priority_source_types": ["REGULATION"]
      }
    },
    {
      "id": "A02",
      "name": "Audit Lingkungan",
      "scope_summary": "Cakupan area 2",
      "academic_connection": "Keterkaitan",
      "interest_connection": "Hubungan",
      "data_provenance": [{ "data_form": "Laporan", "origin": "PUBLIC_SECONDARY", "access_status": "INDICATED", "methodological_note": "Catatan" }],
      "research_context": { "potential_actors": ["Auditor"], "potential_entities": ["KAP"], "potential_documents": ["Laporan"], "potential_data_artifacts": ["Opini"], "potential_geographies": ["Indonesia"] },
      "scope_boundary": { "in_scope": ["KAP"], "out_of_scope": ["Internal"], "boundary_note": "Batas" },
      "phenomenon_search_brief": "Petunjuk",
      "phenomenon_search_directions": [{ "label": "Arah 1", "direction_type": "ADOPTION", "search_question": "Apakah emiten melaporkan?", "observable_signals": ["Sinyal"], "priority_source_types": ["REGULATION"] }],
      "literature_search_seeds": { "concepts": ["Audit"], "keywords_id": ["audit"], "keywords_en": ["audit"] },
      "research_shape_preview": { "possible_focus": "Fokus", "likely_evidence_needed": ["Bukti"], "illustrative_title_pattern": "Evaluasi [aspek] dalam [konteks] pada [objek].", "unresolved_before_title": ["Fenomena"], "warning": "Peringatan" },
      "constraint_fit": { "status": "SELARAS_SEMENTARA", "reason": "Alasan", "assumptions": ["Asumsi"], "risks": ["Risiko"] },
      "unresolved_items": ["Hal"],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "Audit lingkungan",
        "actor_text": "Auditor",
        "entity_text": "KAP",
        "document_text": "Laporan",
        "data_artifact_text": "Opini",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["KAP"],
        "out_of_scope": ["Internal"],
        "priority_source_types": ["REGULATION"]
      }
    }
  ],
  "comparison": [
    { "area_id": "A01", "interest_fit": "SANGAT_DEKAT", "study_program_fit": "KUAT", "data_fit": "SELARAS_SEMENTARA", "collection_burden": "RENDAH_SEMENTARA", "methodological_uncertainty": "RENDAH", "main_check_next": "Cek" },
    { "area_id": "A02", "interest_fit": "DEKAT", "study_program_fit": "KUAT", "data_fit": "SELARAS_SEMENTARA", "collection_burden": "RENDAH_SEMENTARA", "methodological_uncertainty": "RENDAH", "main_check_next": "Cek" }
  ]
}
=== END SKRIFLOW_IDEA_V3 ===`;

const parsedIdea = parseIdeaTransferV3(rawIdeaPayloadOverLimit);
assert(!parsedIdea.success && parsedIdea.errorDetails.some(e => e.includes("350 karakter")), "30. Tool 1 parser flags handoff area_text exceeding 350 chars");

const ideaRepairPrompt = generateIdeaLengthRepairPrompt([{ field: "handoff_to_phenomenon.area_text", actualLength: 351, allowedLength: 350 }]);
assert(ideaRepairPrompt.includes("350 karakter") && ideaRepairPrompt.includes("Jangan memilih satu area secara otomatis"), "31. generateIdeaLengthRepairPrompt is well-formed");

// Test Tool 2 parser accepts up to 800 chars and rejects > 800 chars
const validSummary800 = "P".repeat(800);
const rawPhenomenonValid800 = `=== BEGIN SKRIFLOW_FENOMENA_V1 ===
{
  "schema_version": 1,
  "insufficient_evidence": false,
  "context": { "prodi": "Akuntansi", "area": "Audit" },
  "candidates": [
    {
      "id": "F01",
      "name": "Adopsi TI",
      "phenomenon_type": "TREND",
      "phenomenon_summary": "${validSummary800}",
      "observed_condition": "Terjadi peningkatan",
      "scope": { "object_or_population": "KAP", "geography": "Indonesia", "reference_period": "2020-2023" },
      "relation_to_area": "Relevan",
      "evidence": [
        {
          "claim": "Peningkatan adopsi",
          "observed_data_or_event": "Data 75%",
          "source_title": "Laporan OJK",
          "publisher_or_institution": "OJK",
          "source_type": "OFFICIAL_DATA",
          "publication_date": "2023",
          "reference_period": "2020-2023",
          "url": "https://ojk.go.id/laporan.pdf",
          "evidence_location": "Halaman 12",
          "access_note": "Akses publik terbuka"
        }
      ],
      "status": "SIAP_DIBAWA"
    }
  ]
}
=== END SKRIFLOW_FENOMENA_V1 ===`;

const parsedPhenom800 = parsePhenomenonTransfer(rawPhenomenonValid800);
assert(parsedPhenom800.success, "32. Tool 2 parser successfully accepts phenomenon_summary exactly 800 chars");

const rawPhenomenonOver800 = rawPhenomenonValid800.replace(validSummary800, "P".repeat(801));
const parsedPhenomOver800 = parsePhenomenonTransfer(rawPhenomenonOver800);
assert(!parsedPhenomOver800.success && parsedPhenomOver800.error.includes("800 karakter"), "33. Tool 2 parser rejects phenomenon_summary exceeding 800 chars");

const phenomRepairPrompt = generatePhenomenonLengthRepairPrompt([{ field: "phenomenon_summary", actualLength: 801, allowedLength: 800 }]);
assert(phenomRepairPrompt.includes("800 karakter") && phenomRepairPrompt.includes("Jangan memilih satu fenomena secara otomatis"), "34. generatePhenomenonLengthRepairPrompt is well-formed");

// 5. Cross-Tool Handoff Validation & Reconciliation
console.log("\n--- GRUP 5: HANDOFF VALIDATOR & RECONCILIATION ---");
const validHandoffData = {
  prodi: "Akuntansi",
  area_eksplorasi: "A".repeat(350),
  fenomena_awal: "F".repeat(800),
  fokus_aspek: "Fokus aspek",
};
const valResultValid = validateResearchHandoff("cari-literatur-awal", validHandoffData);
assert(valResultValid.valid && valResultValid.violations.length === 0, "35. validateResearchHandoff passes valid canonical data");

const legacyOverLimitData = {
  prodi: "P".repeat(120), // Exceeds 100
  area_eksplorasi: "A".repeat(400), // Exceeds 350
  fenomena_awal: "F".repeat(850), // Exceeds 800
};
const valResultOver = validateResearchHandoff("cari-literatur-awal", legacyOverLimitData);
assert(!valResultOver.valid && valResultOver.violations.length === 3, "36. validateResearchHandoff identifies all 3 violating fields");

const reconciled = reconcileLegacyHandoff("cari-literatur-awal", legacyOverLimitData);
assert(reconciled.prodi.length === 100, "37. reconcileLegacyHandoff safely compacts prodi to 100");
assert(reconciled.area_eksplorasi.length === 350, "38. reconcileLegacyHandoff safely compacts area_eksplorasi to 350");
assert(reconciled.fenomena_awal.length === 800, "39. reconcileLegacyHandoff safely compacts fenomena_awal to 800");

const valResultAfterReconcile = validateResearchHandoff("cari-literatur-awal", reconciled);
assert(valResultAfterReconcile.valid, "40. validateResearchHandoff passes reconciled data cleanly");

// 6. Projection Separation
console.log("\n--- GRUP 6: PROJECTION SEPARATION & PHENOMENON INTEGRITY ---");
assert(NOTEBOOK_PROMPT_PROJECTION_LIMITS.promptA.literatureFocus === 250, "41. Prompt A projection literatureFocus is 250 (while form canonical is 800)");
assert(NOTEBOOK_PROMPT_PROJECTION_LIMITS.promptB.literatureFocus === 500, "42. Prompt B projection literatureFocus is 500 (while form canonical is 800)");

const fullPhenomenon800 = "P".repeat(800);
const fullLiteratureContext = {
  prodi: "Akuntansi",
  area_eksplorasi: "Audit sektor publik",
  fenomena_awal: fullPhenomenon800,
  fokus_aspek: "F".repeat(250),
  hal_terbuka: "H".repeat(150),
  kata_kunci: "K".repeat(200),
  rentang_tahun: "10 tahun terakhir",
};

const assembledA = assemblePromptA(t3, fullLiteratureContext);
const assembledB = assemblePromptB(t3, fullLiteratureContext);

assert(assembledA.includes(fullPhenomenon800), "43. Prompt A preserves 800-char phenomenon completely without trimming");
assert(assembledB.includes(fullPhenomenon800), "44. Prompt B preserves 800-char phenomenon completely without trimming");
assert(assembledA.length <= 3900, `45. Prompt A length (${assembledA.length}) stays strictly <= 3900`);
assert(assembledB.length <= 3900, `46. Prompt B length (${assembledB.length}) stays strictly <= 3900`);

// 7. Matrix & Validation Engine Tests
console.log("\n--- GRUP 7: MATRIX & VALIDATION ENGINE INTEGRATION ---");
assert(ACTIVE_TOOLS.length === 6, "47. ACTIVE_TOOLS has exactly 6 active tools (4 bedah + Susun Bab 1 + Bangun Bab 2)");
assert(
  ACTIVE_TOOLS.some((t) => t.slug === "bangun-bab-2"),
  "47b. Tool 6 (bangun-bab-2) terdaftar sebagai tool aktif"
);
assert(SHARED_FIELD_CONTRACTS.length >= 8, "48. SHARED_FIELD_CONTRACTS defines full cross-tool matrix");

const formValFail = validateForm(t3.fields, { prodi: "P".repeat(101) });
assert(!formValFail.isValid && formValFail.errors.prodi.includes("kelebihan 1 karakter"), "49. validateForm detects character overflow");

const autofillRes = getAutofillForTool("cari-literatur-awal", {});
assert(autofillRes.validationResult !== undefined, "50. getAutofillForTool includes validationResult");

console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL 50 TESTS PASSED CLEANLY!");
}
