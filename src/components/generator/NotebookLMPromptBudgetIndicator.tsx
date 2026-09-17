"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, ShieldAlert, Sparkles } from "lucide-react";
import { NOTEBOOKLM_LIMITS, PromptBudgetStatus, PromptBudgetBreakdown } from "@/config/promptLimits";

interface NotebookLMPromptBudgetIndicatorProps {
  finalLength: number;
  staticLength?: number;
  essentialLength?: number;
  optionalLength?: number;
  separatorsLength?: number;
  remainingLength?: number;
  phenomenonLength?: number;
  maxPhenomenonLength?: number;
  isOptionalCompacted?: boolean;
  compactedFields?: string[];
  statusOverride?: PromptBudgetStatus;
  breakdown?: PromptBudgetBreakdown;
  hardLimit?: number;
  safeTarget?: number;
  isUnregistered?: boolean;
  promptLabel?: string;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  prioritas_sumber: "Wilayah / Prioritas Sumber",
  rentang_publikasi: "Rentang Publikasi",
  kata_kunci: "Kata Kunci",
  fokus_literatur: "Fokus Literatur",
  fokus_aspek: "Fokus Aspek",
  hal_belum_ditentukan: "Hal Belum Ditentukan",
  hal_terbuka: "Hal Terbuka",
};

export const NotebookLMPromptBudgetIndicator: React.FC<NotebookLMPromptBudgetIndicatorProps> = ({
  finalLength,
  staticLength,
  essentialLength,
  optionalLength,
  remainingLength,
  phenomenonLength,
  maxPhenomenonLength = 800,
  isOptionalCompacted = false,
  compactedFields = [],
  statusOverride,
  breakdown,
  hardLimit = NOTEBOOKLM_LIMITS.hardLimit,
  safeTarget = NOTEBOOKLM_LIMITS.safeTarget,
  isUnregistered = false,
  promptLabel = "Prompt",
}) => {
  if (isUnregistered) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
        <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <span className="font-semibold">Konfigurasi Prompt Tidak Terdaftar:</span> Manifest prompt tidak ditemukan dalam registry. Fitur Salin/Buka dinonaktifkan secara aman.
        </div>
      </div>
    );
  }

  const status: PromptBudgetStatus =
    statusOverride ||
    breakdown?.status ||
    (finalLength <= safeTarget
      ? "SAFE"
      : finalLength <= hardLimit
      ? isOptionalCompacted
        ? "READY_WITH_OPTIONAL_COMPACTION"
        : "WARNING"
      : "BLOCKED");

  // Determine badge color:
  // - Green: total <= 3.500
  // - Yellow: 3.501–3.800
  // - Red (warning active, still valid <= 3.900): 3.801–3.900
  // - Blocked: > 3.900
  const isGreen = finalLength <= 3500 && status !== "TEMPLATE_OVERFLOW" && status !== "ESSENTIAL_CONTEXT_OVERFLOW";
  const isYellow = finalLength > 3500 && finalLength <= 3800 && status !== "TEMPLATE_OVERFLOW" && status !== "ESSENTIAL_CONTEXT_OVERFLOW";
  const isRedWarning = finalLength > 3800 && finalLength <= hardLimit && status !== "TEMPLATE_OVERFLOW" && status !== "ESSENTIAL_CONTEXT_OVERFLOW";
  const isBlocked = finalLength > hardLimit || status === "BLOCKED" || status === "TEMPLATE_OVERFLOW" || status === "ESSENTIAL_CONTEXT_OVERFLOW";

  const resolvedPhenomenonLen = phenomenonLength ?? breakdown?.phenomenonLength ?? 0;
  const resolvedStatic = staticLength ?? breakdown?.staticTemplate;
  const resolvedEssential = essentialLength ?? breakdown?.essentialContext;
  const resolvedOptional = optionalLength ?? breakdown?.optionalContext;
  const resolvedRemaining = remainingLength ?? breakdown?.remaining ?? Math.max(0, hardLimit - finalLength);

  const activeCompactedFields = compactedFields.length > 0
    ? compactedFields
    : breakdown?.compactedFields || [];
  const compactedFieldNames = activeCompactedFields
    .map((f) => FIELD_LABEL_MAP[f] || f)
    .join(", ");

  return (
    <div className="space-y-2.5">
      {/* Header Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Status Badge */}
          {status === "READY_WITH_OPTIONAL_COMPACTION" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Total: {finalLength.toLocaleString("id-ID")} / {hardLimit.toLocaleString("id-ID")} — Disesuaikan
            </span>
          ) : isGreen ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Total: {finalLength.toLocaleString("id-ID")} / {hardLimit.toLocaleString("id-ID")} — Aman
            </span>
          ) : isYellow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Total: {finalLength.toLocaleString("id-ID")} / {hardLimit.toLocaleString("id-ID")} — Mendekati batas
            </span>
          ) : isRedWarning ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 text-xs font-semibold text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              Total: {finalLength.toLocaleString("id-ID")} / {hardLimit.toLocaleString("id-ID")} — Sangat dekat batas (Valid)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              Total: {finalLength.toLocaleString("id-ID")} / {hardLimit.toLocaleString("id-ID")} — Melebihi batas
            </span>
          )}

          {/* Phenomenon Integrity Badge */}
          {resolvedPhenomenonLen > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#221A42] border border-[#2E2748] px-2.5 py-1 text-xs font-medium text-[#FFB84D]">
              <span>Fenomena lengkap:</span>
              <span className="font-bold text-[#FBFAFF]">{resolvedPhenomenonLen}/{maxPhenomenonLength}</span>
            </span>
          )}
        </div>

        {/* Detailed Character Metrics Breakdown */}
        {resolvedStatic !== undefined && (
          <div className="flex flex-wrap items-center gap-1 text-[12px] text-[#A79FC4]">
            <span>Template: <strong className="text-[#FBFAFF]">{resolvedStatic}</strong></span>
            {resolvedEssential !== undefined && (
              <>
                <span>•</span>
                <span>Konteks inti: <strong className="text-[#FBFAFF]">{resolvedEssential}</strong></span>
              </>
            )}
            {resolvedOptional !== undefined && resolvedOptional > 0 && (
              <>
                <span>•</span>
                <span>Konteks opsional: <strong className="text-[#FBFAFF]">{resolvedOptional}</strong></span>
              </>
            )}
            <span>•</span>
            <span>Sisa: <strong className="text-[#FFB84D]">{resolvedRemaining}</strong></span>
          </div>
        )}
      </div>

      {/* Alert Notices */}
      {status === "TEMPLATE_OVERFLOW" && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            Prompt melebihi batas karena konfigurasi internal. Fenomena tetap dipertahankan utuh. Periksa template atau pemetaan konteks opsional.
          </div>
        </div>
      )}

      {status === "ESSENTIAL_CONTEXT_OVERFLOW" && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            Konteks inti belum valid. Periksa batas Program Studi, Area, atau data fenomena yang diterima dari tahap sebelumnya.
          </div>
        </div>
      )}

      {status === "READY_WITH_OPTIONAL_COMPACTION" && (
        <div className="flex items-start gap-2 rounded-md border border-cyan-500/30 bg-cyan-950/30 p-2.5 text-xs text-cyan-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <div>
            Fenomena tetap dimasukkan lengkap. Sebagian konteks opsional dipadatkan hanya pada prompt; isian asli tetap tersimpan.
            {compactedFieldNames ? <span className="font-semibold text-cyan-300"> (Field: {compactedFieldNames})</span> : null}
          </div>
        </div>
      )}

      {status === "WARNING" && !isBlocked && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            Panjang {promptLabel} mendekati kapasitas NotebookLM (maksimal {hardLimit.toLocaleString("id-ID")} karakter). Prompt dapat langsung disalin dan digunakan.
          </div>
        </div>
      )}

      {status === "BLOCKED" && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <span className="font-semibold">{promptLabel} melebihi batas {hardLimit.toLocaleString("id-ID")} karakter.</span> Tombol Salin dan Buka dinonaktifkan untuk mencegah penolakan oleh NotebookLM.
          </div>
        </div>
      )}
    </div>
  );
};
