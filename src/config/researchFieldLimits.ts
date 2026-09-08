/**
 * CENTRAL SOURCE OF TRUTH: RESEARCH FIELD LIMITS & CONTRACTS
 * 
 * Defines canonical character limits across all 4 SKRIFLOW tools:
 * Tool 1: Cari Ide Skripsi
 * Tool 2: Cari & Validasi Fenomena
 * Tool 3: Cari Literatur Awal
 * Tool 4: Bedah Fenomena & Literatur
 * 
 * Rules:
 * 1. Shared fields have one canonical limit across upstream and downstream tools.
 * 2. Downstream most stringent limit dictates upstream input limit.
 * 3. Form limits (RESEARCH_FIELD_LIMITS) dictate form inputs, card handoff, and storage.
 * 4. NotebookLM prompt projection limits (NOTEBOOK_PROMPT_PROJECTION_LIMITS) only dictate prompt copies.
 */

export const RESEARCH_FIELD_LIMITS = {
  /** Program Studi / Jurusan (Shared across Tool 1, 2, 3) */
  programStudy: 100,

  /** Area Eksplorasi / Handoff Summary (Shared across Tool 1 -> Tool 2 -> Tool 3) */
  literatureArea: 350,
  explorationArea: 350,
  areaHandoffSummary: 350,

  /** Fenomena Awal Terpilih / Summary (Shared across Tool 2 -> Tool 3 -> Tool 4) */
  selectedPhenomenon: 800,
  phenomenonSummary: 800,

  /** Fokus Aspek Pemetaan Literatur (Tool 3) */
  literatureFocus: 800,

  /** Hal yang Belum Ditentukan / Unresolved Items (Tool 3) */
  unresolvedLiteratureItems: 800,

  /** Rentang Tahun Publikasi (Tool 3) */
  publicationRange: 100,

  /** Kata Kunci Khusus / Keywords (Tool 3) */
  literatureKeywords: 600,

  /** Catatan Akses Data (Shared across Tool 1, 2, 3) */
  accessNotes: 400,

  /** Hal yang Ingin Dihindari (Shared across Tool 1, 2, 3) */
  avoidanceNotes: 400,

  /** Arahan Dosen / Supervisor Direction (Shared across Tool 1, 2, 3, 4) */
  lecturerDirection: 500,

  /** Minat / Isu Awal (Tool 1) */
  interestOrTopic: 600,

  /** Objek / Aktor / Kelompok yang Terbayang (Tool 2) */
  actorOrObject: 250,

  /** Petunjuk Fenomena Awal (Tool 2) */
  phenomenonClue: 600,

  /** Batasan Umum / Personal Constraints (Tool 1, 4) */
  generalConstraints: 500,
} as const;

export type ResearchFieldLimitKey = keyof typeof RESEARCH_FIELD_LIMITS;

/**
 * NotebookLM Prompt Projection Limits.
 * Applied ONLY when assembling strings for NotebookLM prompts (Prompt A & Prompt B).
 * Never mutates original form or storage values.
 */
export const NOTEBOOK_PROMPT_PROJECTION_LIMITS = {
  promptA: {
    sourcePriority: 250,
    publicationRange: 100,
    keywords: 200,
    literatureFocus: 250,
    unresolvedItems: 150,
  },
  promptB: {
    literatureFocus: 500,
    unresolvedItems: 250,
  },
} as const;

export interface SharedFieldContract {
  semanticKey: string;
  sourceTool: string;
  destinationTools: string[];
  sourceStateKey: string;
  destinationStateKeys: string[];
  canonicalLimit: number;
  promptProjectionLimit?: number;
  required: boolean;
  label: string;
}

export const SHARED_FIELD_CONTRACTS: readonly SharedFieldContract[] = [
  {
    semanticKey: "program_study",
    label: "Program Studi / Jurusan",
    sourceTool: "cari-ide-skripsi",
    destinationTools: ["cari-fenomena-awal", "cari-literatur-awal"],
    sourceStateKey: "prodi",
    destinationStateKeys: ["prodi"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.programStudy,
    required: true,
  },
  {
    semanticKey: "exploration_area",
    label: "Area Eksplorasi",
    sourceTool: "cari-ide-skripsi",
    destinationTools: ["cari-fenomena-awal", "cari-literatur-awal"],
    sourceStateKey: "handoff_to_phenomenon.area_text",
    destinationStateKeys: ["area_eksplorasi"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.areaHandoffSummary,
    required: true,
  },
  {
    semanticKey: "selected_phenomenon",
    label: "Fenomena Terpilih",
    sourceTool: "cari-fenomena-awal",
    destinationTools: ["cari-literatur-awal", "bedah-hasil-notebooklm"],
    sourceStateKey: "phenomenon_summary",
    destinationStateKeys: ["fenomena_awal"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.selectedPhenomenon,
    required: true,
  },
  {
    semanticKey: "access_notes",
    label: "Catatan Akses Data",
    sourceTool: "cari-ide-skripsi",
    destinationTools: ["cari-fenomena-awal", "cari-literatur-awal"],
    sourceStateKey: "akses_data_catatan",
    destinationStateKeys: ["akses_data_catatan"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.accessNotes,
    required: false,
  },
  {
    semanticKey: "avoidances",
    label: "Hal yang Ingin Dihindari",
    sourceTool: "cari-ide-skripsi",
    destinationTools: ["cari-fenomena-awal", "cari-literatur-awal"],
    sourceStateKey: "avoidances",
    destinationStateKeys: ["avoidances"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.avoidanceNotes,
    required: false,
  },
  {
    semanticKey: "lecturer_direction",
    label: "Arahan Dosen",
    sourceTool: "cari-ide-skripsi",
    destinationTools: ["cari-fenomena-awal", "cari-literatur-awal", "bedah-hasil-notebooklm"],
    sourceStateKey: "supervisor_direction",
    destinationStateKeys: ["supervisor_direction", "arahan_dosen"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.lecturerDirection,
    required: false,
  },
  {
    semanticKey: "literature_focus",
    label: "Fokus Aspek Literatur",
    sourceTool: "cari-literatur-awal",
    destinationTools: ["cari-literatur-awal"],
    sourceStateKey: "fokus_aspek",
    destinationStateKeys: ["fokus_aspek"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.literatureFocus,
    promptProjectionLimit: NOTEBOOK_PROMPT_PROJECTION_LIMITS.promptB.literatureFocus,
    required: false,
  },
  {
    semanticKey: "unresolved_items",
    label: "Hal yang Masih Belum Ditentukan",
    sourceTool: "cari-literatur-awal",
    destinationTools: ["cari-literatur-awal"],
    sourceStateKey: "hal_terbuka",
    destinationStateKeys: ["hal_terbuka"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.unresolvedLiteratureItems,
    promptProjectionLimit: NOTEBOOK_PROMPT_PROJECTION_LIMITS.promptB.unresolvedItems,
    required: false,
  },
  {
    semanticKey: "keywords",
    label: "Kata Kunci Khusus",
    sourceTool: "cari-literatur-awal",
    destinationTools: ["cari-literatur-awal"],
    sourceStateKey: "kata_kunci",
    destinationStateKeys: ["kata_kunci"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.literatureKeywords,
    promptProjectionLimit: NOTEBOOK_PROMPT_PROJECTION_LIMITS.promptA.keywords,
    required: false,
  },
  {
    semanticKey: "publication_range",
    label: "Rentang Tahun Publikasi",
    sourceTool: "cari-literatur-awal",
    destinationTools: ["cari-literatur-awal"],
    sourceStateKey: "rentang_tahun",
    destinationStateKeys: ["rentang_tahun"],
    canonicalLimit: RESEARCH_FIELD_LIMITS.publicationRange,
    promptProjectionLimit: NOTEBOOK_PROMPT_PROJECTION_LIMITS.promptA.publicationRange,
    required: false,
  },
] as const;
