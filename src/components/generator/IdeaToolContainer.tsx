"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Tool,
  SelectedExplorationAreaV3,
  IdeaToPhenomenonHandoff,
  DataOrigin,
  DataAccessStatus,
  RejectionReason,
  RejectedAreaRound,
  AreaRecommendationResult,
  IdeaExplorationSession,
} from "@/types/tool";
import { validateForm } from "@/lib/validation";
import { assemblePrompt, assembleTool1AlternativePrompt } from "@/lib/promptAssembler";
import {
  subscribeToToolData,
  getToolDataSnapshot,
  saveToolData,
  saveIdeaPasteDraft,
  loadIdeaPasteDraft,
  saveIdeaResult,
  loadIdeaResult,
  clearIdeaResult,
  saveSelectedExplorationArea,
  loadSelectedExplorationArea,
  clearSelectedExplorationArea,
  saveIdeaToPhenomenonHandoff,
  clearIdeaToPhenomenonHandoff,
  saveSharedResearchContext,
  loadSharedResearchContext,
  saveIdeaRejectionRounds,
  loadIdeaRejectionRounds,
  clearIdeaRejectionRounds,
  saveLastRecommendation,
  loadLastRecommendation,
  clearLastRecommendation,
  saveIdeaExplorationSession,
  loadIdeaExplorationSession,
} from "@/lib/storage";
import {
  parseIdeaTransfer,
  generateFixIdeaFormatPrompt,
  computeIdeaInputFingerprint,
  computePayloadFingerprint,
  ParseIdeaResult,
  countChars,
  IDEA_RESULT_SOFT_LIMIT,
  IDEA_RESULT_HARD_LIMIT,
} from "@/lib/ideaParser";
import { copyToClipboard, copyPromptAndOpenPlatform, PLATFORM_URLS } from "@/lib/clipboard";
import { calculateAreaRecommendation } from "@/lib/recommender";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { ChangeIssueModal } from "./ChangeIssueModal";
import { ClipboardFallbackModal } from "./ClipboardFallbackModal";
import { RejectionModal } from "./RejectionModal";
import { AlternativePromptModal } from "./AlternativePromptModal";
import { TombolTempelClipboard } from "./TombolTempelClipboard";
import { RecommendationPanel } from "./RecommendationPanel";
import { PromptExample } from "./PromptExample";
import { SequentialNavigation } from "./SequentialNavigation";
import {
  getStudentLabel,
  getStudentStatus,
  getDataOriginInfo,
  getDataAccessStatusInfo,
} from "@/lib/studentLanguage";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sliders,
  Compass,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  FileText,
  Layers,
  BookOpen,
  Info,
  Database,
  Users,
  Building,
  FileCheck,
  BarChart2,
  MapPin,
  Target,
  Search,
  ShieldX,
  History,
  RefreshCw,
  Undo2,
} from "lucide-react";

interface IdeaToolContainerProps {
  tool: Tool;
}

export const IdeaToolContainer: React.FC<IdeaToolContainerProps> = ({ tool }) => {
  const router = useRouter();

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

  // Current Input Fingerprint (computed live from formValues)
  const currentFingerprint = useMemo(() => {
    return computeIdeaInputFingerprint(formValues);
  }, [formValues]);

  // Exploration Session State
  const [session, setSession] = useState<IdeaExplorationSession>(() => {
    if (typeof window !== "undefined") {
      const existing = loadIdeaExplorationSession();
      if (existing) return existing;
    }
    const initFp = computeIdeaInputFingerprint(formValues);
    const newSess: IdeaExplorationSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      contextFingerprint: initFp,
      roundCount: 0,
      maxRounds: 3,
      resultSetIds: [],
      rejectedAreaIds: [],
      rejectionReasons: [],
      contextSnapshot: { ...formValues },
    };
    if (typeof window !== "undefined") {
      saveIdeaExplorationSession(newSess);
    }
    return newSess;
  });

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  // Auto-scroll ke panel prompt pas prompt berhasil digenerate (revisi #1 user)
  useEffect(() => {
    if (!generatedPrompt) return;
    const el = document.getElementById("prompt-preview-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [generatedPrompt]);

  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedFixPrompt, setCopiedFixPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fallbackModalState, setFallbackModalState] = useState<{
    prompt: string;
    targetUrl: string;
    platformName: string;
  } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showFullResetModal, setShowFullResetModal] = useState(false);
  const [showChangeIssueModal, setShowChangeIssueModal] = useState(false);
  const [showResetPasteModal, setShowResetPasteModal] = useState(false);
  const [expandedAreaDetails, setExpandedAreaDetails] = useState<Record<string, boolean>>({});
  const [expandedSubSections, setExpandedSubSections] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({});

  // Refs for scrolling and focus
  const recommendationPanelRef = useRef<HTMLDivElement | null>(null);
  const recommendationHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const areaCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const outputPanelRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to output panel on mobile (< 1024px) after prompt generation
  useEffect(() => {
    if (generatedPrompt && window.innerWidth < 1024) {
      outputPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generatedPrompt]);

  // Rejection & Alternative Prompt States
  const [rejectionRounds, setRejectionRounds] = useState<RejectedAreaRound[]>(() => {
    return typeof window !== "undefined" ? loadIdeaRejectionRounds() : [];
  });
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showAltPromptModal, setShowAltPromptModal] = useState(false);
  const [pendingAltPrompt, setPendingAltPrompt] = useState<string | null>(null);
  const [showAlternativeLoadedBanner, setShowAlternativeLoadedBanner] = useState(false);
  const [showRoundsHistory, setShowRoundsHistory] = useState(false);
  const [showRawResult, setShowRawResult] = useState(false);

  // Paste & Parsing States with lazy initializers
  const [pasteText, setPasteText] = useState<string>(() => {
    return typeof window !== "undefined" ? loadIdeaPasteDraft() : "";
  });

  const [parseResult, setParseResult] = useState<ParseIdeaResult | null>(() => {
    if (typeof window !== "undefined") {
      const savedResult = loadIdeaResult();
      if (savedResult && savedResult.schemaVersion === 3) {
        if (!savedResult.payloadFingerprint) {
          savedResult.payloadFingerprint = computePayloadFingerprint(savedResult);
        }
        return {
          success: true,
          status: "HASIL_VALID",
          errorDetails: [],
          warnings: [],
          data: savedResult,
        };
      }
      const savedDraft = loadIdeaPasteDraft();
      if (savedDraft) {
        const parsed = parseIdeaTransfer(savedDraft);
        if (parsed.success) return parsed;
      }
    }
    return null;
  });

  // Active Result Set Payload Fingerprint
  const activePayloadFingerprint = useMemo(() => {
    if (!parseResult?.data) return "";
    return parseResult.data.payloadFingerprint || computePayloadFingerprint(parseResult.data);
  }, [parseResult]);

  // Recommendation Panel States (hydrated with session & fingerprint validation)
  const [recommendationResult, setRecommendationResult] = useState<AreaRecommendationResult | null>(() => {
    if (typeof window !== "undefined") {
      const savedResult = loadIdeaResult();
      const fp = savedResult && savedResult.schemaVersion === 3 ? (savedResult.payloadFingerprint || computePayloadFingerprint(savedResult)) : undefined;
      return loadLastRecommendation(fp, undefined, session.sessionId);
    }
    return null;
  });
  const [showRecommendationPanel, setShowRecommendationPanel] = useState(false);

  // Validate recommendation is strictly bound to active payload fingerprint and session
  const isRecommendationValid = useMemo(() => {
    if (!recommendationResult || !activePayloadFingerprint) return false;
    if (recommendationResult.sessionId && recommendationResult.sessionId !== session.sessionId) {
      return false;
    }
    return recommendationResult.payloadFingerprint === activePayloadFingerprint;
  }, [recommendationResult, activePayloadFingerprint, session.sessionId]);

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const savedResult = loadIdeaResult();
      const fp = savedResult && savedResult.schemaVersion === 3 ? (savedResult.payloadFingerprint || computePayloadFingerprint(savedResult)) : undefined;
      const existingSelected = loadSelectedExplorationArea(fp, session.sessionId);
      if (existingSelected && existingSelected.schemaVersion === 3) return existingSelected.areaId;
    }
    return null;
  });

  // Material Context Divergence Detection
  const hasExistingWorkOrResults = useMemo(() => {
    return !!parseResult?.data || session.roundCount > 0 || rejectionRounds.length > 0;
  }, [parseResult, session.roundCount, rejectionRounds.length]);

  const isContextDiverged = useMemo(() => {
    if (!hasExistingWorkOrResults) return false;
    return session.contextFingerprint !== currentFingerprint;
  }, [hasExistingWorkOrResults, session.contextFingerprint, currentFingerprint]);

  // Stale detection: Check if form input changed after result was generated or imported
  const isStale = useMemo(() => {
    if (!parseResult || !parseResult.data) return false;
    const resultFp = parseResult.data.sourceInputFingerprint;
    if (!resultFp) return false;
    return resultFp !== currentFingerprint;
  }, [parseResult, currentFingerprint]);

  // Field change handler with auto-save to localStorage
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      const next = { ...formValues, [fieldId]: value };
      saveToolData(tool.slug, next);
      setErrors((prev) => {
        if (prev[fieldId]) {
          const nextErrors = { ...prev };
          delete nextErrors[fieldId];
          return nextErrors;
        }
        return prev;
      });
    },
    [tool.slug, formValues]
  );

  // Centralized Atomic Reset & New Exploration Session Starter
  const startNewIdeaExploration = useCallback(
    (options: {
      preserveProfile: boolean;
      reason: "CHANGE_ISSUE" | "MANUAL_RESET" | "CONTEXT_CHANGED";
    }) => {
      // 1. Reset results & parsing
      setPasteText("");
      saveIdeaPasteDraft("");
      setParseResult(null);
      clearIdeaResult();

      // 2. Reset selection & handoff
      setSelectedAreaId(null);
      clearSelectedExplorationArea();
      clearIdeaToPhenomenonHandoff();

      // 3. Reset recommendations
      setRecommendationResult(null);
      setShowRecommendationPanel(false);
      clearLastRecommendation();

      // 4. Reset rounds & prompts
      setRejectionRounds([]);
      clearIdeaRejectionRounds();
      setGeneratedPrompt(null);
      setPendingAltPrompt(null);
      setShowAlternativeLoadedBanner(false);
      setShowRoundsHistory(false);
      setShowRejectionModal(false);
      setShowAltPromptModal(false);
      setShowChangeIssueModal(false);
      setShowFullResetModal(false);
      setShowResetModal(false);
      setShowResetPasteModal(false);
      setErrors({});

      // 5. Update form values based on preserveProfile option
      let updatedValues: Record<string, string> = {};
      if (options.preserveProfile) {
        updatedValues = {
          prodi: formValues.prodi || formValues.programStudi || "",
          pendekatan: formValues.pendekatan || "unknown",
          preferensi_data: formValues.preferensi_data || formValues.jenisData || "unknown",
          akses_data: formValues.akses_data || "unknown",
          avoidances: formValues.avoidances || formValues.kondisiBatasan || "",
          target_waktu: formValues.target_waktu || "unknown",
          constraints: formValues.constraints || "",
          minat: "",
          supervisor_direction: "",
          akses_data_catatan: "",
        };
      } else {
        for (const field of tool.fields) {
          updatedValues[field.id] = field.defaultValue || "";
        }
      }
      saveToolData(tool.slug, updatedValues);

      // 6. Create brand new exploration session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newFp = computeIdeaInputFingerprint(updatedValues);
      const freshSession: IdeaExplorationSession = {
        sessionId: newSessionId,
        createdAt: new Date().toISOString(),
        contextFingerprint: newFp,
        roundCount: 0,
        maxRounds: 3,
        resultSetIds: [],
        rejectedAreaIds: [],
        rejectionReasons: [],
        contextSnapshot: { ...updatedValues },
      };
      saveIdeaExplorationSession(freshSession);
      setSession(freshSession);

      // 7. Focus management & feedback
      setTimeout(() => {
        if (options.preserveProfile) {
          const minatEl =
            document.getElementById("minat") || document.getElementById("minatTopik");
          if (minatEl) {
            minatEl.scrollIntoView({ behavior: "smooth", block: "center" });
            minatEl.focus();
          }
          setToastMessage("Sesi baru siap. Masukkan isu atau cakupan yang ingin dieksplorasi.");
        } else {
          const prodiEl =
            document.getElementById("prodi") || document.getElementById("programStudi");
          if (prodiEl) {
            prodiEl.scrollIntoView({ behavior: "smooth", block: "center" });
            prodiEl.focus();
          }
          setToastMessage("Data Tool Cari Ide telah direset.");
        }
        setTimeout(() => setToastMessage(null), 3500);
      }, 100);
    },
    [formValues, tool.fields, tool.slug]
  );

  // Revert context changes back to current active result snapshot
  const handleRevertContextChanges = useCallback(() => {
    if (session.contextSnapshot) {
      saveToolData(tool.slug, session.contextSnapshot);
      setToastMessage("Perubahan form telah dikembalikan ke konteks hasil saat ini.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [session.contextSnapshot, tool.slug]);

  // Form submit handler (Generate Prompt)
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
    const promptText = assemblePrompt(tool, formValues);
    setGeneratedPrompt(promptText);

    // Update exploration session to round 1 if at round 0
    const currentFp = computeIdeaInputFingerprint(formValues);
    const updatedSession: IdeaExplorationSession = {
      ...session,
      roundCount: session.roundCount === 0 ? 1 : session.roundCount,
      contextFingerprint: currentFp,
      contextSnapshot: { ...formValues },
    };
    setSession(updatedSession);
    saveIdeaExplorationSession(updatedSession);
  };

  // Reset form inputs only via modal confirmation
  const handleResetForm = () => {
    setShowResetModal(false);
    const defaultVals: Record<string, string> = {};
    for (const field of tool.fields) {
      defaultVals[field.id] = field.defaultValue || "";
    }
    saveToolData(tool.slug, defaultVals);
    setErrors({});
    setToastMessage("Input formulir berhasil dikosongkan.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Paste Text change handler with auto-save draft
  const handlePasteChange = (val: string) => {
    setPasteText(val);
    saveIdeaPasteDraft(val);
  };

  // Read / Parse Paste Handler
  const handleReadPaste = () => {
    const result = parseIdeaTransfer(pasteText, currentFingerprint);
    setParseResult(result);
    if (result.success && result.data) {
      const newPayloadFingerprint = computePayloadFingerprint(result.data);
      const previousFingerprint = activePayloadFingerprint;

      // Tag parsed result with session identity
      result.data.sessionId = session.sessionId;

      if (newPayloadFingerprint !== previousFingerprint) {
        // Different payload -> create new result set identity
        const resultSetId = `result_r${rejectionRounds.length + 1}_${Date.now()}`;
        result.data.resultSetId = resultSetId;
        result.data.payloadFingerprint = newPayloadFingerprint;
        saveIdeaResult(result.data);

        // Update session resultSetIds
        const nextResultSetIds = Array.from(new Set([...session.resultSetIds, resultSetId]));
        const updatedSession: IdeaExplorationSession = {
          ...session,
          resultSetIds: nextResultSetIds,
        };
        setSession(updatedSession);
        saveIdeaExplorationSession(updatedSession);

        // Atomic reset of recommendation, selected area, and handoff
        setSelectedAreaId(null);
        clearSelectedExplorationArea();
        clearIdeaToPhenomenonHandoff();
        setRecommendationResult(null);
        setShowRecommendationPanel(false);
        clearLastRecommendation();

        // If alternative rounds exist, trigger confirmation banner
        if (rejectionRounds.length > 0) {
          setShowAlternativeLoadedBanner(true);
        }

        if (result.data.areas.length > 0) {
          setExpandedAreaDetails({ [result.data.areas[0].id]: true });
        }
        setToastMessage("Hasil Cari Ide V3 berhasil dibaca dan diverifikasi.");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        // Strictly identical payload -> retain existing IDs and state
        result.data.resultSetId = parseResult?.data?.resultSetId || `result_${Date.now()}`;
        result.data.payloadFingerprint = newPayloadFingerprint;
        saveIdeaResult(result.data);
        setToastMessage("Hasil Cari Ide V3 (payload identik) diperbarui.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } else {
      setSelectedAreaId(null);
      clearSelectedExplorationArea();
      clearIdeaToPhenomenonHandoff();
    }
  };

  // Reset Paste Handler
  const handleResetPaste = () => {
    setPasteText("");
    saveIdeaPasteDraft("");
    setParseResult(null);
    setSelectedAreaId(null);
    setRecommendationResult(null);
    setShowRecommendationPanel(false);
    setShowAlternativeLoadedBanner(false);
    setShowResetPasteModal(false);
    clearSelectedExplorationArea();
    clearIdeaToPhenomenonHandoff();
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

  // Copy fix prompt handler
  const handleCopyFixPrompt = async () => {
    const fixPrompt = generateFixIdeaFormatPrompt();
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

  // Toggle card details accordion
  const toggleAreaDetails = (id: string) => {
    setExpandedAreaDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Rejection Modal
  const handleOpenRejectionModal = () => {
    if (rejectionRounds.length >= 3) {
      setToastMessage(
        "Batas maksimal 3 putaran tercapai. Silakan perbaiki kondisi mahasiswa atau mulai eksplorasi isu baru."
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setShowRejectionModal(true);
  };

  // Submit Rejection Handler
  const handleSubmitRejection = (reasons: RejectionReason[], note: string) => {
    const newRoundNum = rejectionRounds.length + 1;
    const newRound: RejectedAreaRound = {
      roundId: `round-${newRoundNum}`,
      createdAt: new Date().toISOString(),
      rejectedAreas: (parseResult?.data?.areas || []).map((a) => ({
        areaId: a.id,
        areaName: a.name,
      })),
      reasons,
      additionalNote: note,
    };

    const nextRounds = [...rejectionRounds, newRound].slice(0, 3);
    setRejectionRounds(nextRounds);
    saveIdeaRejectionRounds(nextRounds);

    // Update exploration session round count and rejections
    const rejectedIds = (parseResult?.data?.areas || []).map((a) => a.id);
    const updatedSession: IdeaExplorationSession = {
      ...session,
      roundCount: Math.min(3, session.roundCount + 1),
      rejectedAreaIds: Array.from(new Set([...session.rejectedAreaIds, ...rejectedIds])),
      rejectionReasons: Array.from(new Set([...session.rejectionReasons, ...reasons])),
    };
    setSession(updatedSession);
    saveIdeaExplorationSession(updatedSession);

    const altPrompt = assembleTool1AlternativePrompt(tool, formValues, newRound);
    setGeneratedPrompt(altPrompt);
    setPendingAltPrompt(altPrompt);
    setShowRejectionModal(false);
    setShowAltPromptModal(true);
  };

  // Copy and view alternative prompt from center modal
  const handleCopyAndProceedAltPrompt = async () => {
    if (!pendingAltPrompt) return;
    const success = await copyToClipboard(pendingAltPrompt);
    if (success) {
      setToastMessage("Prompt Berhasil Disalin");
      setTimeout(() => setToastMessage(null), 4000);
      setShowAltPromptModal(false);

      // Scroll to prompt output section and focus heading
      const promptHeading = document.getElementById("tahap-1-heading");
      if (promptHeading) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        promptHeading.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        promptHeading.tabIndex = -1;
        promptHeading.focus({ preventScroll: true });
      }
    } else {
      setFallbackModalState({
        prompt: pendingAltPrompt,
        targetUrl: PLATFORM_URLS.chatgpt,
        platformName: "ChatGPT / Gemini",
      });
    }
  };

  // Smooth scroll and focus to recommendation panel
  const scrollToRecommendation = useCallback(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    recommendationPanelRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    setTimeout(() => {
      recommendationHeadingRef.current?.focus({ preventScroll: true });
    }, 100);
  }, []);

  // Compute and show rule-based recommendation strictly bound to active result set and session
  const handleCalculateRecommendation = () => {
    if (!parseResult?.data?.areas || parseResult.data.areas.length === 0) return;
    const currentFp =
      parseResult.data.payloadFingerprint || computePayloadFingerprint(parseResult.data);
    const currentResultSetId = parseResult.data.resultSetId || `result_${Date.now()}`;

    const rec = calculateAreaRecommendation(
      parseResult.data.areas,
      parseResult.data.comparison,
      formValues,
      currentResultSetId,
      currentFp
    );
    if (rec) {
      rec.sessionId = session.sessionId;
    }
    setRecommendationResult(rec);
    saveLastRecommendation(rec);
    setShowRecommendationPanel(true);
    setTimeout(() => {
      scrollToRecommendation();
    }, 50);
  };

  // Apply recommended area selection (does NOT navigate, scrolls to card & focuses heading)
  const handleSelectRecommendedArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setToastMessage(`Area ${areaId} terpilih berdasarkan rekomendasi.`);
    setTimeout(() => setToastMessage(null), 3000);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cardEl = areaCardRefs.current[areaId];
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
      const heading = cardEl.querySelector("h3");
      if (heading instanceof HTMLElement) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
  };

  // Scroll to a specific area card
  const handleScrollToAreaCard = (areaId: string) => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cardEl = areaCardRefs.current[areaId];
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  // Toggle sub-accordion inside card details
  const toggleSubSection = (areaId: string, sectionKey: string) => {
    setExpandedSubSections((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [sectionKey]: !prev[areaId]?.[sectionKey],
      },
    }));
  };

  // Toggle scope text line clamp
  const toggleScope = (areaId: string) => {
    setExpandedScopes((prev) => ({
      ...prev,
      [areaId]: !prev[areaId],
    }));
  };

  // Scroll smoothly to form section
  const handleScrollToForm = () => {
    const el = document.getElementById("tahap-1-heading");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Selected candidate object
  const selectedAreaCandidate = useMemo(() => {
    if (!parseResult || !parseResult.data) return null;
    return parseResult.data.areas.find((a) => a.id === selectedAreaId) || null;
  }, [parseResult, selectedAreaId]);

  // Save selected area and handoff to Tool 2 (Cari & Validasi Fenomena)
  const handleSaveAndProceed = () => {
    if (!parseResult || !parseResult.data || !selectedAreaCandidate || isStale) {
      setToastMessage(
        "Area terpilih tidak lagi cocok dengan hasil aktif. Pilih kembali salah satu area dari putaran terbaru."
      );
      return;
    }

    // Strict validation against active result set and fingerprint
    const activeFp =
      activePayloadFingerprint || computePayloadFingerprint(parseResult.data);
    const candidateInActive = parseResult.data.areas.find(
      (a) => a.id === selectedAreaCandidate.id
    );
    if (!candidateInActive || selectedAreaCandidate.id !== selectedAreaId) {
      setToastMessage(
        "Area terpilih tidak lagi cocok dengan hasil aktif. Pilih kembali salah satu area dari putaran terbaru."
      );
      return;
    }

    // Check if area is blocked
    if (parseResult.blockedAreaIds?.includes(selectedAreaCandidate.id)) {
      setToastMessage(
        "Area ini diblokir karena seluruh arah pencariannya menanyakan literatur."
      );
      return;
    }

    // Validate area text or scope summary
    const areaText = (
      selectedAreaCandidate.handoffToPhenomenon?.areaText ||
      selectedAreaCandidate.scopeSummary ||
      ""
    ).trim();
    if (!areaText) {
      setToastMessage(
        "Area terpilih tidak memiliki teks area atau scope summary yang valid. Pilih kembali area."
      );
      return;
    }

    // Validate initial clue or phenomenon search brief
    const initialClue = (
      selectedAreaCandidate.handoffToPhenomenon?.initialClue ||
      selectedAreaCandidate.phenomenonSearchBrief ||
      ""
    ).trim();
    if (!initialClue) {
      setToastMessage(
        "Area terpilih tidak memiliki petunjuk pencarian fenomena yang valid. Pilih kembali area."
      );
      return;
    }

    // Strict whitelist check for prioritySourceTypes
    const validSourceTypes = [
      "OFFICIAL_DATA",
      "REGULATION",
      "INSTITUTIONAL_REPORT",
      "EMPIRICAL_ARTICLE",
      "WORKING_PAPER",
      "REPUTABLE_NEWS",
    ];
    const sourceTypes =
      selectedAreaCandidate.handoffToPhenomenon?.prioritySourceTypes || [];
    const hasInvalidSourceType = sourceTypes.some((st) => !validSourceTypes.includes(st));
    if (hasInvalidSourceType) {
      setToastMessage(
        "Tipe sumber fenomena pada area ini tidak valid. Pilih area lain atau perbaiki hasil."
      );
      return;
    }

    const activeResultSetId =
      parseResult.data.resultSetId ||
      `result_r${rejectionRounds.length + 1}_${Date.now()}`;

    const selectedPayload: SelectedExplorationAreaV3 = {
      schemaVersion: 3,
      sessionId: session.sessionId,
      resultSetId: activeResultSetId,
      payloadFingerprint: activeFp,
      areaId: selectedAreaCandidate.id,
      name: selectedAreaCandidate.name,
      scopeSummary: selectedAreaCandidate.scopeSummary,
      academicConnection: selectedAreaCandidate.academicConnection,
      interestConnection: selectedAreaCandidate.interestConnection,
      dataProvenance: selectedAreaCandidate.dataProvenance,
      researchContext: selectedAreaCandidate.researchContext,
      scopeBoundary: selectedAreaCandidate.scopeBoundary,
      phenomenonSearchBrief: selectedAreaCandidate.phenomenonSearchBrief,
      phenomenonSearchDirections: selectedAreaCandidate.phenomenonSearchDirections,
      literatureSearchSeeds: selectedAreaCandidate.literatureSearchSeeds,
      constraintFit: selectedAreaCandidate.constraintFit,
      unresolvedItems: selectedAreaCandidate.unresolvedItems,
      notDecided: selectedAreaCandidate.notDecided,
      handoffToPhenomenon: selectedAreaCandidate.handoffToPhenomenon,
      researchShapePreview: selectedAreaCandidate.researchShapePreview,
      sourceInputFingerprint: currentFingerprint,
      selectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Construct atomic IdeaToPhenomenonHandoff (Version 2)
    const handoff: IdeaToPhenomenonHandoff = {
      handoffVersion: 2,
      sessionId: session.sessionId,
      sourceResultSetId: activeResultSetId,
      sourcePayloadFingerprint: activeFp,
      sourceRoundNumber: rejectionRounds.length + 1,
      selectedAreaId: selectedAreaCandidate.id,
      selectedAreaName: selectedAreaCandidate.name,
      createdAt: new Date().toISOString(),

      prodi: (formValues.prodi || "").trim(),
      areaText,

      researchContext: {
        actorText:
          selectedAreaCandidate.handoffToPhenomenon?.actorText ||
          selectedAreaCandidate.researchContext?.potentialActors?.join(", ") ||
          "",
        entityText:
          selectedAreaCandidate.handoffToPhenomenon?.entityText ||
          selectedAreaCandidate.researchContext?.potentialEntities?.join(", ") ||
          "",
        documentText:
          selectedAreaCandidate.handoffToPhenomenon?.documentText ||
          selectedAreaCandidate.researchContext?.potentialDocuments?.join(", ") ||
          "",
        dataArtifactText:
          selectedAreaCandidate.handoffToPhenomenon?.dataArtifactText ||
          selectedAreaCandidate.researchContext?.potentialDataArtifacts?.join(", ") ||
          "",
      },

      phenomenonContext: {
        initialClue,
        observableSignals:
          selectedAreaCandidate.handoffToPhenomenon?.observableSignals || [],
        inScope:
          selectedAreaCandidate.handoffToPhenomenon?.inScope ||
          selectedAreaCandidate.scopeBoundary?.inScope ||
          [],
        outOfScope:
          selectedAreaCandidate.handoffToPhenomenon?.outOfScope ||
          selectedAreaCandidate.scopeBoundary?.outOfScope ||
          [],
        prioritySourceTypes:
          selectedAreaCandidate.handoffToPhenomenon?.prioritySourceTypes || [],
      },

      studentConstraints: {
        preferredApproach: (formValues.pendekatan || "unknown").trim(),
        preferredData: (formValues.preferensi_data || "unknown").trim(),
        dataAccess: (formValues.akses_data || "unknown").trim(),
        accessNotes: (formValues.akses_data_catatan || "").trim(),
        thingsToAvoid: (formValues.avoidances || "").trim(),
        timeCondition: (formValues.target_waktu || "unknown").trim(),
        otherConstraints: (formValues.constraints || "").trim(),
        lecturerDirection: (formValues.supervisor_direction || "").trim(),
      },
    };

    saveIdeaToPhenomenonHandoff(handoff);
    saveSelectedExplorationArea(selectedPayload);

    // Update shared context
    const shared = loadSharedResearchContext() || {};
    saveSharedResearchContext({
      ...shared,
      prodi: (formValues.prodi || "").trim(),
      minat: (formValues.minat || "").trim(),
      initialInterest: (formValues.minat || "").trim(),
      area_eksplorasi: areaText,
      selectedArea: areaText,
      selectedExplorationArea: selectedPayload,
      selected_exploration_area: selectedPayload,
      ideaToPhenomenonHandoff: handoff,
      idea_to_phenomenon_handoff: handoff,
      idea_input_fingerprint: currentFingerprint,
      constraints: {
        pendekatan: formValues.pendekatan || "unknown",
        dataNyaman: formValues.preferensi_data || "unknown",
        aksesData: formValues.akses_data || "unknown",
        catatanAkses: formValues.akses_data_catatan || "",
        halDihindari: formValues.avoidances || "",
        kondisiWaktu: formValues.target_waktu || "unknown",
        arahanDosen: formValues.supervisor_direction || "",
      },
      pendekatan: formValues.pendekatan || "unknown",
      preferensi_data: formValues.preferensi_data || "unknown",
      akses_data: formValues.akses_data || "unknown",
      akses_data_catatan: formValues.akses_data_catatan || "",
      avoidances: formValues.avoidances || "",
      target_waktu: formValues.target_waktu || "unknown",
      supervisor_direction: formValues.supervisor_direction || "",
      lastUpdated: new Date().toISOString(),
    });

    setToastMessage("Area V3 terpilih berhasil disimpan. Membuka Cari & Validasi Fenomena...");
    setTimeout(() => {
      router.push("/tools/cari-fenomena-awal");
    }, 1000);
  };

  const getConstraintBadge = (status: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO") => {
    const info = getStudentStatus(status);
    return (
      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${info.badgeClass}`}>
        {status === "SELARAS_SEMENTARA" ? (
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

  const getDataOriginBadge = (origin: DataOrigin) => {
    const info = getDataOriginInfo(origin);
    return (
      <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${info.badgeClass}`}>
        {info.label}
      </span>
    );
  };

  const getAccessStatusBadge = (status: DataAccessStatus) => {
    const info = getDataAccessStatusInfo(status);
    return (
      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${info.badgeClass}`}>
        {info.label}
      </span>
    );
  };

  const renderFitRatingBadge = (rating: string, domain?: "workload" | "beban" | "uncertainty" | "ketidakpastian") => {
    const label = getStudentLabel(rating, domain);
    const status = getStudentStatus(rating);
    return (
      <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${status.badgeClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-10 pb-28 sm:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-[#FFB84D]/40 bg-[#0C0A1A] px-4 py-3 text-xs font-semibold text-[#FBFAFF] shadow-xl shadow-black/40 animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 1 & 2 — CERITAKAN KONDISIMU & JALANKAN PROMPT */}
      {/* ========================================================================= */}
      <section aria-labelledby="tahap-1-heading" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2748] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6D5AE6] text-xs font-bold text-white">
              1
            </span>
            <h2 id="tahap-1-heading" className="text-lg font-bold text-[#FBFAFF]">
              Tahap 1: Ceritakan Kondisimu &amp; Jalankan Prompt
            </h2>
          </div>
          <button
            type="button"
            id="btn-full-reset-tool-top"
            onClick={() => setShowFullResetModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3 py-1.5 text-xs font-medium text-[#A79FC4] hover:text-[#FF5C8A] hover:border-[#FF5C8A]/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5C8A] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Tool</span>
          </button>
        </div>

        {/* Material Context Divergence Warning Banner */}
        {isContextDiverged && (
          <div className="rounded-xl border border-[#FF9E5E]/50 bg-[#FF9E5E]/15 p-4 sm:p-5 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF9E5E]">
                  Konteks Mahasiswa Telah Berubah
                </h4>
                <p className="text-xs text-[#FBFAFF] leading-relaxed">
                  Isian profil atau batasan pada form saat ini berbeda dari kondisi ketika hasil atau putaran eksplorasi aktif dibuat.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                id="btn-revert-context"
                onClick={handleRevertContextChanges}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer"
              >
                <Undo2 className="h-3.5 w-3.5 text-[#FFB84D]" />
                <span>Kembalikan Perubahan</span>
              </button>
              <button
                type="button"
                id="btn-diverged-start-new-session"
                onClick={() => setShowChangeIssueModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF9E5E] px-3.5 py-2 text-xs font-bold text-[#0C0A1A] hover:bg-[#e09419] transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Mulai Sesi Baru</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Panel: Form */}
          <div className="lg:col-span-6">
            <div className="relative flex h-full flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2E2748]/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FFB84D]">
                      Profil &amp; Batasan Mahasiswa
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#A79FC4] hover:text-[#FBFAFF] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6D5AE6] rounded px-1"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      Reset Input
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {tool.fields.map((field) => {
                    const value = formValues[field.id] || "";
                    const error = errors[field.id];

                    if (field.type === "select") {
                      return (
                        <div key={field.id} className="space-y-1.5">
                          <label
                            htmlFor={field.id}
                            className="block text-xs font-semibold text-[#FBFAFF]"
                          >
                            {field.label}
                            {field.required && <span className="text-[#FF5C8A] ml-1">*</span>}
                          </label>
                          <select
                            id={field.id}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3.5 py-2 text-xs text-[#FBFAFF] transition-colors focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6]"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {field.helperText && (
                            <p className="text-[13px] text-[#A79FC4]/80">{field.helperText}</p>
                          )}
                        </div>
                      );
                    }

                    if (field.type === "textarea") {
                      return (
                        <div key={field.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor={field.id}
                              className="block text-xs font-semibold text-[#FBFAFF]"
                            >
                              {field.label}
                              {field.required && <span className="text-[#FF5C8A] ml-1">*</span>}
                            </label>
                            {value && (
                              <span className="text-[12px] text-[#A79FC4]">
                                {countChars(value)} karakter
                              </span>
                            )}
                          </div>
                          <textarea
                            id={field.id}
                            rows={3}
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className={`w-full rounded-lg border ${
                              error ? "border-[#FF5C8A]" : "border-[#2E2748]"
                            } bg-[#0C0A1A] px-3.5 py-2 text-xs text-[#FBFAFF] placeholder-[#A79FC4]/40 transition-colors focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6]`}
                          />
                          {error ? (
                            <p className="text-[13px] font-medium text-[#FF5C8A]">{error}</p>
                          ) : (
                            field.helperText && (
                              <p className="text-[13px] text-[#A79FC4]/80">{field.helperText}</p>
                            )
                          )}
                        </div>
                      );
                    }

                    // Default text input
                    return (
                      <div key={field.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor={field.id}
                            className="block text-xs font-semibold text-[#FBFAFF]"
                          >
                            {field.label}
                            {field.required && <span className="text-[#FF5C8A] ml-1">*</span>}
                          </label>
                          {value && (
                            <span className="text-[12px] text-[#A79FC4]">
                              {countChars(value)} karakter
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          id={field.id}
                          placeholder={field.placeholder}
                          value={value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`w-full rounded-lg border ${
                            error ? "border-[#FF5C8A]" : "border-[#2E2748]"
                          } bg-[#0C0A1A] px-3.5 py-2 text-xs text-[#FBFAFF] placeholder-[#A79FC4]/40 transition-colors focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6]`}
                        />
                        {error ? (
                          <p className="text-[13px] font-medium text-[#FF5C8A]">{error}</p>
                        ) : (
                          field.helperText && (
                            <p className="text-[13px] text-[#A79FC4]/80">{field.helperText}</p>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    id="btn-generate-idea-prompt"
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6D5AE6]/20 hover:bg-[#5A46D6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191430]"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Generate Prompt Cari Ide V3</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel: Prompt Output */}
          <div ref={outputPanelRef} id="tool-output-panel" className="lg:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between border-b border-[#2E2748]/70 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#6D5AE6]" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#A79FC4]">
                      Hasil Prompt (V3 Canonical)
                    </span>
                  </div>

                  {generatedPrompt && (
                    <span className="rounded-md border border-[#2E2748] bg-[#0C0A1A] px-2 py-0.5 text-[13px] text-[#A79FC4]">
                      {countChars(generatedPrompt)} karakter
                    </span>
                  )}
                </div>

                    {generatedPrompt ? (
                  <div className="mt-4 space-y-4" id="prompt-preview-section">
                    {/* Pratinjau selalu tampil (diminta user): 4 baris pertama */}
                    <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-4">
                      <pre className="font-mono text-[13px] leading-relaxed text-[#A79FC4] whitespace-pre-wrap line-clamp-4 select-all">
                        {generatedPrompt}
                      </pre>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        id="btn-copy-idea-prompt"
                        onClick={handleCopyMainPrompt}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#221A42] px-3 py-2 text-xs font-semibold text-[#FBFAFF] hover:border-[#6D5AE6] hover:bg-[#6D5AE6]/15 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6D5AE6]"
                      >
                        {copiedMain ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                            <span className="text-[#FFB84D]">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        id="btn-open-chatgpt-idea"
                        onClick={() => handleOpenPlatform("ChatGPT")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-2 text-xs font-semibold text-[#FFB84D] hover:bg-[#FFB84D]/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFB84D]"
                      >
                        <span>Buka ChatGPT</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        id="btn-open-gemini-idea"
                        onClick={() => handleOpenPlatform("Gemini")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3 py-2 text-xs font-semibold text-[#6D5AE6] hover:bg-[#6D5AE6]/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6D5AE6]"
                      >
                        <span>Buka Gemini</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="rounded-lg border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 p-3.5 text-xs text-[#A79FC4] leading-relaxed">
                      <p className="font-semibold text-[#FBFAFF] mb-1">Instruksi Langkah Selanjutnya:</p>
                      <p>
                        Jalankan prompt di ChatGPT atau Gemini. Setelah seluruh jawaban selesai (termasuk blok{" "}
                        <code className="text-[#FFB84D]">SKRIFLOW_IDEA_V3</code>), kembali ke halaman ini dan tempel jawabannya pada <strong>Tahap 2</strong> di bawah.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2E2748] p-8 text-center">
                    <Lightbulb className="h-10 w-10 text-[#2E2748]" aria-hidden="true" />
                    <p className="mt-3 text-xs font-semibold text-[#FBFAFF]">Prompt Belum Dibuat</p>
                    <p className="mt-1 max-w-xs text-[13px] text-[#A79FC4]">
                      Isi form di samping lalu klik tombol &quot;Generate Prompt Cari Ide V3&quot; untuk
                      membuat prompt terstruktur.
                    </p>
                    <PromptExample variant="single" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 2 — TEMPEL DAN VALIDASI HASIL V3 */}
      {/* ========================================================================= */}
      <section aria-labelledby="tahap-2-heading" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[#2E2748] pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6D5AE6] text-xs font-bold text-white">
            2
          </span>
          <h2 id="tahap-2-heading" className="text-lg font-bold text-[#FBFAFF]">
            Tahap 2: Tempel &amp; Periksa Hasil Cari Ide (V3)
          </h2>
        </div>

        <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2748]/70 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#FBFAFF]">Tempel Hasil Cari Ide</h3>
              <p className="mt-0.5 text-xs text-[#A79FC4]">
                Tempel seluruh jawaban ChatGPT atau Gemini. SKRIFLOW akan membaca blok{" "}
                <code className="text-[#FFB84D]">SKRIFLOW_IDEA_V3</code> dan mengubahnya menjadi kartu
                area eksplorasi lengkap dengan asal data, konteks riset, dan batas lingkup.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {parseResult && parseResult.status === "HASIL_VALID" && (
                <button
                  type="button"
                  onClick={() => setShowRawResult(!showRawResult)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFB84D] hover:underline cursor-pointer"
                >
                  <span>{showRawResult ? "Sembunyikan Hasil Mentah" : "Lihat Hasil Mentah"}</span>
                  {showRawResult ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}

              {pasteText && (
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[13px] ${
                      countChars(pasteText) > IDEA_RESULT_HARD_LIMIT
                        ? "text-[#FF5C8A] font-bold"
                        : countChars(pasteText) > IDEA_RESULT_SOFT_LIMIT
                        ? "text-[#FF9E5E] font-semibold"
                        : "text-[#A79FC4]"
                    }`}
                  >
                    {countChars(pasteText).toLocaleString()} / {IDEA_RESULT_HARD_LIMIT.toLocaleString()} karakter
                    {countChars(pasteText) > IDEA_RESULT_SOFT_LIMIT && countChars(pasteText) <= IDEA_RESULT_HARD_LIMIT && (
                      <span className="ml-1 text-[12px] text-[#FF9E5E] font-normal">(Cukup panjang)</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowResetPasteModal(true)}
                    className="text-xs font-medium text-[#A79FC4] hover:text-[#FF5C8A] transition-colors cursor-pointer"
                  >
                    Reset Hasil
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-end">
              <TombolTempelClipboard onPaste={handlePasteChange} />
            </div>
            {(!parseResult || parseResult.status !== "HASIL_VALID" || showRawResult) && (
              <textarea
                id="textarea-paste-idea"
                rows={10}
                placeholder="Tempel seluruh output ChatGPT atau Gemini di sini (termasuk output manusia dan blok === BEGIN SKRIFLOW_IDEA_V3 === sampai === END SKRIFLOW_IDEA_V3 ===)..."
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
                className="w-full min-h-[280px] rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3.5 font-mono text-xs text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6] leading-relaxed select-text animate-fade-in"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                id="btn-parse-idea"
                onClick={handleReadPaste}
                disabled={!pasteText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6D5AE6]/20 hover:bg-[#5A46D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6]"
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Baca dan Periksa Hasil V3</span>
              </button>

              {parseResult && (parseResult.status === "HASIL_TIDAK_DIKENALI" || parseResult.status === "LEGACY_V2_REQUIRES_REGENERATION" || parseResult.status === "OUTPUT_TERLALU_PANJANG") && (
                <button
                  type="button"
                  onClick={handleCopyFixPrompt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 px-3 py-2 text-xs font-semibold text-[#FF9E5E] hover:bg-[#FF9E5E]/20 transition-colors cursor-pointer"
                >
                  {copiedFixPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                      <span className="text-[#FFB84D]">Prompt Perbaikan Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#FF9E5E]" aria-hidden="true" />
                      <span>Salin Prompt Perbaikan Format V3</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Validation Status Display */}
          {parseResult && (
            <div className="pt-2">
              {parseResult.status === "HASIL_VALID" && !showRawResult && (
                <div className="rounded-lg border border-[#FFB84D]/30 bg-[#FFB84D]/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#FFB84D] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FFB84D] uppercase tracking-wider">
                        Hasil V3 Valid — Siap Memilih Area
                      </h4>
                      <p className="mt-1 text-xs text-[#FBFAFF]/90">
                        Ditemukan {parseResult.data?.areas.length} area eksplorasi V3 yang valid dengan data provenance dan batas scope terstruktur.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parseResult.status === "LEGACY_V2_REQUIRES_REGENERATION" && (
                <div className="rounded-lg border border-[#FF9E5E]/40 bg-[#FF9E5E]/15 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FF9E5E] uppercase tracking-wider">
                        Format Versi Lama Terdeteksi (SKRIFLOW_IDEA_V2)
                      </h4>
                      <p className="mt-1 text-xs text-[#FBFAFF] leading-relaxed">
                        {parseResult.error}
                      </p>
                      <div className="mt-3 rounded bg-[#0C0A1A] border border-[#2E2748] p-3 text-xs text-[#A79FC4] space-y-1.5">
                        <p className="font-semibold text-[#FBFAFF]">Langkah yang perlu kamu lakukan:</p>
                        <ol className="list-decimal list-inside space-y-1 text-[13px]">
                          <li>Generate ulang prompt di <strong>Tahap 1</strong> di atas (atau klik tombol &quot;Salin Prompt Perbaikan Format V3&quot;).</li>
                          <li>Jalankan prompt terbaru di ChatGPT atau Gemini.</li>
                          <li>Tempel kembali output yang memuat marker <code className="text-[#FFB84D]">SKRIFLOW_IDEA_V3</code>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {parseResult.status === "HASIL_PERLU_DIPERIKSA" && (
                <div className="rounded-lg border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FF9E5E] uppercase tracking-wider">
                        Hasil Perlu Diperiksa (Peringatan Nonfatal)
                      </h4>
                      <p className="mt-1 text-xs text-[#FBFAFF]/90">
                        Transfer blok V3 terbaca dengan {parseResult.data?.areas.length} area, namun ada beberapa catatan:
                      </p>
                      <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-[#A79FC4]">
                        {parseResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {parseResult.status === "OUTPUT_TERLALU_PANJANG" && (
                <div className="rounded-lg border border-[#FF5C8A]/40 bg-[#FF5C8A]/15 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-[#FF5C8A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FF5C8A] uppercase tracking-wider">
                        OUTPUT TERLALU PANJANG
                      </h4>
                      <p className="mt-1 text-xs text-[#FBFAFF] leading-relaxed">
                        {parseResult.error || "Output terlalu panjang untuk diproses dengan aman. Pertahankan satu hasil lengkap dan pastikan hanya ada satu blok SKRIFLOW_IDEA_V3."}
                      </p>
                      {parseResult.errorDetails.length > 0 && (
                        <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-[#A79FC4]">
                          {parseResult.errorDetails.map((ed, idx) => (
                            <li key={idx}>{ed}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {parseResult.status === "HASIL_TIDAK_DIKENALI" && (
                <div className="rounded-lg border border-[#FF5C8A]/30 bg-[#FF5C8A]/10 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-[#FF5C8A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-xs font-bold text-[#FF5C8A] uppercase tracking-wider">
                        Hasil Tidak Dikenali / Format Belum Sesuai
                      </h4>
                      <p className="mt-1 text-xs text-[#FBFAFF]">
                        {parseResult.error || "Gagal memproses blok transfer SKRIFLOW_IDEA_V3."}
                      </p>
                      {parseResult.errorDetails.length > 0 && (
                        <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-[#A79FC4]">
                          {parseResult.errorDetails.map((ed, idx) => (
                            <li key={idx}>{ed}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 3 — PILIH AREA EKSPLORASI V3 */}
      {/* ========================================================================= */}
      {parseResult && parseResult.data && parseResult.data.areas.length > 0 && !showRawResult && (
        <section aria-labelledby="tahap-3-heading" className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#2E2748] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6D5AE6] text-xs font-bold text-white">
                3
              </span>
              <h2 id="tahap-3-heading" className="text-lg font-bold text-[#FBFAFF]">
                Tahap 3: Pilih Area Eksplorasi
              </h2>
            </div>
            <button
              type="button"
              id="btn-change-issue-header"
              onClick={() => setShowChangeIssueModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#6D5AE6]/50 bg-[#6D5AE6]/10 px-3 py-1.5 text-xs font-bold text-[#FFB84D] hover:bg-[#6D5AE6]/20 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ganti Isu / Cakupan</span>
            </button>
          </div>

          {/* Student Context Summary Box */}
          <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2E2748]/70 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#FFB84D]" />
                <h3 className="text-xs font-bold text-[#FBFAFF] uppercase tracking-wider">
                  Ringkasan Konteks Mahasiswa
                </h3>
              </div>
              <span className="text-[12px] text-[#A79FC4]">Dasar Pembuatan Area</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748]/60">
                <span className="text-[12px] uppercase text-[#A79FC4] block">Program Studi</span>
                <span className="font-semibold text-[#FBFAFF] mt-0.5 block truncate">
                  {formValues.prodi || formValues.programStudi || "Belum ditentukan"}
                </span>
              </div>
              <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748]/60">
                <span className="text-[12px] uppercase text-[#A79FC4] block">Minat / Isu</span>
                <span className="font-semibold text-[#FBFAFF] mt-0.5 block truncate" title={formValues.minat || formValues.minatTopik || "-"}>
                  {formValues.minat || formValues.minatTopik || "Belum diisi"}
                </span>
              </div>
              <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748]/60">
                <span className="text-[12px] uppercase text-[#A79FC4] block">Pendekatan &amp; Data</span>
                <span className="font-semibold text-[#FBFAFF] mt-0.5 block truncate">
                  {getStudentLabel(formValues.pendekatan || "unknown")} | {getStudentLabel(formValues.preferensi_data || "unknown")}
                </span>
              </div>
              <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748]/60">
                <span className="text-[12px] uppercase text-[#A79FC4] block">Akses Data &amp; Waktu</span>
                <span className="font-semibold text-[#FBFAFF] mt-0.5 block truncate">
                  {getStudentLabel(formValues.akses_data || "unknown")} ({getStudentLabel(formValues.target_waktu || "unknown")})
                </span>
              </div>
            </div>
            {(formValues.avoidances || formValues.supervisor_direction) && (
              <div className="pt-2 border-t border-[#2E2748]/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-[#A79FC4]">
                {formValues.avoidances && (
                  <div>
                    <strong className="text-[#FF5C8A]">Hal Dihindari:</strong> {formValues.avoidances}
                  </div>
                )}
                {formValues.supervisor_direction && (
                  <div>
                    <strong className="text-[#FFB84D]">Arahan Dosen:</strong> {formValues.supervisor_direction}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prominent Callout: Ingin Mengganti Isu atau Cakupan? */}
          <div className="rounded-xl border border-[#6D5AE6]/40 bg-[#6D5AE6]/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-[#6D5AE6]/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#6D5AE6]/50 bg-[#6D5AE6]/20 text-[#FFB84D]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FBFAFF] uppercase tracking-wider">
                  Ingin mengganti isu atau cakupan?
                </h4>
                <p className="text-xs text-[#A79FC4] mt-0.5 leading-relaxed">
                  Mulai eksplorasi baru agar batas putaran, hasil, rekomendasi, pilihan, dan data handoff sebelumnya tidak ikut terbawa.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-callout-change-issue"
              onClick={() => setShowChangeIssueModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#6D5AE6] bg-[#6D5AE6] px-4 py-2 text-xs font-bold text-white hover:bg-[#5A46D6] transition-colors shrink-0 min-h-[40px] shadow-md shadow-[#6D5AE6]/20 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ganti Isu / Cakupan</span>
            </button>
          </div>

          {/* Material Context Divergence Alert inside Tahap 3 */}
          {isContextDiverged && (
            <div className="rounded-xl border border-[#FF9E5E]/50 bg-[#FF9E5E]/15 p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF9E5E]">
                    Perhatian: Konteks Mahasiswa Berubah
                  </h4>
                  <p className="mt-1 text-xs text-[#FBFAFF] leading-relaxed">
                    Hasil dan putaran di bawah ini dihasilkan dari isian form sebelum perubahan terakhir.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRevertContextChanges}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer"
                >
                  <Undo2 className="h-3.5 w-3.5 text-[#FFB84D]" />
                  <span>Kembalikan Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangeIssueModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF9E5E] px-3.5 py-2 text-xs font-bold text-[#0C0A1A] hover:bg-[#e09419] transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Mulai Sesi Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* Exploration Round Tracker & History */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0C0A1A] rounded-lg border border-[#2E2748] p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#FBFAFF]">Status Eksplorasi:</span>
              <span className="rounded bg-[#6D5AE6]/20 border border-[#6D5AE6]/40 px-2 py-0.5 font-mono text-xs font-bold text-[#FFB84D]">
                Putaran eksplorasi: {rejectionRounds.length + 1} dari 3
              </span>
            </div>

            {rejectionRounds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRoundsHistory((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D5AE6] hover:text-[#FFB84D] transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                <span>{showRoundsHistory ? "Sembunyikan Area Sebelumnya" : `Lihat Area dari Putaran Sebelumnya (${rejectionRounds.length})`}</span>
                {showRoundsHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Selection Guidance Panel */}
          {parseResult.data.selectionGuidance && parseResult.data.selectionGuidance.length > 0 && (
            <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FBFAFF]">
                <Compass className="h-4 w-4 text-[#FFB84D]" />
                <span>Panduan Pemilihan Area Eksplorasi</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#A79FC4]">
                {parseResult.data.selectionGuidance.map((guide, gIdx) => (
                  <li key={gIdx} className="flex items-start gap-2 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FFB84D] shrink-0 mt-1.5" />
                    <span className="text-[#FBFAFF]">{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rounds History Accordion */}
          {showRoundsHistory && rejectionRounds.length > 0 && (
            <div className="rounded-lg border border-[#2E2748] bg-[#0E1528] p-4 space-y-3 text-xs animate-fade-in">
              <h4 className="font-bold text-[#FBFAFF] flex items-center gap-1.5">
                <History className="h-4 w-4 text-[#6D5AE6]" />
                Riwayat Area yang Ditolak Sebelumnya
              </h4>
              <div className="space-y-2.5">
                {rejectionRounds.map((rd, rIdx) => (
                  <div key={rd.roundId || rIdx} className="rounded bg-[#191430] p-3 border border-[#2E2748] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FFB84D]">Putaran {rIdx + 1}</span>
                      <span className="text-[12px] text-[#A79FC4]">{new Date(rd.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[13px] text-[#FBFAFF]">
                      <strong>Area:</strong> {rd.rejectedAreas.map((a) => `${a.areaId} (${a.areaName})`).join(", ")}
                    </div>
                    {rd.reasons.length > 0 && (
                      <div className="text-[13px] text-[#A79FC4]">
                        <strong>Alasan:</strong> {rd.reasons.join(", ")}
                      </div>
                    )}
                    {rd.additionalNote && (
                      <p className="text-[12px] text-[#A79FC4]/80 italic">Catatan: &ldquo;{rd.additionalNote}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Max 3 Rounds Exhausted Banner */}
          {rejectionRounds.length >= 3 && (
            <div className="rounded-xl border border-[#FF9E5E]/40 bg-[#FF9E5E]/10 p-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF9E5E]">
                    Batas 3 Putaran Eksplorasi Tercapai
                  </h4>
                  <p className="mt-1 text-xs text-[#FBFAFF] leading-relaxed">
                    Kondisi pencarian masih terlalu luas atau saling bertentangan. Perjelas minat, akses data, jenis data yang nyaman, hal yang ingin dihindari, atau arahan dosen sebelum membuat alternatif berikutnya.
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  id="btn-refine-student-profile"
                  onClick={handleScrollToForm}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF9E5E] px-3.5 py-2 text-xs font-bold text-[#0C0A1A] hover:bg-[#e09419] transition-colors"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Perbaiki Kondisi Mahasiswa</span>
                </button>
              </div>
            </div>
          )}

          {/* Stale Warning Banner */}
          {isStale && (
            <div className="rounded-xl border border-[#FF9E5E]/40 bg-[#FF9E5E]/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF9E5E]">
                    Perhatian: Input Form Berubah (Data Stale)
                  </h4>
                  <p className="mt-1 text-xs text-[#FBFAFF] leading-relaxed">
                    Kondisi mahasiswa berubah setelah hasil Cari Ide dibuat. Generate ulang prompt agar
                    area yang dipilih tetap sesuai dengan data terbaru.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Alternative Result Confirmation Banner */}
          {showAlternativeLoadedBanner && rejectionRounds.length > 0 && (
            <div className="rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/10 p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#FFB84D] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFB84D]">
                      AREA ALTERNATIF BERHASIL DIMUAT
                    </h4>
                    <p className="text-xs text-[#FBFAFF] leading-relaxed">
                      Hasil putaran sebelumnya tetap tersimpan sebagai riwayat. Rekomendasi lama sudah direset karena area aktif telah berubah.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlternativeLoadedBanner(false)}
                  className="text-[#A79FC4] hover:text-[#FBFAFF] p-1 cursor-pointer"
                  aria-label="Tutup banner konfirmasi area alternatif"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  id="btn-recommend-new-areas"
                  onClick={() => {
                    setShowAlternativeLoadedBanner(false);
                    handleCalculateRecommendation();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FFB84D] px-4 py-2 text-xs font-bold text-[#0C0A1A] shadow-md hover:bg-[#5cd4a7] transition-colors min-h-[44px] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Bantu Pilihkan dari Area Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* Perbandingan Singkat Antar Area (Responsive: Desktop Table / Mobile Cards) */}
          {parseResult.data.comparison.length > 0 && (
            <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#6D5AE6]" aria-hidden="true" />
                <h3 className="text-sm font-bold text-[#FBFAFF]">Perbandingan Singkat Antar Area</h3>
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2E2748] text-[#A79FC4] uppercase tracking-wider text-[12px]">
                      <th className="py-2.5 pr-4">Area</th>
                      <th className="py-2.5 px-3">Minat</th>
                      <th className="py-2.5 px-3">Prodi</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Beban Koleksi</th>
                      <th className="py-2.5 px-3">Ketidakpastian Metodologis</th>
                      <th className="py-2.5 pl-3">Pemeriksaan Selanjutnya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2748]/50 text-[#FBFAFF]">
                    {parseResult.data.comparison.map((comp) => {
                      const areaObj = parseResult.data?.areas.find((a) => a.id === comp.areaId);
                      return (
                        <tr key={comp.areaId} className="hover:bg-[#221A42]/40 transition-colors">
                          <td className="py-3 pr-4 font-semibold text-[#FBFAFF]">
                            <span className="text-[#6D5AE6] font-mono mr-1.5">{comp.areaId}</span>
                            {areaObj?.name || comp.areaId}
                          </td>
                          <td className="py-3 px-3">{renderFitRatingBadge(comp.interestFit)}</td>
                          <td className="py-3 px-3">{renderFitRatingBadge(comp.studyProgramFit)}</td>
                          <td className="py-3 px-3">{renderFitRatingBadge(comp.dataFit)}</td>
                          <td className="py-3 px-3">{renderFitRatingBadge(comp.collectionBurden, "beban")}</td>
                          <td className="py-3 px-3">{renderFitRatingBadge(comp.methodologicalUncertainty, "uncertainty")}</td>
                          <td className="py-3 pl-3 text-[#A79FC4] max-w-xs">{comp.mainCheckNext || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet View: Responsive Cards */}
              <div className="block md:hidden space-y-3">
                {parseResult.data.comparison.map((comp) => {
                  const areaObj = parseResult.data?.areas.find((a) => a.id === comp.areaId);
                  return (
                    <div key={comp.areaId} className="rounded-lg bg-[#0C0A1A] p-3.5 border border-[#2E2748] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-[#2E2748]/70 pb-2">
                        <span className="font-bold text-[#FBFAFF]">
                          <span className="text-[#6D5AE6] font-mono mr-1.5">{comp.areaId}</span>
                          {areaObj?.name || comp.areaId}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div>
                          <span className="text-[#A79FC4] block text-[12px] uppercase">Kedekatan Minat</span>
                          <div className="mt-0.5">{renderFitRatingBadge(comp.interestFit)}</div>
                        </div>
                        <div>
                          <span className="text-[#A79FC4] block text-[12px] uppercase">Keterkaitan Prodi</span>
                          <div className="mt-0.5">{renderFitRatingBadge(comp.studyProgramFit)}</div>
                        </div>
                        <div>
                          <span className="text-[#A79FC4] block text-[12px] uppercase">Kesesuaian Data</span>
                          <div className="mt-0.5">{renderFitRatingBadge(comp.dataFit)}</div>
                        </div>
                        <div>
                          <span className="text-[12px] uppercase text-[#A79FC4] block">Beban Pengumpulan</span>
                          <div className="mt-0.5">{renderFitRatingBadge(comp.collectionBurden, "beban")}</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[12px] uppercase text-[#A79FC4] block">Ketidakpastian Metodologis</span>
                          <div className="mt-0.5">{renderFitRatingBadge(comp.methodologicalUncertainty, "uncertainty")}</div>
                        </div>
                      </div>
                      {comp.mainCheckNext && (
                        <div className="text-[13px] text-[#A79FC4] pt-1.5 border-t border-[#2E2748]/50">
                          <strong className="text-[#FBFAFF]">Pemeriksaan Selanjutnya:</strong> {comp.mainCheckNext}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons Top: Belum Ada yang Cocok & Bantu Pilihkan Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <button
              type="button"
              id="btn-rejection-modal-top"
              onClick={handleOpenRejectionModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2748] bg-[#191430] px-4 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] hover:border-[#6D5AE6]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#FF9E5E]" aria-hidden="true" />
              <span>Belum Ada yang Cocok</span>
            </button>

            <button
              type="button"
              id="btn-auto-recommendation-top"
              onClick={showRecommendationPanel && isRecommendationValid ? scrollToRecommendation : handleCalculateRecommendation}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#6D5AE6]/40 bg-[#6D5AE6]/10 px-4 py-2.5 text-xs font-bold text-[#FFB84D] hover:bg-[#6D5AE6]/20 hover:border-[#6D5AE6] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] min-h-[44px]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
              <span>{showRecommendationPanel && isRecommendationValid ? "Lihat Rekomendasi Lagi" : "Bantu Pilihkan Area untuk Dicek Dulu"}</span>
            </button>
          </div>

          {/* Recommendation Panel (Positioned before area card list) */}
          {showRecommendationPanel && isRecommendationValid && recommendationResult && (
            <RecommendationPanel
              panelRef={recommendationPanelRef}
              headingRef={recommendationHeadingRef}
              recommendation={recommendationResult}
              onSelectArea={handleSelectRecommendedArea}
              onDismiss={() => setShowRecommendationPanel(false)}
              onRequestAlternative={handleOpenRejectionModal}
            />
          )}

          {/* Area Cards Grid: 1 column per row across all breakpoints */}
          <div className="grid grid-cols-1 gap-6">
            {parseResult.data.areas.map((area) => {
              const isSelected = selectedAreaId === area.id;
              const isExpanded = !!expandedAreaDetails[area.id];
              const isBlocked = parseResult.blockedAreaIds?.includes(area.id);
              const isScopeLong = area.scopeSummary.length > 180;
              const isScopeOpen = !!expandedScopes[area.id];
              const comp = parseResult.data?.comparison.find((c) => c.areaId === area.id);
              const areaSubs = expandedSubSections[area.id] || {};

              return (
                <div
                  key={area.id}
                  ref={(el) => {
                    areaCardRefs.current[area.id] = el;
                  }}
                  id={`area-card-${area.id}`}
                  className={`scroll-mt-24 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? "border-[#6D5AE6] bg-[#221A42] shadow-lg shadow-[#6D5AE6]/15 ring-2 ring-[#6D5AE6]"
                      : isBlocked
                      ? "border-red-900/50 bg-[#140D1D] opacity-80"
                      : "border-[#2E2748] bg-[#191430] hover:border-[#2E2748]/90"
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-[#6D5AE6]/20 border border-[#6D5AE6]/40 px-2 py-0.5 font-mono text-xs font-bold text-[#FFB84D]">
                            {area.id}
                          </span>
                          {getConstraintBadge(area.constraintFit.status)}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 rounded bg-[#FFB84D]/20 border border-[#FFB84D]/40 px-2 py-0.5 text-[12px] font-bold text-[#FFB84D]">
                              <Check className="h-3 w-3" />
                              AREA TERPILIH
                            </span>
                          )}
                          {isBlocked && (
                            <span className="inline-flex items-center gap-1 rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[12px] font-bold text-red-300">
                              <ShieldX className="h-3 w-3" />
                              Diblokir
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#FBFAFF] leading-snug break-words">
                          {area.name}
                        </h3>
                      </div>

                      {/* Desktop Quick Select Button */}
                      <div className="hidden sm:block shrink-0">
                        <button
                          type="button"
                          id={`btn-select-area-desktop-${area.id}`}
                          disabled={isBlocked}
                          onClick={() => setSelectedAreaId(area.id)}
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] ${
                            isBlocked
                              ? "bg-red-950/40 border border-red-800/40 text-red-400 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "bg-[#FFB84D] text-[#0C0A1A] shadow-md shadow-[#FFB84D]/20 font-bold"
                              : "border border-[#2E2748] bg-[#221A42] text-[#FBFAFF] hover:bg-[#6D5AE6]/20 hover:border-[#6D5AE6]"
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <ShieldX className="h-4 w-4" aria-hidden="true" />
                              <span>Area Diblokir</span>
                            </>
                          ) : isSelected ? (
                            <>
                              <Check className="h-4 w-4" aria-hidden="true" />
                              <span>Area Terpilih</span>
                            </>
                          ) : (
                            <>
                              <span>Pilih Area Ini</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Cakupan Singkat with Line Clamp & Read More */}
                    <div className="rounded-lg bg-[#0C0A1A]/70 p-3.5 border border-[#2E2748]/70 text-xs text-[#A79FC4] space-y-1">
                      <span className="font-semibold text-[#FBFAFF] block text-[13px]">Cakupan Area:</span>
                      <p className={`leading-relaxed text-[13px] ${isScopeLong && !isScopeOpen ? "line-clamp-2" : ""}`}>
                        {area.scopeSummary}
                      </p>
                      {isScopeLong && (
                        <button
                          type="button"
                          onClick={() => toggleScope(area.id)}
                          className="text-[12px] font-semibold text-[#6D5AE6] hover:text-[#FFB84D] transition-colors pt-0.5 block cursor-pointer"
                        >
                          {isScopeOpen ? "Tutup ringkasan" : "Baca selengkapnya"}
                        </button>
                      )}
                    </div>

                    {/* Core Summary: 2 Columns on Desktop, 1 Column on Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Left Column: Context & Academic */}
                      <div className="space-y-2 rounded-lg bg-[#0C0A1A]/40 p-3 border border-[#2E2748]/50 flex flex-col justify-between">
                        <div>
                          <span className="font-semibold text-[#FBFAFF] text-[13px] block">Hubungan dengan Minat:</span>
                          <p className="text-[13px] text-[#A79FC4] mt-0.5 leading-relaxed">{area.interestConnection}</p>
                        </div>
                        <div className="pt-2 border-t border-[#2E2748]/40">
                          <span className="font-semibold text-[#FBFAFF] text-[13px] block">Keterkaitan Program Studi:</span>
                          <p className="text-[13px] text-[#A79FC4] mt-0.5 leading-relaxed">{area.academicConnection}</p>
                        </div>
                      </div>

                      {/* Right Column: Feasibility & Next Check */}
                      <div className="space-y-2 rounded-lg bg-[#0C0A1A]/40 p-3 border border-[#2E2748]/50 flex flex-col justify-between">
                        {comp && (
                          <div>
                            <span className="font-semibold text-[#FBFAFF] text-[13px] block mb-1">Ringkasan Kelayakan:</span>
                            <div className="flex flex-wrap gap-1.5 text-[12px]">
                              <div className="flex items-center gap-1 rounded bg-[#191430] border border-[#2E2748] px-2 py-0.5">
                                <span className="text-[#A79FC4]">Data:</span>
                                {renderFitRatingBadge(comp.dataFit)}
                              </div>
                              <div className="flex items-center gap-1 rounded bg-[#191430] border border-[#2E2748] px-2 py-0.5">
                                <span className="text-[#A79FC4]">Beban:</span>
                                {renderFitRatingBadge(comp.collectionBurden)}
                              </div>
                              <div className="flex items-center gap-1 rounded bg-[#191430] border border-[#2E2748] px-2 py-0.5">
                                <span className="text-[#A79FC4]">Uncertainty:</span>
                                {renderFitRatingBadge(comp.methodologicalUncertainty)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Main Risks (max 2 points) */}
                        {area.constraintFit.risks && area.constraintFit.risks.length > 0 && (
                          <div className="pt-1.5 border-t border-[#2E2748]/40">
                            <span className="font-semibold text-[#FF5C8A] text-[13px] block">Risiko Utama:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-[13px] text-[#A79FC4] mt-0.5">
                              {area.constraintFit.risks.slice(0, 2).map((rk, rkIdx) => (
                                <li key={rkIdx} className="leading-snug">{rk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Pemeriksaan Berikutnya */}
                        {comp?.mainCheckNext && (
                          <div className="pt-1.5 border-t border-[#2E2748]/40 text-[13px]">
                            <span className="font-semibold text-[#FF9E5E] block">Pemeriksaan Berikutnya:</span>
                            <p className="text-[#FBFAFF] mt-0.5 leading-snug">{comp.mainCheckNext}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Select Area Button (Full Width) */}
                    <div className="block sm:hidden pt-1">
                      <button
                        type="button"
                        id={`btn-select-area-mobile-${area.id}`}
                        disabled={isBlocked}
                        onClick={() => setSelectedAreaId(area.id)}
                        className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] ${
                          isBlocked
                            ? "bg-red-950/40 border border-red-800/40 text-red-400 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "bg-[#FFB84D] text-[#0C0A1A] shadow-md shadow-[#FFB84D]/20 font-bold"
                            : "border border-[#2E2748] bg-[#221A42] text-[#FBFAFF] hover:bg-[#6D5AE6]/20 hover:border-[#6D5AE6]"
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <ShieldX className="h-4 w-4" aria-hidden="true" />
                            <span>Area Diblokir</span>
                          </>
                        ) : isSelected ? (
                          <>
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span>Area Ini Terpilih</span>
                          </>
                        ) : (
                          <>
                            <span>Pilih Area Ini</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Main Accordion Trigger: Lihat Detail Area Lengkap */}
                    <div className="pt-2 border-t border-[#2E2748]">
                      <button
                        type="button"
                        id={`btn-toggle-details-${area.id}`}
                        onClick={() => toggleAreaDetails(area.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`details-panel-${area.id}`}
                        className="w-full flex items-center justify-between rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-4 py-3 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] hover:border-[#6D5AE6]/50 transition-colors cursor-pointer min-h-[44px]"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-[#6D5AE6]" aria-hidden="true" />
                          <span>{isExpanded ? "Tutup Detail Area Lengkap" : "Lihat Detail Area Lengkap"}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#A79FC4]" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#A79FC4]" aria-hidden="true" />
                        )}
                      </button>

                      {/* Deep-Dive Sub-accordions Container */}
                      {isExpanded && (
                        <div
                          id={`details-panel-${area.id}`}
                          className="mt-3 space-y-2.5 animate-fade-in text-xs"
                        >
                          {/* Sub-Accordion 1: Asal dan Kebutuhan Data */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "dataProvenance")}
                              aria-expanded={!!areaSubs.dataProvenance}
                              aria-controls={`sub-dp-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <Database className="h-3.5 w-3.5 text-[#6D5AE6]" aria-hidden="true" />
                                <span>Asal dan Kebutuhan Data</span>
                              </span>
                              {areaSubs.dataProvenance ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.dataProvenance && (
                              <div id={`sub-dp-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-2 text-xs">
                                {area.dataProvenance && area.dataProvenance.length > 0 ? (
                                  <div className="space-y-2">
                                    {area.dataProvenance.map((dp, dpIdx) => (
                                      <div key={dpIdx} className="rounded bg-[#191430] p-2.5 border border-[#2E2748]/70 text-xs space-y-1">
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          <span className="font-semibold text-[#FBFAFF]">{dp.dataForm}</span>
                                          <div className="flex items-center gap-1">
                                            {getDataOriginBadge(dp.origin)}
                                            {getAccessStatusBadge(dp.accessStatus)}
                                          </div>
                                        </div>
                                        {dp.methodologicalNote && (
                                          <p className="text-[13px] text-[#A79FC4]">{dp.methodologicalNote}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[13px] text-[#A79FC4]">Informasi asal data belum tersedia untuk area ini.</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Accordion 2: Konteks Riset yang Mungkin Diamati */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "researchContext")}
                              aria-expanded={!!areaSubs.researchContext}
                              aria-controls={`sub-rc-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                                <span>Konteks Riset yang Mungkin Diamati</span>
                              </span>
                              {areaSubs.researchContext ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.researchContext && (
                              <div id={`sub-rc-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-2 text-xs">
                                {area.researchContext ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                                    {area.researchContext.potentialActors.length > 0 && (
                                      <div className="rounded bg-[#191430] p-2 border border-[#2E2748]">
                                        <span className="flex items-center gap-1 text-[#FFB84D] font-semibold mb-1">
                                          <Users className="h-3 w-3" /> Aktor
                                        </span>
                                        <span className="text-[#FBFAFF]">{area.researchContext.potentialActors.join(", ")}</span>
                                      </div>
                                    )}
                                    {area.researchContext.potentialEntities.length > 0 && (
                                      <div className="rounded bg-[#191430] p-2 border border-[#2E2748]">
                                        <span className="flex items-center gap-1 text-[#6D5AE6] font-semibold mb-1">
                                          <Building className="h-3 w-3" /> Entitas / Objek
                                        </span>
                                        <span className="text-[#FBFAFF]">{area.researchContext.potentialEntities.join(", ")}</span>
                                      </div>
                                    )}
                                    {area.researchContext.potentialDocuments.length > 0 && (
                                      <div className="rounded bg-[#191430] p-2 border border-[#2E2748]">
                                        <span className="flex items-center gap-1 text-amber-400 font-semibold mb-1">
                                          <FileCheck className="h-3 w-3" /> Dokumen
                                        </span>
                                        <span className="text-[#FBFAFF]">{area.researchContext.potentialDocuments.join(", ")}</span>
                                      </div>
                                    )}
                                    {area.researchContext.potentialDataArtifacts.length > 0 && (
                                      <div className="rounded bg-[#191430] p-2 border border-[#2E2748]">
                                        <span className="flex items-center gap-1 text-purple-400 font-semibold mb-1">
                                          <BarChart2 className="h-3 w-3" /> Artefak Data
                                        </span>
                                        <span className="text-[#FBFAFF]">{area.researchContext.potentialDataArtifacts.join(", ")}</span>
                                      </div>
                                    )}
                                    {area.researchContext.potentialGeographies.length > 0 && (
                                      <div className="col-span-full rounded bg-[#191430] p-2 border border-[#2E2748]">
                                        <span className="flex items-center gap-1 text-[#A79FC4] font-semibold mb-0.5">
                                          <MapPin className="h-3 w-3" /> Geografi
                                        </span>
                                        <span className="text-[#FBFAFF]">{area.researchContext.potentialGeographies.join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[13px] text-[#A79FC4]">Konteks riset belum tersedia untuk area ini.</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Accordion 3: Batas Ruang Lingkup */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "scopeBoundary")}
                              aria-expanded={!!areaSubs.scopeBoundary}
                              aria-controls={`sub-sb-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <Target className="h-3.5 w-3.5 text-[#FF9E5E]" aria-hidden="true" />
                                <span>Batas Area (In-Scope / Out-of-Scope)</span>
                              </span>
                              {areaSubs.scopeBoundary ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.scopeBoundary && (
                              <div id={`sub-sb-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-2 text-xs">
                                {area.scopeBoundary ? (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                                      <div className="space-y-1 rounded bg-[#191430] p-2.5 border border-[#2E2748]">
                                        <span className="text-[#FFB84D] font-semibold block">Termasuk (In-Scope):</span>
                                        <ul className="list-disc list-inside space-y-0.5 text-[#FBFAFF]">
                                          {area.scopeBoundary.inScope.map((item, sIdx) => (
                                            <li key={sIdx}>{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="space-y-1 rounded bg-[#191430] p-2.5 border border-[#2E2748]">
                                        <span className="text-[#FF5C8A] font-semibold block">Di Luar (Out-of-Scope):</span>
                                        <ul className="list-disc list-inside space-y-0.5 text-[#A79FC4]">
                                          {area.scopeBoundary.outOfScope.map((item, sIdx) => (
                                            <li key={sIdx}>{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                    {area.scopeBoundary.boundaryNote && (
                                      <p className="text-[12px] text-[#A79FC4] border-t border-[#2E2748] pt-1.5">
                                        <strong>Catatan Batas:</strong> {area.scopeBoundary.boundaryNote}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[13px] text-[#A79FC4]">Batas ruang lingkup belum tersedia.</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Accordion 4: Arah Pencarian Fenomena */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "phenomenonDirections")}
                              aria-expanded={!!areaSubs.phenomenonDirections}
                              aria-controls={`sub-pd-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <Search className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                                <span>Arah Pencarian Fenomena Empiris</span>
                              </span>
                              {areaSubs.phenomenonDirections ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.phenomenonDirections && (
                              <div id={`sub-pd-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-3 text-xs text-[#A79FC4]">
                                <div>
                                  <p className="font-semibold text-[#FBFAFF] mb-1">Ringkasan Arah Pencarian:</p>
                                  <p className="text-[13px] leading-relaxed">{area.phenomenonSearchBrief}</p>
                                </div>
                                {area.phenomenonSearchDirections.length > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="font-semibold text-[#FBFAFF] text-[13px]">
                                      Petunjuk Pemeriksaan Fenomena Empiris:
                                    </p>
                                    {area.phenomenonSearchDirections.map((dir, dIdx) => (
                                      <div key={dIdx} className="rounded bg-[#191430] p-2.5 border border-[#2E2748] space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="font-semibold text-[#FFB84D] text-[13px]">
                                            {dir.label}: {dir.searchQuestion}
                                          </p>
                                          <span className="rounded bg-[#6D5AE6]/20 px-1.5 py-0.5 text-[11px] font-mono text-[#6D5AE6]">
                                            {dir.directionType}
                                          </span>
                                        </div>
                                        {dir.observableSignals.length > 0 && (
                                          <p className="text-[13px]">
                                            <span className="text-[#FBFAFF]">Sinyal Teramati:</span> {dir.observableSignals.join(", ")}
                                          </p>
                                        )}
                                        {dir.prioritySourceTypes.length > 0 && (
                                          <p className="text-[13px]">
                                            <span className="text-[#FBFAFF]">Sumber Prioritas:</span> {dir.prioritySourceTypes.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Accordion 5: Bibit Pencarian Literatur */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "literatureSeeds")}
                              aria-expanded={!!areaSubs.literatureSeeds}
                              aria-controls={`sub-ls-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 text-[#6D5AE6]" aria-hidden="true" />
                                <span>Bibit Pencarian Literatur Nanti (Tool 3)</span>
                              </span>
                              {areaSubs.literatureSeeds ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.literatureSeeds && (
                              <div id={`sub-ls-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-2 text-xs">
                                {area.literatureSearchSeeds ? (
                                  <div className="rounded bg-[#191430] p-3 border border-[#2E2748] space-y-2">
                                    {area.literatureSearchSeeds.concepts.length > 0 && (
                                      <div>
                                        <span className="text-[12px] text-[#A79FC4] uppercase block">Konsep:</span>
                                        <p className="text-[13px] text-[#FBFAFF]">{area.literatureSearchSeeds.concepts.join(", ")}</p>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-[12px] text-[#A79FC4] uppercase block mb-1">Kata Kunci:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {area.literatureSearchSeeds.keywordsId.map((k, kIdx) => (
                                          <span
                                            key={kIdx}
                                            className="rounded bg-[#221A42] border border-[#2E2748] px-2 py-0.5 text-[12px] text-[#FFB84D]"
                                          >
                                            ID: {k}
                                          </span>
                                        ))}
                                        {area.literatureSearchSeeds.keywordsEn.map((k, kIdx) => (
                                          <span
                                            key={kIdx}
                                            className="rounded bg-[#221A42] border border-[#2E2748] px-2 py-0.5 text-[12px] text-[#6D5AE6]"
                                          >
                                            EN: {k}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[13px] text-[#A79FC4]">Bibit literatur belum tersedia.</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Accordion 6: Gambaran Bentuk Penelitian */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "shapePreview")}
                              aria-expanded={!!areaSubs.shapePreview}
                              aria-controls={`sub-sp-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                                <span>Gambaran Bentuk Penelitian</span>
                                <span className="ml-1 rounded bg-[#6D5AE6]/20 border border-[#6D5AE6]/40 px-1.5 py-0.2 font-mono text-[11px] font-bold text-[#FFB84D]">
                                  BELUM MENJADI JUDUL
                                </span>
                              </span>
                              {areaSubs.shapePreview ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.shapePreview && (
                              <div id={`sub-sp-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-3 text-xs text-[#A79FC4]">
                                {area.researchShapePreview ? (
                                  <>
                                    {area.researchShapePreview.possibleFocus && (
                                      <div>
                                        <p className="font-semibold text-[#FBFAFF] mb-0.5">Kemungkinan Fokus:</p>
                                        <p className="text-[13px] leading-relaxed">{area.researchShapePreview.possibleFocus}</p>
                                      </div>
                                    )}

                                    {area.researchShapePreview.likelyEvidenceNeeded.length > 0 && (
                                      <div>
                                        <p className="font-semibold text-[#FBFAFF] mb-0.5">Bukti yang Kemungkinan Dibutuhkan:</p>
                                        <ul className="list-disc list-inside space-y-0.5 text-[13px]">
                                          {area.researchShapePreview.likelyEvidenceNeeded.map((ev, evIdx) => (
                                            <li key={evIdx}>{ev}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {area.researchShapePreview.illustrativeTitlePattern && (
                                      <div className="rounded bg-[#191430] p-2.5 border border-[#2E2748] space-y-1">
                                        <span className="text-[12px] font-semibold uppercase text-[#A79FC4] block">
                                          Pola Judul Ilustratif:
                                        </span>
                                        <p className="font-mono text-xs text-[#FFB84D] italic">
                                          &ldquo;{area.researchShapePreview.illustrativeTitlePattern}&rdquo;
                                        </p>
                                      </div>
                                    )}

                                    {area.researchShapePreview.unresolvedBeforeTitle.length > 0 && (
                                      <div>
                                        <p className="font-semibold text-[#FF9E5E] mb-0.5">Hal yang Harus Diperiksa Sebelum Menjadi Judul:</p>
                                        <ul className="list-disc list-inside space-y-0.5 text-[13px]">
                                          {area.researchShapePreview.unresolvedBeforeTitle.map((un, unIdx) => (
                                            <li key={unIdx}>{un}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    <div className="rounded bg-[#FF9E5E]/10 border border-[#FF9E5E]/30 p-2 text-[12px] text-[#FF9E5E] flex items-center gap-1.5">
                                      <Info className="h-3 w-3 shrink-0" />
                                      <span>{area.researchShapePreview.warning || "Ilustrasi bentuk judul — belum layak diajukan ke dosen."}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="rounded bg-[#191430] p-3 text-[13px] text-[#A79FC4] border border-[#2E2748] flex items-start gap-2">
                                    <Info className="h-3.5 w-3.5 text-[#FF9E5E] shrink-0 mt-0.5" />
                                    <span>Preview bentuk penelitian belum dapat ditampilkan.</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Accordion 7: Asumsi, Risiko, dan Hal yang Belum Diputuskan */}
                          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSubSection(area.id, "assumptionsRisks")}
                              aria-expanded={!!areaSubs.assumptionsRisks}
                              aria-controls={`sub-ar-${area.id}`}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors cursor-pointer min-h-[40px]"
                            >
                              <span className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-[#FF5C8A]" aria-hidden="true" />
                                <span>Asumsi, Risiko, dan Hal yang Belum Diputuskan</span>
                              </span>
                              {areaSubs.assumptionsRisks ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                              )}
                            </button>
                            {areaSubs.assumptionsRisks && (
                              <div id={`sub-ar-${area.id}`} className="p-3.5 border-t border-[#2E2748] space-y-2.5 text-xs text-[#A79FC4]">
                                {area.constraintFit.reason && (
                                  <div>
                                    <p className="font-semibold text-[#FBFAFF]">Analisis Kesesuaian:</p>
                                    <p className="text-[13px] leading-relaxed">{area.constraintFit.reason}</p>
                                  </div>
                                )}
                                {area.constraintFit.risks.length > 0 && (
                                  <div>
                                    <p className="font-semibold text-[#FF5C8A]">Risiko Lengkap:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-[13px]">
                                      {area.constraintFit.risks.map((r, rIdx) => (
                                        <li key={rIdx}>{r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {area.unresolvedItems.length > 0 && (
                                  <div>
                                    <p className="font-semibold text-[#FF9E5E]">Hal yang Belum Pasti:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-[13px]">
                                      {area.unresolvedItems.map((u, uIdx) => (
                                        <li key={uIdx}>{u}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {area.notDecided.length > 0 && (
                                  <div>
                                    <p className="font-semibold text-[#A79FC4]">Belum Boleh Diputuskan:</p>
                                    <p className="text-[13px] text-[#A79FC4]/80">{area.notDecided.join(", ")}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons Bottom: Belum Ada yang Cocok & Bantu Pilihkan Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              id="btn-rejection-modal-bottom"
              onClick={handleOpenRejectionModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2748] bg-[#191430] px-4 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] hover:border-[#6D5AE6]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#FF9E5E]" aria-hidden="true" />
              <span>Belum Ada yang Cocok</span>
            </button>

            <button
              type="button"
              id="btn-auto-recommendation-bottom"
              onClick={showRecommendationPanel && isRecommendationValid ? scrollToRecommendation : handleCalculateRecommendation}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#6D5AE6]/40 bg-[#6D5AE6]/10 px-4 py-2.5 text-xs font-bold text-[#FFB84D] hover:bg-[#6D5AE6]/20 hover:border-[#6D5AE6] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] min-h-[44px]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
              <span>{showRecommendationPanel && isRecommendationValid ? "Lihat Rekomendasi Lagi" : "Bantu Pilihkan Area untuk Dicek Dulu"}</span>
            </button>
          </div>

          {/* Selected Area Summary Box & Academic Warning */}
          {selectedAreaCandidate && (
            <div className="rounded-xl border border-[#6D5AE6] bg-[#191430] p-5 sm:p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2E2748] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-[#FBFAFF]">
                    Paket Area Terpilih: {selectedAreaCandidate.name} ({selectedAreaCandidate.id})
                  </h3>
                </div>
                <span className="text-xs text-[#FFB84D] font-semibold">Siap Disimpan (V3)</span>
              </div>

              {/* Academic Principle Warning */}
              <div className="rounded-lg border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 p-3.5 text-xs text-[#FBFAFF] leading-relaxed flex items-start gap-2.5">
                <Info className="h-4 w-4 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>Prinsip Akademik:</strong> Area ini masih merupakan arah eksplorasi, bukan
                  judul atau model penelitian. Fenomena empiris, literatur, data, dan kelayakannya masih harus
                  diperiksa pada tool berikutnya.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-save-and-proceed-idea"
                  onClick={handleSaveAndProceed}
                  disabled={isStale}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#6D5AE6]/25 hover:bg-[#5A46D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191430] min-h-[44px]"
                >
                  <span>Simpan dan Lanjut ke Cari Fenomena</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Sticky Bottom Action Bar for Mobile */}
          {selectedAreaCandidate && (
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C1427]/95 backdrop-blur-md border-t border-[#6D5AE6]/50 p-3 shadow-2xl safe-bottom animate-fade-in">
              <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-[#A79FC4] uppercase tracking-wider block">
                    Area Terpilih:
                  </span>
                  <p className="text-xs font-bold text-[#FFB84D] truncate">
                    [{selectedAreaCandidate.id}] {selectedAreaCandidate.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleScrollToAreaCard(selectedAreaCandidate.id)}
                    className="rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-2 text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF] min-h-[44px] flex items-center justify-center"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndProceed}
                    disabled={isStale}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#6D5AE6] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#5A46D6] min-h-[44px] disabled:opacity-50"
                  >
                    <span>Lanjut</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Bottom Sequential Workflow Navigation */}
      <SequentialNavigation
        previousStep={tool.previousStep}
        nextStep={tool.nextStep}
        isPromptGenerated={!!selectedAreaCandidate}
      />

      {/* Confirmation Modals */}
      {showChangeIssueModal && (
        <ChangeIssueModal
          isOpen={showChangeIssueModal}
          onConfirm={(preserve) =>
            startNewIdeaExploration({ preserveProfile: preserve, reason: "CHANGE_ISSUE" })
          }
          onCancel={() => setShowChangeIssueModal(false)}
        />
      )}

      {showFullResetModal && (
        <ResetConfirmModal
          isOpen={showFullResetModal}
          onConfirm={() => {
            setShowFullResetModal(false);
            startNewIdeaExploration({ preserveProfile: false, reason: "MANUAL_RESET" });
          }}
          onCancel={() => setShowFullResetModal(false)}
          toolName="Cari Ide Skripsi"
          title="Reset Seluruh Data Cari Ide?"
          description="Tindakan ini akan menghapus input formulir, hasil yang ditempel, riwayat putaran, rekomendasi, pilihan area, dan handoff aktif dari Tool Cari Ide. Data yang sudah tersimpan pada tool berikutnya tidak ikut dihapus."
          confirmButtonText="Reset Tool Cari Ide"
        />
      )}

      {showResetModal && (
        <ResetConfirmModal
          isOpen={showResetModal}
          onConfirm={handleResetForm}
          onCancel={() => setShowResetModal(false)}
          toolName="Cari Ide Skripsi"
          title="Reset Input Formulir?"
          description="Seluruh isian formulir profil mahasiswa akan dikembalikan ke nilai awal. Data hasil tempelan dan eksplorasi yang aktif tidak langsung dihapus."
          confirmButtonText="Ya, Reset Input"
        />
      )}

      {showResetPasteModal && (
        <ResetConfirmModal
          isOpen={showResetPasteModal}
          onConfirm={handleResetPaste}
          onCancel={() => setShowResetPasteModal(false)}
          toolName="Hasil Tempelan Cari Ide"
        />
      )}

      {showRejectionModal && (
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onSubmit={handleSubmitRejection}
        />
      )}

      {showAltPromptModal && (
        <AlternativePromptModal
          isOpen={showAltPromptModal}
          roundNumber={rejectionRounds.length}
          maxRounds={3}
          onCopyAndProceed={handleCopyAndProceedAltPrompt}
          onClose={() => setShowAltPromptModal(false)}
        />
      )}

      {fallbackModalState && (
        <ClipboardFallbackModal
          isOpen={!!fallbackModalState}
          prompt={fallbackModalState.prompt}
          targetUrl={fallbackModalState.targetUrl}
          platformName={fallbackModalState.platformName}
          onSuccess={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 3000);
          }}
          onClose={() => setFallbackModalState(null)}
        />
      )}
    </div>
  );
};
