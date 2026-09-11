"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tool,
  SelectedPhenomenon,
  PhenomenonEvidence,
  PhenomenonStatus,
  SelectedExplorationAreaV3,
  SelectedExplorationAreaV2,
  IdeaToPhenomenonHandoff,
  FieldOrigin,
} from "@/types/tool";
import { validateForm } from "@/lib/validation";
import {
  TombolPeriksaSumber,
  RingkasanVerifikasi,
  LencanaVerifikasi,
  useVerifikasiSumber,
} from "./VerifikasiSumberPanel";
import { assemblePrompt } from "@/lib/promptAssembler";
import { getAutofillForTool, applyAutofillValues } from "@/lib/autofill";
import {
  subscribeToToolData,
  getToolDataSnapshot,
  saveToolData,
  clearToolData,
  saveSelectedPhenomenon,
  loadSelectedPhenomenon,
  clearSelectedPhenomenon,
  savePhenomenonPasteDraft,
  loadPhenomenonPasteDraft,
  loadSelectedExplorationArea,
  getSelectedExplorationAreaSnapshot,
  saveSharedResearchContext,
  loadToolData as loadPredecessorToolData,
  getIdeaToPhenomenonHandoffSnapshot,
  loadIdeaToPhenomenonHandoff,
  savePhenomenonFieldOrigins,
  loadPhenomenonFieldOrigins,
  clearPhenomenonFieldOrigins,
  savePhenomenonAppliedHandoffFingerprint,
  loadPhenomenonAppliedHandoffFingerprint,
  getPhenomenonAppliedHandoffFingerprintSnapshot,
} from "@/lib/storage";
import {
  parsePhenomenonTransfer,
  generateFixFormatPrompt,
  generateFixUrlPrompt,
  getCanonicalSourceKey,
  getUniqueSourceCount,
  getCanonicalSourceKeys,
  computeCandidateFingerprint,
  computeSelectedPhenomenonFingerprint,
  ParsePhenomenonResult,
} from "@/lib/phenomenonParser";
import { copyToClipboard, copyPromptAndOpenPlatform, PLATFORM_URLS } from "@/lib/clipboard";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { PromptExample } from "./PromptExample";
import { safeHref } from "@/lib/xss";
import { ClipboardFallbackModal } from "./ClipboardFallbackModal";
import { SequentialNavigation } from "./SequentialNavigation";
import { resolveOptionLabel } from "@/data/researchOptions";
import { getStudentLabel, getStudentStatus } from "@/lib/studentLanguage";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  RotateCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
  Compass,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface PhenomenonToolContainerProps {
  tool: Tool;
}

const emptySubscribe = () => () => {};
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export const PhenomenonToolContainer: React.FC<PhenomenonToolContainerProps> = ({ tool }) => {
  const router = useRouter();
  const isMounted = useIsMounted();

  // Storage subscription for form values
  const storedRaw = useSyncExternalStore(
    subscribeToToolData,
    () => getToolDataSnapshot(tool.slug),
    () => "{}"
  );

  const storedValues = useMemo(() => {
    try {
      const parsed = JSON.parse(storedRaw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // Gracefully handle parsing errors
    }
    return {};
  }, [storedRaw]);

  // Form values initialization
  const formValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of tool.fields) {
      if (field.defaultValue) {
        values[field.id] = field.defaultValue;
      }
      if (typeof storedValues[field.id] === "string" && storedValues[field.id].trim().length > 0) {
        values[field.id] = storedValues[field.id];
      }
    }
    return values;
  }, [tool.fields, storedValues]);

  // Predecessor Context from Tool 1 (Cari Ide Skripsi)
  const t1Snapshot = useSyncExternalStore(
    subscribeToToolData,
    () => getToolDataSnapshot("cari-ide-skripsi"),
    () => "{}"
  );

  const selectedAreaSnapshot = useSyncExternalStore(
    subscribeToToolData,
    getSelectedExplorationAreaSnapshot,
    () => "null"
  );

  const selectedExplorationArea = useMemo(() => {
    try {
      const parsed = JSON.parse(selectedAreaSnapshot);
      if (parsed && typeof parsed === "object") {
        if (parsed.schemaVersion === 3 || parsed.schemaVersion === 2) {
          return parsed as SelectedExplorationAreaV3 | SelectedExplorationAreaV2;
        }
      }
    } catch {
      // fallback
    }
    return loadSelectedExplorationArea();
  }, [selectedAreaSnapshot]);

  const t1Data = useMemo(() => {
    try {
      const parsed = JSON.parse(t1Snapshot);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // fallback
    }
    return loadPredecessorToolData("cari-ide-skripsi");
  }, [t1Snapshot]);

  const hasT1Data = useMemo(() => {
    return (
      !!selectedExplorationArea ||
      Object.values(t1Data).some(
        (v) => typeof v === "string" && v.trim().length > 0 && v !== "unknown"
      )
    );
  }, [t1Data, selectedExplorationArea]);

  // Handoff & Field Origin State
  const ideaHandoffRaw = useSyncExternalStore(
    subscribeToToolData,
    getIdeaToPhenomenonHandoffSnapshot,
    () => "null"
  );

  const ideaHandoff = useMemo(() => {
    try {
      const parsed = JSON.parse(ideaHandoffRaw);
      if (parsed && typeof parsed === "object" && parsed.handoffVersion === 2) {
        return parsed as IdeaToPhenomenonHandoff;
      }
    } catch {
      // fallback
    }
    return loadIdeaToPhenomenonHandoff();
  }, [ideaHandoffRaw]);

  const appliedHandoffFpRaw = useSyncExternalStore(
    subscribeToToolData,
    getPhenomenonAppliedHandoffFingerprintSnapshot,
    () => ""
  );

  const appliedHandoffFp = useMemo(() => {
    return appliedHandoffFpRaw || (typeof window !== "undefined" ? loadPhenomenonAppliedHandoffFingerprint() : "");
  }, [appliedHandoffFpRaw]);

  const [fieldOrigins, setFieldOrigins] = useState<Record<string, FieldOrigin>>(() => {
    return typeof window !== "undefined" ? loadPhenomenonFieldOrigins() : {};
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const isHandoffNewer = useMemo(() => {
    if (!ideaHandoff) return false;
    return ideaHandoff.sourcePayloadFingerprint !== appliedHandoffFp;
  }, [ideaHandoff, appliedHandoffFp]);

  const hasUserEditedFields = useMemo(() => {
    return Object.entries(fieldOrigins).some(
      ([k, origin]) => origin === "USER_EDITED" && (formValues[k] || "").trim().length > 0
    );
  }, [fieldOrigins, formValues]);

  // Auto-sync effect: automatically apply fresh handoff data when user has not made manual edits
  React.useEffect(() => {
    if (!isMounted || !ideaHandoff) return;
    if (ideaHandoff.sourcePayloadFingerprint === appliedHandoffFp) return;

    const anyUserEdited = Object.entries(fieldOrigins).some(
      ([k, origin]) => origin === "USER_EDITED" && (formValues[k] || "").trim().length > 0
    );

    if (!anyUserEdited) {
      const autofillResult = getAutofillForTool(tool.slug, formValues);
      if (autofillResult.hasData) {
        const nextValues = applyAutofillValues(formValues, autofillResult.data, "overwrite");
        saveToolData(tool.slug, nextValues);

        const updatedOrigins: Record<string, FieldOrigin> = {};
        Object.keys(autofillResult.data).forEach((k) => {
          updatedOrigins[k] = "AUTOFILL_IDEA";
        });
        savePhenomenonFieldOrigins(updatedOrigins);
        savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);

        const timer = setTimeout(() => {
          setFieldOrigins(updatedOrigins);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isMounted, tool.slug, ideaHandoff, appliedHandoffFp, fieldOrigins, formValues]);

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  // Refs and auto-scroll to output panel on mobile (< 1024px) after prompt generation
  const outputPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (generatedPrompt && window.innerWidth < 1024) {
      outputPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generatedPrompt]);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedFixPrompt, setCopiedFixPrompt] = useState(false);
  const [copiedFixUrlPrompt, setCopiedFixUrlPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fallbackModalState, setFallbackModalState] = useState<{
    prompt: string;
    targetUrl: string;
    platformName: string;
  } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isContextAccordionOpen, setIsContextAccordionOpen] = useState(false);
  const [openEvidenceCandidateIds, setOpenEvidenceCandidateIds] = useState<Record<string, boolean>>({});
  const [showRawResult, setShowRawResult] = useState(false);

  // Paste & Parsing States with lazy initializers
  const [pasteText, setPasteText] = useState<string>(() => {
    return typeof window !== "undefined" ? loadPhenomenonPasteDraft() : "";
  });

  /** Verifikasi sumber ke Crossref/OpenAlex (R-05) — komponen bersama Tool 2/3/4. */
  const {
    hasil: verifikasiSumber,
    sedangProses: sedangVerifikasi,
    catatan: verifikasiCatatan,
    periksa: periksaSumber,
    reset: resetVerifikasi,
  } = useVerifikasiSumber();

  const [parseResult, setParseResult] = useState<ParsePhenomenonResult | null>(() => {
    if (typeof window !== "undefined") {
      const savedDraft = loadPhenomenonPasteDraft();
      if (savedDraft) {
        const parsed = parsePhenomenonTransfer(savedDraft);
        if (parsed.success) return parsed;
      }
    }
    return null;
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const existingSelected = loadSelectedPhenomenon();
      if (existingSelected) return existingSelected.candidateId;
    }
    return null;
  });

  const [confirmedSources, setConfirmedSources] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const existingSelected = loadSelectedPhenomenon();
      if (existingSelected) {
        const confirmations: Record<string, boolean> = {};
        existingSelected.evidence.forEach((ev) => {
          if (ev.userConfirmed) {
            const canKey = getCanonicalSourceKey(ev);
            confirmations[`${existingSelected.candidateId}_${canKey}`] = true;
          }
        });
        return confirmations;
      }
    }
    return {};
  });

  const [understoodTemporary, setUnderstoodTemporary] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const existingSelected = loadSelectedPhenomenon();
      return !!existingSelected;
    }
    return false;
  });

  // Field change handler with auto-save and manual origin tracking
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      const next = { ...formValues, [fieldId]: value };
      saveToolData(tool.slug, next);
      const updatedOrigins: Record<string, FieldOrigin> = { ...fieldOrigins, [fieldId]: "USER_EDITED" };
      setFieldOrigins(updatedOrigins);
      savePhenomenonFieldOrigins(updatedOrigins);

      setErrors((prev) => {
        if (prev[fieldId]) {
          const nextErrors = { ...prev };
          delete nextErrors[fieldId];
          return nextErrors;
        }
        return prev;
      });
    },
    [tool.slug, formValues, fieldOrigins]
  );

  // Refresh & Sinkronkan Data dari Cari Ide Handler (Explicit User Button)
  const handleRefreshFromT1 = () => {
    setIsRefreshing(true);
    const autofillResult = getAutofillForTool(tool.slug, formValues);
    if (autofillResult.hasData) {
      const nextValues = applyAutofillValues(formValues, autofillResult.data, "overwrite");
      saveToolData(tool.slug, nextValues);

      const updatedOrigins: Record<string, FieldOrigin> = {};
      Object.keys(autofillResult.data).forEach((k) => {
        updatedOrigins[k] = "AUTOFILL_IDEA";
      });
      setFieldOrigins(updatedOrigins);
      savePhenomenonFieldOrigins(updatedOrigins);

      if (ideaHandoff) {
        savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
      }

      setToastMessage("Data dan Area dari Cari Ide Skripsi berhasil disinkronkan ke form!");
    } else if (hasT1Data) {
      handleAutofillFromT1();
    } else {
      setToastMessage("Belum ada data area dari Cari Ide Skripsi yang tersimpan.");
    }

    setTimeout(() => {
      setIsRefreshing(false);
      setTimeout(() => setToastMessage(null), 3000);
    }, 400);
  };

  // Conflict banner handlers
  const handleApplyAllNewHandoff = () => {
    if (!ideaHandoff) return;
    const autofillResult = getAutofillForTool(tool.slug, formValues);
    if (autofillResult.hasData) {
      const nextValues = applyAutofillValues(formValues, autofillResult.data, "overwrite");
      saveToolData(tool.slug, nextValues);

      const updatedOrigins: Record<string, FieldOrigin> = {};
      Object.keys(autofillResult.data).forEach((k) => {
        updatedOrigins[k] = "AUTOFILL_IDEA";
      });
      setFieldOrigins(updatedOrigins);
      savePhenomenonFieldOrigins(updatedOrigins);
      savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
      setToastMessage("Seluruh data area terbaru dari Cari Ide Skripsi berhasil diterapkan.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleKeepManualEdits = () => {
    if (!ideaHandoff) return;
    savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
    setToastMessage("Isian manual kamu dipertahankan.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Legacy fallback autofill
  const handleAutofillFromT1 = () => {
    const autofillResult = getAutofillForTool(tool.slug, formValues);
    if (autofillResult.hasData) {
      const nextValues = applyAutofillValues(formValues, autofillResult.data, "overwrite");
      saveToolData(tool.slug, nextValues);
      setToastMessage("Data dan Paket Area dari Cari Ide Skripsi berhasil diterapkan ke form.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!hasT1Data) return;
    const next = { ...formValues };
    if (selectedExplorationArea) {
      if (selectedExplorationArea.handoffToPhenomenon?.areaText || selectedExplorationArea.name) {
        next.area_eksplorasi =
          selectedExplorationArea.handoffToPhenomenon?.areaText || selectedExplorationArea.name;
      }

      if (selectedExplorationArea.schemaVersion === 3) {
        const v3Area = selectedExplorationArea as SelectedExplorationAreaV3;
        const actors = v3Area.handoffToPhenomenon?.actorText || v3Area.researchContext?.potentialActors?.join(", ") || "";
        const entities = v3Area.handoffToPhenomenon?.entityText || v3Area.researchContext?.potentialEntities?.join(", ") || "";
        if (actors && entities) {
          next.objek_awal = `Siapa yang berkaitan: ${actors}. Apa yang diamati: ${entities}.`;
        } else if (actors) {
          next.objek_awal = `Siapa yang berkaitan: ${actors}.`;
        } else if (entities) {
          next.objek_awal = `Apa yang diamati: ${entities}.`;
        }
      }

      if (selectedExplorationArea.handoffToPhenomenon?.initialClue) {
        next.petunjuk_fenomena = selectedExplorationArea.handoffToPhenomenon.initialClue;
      } else if (selectedExplorationArea.phenomenonSearchBrief) {
        next.petunjuk_fenomena = selectedExplorationArea.phenomenonSearchBrief;
      }
    }
    if (t1Data.prodi || t1Data.programStudi) {
      next.prodi = t1Data.prodi || t1Data.programStudi;
    }
    if (t1Data.pendekatan) next.pendekatan = t1Data.pendekatan;
    if (t1Data.preferensi_data || t1Data.jenisData) {
      next.preferensi_data = t1Data.preferensi_data || t1Data.jenisData;
    }
    if (t1Data.akses_data) next.akses_data = t1Data.akses_data;
    if (t1Data.akses_data_catatan) next.akses_data_catatan = t1Data.akses_data_catatan;
    if (t1Data.avoidances || t1Data.kondisiBatasan) {
      next.avoidances = t1Data.avoidances || t1Data.kondisiBatasan;
    }
    if (t1Data.target_waktu) next.target_waktu = t1Data.target_waktu;
    if (t1Data.arahan_dosen || t1Data.supervisor_direction) {
      next.arahan_dosen = t1Data.arahan_dosen || t1Data.supervisor_direction;
    }
    saveToolData(tool.slug, next);
    setToastMessage("Data dan Paket Area dari Cari Ide Skripsi berhasil diterapkan ke form.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUseT1Data = handleRefreshFromT1;

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(tool.fields, formValues);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.firstErrorFieldId) {
        const el = document.getElementById(validation.firstErrorFieldId);
        if (el) el.focus();
      }
      return;
    }

    setErrors({});
    const fullContext = {
      ...t1Data,
      ...formValues,
    };
    const promptText = assemblePrompt(tool, fullContext);
    setGeneratedPrompt(promptText);
  };

  // Reset form handler
  const handleResetForm = () => {
    clearToolData(tool.slug);
    clearSelectedPhenomenon();
    clearPhenomenonFieldOrigins();
    setFieldOrigins({});
    savePhenomenonAppliedHandoffFingerprint("");
    setErrors({});
    setGeneratedPrompt(null);
    setShowResetModal(false);
    handleResetPaste();
  };

  // Paste Text change handler with auto-save draft
  const handlePasteChange = (val: string) => {
    setPasteText(val);
    savePhenomenonPasteDraft(val);
  };

  // Read / Parse Paste Handler
  const handleReadPaste = () => {
    const result = parsePhenomenonTransfer(pasteText);
    setParseResult(result);
    resetVerifikasi();
    if (result.success && result.payload && result.payload.candidates.length > 0) {
      setOpenEvidenceCandidateIds({});
    }
  };

  // Reset Paste Handler
  const handleResetPaste = () => {
    setPasteText("");
    savePhenomenonPasteDraft("");
    setParseResult(null);
    resetVerifikasi();
    setSelectedCandidateId(null);
    setConfirmedSources({});
    setUnderstoodTemporary(false);
  };

  // Copy fix prompt handler
  const handleCopyFixPrompt = async () => {
    const fixPrompt = generateFixFormatPrompt();
    const success = await copyToClipboard(fixPrompt);
    if (success) {
      setCopiedFixPrompt(true);
      setTimeout(() => setCopiedFixPrompt(false), 2500);
    } else {
      setFallbackModalState({
        prompt: fixPrompt,
        targetUrl: PLATFORM_URLS.chatgpt,
        platformName: "ChatGPT / Gemini",
      });
    }
  };

  // Copy fix URL prompt handler
  const handleCopyFixUrlPrompt = async () => {
    const fixUrlPrompt = generateFixUrlPrompt();
    const success = await copyToClipboard(fixUrlPrompt);
    if (success) {
      setCopiedFixUrlPrompt(true);
      setTimeout(() => setCopiedFixUrlPrompt(false), 2500);
    } else {
      setFallbackModalState({
        prompt: fixUrlPrompt,
        targetUrl: PLATFORM_URLS.chatgpt,
        platformName: "ChatGPT / Gemini",
      });
    }
  };

  // Main copy prompt handler
  const handleCopyMainPrompt = async () => {
    if (!generatedPrompt) return;
    const success = await copyToClipboard(generatedPrompt);
    if (success) {
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2500);
    } else {
      setFallbackModalState({
        prompt: generatedPrompt,
        targetUrl: PLATFORM_URLS.chatgpt,
        platformName: "ChatGPT / Gemini",
      });
    }
  };

  // Open platform handler
  const handleOpenPlatform = async (platform: "ChatGPT" | "Gemini") => {
    if (!generatedPrompt) return;
    const url = platform === "ChatGPT" ? PLATFORM_URLS.chatgpt : PLATFORM_URLS.gemini;
    const res = await copyPromptAndOpenPlatform(generatedPrompt, url);
    if (!res.success) {
      setFallbackModalState({
        prompt: generatedPrompt,
        targetUrl: url,
        platformName: platform,
      });
    } else {
      setToastMessage(`Prompt disalin! Membuka ${platform}...`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Toggle source confirmation based on canonical key
  const handleToggleSourceConfirm = (candidateId: string, canonicalKey: string) => {
    const key = `${candidateId}_${canonicalKey}`;
    setConfirmedSources((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Check candidate confirmation gate
  const selectedCandidate = useMemo(() => {
    if (!parseResult || !parseResult.payload) return null;
    return parseResult.payload.candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [parseResult, selectedCandidateId]);

  const confirmationGateStatus = useMemo(() => {
    if (!selectedCandidate) {
      return {
        canSave: false,
        reason: "Pilih salah satu kandidat fenomena terlebih dahulu.",
        confirmedUniqueCount: 0,
        requiredUniqueCount: 0,
        uniqueSourceCount: 0,
      };
    }

    const effStatus = selectedCandidate.effective_status || selectedCandidate.status;
    if (effStatus === "JANGAN_DIGUNAKAN") {
      return {
        canSave: false,
        reason: selectedCandidate.status_override_reason || "Kandidat berstatus Jangan Digunakan tidak dapat dipilih.",
        confirmedUniqueCount: 0,
        requiredUniqueCount: 0,
        uniqueSourceCount: 0,
      };
    }

    const uniqueKeys = getCanonicalSourceKeys(selectedCandidate.evidence);
    const uniqueSourceCount = uniqueKeys.length;

    if (uniqueSourceCount === 0) {
      return {
        canSave: false,
        reason: "Kandidat tidak memiliki sumber bukti yang valid.",
        confirmedUniqueCount: 0,
        requiredUniqueCount: 0,
        uniqueSourceCount: 0,
      };
    }

    const confirmedUniqueCount = uniqueKeys.filter(
      (k) => !!confirmedSources[`${selectedCandidate.id}_${k}`]
    ).length;

    const requiredUniqueCount = uniqueSourceCount >= 2 ? 2 : 1;

    if (confirmedUniqueCount < requiredUniqueCount) {
      return {
        canSave: false,
        reason: `Konfirmasi minimal ${requiredUniqueCount} sumber unik (${confirmedUniqueCount}/${requiredUniqueCount} sumber unik sudah diperiksa).`,
        confirmedUniqueCount,
        requiredUniqueCount,
        uniqueSourceCount,
      };
    }

    if (!understoodTemporary) {
      return {
        canSave: false,
        reason: "Centang persetujuan bahwa bagian ini masih perlu diperiksa dan belum merupakan keputusan final.",
        confirmedUniqueCount,
        requiredUniqueCount,
        uniqueSourceCount,
      };
    }

    return {
      canSave: true,
      reason: "",
      confirmedUniqueCount,
      requiredUniqueCount,
      uniqueSourceCount,
    };
  }, [selectedCandidate, confirmedSources, understoodTemporary]);

  // Storage subscription for selected phenomenon
  const selectedPhenomenonStored = useSyncExternalStore(
    subscribeToToolData,
    () => {
      const stored = loadSelectedPhenomenon();
      return stored ? JSON.stringify(stored) : "null";
    },
    () => "null"
  );

  const storedSelectedPhenomenon = useMemo<SelectedPhenomenon | null>(() => {
    try {
      if (selectedPhenomenonStored && selectedPhenomenonStored !== "null") {
        const parsed = JSON.parse(selectedPhenomenonStored) as Partial<SelectedPhenomenon>;
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.candidateId &&
          parsed.phenomenonSummary &&
          (parsed.status === "SIAP_DIBAWA" || parsed.status === "PERLU_DIPERIKSA") &&
          Array.isArray(parsed.evidence) &&
          parsed.evidence.length > 0
        ) {
          return parsed as SelectedPhenomenon;
        }
      }
    } catch {
      // corrupt data in localStorage
    }
    return null;
  }, [selectedPhenomenonStored]);

  // Determine if a valid phenomenon is saved and matches current selection
  const hasSavedValidPhenomenon = useMemo(() => {
    if (!storedSelectedPhenomenon) return false;

    // Case 1: Candidate is currently chosen in UI
    if (selectedCandidate) {
      if (selectedCandidate.status === "JANGAN_DIGUNAKAN") return false;
      if (!confirmationGateStatus.canSave) return false;

      const currentFingerprint = computeCandidateFingerprint(selectedCandidate, 1);
      const storedFingerprint = computeSelectedPhenomenonFingerprint(storedSelectedPhenomenon);
      return currentFingerprint === storedFingerprint;
    }

    // Case 2: No candidate actively chosen/parsed in UI (e.g. reload or fresh view), but valid SelectedPhenomenon exists in localStorage
    const uniqueSourceKeys = (storedSelectedPhenomenon.evidence || [])
      .map((ev) => getCanonicalSourceKey(ev))
      .filter((k, idx, arr) => arr.indexOf(k) === idx);
    const requiredCount = uniqueSourceKeys.length >= 2 ? 2 : 1;
    const confirmedCount = storedSelectedPhenomenon.sourceConfirmationCount || 0;

    return uniqueSourceKeys.length > 0 && confirmedCount >= requiredCount;
  }, [storedSelectedPhenomenon, selectedCandidate, confirmationGateStatus]);

  // Save selected candidate and handoff to Cari Literatur
  const handleSaveAndProceed = () => {
    if (!selectedCandidate || !confirmationGateStatus.canSave) return;

    const evidenceWithConfirmations: PhenomenonEvidence[] = selectedCandidate.evidence.map(
      (ev) => {
        const canKey = getCanonicalSourceKey(ev);
        const isConfirmed = !!confirmedSources[`${selectedCandidate.id}_${canKey}`];
        return {
          claim: ev.claim,
          observedDataOrEvent: ev.observed_data_or_event,
          sourceTitle: ev.source_title,
          publisherOrInstitution: ev.publisher_or_institution,
          sourceType: ev.source_type,
          publicationDate: ev.publication_date,
          referencePeriod: ev.reference_period,
          url: ev.url,
          evidenceLocation: ev.evidence_location || "Tidak dapat dipastikan",
          accessNote: ev.access_note || "Tidak dapat dipastikan",
          methodOrMetadata: ev.method_or_metadata,
          limitations: ev.limitations,
          userConfirmed: isConfirmed,
        };
      }
    );

    const confirmationCount = confirmationGateStatus.confirmedUniqueCount;
    const candidateFingerprint = computeCandidateFingerprint(selectedCandidate, 1);

    const effStatus = selectedCandidate.effective_status || selectedCandidate.status;
    if (effStatus === "JANGAN_DIGUNAKAN") return;

    const selectedPhenomenonData: SelectedPhenomenon = {
      schemaVersion: 1,
      sourceToolSlug: tool.slug,
      candidateId: selectedCandidate.id,
      name: selectedCandidate.name,
      status: effStatus as "SIAP_DIBAWA" | "PERLU_DIPERIKSA",
      effectiveStatus: effStatus,
      statusOverrideReason: selectedCandidate.status_override_reason,
      phenomenonType: selectedCandidate.phenomenon_type,
      phenomenonSummary: selectedCandidate.phenomenon_summary.trim(),
      observedCondition: selectedCandidate.observed_condition || "",
      relationToArea: selectedCandidate.relation_to_area || "",
      scope: {
        objectOrPopulation: selectedCandidate.scope.object_or_population || "",
        geography: selectedCandidate.scope.geography || "",
        referencePeriod: selectedCandidate.scope.reference_period || "",
      },
      evidence: evidenceWithConfirmations,
      triangulationNote: selectedCandidate.triangulation_note || "",
      whatIsNotProven: selectedCandidate.what_is_not_proven || "",
      quality: selectedCandidate.quality,
      keywordsId: selectedCandidate.keywords_id || [],
      keywordsEn: selectedCandidate.keywords_en || [],
      unresolvedItems: selectedCandidate.unresolved_items || [],
      sourceConfirmationCount: confirmationCount,
      fingerprint: candidateFingerprint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSelectedPhenomenon(selectedPhenomenonData);

    saveSharedResearchContext({
      prodi: (formValues.prodi || t1Data.prodi || "").trim(),
      area_eksplorasi: (formValues.area_eksplorasi || "").trim(),
      selectedArea: (formValues.area_eksplorasi || "").trim(),
      fenomena_ringkas: selectedCandidate.phenomenon_summary.trim(),
      fenomena_status: selectedCandidate.status,
      selected_phenomenon: selectedPhenomenonData,
      selectedPhenomenon: selectedPhenomenonData,
      constraints: {
        pendekatan: formValues.pendekatan || t1Data.pendekatan || "unknown",
        dataNyaman: formValues.preferensi_data || t1Data.preferensi_data || "unknown",
        aksesData: formValues.akses_data || t1Data.akses_data || "unknown",
        catatanAkses: formValues.akses_data_catatan || t1Data.akses_data_catatan || "",
        halDihindari: formValues.avoidances || t1Data.avoidances || "",
        kondisiWaktu: formValues.target_waktu || t1Data.target_waktu || "unknown",
        arahanDosen: formValues.arahan_dosen || t1Data.supervisor_direction || "",
      },
      pendekatan: formValues.pendekatan || t1Data.pendekatan || "unknown",
      preferensi_data: formValues.preferensi_data || t1Data.preferensi_data || "unknown",
      akses_data: formValues.akses_data || t1Data.akses_data || "unknown",
      akses_data_catatan: formValues.akses_data_catatan || t1Data.akses_data_catatan || "",
      avoidances: formValues.avoidances || t1Data.avoidances || "",
      target_waktu: formValues.target_waktu || t1Data.target_waktu || "unknown",
      supervisor_direction: formValues.arahan_dosen || t1Data.supervisor_direction || "",
      keywords: [
        ...(selectedCandidate.keywords_id || []),
        ...(selectedCandidate.keywords_en || []),
      ],
      unresolved_items: selectedCandidate.unresolved_items || [],
      unresolvedItems: selectedCandidate.unresolved_items || [],
      lastUpdated: new Date().toISOString(),
    });

    setToastMessage("Fenomena tersimpan dan siap dibawa ke pencarian literatur.");
    setTimeout(() => {
      router.push("/tools/cari-literatur-awal");
    }, 1200);
  };

  const getStatusBadge = (status: PhenomenonStatus) => {
    const info = getStudentStatus(status);
    return (
      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${info.badgeClass}`}>
        {status === "SIAP_DIBAWA" ? (
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        ) : status === "PERLU_DIPERIKSA" ? (
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        ) : (
          <XCircle className="h-3 w-3" aria-hidden="true" />
        )}
        <span>{info.label}</span>
      </span>
    );
  };

  const getQualityBadge = (level: string) => {
    const info = getStudentStatus(level);
    return (
      <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${info.badgeClass}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-[#70E1B6]/40 bg-[#080D1D] px-4 py-3 text-xs font-semibold text-[#FFF9EE] shadow-xl shadow-black/40 animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 1 — CERITAKAN KONDISIMU (FORM & OUTPUT PANEL) */}
      {/* ========================================================================= */}
      <section aria-labelledby="tahap-1-heading" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[#273352] pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2959FF] text-xs font-bold text-white">
            1
          </span>
          <h2 id="tahap-1-heading" className="text-lg font-bold text-[#FFF9EE]">
            Tahap 1: Ceritakan Kondisimu
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Panel: Form */}
          <div className="lg:col-span-6">
            <div className="relative flex h-full flex-col justify-between rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header & Cari Ide Autofill Banner with Refresh button */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#273352]/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#70E1B6]">
                      Form Parameter Fenomena
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Refresh / Sinkronkan Button */}
                    <button
                      type="button"
                      id="btn-refresh-t1-data"
                      onClick={handleRefreshFromT1}
                      disabled={isRefreshing}
                      title="Muat ulang dan sinkronkan data dari Cari Ide Skripsi"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#080D1D] px-2.5 py-1 text-xs font-semibold text-[#70E1B6] transition-all hover:border-[#70E1B6] hover:bg-[#70E1B6]/10 focus-visible:ring-2 focus-visible:ring-[#70E1B6] cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#70E1B6]" : "text-[#70E1B6]"}`} aria-hidden="true" />
                      <span>{isRefreshing ? "Menyinkronkan..." : "Refresh Data Cari Ide"}</span>
                    </button>
                  </div>
                </div>

                {/* Conflict Confirmation Banner when manual edits exist */}
                {isMounted && ideaHandoff && isHandoffNewer && hasUserEditedFields && (
                  <div className="rounded-xl border border-[#F5A623]/40 bg-[#F5A623]/10 p-4 space-y-3 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-[#F5A623] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
                          Data dari Area Baru Tersedia
                        </h4>
                        <p className="text-xs text-[#FFF9EE] leading-relaxed">
                          Data dari Cari Ide Skripsi (Putaran {ideaHandoff.sourceRoundNumber}: [{ideaHandoff.selectedAreaId}] {ideaHandoff.selectedAreaName}) telah tersedia. Beberapa field sudah pernah kamu ubah sendiri.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        id="btn-apply-all-new-handoff"
                        onClick={handleApplyAllNewHandoff}
                        className="rounded-lg bg-[#2959FF] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1f48db] min-h-[44px] cursor-pointer"
                      >
                        Gunakan Semua Data Terbaru
                      </button>
                      <button
                        type="button"
                        id="btn-keep-manual-edits"
                        onClick={handleKeepManualEdits}
                        className="rounded-lg border border-[#273352] bg-[#11182D] px-3.5 py-2 text-xs font-semibold text-[#AAB4D0] hover:text-[#FFF9EE] min-h-[44px] cursor-pointer"
                      >
                        Pertahankan Isian Manual
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Source Summary */}
                {isMounted && ideaHandoff && !isHandoffNewer && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-[#273352] bg-[#080D1D] p-3 text-xs text-[#FFF9EE]">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#70E1B6] shrink-0" aria-hidden="true" />
                      <div className="text-[13px] space-y-0.5">
                        <span className="text-[#AAB4D0] block text-[12px] uppercase tracking-wider">
                          Data dari Cari Ide Skripsi
                        </span>
                        <span className="font-semibold text-[#FFF9EE]">
                          Putaran {ideaHandoff.sourceRoundNumber} • [{ideaHandoff.selectedAreaId}] {ideaHandoff.selectedAreaName}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshFromT1}
                      title="Sinkronkan ulang data"
                      className="inline-flex items-center gap-1 rounded border border-[#273352] px-2 py-1 text-[12px] text-[#AAB4D0] hover:text-[#FFF9EE] hover:border-[#70E1B6] transition-colors cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3 text-[#70E1B6]" />
                      <span>Sinkronkan Ulang</span>
                    </button>
                  </div>
                )}

                {/* Context from Cari Ide Skripsi Accordion */}
                {isMounted && hasT1Data && (
                  <div className="rounded-lg border border-[#273352] bg-[#080D1D]/70 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsContextAccordionOpen(!isContextAccordionOpen)}
                      aria-expanded={isContextAccordionOpen}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FFF9EE] hover:bg-[#16213D] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Compass className="h-3.5 w-3.5 text-[#2959FF]" aria-hidden="true" />
                        Konteks Pengerjaan dari Cari Ide Skripsi
                      </span>
                      {isContextAccordionOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
                      )}
                    </button>

                    {isContextAccordionOpen && (
                      <div className="px-3.5 py-3 border-t border-[#273352] space-y-2.5 text-xs text-[#AAB4D0]">
                        {selectedExplorationArea ? (
                          <div className="space-y-2 border-b border-[#273352]/60 pb-3">
                            <p>
                              <strong className="text-[#70E1B6]">Area Terpilih:</strong>{" "}
                              <span className="text-[#FFF9EE] font-semibold">
                                {selectedExplorationArea.name} ({selectedExplorationArea.areaId})
                              </span>
                            </p>
                            <p>
                              <strong className="text-[#FFF9EE]">Cakupan:</strong>{" "}
                              {selectedExplorationArea.scopeSummary}
                            </p>
                            <p>
                              <strong className="text-[#FFF9EE]">Keterkaitan Prodi:</strong>{" "}
                              {selectedExplorationArea.academicConnection}
                            </p>

                            {/* V3 Research Context */}
                            {"researchContext" in selectedExplorationArea && selectedExplorationArea.researchContext ? (
                              <div className="space-y-1.5 pt-1 text-[13px]">
                                {selectedExplorationArea.researchContext.potentialActors.length > 0 && (
                                  <p>
                                    <strong className="text-[#70E1B6]">Siapa yang berkaitan:</strong>{" "}
                                    {selectedExplorationArea.researchContext.potentialActors.join(", ")}
                                  </p>
                                )}
                                {selectedExplorationArea.researchContext.potentialEntities.length > 0 && (
                                  <p>
                                    <strong className="text-[#2959FF]">Apa yang diamati:</strong>{" "}
                                    {selectedExplorationArea.researchContext.potentialEntities.join(", ")}
                                  </p>
                                )}
                                {selectedExplorationArea.researchContext.potentialDocuments.length > 0 && (
                                  <p>
                                    <strong className="text-amber-400">Dokumen Terkait:</strong>{" "}
                                    {selectedExplorationArea.researchContext.potentialDocuments.join(", ")}
                                  </p>
                                )}
                                {selectedExplorationArea.researchContext.potentialDataArtifacts.length > 0 && (
                                  <p>
                                    <strong className="text-purple-400">Artefak Data:</strong>{" "}
                                    {selectedExplorationArea.researchContext.potentialDataArtifacts.join(", ")}
                                  </p>
                                )}
                                {selectedExplorationArea.researchContext.potentialGeographies.length > 0 && (
                                  <p>
                                    <strong className="text-[#AAB4D0]">Geografi:</strong>{" "}
                                    {selectedExplorationArea.researchContext.potentialGeographies.join(", ")}
                                  </p>
                                )}
                              </div>
                            ) : "candidateObjects" in selectedExplorationArea && selectedExplorationArea.candidateObjects && selectedExplorationArea.candidateObjects.length > 0 ? (
                              <p>
                                <strong className="text-[#FFF9EE]">Kandidat Objek:</strong>{" "}
                                {selectedExplorationArea.candidateObjects.join(", ")}
                              </p>
                            ) : null}

                            {/* V3 Scope Boundary */}
                            {"scopeBoundary" in selectedExplorationArea && selectedExplorationArea.scopeBoundary && (
                              <div className="text-[13px] space-y-1 bg-[#11182D] p-2 rounded border border-[#273352]">
                                <p>
                                  <strong className="text-[#70E1B6]">In-Scope:</strong>{" "}
                                  {selectedExplorationArea.scopeBoundary.inScope.join(", ")}
                                </p>
                                <p>
                                  <strong className="text-[#FF6F61]">Out-of-Scope:</strong>{" "}
                                  {selectedExplorationArea.scopeBoundary.outOfScope.join(", ")}
                                </p>
                              </div>
                            )}

                            {selectedExplorationArea.phenomenonSearchBrief && (
                              <p>
                                <strong className="text-[#FFF9EE]">Petunjuk Arah Fenomena:</strong>{" "}
                                {selectedExplorationArea.phenomenonSearchBrief}
                              </p>
                            )}
                            {selectedExplorationArea.phenomenonSearchDirections.length > 0 && (
                              <div>
                                <strong className="text-[#FFF9EE] block mb-1">Arah Pencarian Fenomena:</strong>
                                <ul className="list-disc list-inside space-y-1 text-[13px]">
                                  {selectedExplorationArea.phenomenonSearchDirections.map((dir: { label: string; searchQuestion: string }, idx: number) => (
                                    <li key={idx}>
                                      <span className="text-[#70E1B6]">{dir.label}:</span> {dir.searchQuestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {selectedExplorationArea.unresolvedItems.length > 0 && (
                              <p>
                                <strong className="text-[#F5A623]">Hal yang Belum Pasti:</strong>{" "}
                                {selectedExplorationArea.unresolvedItems.join("; ")}
                              </p>
                            )}
                          </div>
                        ) : null}

                        {t1Data.minat && <p><strong className="text-[#FFF9EE]">Minat awal:</strong> {t1Data.minat}</p>}
                        {t1Data.pendekatan && t1Data.pendekatan !== "unknown" && (
                          <p><strong className="text-[#FFF9EE]">Pendekatan disukai:</strong> {resolveOptionLabel("pendekatan", t1Data.pendekatan)}</p>
                        )}
                        {t1Data.preferensi_data && t1Data.preferensi_data !== "unknown" && (
                          <p><strong className="text-[#FFF9EE]">Data nyaman:</strong> {resolveOptionLabel("preferensi_data", t1Data.preferensi_data)}</p>
                        )}
                        {t1Data.akses_data && t1Data.akses_data !== "unknown" && (
                          <p><strong className="text-[#FFF9EE]">Akses data:</strong> {resolveOptionLabel("akses_data", t1Data.akses_data)}</p>
                        )}
                        {t1Data.akses_data_catatan && (
                          <p><strong className="text-[#FFF9EE]">Catatan akses:</strong> {t1Data.akses_data_catatan}</p>
                        )}
                        {t1Data.avoidances && (
                          <p><strong className="text-[#FFF9EE]">Hal dihindari:</strong> {t1Data.avoidances}</p>
                        )}
                        {t1Data.target_waktu && t1Data.target_waktu !== "unknown" && (
                          <p><strong className="text-[#FFF9EE]">Kondisi waktu:</strong> {resolveOptionLabel("target_waktu", t1Data.target_waktu)}</p>
                        )}
                        {t1Data.supervisor_direction && (
                          <p><strong className="text-[#FFF9EE]">Arahan dosen:</strong> {t1Data.supervisor_direction}</p>
                        )}

                        <div className="rounded border border-[#F5A623]/30 bg-[#F5A623]/10 p-2.5 text-[13px] text-[#FFF9EE] leading-relaxed">
                          <strong>Peringatan Akademik:</strong> Arah pencarian ini bukan fenomena yang sudah terbukti. Tool Cari Fenomena tetap harus mencari dan memeriksa sumber bukti nyata.
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleUseT1Data}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#2959FF] bg-[#2959FF]/20 px-2.5 py-1 text-xs font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/30 transition-colors"
                          >
                            <Sparkles className="h-3 w-3 text-[#70E1B6]" aria-hidden="true" />
                            Gunakan Data &amp; Paket Area dari Cari Ide
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {tool.fields.map((field) => {
                    const value = formValues[field.id] || "";
                    const fieldError = errors[field.id];
                    const errorId = `error-${field.id}`;
                    const helperId = `helper-${field.id}`;

                    return (
                      <div key={field.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor={field.id}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#FFF9EE]"
                          >
                            <span>{field.label}</span>
                            {field.required ? (
                              <span className="text-[#FF6F61] font-bold" title="Wajib diisi">
                                *
                              </span>
                            ) : (
                              <span className="text-[12px] font-normal text-[#AAB4D0]">
                                (Opsional)
                              </span>
                            )}
                          </label>

                          {field.maxLength && (
                            <span
                              className={`text-[12px] font-mono ${
                                Array.from(value).length > field.maxLength
                                  ? "text-[#FF6F61] font-bold"
                                  : Array.from(value).length >= field.maxLength * 0.8
                                  ? "text-amber-400 font-semibold"
                                  : "text-[#AAB4D0]/60"
                              }`}
                            >
                              {Array.from(value).length} / {field.maxLength}
                            </span>
                          )}
                        </div>

                        {field.type === "select" ? (
                          <select
                            id={field.id}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            aria-invalid={!!fieldError}
                            aria-describedby={fieldError ? errorId : field.helperText ? helperId : undefined}
                            className={`w-full rounded-lg border bg-[#080D1D] px-3.5 py-2 text-xs text-[#FFF9EE] focus-visible:outline-none focus-visible:ring-2 ${
                              fieldError
                                ? "border-[#FF6F61] focus-visible:ring-[#FF6F61]"
                                : "border-[#273352] focus-visible:ring-[#2959FF]"
                            }`}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea
                            id={field.id}
                            rows={3}
                            value={value}
                            maxLength={field.maxLength}
                            placeholder={field.placeholder}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            aria-invalid={!!fieldError}
                            aria-describedby={fieldError ? errorId : field.helperText ? helperId : undefined}
                            className={`w-full rounded-lg border bg-[#080D1D] p-3 text-xs leading-relaxed text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus-visible:outline-none focus-visible:ring-2 resize-y ${
                              fieldError
                                ? "border-[#FF6F61] focus-visible:ring-[#FF6F61]"
                                : "border-[#273352] focus-visible:ring-[#2959FF]"
                            }`}
                          />
                        ) : (
                          <input
                            id={field.id}
                            type="text"
                            value={value}
                            maxLength={field.maxLength}
                            placeholder={field.placeholder}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            aria-invalid={!!fieldError}
                            aria-describedby={fieldError ? errorId : field.helperText ? helperId : undefined}
                            className={`w-full rounded-lg border bg-[#080D1D] px-3.5 py-2 text-xs text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus-visible:outline-none focus-visible:ring-2 ${
                              fieldError
                                ? "border-[#FF6F61] focus-visible:ring-[#FF6F61]"
                                : "border-[#273352] focus-visible:ring-[#2959FF]"
                            }`}
                          />
                        )}

                        {/* 80% Character Limit Warning */}
                        {field.maxLength && Array.from(value).length >= field.maxLength * 0.8 && Array.from(value).length <= field.maxLength && (
                          <div className="flex items-center gap-1.5 text-[12px] text-amber-400/90 animate-in fade-in duration-150">
                            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>Batas ini disesuaikan dengan langkah berikutnya agar kamu tidak perlu menghapus atau meringkas ulang.</span>
                          </div>
                        )}

                        {fieldError && (
                          <p id={errorId} className="text-[13px] font-medium text-[#FF6F61]">
                            {fieldError}
                          </p>
                        )}

                        {field.helperText && !fieldError && (
                          <p id={helperId} className="text-[13px] leading-normal text-[#AAB4D0]">
                            {field.helperText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#273352]/70">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-transparent px-3 py-2 text-xs font-semibold text-[#AAB4D0] hover:border-[#FF6F61]/50 hover:text-[#FF6F61] transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6F61] focus-visible:outline-none"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset Form</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2959FF] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#2047D4] transition-all focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
                    <span>Generate Prompt</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel: Prompt Output */}
          <div ref={outputPanelRef} id="tool-output-panel" className="lg:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6">
              {generatedPrompt ? (
                <div className="flex h-full flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#273352] pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#70E1B6]">
                        Hasil Template Prompt
                      </span>
                      <div className="flex items-center gap-2 text-[13px] text-[#AAB4D0]">
                        <span>{Array.from(generatedPrompt).length} Karakter</span>
                        <span>•</span>
                        <span>{generatedPrompt.trim().split(/\s+/).length} Kata</span>
                      </div>
                    </div>

                    {/* Pratinjau selalu tampil: beberapa baris pertama prompt, tanpa membuka prompt teknis penuh */}
                    <div className="mt-3 rounded-lg border border-[#273352] bg-[#080D1D] p-3">
                      <pre className="font-mono text-xs leading-relaxed text-[#AAB4D0] whitespace-pre-wrap line-clamp-4 select-all">
                        {generatedPrompt}
                      </pre>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-3 border-t border-[#273352]">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMainPrompt}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#70E1B6] px-3.5 py-2 text-xs font-bold text-[#080D1D] hover:bg-[#5BC9A0] transition-colors focus-visible:ring-2 focus-visible:ring-[#70E1B6] focus-visible:outline-none cursor-pointer"
                      >
                        {copiedMain ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#080D1D]" aria-hidden="true" />
                            <span>Prompt Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#080D1D]" aria-hidden="true" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPlatform("ChatGPT")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#16213D] px-3 py-2 text-xs font-semibold text-[#FFF9EE] hover:border-[#2959FF] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
                        <span>Buka ChatGPT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPlatform("Gemini")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#16213D] px-3 py-2 text-xs font-semibold text-[#FFF9EE] hover:border-[#2959FF] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-[#2959FF]" aria-hidden="true" />
                        <span>Buka Gemini</span>
                      </button>
                    </div>

                    <p className="text-[13px] leading-relaxed text-[#AAB4D0]">
                      Prompt telah disalin. Tempelkan di platform ChatGPT atau Gemini dengan pencarian web aktif, lalu salin seluruh hasilnya ke <strong>Tahap 2</strong> di bawah.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center p-6 text-[#AAB4D0]">
                  <FileText className="h-10 w-10 text-[#273352] mb-3" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[#FFF9EE]">Prompt Belum Dibuat</h3>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed">
                    Isi field wajib di panel kiri (Program Studi dan Area Eksplorasi), lalu klik tombol <strong>Generate Prompt</strong>.
                  </p>
                  <PromptExample variant="single" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 2 — TEMPEL HASIL DARI CHATGPT ATAU GEMINI */}
      {/* ========================================================================= */}
      <section aria-labelledby="tahap-2-heading" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#273352] pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2959FF] text-xs font-bold text-white">
            2
          </span>
          <h2 id="tahap-2-heading" className="text-lg font-bold text-[#FFF9EE]">
            Tahap 2: Tempel Hasil dari ChatGPT atau Gemini
          </h2>
        </div>

        <div className="rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#273352] pb-2">
            <p className="text-xs leading-relaxed text-[#AAB4D0]">
              Setelah AI selesai mencari kandidat fenomena, salin seluruh hasilnya lalu tempel di sini. SKRIFLOW akan membaca blok transfer dan menampilkan kandidat yang ditemukan.
            </p>
            {parseResult && parseResult.success && (
              <button
                type="button"
                onClick={() => setShowRawResult(!showRawResult)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#70E1B6] hover:underline cursor-pointer"
              >
                <span>{showRawResult ? "Sembunyikan Hasil Mentah" : "Lihat Hasil Mentah"}</span>
                {showRawResult ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {(!parseResult || !parseResult.success || showRawResult) && (
              <textarea
                id="fenomena-paste-area"
                rows={6}
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Tempel seluruh output ChatGPT / Gemini yang memuat blok === BEGIN SKRIFLOW_FENOMENA_V1 === sampai === END SKRIFLOW_FENOMENA_V1 === di sini..."
                className="w-full rounded-lg border border-[#273352] bg-[#080D1D] p-3 text-xs font-mono text-[#FFF9EE] placeholder-[#AAB4D0]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2959FF] animate-fade-in"
              />
            )}

            {/* Parsing status feedback */}
            {parseResult && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#FFF9EE]">Status Struktur:</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[13px] font-bold ${
                        parseResult.structuralStatus === "Struktur lengkap" ||
                        parseResult.structuralStatus === "Valid dengan perbaikan format"
                          ? "bg-[#70E1B6]/15 text-[#70E1B6] border border-[#70E1B6]/30"
                          : parseResult.structuralStatus === "Struktur perlu diperiksa"
                          ? "bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30"
                          : "bg-[#FF6F61]/15 text-[#FF6F61] border border-[#FF6F61]/30"
                      }`}
                    >
                      {parseResult.structuralStatus}
                    </span>
                  </div>

                  {parseResult.warnings.length > 0 && !parseResult.urlCorrections && (
                    <span className="text-[13px] text-[#F5A623]">
                      {parseResult.warnings.join("; ")}
                    </span>
                  )}
                </div>

                {/* Temuan audit konten: red line akademik (klaim kausal, ketiadaan
                    bukti, identitas sumber). Dihitung parser, bukan diklaim AI. */}
                {(() => {
                  const findings = parseResult.contentFindings ?? [];
                  if (findings.length === 0) return null;
                  const errors = findings.filter((x) => x.severity === "ERROR");
                  const warnings = findings.filter((x) => x.severity !== "ERROR");
                  const tampil = [...errors, ...warnings].slice(0, 8);
                  return (
                    <div
                      className={`rounded-lg border p-3.5 text-xs space-y-2 animate-fade-in ${
                        errors.length > 0
                          ? "border-[#FF6F61]/40 bg-[#FF6F61]/10 text-[#FFF9EE]"
                          : "border-[#F5A623]/40 bg-[#F5A623]/10 text-[#FFF9EE]"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          Pemeriksaan Akademik: {findings.length} temuan
                          {errors.length > 0 ? ` (${errors.length} perlu diperbaiki)` : ""}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {tampil.map((x, i) => (
                          <li key={i} className="leading-relaxed">
                            <span
                              className={`mr-1.5 rounded px-1 py-0.5 text-[10px] font-bold ${
                                x.severity === "ERROR"
                                  ? "bg-[#FF6F61]/25 text-[#FF6F61]"
                                  : "bg-[#F5A623]/25 text-[#F5A623]"
                              }`}
                            >
                              {x.severity === "ERROR" ? "PERLU DIPERBAIKI" : "CATATAN"}
                            </span>
                            {x.message}
                          </li>
                        ))}
                      </ul>
                      {findings.length > tampil.length && (
                        <p className="text-[11px] text-[#AAB4D0]">
                          +{findings.length - tampil.length} temuan lain pada bukti/sumber.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Non-blocking URL Normalization notification */}
                {parseResult.urlCorrections && parseResult.urlCorrections.length > 0 && (
                  <div className="rounded-lg border border-[#70E1B6]/30 bg-[#70E1B6]/10 p-3.5 text-xs text-[#FFF9EE] space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-[#70E1B6] font-bold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>FORMAT URL DIPERBAIKI OTOMATIS</span>
                    </div>
                    <p className="text-xs text-[#AAB4D0] leading-relaxed">
                      Beberapa URL ditulis AI dalam format Markdown dan telah diubah menjadi URL mentah. Isi sumber tidak diubah.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[13px] text-[#FFF9EE]/90 pt-1">
                      {parseResult.urlCorrections.map((corr, idx) => (
                        <li key={idx}>
                          <span className="font-semibold text-[#70E1B6]">
                            {corr.candidateId} — Bukti {corr.evidenceIndex}:
                          </span>{" "}
                          <span>Markdown link → URL mentah</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {parseResult && !parseResult.success && parseResult.error && (
              <div className="rounded-lg border border-[#FF6F61]/40 bg-[#FF6F61]/10 p-3.5 text-xs text-[#FF6F61] space-y-2.5">
                <p className="font-semibold leading-relaxed whitespace-pre-line">{parseResult.error}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {parseResult.error.toLowerCase().includes("url") && (
                    <button
                      type="button"
                      onClick={handleCopyFixUrlPrompt}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#FF6F61] bg-[#FF6F61]/25 px-3 py-1.5 text-xs font-semibold text-[#FFF9EE] hover:bg-[#FF6F61]/35 transition-colors cursor-pointer"
                    >
                      {copiedFixUrlPrompt ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
                          <span>Prompt Perbaikan URL Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#FFF9EE]" aria-hidden="true" />
                          <span>Salin Prompt Perbaikan URL</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyFixPrompt}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#273352] bg-[#11182D] px-2.5 py-1.5 text-xs font-semibold text-[#AAB4D0] hover:text-[#FFF9EE] hover:bg-[#16213D] transition-colors cursor-pointer"
                  >
                    {copiedFixPrompt ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
                        <span>Prompt Format Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#AAB4D0]" aria-hidden="true" />
                        <span>Salin Prompt Perbaikan Format</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetPaste}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#AAB4D0] hover:text-[#FF6F61] hover:border-[#FF6F61]/40 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Hasil</span>
            </button>

            <button
              type="button"
              onClick={handleReadPaste}
              disabled={!pasteText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2959FF] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#2047D4] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
              <span>Baca Hasil</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BANNER STATUS FENOMENA SUDAH TERSIMPAN (KONDISI KEMBALI / RELOAD) */}
      {/* ========================================================================= */}
      {storedSelectedPhenomenon && (!parseResult || !parseResult.success || !parseResult.payload) && (
        <div className="rounded-xl border border-[#70E1B6]/40 bg-[#70E1B6]/10 p-5 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#70E1B6]/30 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#70E1B6]" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[#FFF9EE]">
                Fenomena Sudah Tersimpan
              </h3>
            </div>
            {getStatusBadge(storedSelectedPhenomenon.status)}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#2959FF]/20 border border-[#2959FF]/40 px-2 py-0.5 text-xs font-bold text-[#70E1B6]">
                {storedSelectedPhenomenon.candidateId}
              </span>
              <strong className="text-sm text-[#FFF9EE]">{storedSelectedPhenomenon.name}</strong>
            </div>
            <p className="rounded-lg bg-[#080D1D] p-3 text-[#FFF9EE] leading-relaxed">
              {storedSelectedPhenomenon.phenomenonSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/tools/cari-literatur-awal"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2959FF] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#1E46D9] transition-all focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              <span>Lanjut ke Cari Literatur</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("fenomena-paste-area");
                if (el) {
                  el.focus();
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#11182D] px-4 py-2.5 text-xs font-semibold text-[#AAB4D0] hover:text-[#FFF9EE] hover:border-[#2959FF]/50 transition-colors cursor-pointer"
            >
              <span>Ganti Fenomena</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 3 — PILIH DAN SIMPAN FENOMENA */}
      {/* ========================================================================= */}
      {parseResult && parseResult.success && parseResult.payload && (
        <section aria-labelledby="tahap-3-heading" className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-[#273352] pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2959FF] text-xs font-bold text-white">
              3
            </span>
            <h2 id="tahap-3-heading" className="text-lg font-bold text-[#FFF9EE]">
              Tahap 3: Pilih dan Simpan Fenomena
            </h2>
          </div>

          {/* Insufficient Evidence Notice */}
          {parseResult.payload.insufficient_evidence ? (
            <div className="rounded-xl border border-[#F5A623]/40 bg-[#F5A623]/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F5A623]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                <span>Bukti Empiris Belum Cukup Ditemukan</span>
              </div>
              <p className="text-xs leading-relaxed text-[#FFF9EE]">
                AI tidak menemukan minimal satu kandidat fenomena yang didukung bukti kuat dalam cakupan dan rentang yang diminta.
              </p>
              {parseResult.payload.search_notes && parseResult.payload.search_notes.length > 0 && (
                <div className="rounded-lg bg-[#080D1D]/80 p-3 text-xs text-[#AAB4D0] space-y-1">
                  <span className="font-semibold text-[#FFF9EE]">Catatan Pencarian:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parseResult.payload.search_notes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-[#AAB4D0]">
                Saran: Coba sesuaikan cakupan fenomena atau rentang waktu di Tahap 1, lalu generate prompt kembali.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Candidates Comparison Overview Table */}
              <div className="rounded-xl border border-[#273352] bg-[#11182D] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#273352] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#70E1B6]">
                    Perbandingan Kandidat Fenomena
                  </h3>
                  <span className="text-[13px] text-[#AAB4D0]">
                    {parseResult.payload.candidates.length} Kandidat Ditemukan
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#273352] text-[#AAB4D0]">
                        <th className="py-2 pr-3 font-semibold">ID & Nama</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">Bukti & Sumber</th>
                        <th className="py-2 px-3 font-semibold">Relevansi</th>
                        <th className="py-2 px-3 font-semibold">Keterlacakan</th>
                        <th className="py-2 px-3 font-semibold">Independensi</th>
                        <th className="py-2 pl-3 font-semibold">Pilih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#273352]/50">
                      {parseResult.payload.candidates.map((cand) => {
                        const uniqueCount = getUniqueSourceCount(cand.evidence);
                        const candEffectiveStatus = cand.effective_status || cand.status;
                        return (
                          <tr key={cand.id} className="hover:bg-[#16213D]/40 transition-colors">
                            <td className="py-2.5 pr-3 font-medium text-[#FFF9EE]">
                              <span className="text-[#70E1B6] font-bold mr-1.5">{cand.id}</span>
                              {cand.name}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getStatusBadge(candEffectiveStatus)}
                            </td>
                            <td className="py-2.5 px-3 text-[#AAB4D0] whitespace-nowrap">
                              {cand.evidence.length} bukti • {uniqueCount} sumber unik
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getQualityBadge(cand.quality.relevance)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getQualityBadge(cand.quality.traceability)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getQualityBadge(cand.quality.source_independence)}
                            </td>
                            <td className="py-2.5 pl-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateId(cand.id)}
                                disabled={candEffectiveStatus === "JANGAN_DIGUNAKAN"}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                  selectedCandidateId === cand.id
                                    ? "bg-[#70E1B6] text-[#080D1D]"
                                    : candEffectiveStatus === "JANGAN_DIGUNAKAN"
                                    ? "bg-[#273352]/40 text-[#AAB4D0]/40 cursor-not-allowed"
                                    : "border border-[#2959FF] bg-[#2959FF]/10 text-[#FFF9EE] hover:bg-[#2959FF]/20"
                                }`}
                              >
                                {selectedCandidateId === cand.id ? "Terpilih" : "Pilih"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Candidate Cards Grid */}
              <div className="space-y-6">
                {parseResult.payload.candidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  const isEvidenceOpen = openEvidenceCandidateIds[cand.id] ?? true;
                  const uniqueCount = getUniqueSourceCount(cand.evidence);
                  const candEffectiveStatus = cand.effective_status || cand.status;

                  return (
                    <div
                      key={cand.id}
                      className={`rounded-xl border transition-all ${
                        isSelected
                          ? "border-[#70E1B6] bg-[#11182D] ring-2 ring-[#70E1B6]/30"
                          : "border-[#273352] bg-[#11182D]"
                      } p-5 sm:p-6 space-y-4`}
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#273352] pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-[#2959FF]/20 border border-[#2959FF]/40 px-2 py-0.5 text-xs font-bold text-[#70E1B6]">
                            {cand.id}
                          </span>
                          <h3 className="text-base font-bold text-[#FFF9EE]">{cand.name}</h3>
                          <span className="rounded bg-[#273352] px-2 py-0.5 text-[12px] font-semibold text-[#AAB4D0]">
                            {getStudentLabel(cand.phenomenon_type)}
                          </span>
                          <span className="rounded border border-[#273352] bg-[#080D1D] px-2 py-0.5 text-[12px] font-medium text-[#70E1B6]">
                            {cand.evidence.length} bukti • {uniqueCount} sumber unik
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(candEffectiveStatus)}

                          <button
                            type="button"
                            onClick={() => setSelectedCandidateId(cand.id)}
                            disabled={candEffectiveStatus === "JANGAN_DIGUNAKAN"}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-[#70E1B6] text-[#080D1D]"
                                : candEffectiveStatus === "JANGAN_DIGUNAKAN"
                                ? "bg-[#273352]/30 text-[#AAB4D0]/40 cursor-not-allowed"
                                : "border border-[#2959FF] bg-[#2959FF]/15 text-[#FFF9EE] hover:bg-[#2959FF]/30"
                            }`}
                          >
                            {isSelected ? "✓ Kandidat Terpilih" : "Pilih Fenomena Ini"}
                          </button>
                        </div>
                      </div>

                      {/* Status Override Explanation if applicable */}
                      {cand.status_override_reason && cand.status !== candEffectiveStatus && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-300">
                          <strong>Catatan Penyesuaian Status:</strong> {cand.status_override_reason}
                        </div>
                      )}

                      {/* Summary & Observed Condition */}
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-semibold text-[#70E1B6] block mb-1">
                            Fenomena Ringkas (Summary):
                          </span>
                          <p className="rounded-lg bg-[#080D1D] p-3 text-[#FFF9EE] leading-relaxed">
                            {cand.phenomenon_summary}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-[#273352]/70 bg-[#080D1D]/50 p-3 text-[13px]">
                          <div>
                            <span className="text-[#AAB4D0] block mb-0.5">Objek / Populasi:</span>
                            {(() => {
                              const raw = cand.scope.object_or_population || "";
                              if (raw.includes("Entitas atau konteks yang mungkin diamati:")) {
                                const [act, ent] = raw.split("Entitas atau konteks yang mungkin diamati:");
                                return (
                                  <div className="space-y-0.5">
                                    {act.trim() && <p><span className="text-[#AAB4D0]">Siapa yang berkaitan:</span> <strong className="text-[#FFF9EE]">{act.trim()}</strong></p>}
                                    {ent?.trim() && <p><span className="text-[#AAB4D0]">Apa yang diamati:</span> <strong className="text-[#FFF9EE]">{ent.trim()}</strong></p>}
                                  </div>
                                );
                              }
                              if (raw.includes("Siapa yang berkaitan:") && raw.includes("Apa yang diamati:")) {
                                const m = raw.match(/Siapa yang berkaitan:\s*(.*?)\.?\s*Apa yang diamati:\s*(.*)/i);
                                if (m) {
                                  return (
                                    <div className="space-y-0.5">
                                      <p><span className="text-[#AAB4D0]">Siapa yang berkaitan:</span> <strong className="text-[#FFF9EE]">{m[1].trim()}</strong></p>
                                      <p><span className="text-[#AAB4D0]">Apa yang diamati:</span> <strong className="text-[#FFF9EE]">{m[2].trim()}</strong></p>
                                    </div>
                                  );
                                }
                              }
                              return <strong className="text-[#FFF9EE]">{raw}</strong>;
                            })()}
                          </div>
                          <div>
                            <span className="text-[#AAB4D0] block">Lokasi / Cakupan:</span>
                            <strong className="text-[#FFF9EE]">{cand.scope.geography}</strong>
                          </div>
                          <div>
                            <span className="text-[#AAB4D0] block">Periode Data:</span>
                            <strong className="text-[#FFF9EE]">{cand.scope.reference_period}</strong>
                          </div>
                        </div>

                        {cand.relation_to_area && (
                          <div>
                            <span className="text-[#AAB4D0] font-semibold block mb-0.5">
                              Hubungan dengan Area Eksplorasi:
                            </span>
                            <p className="text-[#FFF9EE] leading-relaxed">{cand.relation_to_area}</p>
                          </div>
                        )}
                      </div>

                      {/* Evidence List Accordion */}
                      <div className="rounded-lg border border-[#273352] bg-[#080D1D]/70 overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenEvidenceCandidateIds((prev) => ({
                              ...prev,
                              [cand.id]: !isEvidenceOpen,
                            }))
                          }
                          aria-expanded={isEvidenceOpen}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-[#FFF9EE] hover:bg-[#16213D] transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
                            Paket Bukti Empiris ({cand.evidence.length} Bukti • {uniqueCount} Sumber Unik)
                          </span>
                          {isEvidenceOpen ? (
                            <ChevronUp className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
                          )}
                        </button>

                        {/* Tombol periksa di luar tombol accordion (nested button = HTML invalid) */}
                        <div className="flex justify-end px-4 py-2 border-t border-[#273352]/60">
                          <TombolPeriksaSumber
                            jumlah={cand.evidence.length}
                            sedangProses={sedangVerifikasi}
                            onClick={() =>
                              periksaSumber(
                                cand.evidence.map((ev, i) => ({
                                  sourceId: `${cand.id}-bukti-${i + 1}`,
                                  title: ev.source_title,
                                  url: ev.url,
                                  documentType: ev.source_type,
                                }))
                              )
                            }
                          />
                        </div>

                        {isEvidenceOpen && (
                          <div className="p-4 border-t border-[#273352] space-y-4">
                            <RingkasanVerifikasi hasil={verifikasiSumber} catatan={verifikasiCatatan} />
                            {cand.evidence.map((ev, idx) => {
                              const canonicalKey = getCanonicalSourceKey(ev);
                              const isSharedSource = cand.evidence.filter((other) => getCanonicalSourceKey(other) === canonicalKey).length > 1;
                              const confirmKey = `${cand.id}_${canonicalKey}`;
                              const isConfirmed = !!confirmedSources[confirmKey];

                              return (
                                <div
                                  key={idx}
                                  className="rounded-lg border border-[#273352] bg-[#11182D] p-3.5 space-y-2.5 text-xs"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#273352]/60 pb-2">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[12px] font-bold uppercase tracking-wider text-[#70E1B6]">
                                          Bukti #{idx + 1} • {getStudentLabel(ev.source_type)}
                                        </span>
                                        {isSharedSource && (
                                          <span className="inline-flex items-center gap-1 rounded bg-[#2959FF]/20 border border-[#2959FF]/40 px-2 py-0.5 text-[12px] font-semibold text-[#70E1B6]">
                                            Sumber yang sama
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-xs font-bold text-[#FFF9EE] mt-0.5 flex flex-wrap items-center gap-1.5">
                                        <span>{ev.source_title}</span>
                                        <LencanaVerifikasi hasil={verifikasiSumber[`${cand.id}-bukti-${idx + 1}`]} />
                                      </h4>
                                      <span className="text-[13px] text-[#AAB4D0] block">
                                        {ev.publisher_or_institution} ({ev.publication_date || "Tanggal tidak tercantum"})
                                      </span>
                                    </div>

                                    {ev.url && safeHref(ev.url) && (
                                      <a
                                        href={safeHref(ev.url) as string}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md border border-[#2959FF] bg-[#2959FF]/10 px-2.5 py-1 text-[13px] font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
                                      >
                                        <span>Buka Sumber</span>
                                        <ExternalLink className="h-3 w-3 text-[#70E1B6]" aria-hidden="true" />
                                      </a>
                                    )}
                                  </div>

                                  <div className="space-y-1.5 text-[13px] leading-relaxed text-[#AAB4D0]">
                                    <p><strong className="text-[#FFF9EE]">Klaim Bukti:</strong> {ev.claim}</p>
                                    {ev.observed_data_or_event && (
                                      <p><strong className="text-[#FFF9EE]">Data/Peristiwa:</strong> {ev.observed_data_or_event}</p>
                                    )}
                                    {ev.evidence_location && (
                                      <p><strong className="text-[#FFF9EE]">Lokasi Bukti:</strong> {ev.evidence_location}</p>
                                    )}
                                    {ev.access_note && (
                                      <p><strong className="text-[#FFF9EE]">Catatan Akses:</strong> {ev.access_note}</p>
                                    )}
                                    {ev.method_or_metadata && (
                                      <p><strong className="text-[#FFF9EE]">Metode/Metadata:</strong> {ev.method_or_metadata}</p>
                                    )}
                                    {ev.limitations && (
                                      <p><strong className="text-[#FFF9EE]">Keterbatasan:</strong> {ev.limitations}</p>
                                    )}
                                  </div>

                                  {/* Source confirmation checkbox based on canonical source */}
                                  <div className="pt-2 border-t border-[#273352]/50 flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`confirm-${cand.id}-${idx}`}
                                      checked={isConfirmed}
                                      onChange={() => handleToggleSourceConfirm(cand.id, canonicalKey)}
                                      disabled={candEffectiveStatus === "JANGAN_DIGUNAKAN"}
                                      className="h-4 w-4 rounded border-[#273352] bg-[#080D1D] text-[#70E1B6] focus:ring-[#70E1B6] disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                    <label
                                      htmlFor={`confirm-${cand.id}-${idx}`}
                                      className="text-xs font-medium text-[#FFF9EE] cursor-pointer"
                                    >
                                      Saya sudah membuka dan mencocokkan sumber ini.
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Triangulation & What is not proven */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-[#AAB4D0]">
                        {cand.triangulation_note && (
                          <div className="rounded-lg bg-[#080D1D] p-3">
                            <span className="font-semibold text-[#FFF9EE] block mb-1">Catatan Triangulasi:</span>
                            <p>{cand.triangulation_note}</p>
                          </div>
                        )}
                        {cand.what_is_not_proven && (
                          <div className="rounded-lg bg-[#080D1D] p-3">
                            <span className="font-semibold text-[#FF6F61] block mb-1">Hal yang Belum Terbukti:</span>
                            <p>{cand.what_is_not_proven}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Candidate Warning & Confirmation Gate Box */}
              {selectedCandidate && (
                <div className="rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#273352] pb-3">
                    <h3 className="text-sm font-bold text-[#FFF9EE]">
                      Konfirmasi Kandidat Terpilih: <span className="text-[#70E1B6]">{selectedCandidate.id} — {selectedCandidate.name}</span>
                    </h3>
                    {getStatusBadge(selectedCandidate.effective_status || selectedCandidate.status)}
                  </div>

                  {/* Progress of unique source confirmation */}
                  <div className="rounded-lg bg-[#080D1D] p-3 text-xs flex items-center justify-between border border-[#273352]/70">
                    <span className="text-[#AAB4D0]">Pemeriksaan Sumber Mandiri:</span>
                    <span className="font-bold text-[#70E1B6]">
                      {confirmationGateStatus.confirmedUniqueCount} dari {confirmationGateStatus.requiredUniqueCount} sumber unik sudah diperiksa
                    </span>
                  </div>

                  {/* Fatal warning for JANGAN_DIGUNAKAN */}
                  {(selectedCandidate.effective_status || selectedCandidate.status) === "JANGAN_DIGUNAKAN" && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-[#FFF9EE]">
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <p>
                        <strong>Kandidat Tidak Dapat Digunakan:</strong> {selectedCandidate.status_override_reason || "Kandidat ini memiliki kendala fatal sehingga tidak aman dilanjutkan."}
                      </p>
                    </div>
                  )}

                  {/* Single unique source warning */}
                  {confirmationGateStatus.uniqueSourceCount === 1 && (selectedCandidate.effective_status || selectedCandidate.status) !== "JANGAN_DIGUNAKAN" && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-[#F5A623]/40 bg-[#F5A623]/10 p-3 text-xs text-[#FFF9EE]">
                      <AlertTriangle className="h-4 w-4 text-[#F5A623] shrink-0 mt-0.5" aria-hidden="true" />
                      <p>
                        <strong>Peringatan Sumber Tunggal:</strong> Fenomena ini hanya didukung oleh 1 sumber unik. Kamu wajib memeriksa sumber ini secara teliti dan mencari bukti pendukung tambahan. Status tidak dinaikkan menjadi SIAP_DIBAWA secara otomatis.
                      </p>
                    </div>
                  )}

                  {/* Persistent warning for PERLU_DIPERIKSA */}
                  {(selectedCandidate.effective_status || selectedCandidate.status) === "PERLU_DIPERIKSA" && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-[#F5A623]/40 bg-[#F5A623]/10 p-3 text-xs text-[#FFF9EE]">
                      <ShieldAlert className="h-4 w-4 text-[#F5A623] shrink-0 mt-0.5" aria-hidden="true" />
                      <p>
                        <strong>Perhatian:</strong> Fenomena ini masih memiliki bukti yang perlu diperiksa. Kamu boleh melanjutkan, tetapi status ini akan dibawa ke langkah berikutnya.
                      </p>
                    </div>
                  )}

                  {/* Confirmation Gates */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="final-understanding-checkbox"
                        checked={understoodTemporary}
                        onChange={(e) => setUnderstoodTemporary(e.target.checked)}
                        className="h-4 w-4 rounded border-[#273352] bg-[#080D1D] text-[#70E1B6] focus:ring-[#70E1B6] mt-0.5"
                      />
                      <label
                        htmlFor="final-understanding-checkbox"
                        className="text-xs font-semibold text-[#FFF9EE] leading-normal cursor-pointer"
                      >
                        Saya memahami bagian ini masih perlu diperiksa dan belum merupakan keputusan penelitian final.
                      </label>
                    </div>

                    {!confirmationGateStatus.canSave && (
                      <p className="text-[13px] text-[#F5A623]">
                        {confirmationGateStatus.reason}
                      </p>
                    )}
                  </div>

                  {/* Save and Hand-off Button */}
                  <div className="pt-3 border-t border-[#273352] flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAndProceed}
                      disabled={!confirmationGateStatus.canSave}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#70E1B6] px-5 py-2.5 text-xs font-bold text-[#080D1D] shadow-lg hover:bg-[#5BC9A0] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Simpan Fenomena & Lanjut ke Cari Literatur</span>
                      <ArrowRight className="h-4 w-4 text-[#080D1D]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Sequential Navigation at Bottom */}
      <SequentialNavigation
        previousStep={tool.previousStep}
        nextStep={tool.nextStep}
        isNextEnabled={hasSavedValidPhenomenon}
        nextStatusLabel="Fenomena Siap Dibawa"
        nextDisabledReason="Pilih, periksa, dan simpan satu fenomena sebelum melanjutkan."
        nextHelperText={
          hasSavedValidPhenomenon
            ? "Fenomena telah disimpan dan siap dibawa ke Cari Literatur Awal."
            : "Pilih, periksa, dan simpan satu fenomena sebelum melanjutkan ke langkah berikutnya."
        }
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        toolName={tool.name}
        onConfirm={handleResetForm}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Clipboard Fallback Modal */}
      {fallbackModalState && (
        <ClipboardFallbackModal
          isOpen={true}
          prompt={fallbackModalState.prompt}
          targetUrl={fallbackModalState.targetUrl}
          platformName={fallbackModalState.platformName}
          onSuccess={(msg: string) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 3000);
          }}
          onClose={() => setFallbackModalState(null)}
        />
      )}
    </div>
  );
};
