// test-student-language.mjs
import assert from "node:assert";
import {
  STUDENT_STATUS_MAP,
  DATA_ORIGIN_MAP,
  DATA_ACCESS_STATUS_MAP,
  RESEARCH_LOGIC_STAGE_MAP,
  GAP_TYPE_MAP,
  BACKGROUND_FUNCTION_MAP,
  ACADEMIC_TERMS_MAP,
  getStudentLabel,
  getStudentStatus,
  getDataOriginInfo,
  getDataAccessStatusInfo,
  getResearchLogicStageInfo,
  getGapTypeInfo,
  getBackgroundFunctionInfo,
  getAcademicTermInfo,
} from "./src/lib/studentLanguage.ts";

console.log("--- STARTING STUDENT LANGUAGE SYSTEM AUDIT ---");

// Test 1: getStudentLabel
assert.strictEqual(getStudentLabel("SELARAS_SEMENTARA"), "Sementara Cocok dengan Kondisimu");
assert.strictEqual(getStudentLabel("DATA_READY"), "Data Utama Sudah Dipastikan");
assert.strictEqual(getStudentLabel("BAB1_READY"), "Siap Dilanjutkan ke Bab 1");
assert.strictEqual(getStudentLabel("EMPIRICAL_INCONSISTENCY"), "Temuan Penelitian yang Berbeda");
assert.strictEqual(getStudentLabel("PUBLIC_SECONDARY"), "Data Publik yang Sudah Tersedia");
console.log("✓ Test 1: getStudentLabel mapped accurately");

// Test 2: getStudentStatus handles fallback and known statuses
const fallbackStatus = getStudentStatus("UNKNOWN_CUSTOM_ENUM");
assert.strictEqual(fallbackStatus.label, "Unknown Custom Enum");
assert.strictEqual(fallbackStatus.iconType, "info");

const readyStatus = getStudentStatus("DATA_READY");
assert.strictEqual(readyStatus.label, "Data Utama Sudah Dipastikan");
assert.strictEqual(readyStatus.iconType, "check");
console.log("✓ Test 2: getStudentStatus fallback and status mapping verified");

// Test 3: getDataOriginInfo
const dataOriginPublic = getDataOriginInfo("PUBLIC_SECONDARY");
assert.strictEqual(dataOriginPublic.label, "Data Publik yang Sudah Tersedia");
assert.ok(dataOriginPublic.description.length > 0);

const dataOriginResearcher = getDataOriginInfo("RESEARCHER_GENERATED");
assert.strictEqual(dataOriginResearcher.label, "Dibuat Sendiri Saat Penelitian");
console.log("✓ Test 3: getDataOriginInfo verified");

// Test 4: getResearchLogicStageInfo (Stages 1–7)
for (const stage of [
  "CONTEXT",
  "PHENOMENON",
  "EMPIRICAL_PROBLEM",
  "PRIOR_KNOWLEDGE",
  "KNOWLEDGE_LIMIT",
  "RESEARCH_DIRECTION",
  "RESEARCH_QUESTION",
]) {
  const info = getResearchLogicStageInfo(stage);
  assert.ok(info.order >= 1 && info.order <= 7);
  assert.ok(info.label.length > 0);
  assert.ok(info.question.length > 0);
}
console.log("✓ Test 4: getResearchLogicStageInfo (Stages 1–7) verified");

// Test 5: getGapTypeInfo
const gapInconsistency = getGapTypeInfo("EMPIRICAL_INCONSISTENCY");
assert.strictEqual(gapInconsistency.label, "Temuan Penelitian yang Berbeda");
assert.ok(gapInconsistency.studentTip.length > 0);
console.log("✓ Test 5: getGapTypeInfo verified");

// Test 6: getBackgroundFunctionInfo (Paragraphs 1–7)
for (const fn of [
  "OPENING_CONTEXT",
  "OBSERVED_PHENOMENON",
  "EMPIRICAL_PROBLEM",
  "PRIOR_LITERATURE_STATE",
  "KNOWLEDGE_LIMIT_OR_GAP",
  "PROPOSED_DIRECTION",
  "OBJECTIVES_AND_CONTRIBUTION",
]) {
  const fnInfo = getBackgroundFunctionInfo(fn);
  assert.ok(fnInfo.title.length > 0);
  assert.ok(fnInfo.objective.length > 0);
}
console.log("✓ Test 6: getBackgroundFunctionInfo verified");

// Test 7: Academic terms
const termEpistemology = getAcademicTermInfo("EPISTEMIC_GAP");
assert.ok(termEpistemology.simpleMeaning.length > 0);
assert.ok(termEpistemology.whyItMatters.length > 0);
console.log("✓ Test 7: getAcademicTermInfo verified");

console.log("--- ALL STUDENT LANGUAGE SYSTEM TESTS PASSED! ---");
