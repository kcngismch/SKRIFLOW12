import {
  RESEARCH_FIELD_LIMITS,
  NOTEBOOK_PROMPT_PROJECTION_LIMITS,
  SHARED_FIELD_CONTRACTS,
  SharedFieldContract,
} from "./researchFieldLimits";

export {
  RESEARCH_FIELD_LIMITS,
  NOTEBOOK_PROMPT_PROJECTION_LIMITS,
  SHARED_FIELD_CONTRACTS,
};
export type { SharedFieldContract };

/**
 * Global Source of Truth for NotebookLM Input Limits and Budgets.
 * 
 * Empirical testing shows NotebookLM input limits around ~3.900 characters.
 * All prompts with targetPlatform: "NotebookLM" MUST reference this configuration.
 */
export const NOTEBOOKLM_LIMITS = {
  hardLimit: 3900,
  safeTarget: 3500,
  warningStart: 3501,
  maxPhenomenonLength: RESEARCH_FIELD_LIMITS.selectedPhenomenon,
  // Prompt A specific budget limits
  maxStaticTemplateA: 1600,
  maxEssentialContextA: 1250,
  maxOptionalContextA: 950,
  maxTotalA: 3800,
  safetyBufferA: 100,
  // Prompt B specific budget limits
  maxStaticTemplateB: 1788,
  maxEssentialContextB: 1250,
  maxOptionalContextB: 750,
  maxTotalB: 3788,
  safetyBufferB: 112,
  // Generic fallbacks
  maxStaticTemplate: 1788,
  safetyBuffer: 100,
  maxEssentialContext: 1250,
  maxOptionalContext: 800,
} as const;

export type PromptBudgetStatus =
  | "SAFE"
  | "WARNING"
  | "BLOCKED"
  | "TEMPLATE_OVERFLOW"
  | "ESSENTIAL_CONTEXT_OVERFLOW"
  | "READY_WITH_OPTIONAL_COMPACTION";

export interface PromptBudgetBreakdown {
  limit: number;
  staticTemplate: number;
  essentialContext: number;
  optionalContext: number;
  separatorsAndLabels: number;
  safetyBuffer: number;
  total: number;
  remaining: number;
  status: PromptBudgetStatus;
  isOptionalCompacted: boolean;
  compactedFields?: string[];
  phenomenonLength: number;
  maxPhenomenonLength: number;
}

/**
 * Calculates budget status for a given character length against NotebookLM limits.
 * - <= 3.500: SAFE (Aman, hijau)
 * - 3.501–3.800: WARNING (Mendekati batas, kuning)
 * - 3.801–3.900: WARNING (Mendekati batas maksimal, merah aktif)
 * - > 3.900: BLOCKED (Melebihi batas NotebookLM, copy/open dinonaktifkan)
 */
export function getPromptBudgetStatus(length: number): PromptBudgetStatus {
  if (length <= NOTEBOOKLM_LIMITS.safeTarget) {
    return "SAFE";
  }
  if (length <= NOTEBOOKLM_LIMITS.hardLimit) {
    return "WARNING";
  }
  return "BLOCKED";
}

/**
 * Source of Truth for Tool 4 Bedah Fenomena & Literatur Prompt Limits (ChatGPT / Gemini).
 * - Safe: <= 55.000
 * - Warning: 55.001–70.000
 * - Blocked: > 70.000
 */
export const BEDAH_LIMITS = {
  safeTarget: 55000,
  warningStart: 55001,
  hardLimit: 70000,
} as const;

export function getBedahPromptBudgetStatus(length: number): PromptBudgetStatus {
  if (length <= BEDAH_LIMITS.safeTarget) {
    return "SAFE";
  }
  if (length <= BEDAH_LIMITS.hardLimit) {
    return "WARNING";
  }
  return "BLOCKED";
}
