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
  Bab1PolishV1,
  DraftCheckFinding,
  PolishCheckFinding,
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
  saveBedahOutput4D,
  loadBedahOutput4D,
  clearBedahOutput4D,
  saveBab1PolishV1,
  loadBab1PolishV1,
  clearBab1PolishV1,
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
  parseBab1PolishTransfer,
  periksaPolesBab1,
  computeBedahInputFingerprint,
  extractSumberPaketLiteratur,
} from "@/lib/bedahParser";
import {
  TombolPeriksaSumber,
  RingkasanVerifikasi,
  TombolUnduhBibtex,
  LencanaVerifikasi,
  useVerifikasiSumber,
} from "./VerifikasiSumberPanel";
import { PanelRingkasanDanTerkait } from "./PanelRingkasanDanTerkait";
import {
  assembleBedahPrompt,
  analyzeBedahPrompt,
  assembleBedahPrompt4B,
  analyzeBedahPrompt4B,
  ResearchBedahInput4B,
  assembleBedahPrompt4C,
  assembleBedahPrompt4D,
  analyzeBedahPrompt4C,
  ResearchBedahInput4C,
  assembleBab1DraftSourceFile,
  assembleBab1DraftShortCommand,
  analyzeBab1DraftShortCommand,
} from "@/lib/promptAssembler";
import { copyToClipboard } from "@/lib/clipboard";
import { susunOutlineLatarBelakang } from "@/lib/bab1Outline";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { AiUsageDeclaration } from "./AiUsageDeclaration";
import { TombolTempelClipboard } from "./TombolTempelClipboard";
import { keRtf, namaFileAman, type BlokRtf } from "@/lib/ekspor";
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
  Download,
  FileDown,
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

/**
 * Tool 5 — Susun Bab 1.
 *
 * Dipisah dari Tool 4 (Bedah Fenomena & Literatur) karena tahap ini bukan lagi
 * membedah bukti, melainkan menuliskan hasilnya: uji kelayakan data, Paket
 * Fondasi Bab 1, lalu peta narasi / kerangka / draf. Seluruh bahannya dibaca
 * dari storage yang sudah diisi Tool 4, jadi urutan pemakaian tetap terjaga.
 */

export const Bab1ToolContainer: React.FC = () => {
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

  // Stage 4D State — poles bahasa draf (Addendum C)
  const [pastedLLMOutput4D, setPastedLLMOutput4D] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahOutput4D() : "";
  });
  const [parsedPolishV1, setParsedPolishV1] = useState<Bab1PolishV1 | null>(() => {
    return typeof window !== "undefined" ? loadBab1PolishV1() : null;
  });
  const [parseError4D, setParseError4D] = useState<{ error: string; details?: string[] } | null>(null);
  const [copyStatus4D, setCopyStatus4D] = useState<"idle" | "copied" | "error">("idle");
  const prompt4DSectionRef = useRef<HTMLDivElement>(null);

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
    // Register Tool 3 dibaca langsung di sini (bukan lewat `sumberUntukDiperiksa`
    // yang dideklarasikan di bawah) karena urutan deklarasi dalam komponen.
    return {
      prodi,
      areaEksplorasi,
      foundation: parsedFoundationV1,
      registerSumber: extractSumberPaketLiteratur(literaturePackage).length > 0
        ? extractSumberPaketLiteratur(literaturePackage)
        : (parsedPayloadV2?.source_weights ?? []).map((sw) => {
            const x = sw as unknown as Record<string, unknown>;
            return { sourceId: String(x.source_id ?? ""), authorsYear: String(x.penulis_tahun ?? "") };
          }),
    };
  }, [parsedFoundationV1, prodi, areaEksplorasi, petaSiapTulis, literaturePackage, parsedPayloadV2]);

  const generatedPrompt4C = useMemo(() => {
    if (!bedahInput4C) return "";
    return assembleBedahPrompt4C(bedahInput4C);
  }, [bedahInput4C]);

  const promptAnalysis4C = useMemo(() => {
    if (!bedahInput4C) return null;
    return analyzeBedahPrompt4C(bedahInput4C);
  }, [bedahInput4C]);

  // Addendum D: berkas sumber + perintah pendek pengganti tempel-panjang
  const berkasSumber4C = useMemo(() => {
    if (!bedahInput4C) return "";
    return assembleBab1DraftSourceFile(bedahInput4C);
  }, [bedahInput4C]);

  const perintahSingkat4C = useMemo(() => {
    if (!bedahInput4C) return "";
    return assembleBab1DraftShortCommand(bedahInput4C);
  }, [bedahInput4C]);

  const promptAnalysisShort4C = useMemo(() => {
    if (!bedahInput4C) return null;
    return analyzeBab1DraftShortCommand(bedahInput4C);
  }, [bedahInput4C]);

  // Tahap 4D: input & prompt poles bahasa
  const bedahInput4D = useMemo(() => {
    if (!parsedDraftV1 || !parsedFoundationV1) return null;
    if (parsedDraftV1.draft_status === "DRAFT_BLOCKED") return null;
    return { prodi, areaEksplorasi, draft: parsedDraftV1, foundation: parsedFoundationV1 };
  }, [parsedDraftV1, parsedFoundationV1, prodi, areaEksplorasi]);

  const generatedPrompt4D = useMemo(() => {
    if (!bedahInput4D) return "";
    return assembleBedahPrompt4D(bedahInput4D);
  }, [bedahInput4D]);

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
  /** Addendum D: unduh berkas sumber, salin perintah pendek untuk chat box. */
  const handleUnduhBerkasSumber4C = () => {
    if (!berkasSumber4C) return;
    const blob = new Blob([berkasSumber4C], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skriflow-berkas-sumber-4C.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToastMessage("Berkas sumber terunduh. Unggah ke NotebookLM sebagai sumber.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyPerintahSingkat4C = async () => {
    if (!perintahSingkat4C) return;
    const ok = await copyToClipboard(perintahSingkat4C);
    setCopyStatus4C("copied");
    setTimeout(() => setCopyStatus4C("idle"), 3000);
    if (ok) {
      setToastMessage("Perintah pendek tersalin! Tempel di kolom chat NotebookLM.");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

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

  // Tahap 4D: temuan pemeriksa perubahan bahasa
  const polishFindings = useMemo<PolishCheckFinding[]>(() => {
    if (!parsedPolishV1 || !parsedDraftV1) return [];
    return periksaPolesBab1(parsedPolishV1, parsedDraftV1);
  }, [parsedPolishV1, parsedDraftV1]);

  const polishKritis = useMemo(() => polishFindings.filter((f) => f.severity === "CRITICAL"), [polishFindings]);

  /**
   * Draf lolos hanya bila BERSIH di dua pemeriksa (Addendum C.6):
   * kepatuhan bukti terhadap fondasi 4B, dan kepatuhan perubahan terhadap draf 4C.
   */
  const polishLolos = useMemo(() => {
    if (!parsedPolishV1) return false;
    const temuanBukti = periksaDrafBab1(
      { ...parsedDraftV1!, background: parsedPolishV1.background } as Bab1DraftV1,
      parsedFoundationV1!
    );
    return temuanBukti.every((f) => f.severity !== "CRITICAL") && polishKritis.length === 0;
  }, [parsedPolishV1, parsedDraftV1, parsedFoundationV1, polishKritis]);

  // Handle Copy Prompt 4D
  const handleCopyPrompt4D = async () => {
    if (!generatedPrompt4D) return;
    try {
      const ok = await copyToClipboard(generatedPrompt4D);
      if (ok) {
        setCopyStatus4D("copied");
        setTimeout(() => setCopyStatus4D("idle"), 3000);
      }
    } catch {
      setCopyStatus4D("error");
    }
  };

  // Handle Process LLM Output 4D
  const handleProcessLLMOutput4D = () => {
    setParseError4D(null);
    if (!parsedDraftV1) return;
    const res = parseBab1PolishTransfer(pastedLLMOutput4D);
    if (res.success && res.data) {
      setParsedPolishV1(res.data);
      saveBab1PolishV1(res.data);
      saveBedahOutput4D(pastedLLMOutput4D);
    } else {
      setParseError4D({ error: res.error || "Gagal memproses output.", details: res.errorDetails });
    }
  };

  // Handle Reset 4D
  /**
   * Unduh draf Bab 1 hasil poles (4D) sebagai .rtf.
   *
   * RTF dipilih karena bisa dibuat tanpa library (skripsi ini diserahkan ke
   * dosen, jadi peringatan "format file tidak cocok" dari Word tidak bisa
   * diterima). Kalau nanti butuh .docx asli, ganti ke paket `docx`.
   */
  const handleUnduhBab1Rtf = () => {
    if (!parsedPolishV1) return;

    const blok: BlokRtf[] = [{ teks: "BAB I — PENDAHULUAN", gaya: "judul" }, { teks: "" }];
    blok.push({ teks: "Latar Belakang", gaya: "subjudul" });
    for (const p of parsedPolishV1.background || []) {
      const t = (p.paragraph_text || "").trim();
      if (t) blok.push({ teks: t });
    }

    // Jejak AI wajib ikut: mahasiswa harus bisa membuktikan draf ini dibantu AI.
    blok.push({ teks: "" });
    blok.push({ teks: "Catatan Penggunaan AI", gaya: "subjudul" });
    blok.push({
      teks:
        "Draf ini disusun dengan bantuan AI: kerangka dan peta narasi dari Skriflow, " +
        "penulisan draf awal di NotebookLM, lalu perbaikan bahasa di ChatGPT. " +
        "Seluruh isi sudah diperiksa dan disesuaikan oleh penulis. Cantumkan keterangan ini " +
        "sesuai ketentuan kampus soal penggunaan AI.",
    });
    // `name` (bukan `title`) — ResearchDirectionV2 tidak punya field `title`.
    const judul = selectedDirectionObj?.name || selectedDirectionObj?.id || "Bab 1";
    blok.push({ teks: "" });
    blok.push({
      teks:
        `Arah penelitian: ${judul}. Dihasilkan pada ${new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}.`,
    });

    const blob = new Blob([keRtf(blok)], { type: "application/rtf;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = namaFileAman(`Bab-1-${judul}`, "rtf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetPoles4D = () => {
    setPastedLLMOutput4D("");
    clearBedahOutput4D();
    setParsedPolishV1(null);
    clearBab1PolishV1();
    setParseError4D(null);
    setCopyStatus4D("idle");
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
        authorsYear: x.authorsYear,
        publication: x.publication,
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

  /**
   * Sumber acuan untuk tahap menulis (Tool 5).
   *
   * Isinya sumber sandaran dari arah terpilih + artikel yang sudah lolos
   * pemeriksaan di paket literatur. Fungsinya: memastikan literatur yang dipakai
   * memang ada, dan memberi mahasiswa daftar pustaka siap impor ke Mendeley.
   */
  const sumberAcuanTool5 = useMemo(() => {
    const dariPaket = sumberUntukDiperiksa;
    const idSandaran = selectedDirectionObj?.anchor_source_ids ?? [];
    if (dariPaket.length === 0) return dariPaket;
    return dariPaket.filter((s) => idSandaran.length === 0 || idSandaran.includes(s.sourceId));
  }, [sumberUntukDiperiksa, selectedDirectionObj]);

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

  // Reset state milik Tool 5 (Susun Bab 1). State Tool 4 (paket literatur, hasil 4A,
  // arah terpilih) SENGAJA tidak dihapus: arah terpilih adalah input halaman ini.
  const handleConfirmReset = () => {
    setPastedLLMOutput4B("");
    clearBedahOutput4B();
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
    setCopyStatus4B("idle");
    handleResetDraft4C();
    handleResetPoles4D();
    setShowResetModal(false);
    setToastMessage("Paket Fondasi Bab 1 dan draf berhasil direset. Arah terpilih dari Tool 4 tetap tersimpan.");
    setTimeout(() => {
      setToastMessage((prev) => (prev === "Paket Fondasi Bab 1 dan draf berhasil direset. Arah terpilih dari Tool 4 tetap tersimpan." ? null : prev));
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
                    {/* Prompt 4B dijalankan di ChatGPT/Gemini (batas 55.000).
                        NotebookLM SENGAJA TIDAK ditawarkan di sini: batas chat box-nya
                        ~3.900 dan prompt 4B ~31.732 karakter, jadi pasti ditolak tanpa
                        pesan apa pun. NotebookLM dipakai di Tahap 4C (berkas sumber). */}
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-3 text-xs font-bold text-[#080D1D] shadow-lg shadow-[#70E1B6]/20 transition hover:bg-[#5cd4a6]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Langkah 1: Buka ChatGPT</span>
                    </a>

                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] transition hover:border-[#2959FF] hover:bg-[#16213D]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" />
                      <span>atau Gemini</span>
                    </a>

                    <span className="text-[11px] text-[#AAB4D0]">
                      Tahap 4B bukan untuk NotebookLM — promptnya terlalu panjang untuk kolom chat di sana.
                    </span>
                  </>
                )}
              </div>

              {/* Paste Area 4B */}
              <div className="pt-4 border-t border-[#273352]/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-[#FFF9EE]">
                    Langkah 2: Tempelkan Output Tahap 4B dari ChatGPT/Gemini:
                  </label>
                  <TombolTempelClipboard onPaste={setPastedLLMOutput4B} />
                </div>
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
                        <td className="p-3 max-w-xs">{el.evidence_location || "-"}</td>
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
                <span>Reset Paket Bab 1</span>
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

                {/* Alur tegas: NotebookLM menulis, ChatGPT merapikan bahasanya. */}
                <div className="rounded-xl border border-[#70E1B6]/35 bg-[#70E1B6]/5 p-4 space-y-2.5">
                  <span className="text-xs font-bold text-[#70E1B6]">Alurnya empat langkah, jangan dibalik:</span>
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs text-[#AAB4D0] leading-relaxed">
                    <li>
                      <span className="font-semibold text-[#FFF9EE]">Unduh berkas sumber</span> Skriflow, lalu unggah ke{" "}
                      <span className="font-semibold text-[#70E1B6]">NotebookLM</span> sebagai sumber. Isinya instruksi lengkap
                      penulisan — memang panjang, dan itu sebabnya dikirim sebagai sumber, bukan ditempel di kolom chat.
                    </li>
                    <li>
                      <span className="font-semibold text-[#FFF9EE]">Salin perintah pendeknya</span>, lalu tempel di{" "}
                      <span className="font-semibold text-[#70E1B6]">kolom chat NotebookLM</span>. Perintah inilah yang menyuruh NotebookLM
                      bekerja memakai berkas sumber tadi — pendek, jadi pasti diterima.
                    </li>
                    <li>
                      NotebookLM yang menulis drafnya. <span className="font-semibold text-[#FFF9EE]">Tempel hasilnya</span> di kotak paling
                      bawah halaman ini, lalu klik Verifikasi &amp; Susun Draf Bab 1.
                    </li>
                    <li>
                      <span className="font-semibold text-[#FFF9EE]">Lanjut ke Tahap 4D</span> di bawah ini. Bahasa NotebookLM selalu kaku —{" "}
                      <span className="font-semibold text-[#70E1B6]">ChatGPT</span> yang mengubahnya jadi bahasa mahasiswa S1. Tahap ini wajib,
                      bukan pilihan.
                    </li>
                  </ol>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUnduhBerkasSumber4C}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2959FF] to-[#1E40AF] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#2959FF]/25 transition hover:brightness-110"
                  >
                    <Download className="h-4 w-4" />
                    <span>Langkah 1: Unduh Berkas Sumber ({berkasSumber4C.length.toLocaleString("id-ID")} karakter)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPerintahSingkat4C}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2959FF] to-[#1E40AF] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#2959FF]/25 transition hover:brightness-110"
                  >
                    {copyStatus4C === "copied" ? (
                      <>
                        <Check className="h-4 w-4 text-[#70E1B6]" />
                        <span>Perintah Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Langkah 2: Salin Perintah Pendek ({perintahSingkat4C.length.toLocaleString("id-ID")} karakter)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://notebooklm.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-3 text-xs font-bold text-[#080D1D] shadow-lg shadow-[#70E1B6]/20 transition hover:bg-[#5cd4a6]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Langkah 3: Buka NotebookLM</span>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#AAB4D0]">
                  <span>Sudah punya draf dari tempat lain? Boleh ditempel di Langkah 4 — tapi tetap wajib lewat Tahap 4D.</span>
                </div>

                <div className="rounded-xl border border-[#70E1B6]/30 bg-[#080D1D] p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-[#70E1B6]">Langkah 2: Perintah pendek ini yang ditempel di kolom chat</span>
                    {promptAnalysisShort4C && (
                      <span className="rounded-md border border-[#70E1B6]/40 bg-[#70E1B6]/10 px-2 py-0.5 font-semibold text-[#70E1B6]">
                        {promptAnalysisShort4C.finalLength.toLocaleString("id-ID")} / {promptAnalysisShort4C.hardLimit.toLocaleString("id-ID")} — {promptAnalysisShort4C.status === "SAFE" ? "Aman" : promptAnalysisShort4C.status}
                      </span>
                    )}
                  </div>
                  <pre className="font-mono text-xs leading-relaxed text-[#AAB4D0] whitespace-pre-wrap select-all">
                    {perintahSingkat4C}
                  </pre>
                  <details className="pt-2 border-t border-[#273352]/60">
                    <summary className="cursor-pointer text-xs font-semibold text-[#AAB4D0] hover:text-[#FFF9EE]">
                      Lihat isi berkas sumber yang diunggah ({
                        berkasSumber4C.length.toLocaleString("id-ID")
                      } karakter — ini yang sebelumnya harus ditempel di chat)
                    </summary>
                    <pre className="mt-3 max-h-80 overflow-y-auto font-mono text-[11px] leading-relaxed text-[#AAB4D0] whitespace-pre-wrap">
                      {berkasSumber4C}
                    </pre>
                  </details>
                </div>

                <div className="pt-4 border-t border-[#273352]/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-[#FFF9EE]">
                      Langkah 4: Tempel hasil draf dari NotebookLM (atau ChatGPT/Gemini):
                    </label>
                    <TombolTempelClipboard onPaste={setPastedLLMOutput4C} />
                  </div>
                  <textarea
                    rows={6}
                    value={pastedLLMOutput4C}
                    onChange={(e) => setPastedLLMOutput4C(e.target.value)}
                    placeholder="Tempelkan di sini hasil dari NotebookLM, termasuk blok SKRIFLOW_BAB1_DRAFT_V1..."
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
            <div className="flex items-center gap-2 flex-wrap">
              {sumberAcuanTool5.length > 0 && (
                <>
                  <TombolPeriksaSumber
                    jumlah={sumberAcuanTool5.length}
                    sedangProses={sedangVerifikasi}
                    onClick={() => periksaSumber(sumberAcuanTool5)}
                  />
                  <TombolUnduhBibtex
                    daftar={sumberAcuanTool5}
                    hasil={verifikasiSumber}
                    klasifikasi="Tool-5"
                  />
                </>
              )}
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

          {sumberAcuanTool5.length > 0 && <PanelRingkasanDanTerkait daftar={sumberAcuanTool5} />}

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

      {/* ========================================================================= */}
      {/* TAHAP 10: POLES BAHASA (4D) — Addendum C                                   */}
      {/* ========================================================================= */}
      {parsedDraftV1 && parsedDraftV1.draft_status !== "DRAFT_BLOCKED" && (
        <section
          ref={prompt4DSectionRef}
          className="rounded-2xl border border-[#70E1B6]/40 bg-[#11182D] p-6 shadow-xl sm:p-8"
        >
          <div className="flex items-center gap-3 border-b border-[#273352]/70 pb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#70E1B6]/20 text-base font-bold text-[#70E1B6]">
              10
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#2959FF]/20 px-2 py-0.5 text-xs font-bold text-[#70E1B6]">TAHAP 4D</span>
                <h2 className="text-lg font-bold text-[#FFF9EE]">Poles Bahasa Draf (Wajib)</h2>
              </div>
              <p className="mt-1 text-xs text-[#AAB4D0]">
                Bahasa NotebookLM selalu kaku — itu memang sifat alatnya, bukan kebetulan. Tahap ini yang mengubahnya jadi bahasa
                mahasiswa S1 — tanpa mengubah isi, klaim, angka, atau sitasi.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-[#2959FF]/30 bg-[#2959FF]/10 p-4">
              <p className="text-[13px] leading-relaxed text-[#FFF9EE]">
                <strong>Jangan lewati tahap ini.</strong> Draf dari NotebookLM pasti kaku karena dia menulis dari dokumen sumber,
                bukan untuk dibaca mahasiswa. Langkah 3 alurnya: salin prompt 4D di bawah, buka <strong>ChatGPT</strong>, tempel
                draf 4C, lalu tempel hasilnya kembali ke halaman ini.
              </p>
            </div>

            {/* Tombol salin + buka platform */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyPrompt4D}
                className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-3 text-xs font-bold text-[#080D1D] transition hover:bg-[#5cd4a6]"
              >
                {copyStatus4D === "copied" ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Prompt 4D Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Salin Prompt Tahap 4D</span>
                  </>
                )}
              </button>

              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-3 text-xs font-bold text-[#080D1D] shadow-lg shadow-[#70E1B6]/20 transition hover:bg-[#5cd4a6]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Langkah 5: Buka ChatGPT</span>
              </a>

              {generatedPrompt4D && (
                <span className="text-[11px] text-[#AAB4D0]">{generatedPrompt4D.length.toLocaleString("id-ID")} karakter</span>
              )}
            </div>

            <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
              <pre className="font-mono text-xs leading-relaxed text-[#AAB4D0] whitespace-pre-wrap line-clamp-4 select-all">
                {generatedPrompt4D}
              </pre>
            </div>

            {/* Paste hasil 4D */}
            <div className="pt-4 border-t border-[#273352]/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-[#FFF9EE]">
                  Tempel hasil perbaikan bahasa dari ChatGPT:
                </label>
                <TombolTempelClipboard onPaste={setPastedLLMOutput4D} />
              </div>
              <textarea
                rows={6}
                value={pastedLLMOutput4D}
                onChange={(e) => setPastedLLMOutput4D(e.target.value)}
                placeholder="Tempelkan hasil respons blok SKRIFLOW_BAB1_POLISH_V1 di sini..."
                className="w-full rounded-xl border border-[#273352] bg-[#080D1D] p-4 font-mono text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus:border-[#2959FF] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleProcessLLMOutput4D}
                className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-2.5 text-xs font-bold text-[#080D1D] transition hover:bg-[#5cd4a6]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Verifikasi Hasil Poles</span>
              </button>

              {parseError4D && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-rose-300">{parseError4D.error}</h4>
                      {parseError4D.details && (
                        <ul className="space-y-1">
                          {parseError4D.details.map((d, i) => (
                            <li key={i} className="text-[13px] text-rose-200/80">
                              - {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hasil 4D */}
          {parsedPolishV1 && (
            <div className="mt-8 space-y-5 border-t border-[#273352]/70 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-bold text-[#70E1B6] uppercase tracking-wider">
                  Hasil Poles Bahasa
                </h3>
                <span className="rounded bg-[#2959FF]/20 px-2 py-0.5 text-xs font-bold text-[#70E1B6]">
                  {parsedPolishV1.polish_status}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[12px] font-semibold ${
                    polishLolos ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {polishLolos ? "Lolos dua pemeriksa" : "Perlu revisi"}
                </span>
              </div>

              <p className="text-[13px] text-[#AAB4D0]">
                {parsedPolishV1.background.length} paragraf,{" "}
                {(parsedPolishV1.background || []).reduce((a, p) => a + hitungKata(p.paragraph_text || ""), 0).toLocaleString("id-ID")}{" "}
                kata. Diperiksa dua kali: kepatuhan bukti terhadap fondasi 4B, dan kepatuhan perubahan terhadap draf 4C.
              </p>

              {/* Temuan pemeriksa perubahan */}
              {polishFindings.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#FFF9EE]">
                    Pemeriksa Perubahan Bahasa ({polishFindings.length} temuan):
                  </span>
                  {polishFindings.map((f, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${
                        f.severity === "CRITICAL"
                          ? "border-rose-500/40 bg-rose-500/10"
                          : f.severity === "MAJOR"
                            ? "border-amber-500/40 bg-amber-500/10"
                            : "border-[#273352] bg-[#080D1D]"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase ${
                          f.severity === "CRITICAL" ? "text-rose-300" : f.severity === "MAJOR" ? "text-amber-300" : "text-[#AAB4D0]"
                        }`}
                      >
                        {f.severity} · {f.code}
                      </span>
                      <p className="mt-1 text-[13px] text-[#FFF9EE]">{f.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-[13px] text-emerald-200">
                    Tidak ada pelanggaran perubahan: jumlah paragraf, urutan, fungsi, dan claim_ids tetap sama dengan draf 4C.
                  </p>
                </div>
              )}

              {/* Paragraf hasil */}
              <div className="space-y-4">
                {(parsedPolishV1.background || []).map((p) => (
                  <div key={p.order} className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#70E1B6]">Paragraf {p.order}</span>
                      <span className="text-[11px] text-[#AAB4D0]">{p.function}</span>
                      <span className="text-[11px] text-[#AAB4D0]">· {hitungKata(p.paragraph_text || "")} kata</span>
                      {(p.claim_ids || []).map((c) => (
                        <span key={c} className="rounded bg-[#2959FF]/20 px-1.5 py-0.5 font-mono text-[11px] text-[#70E1B6]">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#FFF9EE] whitespace-pre-wrap">{p.paragraph_text}</p>
                  </div>
                ))}
              </div>

              {/* Catatan perubahan bahasa */}
              {(parsedPolishV1.language_changes?.length || 0) > 0 && (
                <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4">
                  <span className="text-xs font-bold text-[#FFF9EE]">Perubahan bahasa yang dilakukan</span>
                  <ul className="mt-2 space-y-1">
                    {(parsedPolishV1.language_changes || []).map((x, i) => (
                      <li key={i} className="text-[11px] leading-relaxed text-[#AAB4D0]">
                        - {x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#273352]/60">
                <button
                  type="button"
                  onClick={async () => {
                    const teks = parsedPolishV1.background.map((p) => (p.paragraph_text || "").trim()).join("\n\n");
                    await copyToClipboard(teks);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2959FF] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1f47d6]"
                >
                  <Copy className="h-4 w-4" />
                  <span>Salin Draf Hasil Poles</span>
                </button>

                <button
                  type="button"
                  onClick={handleUnduhBab1Rtf}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#70E1B6] px-5 py-2.5 text-xs font-bold text-[#080D1D] transition hover:bg-[#5cd4a6]"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Unduh Bab 1 (.rtf)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetPoles4D}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#273352] bg-[#11182D] px-4 py-2.5 text-xs font-semibold text-[#AAB4D0] transition hover:text-rose-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Buang Hasil Poles</span>
                </button>
              </div>
              <p className="text-[11px] text-[#AAB4D0] pt-1">
                Berkas .rtf dibuka Word, Google Docs, dan LibreOffice tanpa peringatan format. Setelah
                dibuka, pilih Save As → Word Document (.docx) kalau dosen memintanya.
              </p>
            </div>
          )}
        </section>
      )}

      {/* MODAL: RESET TOOL 5 */}
      {showResetModal && (
        <ResetConfirmModal
          isOpen={showResetModal}
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetModal(false)}
          toolName="Susun Bab 1"
          title="Reset Paket Fondasi &amp; Draf Bab 1?"
          description="Tindakan ini akan mengosongkan paket fondasi Bab 1, jawaban uji kelayakan, dan draf latar belakang. Arah penelitian yang sudah kamu pilih di Tool 4 tetap tersimpan, jadi kamu tidak perlu mengulang dari awal."
          confirmButtonText="Ya, Reset Bab 1"
        />
      )}
    </div>
  );
};
