"use client";

import React, { useState, useMemo, useSyncExternalStore, useRef, useEffect } from "react";
import {
  Tool,
  ResearchBedahInput,
  BedahTransferPayload,
  DirectionV2,
  Bab1FoundationV1,
  FeasibilityAnswerStatus,
  DataReadinessOutcome,
  DirectionFeasibilityState,
  SavedBab1FoundationPackage,
  ResearchDirectionV2,
  PhenomenonBasisStatus,
  Bab1DraftV1,
  DraftCheckFinding,
} from "@/types/tool";
import {
  loadSelectedPhenomenon,
  getSelectedPhenomenonSnapshot,
  loadSharedResearchContext,
  saveSharedResearchContext,
  getSharedResearchContextSnapshot,
  subscribeToToolData,
  saveBedahDraft,
  loadBedahDraft,
  clearBedahDraft,
  saveBedahOutput,
  loadBedahOutput,
  clearBedahOutput,
  saveBedahOutput4B,
  loadBedahOutput4B,
  clearBedahOutput4B,
  saveBedahDirectionV2,
  loadBedahDirectionV2,
  clearBedahDirectionV2,
  saveSelectedDirectionId,
  loadSelectedDirectionId,
  clearSelectedDirectionId,
  saveBedahFeasibility,
  loadBedahFeasibility,
  clearBedahFeasibility,
  saveBab1FoundationV1,
  loadBab1FoundationV1,
  clearBab1FoundationV1,
  saveBedahOutput4C,
  loadBedahOutput4C,
  clearBedahOutput4C,
  saveBab1DraftV1,
  loadBab1DraftV1,
  clearBab1DraftV1,
  saveBab1FoundationPackage,
  loadBab1FoundationPackage,
  clearBab1FoundationPackage,
  loadToolData,
} from "@/lib/storage";
import {
  validateLiteratureEvidencePackage,
  parseBedahTransfer,
  parseBab1FoundationTransfer,
  parseBab1DraftTransfer,
  periksaDrafBab1,
  hitungKata,
  normalizeBab1Foundation,
  calculateDataReadiness,
  generateBedahFixFormatPrompt4A,
  generateBedahFixStructurePrompt4A,
  generateBab1FoundationFixFormatPrompt,
  generateBab1FoundationFixStructurePrompt,
  generateBab1DraftFixFormatPrompt,
  generateBab1DraftFixStructurePrompt,
  computeBedahInputFingerprint,
  extractSumberPaketLiteratur,
} from "@/lib/bedahParser";
import {
  TombolPeriksaSumber,
  RingkasanVerifikasi,
  LencanaVerifikasi,
  useVerifikasiSumber,
} from "./VerifikasiSumberPanel";
import {
  assembleBedahPrompt,
  analyzeBedahPrompt,
  assembleBedahPrompt4B,
  analyzeBedahPrompt4B,
  ResearchBedahInput4B,
  assembleBedahPrompt4C,
  analyzeBedahPrompt4C,
  ResearchBedahInput4C,
} from "@/lib/promptAssembler";
import { copyToClipboard } from "@/lib/clipboard";
import { susunOutlineLatarBelakang } from "@/lib/bab1Outline";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { AiUsageDeclaration } from "./AiUsageDeclaration";
import { safeHref } from "@/lib/xss";
import {
  getStudentLabel,
  getStudentStatus,
  getSourceWeightInfo,
  getResearchLogicStageInfo,
  getGapTypeInfo,
  getBackgroundFunctionInfo,
  deriveDirectionRiskLevel,
  formatConstraintFitLabel,
  formatWorkloadLabel,
} from "@/lib/studentLanguage";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Edit3,
  BookmarkCheck,
  FileCheck,
  Check,
  Compass,
  ArrowDownCircle,
  Clock,
  BookOpen,
} from "lucide-react";

const emptySubscribe = () => () => {};
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface BedahToolContainerProps {
  tool: Tool;
}

export const BedahToolContainer: React.FC<BedahToolContainerProps> = () => {
  const isMounted = useIsMounted();
  const feasibilitySectionRef = useRef<HTMLDivElement>(null);
  const prompt4BSectionRef = useRef<HTMLDivElement>(null);

  // 1. Sync external stores
  const selectedPhenomenonRaw = useSyncExternalStore(
    subscribeToToolData,
    getSelectedPhenomenonSnapshot,
    () => "null"
  );
  const sharedContextRaw = useSyncExternalStore(
    subscribeToToolData,
    getSharedResearchContextSnapshot,
    () => "null"
  );

  // 2. Local State with lazy initializers
  const [prodi, setProdi] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");
    return shared?.prodi || t3Data?.prodi || "";
  });

  const [areaEksplorasi, setAreaEksplorasi] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");
    return shared?.selectedArea || shared?.area_eksplorasi || t3Data?.area_eksplorasi || "";
  });

  const [additionalNotes] = useState("");

  const [supervisorDirection] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");
    return shared?.constraints?.arahanDosen || t3Data?.arahan_dosen || t3Data?.supervisor_direction || "";
  });

  const [literaturePackage, setLiteraturePackage] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahDraft() : "";
  });

  const [isPhenomenonAckChecked, setIsPhenomenonAckChecked] = useState(false);
  const [isLitStructureAckChecked, setIsLitStructureAckChecked] = useState(false);

  // UI state
  const [showFullPhenomenonEvidence, setShowFullPhenomenonEvidence] = useState(false);
  const [showAdjustDataModal, setShowAdjustDataModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [copyStatus4A, setCopyStatus4A] = useState<"idle" | "copied" | "error">("idle");
  const [copyStatus4B, setCopyStatus4B] = useState<"idle" | "copied" | "error">("idle");
  const [isConditionalConfirmed, setIsConditionalConfirmed] = useState(false);
  const [activeTab4A, setActiveTab4A] = useState<"audit" | "evidence_basis" | "phenomenon" | "knowledge" | "gaps" | "directions" | "recommendation">("directions");
  const [showRawLitInput, setShowRawLitInput] = useState(false);

  // Adjust Data Modal Form State
  const [modalProdi, setModalProdi] = useState("");
  const [modalArea, setModalArea] = useState("");
  const [modalPendekatan, setModalPendekatan] = useState("");
  const [modalDataNyaman, setModalDataNyaman] = useState("");
  const [modalAksesData, setModalAksesData] = useState("");
  const [modalCatatanAkses, setModalCatatanAkses] = useState("");
  const [modalHalDihindari, setModalHalDihindari] = useState("");
  const [modalKondisiWaktu, setModalKondisiWaktu] = useState("");

  // Stage 4A State
  const [pastedLLMOutput4A, setPastedLLMOutput4A] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahOutput() : "";
  });

  const [parsedPayloadV2, setParsedPayloadV2] = useState<DirectionV2 | null>(() => {
    return typeof window !== "undefined" ? loadBedahDirectionV2() : null;
  });

  const [parsedPayloadV1, setParsedPayloadV1] = useState<BedahTransferPayload | null>(() => {
    return null;
  });

  const [parseError4A, setParseError4A] = useState<{ error: string; details?: string[] } | null>(null);
  /** Temuan audit konten 4A (red line akademik). Dihitung parser. */
  const [auditFindings4A, setAuditFindings4A] = useState<import("@/lib/academicGates").ContentAuditFinding[]>([]);
  /** Verifikasi sumber ke Crossref/OpenAlex (R-05) — dipakai bersama Tool 2/3/4. */
  const {
    hasil: verifikasiSumber,
    sedangProses: sedangVerifikasi,
    catatan: verifikasiCatatan,
    periksa: periksaSumber,
    reset: resetVerifikasi,
  } = useVerifikasiSumber();

  // Selected Direction
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(() => {
    return typeof window !== "undefined" ? loadSelectedDirectionId() : null;
  });

  // Feasibility Gate State
  const [feasibilityAnswers, setFeasibilityAnswers] = useState<Record<string, FeasibilityAnswerStatus>>(() => {
    if (typeof window === "undefined") return {};
    const stored = loadBedahFeasibility();
    return stored?.answers || {};
  });

  const [feasibilityAccessNotes, setFeasibilityAccessNotes] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const stored = loadBedahFeasibility();
    return stored?.accessNotes || "";
  });

  // Stage 4B State
  const [pastedLLMOutput4B, setPastedLLMOutput4B] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahOutput4B() : "";
  });

  const [parsedFoundationV1, setParsedFoundationV1] = useState<Bab1FoundationV1 | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = loadBab1FoundationV1();
    if (!stored) return null;
    const storedV2 = loadBedahDirectionV2();
    return normalizeBab1Foundation(stored, storedV2?.source_weights);
  });

  const [parseError4B, setParseError4B] = useState<{ error: string; details?: string[] } | null>(null);
  const [isFeasibilityModifiedAfter4B, setIsFeasibilityModifiedAfter4B] = useState(false);

  // Stage 4C State — draf Bab 1
  const [pastedLLMOutput4C, setPastedLLMOutput4C] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahOutput4C() : "";
  });
  const [parsedDraftV1, setParsedDraftV1] = useState<Bab1DraftV1 | null>(() => {
    return typeof window !== "undefined" ? loadBab1DraftV1() : null;
  });
  const [parseError4C, setParseError4C] = useState<{ error: string; details?: string[] } | null>(null);
  const [copyStatus4C, setCopyStatus4C] = useState<"idle" | "copied" | "error">("idle");
  const prompt4CSectionRef = useRef<HTMLDivElement>(null);
  /** Jalur penulisan: kerangka saja, atau kerangka + draf berbantuan AI. */
  const [jalurBab1, setJalurBab1] = useState<"outline" | "draf">("outline");
  const [outlinePanjangChecked, setOutlinePanjangChecked] = useState<boolean>(true);
  const [outlineTersalin, setOutlineTersalin] = useState<boolean>(false);

  // Final Saved Package
  const [savedPackage, setSavedPackage] = useState<SavedBab1FoundationPackage | null>(() => {
    return typeof window !== "undefined" ? loadBab1FoundationPackage() : null;
  });

  const [supervisorConfirmationChecked, setSupervisorConfirmationChecked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const pkg = loadBab1FoundationPackage();
    return pkg?.confirmedWithSupervisorCheckbox || false;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedPhenomenon = useMemo(() => {
    if (selectedPhenomenonRaw === "invalid") return null;
    return loadSelectedPhenomenon();
  }, [selectedPhenomenonRaw]);

  const sharedContext = useMemo(() => {
    if (sharedContextRaw === "invalid") return null;
    return loadSharedResearchContext();
  }, [sharedContextRaw]);

  // Handle literature package change (with state invalidation)
  const handleLiteraturePackageChange = (val: string) => {
    setLiteraturePackage(val);
    saveBedahDraft(val);

    // Invalidate downstream
    if (parsedPayloadV2 || parsedPayloadV1 || selectedDirectionId || parsedFoundationV1) {
      setParsedPayloadV2(null);
      clearBedahDirectionV2();
      setParsedPayloadV1(null);
      setSelectedDirectionId(null);
      clearSelectedDirectionId();
      setFeasibilityAnswers({});
      setFeasibilityAccessNotes("");
      clearBedahFeasibility();
      setPastedLLMOutput4B("");
      clearBedahOutput4B();
      setParsedFoundationV1(null);
      clearBab1FoundationV1();
      resetVerifikasi();
    }
  };

  // Validation of Literature Evidence Package
  const litValidation = useMemo(() => {
    return validateLiteratureEvidencePackage(literaturePackage);
  }, [literaturePackage]);

  const hasFullPhenomenonEvidence = useMemo(() => {
    return (
      !!selectedPhenomenon &&
      Array.isArray(selectedPhenomenon.evidence) &&
      selectedPhenomenon.evidence.length > 0 &&
      typeof selectedPhenomenon.phenomenonSummary === "string" &&
      selectedPhenomenon.phenomenonSummary.trim().length > 0
    );
  }, [selectedPhenomenon]);

  // Status dasar bukti fenomena (Patch 4)
  const phenomenonBasisStatus = useMemo<PhenomenonBasisStatus>(() => {
    if (hasFullPhenomenonEvidence) return "VERIFIED_REAL_WORLD";
    if (isPhenomenonAckChecked || (selectedPhenomenon && selectedPhenomenon.phenomenonSummary)) return "LITERATURE_INDICATED";
    return "MISSING";
  }, [hasFullPhenomenonEvidence, isPhenomenonAckChecked, selectedPhenomenon]);

  // Construct Bedah Input 4A Context
  const bedahInput: ResearchBedahInput = useMemo(() => {
    return {
      prodi,
      areaEksplorasi,
      selectedPhenomenon,
      studentConstraints: {
        preferredApproach: sharedContext?.constraints?.pendekatan || sharedContext?.pendekatan || "",
        preferredData: sharedContext?.constraints?.dataNyaman || sharedContext?.preferensi_data || "",
        existingDataAccess: sharedContext?.constraints?.aksesData || sharedContext?.akses_data || "",
        dataAccessNotes: sharedContext?.constraints?.catatanAkses || sharedContext?.akses_data_catatan || "",
        avoidedActivities: sharedContext?.constraints?.halDihindari || sharedContext?.avoidances || "",
        timeCondition: sharedContext?.constraints?.kondisiWaktu || sharedContext?.target_waktu || "",
        additionalNotes,
      },
      additionalNotes,
      supervisorDirection,
      literatureEvidencePackage: literaturePackage,
    };
  }, [
    prodi,
    areaEksplorasi,
    selectedPhenomenon,
    sharedContext,
    additionalNotes,
    supervisorDirection,
    literaturePackage,
  ]);

  const generatedPrompt4A = useMemo(() => {
    return assembleBedahPrompt(bedahInput);
  }, [bedahInput]);

  const promptAnalysis4A = useMemo(() => {
    return analyzeBedahPrompt(bedahInput);
  }, [bedahInput]);

  // Current Fingerprint & Stale detection
  const currentFingerprint = useMemo(() => {
    return computeBedahInputFingerprint(
      selectedPhenomenon,
      literaturePackage,
      bedahInput.studentConstraints as Record<string, string>,
      supervisorDirection
    );
  }, [selectedPhenomenon, literaturePackage, bedahInput.studentConstraints, supervisorDirection]);

  const isSavedPackageStale = useMemo(() => {
    if (!savedPackage) return false;
    return savedPackage.inputFingerprint !== currentFingerprint;
  }, [savedPackage, currentFingerprint]);

  // Selected Direction Object
  const selectedDirectionObj = useMemo<ResearchDirectionV2 | null>(() => {
    if (!parsedPayloadV2 || !selectedDirectionId) return null;
    return parsedPayloadV2.directions.find((d) => d.id === selectedDirectionId) || null;
  }, [parsedPayloadV2, selectedDirectionId]);

  // Associated Gaps for Selected Direction
  const associatedGaps = useMemo(() => {
    if (!parsedPayloadV2 || !selectedDirectionObj) return [];
    return parsedPayloadV2.candidate_gaps.filter((g) => selectedDirectionObj.gap_ids.includes(g.id));
  }, [parsedPayloadV2, selectedDirectionObj]);

  // Computed Data Readiness
  const computedDataReadiness = useMemo<DataReadinessOutcome>(() => {
    if (!selectedDirectionObj) return "DATA_CONDITIONAL";
    return calculateDataReadiness(
      selectedDirectionObj.data_verification_questions,
      feasibilityAnswers,
      feasibilityAccessNotes
    );
  }, [selectedDirectionObj, feasibilityAnswers, feasibilityAccessNotes]);

  // Unavailable Critical Questions for Blocked Handling
  const unavailableCriticalQuestions = useMemo(() => {
    if (!selectedDirectionObj) return [];
    return selectedDirectionObj.data_verification_questions.filter(
      (q) => q.critical && feasibilityAnswers[q.id] === "TIDAK_TERSEDIA"
    );
  }, [selectedDirectionObj, feasibilityAnswers]);

  // Filtered Relevant Literature Evidence for 4B
  const relevantLiteratureEvidence = useMemo(() => {
    if (!literaturePackage || !selectedDirectionObj) return "";
    const relevantIds = new Set<string>([
      ...selectedDirectionObj.anchor_source_ids,
      ...associatedGaps.flatMap((g) => g.source_ids),
    ]);
    const lines = literaturePackage.split("\n");
    const relevantLines = lines.filter((line) => {
      for (const id of relevantIds) {
        if (line.includes(id)) return true;
      }
      return false;
    });
    return relevantLines.length > 0
      ? relevantLines.join("\n")
      : "Rujukan sumber utama: " + Array.from(relevantIds).join(", ");
  }, [literaturePackage, selectedDirectionObj, associatedGaps]);

  // Feasibility State Object
  const currentFeasibilityState = useMemo<DirectionFeasibilityState | null>(() => {
    if (!selectedDirectionId) return null;
    return {
      directionId: selectedDirectionId,
      answers: feasibilityAnswers,
      accessNotes: feasibilityAccessNotes,
      computedReadiness: computedDataReadiness,
      lastUpdated: new Date().toISOString(),
    };
  }, [selectedDirectionId, feasibilityAnswers, feasibilityAccessNotes, computedDataReadiness]);

  // Constructed Input for 4B
  const bedahInput4B = useMemo<ResearchBedahInput4B | null>(() => {
    if (!parsedPayloadV2 || !selectedDirectionObj || !currentFeasibilityState) return null;
    return {
      prodi,
      areaEksplorasi,
      studentConstraints: (bedahInput.studentConstraints || {}) as Record<string, string>,
      supervisorDirection,
      calibratedPhenomenon: parsedPayloadV2.calibrated_phenomenon,
      selectedDirection: selectedDirectionObj,
      associatedGaps,
      relevantLiteratureEvidence,
      feasibilityState: currentFeasibilityState,
      sourceWeights: parsedPayloadV2.source_weights,
      phenomenonBasisStatus,
    };
  }, [
    parsedPayloadV2,
    selectedDirectionObj,
    currentFeasibilityState,
    prodi,
    areaEksplorasi,
    bedahInput.studentConstraints,
    supervisorDirection,
    associatedGaps,
    relevantLiteratureEvidence,
    phenomenonBasisStatus,
  ]);

  const generatedPrompt4B = useMemo(() => {
    if (!bedahInput4B) return "";
    return assembleBedahPrompt4B(bedahInput4B);
  }, [bedahInput4B]);

  const promptAnalysis4B = useMemo(() => {
    if (!bedahInput4B) return null;
    return analyzeBedahPrompt4B(bedahInput4B);
  }, [bedahInput4B]);

  // ---------------------------------------------------------------
  // Tahap 4C: draf Bab 1
  // ---------------------------------------------------------------

  /** Paragraf peta yang BLOCKED tidak boleh ditulis jadi draf. */
  const petaSiapTulis = useMemo(() => {
    const peta = parsedFoundationV1?.background_map || [];
    return { siap: peta.filter((p) => p.readiness !== "BLOCKED"), blocked: peta.filter((p) => p.readiness === "BLOCKED") };
  }, [parsedFoundationV1]);

  /** Outline siap tempel untuk mahasiswa yang tidak memakai AI. */
  const outlineLatarBelakang = useMemo(() => {
    if (!parsedFoundationV1) return "";
    return susunOutlineLatarBelakang(parsedFoundationV1, { sertakanBatasPanjang: outlinePanjangChecked });
  }, [parsedFoundationV1, outlinePanjangChecked]);

  const handleSalinOutline = async () => {
    const ok = await copyToClipboard(outlineLatarBelakang);
    if (ok) {
      setOutlineTersalin(true);
      setTimeout(() => setOutlineTersalin(false), 3000);
    }
  };

  const bedahInput4C = useMemo<ResearchBedahInput4C | null>(() => {
    if (!parsedFoundationV1) return null;
    if (petaSiapTulis.siap.length === 0) return null;
    return { prodi, areaEksplorasi, foundation: parsedFoundationV1 };
  }, [parsedFoundationV1, prodi, areaEksplorasi, petaSiapTulis]);

  const generatedPrompt4C = useMemo(() => {
    if (!bedahInput4C) return "";
    return assembleBedahPrompt4C(bedahInput4C);
  }, [bedahInput4C]);

  const promptAnalysis4C = useMemo(() => {
    if (!bedahInput4C) return null;
    return analyzeBedahPrompt4C(bedahInput4C);
  }, [bedahInput4C]);

  /** Temuan pemeriksa dihitung ulang dari state saat ini, bukan dari hasil parse saja. */
  const draftFindings = useMemo<DraftCheckFinding[]>(() => {
    if (!parsedDraftV1 || !parsedFoundationV1) return [];
    return periksaDrafBab1(parsedDraftV1, parsedFoundationV1);
  }, [parsedDraftV1, parsedFoundationV1]);

  const draftKritis = useMemo(
    () => draftFindings.filter((f) => f.severity === "CRITICAL"),
    [draftFindings]
  );

  const draftKataTotal = useMemo(
    () => (parsedDraftV1?.background || []).reduce((acc, p) => acc + hitungKata(p.paragraph_text || ""), 0),
    [parsedDraftV1]
  );

  // Handle Copy Prompt 4C
  const handleCopyPrompt4C = async () => {
    if (!generatedPrompt4C || promptAnalysis4C?.status === "BLOCKED") return;
    try {
      const ok = await copyToClipboard(generatedPrompt4C);
      if (ok) {
        setCopyStatus4C("copied");
        setTimeout(() => setCopyStatus4C("idle"), 3000);
      }
    } catch {
      setCopyStatus4C("error");
    }
  };

  // Handle Process LLM Output 4C
  const handleProcessLLMOutput4C = () => {
    setParseError4C(null);
    if (!parsedFoundationV1) return;
    const res = parseBab1DraftTransfer(pastedLLMOutput4C, { foundation: parsedFoundationV1 });
    if (res.success && res.data) {
      setParsedDraftV1(res.data);
      saveBab1DraftV1(res.data);
      saveBedahOutput4C(pastedLLMOutput4C);
    } else {
      setParseError4C({ error: res.error || "Gagal memproses output.", details: res.errorDetails });
    }
  };

  // Handle Reset Draf 4C
  const handleResetDraft4C = () => {
    setPastedLLMOutput4C("");
    clearBedahOutput4C();
    setParsedDraftV1(null);
    clearBab1DraftV1();
    setParseError4C(null);
    setCopyStatus4C("idle");
  };

  // Can Generate / Execute Prompt 4A?
  const canGeneratePrompt4A = useMemo(() => {
    const phenValid = hasFullPhenomenonEvidence || isPhenomenonAckChecked;
    const litValid =
      litValidation.status === "STRUKTUR_LENGKAP" ||
      (litValidation.status === "STRUKTUR_PERLU_DIPERIKSA" && isLitStructureAckChecked);
    return phenValid && litValid && literaturePackage.trim().length > 0;
  }, [hasFullPhenomenonEvidence, isPhenomenonAckChecked, litValidation, isLitStructureAckChecked, literaturePackage]);

  // Handle Copy Prompt 4A
  const handleCopyPrompt4A = async () => {
    if (promptAnalysis4A.status === "BLOCKED") return;
    try {
      const ok = await copyToClipboard(generatedPrompt4A);
      if (ok) {
        setCopyStatus4A("copied");
        setTimeout(() => setCopyStatus4A("idle"), 3000);
      }
    } catch {
      setCopyStatus4A("error");
    }
  };

  // Handle Copy Prompt 4B
  const handleCopyPrompt4B = async () => {
    if (
      !generatedPrompt4B ||
      promptAnalysis4B?.status === "BLOCKED" ||
      computedDataReadiness === "DATA_BLOCKED" ||
      (computedDataReadiness === "DATA_CONDITIONAL" && !isConditionalConfirmed)
    ) {
      return;
    }
    try {
      const ok = await copyToClipboard(generatedPrompt4B);
      if (ok) {
        setCopyStatus4B("copied");
        setTimeout(() => setCopyStatus4B("idle"), 3000);
      }
    } catch {
      setCopyStatus4B("error");
    }
  };

  // Sumber mana yang diperiksa: paket Tool3 yang ditempel (paling relevan untuk
  // arah penelitian), dan bila belum ada, register 4A dari parse terakhir.
  const sumberUntukDiperiksa = useMemo(() => {
    const dariPaketTool3 = extractSumberPaketLiteratur(literaturePackage);
    if (dariPaketTool3.length > 0) {
      return dariPaketTool3.map((x) => ({
        sourceId: x.sourceId,
        title: x.title,
        url: x.url,
        doi: x.doi,
        documentType: x.documentType,
      }));
    }
    return (parsedPayloadV2?.source_weights ?? []).map((sw) => {
      const x = sw as unknown as Record<string, unknown>;
      return {
        sourceId: String(x.source_id ?? ""),
        title: String(x.title ?? ""),
        url: String(x.url ?? ""),
        doi: String(x.doi ?? ""),
        documentType: String(x.document_type ?? ""),
      };
    });
  }, [literaturePackage, parsedPayloadV2]);

  // Handle Process LLM Output 4A
  const handleProcessLLMOutput4A = () => {
    setParseError4A(null);
    const res = parseBedahTransfer(pastedLLMOutput4A);
    setAuditFindings4A(res.contentFindings ?? []);
    resetVerifikasi();
    if (res.success) {
      if (res.version === 2 && res.dataV2) {
        setParsedPayloadV2(res.dataV2);
        setParsedPayloadV1(null);
        saveBedahDirectionV2(res.dataV2);
        saveBedahOutput(pastedLLMOutput4A);

        // Reset downstream on new 4A paste
        setSelectedDirectionId(null);
        clearSelectedDirectionId();
        setFeasibilityAnswers({});
        setFeasibilityAccessNotes("");
        clearBedahFeasibility();
        setPastedLLMOutput4B("");
        clearBedahOutput4B();
        setParsedFoundationV1(null);
        clearBab1FoundationV1();

        setToastMessage("Hasil Bedah 4A (V2) berhasil diverifikasi dan dimuat.");
      } else if (res.version === 1 && res.dataV1) {
        setParsedPayloadV1(res.dataV1);
        setParsedPayloadV2(null);
        saveBedahOutput(pastedLLMOutput4A);
        setToastMessage("Hasil format V1 terbaca. Disarankan menggunakan Prompt V2 untuk fitur lengkap.");
      }
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setParseError4A({
        error: res.error || "Gagal memproses hasil transfer 4A.",
        details: res.errorDetails,
      });
    }
  };

  // Handle Process LLM Output 4B
  const handleProcessLLMOutput4B = () => {
    setParseError4B(null);
    const res = parseBab1FoundationTransfer(pastedLLMOutput4B, {
      expectedDirectionId: selectedDirectionId || undefined,
      dataReadiness: computedDataReadiness,
      candidateGaps: associatedGaps,
      phenomenonBasisStatus,
      sourceWeights: parsedPayloadV2?.source_weights,
      literatureEvidencePackage: literaturePackage,
    });
    if (res.success && res.data) {
      setParsedFoundationV1(res.data);
      saveBab1FoundationV1(res.data);
      saveBedahOutput4B(pastedLLMOutput4B);
      setIsFeasibilityModifiedAfter4B(false);
      // Fondasi berganti: draf 4C lama tidak lagi sinkron.
      handleResetDraft4C();
      setToastMessage("Paket Fondasi Bab 1 berhasil diverifikasi.");
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setParseError4B({
        error: res.error || "Gagal memproses hasil Fondasi Bab 1.",
        details: res.errorDetails,
      });
    }
  };

  // Handle Direction Selection (Stage 4A -> 5)
  const handleSelectDirection = (dirId: string) => {
    if (selectedDirectionId !== dirId) {
      setSelectedDirectionId(dirId);
      saveSelectedDirectionId(dirId);
      setIsConditionalConfirmed(false);
      // Reset direction-specific answers
      setFeasibilityAnswers({});
      setFeasibilityAccessNotes("");
      clearBedahFeasibility();
      setPastedLLMOutput4B("");
      clearBedahOutput4B();
      setParsedFoundationV1(null);
      clearBab1FoundationV1();
    }
  };

  // Auto-scroll to Feasibility Gate when direction is selected
  useEffect(() => {
    if (selectedDirectionId && feasibilitySectionRef.current) {
      feasibilitySectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDirectionId]);

  // Handle Feasibility Answer change
  const handleFeasibilityAnswerChange = (questionId: string, status: FeasibilityAnswerStatus) => {
    setIsConditionalConfirmed(false);
    const updated = { ...feasibilityAnswers, [questionId]: status };
    setFeasibilityAnswers(updated);
    if (currentFeasibilityState) {
      saveBedahFeasibility({
        ...currentFeasibilityState,
        answers: updated,
      });
    }
    if (parsedFoundationV1) {
      setIsFeasibilityModifiedAfter4B(true);
    }
  };

  const handleFeasibilityAccessNotesChange = (val: string) => {
    setFeasibilityAccessNotes(val);
    if (currentFeasibilityState) {
      saveBedahFeasibility({
        ...currentFeasibilityState,
        accessNotes: val,
      });
    }
    if (parsedFoundationV1) {
      setIsFeasibilityModifiedAfter4B(true);
    }
  };

  // Save Final Package to LocalStorage
  const handleSaveFinalPackage = () => {
    if (
      !parsedPayloadV2 ||
      !selectedDirectionId ||
      !currentFeasibilityState ||
      !parsedFoundationV1 ||
      !supervisorConfirmationChecked
    ) {
      return;
    }

    const pkg: SavedBab1FoundationPackage = {
      schemaVersion: 2,
      prodi,
      areaEksplorasi,
      selectedPhenomenon,
      phenomenonBasisStatus,
      studentConstraints: (bedahInput.studentConstraints || {}) as Record<string, string>,
      supervisorDirection,
      directionV2: parsedPayloadV2,
      selectedDirectionId,
      feasibilityState: currentFeasibilityState,
      foundationV1: parsedFoundationV1,
      confirmedWithSupervisorCheckbox: supervisorConfirmationChecked,
      savedAt: new Date().toISOString(),
      inputFingerprint: currentFingerprint,
    };

    saveBab1FoundationPackage(pkg);
    setSavedPackage(pkg);
    setToastMessage("Paket Fondasi Bab 1 V2 berhasil disimpan ke storage.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Adjust Data Modal
  const openAdjustDataModal = () => {
    setModalProdi(prodi);
    setModalArea(areaEksplorasi);
    setModalPendekatan(sharedContext?.constraints?.pendekatan || "");
    setModalDataNyaman(sharedContext?.constraints?.dataNyaman || "");
    setModalAksesData(sharedContext?.constraints?.aksesData || "");
    setModalCatatanAkses(sharedContext?.constraints?.catatanAkses || "");
    setModalHalDihindari(sharedContext?.constraints?.halDihindari || "");
    setModalKondisiWaktu(sharedContext?.constraints?.kondisiWaktu || "");
    setShowAdjustDataModal(true);
  };

  const saveAdjustDataModal = () => {
    setProdi(modalProdi.trim());
    setAreaEksplorasi(modalArea.trim());

    const updatedContext = {
      ...(sharedContext || {}),
      prodi: modalProdi.trim(),
      selectedArea: modalArea.trim(),
      area_eksplorasi: modalArea.trim(),
      constraints: {
        ...(sharedContext?.constraints || {}),
        pendekatan: modalPendekatan.trim(),
        dataNyaman: modalDataNyaman.trim(),
        aksesData: modalAksesData.trim(),
        catatanAkses: modalCatatanAkses.trim(),
        halDihindari: modalHalDihindari.trim(),
        kondisiWaktu: modalKondisiWaktu.trim(),
        arahanDosen: supervisorDirection.trim(),
      },
    };

    saveSharedResearchContext(updatedContext);
    setShowAdjustDataModal(false);
  };

  // Reset Tool 4 State
  const handleConfirmReset = () => {
    setLiteraturePackage("");
    clearBedahDraft();
    setPastedLLMOutput4A("");
    clearBedahOutput();
    setPastedLLMOutput4B("");
    clearBedahOutput4B();
    setParsedPayloadV2(null);
    clearBedahDirectionV2();
    setParsedPayloadV1(null);
    setParseError4A(null);
    setAuditFindings4A([]);
    setSelectedDirectionId(null);
    clearSelectedDirectionId();
    setFeasibilityAnswers({});
    setFeasibilityAccessNotes("");
    clearBedahFeasibility();
    setParsedFoundationV1(null);
    clearBab1FoundationV1();
    setParseError4B(null);
    setIsFeasibilityModifiedAfter4B(false);
    setSavedPackage(null);
    clearBab1FoundationPackage();
    setSupervisorConfirmationChecked(false);
    setIsPhenomenonAckChecked(false);
    setIsLitStructureAckChecked(false);
    setCopyStatus4A("idle");
    setCopyStatus4B("idle");
    handleResetDraft4C();
    setShowResetModal(false);
    setToastMessage("Formulir paket literatur dan hasil Tool 4 berhasil direset.");
    setTimeout(() => {
      setToastMessage((prev) => (prev === "Formulir paket literatur dan hasil Tool 4 berhasil direset." ? null : prev));
    }, 3000);
  };

  if (!isMounted) {
    return (
      <div className="mt-8 space-y-10 animate-pulse">
        <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8">
          <div className="h-6 w-48 rounded bg-[#273352]/50"></div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-20 rounded-xl bg-[#080D1D]"></div>
            <div className="h-20 rounded-xl bg-[#080D1D] sm:col-span-2"></div>
            <div className="h-20 rounded-xl bg-[#080D1D]"></div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#70E1B6]/30 bg-[#080D1D]/95 px-5 py-3.5 text-sm font-semibold text-[#70E1B6] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#70E1B6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 1: PERIKSA KONTEKS DAN BUKTI FENOMENA                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/20 text-[#70E1B6] font-bold">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FFF9EE]">Konteks & Bukti Fenomena Terpilih</h2>
              <p className="text-xs text-[#AAB4D0]">
                Data canonical dari langkah 1 (Cari Ide) dan langkah 2 (Cari & Validasi Fenomena).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAdjustDataModal}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#273352] bg-[#080D1D] px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#70E1B6]" />
            <span>Sesuaikan Data</span>
          </button>
        </div>

        {/* Summary Context Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#273352]/80 bg-[#080D1D] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#AAB4D0]/70 uppercase">
              Program Studi
            </span>
            <p className="mt-1 text-sm font-bold text-[#FFF9EE]">{prodi || "Belum ditentukan"}</p>
          </div>

          <div className="rounded-xl border border-[#273352]/80 bg-[#080D1D] p-4 sm:col-span-2">
            <span className="text-[13px] font-semibold tracking-wider text-[#AAB4D0]/70 uppercase">
              Area Eksplorasi
            </span>
            <p className="mt-1 text-sm font-bold text-[#FFF9EE]">{areaEksplorasi || "Belum ditentukan"}</p>
          </div>

          <div className="rounded-xl border border-[#273352]/80 bg-[#080D1D] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#AAB4D0]/70 uppercase">
              Pendekatan Disukai
            </span>
            <p className="mt-1 text-xs text-[#FFF9EE]">
              {getStudentLabel(sharedContext?.constraints?.pendekatan || sharedContext?.pendekatan || "Belum ditentukan")}
            </p>
          </div>

          <div className="rounded-xl border border-[#273352]/80 bg-[#080D1D] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#AAB4D0]/70 uppercase">
              Data Nyaman
            </span>
            <p className="mt-1 text-xs text-[#FFF9EE]">
              {getStudentLabel(sharedContext?.constraints?.dataNyaman || sharedContext?.preferensi_data || "Belum ditentukan")}
            </p>
          </div>

          <div className="rounded-xl border border-[#273352]/80 bg-[#080D1D] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#AAB4D0]/70 uppercase">
              Akses Data & Waktu
            </span>
            <p className="mt-1 text-xs text-[#FFF9EE]">
              {getStudentLabel(sharedContext?.constraints?.aksesData || sharedContext?.akses_data || "Belum ditentukan")} (
              {getStudentLabel(sharedContext?.constraints?.kondisiWaktu || sharedContext?.target_waktu || "Waktu standar")})
            </p>
          </div>
        </div>

        {/* Phenomenon Card */}
        <div className="mt-6 rounded-xl border border-[#273352] bg-[#080D1D] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <span className="text-[13px] font-semibold tracking-wider text-[#70E1B6] uppercase">
                {phenomenonBasisStatus === "VERIFIED_REAL_WORLD"
                  ? "Fenomena yang Sudah Dicek"
                  : phenomenonBasisStatus === "LITERATURE_INDICATED"
                  ? "Petunjuk Fenomena dari Literatur"
                  : "Bukti Fenomena Belum Tersedia"}
              </span>
              <h3 className="mt-1 text-base font-bold text-[#FFF9EE]">
                {selectedPhenomenon?.name || (phenomenonBasisStatus === "LITERATURE_INDICATED" ? "Petunjuk Fenomena dari Paket Literatur" : "Belum Memilih Fenomena Terpilih")}
              </h3>
            </div>
            {selectedPhenomenon?.status && (
              <span className="self-start rounded-full bg-[#2959FF]/20 px-3 py-1 text-xs font-semibold text-[#70E1B6]">
                {selectedPhenomenon.status}
              </span>
            )}
          </div>

          {selectedPhenomenon?.phenomenonSummary && (
            <p className="mt-3 text-sm text-[#AAB4D0] leading-relaxed">
              {selectedPhenomenon.phenomenonSummary}
            </p>
          )}

          {/* Evidence Count & Warning */}
          {selectedPhenomenon?.evidence && selectedPhenomenon.evidence.length > 0 ? (
            <div className="mt-4 border-t border-[#273352]/60 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#70E1B6]">
                  {selectedPhenomenon.evidence.length} Bukti Fenomena Tersedia
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullPhenomenonEvidence(!showFullPhenomenonEvidence)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#AAB4D0] hover:text-[#FFF9EE]"
                >
                  <span>{showFullPhenomenonEvidence ? "Sembunyikan Bukti" : "Lihat Rincian Bukti"}</span>
                  {showFullPhenomenonEvidence ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {showFullPhenomenonEvidence && (
                <div className="mt-3 space-y-2">
                  {selectedPhenomenon.evidence.map((ev, idx) => (
                    <div key={idx} className="rounded-lg border border-[#273352]/60 bg-[#11182D] p-3 text-xs text-[#AAB4D0]">
                      <div className="flex items-center justify-between text-[#FFF9EE] font-semibold">
                        <span>{ev.sourceTitle || `Bukti #${idx + 1}`}</span>
                        {ev.referencePeriod && <span className="text-[13px] text-[#70E1B6]">{ev.referencePeriod}</span>}
                      </div>
                      {ev.claim && <p className="mt-1 text-[#FFF9EE]">{ev.claim}</p>}
                      {ev.observedDataOrEvent && <p className="mt-1 text-[13px] text-[#AAB4D0]">{ev.observedDataOrEvent}</p>}
                      {ev.url && safeHref(ev.url) && (
                        <a
                          href={safeHref(ev.url) as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[13px] text-[#2959FF] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Buka Tautan Sumber</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="space-y-2">
                  <p className="text-xs text-amber-200">
                    Petunjuk ini membantu menentukan arah pencarian, tetapi belum cukup disebut sebagai bukti fenomena dunia nyata.
                  </p>
                  <label className="flex items-center gap-2 text-xs text-[#FFF9EE] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPhenomenonAckChecked}
                      onChange={(e) => setIsPhenomenonAckChecked(e.target.checked)}
                      className="rounded border-[#273352] bg-[#080D1D] text-[#2959FF] focus:ring-0"
                    />
                    <span>Saya mengerti dan ingin tetap melanjutkan dengan petunjuk literatur.</span>
                  </label>
                </div>
              </div>
              <div className="border-t border-amber-500/20 pt-2 flex items-center justify-between">
                <a
                  href="/dashboard/tool-2"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#70E1B6] hover:underline"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Kembali ke Tool 2 untuk melengkapi bukti fenomena dunia nyata</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 2: PAKET BUKTI LITERATUR DARI NOTEBOOKLM                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/20 text-[#70E1B6] font-bold">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FFF9EE]">Paket Bukti Literatur dari NotebookLM</h2>
              <p className="text-xs text-[#AAB4D0]">
                Tempelkan hasil lengkap Prompt B (Langkah 2 — Ekstrak Paket Bukti) dari NotebookLM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                if (literaturePackage.trim().length > 0 || pastedLLMOutput4A.trim().length > 0 || parsedPayloadV2 !== null) {
                  setShowResetModal(true);
                } else {
                  handleConfirmReset();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#AAB4D0] hover:border-[#FF6F61]/50 hover:text-[#FF6F61] transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6F61] focus-visible:outline-none cursor-pointer"
              aria-label="Reset formulir paket literatur dan hasil Tool 4"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Form</span>
            </button>

            {litValidation.status === "STRUKTUR_LENGKAP" && (
              <button
                type="button"
                onClick={() => setShowRawLitInput(!showRawLitInput)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#70E1B6] hover:underline cursor-pointer ml-2"
              >
                <span>{showRawLitInput ? "Sembunyikan Hasil Mentah" : "Lihat Hasil Mentah"}</span>
                {showRawLitInput ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {(litValidation.status !== "STRUKTUR_LENGKAP" || showRawLitInput) && (
            <div className="relative animate-fade-in">
              <textarea
                rows={8}
                value={literaturePackage}
                onChange={(e) => handleLiteraturePackageChange(e.target.value)}
                placeholder="Tempelkan teks output Prompt B dari NotebookLM di sini (harus memuat tabel Source Register dan Matriks Bukti)..."
                className="w-full rounded-xl border border-[#273352] bg-[#080D1D] p-4 font-mono text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus:border-[#2959FF] focus:outline-none focus:ring-1 focus:ring-[#2959FF]"
              />
            </div>
          )}

          {/* Validation Feedback */}
          {literaturePackage.trim().length > 0 && (
            <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#AAB4D0]">Status Validasi Struktur:</span>
                {litValidation.status === "STRUKTUR_LENGKAP" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#70E1B6]/20 px-3 py-1 text-xs font-semibold text-[#70E1B6]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Struktur Lengkap & Terverifikasi</span>
                  </span>
                )}
                {litValidation.status === "STRUKTUR_PERLU_DIPERIKSA" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Perlu Diperiksa</span>
                  </span>
                )}
                {litValidation.status === "PAKET_TIDAK_DIKENALI" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Format Belum Sesuai</span>
                  </span>
                )}
              </div>

              {litValidation.notes && litValidation.notes.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-[#AAB4D0]">
                  {litValidation.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#2959FF]">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}

              {sumberUntukDiperiksa.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-[#273352]/60 pt-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-[#AAB4D0]">
                      Periksa {sumberUntukDiperiksa.length} sumber di paket ini ke Crossref/OpenAlex (gratis).
                    </span>
                    <TombolPeriksaSumber
                      jumlah={sumberUntukDiperiksa.length}
                      sedangProses={sedangVerifikasi}
                      onClick={() => periksaSumber(sumberUntukDiperiksa)}
                    />
                  </div>
                  <RingkasanVerifikasi hasil={verifikasiSumber} catatan={verifikasiCatatan} />
                </div>
              )}

              {litValidation.status === "STRUKTUR_PERLU_DIPERIKSA" && (
                <label className="mt-3 flex items-center gap-2 text-xs text-[#FFF9EE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLitStructureAckChecked}
                    onChange={(e) => setIsLitStructureAckChecked(e.target.checked)}
                    className="rounded border-[#273352] bg-[#080D1D] text-[#2959FF] focus:ring-0"
                  />
                  <span>Saya mengonfirmasi bahwa teks yang ditempel sudah memuat bukti utama yang cukup.</span>
                </label>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 3: PROMPT 4A (BEDAH BUKTI & EKSPLORASI ARAH)                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/20 text-[#70E1B6] font-bold">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FFF9EE]">Prompt Tahap 4A — Bedah Bukti & Eksplorasi Arah</h2>
              <p className="text-xs text-[#AAB4D0]">
                Jalankan prompt ini di ChatGPT (GPT-4o/o1) atau Gemini (1.5 Pro) untuk menghasilkan 2–4 alternatif arah.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                promptAnalysis4A.status === "SAFE"
                  ? "bg-[#70E1B6]/20 text-[#70E1B6]"
                  : promptAnalysis4A.status === "WARNING"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {promptAnalysis4A.finalLength.toLocaleString("id-ID")} karakter
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Pratinjau selalu tampil: beberapa baris pertama prompt, tanpa membuka prompt teknis penuh */}
          <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
            <pre className="font-mono text-xs leading-relaxed text-[#AAB4D0] whitespace-pre-wrap line-clamp-4 select-all">
              {generatedPrompt4A}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canGeneratePrompt4A || promptAnalysis4A.status === "BLOCKED"}
              onClick={handleCopyPrompt4A}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2959FF] to-[#1E40AF] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#2959FF]/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {copyStatus4A === "copied" ? (
                <>
                  <Check className="h-4 w-4 text-[#70E1B6]" />
                  <span>Prompt 4A Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin Prompt Tahap 4A</span>
                </>
              )}
            </button>

            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
              <span>Buka ChatGPT</span>
            </a>

            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
              <span>Buka Gemini</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 4: OUTPUT 4A & PROGRESSIVE DISCLOSURE                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#273352]/70 pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/20 text-[#70E1B6] font-bold">
            4
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FFF9EE]">Hasil Analisis Tahap 4A (Bedah Bukti)</h2>
            <p className="text-xs text-[#AAB4D0]">
              Tempelkan output lengkap dari ChatGPT/Gemini di sini untuk memetakan gap dan 2–4 alternatif arah.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <textarea
            rows={6}
            value={pastedLLMOutput4A}
            onChange={(e) => setPastedLLMOutput4A(e.target.value)}
            placeholder="Tempelkan hasil respons dari ChatGPT / Gemini (termasuk blok SKRIFLOW_DIRECTION_V2) di sini..."
            className="w-full rounded-xl border border-[#273352] bg-[#080D1D] p-4 font-mono text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus:border-[#2959FF] focus:outline-none"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleProcessLLMOutput4A}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2959FF] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1E40AF]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Verifikasi & Proses Hasil 4A</span>
            </button>
          </div>

          {/* Temuan audit konten (red line akademik): klaim kausal, klaim
              ketiadaan bukti, pengaman klaim hilang, sumber tanpa identitas. */}
          {auditFindings4A.length > 0 && (() => {
            const errors = auditFindings4A.filter((x) => x.severity === "ERROR");
            const warnings = auditFindings4A.filter((x) => x.severity !== "ERROR");
            const tampil = [...errors, ...warnings].slice(0, 8);
            return (
              <div
                className={`rounded-xl border p-4 space-y-2 ${
                  errors.length > 0
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-[#F5A623]/30 bg-[#F5A623]/10"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#FFF9EE]">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-[#F5A623]" aria-hidden="true" />
                  <span>
                    Pemeriksaan Akademik: {auditFindings4A.length} temuan
                    {errors.length > 0 ? ` (${errors.length} perlu diperbaiki)` : ""}
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#FFF9EE]">
                  {tampil.map((x, i) => (
                    <li key={i} className="leading-relaxed">
                      <span
                        className={`mr-1.5 rounded px-1 py-0.5 text-[10px] font-bold ${
                          x.severity === "ERROR"
                            ? "bg-rose-500/25 text-rose-300"
                            : "bg-[#F5A623]/25 text-[#F5A623]"
                        }`}
                      >
                        {x.severity === "ERROR" ? "PERLU DIPERBAIKI" : "CATATAN"}
                      </span>
                      {x.message}
                    </li>
                  ))}
                </ul>
                {auditFindings4A.length > tampil.length && (
                  <p className="text-[11px] text-[#AAB4D0]">
                    +{auditFindings4A.length - tampil.length} temuan lain pada daftar sumber.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Parse Errors & Repair Actions */}
          {parseError4A && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                <div className="space-y-3 w-full">
                  <div>
                    <h4 className="text-sm font-bold text-rose-300">{parseError4A.error}</h4>
                    {parseError4A.details && (
                      <ul className="mt-2 space-y-1 text-xs text-rose-200">
                        {parseError4A.details.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-500/20">
                    <button
                      type="button"
                      onClick={() => {
                        const fixPrompt = generateBedahFixFormatPrompt4A(pastedLLMOutput4A, parseError4A.details);
                        copyToClipboard(fixPrompt);
                        setToastMessage("Prompt Perbaikan Format V2 tersalin!");
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Salin Prompt Perbaikan Format</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fixPrompt = generateBedahFixStructurePrompt4A(pastedLLMOutput4A, parseError4A.details);
                        copyToClipboard(fixPrompt);
                        setToastMessage("Prompt Perbaikan Struktur V2 tersalin!");
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Salin Prompt Perbaikan Struktur</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* V1 FALLBACK BADGE                                                         */}
        {/* ========================================================================= */}
        {parsedPayloadV1 && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Format V1 Terdeteksi</h4>
                <p className="mt-1 text-xs text-amber-200">
                  Data dapat dibaca, tetapi belum memiliki seluruh komponen Paket Fondasi Bab 1 (Peta Pengetahuan V2, Komparabilitas Studi, dan Uji Kelayakan 4B).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyPrompt4A();
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-[#080D1D] hover:bg-amber-400"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Salin Prompt V2 & Buat Ulang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* V2 PROGRESSIVE DISCLOSURE DISPLAY                                         */}
        {/* ========================================================================= */}
        {parsedPayloadV2 && (
          <div className="mt-8 space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-[#273352] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab4A("directions")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "directions"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>2–4 Alternatif Arah</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab4A("evidence_basis")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "evidence_basis"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Dasar Bukti</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab4A("gaps")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "gaps"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Kandidat Celah Penelitian ({parsedPayloadV2.candidate_gaps.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab4A("knowledge")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "knowledge"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Peta Pengetahuan & Keterbandingan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab4A("phenomenon")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "phenomenon"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>Fenomena yang Sudah Dicek</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab4A("audit")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "audit"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Audit Bahan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab4A("recommendation")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  activeTab4A === "recommendation"
                    ? "bg-[#2959FF] text-white"
                    : "bg-[#080D1D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Rekomendasi Sementara</span>
              </button>
            </div>

            {/* TAB 1: 2-4 ALTERNATIF ARAH */}
            {activeTab4A === "directions" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#FFF9EE]">
                      Pilih Satu Arah Penelitian untuk Masuk ke Uji Kelayakan & Fondasi Bab 1:
                    </h3>
                    <p className="text-xs text-[#AAB4D0]">
                      Pilih arah yang paling masuk akal buat kondisi kamu. Pilihan alternatif lain tetap tersimpan aman.
                    </p>
                  </div>
                  <span className="text-xs text-[#70E1B6] shrink-0 font-medium">Tidak ada pilihan otomatis—kamu yang menentukan</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {parsedPayloadV2.directions.map((dir) => {
                    const isSelected = selectedDirectionId === dir.id;
                    const badgeClass =
                      dir.conditional_badge === "Paling Dekat dengan Fenomena"
                        ? "bg-[#70E1B6]/15 border border-[#70E1B6]/30 text-[#70E1B6]"
                        : dir.conditional_badge === "Lebih Aman untuk Tenggat"
                        ? "bg-[#2959FF]/15 border border-[#2959FF]/30 text-blue-300"
                        : dir.conditional_badge === "Data Perlu Dicek"
                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                        : dir.conditional_badge === "Perlu Fokus Lebih Sempit"
                        ? "bg-purple-500/15 border border-purple-500/30 text-purple-300"
                        : dir.conditional_badge === "Bukti Literatur Masih Terbatas"
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                        : "bg-[#273352] text-[#AAB4D0]";

                    return (
                      <div
                        key={dir.id}
                        onClick={() => handleSelectDirection(dir.id)}
                        className={`cursor-pointer rounded-xl border p-5 transition space-y-3.5 ${
                          isSelected
                            ? "border-[#70E1B6] bg-[#080D1D] shadow-lg shadow-[#70E1B6]/10 ring-2 ring-[#70E1B6]"
                            : "border-[#273352] bg-[#080D1D] hover:border-[#2959FF] hover:bg-[#11182D]"
                        }`}
                      >
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-[#2959FF]/20 px-2 py-0.5 text-[13px] font-bold text-[#70E1B6]">
                                {dir.id}
                              </span>
                              {dir.conditional_badge && (
                                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${badgeClass}`}>
                                  {dir.conditional_badge}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[#FFF9EE]">{dir.name}</h4>
                          </div>
                          <div>
                            {(() => {
                              const readInfo = getStudentStatus(dir.readiness);
                              return (
                                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${readInfo.badgeClass}`}>
                                  {readInfo.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Problem Focus & Phenomenon Connection */}
                        <div className="space-y-2 text-xs text-[#AAB4D0] leading-relaxed">
                          <p>{dir.problem_focus}</p>
                          {dir.phenomenon_connection && (
                            <div className="rounded-lg bg-[#11182D] p-2.5 text-[13px]">
                              <span className="font-semibold text-[#70E1B6]">Hubungan dengan Fenomena: </span>
                              <span className="text-[#FFF9EE]">{dir.phenomenon_connection}</span>
                            </div>
                          )}
                        </div>

                        {/* Measurement Focus */}
                        {dir.measurement_focus && (
                          <div className="rounded-lg bg-[#11182D] p-2.5 text-[13px] text-[#AAB4D0] space-y-1">
                            <div>
                              <span className="font-semibold text-[#FFF9EE]">Ukuran/Hasil Utama: </span>
                              <span className="font-bold text-[#70E1B6]">{dir.measurement_focus.primary_outcome}</span>
                            </div>
                            {dir.measurement_focus.supporting_outcome && (
                              <div>
                                <span className="font-semibold text-[#FFF9EE]">Ukuran/Hasil Pendukung: </span>
                                <span>{dir.measurement_focus.supporting_outcome}</span>
                              </div>
                            )}
                            {dir.measurement_focus.non_equivalence_note && (
                              <p className="text-[12px] text-amber-300/90 italic pt-0.5">
                                * {dir.measurement_focus.non_equivalence_note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Claim Boundary */}
                        {dir.claim_boundary && (
                          <div className="rounded-lg border border-[#273352]/60 bg-[#11182D]/80 p-2.5 text-[13px] space-y-1.5">
                            <span className="font-semibold text-[#FFF9EE] block">Batas Klaim yang Aman:</span>
                            {dir.claim_boundary.safe_to_say.length > 0 && (
                              <div className="text-[#70E1B6]">
                                <span className="text-[12px] uppercase font-bold text-[#70E1B6]/70 block">Aman Dinyatakan:</span>
                                <ul className="list-disc pl-3.5 space-y-0.5">
                                  {dir.claim_boundary.safe_to_say.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {dir.claim_boundary.not_safe_to_say.length > 0 && (
                              <div className="text-amber-300/90">
                                <span className="text-[12px] uppercase font-bold text-amber-400/70 block">Belum Aman Dinyatakan:</span>
                                <ul className="list-disc pl-3.5 space-y-0.5">
                                  {dir.claim_boundary.not_safe_to_say.map((ns, idx) => (
                                    <li key={idx}>{ns}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata Details */}
                        <div className="space-y-1.5 border-t border-[#273352]/60 pt-3 text-[13px] text-[#AAB4D0]">
                          <div>
                            <span className="font-semibold text-[#FFF9EE]">Kandidat Celah Penelitian: </span>
                            <span className="space-x-1.5">
                              {dir.gap_ids.map((gid) => {
                                const matchingGap = parsedPayloadV2.candidate_gaps.find((g) => g.id === gid);
                                const statusLabel = matchingGap?.gap_status
                                  ? getStudentStatus(matchingGap.gap_status).label
                                  : "Gap";
                                return (
                                  <span key={gid} className="inline-flex items-center gap-1 rounded bg-[#11182D] px-1.5 py-0.5 text-[12px] text-[#FFF9EE]">
                                    <strong className="text-[#70E1B6]">{gid}</strong>
                                    {matchingGap?.gap_status && (
                                      <span className="text-[#AAB4D0]">({statusLabel})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#FFF9EE]">Kebutuhan Data Minimum: </span>
                            <span>{dir.data_needs.join("; ")}</span>
                          </div>
                          {dir.why_worth_considering && (
                            <div>
                              <span className="font-semibold text-[#FFF9EE]">Alasan Layak Dipertimbangkan: </span>
                              <span>{dir.why_worth_considering}</span>
                            </div>
                          )}
                          {dir.unresolved_items && dir.unresolved_items.length > 0 && (
                            <div>
                              <span className="font-semibold text-amber-300">Hal yang Perlu Dipastikan: </span>
                              <span>{dir.unresolved_items.join("; ")}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Card: 3 separate labels (Kesesuaian, Beban, Risiko) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#273352]/60 pt-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#AAB4D0]">
                            <span>
                              Kesesuaian: <strong className="text-[#FFF9EE]">{formatConstraintFitLabel(dir.constraint_fit)}</strong>
                            </span>
                            <span className="text-[#273352]">|</span>
                            <span>
                              Beban: <strong className="text-[#FFF9EE]">{formatWorkloadLabel(dir.workload)}</strong>
                            </span>
                            <span className="text-[#273352]">|</span>
                            <span>
                              Risiko: <strong className="text-[#FFF9EE]">{deriveDirectionRiskLevel(dir.workload_risk, dir.workload)}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${
                              isSelected
                                ? "bg-[#70E1B6] text-[#080D1D]"
                                : "bg-[#2959FF]/20 text-[#2959FF] group-hover:bg-[#2959FF] group-hover:text-white"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Arah Terpilih</span>
                              </>
                            ) : (
                              <>
                                <span>Pilih Arah Ini</span>
                                <ArrowRight className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: DASAR BUKTI (EVIDENCE BASIS) */}
            {activeTab4A === "evidence_basis" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#FFF9EE]">
                    Dasar Bukti: Pemisahan Fakta, Literatur, dan Hal yang Belum Pasti
                  </h3>
                  <span className="text-xs text-[#AAB4D0]">
                    Mencegah klaim spekulatif tanpa rujukan
                  </span>
                </div>

                {parsedPayloadV2.evidence_basis ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#70E1B6]" />
                        <h4 className="text-xs font-bold text-[#70E1B6] uppercase tracking-wider">
                          Fenomena yang Terlihat
                        </h4>
                      </div>
                      <p className="text-[13px] text-[#AAB4D0]">
                        Kondisi, pola, perubahan, peristiwa, atau perbedaan nyata yang diamati pada objek dan periode.
                      </p>
                      <ul className="space-y-2 text-xs text-[#FFF9EE]">
                        {parsedPayloadV2.evidence_basis.observed_phenomenon.map((item, idx) => (
                          <li key={idx} className="rounded bg-[#11182D] p-2.5 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#2959FF]" />
                        <h4 className="text-xs font-bold text-[#2959FF] uppercase tracking-wider">
                          Temuan Penelitian Terdahulu
                        </h4>
                      </div>
                      <p className="text-[13px] text-[#AAB4D0]">
                        Kesimpulan yang benar-benar dilaporkan oleh artikel/studi dalam Paket Bukti.
                      </p>
                      <ul className="space-y-2 text-xs text-[#FFF9EE]">
                        {parsedPayloadV2.evidence_basis.prior_study_findings.map((item, idx) => (
                          <li key={idx} className="rounded bg-[#11182D] p-2.5 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Hal yang Belum Bisa Disimpulkan
                        </h4>
                      </div>
                      <p className="text-[13px] text-[#AAB4D0]">
                        Klaim yang belum memiliki bukti cukup, belum dapat digeneralisasi, atau perlu dicek.
                      </p>
                      <ul className="space-y-2 text-xs text-[#FFF9EE]">
                        {parsedPayloadV2.evidence_basis.not_yet_established.map((item, idx) => (
                          <li key={idx} className="rounded bg-[#11182D] p-2.5 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-amber-300">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span>Data Dasar Bukti Belum Tersedia di Output Ini</span>
                    </div>
                    <p className="mt-1 text-[#AAB4D0]">
                      Output ini menggunakan format terdahulu. Silakan buat ulang output V2 jika memerlukan pemisahan tiga arah eksplisit antara fenomena nyata, temuan studi terdahulu, dan hal yang belum bisa disimpulkan.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KANDIDAT RESEARCH GAP */}
            {activeTab4A === "gaps" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#FFF9EE]">
                    Kandidat Celah Penelitian
                  </h3>
                  <span className="text-xs text-amber-300/90 font-medium">
                    Kandidat gap ini belum otomatis menjadi research gap final
                  </span>
                </div>

                {parsedPayloadV2.candidate_gaps.map((gap) => (
                  <div key={gap.id} className="rounded-xl border border-[#273352] bg-[#080D1D] p-5">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#2959FF]/20 px-2 py-0.5 text-xs font-bold text-[#70E1B6]">
                          {gap.id}
                        </span>
                        <span className="text-xs font-semibold text-[#FFF9EE]">
                          {getGapTypeInfo(gap.gap_type).label}
                        </span>
                      </div>
                      {(() => {
                        const statusKey = gap.gap_status || gap.strength;
                        const strInfo = getStudentStatus(statusKey);
                        return (
                          <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${strInfo.badgeClass}`}>
                            {strInfo.label}
                          </span>
                        );
                      })()}
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[#FFF9EE]">{gap.statement}</p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-[#AAB4D0]">
                      <div className="rounded-lg bg-[#11182D] p-3">
                        <span className="font-semibold text-[#70E1B6]">Yang Sudah Diketahui:</span>
                        <ul className="mt-1 list-disc pl-4 space-y-0.5">
                          {gap.what_is_known.map((k, idx) => (
                            <li key={idx}>{k}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-[#11182D] p-3">
                        <span className="font-semibold text-amber-400">Yang Belum Cukup Dijelaskan:</span>
                        <p className="mt-1">{gap.what_is_unexplained}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[#AAB4D0]/80">
                      <span>Sumber: <strong className="text-[#FFF9EE]">{gap.source_ids.join(", ")}</strong></span>
                      <span>Dasar Komparabilitas: <strong className="text-[#FFF9EE]">{gap.comparability_basis}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: PETA PENGETAHUAN & KETERBANDINGAN */}
            {activeTab4A === "knowledge" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5">
                    <h4 className="text-xs font-bold text-[#70E1B6] uppercase">Pengetahuan yang Terbukti</h4>
                    <ul className="mt-3 space-y-2 text-xs text-[#AAB4D0]">
                      {parsedPayloadV2.knowledge_map.established_knowledge.map((item, idx) => (
                        <li key={idx} className="rounded bg-[#11182D] p-2.5">
                          <p className="font-medium text-[#FFF9EE]">{item.statement}</p>
                          <span className="mt-1 block text-[13px] text-[#2959FF]">Sumber: {item.source_ids.join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5">
                    <h4 className="text-xs font-bold text-amber-400 uppercase">Temuan yang Berbeda / Inkonsisten</h4>
                    <ul className="mt-3 space-y-2 text-xs text-[#AAB4D0]">
                      {parsedPayloadV2.knowledge_map.differing_findings.map((item, idx) => (
                        <li key={idx} className="rounded bg-[#11182D] p-2.5">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[#FFF9EE]">{item.statement}</p>
                            <span className="rounded bg-[#273352] px-2 py-0.5 text-[12px] font-bold text-amber-300">
                              {item.comparability}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-[#AAB4D0]">{item.explanation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Comparability Groups */}
                {parsedPayloadV2.comparability_groups && parsedPayloadV2.comparability_groups.length > 0 && (
                  <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5">
                    <h4 className="text-xs font-bold text-[#FFF9EE] uppercase">Audit Keterbandingan Studi</h4>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs text-[#AAB4D0]">
                        <thead className="border-b border-[#273352] text-[#70E1B6]">
                          <tr>
                            <th className="py-2 pr-4">ID</th>
                            <th className="py-2 pr-4">Sumber</th>
                            <th className="py-2 pr-4">Konstruk / Outcome</th>
                            <th className="py-2 pr-4">Keterbandingan</th>
                            <th className="py-2">Alasan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#273352]/40">
                          {parsedPayloadV2.comparability_groups.map((cg) => (
                            <tr key={cg.id}>
                              <td className="py-2.5 pr-4 font-bold text-[#FFF9EE]">{cg.id}</td>
                              <td className="py-2.5 pr-4">{cg.source_ids.join(", ")}</td>
                              <td className="py-2.5 pr-4">{cg.construct_or_predictor} → {cg.outcome}</td>
                              <td className="py-2.5 pr-4">
                                <span className="rounded bg-[#273352] px-2 py-0.5 text-[12px] font-bold text-[#70E1B6]">
                                  {getStudentLabel(cg.comparability)}
                                </span>
                              </td>
                              <td className="py-2.5 text-[13px]">{cg.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FENOMENA & MASALAH */}
            {activeTab4A === "phenomenon" && (
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5 space-y-4 text-xs text-[#AAB4D0]">
                <div>
                  <h4 className="font-bold text-[#70E1B6] uppercase">Fenomena yang Sudah Dicek</h4>
                  <p className="mt-1 text-sm text-[#FFF9EE]">{parsedPayloadV2.calibrated_phenomenon.summary}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-[#11182D] p-3">
                    <span className="font-semibold text-amber-300">Masalah Empiris:</span>
                    <p className="mt-1">{parsedPayloadV2.calibrated_phenomenon.empirical_problem}</p>
                  </div>
                  <div className="rounded-lg bg-[#11182D] p-3">
                    <span className="font-semibold text-[#2959FF]">Masalah Pengetahuan:</span>
                    <p className="mt-1">{parsedPayloadV2.calibrated_phenomenon.knowledge_problem}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AUDIT BAHAN */}
            {activeTab4A === "audit" && (
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#AAB4D0] uppercase">Status Kelayakan Input:</span>
                  {(() => {
                    const audInfo = getStudentStatus(parsedPayloadV2.input_audit.status);
                    return (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${audInfo.badgeClass}`}>
                        {audInfo.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                  <div className="rounded-lg bg-[#11182D] p-3">
                    <span className="text-xs text-[#AAB4D0]">Sumber Fenomena</span>
                    <p className="text-lg font-bold text-[#FFF9EE]">{parsedPayloadV2.input_audit.phenomenon_source_count}</p>
                  </div>
                  <div className="rounded-lg bg-[#11182D] p-3">
                    <span className="text-xs text-[#AAB4D0]">Sumber Inti</span>
                    <p className="text-lg font-bold text-[#70E1B6]">{parsedPayloadV2.input_audit.core_source_count}</p>
                  </div>
                  <div className="rounded-lg bg-[#11182D] p-3">
                    <span className="text-xs text-[#AAB4D0]">Sumber Pendukung</span>
                    <p className="text-lg font-bold text-[#FFF9EE]">{parsedPayloadV2.input_audit.supporting_source_count}</p>
                  </div>
                  <div className="rounded-lg bg-[#11182D] p-3">
                    <span className="text-xs text-[#AAB4D0]">Diabaikan</span>
                    <p className="text-lg font-bold text-rose-400">{parsedPayloadV2.input_audit.ignored_source_count}</p>
                  </div>
                </div>

                {/* Source Weights Classification (Section A.5) */}
                {parsedPayloadV2.source_weights && parsedPayloadV2.source_weights.length > 0 && (
                  <div className="space-y-2 border-t border-[#273352]/60 pt-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h5 className="text-xs font-bold text-[#FFF9EE]">Klasifikasi Bobot Kualitas Sumber:</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#AAB4D0]">Klaim inti Bab 1 tidak boleh hanya bersandar pada sumber pendukung</span>
                        <TombolPeriksaSumber
                          jumlah={sumberUntukDiperiksa.length}
                          sedangProses={sedangVerifikasi}
                          onClick={() => periksaSumber(sumberUntukDiperiksa)}
                        />
                      </div>
                    </div>

                    <RingkasanVerifikasi hasil={verifikasiSumber} catatan={verifikasiCatatan} />
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {parsedPayloadV2.source_weights.map((sw) => {
                        const swStatus = getStudentStatus(sw.weight);
                        return (
                          <div key={sw.source_id} className="rounded-lg bg-[#11182D] p-3 text-xs space-y-1 border border-[#273352]/50">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#FFF9EE]">{sw.source_id}</span>
                              <span className="flex items-center gap-1">
                                <LencanaVerifikasi hasil={verifikasiSumber[sw.source_id]} />
                                <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${swStatus.badgeClass}`}>
                                  {swStatus.label}
                                </span>
                              </span>
                            </div>
                            <p className="text-[13px] text-[#AAB4D0] leading-snug">{sw.reason || sw.note}</p>
                            {verifikasiSumber[sw.source_id]?.judulDitemukan && (
                              <p className="text-[11.5px] text-[#70E1B6]/90 leading-snug">
                                Terdaftar: {String(verifikasiSumber[sw.source_id].judulDitemukan ?? "").slice(0, 90)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: REKOMENDASI BERSYARAT */}
            {activeTab4A === "recommendation" && (
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#70E1B6] uppercase">Rekomendasi Sementara (Bukan Pilihan Otomatis)</h4>
                  <span className="rounded bg-[#273352] px-2 py-0.5 text-[12px] text-[#AAB4D0]">
                    Pilihan Akhir di Mahasiswa
                  </span>
                </div>
                <p className="text-xs text-[#FFF9EE] leading-relaxed">
                  {parsedPayloadV2.conditional_recommendation.reasoning}
                </p>
                {parsedPayloadV2.conditional_recommendation.conditions && (
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#AAB4D0]">
                    {parsedPayloadV2.conditional_recommendation.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 5: FEASIBILITY GATE (UJI KELAYAKAN ARAH TERPILIH)                   */}
      {/* ========================================================================= */}
      {selectedDirectionObj && (
        <div ref={feasibilitySectionRef}>
          <section className="rounded-2xl border border-[#70E1B6]/40 bg-[#11182D] p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-3 border-b border-[#273352]/70 pb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#70E1B6]/20 text-[#70E1B6] font-bold">
                5
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#2959FF]/20 px-2 py-0.5 text-xs font-bold text-[#70E1B6]">
                    {selectedDirectionObj.id}
                  </span>
                  <h2 className="text-lg font-bold text-[#FFF9EE]">
                    Uji Kelayakan Data: {selectedDirectionObj.name}
                  </h2>
                </div>
                <p className="text-xs text-[#AAB4D0]">
                  Verifikasi ketersediaan dan akses data untuk arah yang kamu pilih sebelum memfinalkan Bab 1.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {/* Questions */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#FFF9EE] uppercase tracking-wider">
                  Daftar Pertanyaan Verifikasi Akses Data:
                </h3>
                {selectedDirectionObj.data_verification_questions.map((q) => {
                  const currentAnswer = feasibilityAnswers[q.id] || "BELUM_DIPASTIKAN";
                  return (
                    <div key={q.id} className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {q.critical && (
                              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[12px] font-bold text-rose-400">
                                Wajib / Kritis
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#FFF9EE]">{q.question}</span>
                          </div>
                          <span className="text-[13px] text-[#AAB4D0]">Terkait: {q.related_data_need}</span>
                        </div>

                        {/* Answer Buttons */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleFeasibilityAnswerChange(q.id, "SUDAH_DIPASTIKAN")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              currentAnswer === "SUDAH_DIPASTIKAN"
                                ? "bg-[#70E1B6] text-[#080D1D]"
                                : "bg-[#11182D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                            }`}
                          >
                            Sudah Dipastikan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeasibilityAnswerChange(q.id, "BELUM_DIPASTIKAN")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              currentAnswer === "BELUM_DIPASTIKAN"
                                ? "bg-amber-500 text-[#080D1D]"
                                : "bg-[#11182D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                            }`}
                          >
                            Belum Dipastikan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeasibilityAnswerChange(q.id, "TIDAK_TERSEDIA")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              currentAnswer === "TIDAK_TERSEDIA"
                                ? "bg-rose-500 text-white"
                                : "bg-[#11182D] text-[#AAB4D0] hover:text-[#FFF9EE]"
                            }`}
                          >
                            Tidak Tersedia
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#AAB4D0]">
                  Catatan / Bukti Akses Data (Misal: sudah dapat izin instansi, database IDX/BEI, sampel laporan keuangan):
                </label>
                <textarea
                  rows={3}
                  value={feasibilityAccessNotes}
                  onChange={(e) => handleFeasibilityAccessNotesChange(e.target.value)}
                  placeholder="Contoh: Sudah konfirmasi data laporan keuangan sektor infrastruktur 2017-2021 lengkap di IDX..."
                  className="mt-2 w-full rounded-xl border border-[#273352] bg-[#080D1D] p-3 text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus:border-[#2959FF] focus:outline-none"
                />
              </div>

              {/* Readiness Banner */}
              <div
                className={`rounded-xl border p-4 ${
                  computedDataReadiness === "DATA_READY"
                    ? "border-[#70E1B6]/40 bg-[#70E1B6]/10"
                    : computedDataReadiness === "DATA_CONDITIONAL"
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-rose-500/40 bg-rose-500/10"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    {computedDataReadiness === "DATA_READY" ? (
                      <CheckCircle2 className="h-5 w-5 text-[#70E1B6] shrink-0 mt-0.5" />
                    ) : computedDataReadiness === "DATA_CONDITIONAL" ? (
                      <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4
                        className={`text-sm font-bold ${
                          computedDataReadiness === "DATA_READY"
                            ? "text-[#70E1B6]"
                            : computedDataReadiness === "DATA_CONDITIONAL"
                            ? "text-amber-300"
                            : "text-rose-300"
                        }`}
                      >
                        Status Kesiapan Data: {getStudentStatus(computedDataReadiness).label}
                      </h4>
                      <p className="text-xs text-[#AAB4D0] leading-relaxed">
                        {computedDataReadiness === "DATA_READY"
                          ? "Data utama sudah dipastikan."
                          : computedDataReadiness === "DATA_CONDITIONAL"
                          ? "Beberapa hal masih perlu kamu cek. Kamu tetap bisa menyusun fondasi sementara, tetapi jangan menulis seolah-olah semua data sudah tersedia."
                          : "Arah ini belum aman dilanjutkan karena ada data penting yang tidak tersedia. Pilih arah lain atau periksa kembali sumber datanya."}
                      </p>
                      {computedDataReadiness === "DATA_BLOCKED" && unavailableCriticalQuestions.length > 0 && (
                        <div className="pt-1 text-xs text-rose-200">
                          <span className="font-semibold">Data kritis yang tidak tersedia: </span>
                          <span>{unavailableCriticalQuestions.map((q) => q.question).join("; ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDirectionId(null);
                        clearSelectedDirectionId();
                        setActiveTab4A("directions");
                      }}
                      className="rounded-lg border border-[#273352] bg-[#080D1D] px-3 py-1.5 text-xs font-semibold text-[#AAB4D0] hover:text-[#FFF9EE]"
                    >
                      Pilih Arah Lain
                    </button>
                    {computedDataReadiness !== "DATA_BLOCKED" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (prompt4BSectionRef.current) {
                            prompt4BSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2959FF] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1E40AF]"
                      >
                        <span>Lanjut ke Tahap 4B</span>
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 6: PROMPT 4B & PASTE FINALISASI FONDASI BAB 1                        */}
      {/* ========================================================================= */}
      {selectedDirectionObj && (
        <div ref={prompt4BSectionRef}>
          <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/20 text-[#70E1B6] font-bold">
                  6
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#FFF9EE]">Prompt Tahap 4B — Susun Fondasi Bab 1</h2>
                  <p className="text-xs text-[#AAB4D0]">
                    Menghasilkan Rantai Logika Penelitian, Peta Narasi 7–9 Paragraf, dan Catatan Bukti untuk [{selectedDirectionObj.id}].
                  </p>
                </div>
              </div>
              {promptAnalysis4B && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    promptAnalysis4B.status === "SAFE"
                      ? "bg-[#70E1B6]/20 text-[#70E1B6]"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {promptAnalysis4B.finalLength.toLocaleString("id-ID")} karakter
                </span>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {/* Status Banner in Stage 4B */}
              {computedDataReadiness === "DATA_BLOCKED" && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-rose-300">
                        Arah ini belum aman dilanjutkan karena ada data penting yang tidak tersedia. Pilih arah lain atau periksa kembali sumber datanya.
                      </h4>
                      {unavailableCriticalQuestions.length > 0 && (
                        <div className="space-y-1 text-xs text-rose-200">
                          <span className="font-semibold">Kebutuhan data kritis yang berstatus Tidak Tersedia:</span>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {unavailableCriticalQuestions.map((q) => (
                              <li key={q.id}>
                                {q.question} <span className="text-rose-300/80">({q.related_data_need})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDirectionId(null);
                            clearSelectedDirectionId();
                            setActiveTab4A("directions");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Pilih Arah Alternatif Lain</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {computedDataReadiness === "DATA_CONDITIONAL" && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                    <div className="space-y-2.5 text-xs text-amber-200">
                      <h4 className="text-sm font-bold text-amber-300">
                        Beberapa hal masih perlu kamu cek. Kamu tetap bisa menyusun fondasi sementara, tetapi jangan menulis seolah-olah semua data sudah tersedia.
                      </h4>
                      <p className="text-[#AAB4D0] leading-relaxed">
                        Fondasi Bab 1 yang dihasilkan berstatus rancangan sementara. Semua kebutuhan data yang belum dipastikan otomatis diteruskan ke Prompt 4B sebagai batasan analisis agar fondasi tidak mengarang ketersediaan data.
                      </p>
                      <label className="flex items-start gap-2.5 cursor-pointer rounded-lg bg-[#080D1D] p-3 border border-amber-500/30 hover:border-amber-400/50 transition">
                        <input
                          type="checkbox"
                          checked={isConditionalConfirmed}
                          onChange={(e) => setIsConditionalConfirmed(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-[#273352] text-[#2959FF] focus:ring-0 cursor-pointer"
                        />
                        <span className="font-semibold text-[#FFF9EE]">
                          Saya memahami bahwa fondasi Bab 1 ini berstatus sementara dan akan memverifikasi kebutuhan data sebelum penulisan akhir.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {computedDataReadiness === "DATA_READY" && (
                <div className="flex items-center gap-3 rounded-xl border border-[#70E1B6]/30 bg-[#70E1B6]/10 px-4 py-3 text-xs text-[#70E1B6]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Data utama sudah dipastikan. Prompt 4B siap disalin untuk menyusun Fondasi Bab 1.</span>
                </div>
              )}

              {computedDataReadiness !== "DATA_BLOCKED" && (
                <>
                  {/* Pratinjau selalu tampil: beberapa baris pertama prompt, tanpa membuka prompt teknis penuh */}
                  <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                    <pre className="font-mono text-xs leading-relaxed text-[#AAB4D0] whitespace-pre-wrap line-clamp-4 select-all">
                      {generatedPrompt4B}
                    </pre>
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {computedDataReadiness === "DATA_BLOCKED" ? (
                  <button
                    type="button"
                    disabled={true}
                    aria-disabled="true"
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-[#080D1D] px-5 py-3 text-xs font-bold text-rose-300/50 cursor-not-allowed opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Salin Prompt Tahap 4B (Terkunci: Data Kritis Tidak Tersedia)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCopyPrompt4B}
                    disabled={computedDataReadiness === "DATA_CONDITIONAL" && !isConditionalConfirmed}
                    aria-disabled={computedDataReadiness === "DATA_CONDITIONAL" && !isConditionalConfirmed}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition ${
                      computedDataReadiness === "DATA_CONDITIONAL" && !isConditionalConfirmed
                        ? "border border-amber-500/30 bg-[#080D1D] text-amber-400/50 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-[#2959FF] to-[#1E40AF] text-white shadow-lg shadow-[#2959FF]/25 hover:brightness-110"
                    }`}
                  >
                    {copyStatus4B === "copied" ? (
                      <>
                        <Check className="h-4 w-4 text-[#70E1B6]" />
                        <span>Prompt 4B Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>
                          {computedDataReadiness === "DATA_CONDITIONAL"
                            ? "Salin Prompt Tahap 4B (Status Bersyarat)"
                            : "Salin Prompt Tahap 4B"}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {computedDataReadiness !== "DATA_BLOCKED" && (
                  <>
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
                      <span>Buka ChatGPT</span>
                    </a>

                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
                      <span>Buka Gemini</span>
                    </a>
                  </>
                )}
              </div>

              {/* Paste Area 4B */}
              <div className="pt-4 border-t border-[#273352]/60 space-y-3">
                <label className="block text-xs font-bold text-[#FFF9EE]">
                  Tempelkan Output Tahap 4B dari ChatGPT/Gemini:
                </label>
                <textarea
                  rows={6}
                  value={pastedLLMOutput4B}
                  onChange={(e) => setPastedLLMOutput4B(e.target.value)}
                  placeholder="Tempelkan hasil respons blok SKRIFLOW_BAB1_FOUNDATION_V1 di sini..."
                  className="w-full rounded-xl border border-[#273352] bg-[#080D1D] p-4 font-mono text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus:border-[#2959FF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleProcessLLMOutput4B}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-2.5 text-xs font-bold text-[#080D1D] transition hover:bg-[#5cd4a6]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Verifikasi & Bangun Paket Fondasi Bab 1</span>
                </button>
              </div>

              {/* Parse Error 4B */}
              {parseError4B && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                    <div className="space-y-3 w-full">
                      <div>
                        <h4 className="text-sm font-bold text-rose-300">{parseError4B.error}</h4>
                        {parseError4B.details && (
                          <ul className="mt-2 space-y-1 text-xs text-rose-200">
                            {parseError4B.details.map((d, i) => (
                              <li key={i}>• {d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-500/20">
                        <button
                          type="button"
                          onClick={() => {
                            const fixPrompt = generateBab1FoundationFixFormatPrompt(pastedLLMOutput4B, parseError4B.details);
                            copyToClipboard(fixPrompt);
                            setToastMessage("Prompt Perbaikan Format Fondasi tersalin!");
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Salin Prompt Perbaikan Format 4B</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const fixPrompt = generateBab1FoundationFixStructurePrompt(pastedLLMOutput4B, parseError4B.details);
                            copyToClipboard(fixPrompt);
                            setToastMessage("Prompt Perbaikan Struktur Fondasi tersalin!");
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Salin Prompt Perbaikan Struktur 4B</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 7: PAKET FONDASI BAB 1 V2 RESULTS & CONFIRMATION                     */}
      {/* ========================================================================= */}
      {parsedFoundationV1 && (
        <section className="rounded-2xl border border-[#70E1B6] bg-[#11182D] p-6 shadow-2xl sm:p-8 space-y-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#70E1B6]/20 text-[#70E1B6] font-bold">
                7
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#FFF9EE]">Paket Fondasi Bab 1 V2</h2>
                <p className="text-xs text-[#AAB4D0]">
                  Rantai logika, rumusan masalah tentatif, peta latar belakang 7–9 bagian, dan evidence ledger.
                </p>
              </div>
            </div>

            {(() => {
              const statusInfo = getStudentStatus(parsedFoundationV1.foundation_status);
              return (
                <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${statusInfo.badgeClass}`}>
                  {statusInfo.label}
                </span>
              );
            })()}
          </div>

          {/* Stale warning if feasibility changed after 4B */}
          {isFeasibilityModifiedAfter4B && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Hasil Fondasi 4B Kedaluwarsa</h4>
                  <p className="text-xs text-amber-200">
                    Jawaban kelayakan data baru saja diubah. Silakan salin ulang Prompt 4B dan perbarui hasil 4B agar tetap sinkron.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stale warning if saved package does not match current inputs */}
          {isSavedPackageStale && (
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold text-blue-300">Paket Tersimpan Belum Diperbarui</h4>
                  <p className="text-xs text-blue-200">
                    Input fenomena atau literatur telah berubah sejak paket terakhir disimpan. Simpan kembali untuk memperbarui riwayat.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Normalization & Reconciliation Warnings */}
          {parsedFoundationV1.normalization_warnings && parsedFoundationV1.normalization_warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1.5 text-xs text-amber-200 w-full">
                  <h4 className="text-sm font-bold text-amber-300">
                    Penyesuaian Status & Rekonsiliasi Sumber
                  </h4>
                  <ul className="space-y-1 text-amber-200">
                    {parsedFoundationV1.normalization_warnings.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span>•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 7.1 Rantai Logika Penelitian (Vertical Timeline 1–7) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#273352]/70 pb-2">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                1. Rantai Logika Penelitian (Alur Berpikir 1–7)
              </h3>
              <span className="text-[13px] text-[#AAB4D0]">
                Urutan logika yang menghubungkan fenomena nyata hingga pertanyaan penelitian
              </span>
            </div>

            <div className="relative space-y-4 pl-2 sm:pl-4 before:absolute before:left-6 sm:before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#273352]">
              {parsedFoundationV1.research_logic_chain.map((item) => {
                const stageInfo = getResearchLogicStageInfo(item.stage, item.order, parsedFoundationV1.phenomenon_basis_status);
                return (
                  <div key={item.order} className="relative flex items-start gap-3 sm:gap-4">
                    {/* Circle badge on timeline */}
                    <div className="relative z-10 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#2959FF] bg-[#0E1528] text-xs font-bold text-[#70E1B6] shadow-md shadow-black/50">
                      {item.order}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs space-y-2 hover:border-[#2959FF]/50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#273352]/60 pb-2">
                        <span className="font-bold text-[#FFF9EE] text-xs sm:text-sm">
                          {stageInfo.label}
                        </span>
                        <span className="rounded bg-[#2959FF]/15 border border-[#2959FF]/30 px-2 py-0.5 text-[12px] font-mono text-[#70E1B6]">
                          {item.stage}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#AAB4D0] italic">
                        &ldquo;{stageInfo.question}&rdquo;
                      </p>

                      <p className="text-xs text-[#FFF9EE] leading-relaxed font-medium pt-1">
                        {item.statement}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7.2 Struktur Masalah */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
              2. Struktur Masalah & Research Problem
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs space-y-1">
                <span className="font-bold text-[#70E1B6]">
                  {parsedFoundationV1.phenomenon_basis_status === "LITERATURE_INDICATED"
                    ? "Petunjuk Fenomena dari Literatur:"
                    : parsedFoundationV1.phenomenon_basis_status === "MISSING"
                    ? "Dasar Fenomena Belum Tersedia:"
                    : "Fenomena Empiris Teramati:"}
                </span>
                <p className="text-[#FFF9EE]">{parsedFoundationV1.problem_structure.empirical_phenomenon}</p>
              </div>
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs space-y-1">
                <span className="font-bold text-amber-400">Masalah Empiris:</span>
                <p className="text-[#FFF9EE]">{parsedFoundationV1.problem_structure.empirical_problem}</p>
              </div>
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs space-y-1">
                <span className="font-bold text-[#2959FF]">Masalah Pengetahuan:</span>
                <p className="text-[#FFF9EE]">{parsedFoundationV1.problem_structure.knowledge_problem}</p>
              </div>
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs space-y-1">
                <span className="font-bold text-[#70E1B6]">Masalah Penelitian Sementara:</span>
                <p className="text-[#FFF9EE] font-semibold">{parsedFoundationV1.problem_structure.provisional_research_problem}</p>
              </div>
            </div>
          </div>

          {/* 7.3 Kandidat Rumusan Masalah & Tujuan (1-to-1) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                3. Kandidat Rumusan Masalah & Tujuan (1-ke-1)
              </h3>
              <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-[13px] font-semibold text-amber-300">
                Masih Tentatif — Konfirmasi dengan Dosen
              </span>
            </div>
            <div className="space-y-3">
              {parsedFoundationV1.candidate_research_questions.map((rq, idx) => {
                const obj = parsedFoundationV1.candidate_objectives[idx];
                return (
                  <div key={rq.id} className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <span className="font-bold text-[#70E1B6]">{rq.id} (Rumusan Masalah):</span>
                        <p className="mt-1 font-medium text-[#FFF9EE]">{rq.question}</p>
                      </div>
                      {obj && (
                        <div>
                          <span className="font-bold text-[#2959FF]">{obj.id} (Tujuan Penelitian):</span>
                          <p className="mt-1 font-medium text-[#FFF9EE]">{obj.objective}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7.4 Gambaran Bentuk Judul (Max 3) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                4. Gambaran Bentuk Judul (Bukan Judul Final)
              </h3>
              <span className="text-xs text-[#AAB4D0]">Maksimal 3 opsi untuk gambaran arah</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {parsedFoundationV1.working_title_previews.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs">
                  <span className="rounded bg-[#273352] px-2 py-0.5 text-[12px] font-bold text-[#70E1B6]">
                    {t.id}
                  </span>
                  <p className="mt-2 text-sm font-bold text-[#FFF9EE] leading-snug">{t.title}</p>
                  {t.assumptions && t.assumptions.length > 0 && (
                    <p className="mt-2 text-[13px] text-[#AAB4D0]">Asumsi: {t.assumptions.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 7.5 Peta Narasi Latar Belakang (7–9 Paragraphs) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#273352]/70 pb-2">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                5. Peta Narasi Latar Belakang (7–9 Bagian Berurutan)
              </h3>
              <span className="text-[13px] text-[#AAB4D0]">
                Panduan struktur per paragraf untuk penulisan draf Bab 1
              </span>
            </div>

            <div className="rounded-xl border border-[#70E1B6]/30 bg-[#70E1B6]/5 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#FFF9EE]">
                <span className="font-bold text-[#70E1B6] uppercase tracking-wider text-[13px]">
                  Target Panjang Latar Belakang
                </span>
                <span className="rounded bg-[#2959FF]/20 border border-[#2959FF]/40 px-2 py-0.5 font-bold text-[#70E1B6]">
                  1000–1300 kata
                </span>
                <span className="text-[#AAB4D0]">
                  {parsedFoundationV1.background_map.length} bagian · target total{" "}
                  <strong className="text-[#FFF9EE]">±{parsedFoundationV1.target_words_total || 1150} kata</strong>
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-[#AAB4D0] leading-relaxed">
                Angka per paragraf di bawah adalah target saat draf ditulis, bukan jumlah kalimat yang sudah ditulis.
                Sesuaikan saat menyusun draf agar totalnya tetap berada di rentang 1000–1300 kata.
              </p>
            </div>

            <div className="space-y-3">
              {parsedFoundationV1.background_map.map((p) => {
                const funcInfo = getBackgroundFunctionInfo(p.function, p.order, parsedFoundationV1.phenomenon_basis_status);
                const readStatus = getStudentStatus(p.readiness);
                return (
                  <div key={p.order} className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 sm:p-5 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#273352]/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#2959FF]/20 border border-[#2959FF]/40 px-2.5 py-0.5 font-bold text-[#70E1B6] text-xs">
                          Paragraf #{p.order}
                        </span>
                        <span className="font-bold text-[#FFF9EE] text-xs sm:text-sm">
                          {funcInfo.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.target_word_range && (
                          <span className="rounded bg-[#2959FF]/20 border border-[#2959FF]/40 px-2 py-0.5 text-[13px] font-semibold text-[#70E1B6]">
                            Target {p.target_word_range} kata
                          </span>
                        )}
                        <span className={`rounded px-2.5 py-0.5 text-[13px] font-semibold ${readStatus.badgeClass}`}>
                          {readStatus.label}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[13px] font-semibold text-[#70E1B6] uppercase tracking-wider block">
                        Pesan Utama Paragraf:
                      </span>
                      <p className="text-xs sm:text-sm text-[#FFF9EE] font-medium leading-relaxed bg-[#11182D]/80 p-3 rounded-lg border border-[#273352]/50">
                        {p.key_message}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-[#273352]/60 pt-2 text-[13px]">
                      {p.safe_claims && p.safe_claims.length > 0 && (
                        <div className="space-y-2 text-[#AAB4D0]">
                          <strong className="text-[#70E1B6] block">Klaim yang Aman Ditulis:</strong>
                          <ul className="space-y-2 text-[#FFF9EE]/90">
                            {p.safe_claims.map((sc, scIdx) => {
                              const claimType = sc.claim_type || (sc.source_ids && sc.source_ids.length > 1 ? "CROSS_SOURCE_SYNTHESIS" : (sc.source_ids && sc.source_ids.length > 0 ? "EMPIRICAL_FACT" : "RESEARCHER_DECISION"));
                              const claimStatusInfo = getStudentStatus(claimType);

                              return (
                                <li key={scIdx} className="rounded-lg bg-[#11182D]/80 p-2.5 border border-[#273352]/50 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[12px] font-bold text-[#70E1B6] bg-[#2959FF]/20 px-1.5 py-0.5 rounded">
                                      {sc.claim_id}
                                    </span>
                                    <span className={`rounded px-2 py-0.5 text-[12px] font-semibold ${claimStatusInfo.badgeClass}`}>
                                      {claimStatusInfo.label}
                                    </span>
                                    {sc.support_status && sc.support_status !== "READY_TO_DRAFT" && (
                                      <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${getStudentStatus(sc.support_status).badgeClass}`}>
                                        {getStudentStatus(sc.support_status).label}
                                      </span>
                                    )}
                                    {sc.source_ids && sc.source_ids.length > 0 && (
                                      <span className="font-mono text-[#70E1B6] text-[12px] bg-[#2959FF]/20 px-1.5 py-0.5 rounded">
                                        Sumber: [{sc.source_ids.join(", ")}]
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#FFF9EE]">{sc.statement}</p>
                                  {claimType === "RESEARCHER_DECISION" && (
                                    <div className="rounded bg-purple-500/10 border border-purple-500/20 p-2 text-[10.5px] text-purple-200 space-y-0.5">
                                      <p className="italic">
                                        Bagian ini merupakan keputusan sementara penelitian dan tidak membutuhkan sitasi seolah-olah berasal dari jurnal.
                                      </p>
                                      {sc.decision_basis && (
                                        <p className="font-medium text-purple-100">
                                          Dasar Keputusan: {sc.decision_basis}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {p.prohibited_claims && p.prohibited_claims.length > 0 && (
                        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-rose-300 space-y-0.5">
                          <strong className="text-rose-400 block font-bold">⚠️ Dilarang Mengklaim:</strong>
                          <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                            {p.prohibited_claims.map((pc, pcIdx) => (
                              <li key={pcIdx}>{pc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {p.transition_to_next && (
                        <div className="text-[#AAB4D0] pt-1">
                          <strong className="text-[#FFF9EE]">Kalimat Transisi ke Paragraf Berikutnya: </strong>
                          <span className="italic text-[#FFF9EE]/90">&ldquo;{p.transition_to_next}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7.6 Catatan Bukti */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
              6. Catatan Bukti (Buku Besar Bukti & Batas Penggunaan)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#273352] bg-[#080D1D]">
              <table className="w-full text-left text-xs text-[#AAB4D0]">
                <thead className="border-b border-[#273352] text-[#70E1B6]">
                  <tr>
                    <th className="p-3">Claim ID</th>
                    <th className="p-3">Klaim Netral</th>
                    <th className="p-3">Jenis Klaim</th>
                    <th className="p-3">Sumber & Bobot</th>
                    <th className="p-3">Lokasi Bukti</th>
                    <th className="p-3">Fungsi Bab 1</th>
                    <th className="p-3">Status Dukungan</th>
                    <th className="p-3">Batas Penggunaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273352]/40">
                  {parsedFoundationV1.evidence_ledger.map((el) => {
                    const funcInfo = getBackgroundFunctionInfo(el.bab1_function);
                    const claimType = el.claim_type || (el.source_ids && el.source_ids.length > 1 ? "CROSS_SOURCE_SYNTHESIS" : (el.source_ids && el.source_ids.length > 0 ? "EMPIRICAL_FACT" : "RESEARCHER_DECISION"));
                    const claimTypeInfo = getStudentStatus(claimType);
                    const supportInfo = el.support_status ? getStudentStatus(el.support_status) : null;
                    const sources = el.source_ids && el.source_ids.length > 0 ? el.source_ids : (el.source_id ? [el.source_id] : []);

                    return (
                      <tr key={el.claim_id} className="hover:bg-[#11182D]/60 transition-colors">
                        <td className="p-3 font-bold text-[#FFF9EE] whitespace-nowrap">{el.claim_id}</td>
                        <td className="p-3 text-[#FFF9EE] max-w-xs">
                          <div>{el.claim}</div>
                          {claimType === "RESEARCHER_DECISION" && (
                            <div className="mt-1 text-[12px] text-purple-300 italic">
                              Bagian ini merupakan keputusan sementara penelitian dan tidak membutuhkan sitasi seolah-olah berasal dari jurnal.
                              {el.decision_basis && <span className="block not-italic font-medium">Dasar: {el.decision_basis}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`rounded px-2 py-0.5 text-[12px] font-semibold ${claimTypeInfo.badgeClass}`}>
                            {claimTypeInfo.label}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap space-y-1">
                          {sources.length > 0 ? (
                            sources.map((sid) => {
                              const swObj = el.source_weights?.find((w) => w.source_id === sid);
                              const weight = swObj?.weight || el.source_weight || (parsedPayloadV2?.source_weights?.find((sw) => sw.source_id === sid)?.weight) || "PERLU_DIPERIKSA";
                              const weightInfo = getSourceWeightInfo(weight);
                              return (
                                <div key={sid} className="flex items-center gap-1.5">
                                  <span className="font-mono text-[13px] font-bold text-[#70E1B6]">{sid}</span>
                                  <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${weightInfo.badgeClass}`}>
                                    {weightInfo.label}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-zinc-500 italic text-[12px]">-</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">{el.evidence_location || "-"}</td>
                        <td className="p-3 text-[#FFF9EE]">
                          <span className="rounded bg-[#2959FF]/15 border border-[#2959FF]/30 px-2 py-0.5 text-[12px] font-semibold text-[#70E1B6]">
                            {funcInfo.title}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {supportInfo ? (
                            <span className={`rounded px-2 py-0.5 text-[12px] font-semibold ${supportInfo.badgeClass}`}>
                              {supportInfo.label}
                            </span>
                          ) : (
                            <span className="text-[#AAB4D0] text-[12px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-amber-300 text-[13px]">{el.usage_limit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7.7 Kontribusi, Ruang Lingkup & Catatan Konsultasi */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#273352]/70 pb-2">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                7. Kontribusi, Ruang Lingkup &amp; Catatan Konsultasi
              </h3>
              <span className="text-[13px] text-[#AAB4D0]">
                Sisa hasil fondasi: manfaat penelitian, batas cakupan, dan bahan diskusi dengan dosen
              </span>
            </div>

            {/* 7.7a Kontribusi Sementara */}
            <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-[#70E1B6] uppercase tracking-wider">
                7a. Kontribusi Sementara (Manfaat Penelitian)
              </h4>
              <p className="text-[13px] text-[#AAB4D0]">
                Masih bersifat sementara dan wajib dikonfirmasi ke dosen pembimbing. Bagian ini yang biasanya menjadi
                isi sub-bab Manfaat Penelitian.
              </p>
              {(() => {
                const contrib = parsedFoundationV1.provisional_contributions;
                if (!contrib) return <p className="text-[13px] text-[#AAB4D0] italic">Tidak tersedia pada output ini.</p>;
                const groups: Array<{ key: string; label: string }> = [
                  { key: "empirical", label: "Empiris" },
                  { key: "practical", label: "Praktis" },
                  { key: "academic", label: "Akademik" },
                  { key: "methodological", label: "Metodologis" },
                ];
                return (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {groups.map((g) => {
                      const items = (contrib as unknown as Record<string, string[] | undefined>)[g.key] || [];
                      if (items.length === 0) return null;
                      return (
                        <div key={g.key} className="rounded-lg border border-[#273352]/60 bg-[#11182D]/70 p-3 space-y-1.5">
                          <span className="text-[13px] font-bold text-[#70E1B6] uppercase tracking-wider block">
                            {g.label}
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-[13px] text-[#FFF9EE]/90">
                            {items.map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {parsedFoundationV1.provisional_contributions?.prohibited_contribution_claims &&
                parsedFoundationV1.provisional_contributions.prohibited_contribution_claims.length > 0 && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-rose-300 space-y-0.5">
                    <strong className="text-rose-400 block font-bold text-[13px]">
                      ⚠️ Klaim Kontribusi yang Dilarang:
                    </strong>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {parsedFoundationV1.provisional_contributions.prohibited_contribution_claims.map((pc, i) => (
                        <li key={i}>{pc}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* 7.7b Ruang Lingkup Sementara */}
            <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-[#70E1B6] uppercase tracking-wider">
                7b. Ruang Lingkup Sementara
              </h4>
              {(() => {
                const scope = parsedFoundationV1.tentative_scope;
                if (!scope) return <p className="text-[13px] text-[#AAB4D0] italic">Tidak tersedia pada output ini.</p>;
                const rows: Array<[string, string]> = [
                  ["Unit Analisis", scope.unit_of_analysis],
                  ["Objek / Populasi", scope.object_or_population],
                  ["Wilayah", scope.geography],
                  ["Peristiwa / Konteks", scope.event_or_context],
                  ["Periode Sementara", scope.potential_period],
                ];
                const lists: Array<[string, string[] | undefined, string]> = [
                  ["Sumber Data Potensial", scope.potential_data_sources, "text-[#70E1B6]"],
                  ["Termasuk Cakupan", scope.in_scope, "text-emerald-300"],
                  ["Di Luar Cakupan", scope.out_of_scope, "text-amber-300"],
                  ["Belum Diputuskan", scope.unresolved_items, "text-rose-300"],
                ];
                return (
                  <div className="space-y-3 text-xs">
                    <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                      {rows.map(([label, val]) =>
                        val ? (
                          <div key={label} className="space-y-0.5">
                            <span className="text-[13px] font-semibold text-[#70E1B6] uppercase tracking-wider block">
                              {label}
                            </span>
                            <p className="text-[13px] text-[#FFF9EE]">{val}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                    {lists.map(([label, items, color]) =>
                      items && items.length > 0 ? (
                        <div key={label} className="space-y-1 border-t border-[#273352]/60 pt-2">
                          <span className={`text-[13px] font-semibold uppercase tracking-wider block ${color}`}>
                            {label}
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[13px] text-[#FFF9EE]/90">
                            {items.map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 7.7c Ringkasan Kelayakan Data */}
            {parsedFoundationV1.feasibility_summary && (
              <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold text-[#70E1B6] uppercase tracking-wider">
                  7c. Ringkasan Kelayakan Data
                </h4>
                <div className="space-y-3 text-xs">
                  {([
                    ["Data Sudah Pasti", parsedFoundationV1.feasibility_summary.confirmed_data, "text-emerald-300"],
                    ["Data Belum Pasti", parsedFoundationV1.feasibility_summary.unconfirmed_data, "text-amber-300"],
                    ["Data Tidak Tersedia", parsedFoundationV1.feasibility_summary.unavailable_data, "text-rose-300"],
                    ["Implikasi", parsedFoundationV1.feasibility_summary.implications, "text-[#70E1B6]"],
                  ] as Array<[string, string[] | undefined, string]>).map(([label, items, color]) =>
                    items && items.length > 0 ? (
                      <div key={label} className="space-y-1">
                        <span className={`text-[13px] font-semibold uppercase tracking-wider block ${color}`}>
                          {label}
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[13px] text-[#FFF9EE]/90">
                          {items.map((it, i) => (
                            <li key={i}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* 7.7d Bahan Konsultasi Dosen */}
            <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-[#70E1B6] uppercase tracking-wider">
                7d. Bahan Konsultasi Dosen &amp; Keputusan yang Belum Final
              </h4>
              {parsedFoundationV1.supervisor_questions && parsedFoundationV1.supervisor_questions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[13px] font-semibold text-[#70E1B6] uppercase tracking-wider block">
                    Pertanyaan untuk Dosen Pembimbing
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-[13px] text-[#FFF9EE]/90">
                    {parsedFoundationV1.supervisor_questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}
              {parsedFoundationV1.unresolved_decisions && parsedFoundationV1.unresolved_decisions.length > 0 && (
                <div className="space-y-1.5 border-t border-[#273352]/60 pt-2">
                  <span className="text-[13px] font-semibold text-amber-300 uppercase tracking-wider block">
                    Keputusan yang Belum Final
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[13px] text-[#FFF9EE]/90">
                    {parsedFoundationV1.unresolved_decisions.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
              {parsedFoundationV1.recovery_actions && parsedFoundationV1.recovery_actions.length > 0 && (
                <div className="space-y-1.5 border-t border-[#273352]/60 pt-2">
                  <span className="text-[13px] font-semibold text-[#70E1B6] uppercase tracking-wider block">
                    Langkah Tindak Lanjut yang Disarankan
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[13px] text-[#FFF9EE]/90">
                    {parsedFoundationV1.recovery_actions.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 7.8 Deklarasi Penggunaan AI (jejak proses, bukan tulisan AI) */}
          {parsedPayloadV2 && (
            <AiUsageDeclaration
              phenomenonSummary={
                selectedPhenomenon?.phenomenonSummary ||
                parsedPayloadV2.calibrated_phenomenon?.summary ||
                ""
              }
              literatureCount={
                (parsedPayloadV2.input_audit?.core_source_count || 0) +
                (parsedPayloadV2.input_audit?.supporting_source_count || 0)
              }
            />
          )}

          {/* 7.7 Confirmation & Final Save */}
          <div className="rounded-xl border border-[#70E1B6]/30 bg-[#080D1D] p-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supervisorConfirmationChecked}
                onChange={(e) => setSupervisorConfirmationChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#273352] bg-[#11182D] text-[#70E1B6] focus:ring-0"
              />
              <span className="text-xs font-semibold text-[#FFF9EE] leading-relaxed">
                Saya memahami bahwa arah penelitian, rumusan masalah, tujuan, dan gambaran judul ini masih bersifat tentatif dan perlu dikonfirmasi serta disetujui oleh dosen pembimbing.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={
                  !supervisorConfirmationChecked ||
                  isFeasibilityModifiedAfter4B ||
                  parsedFoundationV1.foundation_status === "BAB1_BLOCKED" ||
                  parsedFoundationV1.phenomenon_basis_status === "MISSING"
                }
                onClick={handleSaveFinalPackage}
                className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-6 py-3 text-xs font-bold text-[#080D1D] shadow-lg shadow-[#70E1B6]/20 transition hover:bg-[#5cd4a6] disabled:opacity-50"
              >
                <BookmarkCheck className="h-4 w-4" />
                <span>Simpan Paket Fondasi Bab 1</span>
              </button>

              {(parsedFoundationV1.foundation_status === "BAB1_BLOCKED" || parsedFoundationV1.phenomenon_basis_status === "MISSING") && (
                <span className="text-xs text-rose-400">
                  ⚠️ Fondasi berstatus Belum Aman (BLOCKED). Selesaikan verifikasi data atau cari fenomena pada Tool 2 sebelum menyimpan.
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#11182D] px-4 py-3 text-xs font-semibold text-[#AAB4D0] transition hover:text-rose-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Tool 4</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 8: PROMPT 4C — TULIS DRAF LATAR BELAKANG BAB 1                      */}
      {/* ========================================================================= */}
      {parsedFoundationV1 && (
        <div ref={prompt4CSectionRef}>
          <section className="rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-xl sm:p-8 space-y-5">
            <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/20 text-[#70E1B6] font-bold">
                  8
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#FFF9EE]">Prompt Tahap 4C — Tulis Draf Latar Belakang</h2>
                  <p className="text-xs text-[#AAB4D0]">
                    Mengubah Peta Narasi 7 bagian menjadi prosa siap tempel, tanpa menambah klaim atau sitasi baru.
                  </p>
                </div>
              </div>
              {promptAnalysis4C && (
                <span className="rounded-full bg-[#70E1B6]/20 px-3 py-1 text-xs font-semibold text-[#70E1B6]">
                  {promptAnalysis4C.finalLength.toLocaleString("id-ID")} karakter
                </span>
              )}
            </div>

            {(parsedFoundationV1.foundation_status === "BAB1_BLOCKED" || parsedFoundationV1.phenomenon_basis_status === "MISSING") && (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  <div className="text-xs text-rose-200">
                    <h4 className="text-sm font-bold text-rose-300">Fondasi belum aman (BLOCKED).</h4>
                    <p className="mt-1">
                      Draf yang dihasilkan tahap ini TIDAK boleh dipakai sebagai tulisan akhir. Selesaikan verifikasi fenomena di Tool 2
                      lebih dulu, lalu ulangi Tahap 4B.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {petaSiapTulis.blocked.length > 0 && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  <div className="text-xs text-rose-200">
                    <h4 className="text-sm font-bold text-rose-300">
                      {petaSiapTulis.blocked.length} bagian peta berstatus BLOCKED dan tidak akan ditulis.
                    </h4>
                    <p className="mt-1">
                      Bagian yang diblokir: {petaSiapTulis.blocked.map((p) => `${p.order}. ${p.function}`).join(", ")}. Selesaikan dasar
                      fenomenanya lebih dulu bila bagian ini memang harus ada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {bedahInput4C === null ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
                Semua bagian peta berstatus BLOCKED. Belum ada yang bisa ditulis menjadi draf.
              </div>
            ) : (
              <>
                {/* PILIHAN JALUR: kerangka saja, atau kerangka + draf berbantuan AI */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setJalurBab1("outline")}
                    className={`rounded-xl border p-4 text-left transition ${
                      jalurBab1 === "outline"
                        ? "border-[#70E1B6] bg-[#70E1B6]/10"
                        : "border-[#273352] bg-[#080D1D] hover:border-[#70E1B6]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                          jalurBab1 === "outline" ? "border-[#70E1B6] text-[#70E1B6]" : "border-[#273352] text-[#AAB4D0]"
                        }`}
                      >
                        {jalurBab1 === "outline" ? "✓" : ""}
                      </span>
                      <span className="text-sm font-bold text-[#FFF9EE]">1. Kerangka saja</span>
                    </div>
                    <p className="mt-2 text-xs text-[#AAB4D0] leading-relaxed">
                      Kamu dapat rencana latar belakang lengkap: tiap paragraf mau bilang apa, klaim apa yang boleh dipakai, dan dari
                      sumber mana. Tulisan kamu tulis sendiri. Tanpa AI, tanpa keluar dari halaman ini.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJalurBab1("draf")}
                    className={`rounded-xl border p-4 text-left transition ${
                      jalurBab1 === "draf"
                        ? "border-[#2959FF] bg-[#2959FF]/10"
                        : "border-[#273352] bg-[#080D1D] hover:border-[#2959FF]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                          jalurBab1 === "draf" ? "border-[#2959FF] text-[#70E1B6]" : "border-[#273352] text-[#AAB4D0]"
                        }`}
                      >
                        {jalurBab1 === "draf" ? "✓" : ""}
                      </span>
                      <span className="text-sm font-bold text-[#FFF9EE]">2. Draf siap tempel (bantuan AI)</span>
                    </div>
                    <p className="mt-2 text-xs text-[#AAB4D0] leading-relaxed">
                      Kamu dapat prosa Bab 1 yang sudah jadi, tapi hanya memakai klaim dari Catatan Bukti di atas. Hasilnya diperiksa
                      dulu sebelum dianggap siap. Butuh ChatGPT atau Gemini.
                    </p>
                  </button>
                </div>

                {jalurBab1 === "outline" && (
                  <>
                    <div className="rounded-xl border border-[#70E1B6]/30 bg-[#70E1B6]/5 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <FileCheck className="h-5 w-5 shrink-0 text-[#70E1B6] mt-0.5" />
                        <div className="text-xs text-[#FFF9EE] leading-relaxed">
                          <span className="font-bold">Kerangka latar belakang kamu sudah siap.</span> Isinya: pesan utama per paragraf,
                          klaim yang boleh dipakai beserta sumbernya, klaim yang dilarang, dan urutan paragraf yang sudah dikunci.
                          Salin lalu kembangkan jadi tulisan dengan bahasa kamu sendiri. Ini yang membuat karyamu tetap karyamu.
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-[#AAB4D0]">
                        <input
                          type="checkbox"
                          checked={outlinePanjangChecked}
                          onChange={(e) => setOutlinePanjangChecked(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-[#273352] bg-[#11182D] text-[#70E1B6] focus:ring-0"
                        />
                        <span>Sertakan target panjang per paragraf (1000–1300 kata)</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSalinOutline}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-2.5 text-xs font-bold text-[#080D1D] transition hover:bg-[#5cd4a6]"
                        >
                          {outlineTersalin ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Kerangka Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Salin Kerangka Latar Belakang</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                      <span className="text-xs font-bold text-[#FFF9EE]">Pratinjau kerangka:</span>
                      <pre className="mt-2 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed text-[#AAB4D0] whitespace-pre-wrap">
                        {outlineLatarBelakang}
                      </pre>
                    </div>
                  </>
                )}

                {jalurBab1 === "draf" && (
                  <>
                    <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 text-xs text-[#AAB4D0] leading-relaxed">
                      <span className="font-bold text-[#FFF9EE]">Yang dikunci di prompt ini:</span> daftar klaim yang boleh dipakai
                      beserta status buktinya, klaim terlarang, target 1000–1300 kata, dan kewajiban mencantumkan claim_id untuk setiap
                      kalimat faktual.
                    </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyPrompt4C}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2959FF] to-[#1E40AF] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#2959FF]/25 transition hover:brightness-110"
                  >
                    {copyStatus4C === "copied" ? (
                      <>
                        <Check className="h-4 w-4 text-[#70E1B6]" />
                        <span>Prompt 4C Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Salin Prompt Tahap 4C</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
                    <span>Buka ChatGPT</span>
                  </a>

                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
                    <span>Buka Gemini</span>
                  </a>
                </div>

                <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                  <pre className="font-mono text-xs leading-relaxed text-[#AAB4D0] whitespace-pre-wrap line-clamp-4 select-all">
                    {generatedPrompt4C}
                  </pre>
                </div>

                <div className="pt-4 border-t border-[#273352]/60 space-y-3">
                  <label className="block text-xs font-bold text-[#FFF9EE]">
                    Tempelkan Output Tahap 4C dari ChatGPT/Gemini:
                  </label>
                  <textarea
                    rows={6}
                    value={pastedLLMOutput4C}
                    onChange={(e) => setPastedLLMOutput4C(e.target.value)}
                    placeholder="Tempelkan hasil respons blok SKRIFLOW_BAB1_DRAFT_V1 di sini..."
                    className="w-full rounded-xl border border-[#273352] bg-[#080D1D] p-4 font-mono text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus:border-[#2959FF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleProcessLLMOutput4C}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-2.5 text-xs font-bold text-[#080D1D] transition hover:bg-[#5cd4a6]"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Verifikasi &amp; Susun Draf Bab 1</span>
                  </button>
                </div>

                {parseError4C && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                      <div className="space-y-3 w-full">
                        <div>
                          <h4 className="text-sm font-bold text-rose-300">{parseError4C.error}</h4>
                          {parseError4C.details && (
                            <ul className="mt-2 space-y-1 text-xs text-rose-200">
                              {parseError4C.details.map((d, i) => (
                                <li key={i}>* {d}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-500/20">
                          <button
                            type="button"
                            onClick={() => {
                              const fixPrompt = generateBab1DraftFixFormatPrompt(pastedLLMOutput4C, parseError4C.details);
                              copyToClipboard(fixPrompt);
                              setToastMessage("Prompt Perbaikan Format Draf tersalin!");
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Salin Prompt Perbaikan Format 4C</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const fixPrompt = generateBab1DraftFixStructurePrompt(pastedLLMOutput4C, parseError4C.details);
                              copyToClipboard(fixPrompt);
                              setToastMessage("Prompt Perbaikan Struktur Draf tersalin!");
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Salin Prompt Perbaikan Struktur 4C</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 9: HASIL DRAF BAB 1 + PEMERIKSA DRAF                                */}
      {/* ========================================================================= */}
      {parsedDraftV1 && (
        <section className="rounded-2xl border border-[#70E1B6] bg-[#11182D] p-6 shadow-2xl sm:p-8 space-y-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#273352]/70 pb-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#70E1B6]/20 text-[#70E1B6] font-bold">
                9
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#FFF9EE]">Draf Latar Belakang Bab 1</h2>
                <p className="text-xs text-[#AAB4D0]">
                  {parsedDraftV1.background.length} paragraf, {draftKataTotal.toLocaleString("id-ID")} kata. Setiap paragraf tertaut ke
                  klaim pada Catatan Bukti 4B.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  draftKataTotal >= 1000 && draftKataTotal <= 1300
                    ? "bg-[#70E1B6]/20 text-[#70E1B6]"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                Target 1000–1300 kata
              </span>
              <span className="rounded-full bg-[#2959FF]/20 px-3 py-1 text-xs font-bold text-[#AAB4D0]">
                {parsedDraftV1.draft_status}
              </span>
            </div>
          </div>

          {/* Pemeriksa draf */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#273352]/70 pb-2">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                Pemeriksa Draf (Kepatuhan pada Catatan Bukti 4B)
              </h3>
              <span className="text-[13px] text-[#AAB4D0]">
                {draftFindings.length === 0
                  ? "Tidak ada temuan"
                  : `${draftFindings.length} temuan (${draftKritis.length} kritis)`}
              </span>
            </div>

            {draftFindings.length === 0 ? (
              <div className="rounded-xl border border-[#70E1B6]/30 bg-[#70E1B6]/5 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#70E1B6] mt-0.5" />
                <p className="text-xs text-[#FFF9EE] leading-relaxed">
                  Draf lolos seluruh pemeriksaan: jumlah kata dalam rentang, susunan paragraf sesuai peta, semua claim_id dikenal,
                  dan tidak ada klaim terlarang yang lolos.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {draftFindings.map((f, idx) => (
                  <li
                    key={idx}
                    className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                      f.severity === "CRITICAL"
                        ? "border-rose-500/40 bg-rose-500/10"
                        : f.severity === "MAJOR"
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-[#273352] bg-[#080D1D]"
                    }`}
                  >
                    {f.severity === "CRITICAL" ? (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    ) : f.severity === "MAJOR" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0 text-[#AAB4D0] mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            f.severity === "CRITICAL"
                              ? "text-rose-300"
                              : f.severity === "MAJOR"
                                ? "text-amber-300"
                                : "text-[#AAB4D0]"
                          }`}
                        >
                          {f.severity}
                        </span>
                        {f.location && <span className="text-[10px] text-[#AAB4D0]">{f.location}</span>}
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          f.severity === "CRITICAL"
                            ? "text-rose-200"
                            : f.severity === "MAJOR"
                              ? "text-amber-200"
                              : "text-[#AAB4D0]"
                        }`}
                      >
                        {f.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Paragraf draf */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#273352]/70 pb-2">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">Isi Draf per Paragraf</h3>
              <button
                type="button"
                onClick={() => {
                  const teks = parsedDraftV1.background.map((p) => (p.paragraph_text || "").trim()).join("\n\n");
                  copyToClipboard(teks);
                  setToastMessage("Draf latar belakang tersalin!");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#080D1D] px-3 py-1.5 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF]"
              >
                <Copy className="h-3 w-3" />
                <span>Salin Seluruh Draf</span>
              </button>
            </div>

            {(parsedDraftV1.background || []).map((p) => {
              const info = getBackgroundFunctionInfo(p.function, p.order, parsedFoundationV1?.phenomenon_basis_status);
              const temuanParagraf = draftFindings.filter((f) => f.location?.startsWith(`Paragraf ${p.order} `));
              const kritisParagraf = temuanParagraf.filter((f) => f.severity === "CRITICAL").length;
              return (
                <div
                  key={`${p.order}-${p.function}`}
                  className={`rounded-xl border p-4 space-y-3 ${
                    kritisParagraf > 0 ? "border-rose-500/40 bg-rose-500/5" : "border-[#273352] bg-[#080D1D]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2959FF]/20 text-[11px] font-bold text-[#70E1B6]">
                        {p.order}
                      </span>
                      <span className="text-xs font-bold text-[#FFF9EE]">{info?.title || p.function}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#AAB4D0]">{p.word_count} kata</span>
                      {temuanParagraf.length > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            kritisParagraf > 0 ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {kritisParagraf > 0 ? `${kritisParagraf} kritis` : `${temuanParagraf.length} catatan`}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-[#E6EAF5] whitespace-pre-wrap">{p.paragraph_text}</p>

                  {p.claim_ids.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-[#AAB4D0]">Klaim dipakai:</span>
                      {p.claim_ids.map((c) => {
                        const ada = (parsedFoundationV1?.evidence_ledger || []).some(
                          (e) => e.claim_id.replace(/[\[\]]/g, "").trim().toUpperCase() === c.replace(/[\[\]]/g, "").trim().toUpperCase()
                        );
                        return (
                          <span
                            key={c}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                              ada ? "bg-[#70E1B6]/15 text-[#70E1B6]" : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {c}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {p.researcher_decision_note && (
                    <p className="text-[11px] text-[#AAB4D0] italic">Catatan keputusan mahasiswa: {p.researcher_decision_note}</p>
                  )}

                  {p.withheld_claims && p.withheld_claims.length > 0 && (
                    <div className="rounded-lg border border-[#273352] bg-[#11182D] p-2.5">
                      <span className="text-[10px] font-bold text-[#AAB4D0]">Sengaja tidak ditulis:</span>
                      <ul className="mt-1 space-y-0.5">
                        {p.withheld_claims.map((w, i) => (
                          <li key={i} className="text-[11px] text-[#AAB4D0]">
                            - {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Catatan pendukung */}
          {((parsedDraftV1.avoided_claims?.length || 0) > 0 ||
            (parsedDraftV1.consistency_notes?.length || 0) > 0 ||
            (parsedDraftV1.prohibited_claims_respected?.length || 0) > 0 ||
            (parsedDraftV1.unresolved_notes?.length || 0) > 0) && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider border-b border-[#273352]/70 pb-2">
                Catatan Kepatuhan & Keterbatasan
              </h3>
              {[
                { judul: "Klaim yang dihindari (DO_NOT_USE)", isi: parsedDraftV1.avoided_claims },
                { judul: "Klaim terlarang yang berhasil dihindari", isi: parsedDraftV1.prohibited_claims_respected },
                { judul: "Perlu dicek konsistensinya", isi: parsedDraftV1.consistency_notes },
                { judul: "Keterbatasan yang harus disebut", isi: parsedDraftV1.unresolved_notes },
              ]
                .filter((g) => (g.isi?.length || 0) > 0)
                .map((g) => (
                  <div key={g.judul} className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                    <span className="text-xs font-bold text-[#FFF9EE]">{g.judul}</span>
                    <ul className="mt-2 space-y-1">
                      {(g.isi || []).map((x, i) => (
                        <li key={i} className="text-[11px] text-[#AAB4D0] leading-relaxed">
                          - {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#273352]/60">
            <button
              type="button"
              onClick={handleResetDraft4C}
              className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#11182D] px-4 py-2.5 text-xs font-semibold text-[#AAB4D0] transition hover:text-rose-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Buang Draf &amp; Ulangi Tahap 4C</span>
            </button>
          </div>
        </section>
      )}

      {/* MODAL: SESUAIKAN DATA */}
      {showAdjustDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#273352] bg-[#11182D] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#FFF9EE]">Sesuaikan Konteks Mahasiswa</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-[#AAB4D0]">Program Studi</label>
                <input
                  type="text"
                  value={modalProdi}
                  onChange={(e) => setModalProdi(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#273352] bg-[#080D1D] p-2 text-[#FFF9EE]"
                />
              </div>
              <div>
                <label className="text-[#AAB4D0]">Area Eksplorasi</label>
                <input
                  type="text"
                  value={modalArea}
                  onChange={(e) => setModalArea(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#273352] bg-[#080D1D] p-2 text-[#FFF9EE]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdjustDataModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-[#AAB4D0]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveAdjustDataModal}
                className="rounded-lg bg-[#2959FF] px-4 py-2 text-xs font-bold text-white"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET TOOL 4 */}
      {showResetModal && (
        <ResetConfirmModal
          isOpen={showResetModal}
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetModal(false)}
          toolName="Bedah Fenomena & Literatur"
          title="Reset Formulir & Hasil Tool 4?"
          description="Tindakan ini akan mengosongkan paket bukti literatur yang ditempel serta seluruh hasil analisis tahap bedah. Data dari Cari Ide, Cari Fenomena, dan Cari Literatur tidak akan terhapus."
          confirmButtonText="Ya, Reset Tool 4"
        />
      )}
    </div>
  );
};
