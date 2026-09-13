"use client";

import React, { useState, useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import { 
  Tool, 
  FormField, 
  SelectedPhenomenon, 
  SharedResearchContext, 
  SelectedExplorationAreaV3, 
  SelectedExplorationAreaV2,
  IdeaToPhenomenonHandoff,
  FieldOrigin,
} from "@/types/tool";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { AutofillModal } from "./AutofillModal";
import {
  gabungKataKunci,
  siapkanIstilah,
  terjemahkanIstilah,
  type HasilTerjemahan,
} from "@/lib/istilahEn";
import { getAutofillForTool, applyAutofillValues } from "@/lib/autofill";
import { reconcileLegacyHandoff } from "@/lib/handoffValidator";
import {
  subscribeToToolData,
  getToolDataSnapshot,
  getSelectedPhenomenonSnapshot,
  getSelectedExplorationAreaSnapshot,
  getIdeaToPhenomenonHandoffSnapshot,
  loadIdeaToPhenomenonHandoff,
  savePhenomenonFieldOrigins,
  loadPhenomenonFieldOrigins,
  clearPhenomenonFieldOrigins,
  savePhenomenonAppliedHandoffFingerprint,
  loadPhenomenonAppliedHandoffFingerprint,
  getSharedResearchContextSnapshot,
  saveSharedResearchContext,
  loadSelectedExplorationArea,
} from "@/lib/storage";
import {
  Sliders,
  Sparkles,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Loader2,
  Languages,
} from "lucide-react";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface InteractiveFormProps {
  tool: Tool;
  formValues: Record<string, string>;
  errors: Record<string, string>;
  onFieldChange: (fieldId: string, value: string) => void;
  onBatchFieldChange?: (updates: Record<string, string>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  isSubmitting?: boolean;
  highlightedFieldId?: string;
}

export const InteractiveForm: React.FC<InteractiveFormProps> = ({
  tool,
  formValues,
  errors,
  onFieldChange,
  onBatchFieldChange,
  onSubmit,
  onReset,
  highlightedFieldId,
}) => {
  const isMounted = useIsMounted();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());
  const [tempModeConfirmed, setTempModeConfirmed] = useState(false);
  const [showTempContinueOptions, setShowTempContinueOptions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [fieldOrigins, setFieldOrigins] = useState<Record<string, FieldOrigin>>(() => {
    return typeof window !== "undefined" ? loadPhenomenonFieldOrigins() : {};
  });
  const [appliedHandoffFp, setAppliedHandoffFp] = useState<string>(() => {
    return typeof window !== "undefined" ? loadPhenomenonAppliedHandoffFingerprint() : "";
  });

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
      // ignore
    }
    return loadIdeaToPhenomenonHandoff();
  }, [ideaHandoffRaw]);

  const selectedPhenomenonRaw = useSyncExternalStore(
    subscribeToToolData,
    getSelectedPhenomenonSnapshot,
    () => "null"
  );

  const selectedPhenomenon = useMemo(() => {
    try {
      const parsed = JSON.parse(selectedPhenomenonRaw);
      if (typeof parsed === "object" && parsed !== null && parsed.schemaVersion === 1) {
        return parsed as SelectedPhenomenon;
      }
    } catch {
      // ignore
    }
    return null;
  }, [selectedPhenomenonRaw]);

  const sharedContextRaw = useSyncExternalStore(
    subscribeToToolData,
    getSharedResearchContextSnapshot,
    () => "null"
  );

  const sharedContext = useMemo(() => {
    try {
      const parsed = JSON.parse(sharedContextRaw);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as SharedResearchContext;
      }
    } catch {
      // ignore
    }
    return null;
  }, [sharedContextRaw]);

  const selectedExplorationAreaRaw = useSyncExternalStore(
    subscribeToToolData,
    getSelectedExplorationAreaSnapshot,
    () => "null"
  );

  const selectedExplorationArea = useMemo(() => {
    try {
      const parsed = JSON.parse(selectedExplorationAreaRaw);
      if (parsed && typeof parsed === "object") {
        if (parsed.schemaVersion === 3 || parsed.schemaVersion === 2) {
          return parsed as SelectedExplorationAreaV3 | SelectedExplorationAreaV2;
        }
      }
    } catch {
      // ignore
    }
    return loadSelectedExplorationArea();
  }, [selectedExplorationAreaRaw]);

  const isHandoffNewer = useMemo(() => {
    if (!ideaHandoff) return false;
    return ideaHandoff.sourcePayloadFingerprint !== appliedHandoffFp;
  }, [ideaHandoff, appliedHandoffFp]);

  const hasUserEditedFields = useMemo(() => {
    if (tool.slug !== "cari-fenomena-awal") return false;
    return Object.entries(fieldOrigins).some(
      ([k, origin]) => origin === "USER_EDITED" && (formValues[k] || "").trim().length > 0
    );
  }, [tool.slug, fieldOrigins, formValues]);

  React.useEffect(() => {
    if (!isMounted || tool.slug !== "cari-fenomena-awal" || !ideaHandoff) return;
    if (ideaHandoff.sourcePayloadFingerprint === appliedHandoffFp) return;

    const anyUserEdited = Object.entries(fieldOrigins).some(
      ([k, origin]) => origin === "USER_EDITED" && (formValues[k] || "").trim().length > 0
    );

    if (!anyUserEdited) {
      const autofillResult = getAutofillForTool("cari-fenomena-awal", formValues);
      if (autofillResult.hasData) {
        const newValues = applyAutofillValues(formValues, autofillResult.data, "overwrite");
        const updatedOrigins: Record<string, FieldOrigin> = {};
        Object.keys(autofillResult.data).forEach((k) => {
          updatedOrigins[k] = "AUTOFILL_IDEA";
        });
        savePhenomenonFieldOrigins(updatedOrigins);
        savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);

        const timer = setTimeout(() => {
          if (onBatchFieldChange) {
            onBatchFieldChange(newValues);
          } else {
            Object.entries(newValues).forEach(([k, v]) => onFieldChange(k, v));
          }
          setFieldOrigins(updatedOrigins);
          setAppliedHandoffFp(ideaHandoff.sourcePayloadFingerprint);
          setAutofilledFields(new Set(Object.keys(autofillResult.data)));
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isMounted, tool.slug, ideaHandoff, appliedHandoffFp, fieldOrigins, formValues, onBatchFieldChange, onFieldChange]);

  const handleApplyAllNewHandoff = () => {
    if (!ideaHandoff) return;
    const autofillResult = getAutofillForTool("cari-fenomena-awal", formValues);
    if (autofillResult.hasData) {
      const newValues = applyAutofillValues(formValues, autofillResult.data, "overwrite");
      if (onBatchFieldChange) {
        onBatchFieldChange(newValues);
      } else {
        Object.entries(newValues).forEach(([k, v]) => onFieldChange(k, v));
      }
      const updatedOrigins: Record<string, FieldOrigin> = {};
      Object.keys(autofillResult.data).forEach((k) => {
        updatedOrigins[k] = "AUTOFILL_IDEA";
      });
      setFieldOrigins(updatedOrigins);
      savePhenomenonFieldOrigins(updatedOrigins);
      setAppliedHandoffFp(ideaHandoff.sourcePayloadFingerprint);
      savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
      setAutofilledFields(new Set(Object.keys(autofillResult.data)));
      setToastMessage("Seluruh data area terbaru berhasil diterapkan.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleKeepManualEdits = () => {
    if (!ideaHandoff) return;
    setAppliedHandoffFp(ideaHandoff.sourcePayloadFingerprint);
    savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
    setToastMessage("Isian manual kamu dipertahankan.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInputChange = (fieldId: string, val: string) => {
    if (tool.slug === "cari-fenomena-awal") {
      const updated: Record<string, FieldOrigin> = { ...fieldOrigins, [fieldId]: "USER_EDITED" };
      setFieldOrigins(updated);
      savePhenomenonFieldOrigins(updated);
    }
    onFieldChange(fieldId, val);
  };

  const [showLiteratureSeedsCard, setShowLiteratureSeedsCard] = useState(true);

  const seedKeywords = useMemo(() => {
    if (!selectedExplorationArea) return [];
    if (selectedExplorationArea.schemaVersion === 3 && selectedExplorationArea.literatureSearchSeeds) {
      const { keywordsId = [], keywordsEn = [] } = selectedExplorationArea.literatureSearchSeeds;
      return [...keywordsId, ...keywordsEn].filter(Boolean);
    }
    if (selectedExplorationArea.schemaVersion === 2) {
      const v2Area = selectedExplorationArea as SelectedExplorationAreaV2;
      const kId = v2Area.keywordsId || [];
      const kEn = v2Area.keywordsEn || [];
      return [...kId, ...kEn].filter(Boolean);
    }
    return [];
  }, [selectedExplorationArea]);

  const handleApplyLiteratureSeeds = () => {
    if (seedKeywords.length === 0) return;
    const combined = seedKeywords.slice(0, 3).join(", ");
    handleInputChange("kata_kunci", combined);
    setToastMessage("Seed kata kunci berhasil disalin ke Kata Kunci Khusus.");
    setTimeout(() => setToastMessage(null), 3000);
    setShowLiteratureSeedsCard(false);
  };

  // Terjemahan istilah: kata kunci Indonesia tidak menemukan apa pun di Google
  // Scholar karena literatur internasional memakai istilah Inggris.
  const [terjemahan, setTerjemahan] = useState<HasilTerjemahan[] | null>(null);
  const [sedangTerjemah, setSedangTerjemah] = useState(false);
  const [terjemahGagal, setTerjemahGagal] = useState(false);

  const handleTerjemahkanIstilah = async () => {
    const daftar = siapkanIstilah(seedKeywords);
    if (daftar.length === 0) return;
    setSedangTerjemah(true);
    setTerjemahGagal(false);
    try {
      const hasil = await Promise.all(daftar.map((t) => terjemahkanIstilah(t)));
      // Kalau SEMUA gagal (kuota habis/jaringan), katakan apa adanya — jangan
      // menampilkan daftar kosong seolah tidak ada padanan.
      if (hasil.every((h) => !h.inggris)) {
        setTerjemahan(null);
        setTerjemahGagal(true);
      } else {
        setTerjemahan(hasil);
      }
    } catch {
      setTerjemahan(null);
      setTerjemahGagal(true);
    } finally {
      setSedangTerjemah(false);
    }
  };

  const handlePakaiTerjemahan = () => {
    if (!terjemahan) return;
    handleInputChange("kata_kunci", gabungKataKunci(terjemahan));
    setToastMessage("Kata kunci Indonesia + Inggris sudah masuk ke Kata Kunci Khusus.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const sourceSlug =
    tool.slug === "cari-fenomena-awal"
      ? "cari-ide-skripsi"
      : tool.slug === "cari-literatur-awal"
      ? "cari-fenomena-awal"
      : tool.slug === "bedah-hasil-notebooklm"
      ? "cari-literatur-awal"
      : "";

  const sourceSnapshot = useSyncExternalStore(
    subscribeToToolData,
    () => (sourceSlug ? getToolDataSnapshot(sourceSlug) : "{}"),
    () => "{}"
  );

  const autofillData = useMemo(() => {
    if (!sourceSlug || !sourceSnapshot) return null;
    if (selectedPhenomenonRaw === "invalid" && sharedContextRaw === "invalid") return null;
    const res = getAutofillForTool(tool.slug, formValues);
    return res.hasData || res.legacyItems.length > 0 ? res : null;
  }, [tool.slug, formValues, sourceSlug, sourceSnapshot, selectedPhenomenonRaw, sharedContextRaw]);

  const hasAnyValues = Object.values(formValues).some(
    (v) => typeof v === "string" && v.trim().length > 0 && v !== "unknown"
  );

  const handleResetClick = () => {
    if (hasAnyValues) {
      setShowResetModal(true);
    } else {
      onReset();
    }
  };

  const handleConfirmReset = () => {
    setShowResetModal(false);
    setAutofilledFields(new Set());
    if (tool.slug === "cari-fenomena-awal") {
      clearPhenomenonFieldOrigins();
      setFieldOrigins({});
      setAppliedHandoffFp("");
      savePhenomenonAppliedHandoffFingerprint("");
    }
    onReset();
  };

  const handleTriggerAutofill = () => {
    const latest = getAutofillForTool(tool.slug, formValues);
    if (!latest || !latest.hasData) return;

    const hasConflicts = latest.previewItems.some(
      (item) =>
        item.currentValue &&
        item.currentValue !== "unknown" &&
        item.currentValue.trim() !== item.newValue.trim()
    );

    if (hasConflicts) {
      setShowAutofillModal(true);
    } else {
      const newValues = applyAutofillValues(formValues, latest.data, "overwrite");
      if (onBatchFieldChange) {
        onBatchFieldChange(newValues);
      } else {
        Object.entries(newValues).forEach(([k, v]) => handleInputChange(k, v));
      }
      const affected = new Set(Object.keys(latest.data));
      setAutofilledFields(affected);

      if (tool.slug === "cari-fenomena-awal") {
        const updatedOrigins: Record<string, FieldOrigin> = {};
        Object.keys(latest.data).forEach((k) => {
          updatedOrigins[k] = "AUTOFILL_IDEA";
        });
        setFieldOrigins(updatedOrigins);
        savePhenomenonFieldOrigins(updatedOrigins);
        if (ideaHandoff) {
          setAppliedHandoffFp(ideaHandoff.sourcePayloadFingerprint);
          savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
        }
      }

      if (newValues.fenomena_awal && newValues.fenomena_awal.trim().length > 0) {
        setToastMessage("Data fenomena berhasil dimasukkan ke Cari Literatur.");
        setTimeout(() => setToastMessage(null), 3500);
      }
    }
  };

  const handleApplyAutofill = (mode: "fill_empty" | "overwrite") => {
    const latest = getAutofillForTool(tool.slug, formValues);
    if (!latest || !latest.hasData) return;
    const newValues = applyAutofillValues(formValues, latest.data, mode);

    if (onBatchFieldChange) {
      onBatchFieldChange(newValues);
    } else {
      Object.entries(newValues).forEach(([key, val]) => {
        if (val !== formValues[key]) {
          handleInputChange(key, val);
        }
      });
    }

    const affected = new Set<string>();
    Object.entries(newValues).forEach(([k, v]) => {
      if (v && latest.data[k]) affected.add(k);
    });

    if (tool.slug === "cari-fenomena-awal") {
      const updatedOrigins = { ...fieldOrigins };
      Object.keys(latest.data).forEach((k) => {
        if (newValues[k]) updatedOrigins[k] = "AUTOFILL_IDEA";
      });
      setFieldOrigins(updatedOrigins);
      savePhenomenonFieldOrigins(updatedOrigins);
      if (ideaHandoff) {
        setAppliedHandoffFp(ideaHandoff.sourcePayloadFingerprint);
        savePhenomenonAppliedHandoffFingerprint(ideaHandoff.sourcePayloadFingerprint);
      }
    }

    setAutofilledFields(affected);
    setShowAutofillModal(false);

    if (newValues.fenomena_awal && newValues.fenomena_awal.trim().length > 0) {
      setToastMessage("Data fenomena berhasil dimasukkan ke Cari Literatur.");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleReconcileAndApplyAutofill = () => {
    const latest = getAutofillForTool(tool.slug, formValues);
    if (!latest.hasData) return;

    const reconciledData = reconcileLegacyHandoff(tool.slug, latest.data);
    const newValues = applyAutofillValues(formValues, reconciledData, "overwrite");

    if (onBatchFieldChange) {
      onBatchFieldChange(newValues);
    } else {
      Object.entries(newValues).forEach(([k, v]) => onFieldChange(k, v));
    }

    setShowAutofillModal(false);
    setToastMessage("Data lama berhasil disesuaikan dengan batas langkah ini.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleProceedTemporary = () => {
    setTempModeConfirmed(true);
    setShowTempContinueOptions(false);
    saveSharedResearchContext({
      ...sharedContext,
      fenomena_status: "BELUM_TERVERIFIKASI",
      fenomena_ringkas: formValues.fenomena_awal || "Fenomena awal belum tervalidasi",
      lastUpdated: new Date().toISOString(),
    });
  };

  const mainFields = tool.fields.filter((f) => !f.isAdvanced);
  const advancedFields = tool.fields.filter((f) => f.isAdvanced);

  // Status badge for fenomena_awal in Tool 3
  const getPhenomenonStatusBadge = () => {
    if (selectedPhenomenon) {
      const effStatus = selectedPhenomenon.effectiveStatus || selectedPhenomenon.status;
      if (effStatus === "SIAP_DIBAWA") {
        return (
          <span className="rounded bg-[#FFB84D]/15 border border-[#FFB84D]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#FFB84D] inline-flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Bisa Dilanjutkan
          </span>
        );
      }
      if (effStatus === "PERLU_DIPERIKSA") {
        return (
          <span className="rounded bg-[#FF9E5E]/15 border border-[#FF9E5E]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF9E5E] inline-flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5" />
            Bisa Dilanjutkan dengan Catatan
          </span>
        );
      }
      if (effStatus === "JANGAN_DIGUNAKAN") {
        return (
          <span className="rounded bg-[#FF5C8A]/15 border border-[#FF5C8A]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF5C8A] inline-flex items-center gap-1">
            <ShieldAlert className="h-2.5 w-2.5" />
            Jangan Digunakan
          </span>
        );
      }
    }

    if (tempModeConfirmed || sharedContext?.fenomena_status === "BELUM_TERVERIFIKASI") {
      return (
        <span className="rounded bg-[#FF5C8A]/15 border border-[#FF5C8A]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF5C8A] inline-flex items-center gap-1">
          <ShieldAlert className="h-2.5 w-2.5" />
          Belum Tervalidasi
        </span>
      );
    }

    return null;
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.id] !== undefined ? formValues[field.id] : field.defaultValue || "";
    const fieldError = errors[field.id];
    const isHighlighted = highlightedFieldId === field.id;
    const isAutofilled = autofilledFields.has(field.id);
    const errorId = `error-${field.id}`;
    const helperId = `helper-${field.id}`;

    return (
      <div
        key={field.id}
        className={`space-y-1.5 rounded-lg p-2 transition-all ${
          isHighlighted
            ? "border border-[#FF5C8A] bg-[#FF5C8A]/10 ring-2 ring-[#FF5C8A]/30"
            : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor={field.id}
            className="flex items-center gap-2 text-xs font-semibold text-[#FBFAFF]"
          >
            <span>
              {field.label}{" "}
              {field.required ? (
                <span className="text-[#FF5C8A] font-bold" title="Wajib diisi">
                  *
                </span>
              ) : (
                <span className="text-[10px] font-normal text-[#A79FC4]">
                  (Opsional)
                </span>
              )}
            </span>
            {isMounted && isAutofilled && (
              <span className="rounded bg-[#FFB84D]/15 border border-[#FFB84D]/30 px-1.5 py-0.2 text-[9px] font-medium text-[#FFB84D]">
                Dari {autofillData?.sourceToolName || "Tool Sebelumnya"}
              </span>
            )}
            {isMounted && field.id === "fenomena_awal" && getPhenomenonStatusBadge()}
          </label>

          {/* Character counter */}
          {field.maxLength && (
            <span
              className={`text-[10px] font-mono ${
                Array.from(value).length > field.maxLength
                  ? "text-[#FF5C8A] font-bold"
                  : Array.from(value).length >= field.maxLength * 0.8
                  ? "text-amber-400 font-semibold"
                  : "text-[#A79FC4]/60"
              }`}
            >
              {Array.from(value).length} / {field.maxLength}
            </span>
          )}
        </div>

        {field.type === "textarea" ? (
          <textarea
            id={field.id}
            name={field.id}
            rows={field.id === "fenomena_awal" ? 4 : field.isAdvanced ? 2 : 3}
            value={value}
            maxLength={field.maxLength}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            aria-required={field.required}
            aria-invalid={!!fieldError}
            aria-describedby={
              fieldError ? errorId : field.helperText ? helperId : undefined
            }
            className={`w-full resize-y rounded-lg border bg-[#0C0A1A] p-3 text-xs text-[#FBFAFF] placeholder-[#A79FC4]/50 transition-colors focus:bg-[#191430] focus:outline-none focus:ring-2 ${
              fieldError || isHighlighted
                ? "border-[#FF5C8A] focus:ring-[#FF5C8A]"
                : "border-[#2E2748] focus:border-[#6D5AE6] focus:ring-[#6D5AE6]"
            }`}
          />
        ) : field.type === "select" ? (
          <select
            id={field.id}
            name={field.id}
            value={value || field.defaultValue || "unknown"}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            aria-required={field.required}
            aria-invalid={!!fieldError}
            aria-describedby={
              fieldError ? errorId : field.helperText ? helperId : undefined
            }
            className={`w-full rounded-lg border bg-[#0C0A1A] p-3 text-xs text-[#FBFAFF] transition-colors focus:bg-[#191430] focus:outline-none focus:ring-2 cursor-pointer ${
              fieldError || isHighlighted
                ? "border-[#FF5C8A] focus:ring-[#FF5C8A]"
                : "border-[#2E2748] focus:border-[#6D5AE6] focus:ring-[#6D5AE6]"
            }`}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#191430] text-[#FBFAFF]">
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.id}
            name={field.id}
            type="text"
            value={value}
            maxLength={field.maxLength}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            aria-required={field.required}
            aria-invalid={!!fieldError}
            aria-describedby={
              fieldError ? errorId : field.helperText ? helperId : undefined
            }
            className={`w-full rounded-lg border bg-[#0C0A1A] p-3 text-xs text-[#FBFAFF] placeholder-[#A79FC4]/50 transition-colors focus:bg-[#191430] focus:outline-none focus:ring-2 ${
              fieldError || isHighlighted
                ? "border-[#FF5C8A] focus:ring-[#FF5C8A]"
                : "border-[#2E2748] focus:border-[#6D5AE6] focus:ring-[#6D5AE6]"
            }`}
          />
        )}

        {/* 80% Character Limit Warning */}
        {field.maxLength && Array.from(value).length >= field.maxLength * 0.8 && Array.from(value).length <= field.maxLength && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 animate-in fade-in duration-150">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Batas ini disesuaikan dengan langkah berikutnya agar kamu tidak perlu menghapus atau meringkas ulang.</span>
          </div>
        )}

        {/* Inline Error Message */}
        {fieldError ? (
          <div
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#FF5C8A] animate-in fade-in duration-150"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{fieldError}</span>
          </div>
        ) : field.helperText || field.helperLink ? (
          <p id={helperId} className="text-[10px] text-[#A79FC4]/70">
            {field.helperText}
            {field.helperLink && (
              <Link
                href={field.helperLink.href}
                className="font-semibold text-[#FFB84D] hover:underline ml-0.5"
              >
                {field.helperLink.text}
              </Link>
            )}
          </p>
        ) : null}

        {/* Warning alert under fenomena_awal if status is PERLU_DIPERIKSA */}
        {isMounted && field.id === "fenomena_awal" && (selectedPhenomenon?.status === "PERLU_DIPERIKSA" || formValues.status_fenomena === "PERLU_DIPERIKSA") && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 p-2 text-[11px] text-[#FBFAFF]">
            <AlertTriangle className="h-3.5 w-3.5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Fenomena ini masih memiliki bukti yang perlu diperiksa. Gunakan literatur untuk memperkuat atau mengoreksi konteksnya.</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col h-full justify-between">
        <div>
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-[#2E2748] pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#6D5AE6]" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#FBFAFF]">
                {tool.slug === "cari-literatur-awal" ? "Ceritakan Kondisimu" : "Input Data"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetClick}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A79FC4] hover:text-[#FF5C8A] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none rounded px-1.5 py-0.5 cursor-pointer"
                aria-label={`Reset seluruh formulir ${tool.name}`}
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
              <span className="text-xs font-medium text-[#A79FC4]">•</span>
              <span className="text-xs font-medium text-[#A79FC4]">
                {tool.fields.filter((f) => f.required).length} Wajib
              </span>
            </div>
          </div>

          {/* Phenomenon Data Available Banner for Tool 3 */}
          {isMounted && tool.slug === "cari-literatur-awal" && selectedPhenomenon && (
            selectedPhenomenon.phenomenonSummary && selectedPhenomenon.phenomenonSummary.trim().length > 0 ? (
              <div className="mt-4 rounded-lg border border-[#FFB84D]/40 bg-[#FFB84D]/10 p-3.5 text-xs text-[#FBFAFF] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FFB84D]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#FFB84D] shrink-0" aria-hidden="true" />
                    <span className="font-bold text-[#FBFAFF]">Data fenomena tersedia</span>
                  </div>
                  <div>
                    {getPhenomenonStatusBadge()}
                  </div>
                </div>

                <div className="text-[11px] text-[#A79FC4] space-y-0.5">
                  <p className="font-semibold text-[#FBFAFF]">
                    {selectedPhenomenon.candidateId} — {selectedPhenomenon.name}
                  </p>
                  <p className="text-[10px] text-[#A79FC4]/80">
                    {selectedPhenomenon.sourceConfirmationCount} sumber unik terkonfirmasi • Disimpan {new Date(selectedPhenomenon.updatedAt || selectedPhenomenon.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleTriggerAutofill}
                    className="rounded-md bg-[#FFB84D] px-3 py-1.5 text-xs font-bold text-[#0C0A1A] shadow-sm hover:bg-[#F0A63C] focus-visible:ring-2 focus-visible:ring-[#FFB84D] focus-visible:outline-none cursor-pointer transition-colors"
                  >
                    Gunakan Data dari Cari & Validasi Fenomena
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-[#FF9E5E]/40 bg-[#FF9E5E]/10 p-3.5 text-xs text-[#FBFAFF] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#FF9E5E]">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Data fenomena belum lengkap.</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#A79FC4]">
                  Data fenomena belum lengkap. Kembali ke Cari & Validasi Fenomena untuk menyimpan ulang kandidat.
                </p>
                <div className="pt-1">
                  <Link
                    href="/tools/cari-fenomena-awal"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#6D5AE6] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#2047D4] transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                    <span>Kembali ke Cari & Validasi Fenomena</span>
                  </Link>
                </div>
              </div>
            )
          )}

          {/* Literature Seeds Preview Card for Tool 3 */}
          {isMounted && tool.slug === "cari-literatur-awal" && selectedExplorationArea && showLiteratureSeedsCard && seedKeywords.length > 0 && (
            <div className="mt-4 rounded-lg border border-[#6D5AE6]/40 bg-[#6D5AE6]/10 p-3.5 text-xs text-[#FBFAFF] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#6D5AE6]/20 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#6D5AE6] shrink-0" aria-hidden="true" />
                  <span className="font-bold text-[#FBFAFF]">
                    Seed Literatur dari Area Terpilih ({selectedExplorationArea.areaId})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiteratureSeedsCard(false)}
                  className="text-[11px] text-[#A79FC4] hover:text-[#FBFAFF] transition-colors cursor-pointer"
                >
                  Abaikan
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {"literatureSearchSeeds" in selectedExplorationArea && selectedExplorationArea.literatureSearchSeeds?.concepts?.length > 0 && (
                  <p className="text-[#A79FC4]">
                    <strong className="text-[#FBFAFF]">Konsep Awal:</strong> {selectedExplorationArea.literatureSearchSeeds.concepts.join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <strong className="text-[#FBFAFF]">Kata Kunci Awal:</strong>
                  {seedKeywords.map((k, idx) => (
                    <span key={idx} className="rounded bg-[#221A42] border border-[#2E2748] px-1.5 py-0.5 text-[10px] text-[#FFB84D]">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleTerjemahkanIstilah}
                  disabled={sedangTerjemah}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#6D5AE6]/50 bg-[#221A42] px-3 py-1.5 text-xs font-semibold text-[#FBFAFF] hover:border-[#6D5AE6] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {sedangTerjemah ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Menerjemahkan...
                    </>
                  ) : (
                    <>
                      <Languages className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                      Cari Padanan Inggris
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleApplyLiteratureSeeds}
                  className="rounded-md bg-[#6D5AE6] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#2047D4] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] cursor-pointer transition-colors"
                >
                  Gunakan sebagai Saran Kata Kunci
                </button>
              </div>

              {terjemahGagal && (
                <p className="text-[11px] text-[#FF9E5E] pt-1 border-t border-[#6D5AE6]/20">
                  Layanan terjemahan sedang tidak menjawab (kuota harian gratis habis atau tidak ada
                  koneksi). Coba lagi nanti, atau ketik sendiri istilah Inggrisnya.
                </p>
              )}

              {terjemahan && (
                <div className="pt-2 border-t border-[#6D5AE6]/20 space-y-2">
                  <p className="text-[11px] text-[#A79FC4]">
                    Padanan Inggris — pakai ini di Google Scholar. Literatur internasional tidak
                    terindeks dengan kata Indonesia.
                  </p>
                  <ul className="space-y-1">
                    {terjemahan.map((t) => (
                      <li key={t.istilah} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-[#FBFAFF]">{t.istilah}</span>
                        <span className="text-[#A79FC4]">→</span>
                        {t.inggris ? (
                          <>
                            <span className="rounded bg-[#221A42] border border-[#2E2748] px-1.5 py-0.5 text-[10px] text-[#FFB84D]">
                              {t.inggris}
                            </span>
                            {t.dariKamus && (
                              <span className="text-[10px] text-[#A79FC4]">(istilah baku)</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-[#A79FC4]">tidak ada padanan otomatis</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handlePakaiTerjemahan}
                      className="rounded-md border border-[#FFB84D]/50 bg-[#FFB84D]/10 px-3 py-1.5 text-xs font-bold text-[#FFB84D] hover:bg-[#FFB84D]/20 transition-colors cursor-pointer"
                    >
                      Isi Kata Kunci (Indonesia + Inggris)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tool Fenomena (Tool 2) Conflict Confirmation Banner when user edited fields exist */}
          {isMounted && tool.slug === "cari-fenomena-awal" && ideaHandoff && isHandoffNewer && hasUserEditedFields && (
            <div className="mt-4 rounded-xl border border-[#FF9E5E]/40 bg-[#FF9E5E]/10 p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#FF9E5E] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF9E5E]">
                    Data dari Area Baru Tersedia
                  </h4>
                  <p className="text-xs text-[#FBFAFF] leading-relaxed">
                    Data dari Cari Ide Skripsi (Putaran {ideaHandoff.sourceRoundNumber}: [{ideaHandoff.selectedAreaId}] {ideaHandoff.selectedAreaName}) telah tersedia. Beberapa field sudah pernah kamu ubah sendiri.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  id="btn-apply-all-new-handoff"
                  onClick={handleApplyAllNewHandoff}
                  className="rounded-lg bg-[#6D5AE6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5A46D6] min-h-[44px] cursor-pointer"
                >
                  Gunakan Semua Data Terbaru
                </button>
                <button
                  type="button"
                  id="btn-keep-manual-edits"
                  onClick={handleKeepManualEdits}
                  className="rounded-lg border border-[#2E2748] bg-[#191430] px-3.5 py-2 text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF] min-h-[44px] cursor-pointer"
                >
                  Pertahankan Isian Manual
                </button>
              </div>
            </div>
          )}

          {/* Tool Fenomena (Tool 2) Active Source Summary */}
          {isMounted && tool.slug === "cari-fenomena-awal" && ideaHandoff && !isHandoffNewer && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#2E2748] bg-[#191430] p-3 text-xs text-[#FBFAFF]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FFB84D] shrink-0" aria-hidden="true" />
                <div className="text-[11px] space-y-0.5">
                  <span className="text-[#A79FC4] block text-[10px] uppercase tracking-wider">
                    Data dari Cari Ide Skripsi
                  </span>
                  <span className="font-semibold text-[#FBFAFF]">
                    Putaran {ideaHandoff.sourceRoundNumber} • [{ideaHandoff.selectedAreaId}] {ideaHandoff.selectedAreaName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Standard Autofill Trigger Banner for Other Tools */}
          {isMounted && tool.slug !== "cari-literatur-awal" && tool.slug !== "cari-fenomena-awal" && autofillData && autofillData.hasData && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#FFB84D]/30 bg-[#FFB84D]/10 p-3 text-xs text-[#FBFAFF]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FFB84D] shrink-0" aria-hidden="true" />
                <span className="text-[11px] text-[#A79FC4]">
                  Tersedia data riset dari <strong>{autofillData.sourceToolName}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerAutofill}
                className="shrink-0 rounded-md bg-[#FFB84D] px-2.5 py-1 text-[11px] font-bold text-[#0C0A1A] shadow-sm hover:bg-[#F0A63C] focus-visible:ring-2 focus-visible:ring-[#FFB84D] focus-visible:outline-none cursor-pointer"
              >
                Gunakan Data dari {autofillData.sourceToolName}
              </button>
            </div>
          )}

          {/* Unvalidated Phenomenon Warning Banner for Tool 3 (Cari Literatur Awal) if no phenomenon saved and field empty */}
          {isMounted && tool.slug === "cari-literatur-awal" && !selectedPhenomenon && !tempModeConfirmed && sharedContext?.fenomena_status !== "BELUM_TERVERIFIKASI" && (!formValues.fenomena_awal || formValues.fenomena_awal.trim().length === 0) && (
            <div className="mt-4 rounded-lg border border-[#FF9E5E]/40 bg-[#FF9E5E]/10 p-3.5 text-xs text-[#FBFAFF] space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-[#FF9E5E]">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Fenomena belum dipilih atau belum tervalidasi.</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#A79FC4]">
                Disarankan mencari dan memvalidasi bukti fenomena nyata terlebih dahulu agar pencarian literatur terarah.
              </p>

              {!showTempContinueOptions ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link
                    href="/tools/cari-fenomena-awal"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#6D5AE6] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#2047D4] transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                    <span>Kembali ke Cari & Validasi Fenomena</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowTempContinueOptions(true)}
                    className="rounded-md border border-[#2E2748] bg-[#191430] px-2.5 py-1 text-[11px] font-semibold text-[#A79FC4] hover:text-[#FBFAFF] transition-colors cursor-pointer"
                  >
                    Lanjut sementara tanpa fenomena tervalidasi
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3 space-y-2 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="temp-proceed-checkbox"
                      checked={tempModeConfirmed}
                      onChange={handleProceedTemporary}
                      className="h-4 w-4 rounded border-[#2E2748] bg-[#191430] text-[#FFB84D] focus:ring-[#FFB84D] mt-0.5"
                    />
                    <span className="text-[11px] text-[#FBFAFF] leading-normal">
                      Saya memahami bahwa saya melanjutkan tanpa fenomena tervalidasi. Status ini akan ditandai sebagai <strong>BELUM_TERVERIFIKASI</strong>.
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Persistent Warning if Continuing Without Validated Phenomenon */}
          {isMounted && tool.slug === "cari-literatur-awal" && (tempModeConfirmed || sharedContext?.fenomena_status === "BELUM_TERVERIFIKASI") && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 p-2.5 text-xs text-[#FBFAFF]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#FF9E5E] shrink-0" aria-hidden="true" />
              <span className="text-[11px]">
                Berjalan dalam mode <strong>Fenomena Belum Tervalidasi</strong>.
              </span>
            </div>
          )}

          {/* Legacy Context Card (if older schema text was found, read-only helper) */}
          {isMounted && autofillData && autofillData.legacyItems.length > 0 && (
            <div className="mt-4 rounded-lg border border-[#2E2748] bg-[#0C0A1A]/70 p-3.5 text-xs text-[#A79FC4]">
              <div className="flex items-center gap-2 text-[#FBFAFF] font-semibold text-xs">
                <History className="h-3.5 w-3.5 text-[#6D5AE6]" aria-hidden="true" />
                <span>Konteks Lama — Periksa Sebelum Digunakan</span>
              </div>
              <p className="mt-1 text-[11px] text-[#A79FC4]">
                Ditemukan catatan format sebelumnya. Kamu dapat membaca atau menyalinnya ke formulir baru di bawah:
              </p>
              <div className="mt-2 space-y-1.5 border-t border-[#2E2748]/60 pt-2">
                {autofillData.legacyItems.map((item) => (
                  <div key={item.key} className="text-[11px]">
                    <strong className="text-[#FBFAFF]">{item.label}:</strong>{" "}
                    <span className="text-[#A79FC4]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Form Fields List */}
          <div className="mt-5 space-y-4">
            {mainFields.map(renderField)}
          </div>

          {/* Progressive Disclosure: Advanced Settings Accordion */}
          {advancedFields.length > 0 && (
            <div className="mt-6 rounded-lg border border-[#2E2748] bg-[#0C0A1A]/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                aria-expanded={isAdvancedOpen}
                aria-controls="advanced-settings-panel"
                className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-[#221A42] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-[#FBFAFF] block">
                    Pengaturan Lanjutan — Opsional
                  </span>
                  <p className="text-[10px] text-[#A79FC4] mt-0.5">
                    Lewati jika belum tahu. SKRIFLOW akan meminta NotebookLM memetakan landscape secara menyeluruh.
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-[#A79FC4]">
                  {isAdvancedOpen ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
              </button>

              {isAdvancedOpen && (
                <div
                  id="advanced-settings-panel"
                  role="region"
                  className="border-t border-[#2E2748] p-4 space-y-4 bg-[#191430]/40 animate-in fade-in duration-150"
                >
                  {advancedFields.map(renderField)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-6 border-t border-[#2E2748]/70 pt-4 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-[#6D5AE6]/20 transition-all hover:bg-[#5A46D6] hover:shadow-[#6D5AE6]/35 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none cursor-pointer"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Generate Prompt</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        toolName={tool.name}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Autofill Confirmation Modal */}
      {autofillData && (
        <AutofillModal
          isOpen={showAutofillModal}
          sourceToolName={autofillData.sourceToolName}
          previewItems={getAutofillForTool(tool.slug, formValues).previewItems}
          validationResult={getAutofillForTool(tool.slug, formValues).validationResult}
          onApply={handleApplyAutofill}
          onReconcile={handleReconcileAndApplyAutofill}
          onCancel={() => setShowAutofillModal(false)}
        />
      )}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[#FFB84D] bg-[#0E1526] px-4 py-3 text-xs font-semibold text-[#FBFAFF] shadow-2xl shadow-[#FFB84D]/10 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="h-4 w-4 text-[#FFB84D] shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
