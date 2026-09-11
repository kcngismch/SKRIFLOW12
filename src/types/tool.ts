import { SelectOption } from "@/data/researchOptions";

export type PlatformTarget = "ChatGPT / Gemini" | "NotebookLM";
export type ToolIconName = "Lightbulb" | "BookOpen" | "GitCompare" | "Compass";

export interface FormFieldHelperLink {
  text: string;
  href: string;
}

export interface FormField {
  id: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  helperText?: string;
  defaultValue?: string;
  options?: SelectOption[];
  isAdvanced?: boolean;
  promptLabel?: string;
  fallbackPrompt?: string;
  helperLink?: FormFieldHelperLink;
  maxLength?: number;
}

export interface PromptTemplate {
  role: string;
  task: string;
  rules: string[];
  outputFormat: string[];
}

export interface ToolNavigationStep {
  label?: string;
  href: string;
  eyebrow?: string;
  title?: string;
}

export type ToolNextStep = ToolNavigationStep;

export interface Tool {
  id: string;
  slug: string;
  name: string;
  phase?: string;
  targetPlatform: PlatformTarget;
  description: string;
  badgeText?: string;
  iconName?: ToolIconName;
  fields: FormField[];
  promptConfig: PromptTemplate;
  previousStep?: ToolNavigationStep;
  nextStep: ToolNavigationStep;
  aliases?: string[];
}

export interface LockedPhase {
  id: string;
  title: string;
  badge: "COMING SOON";
  description?: string;
}

export type PhenomenonQualityRating = "KUAT" | "SEDANG" | "LEMAH";
export type PhenomenonStatus = "SIAP_DIBAWA" | "PERLU_DIPERIKSA" | "JANGAN_DIGUNAKAN";
export type GeneralPhenomenonStatus = PhenomenonStatus | "BELUM_TERVERIFIKASI";

export interface PhenomenonEvidence {
  claim: string;
  observedDataOrEvent: string;
  sourceTitle: string;
  publisherOrInstitution: string;
  sourceType: string;
  publicationDate: string;
  referencePeriod: string;
  url: string;
  evidenceLocation: string;
  accessNote: string;
  methodOrMetadata: string;
  limitations: string;
  userConfirmed: boolean;
}

export interface RawPhenomenonEvidence {
  /** Jejak audit identitas sumber (R-07). Diisi parser, bukan oleh AI. */
  identity_status?: SourceIdentityAuditStatus;
  claim: string;
  observed_data_or_event: string;
  source_title: string;
  publisher_or_institution: string;
  source_type: string;
  publication_date: string;
  reference_period: string;
  url: string;
  evidence_location?: string;
  access_note?: string;
  method_or_metadata: string;
  limitations: string;
}

export type GenericEventFamily =
  | "PUBLICATION"
  | "POLICY_CHANGE"
  | "ADOPTION"
  | "PRACTICE"
  | "PERFORMANCE"
  | "INCIDENT"
  | "OTHER";

export interface PhenomenonDefinition {
  eventOrCondition: string;
  eventFamily: GenericEventFamily | string;
  eventFamilyDetail?: string;
  primaryOutcome: string;
  secondaryOutcome?: string;
  objectOrPopulation: string;
  geography: string;
  referencePeriod: string;
}

export interface PhenomenonCoherenceAudit {
  status: "COHERENT_ENOUGH" | "NEEDS_NARROWING" | "INCOHERENT";
  mixedEvents: string[];
  mixedOutcomes: string[];
  notes: string[];
}

export interface SourceIndependenceAudit {
  articleCount: number;
  independentAuthorTeamCount: number;
  repeatedAuthorClusters: string[][];
  strength: "STRONG" | "MODERATE" | "WEAK";
}

export interface RawPhenomenonCandidate {
  id: string;
  name: string;
  phenomenon_type: string;
  phenomenon_summary: string;
  observed_condition: string;
  scope: {
    object_or_population: string;
    geography: string;
    reference_period: string;
  };
  relation_to_area: string;
  evidence: RawPhenomenonEvidence[];
  triangulation_note?: string;
  what_is_not_proven?: string;
  quality: Record<string, PhenomenonQualityRating>;
  status: PhenomenonStatus;
  effective_status?: PhenomenonStatus;
  status_override_reason?: string;
  keywords_id?: string[];
  keywords_en?: string[];
  unresolved_items?: string[];
  phenomenon_definition?: PhenomenonDefinition;
  phenomenon_coherence_audit?: PhenomenonCoherenceAudit;
  source_independence_audit?: SourceIndependenceAudit;
}

export interface PhenomenonTransferPayload {
  schema_version: number;
  insufficient_evidence: boolean;
  context?: {
    prodi?: string;
    area?: string;
    scope_preference?: string;
    time_preference?: string;
  };
  candidates: RawPhenomenonCandidate[];
  search_notes?: string[];
}

export interface SelectedPhenomenon {
  schemaVersion: 1;
  sourceToolSlug: string;
  candidateId: string;
  name: string;
  status: "SIAP_DIBAWA" | "PERLU_DIPERIKSA";
  effectiveStatus?: PhenomenonStatus;
  statusOverrideReason?: string;
  phenomenonType: string;
  phenomenonSummary: string;
  observedCondition: string;
  relationToArea: string;
  scope: {
    objectOrPopulation: string;
    geography: string;
    referencePeriod: string;
  };
  evidence: PhenomenonEvidence[];
  triangulationNote: string;
  whatIsNotProven: string;
  quality: Record<string, "KUAT" | "SEDANG" | "LEMAH">;
  keywordsId: string[];
  keywordsEn: string[];
  unresolvedItems: string[];
  sourceConfirmationCount: number;
  phenomenonDefinition?: PhenomenonDefinition;
  phenomenonCoherenceAudit?: PhenomenonCoherenceAudit;
  sourceIndependenceAudit?: SourceIndependenceAudit;
  fingerprint?: string;
  createdAt: string;
  updatedAt: string;
}

// =========================================================================
// TOOL 1: CARI IDE SKRIPSI V3 TYPES & PROVENANCE
// =========================================================================

export type PrioritySourceType =
  | "OFFICIAL_DATA"
  | "REGULATION"
  | "INSTITUTIONAL_REPORT"
  | "EMPIRICAL_ARTICLE"
  | "WORKING_PAPER"
  | "REPUTABLE_NEWS";

export type DataOrigin =
  | "PUBLIC_SECONDARY"
  | "RESEARCHER_GENERATED"
  | "PRIMARY_RESPONDENT"
  | "INSTITUTIONAL_METADATA";

export type DataAccessStatus =
  | "INDICATED"
  | "NEEDS_CHECKING"
  | "NOT_CONFIRMED";

export interface DataProvenanceItem {
  dataForm: string;
  origin: DataOrigin;
  accessStatus: DataAccessStatus;
  methodologicalNote: string;
}

export interface ResearchContext {
  potentialActors: string[];
  potentialEntities: string[];
  potentialDocuments: string[];
  potentialDataArtifacts: string[];
  potentialGeographies: string[];
}

export type PhenomenonDirectionType =
  | "ADOPTION"
  | "PRACTICE_CHANGE"
  | "OUTPUT_BEHAVIOR"
  | "ACCURACY_RELIABILITY"
  | "REGULATION"
  | "MARKET_PATTERN"
  | "DISCLOSURE_USE"
  | "DISCREPANCY"
  | "OTHER_OBSERVABLE";

export interface PhenomenonSearchDirectionV3 {
  label: string;
  directionType: PhenomenonDirectionType;
  searchQuestion: string;
  observableSignals: string[];
  prioritySourceTypes: PrioritySourceType[];
}

export interface LiteratureSearchSeeds {
  concepts: string[];
  keywordsId: string[];
  keywordsEn: string[];
}

export interface ScopeBoundary {
  inScope: string[];
  outOfScope: string[];
  boundaryNote: string;
}

export interface HandoffToPhenomenonV3 {
  areaText: string;
  actorText: string;
  entityText: string;
  documentText: string;
  dataArtifactText: string;
  initialClue: string;
  observableSignals: string[];
  inScope: string[];
  outOfScope: string[];
  prioritySourceTypes: PrioritySourceType[];
}

export type FieldOrigin = "AUTOFILL_IDEA" | "USER_EDITED" | "DEFAULT";

export interface IdeaExplorationSession {
  sessionId: string;
  createdAt: string;
  contextFingerprint: string;
  roundCount: number;
  maxRounds: 3;
  resultSetIds: string[];
  rejectedAreaIds: string[];
  rejectionReasons: RejectionReason[];
  contextSnapshot?: Record<string, string>;
}

export interface IdeaToPhenomenonHandoff {
  handoffVersion: 2;
  sessionId?: string;
  sourceResultSetId: string;
  sourcePayloadFingerprint: string;
  sourceRoundNumber: number;
  selectedAreaId: string;
  selectedAreaName: string;
  createdAt: string;

  prodi: string;
  areaText: string;

  researchContext: {
    actorText: string;
    entityText: string;
    documentText: string;
    dataArtifactText: string;
  };

  phenomenonContext: {
    initialClue: string;
    observableSignals: string[];
    inScope: string[];
    outOfScope: string[];
    prioritySourceTypes: PrioritySourceType[];
  };

  studentConstraints: {
    preferredApproach: string;
    preferredData: string;
    dataAccess: string;
    accessNotes: string;
    thingsToAvoid: string;
    timeCondition: string;
    otherConstraints: string;
    lecturerDirection: string;
  };
}

export interface StudentResearchProfile {
  prodi: string;
  initialInterest?: string;
  preferredApproach?: string;
  preferredData?: string;
  existingDataAccess?: string;
  dataAccessNotes?: string;
  avoidedActivities?: string;
  timeCondition?: string;
  otherConstraints?: string;
  supervisorDirection?: string;
}

export interface ResearchShapePreview {
  possibleFocus: string;
  likelyEvidenceNeeded: string[];
  illustrativeTitlePattern: string;
  unresolvedBeforeTitle: string[];
  warning: string;
}

export type RejectionReason =
  | "INTEREST_MISMATCH"
  | "STUDY_PROGRAM_MISMATCH"
  | "DATA_DISCOMFORT"
  | "ACCESS_UNCLEAR"
  | "TOO_COMPLEX"
  | "TOO_HEAVY"
  | "RESPONDENT_OR_FIELDWORK"
  | "LECTURER_DIRECTION_MISMATCH"
  | "AREAS_TOO_SIMILAR"
  | "OTHER";

export interface RejectedAreaRound {
  roundId: string;
  createdAt: string;
  rejectedAreas: Array<{
    areaId: string;
    areaName: string;
  }>;
  reasons: RejectionReason[];
  additionalNote: string;
}

export type RecommendationStatus =
  | "RECOMMENDED_SINGLE"
  | "RECOMMENDED_TIE"
  | "NO_SAFE_RECOMMENDATION";

export interface AreaRecommendationResult {
  sessionId?: string;
  resultSetId?: string;
  payloadFingerprint?: string;
  status: RecommendationStatus;
  primaryAreaId?: string;
  primaryAreaName?: string;
  reasons: string[];
  assumptions: string[];
  risks: string[];
  mainCheckNext: string;
  secondaryAreaId?: string;
  secondaryAreaName?: string;
  // For tie
  tieAreaIds?: [string, string];
  tieAreaNames?: [string, string];
  tieDistinctions?: string[];
  // For no safe recommendation
  conflictingConstraints?: string[];
  mainRisks?: string[];
  clarificationNeeded?: string[];
  createdAt?: string;
}

export interface ActiveIdeaResultSet {
  sessionId?: string;
  resultSetId: string;
  roundNumber: number;
  payloadFingerprint: string;
  parsedAt: string;
  parsedResult: SkriflowIdeaResultV3;
}

export interface FocusContinuity {
  originalInterestElements: string[];
  retainedElements: string[];
  shiftedElements: string[];
  shiftStatus: "SAME_CORE" | "ADJACENT_SHIFT" | "MAJOR_SHIFT";
  explanation: string;
}

export type AreaRole =
  | "CLOSEST_TO_ORIGINAL_INTEREST"
  | "ADJACENT_MORE_FEASIBLE"
  | "CONSTRAINT_SAFE_ALTERNATIVE";

export interface ConstraintFitAssessment {
  dataOriginFit: "ALIGNED" | "NEEDS_CHECKING" | "CONFLICT";
  fieldworkFit: "ALIGNED" | "NEEDS_CHECKING" | "CONFLICT";
  timeFit: "ALIGNED" | "NEEDS_CHECKING" | "CONFLICT";
  overall: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO";
  reasons: string[];
}

export interface ExplorationAreaCandidateV3 {
  id: string;
  name: string;
  scopeSummary: string;
  academicConnection: string;
  interestConnection: string;

  dataProvenance: DataProvenanceItem[];
  researchContext: ResearchContext;
  scopeBoundary: ScopeBoundary;

  phenomenonSearchBrief: string;
  phenomenonSearchDirections: PhenomenonSearchDirectionV3[];

  literatureSearchSeeds: LiteratureSearchSeeds;

  constraintFit: {
    status: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO";
    reason: string;
    assumptions: string[];
    risks: string[];
  };

  focusContinuity?: FocusContinuity;
  areaRole?: AreaRole;
  constraintFitAssessment?: ConstraintFitAssessment;

  unresolvedItems: string[];
  notDecided: string[];

  handoffToPhenomenon: HandoffToPhenomenonV3;

  researchShapePreview?: ResearchShapePreview;
}

export interface ExplorationComparisonV3 {
  areaId: string;
  interestFit: "SANGAT_DEKAT" | "DEKAT" | "CUKUP_DEKAT" | "PERLU_DIPERIKSA";
  studyProgramFit: "KUAT" | "SEDANG" | "LEMAH" | "PERLU_DIPERIKSA";
  dataFit: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO";
  collectionBurden: "RENDAH_SEMENTARA" | "SEDANG" | "TINGGI" | "PERLU_DIPERIKSA";
  methodologicalUncertainty: "RENDAH" | "SEDANG" | "TINGGI" | "PERLU_DIPERIKSA";
  mainCheckNext: string;
}

export interface SkriflowIdeaResultV3 {
  schemaVersion: 3;
  sessionId?: string;
  resultSetId?: string;
  payloadFingerprint?: string;
  areas: ExplorationAreaCandidateV3[];
  comparison: ExplorationComparisonV3[];
  selectionGuidance: string[];
  rawResponse: string;
  sourceInputFingerprint: string;
  importedAt: string;
}

export interface SelectedExplorationAreaV3 {
  schemaVersion: 3;
  sessionId?: string;
  resultSetId?: string;
  payloadFingerprint?: string;
  areaId: string;
  name: string;
  scopeSummary: string;
  academicConnection: string;
  interestConnection: string;

  dataProvenance: DataProvenanceItem[];
  researchContext: ResearchContext;
  scopeBoundary: ScopeBoundary;

  phenomenonSearchBrief: string;
  phenomenonSearchDirections: PhenomenonSearchDirectionV3[];

  literatureSearchSeeds: LiteratureSearchSeeds;

  constraintFit: ExplorationAreaCandidateV3["constraintFit"];
  focusContinuity?: FocusContinuity;
  areaRole?: AreaRole;
  constraintFitAssessment?: ConstraintFitAssessment;
  unresolvedItems: string[];
  notDecided: string[];

  handoffToPhenomenon: HandoffToPhenomenonV3;

  researchShapePreview?: ResearchShapePreview;

  sourceInputFingerprint: string;
  selectedAt: string;
  updatedAt: string;
}

// Legacy V2 backward compatibility types
export interface PhenomenonSearchDirection {
  label: string;
  searchQuestion: string;
  observableSignals: string[];
  prioritySourceTypes: PrioritySourceType[];
}

export interface ExplorationAreaCandidate {
  id: string;
  name: string;
  scopeSummary: string;
  academicConnection: string;
  interestConnection: string;
  candidateObjects: string[];
  phenomenonSearchBrief: string;
  phenomenonSearchDirections: PhenomenonSearchDirection[];
  possibleDataForms: string[];
  constraintFit: {
    status: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO";
    reason: string;
    assumptions: string[];
    risks: string[];
  };
  keywordsId: string[];
  keywordsEn: string[];
  unresolvedItems: string[];
  notDecided: string[];
  handoffToPhenomenon: {
    areaText: string;
    objectText: string;
    initialClue: string;
    keywordsId: string[];
    keywordsEn: string[];
    prioritySourceTypes: string[];
  };
}

export interface ExplorationComparison {
  areaId: string;
  interestFit: "SANGAT_DEKAT" | "DEKAT" | "CUKUP_DEKAT" | "PERLU_DIPERIKSA";
  studyProgramFit: "KUAT" | "SEDANG" | "LEMAH" | "PERLU_DIPERIKSA";
  dataFit: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO";
  collectionBurden: "RENDAH_SEMENTARA" | "SEDANG" | "TINGGI" | "PERLU_DIPERIKSA";
  methodologicalUncertainty: "RENDAH" | "SEDANG" | "TINGGI" | "PERLU_DIPERIKSA";
  mainCheckNext: string;
}

export interface SkriflowIdeaResultV2 {
  schemaVersion: 2;
  areas: ExplorationAreaCandidate[];
  comparison: ExplorationComparison[];
  selectionGuidance: string[];
  rawResponse: string;
  sourceInputFingerprint: string;
  importedAt: string;
}

export interface SelectedExplorationAreaV2 {
  schemaVersion: 2;
  areaId: string;
  name: string;
  scopeSummary: string;
  academicConnection: string;
  interestConnection: string;
  candidateObjects: string[];
  phenomenonSearchBrief: string;
  phenomenonSearchDirections: PhenomenonSearchDirection[];
  possibleDataForms: string[];
  constraintFit: ExplorationAreaCandidate["constraintFit"];
  keywordsId: string[];
  keywordsEn: string[];
  unresolvedItems: string[];
  notDecided: string[];
  handoffToPhenomenon: ExplorationAreaCandidate["handoffToPhenomenon"];
  sourceInputFingerprint: string;
  selectedAt: string;
  updatedAt: string;
}

export interface ResearchConstraintsContext {
  pendekatan?: string;
  dataNyaman?: string;
  aksesData?: string;
  catatanAkses?: string;
  halDihindari?: string;
  kondisiWaktu?: string;
  arahanDosen?: string;
}

export interface SharedResearchContext {
  prodi?: string;
  minat?: string;
  initialInterest?: string;
  area_eksplorasi?: string;
  selectedArea?: string;
  selectedExplorationArea?: SelectedExplorationAreaV3 | SelectedExplorationAreaV2 | null;
  selected_exploration_area?: SelectedExplorationAreaV3 | SelectedExplorationAreaV2 | null;
  ideaToPhenomenonHandoff?: IdeaToPhenomenonHandoff | null;
  idea_to_phenomenon_handoff?: IdeaToPhenomenonHandoff | null;
  idea_input_fingerprint?: string;
  fenomena_ringkas?: string;
  fenomena_status?: GeneralPhenomenonStatus;
  selected_phenomenon?: SelectedPhenomenon | null;
  selectedPhenomenon?: SelectedPhenomenon | null;
  constraints?: ResearchConstraintsContext;
  pendekatan?: string;
  preferensi_data?: string;
  akses_data?: string;
  akses_data_catatan?: string;
  avoidances?: string;
  target_waktu?: string;
  supervisor_direction?: string;
  keywords?: string[];
  unresolved_items?: string[];
  unresolvedItems?: string[];
  lastUpdated?: string;
}

// =========================================================================
// TOOL 4: BEDAH FENOMENA & LITERATUR TYPES
// =========================================================================

export type BedahInputStatus =
  | "BUKTI_CUKUP_UNTUK_DIBEDAH"
  | "BUKTI_TERBATAS"
  | "SUMBER_PERLU_DITAMBAH"
  | "FENOMENA_DAN_LITERATUR_TIDAK_SELARAS";

export type ResearchGapType =
  | "EMPIRICAL"
  | "CONTEXTUAL"
  | "MEASUREMENT"
  | "DATA"
  | "METHODOLOGICAL"
  | "THEORETICAL";

export type ResearchGapStrength =
  | "TERDUKUNG_KUAT"
  | "TERDUKUNG_SEMENTARA"
  | "PERLU_SUMBER_TAMBAHAN"
  | "TIDAK_CUKUP";

export type DirectionFitRating = "KUAT" | "SEDANG" | "LEMAH" | "PERLU_DIPERIKSA";

export type DataReadinessStatus =
  | "BELUM_DIPERIKSA"
  | "ADA_INDIKASI_DATA"
  | "DATA_TERKONFIRMASI";

export type LiteraturePackageValidationStatus =
  | "STRUKTUR_LENGKAP"
  | "STRUKTUR_PERLU_DIPERIKSA"
  | "PAKET_TIDAK_DIKENALI";

export interface LiteraturePackageValidationResult {
  status: LiteraturePackageValidationStatus;
  hasKonteks: boolean;
  hasStatusSumber: boolean;
  hasSourceRegister: boolean;
  hasIntiSource: boolean;
  hasMatriksBukti: boolean;
  hasEvidence: boolean;
  hasStopSentence: boolean;
  isPromptAOutput: boolean;
  isResearchReport: boolean;
  missingParts: string[];
  notes: string[];
}

export interface CalibratedPhenomenon {
  summary: string;
  scope?: string;
  reference_period?: string;
  anchor_sources?: string[];
  what_is_not_proven?: string[];
  prohibited_claims?: string[];
}

export interface CandidateGap {
  id: string; // e.g. "G01"
  gap_type: ResearchGapType;
  statement: string;
  what_is_known: string[];
  what_is_unexplained: string;
  anchor_sources: string[];
  strength: ResearchGapStrength;
  scope_limits?: string[];
  verification_needed?: string[];
  prohibited_claims?: string[];
}

export interface BackgroundMapItem {
  order: number;
  function: string;
  anchor_sources: string[];
  safe_claims: string[];
  prohibited_claims: string[];
}

export interface ResearchDirection {
  id: string; // e.g. "D01"
  name: string;
  problem_focus: string;
  phenomenon_link: string;
  gap_ids: string[];
  anchor_sources: string[];
  data_needs: string[];
  data_sources_to_check: string[];
  possible_design_families: string[];
  constraint_fit: DirectionFitRating;
  main_work: string[];
  academic_risks: string[];
  data_risks: string[];
  unresolved_items: string[];
  readiness: DirectionFitRating;
  background_map: BackgroundMapItem[];
}

export interface BedahTransferPayload {
  schema_version: 1;
  input_status: BedahInputStatus;
  automatic_selection: false;
  calibrated_phenomenon: CalibratedPhenomenon;
  candidate_gaps: CandidateGap[];
  directions: ResearchDirection[];
  guidance_points?: string[];
  recovery_actions?: string[];
}

export interface SelectedResearchDirection {
  directionId: string;
  name: string;
  problemFocus: string;
  phenomenonLink: string;
  gapIds: string[];
  anchorSources: string[];
  dataNeeds: string[];
  possibleDesignFamilies: string[];
  readiness: DirectionFitRating;
}

export interface ResearchGapSementara {
  gapId: string;
  gapType: ResearchGapType;
  statement: string;
  strength: ResearchGapStrength;
  anchorSources: string[];
}

export interface ResearchFoundationBrief {
  schemaVersion: 1;
  prodi: string;
  areaEksplorasi: string;
  calibratedPhenomenon: CalibratedPhenomenon;
  phenomenonEvidence: unknown[];
  problemFocus: string;
  selectedGap: ResearchGapSementara[];
  selectedDirection: SelectedResearchDirection;
  anchorSources: string[];
  dataNeeds: string[];
  dataReadinessStatus: DataReadinessStatus;
  dataSourcesToCheck: string[];
  possibleDesignFamilies: string[];
  studentConstraints: Record<string, string>;
  supervisorDirection?: string;
  academicRisks: string[];
  dataRisks: string[];
  backgroundMap: BackgroundMapItem[];
  guidancePoints: string[];
  unresolvedItems: string[];
  recoveryActions: string[];
  inputFingerprint: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchBedahInput {
  prodi: string;
  areaEksplorasi: string;
  selectedPhenomenon?: SelectedPhenomenon | null;
  studentConstraints?: {
    preferredApproach?: string;
    preferredData?: string;
    existingDataAccess?: string;
    dataAccessNotes?: string;
    avoidedActivities?: string;
    timeCondition?: string;
    additionalNotes?: string;
  };
  additionalNotes?: string;
  supervisorDirection?: string;
  literatureEvidencePackage: string;
}

// =========================================================================
// TAHAP 4A: DIRECTION V2 (SKRIFLOW_DIRECTION_V2)
// =========================================================================

export type InputAuditStatusV2 =
  | "BUKTI_TIDAK_CUKUP"
  | "CUKUP_UNTUK_EKSPLORASI"
  | "CUKUP_UNTUK_ARAH";

export type ComparabilityRating =
  | "SEBANDING"
  | "SEBANDING_SEBAGIAN"
  | "TIDAK_SEBANDING";

export type ResearchGapTypeV2 =
  | "EMPIRICAL_INCONSISTENCY"
  | "MEASUREMENT"
  | "CONTEXTUAL_BOUNDARY"
  | "TEMPORAL_OR_REGULATORY"
  | "METHODOLOGICAL_LIMITATION"
  | "EVIDENCE_COVERAGE";

export type ResearchGapStrengthV2 =
  | "DIDUKUNG_DALAM_PAKET"
  | "TERDUKUNG_SEMENTARA"
  | "PERLU_SUMBER_TAMBAHAN"
  | "TIDAK_DAPAT_DIBANDINGKAN"
  | "TIDAK_DIDUKUNG";

export type QualitativeScore = "KUAT" | "SEDANG" | "LEMAH";
export type RiskLevel = "TINGGI" | "SEDANG" | "RENDAH";
export type WorkloadLevel = "RENDAH" | "SEDANG" | "TINGGI";

export type DirectionReadinessV2 =
  | "LAYAK_DIPERIKSA"
  | "PERLU_SUMBER_TAMBAHAN"
  | "RISIKO_TINGGI"
  | "JANGAN_DIBAWA";

export interface InputAuditV2 {
  status: InputAuditStatusV2;
  phenomenon_source_count: number;
  core_source_count: number;
  supporting_source_count: number;
  ignored_source_count: number;
  source_integrity_notes: string[];
  main_limitations: string[];
  recovery_actions: string[];
}

export interface CalibratedPhenomenonEvidenceV2 {
  source_id: string;
  source_title: string;
  claim: string;
  evidence_location: string;
  context: string;
  limitations: string;
}

export interface CalibratedPhenomenonWhyItMattersV2 {
  statement: string;
  source_ids: string[];
  limitations: string;
}

export interface CalibratedPhenomenonV2 {
  summary: string;
  empirical_problem: string;
  knowledge_problem: string;
  scope: {
    object_or_population: string;
    geography: string;
    reference_period: string;
    event_or_context: string;
  };
  evidence: CalibratedPhenomenonEvidenceV2[];
  why_it_matters: CalibratedPhenomenonWhyItMattersV2[];
  what_is_not_proven: string[];
  prohibited_claims: string[];
}

export interface EstablishedKnowledgeItemV2 {
  statement: string;
  source_ids: string[];
  scope_limit: string;
}

export interface ConsistentFindingItemV2 {
  statement: string;
  source_ids: string[];
  comparability_note: string;
}

export interface DifferingFindingItemV2 {
  statement: string;
  source_ids: string[];
  comparability: ComparabilityRating;
  explanation: string;
}

export interface KnowledgeMapV2 {
  established_knowledge: EstablishedKnowledgeItemV2[];
  relatively_consistent_findings: ConsistentFindingItemV2[];
  differing_findings: DifferingFindingItemV2[];
  measurement_limits: string[];
  context_limits: string[];
  data_limits: string[];
  methodological_limits: string[];
  conclusions_not_allowed: string[];
}

export interface ComparabilityGroupV2 {
  id: string;
  source_ids: string[];
  construct_or_predictor: string;
  outcome: string;
  proxies: string[];
  objects_and_periods: string[];
  relationship_type: string;
  comparability: ComparabilityRating;
  reason: string;
}

export interface CandidateGapAssessmentV2 {
  phenomenon_relevance: QualitativeScore;
  traceability: QualitativeScore;
  comparability: QualitativeScore;
  evidence_strength: QualitativeScore;
  feasibility: QualitativeScore;
  overclaim_risk: RiskLevel;
}

export type CandidateGapStatus =
  | "TERINDIKASI"
  | "PERLU_VERIFIKASI"
  | "CUKUP_DIDUKUNG";

export interface CandidateGapV2 {
  id: string;
  gap_type: ResearchGapTypeV2;
  statement: string;
  what_is_known: string[];
  what_is_unexplained: string;
  phenomenon_link: string;
  source_ids: string[];
  comparability_basis: string;
  strength: ResearchGapStrengthV2;
  gap_status?: CandidateGapStatus;
  scope_limits: string[];
  verification_needed: string[];
  prohibited_claims: string[];
  assessment: CandidateGapAssessmentV2;
  gap_assessment?: GapAssessment;
}

export interface DataVerificationQuestionV2 {
  id: string;
  question: string;
  critical: boolean;
  related_data_need: string;
}

export interface DirectionMeasurementFocus {
  primary_outcome: string;
  supporting_outcome: string | null;
  non_equivalence_note: string;
}

export interface ClaimBoundary {
  safe_to_say: string[];
  not_safe_to_say: string[];
}

export type DirectionConditionalBadge =
  | "Paling Dekat dengan Fenomena"
  | "Lebih Aman untuk Tenggat"
  | "Data Perlu Dicek"
  | "Perlu Fokus Lebih Sempit"
  | "Bukti Literatur Masih Terbatas";

export interface ResearchDirectionV2 {
  id: string;
  name: string;
  problem_focus: string;
  phenomenon_link: string;
  gap_ids: string[];
  anchor_source_ids: string[];
  potential_unit_of_analysis: string[];
  potential_objects: string[];
  potential_constructs: string[];
  candidate_outcomes: string[];
  measurement_focus?: DirectionMeasurementFocus;
  claim_boundary?: ClaimBoundary;
  conditional_badge?: DirectionConditionalBadge | string;
  phenomenon_connection?: string;
  why_worth_considering?: string;
  workload_risk?: string;
  previously_used_proxies: string[];
  data_needs: string[];
  data_sources_to_check: string[];
  possible_design_families: string[];
  constraint_fit: QualitativeScore;
  workload: WorkloadLevel;
  main_work: string[];
  academic_risks: string[];
  data_risks: string[];
  scope_boundaries: {
    in_scope: string[];
    out_of_scope: string[];
  };
  unresolved_items: string[];
  data_verification_questions: DataVerificationQuestionV2[];
  readiness: DirectionReadinessV2;
}

export interface ConditionalRecommendationV2 {
  recommended_direction_ids: string[];
  reasoning: string;
  conditions: string[];
  not_a_selection: true;
}

export interface EvidenceBasisV2 {
  observed_phenomenon: string[];
  prior_study_findings: string[];
  not_yet_established: string[];
}

export type SourceWeight = "UTAMA" | "PENDUKUNG" | "PERLU_DIPERIKSA";

export interface SourceWeightItem {
  source_id: string;
  weight: SourceWeight;
  reason?: string;
  note?: string;
  document_type?: string;
  /** Judul dokumen sumber. Dipakai untuk jejak audit mahasiswa/dosen. */
  title?: string;
  /** Tautan dokumen. Null bila AI tidak menyertakan. */
  url?: string;
  /** DOI bila sumber berupa artikel jurnal. */
  doi?: string;
  /**
   * Status identitas sumber hasil audit deterministik:
   * VERIFIED = punya identitas yang bisa dicek (URL/DOI),
   * NEEDS_CHECK = identitas ada tetapi belum diverifikasi ke sumber luar,
   * MISSING = tidak ada URL maupun DOI.
   */
  identity_status?: SourceIdentityAuditStatus;
}

export type SourceIdentityAuditStatus = "VERIFIED" | "NEEDS_CHECK" | "MISSING";

export interface DirectionV2 {
  schema_version: 2;
  automatic_selection: false;
  input_audit: InputAuditV2;
  evidence_basis?: EvidenceBasisV2;
  calibrated_phenomenon: CalibratedPhenomenonV2;
  knowledge_map: KnowledgeMapV2;
  comparability_groups: ComparabilityGroupV2[];
  candidate_gaps: CandidateGapV2[];
  directions: ResearchDirectionV2[];
  comparison_summary: string;
  conditional_recommendation: ConditionalRecommendationV2;
  guidance_points: string[];
  recovery_actions: string[];
  source_weights?: SourceWeightItem[];
  phenomenon_basis_status?: PhenomenonBasisStatus;
  academic_audit?: InputAcademicAudit;
  recovery_search?: RecoverySearch;
}

// Feasibility Answers State
export type FeasibilityAnswerStatus = "SUDAH_DIPASTIKAN" | "BELUM_DIPASTIKAN" | "TIDAK_TERSEDIA";
export type DataReadinessOutcome = "DATA_READY" | "DATA_CONDITIONAL" | "DATA_BLOCKED";

export interface DirectionFeasibilityState {
  directionId: string;
  answers: Record<string, FeasibilityAnswerStatus>; // questionId -> status
  accessNotes: string;
  computedReadiness: DataReadinessOutcome;
  lastUpdated: string;
}

// =========================================================================
// TAHAP 4B: BAB 1 FOUNDATION V1 (SKRIFLOW_BAB1_FOUNDATION_V1)
// =========================================================================

export type Bab1FoundationStatus = "BAB1_READY" | "BAB1_CONDITIONAL" | "BAB1_BLOCKED";

export interface Bab1ProblemStructure {
  empirical_phenomenon: string;
  empirical_problem: string;
  knowledge_problem: string;
  candidate_gap_statement: string;
  gap_ids: string[];
  gap_strengths: string[];
  provisional_research_problem: string;
}

export interface ResearchLogicChainItem {
  order: number;
  stage:
    | "CONTEXT"
    | "PHENOMENON"
    | "EMPIRICAL_PROBLEM"
    | "PRIOR_KNOWLEDGE"
    | "KNOWLEDGE_LIMIT"
    | "RESEARCH_DIRECTION"
    | "RESEARCH_QUESTION";
  statement: string;
  evidence_source_ids: string[];
  limitations: string;
}

export interface CandidateResearchQuestion {
  id: string;
  question: string;
  linked_gap_ids: string[];
  linked_source_ids: string[];
  assumptions: string[];
  unresolved_terms: string[];
}

export interface CandidateObjective {
  id: string;
  linked_question_id: string;
  objective: string;
}

export interface ProvisionalContributions {
  empirical: string[];
  practical: string[];
  academic: string[];
  methodological: string[];
  prohibited_contribution_claims: string[];
}

export interface TentativeScope {
  unit_of_analysis: string;
  object_or_population: string;
  geography: string;
  event_or_context: string;
  potential_period: string;
  potential_data_sources: string[];
  in_scope: string[];
  out_of_scope: string[];
  unresolved_items: string[];
}

export interface WorkingTitlePreview {
  id: string;
  title: string;
  label: "GAMBARAN_BUKAN_JUDUL_FINAL";
  assumptions: string[];
  missing_decisions: string[];
}

export type ClaimType =
  | "EMPIRICAL_FACT"
  | "CROSS_SOURCE_SYNTHESIS"
  | "RESEARCHER_DECISION";

export type PhenomenonBasisStatus =
  | "VERIFIED_REAL_WORLD"
  | "LITERATURE_INDICATED"
  | "MISSING";

export interface BackgroundMapSafeClaim {
  claim_id: string;
  statement: string;
  claim_type?: ClaimType;
  source_ids: string[];
  decision_basis?: string | null;
  support_status?: EvidenceLedgerSupportStatus;
}

export type BackgroundParagraphFunction =
  | "SPECIFIC_CONTEXT"
  | "OBJECT_AND_SCOPE"
  | "EMPIRICAL_PHENOMENON"
  | "WHY_IT_IS_A_PROBLEM"
  | "PRIOR_RESEARCH"
  | "KNOWLEDGE_LIMIT_OR_GAP"
  | "URGENCY_AND_DIRECTION";

export interface BackgroundMapItemV2 {
  order: number;
  function: BackgroundParagraphFunction;
  key_message: string;
  safe_claims: BackgroundMapSafeClaim[];
  prohibited_claims: string[];
  transition_to_next: string;
  missing_information: string[];
  readiness: "READY" | "NEEDS_VERIFICATION" | "BLOCKED";
}

export type EvidenceLedgerSupportStatus =
  | "READY_TO_DRAFT"
  | "NEEDS_VERIFICATION"
  | "DO_NOT_USE";

export interface LedgerSourceWeightItem {
  source_id: string;
  weight: SourceWeight;
}

export interface EvidenceLedgerItem {
  claim_id: string;
  claim: string;
  claim_type?: ClaimType;
  source_ids?: string[];
  source_id?: string; // legacy backward-compatibility
  source_weights?: LedgerSourceWeightItem[];
  source_weight?: SourceWeight;
  evidence_location: string;
  original_context: string;
  bab1_function: string;
  usage_limit: string;
  support_status?: EvidenceLedgerSupportStatus;
  decision_basis?: string | null;
}

export interface FeasibilitySummary {
  confirmed_data: string[];
  unconfirmed_data: string[];
  unavailable_data: string[];
  implications: string[];
}

export interface Bab1FoundationV1 {
  schema_version: 1;
  foundation_status: Bab1FoundationStatus;
  status_reason: string;
  blocking_items: string[];
  selected_direction: {
    id: string;
    name: string;
    student_selected: true;
    selection_reason: string;
    direction_readiness: string;
    data_readiness: DataReadinessOutcome;
  };
  problem_structure: Bab1ProblemStructure;
  research_logic_chain: ResearchLogicChainItem[];
  candidate_research_questions: CandidateResearchQuestion[];
  candidate_objectives: CandidateObjective[];
  provisional_contributions: ProvisionalContributions;
  tentative_scope: TentativeScope;
  working_title_previews: WorkingTitlePreview[];
  background_map: BackgroundMapItemV2[];
  evidence_ledger: EvidenceLedgerItem[];
  feasibility_summary: FeasibilitySummary;
  supervisor_questions: string[];
  unresolved_decisions: string[];
  prohibited_claims: string[];
  recovery_actions: string[];
  phenomenon_basis_status?: PhenomenonBasisStatus;
  academic_audit?: InputAcademicAudit;
  paragraph_claims?: ParagraphClaim[];
  normalization_warnings?: string[];
}

// Complete Saved Package in localStorage
export interface SavedBab1FoundationPackage {
  schemaVersion: 2;
  prodi: string;
  areaEksplorasi: string;
  selectedPhenomenon?: SelectedPhenomenon | null;
  phenomenonBasisStatus?: PhenomenonBasisStatus;
  studentConstraints?: Record<string, string>;
  supervisorDirection?: string;
  directionV2: DirectionV2;
  selectedDirectionId: string;
  feasibilityState: DirectionFeasibilityState;
  foundationV1: Bab1FoundationV1;
  confirmedWithSupervisorCheckbox: boolean;
  savedAt: string;
  inputFingerprint: string;
}

// =========================================================================
// ACADEMIC AUDIT & VERIFICATION GATES (TOOL 3 & TOOL 4)
// =========================================================================

export interface SourceIdentity {
  title: string;
  authors: string[];
  year: string;
  journalOrPublisher: string;
  documentType: string;
  doi?: string;
  fullTextUrl: string;
  identityStatus: "VERIFIED" | "INDICATED" | "NEEDS_MANUAL_CHECK" | "INVALID";
  fullTextStatus: "FULL_TEXT_VERIFIED" | "PARTIAL" | "METADATA_ONLY" | "UNAVAILABLE";
}

export interface DirectRelevance {
  eventOrExposure: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN";
  constructOrInformation: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN";
  outcome: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN";
  object: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN";
  geography: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN";
  design: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN";
  overall: "DIRECT" | "PARTIAL" | "CONTEXT_ONLY" | "IRRELEVANT";
  classificationReason: string;
}

export type AcademicRole =
  | "INTI_LANGSUNG"
  | "INTI_SEBAGIAN"
  | "PENDUKUNG_KONTEKS"
  | "REVIEW_ONLY"
  | "DIABAIKAN";

export interface EvidenceItem {
  sourceId: string;
  claimType: "EMPIRICAL_FACT" | "CROSS_SOURCE_SYNTHESIS";
  neutralClaim: string;
  exactEvidence: string;
  locator: {
    page?: string;
    table?: string;
    section?: string;
    status: "EXACT" | "APPROXIMATE" | "NOT_FOUND";
  };
  sampleContext: string;
  referencePeriod: string;
  statisticalObject?: string;
  interpretationStatus: "SAFE" | "NEEDS_CHECK" | "STATISTICAL_RED_FLAG";
  usageLimit: string;
}

export interface InputAcademicAudit {
  directCoreSourceCount: number;
  partialCoreSourceCount: number;
  independentAuthorTeamCount: number;
  metadataConflictCount: number;
  exactLocatorCount: number;
  phenomenonCoherence: "COHERENT_ENOUGH" | "NEEDS_NARROWING" | "INCOHERENT";
  status: "ENOUGH_FOR_GAP_ANALYSIS" | "ENOUGH_FOR_EXPLORATION_ONLY" | "INSUFFICIENT";
  blockers: string[];
}

export interface GapAssessment {
  origin: "FIELD_EVIDENCE" | "PACKAGE_COVERAGE" | "COMPARABILITY_LIMIT";
  validity: "SUPPORTED" | "PROVISIONAL" | "NOT_A_RESEARCH_GAP";
  comparableSourceIds: string[];
  independentAuthorTeamCount: number;
  relationToPhenomenon: string;
  prohibitedClaims: string[];
}

export interface RecoverySearch {
  required: boolean;
  missingEvidence: string[];
  targetEventOrExposure: string;
  targetOutcome: string;
  targetObjectAndContext: string;
  querySeedsId: string[];
  querySeedsEn: string[];
  stopCondition: string;
}

export interface ParagraphClaimReference {
  authorsYear: string;
  title: string;
  doiOrUrl: string;
  locator: string;
}

export interface ParagraphClaim {
  claimId?: string;
  function: string;
  claimType: "EMPIRICAL_FACT" | "CROSS_SOURCE_SYNTHESIS" | "RESEARCHER_DECISION";
  proposedClaim: string;
  sourceIds: string[];
  sourceReferences: ParagraphClaimReference[];
  sampleContext?: string;
  usageLimit: string;
  readiness: "READY_TO_DRAFT" | "NEEDS_VERIFICATION" | "DO_NOT_USE";
}

export interface LanguagePresentation {
  studentExplanation: string;
  academicArtifactText?: string;
  nextActionText?: string;
}

