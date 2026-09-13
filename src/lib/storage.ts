import {
  SelectedPhenomenon,
  SharedResearchContext,
  SelectedExplorationAreaV3,
  SelectedExplorationAreaV2,
  IdeaToPhenomenonHandoff,
  FieldOrigin,
  SkriflowIdeaResultV3,
  SkriflowIdeaResultV2,
  BedahTransferPayload,
  ResearchFoundationBrief,
} from "@/types/tool";

const STORAGE_PREFIX = "skriflow_tool_";
const IDEA_SESSION_KEY = "skriflow_idea_exploration_session";
const IDEA_DRAFT_KEY = "skriflow_idea_paste_draft";
const IDEA_RESULT_KEY = "skriflow_idea_result_v2";
const IDEA_SELECTED_KEY = "skriflow_selected_exploration_area";
const IDEA_REJECTION_ROUNDS_KEY = "skriflow_idea_rejection_rounds";
const IDEA_RECOMMENDATION_KEY = "skriflow_idea_last_recommendation";
const IDEA_TO_PHENOMENON_HANDOFF_KEY = "skriflow_idea_to_phenomenon_handoff";
const PHENOMENON_FIELD_ORIGINS_KEY = "skriflow_phenomenon_field_origins";
const PHENOMENON_APPLIED_HANDOFF_FP_KEY = "skriflow_phenomenon_applied_handoff_fp";
const PHENOMENON_SELECTED_KEY = "skriflow_selected_phenomenon";
const PHENOMENON_DRAFT_KEY = "skriflow_phenomenon_paste_draft";
const SHARED_CONTEXT_KEY = "skriflow_shared_research_context";

// In-memory fallback store for Node.js test environment or restricted localStorage
const memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  }
  return memoryStorage[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      window.dispatchEvent(new Event("skriflow_storage_update"));
      return;
    } catch {
      // Fallback to memoryStorage if localStorage throws quota error
    }
  }
  memoryStorage[key] = value;
}

function removeStorageItem(key: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
      window.dispatchEvent(new Event("skriflow_storage_update"));
      return;
    } catch {
      // Fallback to memoryStorage
    }
  }
  delete memoryStorage[key];
}

/**
 * Saves exploration session for Cari Ide tool.
 */
export function saveIdeaExplorationSession(session: import("@/types/tool").IdeaExplorationSession): void {
  try {
    setStorageItem(IDEA_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Loads exploration session for Cari Ide tool.
 * Optionally validates against expected context fingerprint.
 */
export function loadIdeaExplorationSession(
  expectedFingerprint?: string
): import("@/types/tool").IdeaExplorationSession | null {
  try {
    const raw = getStorageItem(IDEA_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    if (!parsed.sessionId || typeof parsed.roundCount !== "number") {
      return null;
    }
    if (expectedFingerprint && parsed.contextFingerprint) {
      if (parsed.contextFingerprint !== expectedFingerprint) {
        return null;
      }
    }
    return parsed as import("@/types/tool").IdeaExplorationSession;
  } catch {
    return null;
  }
}

/**
 * Clears exploration session for Cari Ide tool.
 */
export function clearIdeaExplorationSession(): void {
  removeStorageItem(IDEA_SESSION_KEY);
}

/**
 * Returns snapshot string of exploration session for useSyncExternalStore.
 */
export function getIdeaExplorationSessionSnapshot(): string {
  return getStorageItem(IDEA_SESSION_KEY) || "null";
}

/**
 * Safely loads stored form data for a specific tool slug from localStorage.
 * Handles SSR safety and corrupt JSON gracefully.
 */
export function loadToolData(slug: string): Record<string, string> {
  try {
    const raw = getStorageItem(`${STORAGE_PREFIX}${slug}`);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Safely saves form data for a specific tool slug to localStorage.
 */
export function saveToolData(slug: string, data: Record<string, string>): void {
  try {
    setStorageItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(data));
  } catch {
    // Gracefully handle storage quota or serialisation issues
  }
}

/**
 * Safely clears stored form data for only the specified tool slug.
 */
export function clearToolData(slug: string): void {
  try {
    removeStorageItem(`${STORAGE_PREFIX}${slug}`);
    if (slug === "cari-ide-skripsi") {
      removeStorageItem(IDEA_SESSION_KEY);
      removeStorageItem(IDEA_DRAFT_KEY);
      removeStorageItem(IDEA_RESULT_KEY);
      removeStorageItem(IDEA_SELECTED_KEY);
      removeStorageItem(IDEA_REJECTION_ROUNDS_KEY);
      removeStorageItem(IDEA_RECOMMENDATION_KEY);
      removeStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY);
    }
  } catch {
    // Gracefully handle storage removal issues
  }
}

/**
 * Saves rejection rounds history for Cari Ide tool.
 */
export function saveIdeaRejectionRounds(rounds: import("@/types/tool").RejectedAreaRound[]): void {
  try {
    setStorageItem(IDEA_REJECTION_ROUNDS_KEY, JSON.stringify(rounds.slice(0, 3)));
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Loads rejection rounds history for Cari Ide tool.
 */
export function loadIdeaRejectionRounds(): import("@/types/tool").RejectedAreaRound[] {
  try {
    const raw = getStorageItem(IDEA_REJECTION_ROUNDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as import("@/types/tool").RejectedAreaRound[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Clears rejection rounds history for Cari Ide tool.
 */
export function clearIdeaRejectionRounds(): void {
  removeStorageItem(IDEA_REJECTION_ROUNDS_KEY);
}

/**
 * Saves last computed area recommendation for Cari Ide tool.
 */
export function saveLastRecommendation(rec: import("@/types/tool").AreaRecommendationResult | null): void {
  try {
    if (!rec) {
      removeStorageItem(IDEA_RECOMMENDATION_KEY);
    } else {
      setStorageItem(IDEA_RECOMMENDATION_KEY, JSON.stringify(rec));
    }
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Loads last computed area recommendation for Cari Ide tool.
 * If expectedPayloadFingerprint, expectedResultSetId, or expectedSessionId is provided,
 * validates that the stored recommendation matches the active result set, discarding stale data.
 */
export function loadLastRecommendation(
  expectedPayloadFingerprint?: string,
  expectedResultSetId?: string,
  expectedSessionId?: string
): import("@/types/tool").AreaRecommendationResult | null {
  try {
    const raw = getStorageItem(IDEA_RECOMMENDATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as import("@/types/tool").AreaRecommendationResult;

    if (expectedSessionId && parsed.sessionId) {
      if (parsed.sessionId !== expectedSessionId) {
        removeStorageItem(IDEA_RECOMMENDATION_KEY);
        return null;
      }
    }

    if (expectedPayloadFingerprint) {
      if (!parsed.payloadFingerprint || parsed.payloadFingerprint !== expectedPayloadFingerprint) {
        removeStorageItem(IDEA_RECOMMENDATION_KEY);
        return null;
      }
    }

    if (expectedResultSetId) {
      if (parsed.resultSetId && parsed.resultSetId !== expectedResultSetId) {
        removeStorageItem(IDEA_RECOMMENDATION_KEY);
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears last computed area recommendation for Cari Ide tool.
 */
export function clearLastRecommendation(): void {
  removeStorageItem(IDEA_RECOMMENDATION_KEY);
}

/**
 * Saves paste draft for Cari Ide tool.
 */
export function saveIdeaPasteDraft(draft: string): void {
  setStorageItem(IDEA_DRAFT_KEY, draft);
}

/**
 * Loads paste draft for Cari Ide tool.
 */
export function loadIdeaPasteDraft(): string {
  return getStorageItem(IDEA_DRAFT_KEY) || "";
}

/**
 * Clears paste draft for Cari Ide tool.
 */
export function clearIdeaPasteDraft(): void {
  removeStorageItem(IDEA_DRAFT_KEY);
}

/**
 * Returns snapshot string of Cari Ide paste draft for useSyncExternalStore.
 */
export function getIdeaPasteDraftSnapshot(): string {
  return getStorageItem(IDEA_DRAFT_KEY) || "";
}

/**
 * Saves parsed SkriflowIdeaResult (V3 or V2) to localStorage.
 */
export function saveIdeaResult(result: SkriflowIdeaResultV3 | SkriflowIdeaResultV2): void {
  try {
    setStorageItem(IDEA_RESULT_KEY, JSON.stringify(result));
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Loads parsed SkriflowIdeaResult from localStorage.
 */
export function loadIdeaResult(): SkriflowIdeaResultV3 | SkriflowIdeaResultV2 | null {
  try {
    const raw = getStorageItem(IDEA_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      if (parsed.schemaVersion === 3 || parsed.schemaVersion === 2) {
        return parsed as SkriflowIdeaResultV3 | SkriflowIdeaResultV2;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears parsed SkriflowIdeaResult from localStorage.
 */
export function clearIdeaResult(): void {
  removeStorageItem(IDEA_RESULT_KEY);
}

/**
 * Returns snapshot string of parsed SkriflowIdeaResult for useSyncExternalStore.
 */
export function getIdeaResultSnapshot(): string {
  return getStorageItem(IDEA_RESULT_KEY) || "null";
}

/**
 * Saves selected exploration area package (schema version 3 or 2) to localStorage.
 */
export function saveSelectedExplorationArea(area: SelectedExplorationAreaV3 | SelectedExplorationAreaV2): void {
  try {
    setStorageItem(IDEA_SELECTED_KEY, JSON.stringify(area));
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Safely loads and normalizes selected exploration area from localStorage.
 * Performs backward-compatible migration on legacy key formats.
 * If expectedPayloadFingerprint or expectedSessionId is provided, validates that the selected area matches the active result.
 */
export function loadSelectedExplorationArea(
  expectedPayloadFingerprint?: string,
  expectedSessionId?: string
): SelectedExplorationAreaV3 | SelectedExplorationAreaV2 | null {
  try {
    const raw = getStorageItem(IDEA_SELECTED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    if (expectedSessionId && parsed.sessionId) {
      if (parsed.sessionId !== expectedSessionId) {
        removeStorageItem(IDEA_SELECTED_KEY);
        return null;
      }
    }

    if (expectedPayloadFingerprint && parsed.payloadFingerprint) {
      if (parsed.payloadFingerprint !== expectedPayloadFingerprint) {
        removeStorageItem(IDEA_SELECTED_KEY);
        return null;
      }
    }

    if (parsed.schemaVersion === 3 && parsed.areaId && parsed.name) {
      return parsed as SelectedExplorationAreaV3;
    }

    if (parsed.schemaVersion === 2 && parsed.areaId && parsed.name) {
      return parsed as SelectedExplorationAreaV2;
    }

    // Legacy migration support if stored with older format
    const areaName = parsed.name || parsed.areaName || parsed.area || "";
    if (!areaName) return null;

    const areaId = parsed.areaId || parsed.id || "A01";
    const scopeSummary = parsed.scopeSummary || parsed.scope_summary || parsed.scope || "";
    const academicConnection = parsed.academicConnection || parsed.academic_connection || "";
    const interestConnection = parsed.interestConnection || parsed.interest_connection || "";
    const candidateObjects = Array.isArray(parsed.candidateObjects)
      ? parsed.candidateObjects
      : Array.isArray(parsed.candidate_objects)
      ? parsed.candidate_objects
      : [];
    const phenomenonSearchBrief =
      parsed.phenomenonSearchBrief || parsed.phenomenon_search_brief || "";
    const possibleDataForms = Array.isArray(parsed.possibleDataForms)
      ? parsed.possibleDataForms
      : Array.isArray(parsed.possible_data_forms)
      ? parsed.possible_data_forms
      : [];

    const handoff = parsed.handoffToPhenomenon || parsed.handoff_to_phenomenon || {};
    const handoffToPhenomenon = {
      areaText: handoff.areaText || handoff.area_text || areaName,
      objectText: handoff.objectText || handoff.object_text || candidateObjects.join(", "),
      initialClue: handoff.initialClue || handoff.initial_clue || phenomenonSearchBrief,
      keywordsId: Array.isArray(handoff.keywordsId)
        ? handoff.keywordsId
        : Array.isArray(handoff.keywords_id)
        ? handoff.keywords_id
        : [],
      keywordsEn: Array.isArray(handoff.keywordsEn)
        ? handoff.keywordsEn
        : Array.isArray(handoff.keywords_en)
        ? handoff.keywords_en
        : [],
      prioritySourceTypes: Array.isArray(handoff.prioritySourceTypes)
        ? handoff.prioritySourceTypes
        : Array.isArray(handoff.priority_source_types)
        ? handoff.priority_source_types
        : [],
    };

    const normalized: SelectedExplorationAreaV2 = {
      schemaVersion: 2,
      areaId,
      name: areaName,
      scopeSummary,
      academicConnection,
      interestConnection,
      candidateObjects,
      phenomenonSearchBrief,
      phenomenonSearchDirections: Array.isArray(parsed.phenomenonSearchDirections)
        ? parsed.phenomenonSearchDirections
        : [],
      possibleDataForms,
      constraintFit: parsed.constraintFit ||
        parsed.constraint_fit || {
          status: "SELARAS_SEMENTARA",
          reason: "",
          assumptions: [],
          risks: [],
        },
      keywordsId: Array.isArray(parsed.keywordsId)
        ? parsed.keywordsId
        : Array.isArray(parsed.keywords_id)
        ? parsed.keywords_id
        : [],
      keywordsEn: Array.isArray(parsed.keywordsEn)
        ? parsed.keywordsEn
        : Array.isArray(parsed.keywords_en)
        ? parsed.keywords_en
        : [],
      unresolvedItems: Array.isArray(parsed.unresolvedItems)
        ? parsed.unresolvedItems
        : Array.isArray(parsed.unresolved_items)
        ? parsed.unresolved_items
        : [],
      notDecided: Array.isArray(parsed.notDecided)
        ? parsed.notDecided
        : Array.isArray(parsed.not_decided)
        ? parsed.not_decided
        : [],
      handoffToPhenomenon,
      sourceInputFingerprint: parsed.sourceInputFingerprint || "",
      selectedAt: parsed.selectedAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Clears stored selected exploration area.
 */
export function clearSelectedExplorationArea(): void {
  removeStorageItem(IDEA_SELECTED_KEY);
}

/**
 * Returns snapshot string of selected exploration area for useSyncExternalStore.
 */
export function getSelectedExplorationAreaSnapshot(): string {
  return getStorageItem(IDEA_SELECTED_KEY) || "null";
}

/**
 * Saves atomic IdeaToPhenomenonHandoff (Version 2) to localStorage.
 */
export function saveIdeaToPhenomenonHandoff(handoff: IdeaToPhenomenonHandoff): void {
  try {
    setStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Loads atomic IdeaToPhenomenonHandoff from localStorage.
 * Validates payload fingerprint, resultSetId, and sessionId if provided to discard stale data.
 */
export function loadIdeaToPhenomenonHandoff(
  expectedPayloadFingerprint?: string,
  expectedResultSetId?: string,
  expectedSessionId?: string
): IdeaToPhenomenonHandoff | null {
  try {
    const raw = getStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    if (expectedSessionId && parsed.sessionId) {
      if (parsed.sessionId !== expectedSessionId) {
        removeStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY);
        return null;
      }
    }

    if (expectedPayloadFingerprint && parsed.sourcePayloadFingerprint) {
      if (parsed.sourcePayloadFingerprint !== expectedPayloadFingerprint) {
        removeStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY);
        return null;
      }
    }

    if (expectedResultSetId && parsed.sourceResultSetId) {
      if (parsed.sourceResultSetId !== expectedResultSetId) {
        removeStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY);
        return null;
      }
    }

    if (parsed.handoffVersion === 2 && parsed.selectedAreaId && parsed.areaText) {
      return parsed as IdeaToPhenomenonHandoff;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clears stored IdeaToPhenomenonHandoff.
 */
export function clearIdeaToPhenomenonHandoff(): void {
  removeStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY);
}

/**
 * Snapshot for IdeaToPhenomenonHandoff.
 */
export function getIdeaToPhenomenonHandoffSnapshot(): string {
  return getStorageItem(IDEA_TO_PHENOMENON_HANDOFF_KEY) || "null";
}

/**
 * Saves field origins for Tool Fenomena form.
 */
export function savePhenomenonFieldOrigins(origins: Record<string, FieldOrigin>): void {
  try {
    setStorageItem(PHENOMENON_FIELD_ORIGINS_KEY, JSON.stringify(origins));
  } catch {
    // ignore
  }
}

/**
 * Loads field origins for Tool Fenomena form.
 */
export function loadPhenomenonFieldOrigins(): Record<string, FieldOrigin> {
  try {
    const raw = getStorageItem(PHENOMENON_FIELD_ORIGINS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, FieldOrigin>;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Clears stored field origins for Tool Fenomena.
 */
export function clearPhenomenonFieldOrigins(): void {
  removeStorageItem(PHENOMENON_FIELD_ORIGINS_KEY);
}

/**
 * Saves applied handoff fingerprint for Tool Fenomena.
 */
export function savePhenomenonAppliedHandoffFingerprint(fp: string): void {
  setStorageItem(PHENOMENON_APPLIED_HANDOFF_FP_KEY, fp);
}

/**
 * Loads applied handoff fingerprint for Tool Fenomena.
 */
export function loadPhenomenonAppliedHandoffFingerprint(): string {
  return getStorageItem(PHENOMENON_APPLIED_HANDOFF_FP_KEY) || "";
}

/**
 * Snapshot for applied handoff fingerprint.
 */
export function getPhenomenonAppliedHandoffFingerprintSnapshot(): string {
  return getStorageItem(PHENOMENON_APPLIED_HANDOFF_FP_KEY) || "";
}

/**
 * Safely saves selected phenomenon package (schema version 1) to localStorage.
 */
export function saveSelectedPhenomenon(phenomenon: SelectedPhenomenon): void {
  try {
    setStorageItem(PHENOMENON_SELECTED_KEY, JSON.stringify(phenomenon));
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Safely loads and normalizes selected phenomenon package from localStorage.
 * Performs backward-compatible migration on legacy key formats (e.g. phenomenon_summary, fenomena, fenomenaAwal).
 */
export function loadSelectedPhenomenon(): SelectedPhenomenon | null {
  try {
    const raw = getStorageItem(PHENOMENON_SELECTED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    // Legacy migration support
    const summaryCandidate =
      parsed.phenomenonSummary ||
      parsed.phenomenon_summary ||
      parsed.fenomena_ringkas ||
      parsed.fenomenaAwal ||
      parsed.fenomena ||
      "";

    const normalizedSummary =
      typeof summaryCandidate === "string" ? summaryCandidate.trim() : "";

    if (!normalizedSummary || normalizedSummary.length === 0) {
      return null;
    }

    // Max 600 chars rule
    if (normalizedSummary.length > 600) {
      return null;
    }

    const candidateId =
      typeof parsed.candidateId === "string" && parsed.candidateId.trim()
        ? parsed.candidateId.trim()
        : typeof parsed.id === "string"
        ? parsed.id.trim()
        : "F01";

    const status =
      parsed.status === "SIAP_DIBAWA" || parsed.status === "PERLU_DIPERIKSA"
        ? parsed.status
        : "SIAP_DIBAWA";

    const evidence = Array.isArray(parsed.evidence) ? parsed.evidence : [];

    const normalized: SelectedPhenomenon = {
      schemaVersion: 1,
      sourceToolSlug: parsed.sourceToolSlug || "cari-fenomena-awal",
      candidateId,
      name:
        typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name.trim()
          : `Kandidat ${candidateId}`,
      status,
      phenomenonType: parsed.phenomenonType || parsed.phenomenon_type || "TREND",
      phenomenonSummary: normalizedSummary,
      observedCondition: parsed.observedCondition || parsed.observed_condition || "",
      relationToArea: parsed.relationToArea || parsed.relation_to_area || "",
      scope: {
        objectOrPopulation:
          parsed.scope?.objectOrPopulation || parsed.scope?.object_or_population || "",
        geography: parsed.scope?.geography || "",
        referencePeriod:
          parsed.scope?.referencePeriod || parsed.scope?.reference_period || "",
      },
      evidence,
      triangulationNote: parsed.triangulationNote || parsed.triangulation_note || "",
      whatIsNotProven: parsed.whatIsNotProven || parsed.what_is_not_proven || "",
      quality: parsed.quality || {
        relevance: "KUAT",
        traceability: "KUAT",
        source_independence: "KUAT",
      },
      keywordsId: Array.isArray(parsed.keywordsId)
        ? parsed.keywordsId
        : Array.isArray(parsed.keywords_id)
        ? parsed.keywords_id
        : [],
      keywordsEn: Array.isArray(parsed.keywordsEn)
        ? parsed.keywordsEn
        : Array.isArray(parsed.keywords_en)
        ? parsed.keywords_en
        : [],
      unresolvedItems: Array.isArray(parsed.unresolvedItems)
        ? parsed.unresolvedItems
        : Array.isArray(parsed.unresolved_items)
        ? parsed.unresolved_items
        : [],
      sourceConfirmationCount:
        typeof parsed.sourceConfirmationCount === "number"
          ? parsed.sourceConfirmationCount
          : 1,
      fingerprint: parsed.fingerprint || undefined,
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Clears stored selected phenomenon.
 */
export function clearSelectedPhenomenon(): void {
  removeStorageItem(PHENOMENON_SELECTED_KEY);
}

/**
 * Returns snapshot string of selected phenomenon for useSyncExternalStore.
 */
export function getSelectedPhenomenonSnapshot(): string {
  return getStorageItem(PHENOMENON_SELECTED_KEY) || "null";
}

/**
 * Saves paste draft for phenomenon tool.
 */
export function savePhenomenonPasteDraft(draft: string): void {
  setStorageItem(PHENOMENON_DRAFT_KEY, draft);
}

/**
 * Loads paste draft for phenomenon tool.
 */
export function loadPhenomenonPasteDraft(): string {
  return getStorageItem(PHENOMENON_DRAFT_KEY) || "";
}

/**
 * Clears paste draft for phenomenon tool.
 */
export function clearPhenomenonPasteDraft(): void {
  removeStorageItem(PHENOMENON_DRAFT_KEY);
}

/**
 * Saves shared research context across tools.
 */
export function saveSharedResearchContext(context: SharedResearchContext | null): void {
  try {
    if (!context) {
      removeStorageItem(SHARED_CONTEXT_KEY);
    } else {
      setStorageItem(SHARED_CONTEXT_KEY, JSON.stringify(context));
    }
  } catch {
    // Gracefully handle quota
  }
}

/**
 * Clears shared research context.
 */
export function clearSharedResearchContext(): void {
  removeStorageItem(SHARED_CONTEXT_KEY);
}

/**
 * Loads shared research context across tools.
 */
export function loadSharedResearchContext(): SharedResearchContext | null {
  try {
    const raw = getStorageItem(SHARED_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as SharedResearchContext;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns snapshot string of shared research context for useSyncExternalStore.
 */
export function getSharedResearchContextSnapshot(): string {
  return getStorageItem(SHARED_CONTEXT_KEY) || "null";
}

/**
 * Subscribes to custom window event to trigger sync in React components.
 */
export function subscribeToToolData(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = () => callback();
  window.addEventListener("storage", handleStorage);
  window.addEventListener("skriflow_storage_update", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("skriflow_storage_update", handleStorage);
  };
}

const BEDAH_DRAFT_KEY = "skriflow_bedah_literature_draft";
const BEDAH_OUTPUT_KEY = "skriflow_bedah_chat_output";
const BEDAH_OUTPUT_4B_KEY = "skriflow_bedah_4b_chat_output";
const BEDAH_FOUNDATION_KEY = "skriflow_research_foundation_brief";
const BEDAH_RAW_TRANSFER_KEY = "skriflow_bedah_raw_transfer";
const BEDAH_DIRECTION_V2_KEY = "skriflow_bedah_direction_v2";
const BEDAH_FEASIBILITY_KEY = "skriflow_bedah_direction_feasibility";
const BEDAH_FOUNDATION_V1_KEY = "skriflow_bedah_bab1_foundation_v1";
const BEDAH_DRAFT_4C_RAW_KEY = "skriflow_bedah_4c_chat_output";
const BEDAH_DRAFT_4C_KEY = "skriflow_bedah_bab1_draft_v1";
const BEDAH_POLISH_4D_RAW_KEY = "skriflow_bedah_4d_chat_output";
const BEDAH_POLISH_4D_KEY = "skriflow_bedah_bab1_polish_v1";
// --- Tool 6 (Bangun Bab 2) — Addendum D v3.3.4 ---
const BAB2_MAP_KEY = "skriflow_bab2_map_v1";
const BAB2_FOUNDATION_RAW_KEY = "skriflow_bab2_6a_chat_output";
const BAB2_FOUNDATION_KEY = "skriflow_bab2_foundation_v1";
const BAB2_DRAFT_RAW_KEY = "skriflow_bab2_6b_chat_output";
const BAB2_DRAFT_KEY = "skriflow_bab2_draft_v1";
const BAB2_POLISH_RAW_KEY = "skriflow_bab2_6c_chat_output";
const BAB2_POLISH_KEY = "skriflow_bab2_polish_v1";
const BAB2_PENDEKATAN_KEY = "skriflow_bab2_pendekatan";
const BEDAH_PACKAGE_V2_KEY = "skriflow_bedah_saved_package_v2";
const BEDAH_SELECTED_DIRECTION_KEY = "skriflow_bedah_selected_direction_id";

/**
 * Saves literature package draft for Tool 4 Bedah.
 */
export function saveBedahDraft(draft: string): void {
  setStorageItem(BEDAH_DRAFT_KEY, draft);
}

/**
 * Loads literature package draft for Tool 4 Bedah.
 */
export function loadBedahDraft(): string {
  return getStorageItem(BEDAH_DRAFT_KEY) || "";
}

/**
 * Clears literature package draft for Tool 4 Bedah.
 */
export function clearBedahDraft(): void {
  removeStorageItem(BEDAH_DRAFT_KEY);
}

/**
 * Snapshot for Bedah draft.
 */
export function getBedahDraftSnapshot(): string {
  return getStorageItem(BEDAH_DRAFT_KEY) || "";
}

/**
 * Saves pasted LLM output for Tool 4 Bedah (Tahap 4A).
 */
export function saveBedahOutput(output: string): void {
  setStorageItem(BEDAH_OUTPUT_KEY, output);
}

/**
 * Loads pasted LLM output for Tool 4 Bedah (Tahap 4A).
 */
export function loadBedahOutput(): string {
  return getStorageItem(BEDAH_OUTPUT_KEY) || "";
}

/**
 * Clears pasted LLM output for Tool 4 Bedah (Tahap 4A).
 */
export function clearBedahOutput(): void {
  removeStorageItem(BEDAH_OUTPUT_KEY);
}

/**
 * Snapshot for Bedah output (Tahap 4A).
 */
export function getBedahOutputSnapshot(): string {
  return getStorageItem(BEDAH_OUTPUT_KEY) || "";
}

/**
 * Saves pasted LLM output for Tool 4 Bedah (Tahap 4B).
 */
export function saveBedahOutput4B(output: string): void {
  setStorageItem(BEDAH_OUTPUT_4B_KEY, output);
}

/**
 * Loads pasted LLM output for Tool 4 Bedah (Tahap 4B).
 */
export function loadBedahOutput4B(): string {
  return getStorageItem(BEDAH_OUTPUT_4B_KEY) || "";
}

/**
 * Clears pasted LLM output for Tool 4 Bedah (Tahap 4B).
 */
export function clearBedahOutput4B(): void {
  removeStorageItem(BEDAH_OUTPUT_4B_KEY);
}

/**
 * Snapshot for Bedah output (Tahap 4B).
 */
export function getBedahOutput4BSnapshot(): string {
  return getStorageItem(BEDAH_OUTPUT_4B_KEY) || "";
}

/**
 * Saves parsed Bedah transfer payload (V1 backward compatibility).
 */
export function saveBedahRawTransfer(payload: BedahTransferPayload): void {
  try {
    setStorageItem(BEDAH_RAW_TRANSFER_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads parsed Bedah transfer payload (V1 backward compatibility).
 */
export function loadBedahRawTransfer(): BedahTransferPayload | null {
  try {
    const raw = getStorageItem(BEDAH_RAW_TRANSFER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears parsed Bedah transfer payload (V1).
 */
export function clearBedahRawTransfer(): void {
  removeStorageItem(BEDAH_RAW_TRANSFER_KEY);
}

/**
 * Saves parsed DirectionV2 payload.
 */
export function saveBedahDirectionV2(payload: import("@/types/tool").DirectionV2): void {
  try {
    setStorageItem(BEDAH_DIRECTION_V2_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads parsed DirectionV2 payload.
 */
export function loadBedahDirectionV2(): import("@/types/tool").DirectionV2 | null {
  try {
    const raw = getStorageItem(BEDAH_DIRECTION_V2_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schema_version === 2) {
      return parsed as import("@/types/tool").DirectionV2;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears parsed DirectionV2 payload.
 */
export function clearBedahDirectionV2(): void {
  removeStorageItem(BEDAH_DIRECTION_V2_KEY);
}

/**
 * Snapshot for DirectionV2.
 */
export function getBedahDirectionV2Snapshot(): string {
  return getStorageItem(BEDAH_DIRECTION_V2_KEY) || "null";
}

/**
 * Saves selected direction ID for Tool 4.
 */
export function saveSelectedDirectionId(id: string | null): void {
  if (!id) {
    removeStorageItem(BEDAH_SELECTED_DIRECTION_KEY);
  } else {
    setStorageItem(BEDAH_SELECTED_DIRECTION_KEY, id);
  }
}

/**
 * Loads selected direction ID for Tool 4.
 */
export function loadSelectedDirectionId(): string | null {
  return getStorageItem(BEDAH_SELECTED_DIRECTION_KEY) || null;
}

/**
 * Clears selected direction ID for Tool 4.
 */
export function clearSelectedDirectionId(): void {
  removeStorageItem(BEDAH_SELECTED_DIRECTION_KEY);
}

/**
 * Saves feasibility state for Tool 4.
 */
export function saveBedahFeasibility(state: import("@/types/tool").DirectionFeasibilityState): void {
  try {
    setStorageItem(BEDAH_FEASIBILITY_KEY, JSON.stringify(state));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads feasibility state for Tool 4.
 */
export function loadBedahFeasibility(): import("@/types/tool").DirectionFeasibilityState | null {
  try {
    const raw = getStorageItem(BEDAH_FEASIBILITY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears feasibility state for Tool 4.
 */
export function clearBedahFeasibility(): void {
  removeStorageItem(BEDAH_FEASIBILITY_KEY);
}

/**
 * Saves parsed Bab1FoundationV1 payload.
 */
export function saveBab1FoundationV1(payload: import("@/types/tool").Bab1FoundationV1): void {
  try {
    setStorageItem(BEDAH_FOUNDATION_V1_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads parsed Bab1FoundationV1 payload.
 */
export function loadBab1FoundationV1(): import("@/types/tool").Bab1FoundationV1 | null {
  try {
    const raw = getStorageItem(BEDAH_FOUNDATION_V1_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schema_version === 1) {
      return parsed as import("@/types/tool").Bab1FoundationV1;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears parsed Bab1FoundationV1 payload.
 */
export function clearBab1FoundationV1(): void {
  removeStorageItem(BEDAH_FOUNDATION_V1_KEY);
}


/**
 * Saves pasted LLM output for Tool 4 Bedah (Tahap 4C).
 */
export function saveBedahOutput4C(output: string): void {
  setStorageItem(BEDAH_DRAFT_4C_RAW_KEY, output);
}

/**
 * Loads pasted LLM output for Tool 4 Bedah (Tahap 4C).
 */
export function loadBedahOutput4C(): string {
  return getStorageItem(BEDAH_DRAFT_4C_RAW_KEY) || "";
}

/**
 * Clears pasted LLM output for Tool 4 Bedah (Tahap 4C).
 */
export function clearBedahOutput4C(): void {
  removeStorageItem(BEDAH_DRAFT_4C_RAW_KEY);
}

/**
 * Saves parsed Bab1DraftV1 payload (Tahap 4C).
 */
export function saveBab1DraftV1(payload: import("@/types/tool").Bab1DraftV1): void {
  try {
    setStorageItem(BEDAH_DRAFT_4C_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads parsed Bab1DraftV1 payload (Tahap 4C).
 */
export function loadBab1DraftV1(): import("@/types/tool").Bab1DraftV1 | null {
  try {
    const raw = getStorageItem(BEDAH_DRAFT_4C_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schema_version === 1) {
      return parsed as import("@/types/tool").Bab1DraftV1;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears parsed Bab1DraftV1 payload (Tahap 4C).
 */
export function clearBab1DraftV1(): void {
  removeStorageItem(BEDAH_DRAFT_4C_KEY);
}

/**
 * Saves pasted LLM output for Tahap 4D (poles bahasa).
 */
export function saveBedahOutput4D(output: string): void {
  setStorageItem(BEDAH_POLISH_4D_RAW_KEY, output);
}

/**
 * Loads pasted LLM output for Tahap 4D (poles bahasa).
 */
export function loadBedahOutput4D(): string {
  return getStorageItem(BEDAH_POLISH_4D_RAW_KEY) || "";
}

/**
 * Clears pasted LLM output for Tahap 4D (poles bahasa).
 */
export function clearBedahOutput4D(): void {
  removeStorageItem(BEDAH_POLISH_4D_RAW_KEY);
}

/**
 * Saves parsed Bab1PolishV1 payload (Tahap 4D).
 */
export function saveBab1PolishV1(payload: import("@/types/tool").Bab1PolishV1): void {
  try {
    setStorageItem(BEDAH_POLISH_4D_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads parsed Bab1PolishV1 payload (Tahap 4D).
 */
export function loadBab1PolishV1(): import("@/types/tool").Bab1PolishV1 | null {
  try {
    const raw = getStorageItem(BEDAH_POLISH_4D_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schema_version === 1) {
      return parsed as import("@/types/tool").Bab1PolishV1;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears parsed Bab1PolishV1 payload (Tahap 4D).
 */
export function clearBab1PolishV1(): void {
  removeStorageItem(BEDAH_POLISH_4D_KEY);
}

/**
 * Saves final SavedBab1FoundationPackage (Schema Version 2).
 */
export function saveBab1FoundationPackage(pkg: import("@/types/tool").SavedBab1FoundationPackage): void {
  try {
    setStorageItem(BEDAH_PACKAGE_V2_KEY, JSON.stringify(pkg));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads final SavedBab1FoundationPackage (Schema Version 2).
 */
export function loadBab1FoundationPackage(): import("@/types/tool").SavedBab1FoundationPackage | null {
  try {
    const raw = getStorageItem(BEDAH_PACKAGE_V2_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schemaVersion === 2) {
      return parsed as import("@/types/tool").SavedBab1FoundationPackage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears final SavedBab1FoundationPackage.
 */
export function clearBab1FoundationPackage(): void {
  removeStorageItem(BEDAH_PACKAGE_V2_KEY);
}

/**
 * Saves final Research Foundation Brief (Paket Fondasi Arah Penelitian - V1 compatibility).
 */
export function saveResearchFoundationBrief(brief: ResearchFoundationBrief): void {
  try {
    setStorageItem(BEDAH_FOUNDATION_KEY, JSON.stringify(brief));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Loads stored Research Foundation Brief (V1 compatibility).
 */
export function loadResearchFoundationBrief(): ResearchFoundationBrief | null {
  try {
    const raw = getStorageItem(BEDAH_FOUNDATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.schemaVersion === 1) {
      return parsed as ResearchFoundationBrief;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears stored Research Foundation Brief.
 */
export function clearResearchFoundationBrief(): void {
  removeStorageItem(BEDAH_FOUNDATION_KEY);
}

/**
 * Snapshot for Research Foundation Brief.
 */
export function getResearchFoundationBriefSnapshot(): string {
  return getStorageItem(BEDAH_FOUNDATION_KEY) || "null";
}

/**
 * Export ALL Skriflow localStorage keys as one JSON string (backup / pindah device).
 * Covers skriflow_* keys; foreign keys (theme, dsb.) tidak ikut.
 */
export function exportAllData(): string {
  const payload: Record<string, string> = {};
  if (typeof window !== "undefined" && window.localStorage) {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("skriflow_")) keys.push(k);
    }
    for (const k of keys) {
      const v = window.localStorage.getItem(k);
      if (v !== null) payload[k] = v;
    }
  } else {
    for (const k of Object.keys(memoryStorage)) {
      if (k.startsWith("skriflow_")) payload[k] = memoryStorage[k];
    }
  }
  return JSON.stringify(
    { app: "skriflow", schemaVersion: 1, exportedAt: new Date().toISOString(), data: payload },
    null,
    2
  );
}

/**
 * Import data dari exportAllData(). Return jumlah key yang dipulihkan.
 * Unknown keys di dalam file diabaikan (harus prefix skriflow_).
 */
export function importAllData(json: string): { restored: number; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { restored: 0, error: "File bukan JSON yang valid." };
  }
  const obj = parsed as { app?: string; data?: Record<string, unknown> };
  if (!obj || typeof obj !== "object" || obj.app !== "skriflow" || !obj.data || typeof obj.data !== "object") {
    return { restored: 0, error: "Struktur file bukan backup Skriflow yang dikenali." };
  }
  let restored = 0;
  for (const [k, v] of Object.entries(obj.data)) {
    if (!k.startsWith("skriflow_") || typeof v !== "string") continue;
    setStorageItem(k, v);
    restored++;
  }
  return { restored };
}

/**
 * Hapus SEMUA data Skriflow dari localStorage (skriflow_* saja).
 */
export function clearAllData(): number {
  let removed = 0;
  if (typeof window !== "undefined" && window.localStorage) {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("skriflow_")) keys.push(k);
    }
    for (const k of keys) {
      removeStorageItem(k);
      removed++;
    }
  } else {
    for (const k of Object.keys(memoryStorage)) {
      if (k.startsWith("skriflow_")) {
        delete memoryStorage[k];
        removed++;
      }
    }
  }
  return removed;
}

/**
 * Returns a stable snapshot string for useSyncExternalStore.
 */
export function getToolDataSnapshot(slug: string): string {
  try {
    return getStorageItem(`${STORAGE_PREFIX}${slug}`) || "{}";
  } catch {
    return "{}";
  }
}

// =========================================================================
// TOOL 6 — BANGUN BAB 2 (Addendum D v3.3.4)
// =========================================================================

export function saveBab2Map(peta: import("@/types/bab2").Bab2MapV1): void {
  try {
    setStorageItem(BAB2_MAP_KEY, JSON.stringify(peta));
  } catch {
    // quota
  }
}

export function loadBab2Map(): import("@/types/bab2").Bab2MapV1 | null {
  try {
    const raw = getStorageItem(BAB2_MAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed.schema_version === 1
      ? (parsed as import("@/types/bab2").Bab2MapV1)
      : null;
  } catch {
    return null;
  }
}

export function clearBab2Map(): void {
  removeStorageItem(BAB2_MAP_KEY);
}

/** Pendekatan penelitian yang dipilih mahasiswa (Addendum D.8). */
export function saveBab2Pendekatan(p: string): void {
  setStorageItem(BAB2_PENDEKATAN_KEY, p);
}

export function loadBab2Pendekatan(): string {
  return getStorageItem(BAB2_PENDEKATAN_KEY) || "";
}

export function clearBab2Pendekatan(): void {
  removeStorageItem(BAB2_PENDEKATAN_KEY);
}

function simpanHasilGenerik<T>(key: string, payload: T): void {
  try {
    setStorageItem(key, JSON.stringify(payload));
  } catch {
    // quota
  }
}

function muatHasilGenerik<T>(key: string): T | null {
  try {
    const raw = getStorageItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed.schema_version === 1 ? (parsed as T) : null;
  } catch {
    return null;
  }
}

export function saveBab2FoundationRaw(teks: string): void {
  setStorageItem(BAB2_FOUNDATION_RAW_KEY, teks);
}

export function loadBab2FoundationRaw(): string {
  return getStorageItem(BAB2_FOUNDATION_RAW_KEY) || "";
}

export function saveBab2Foundation(payload: import("@/types/bab2").Bab2FoundationV1): void {
  simpanHasilGenerik(BAB2_FOUNDATION_KEY, payload);
}

export function loadBab2Foundation(): import("@/types/bab2").Bab2FoundationV1 | null {
  return muatHasilGenerik<import("@/types/bab2").Bab2FoundationV1>(BAB2_FOUNDATION_KEY);
}

export function clearBab2Foundation(): void {
  removeStorageItem(BAB2_FOUNDATION_KEY);
  removeStorageItem(BAB2_FOUNDATION_RAW_KEY);
}

export function saveBab2DraftRaw(teks: string): void {
  setStorageItem(BAB2_DRAFT_RAW_KEY, teks);
}

export function loadBab2DraftRaw(): string {
  return getStorageItem(BAB2_DRAFT_RAW_KEY) || "";
}

export function saveBab2Draft(payload: import("@/types/bab2").Bab2DraftV1): void {
  simpanHasilGenerik(BAB2_DRAFT_KEY, payload);
}

export function loadBab2Draft(): import("@/types/bab2").Bab2DraftV1 | null {
  return muatHasilGenerik<import("@/types/bab2").Bab2DraftV1>(BAB2_DRAFT_KEY);
}

export function clearBab2Draft(): void {
  removeStorageItem(BAB2_DRAFT_KEY);
  removeStorageItem(BAB2_DRAFT_RAW_KEY);
}

export function saveBab2PolishRaw(teks: string): void {
  setStorageItem(BAB2_POLISH_RAW_KEY, teks);
}

export function loadBab2PolishRaw(): string {
  return getStorageItem(BAB2_POLISH_RAW_KEY) || "";
}

export function saveBab2Polish(payload: import("@/types/bab2").Bab2PolishV1): void {
  simpanHasilGenerik(BAB2_POLISH_KEY, payload);
}

export function loadBab2Polish(): import("@/types/bab2").Bab2PolishV1 | null {
  return muatHasilGenerik<import("@/types/bab2").Bab2PolishV1>(BAB2_POLISH_KEY);
}

export function clearBab2Polish(): void {
  removeStorageItem(BAB2_POLISH_KEY);
  removeStorageItem(BAB2_POLISH_RAW_KEY);
}

/** Bersihkan seluruh state Tool 6 (dipakai tombol reset). */
export function clearSemuaBab2(): void {
  [BAB2_MAP_KEY, BAB2_FOUNDATION_RAW_KEY, BAB2_FOUNDATION_KEY, BAB2_DRAFT_RAW_KEY, BAB2_DRAFT_KEY, BAB2_POLISH_RAW_KEY, BAB2_POLISH_KEY].forEach(
    removeStorageItem
  );
}
