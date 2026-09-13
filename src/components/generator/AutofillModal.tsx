"use client";

import React, { useEffect } from "react";
import { Sparkles, X, ArrowRight, CheckCheck, Replace, AlertTriangle, ShieldCheck, Scissors } from "lucide-react";
import { AutofillPreviewItem } from "@/lib/autofill";
import { HandoffValidationResult } from "@/lib/handoffValidator";

interface AutofillModalProps {
  isOpen: boolean;
  sourceToolName?: string;
  previewItems: AutofillPreviewItem[];
  validationResult?: HandoffValidationResult;
  onApply: (mode: "fill_empty" | "overwrite") => void;
  onReconcile?: () => void;
  onCancel: () => void;
}

export const AutofillModal: React.FC<AutofillModalProps> = ({
  isOpen,
  sourceToolName = "Tool Sebelumnya",
  previewItems,
  validationResult,
  onApply,
  onReconcile,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const hasViolations = validationResult && !validationResult.valid && validationResult.violations.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="autofill-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[#2E2748] bg-[#191430] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
              hasViolations
                ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                : "border-[#FFB84D]/40 bg-[#FFB84D]/10 text-[#FFB84D]"
            }`}>
              {hasViolations ? (
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 id="autofill-modal-title" className="text-base font-bold text-[#FBFAFF]">
                Gunakan Data dari {sourceToolName}
              </h3>
              <p className="text-xs text-[#A79FC4]">
                {hasViolations
                  ? "Data lama perlu disesuaikan dengan batas langkah ini"
                  : "Semua isian sudah sesuai batas langkah ini"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-[#A79FC4] hover:bg-[#221A42] hover:text-[#FBFAFF] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Validation Status Banner */}
        {hasViolations ? (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-[#FBFAFF] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Data lama perlu disesuaikan</span>
            </div>
            <p className="text-[11px] text-[#A79FC4] leading-relaxed">
              Ada {validationResult.violations.length} field yang dibuat menggunakan batas versi sebelumnya dan melebihi batas langkah ini:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90 pl-1">
              {validationResult.violations.map((v, i) => (
                <li key={i}>
                  <span className="font-semibold text-white">{v.fieldLabel}</span>: {v.actualLength} karakter (maksimal {v.allowedLength} karakter)
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-2 text-xs text-[#FFB84D]">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Seluruh data handoff berada di dalam batas aman canonical form.</span>
          </div>
        )}

        {/* Preview List */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {previewItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3 text-xs"
            >
              <div className="font-semibold text-[#FFB84D] mb-1">
                {item.fieldLabel}
              </div>
              <div className="grid grid-cols-11 gap-2 items-center text-[11px]">
                <div className="col-span-5 rounded bg-[#191430] p-1.5 text-[#A79FC4] truncate" title={item.currentDisplay}>
                  <span className="text-[9px] block text-[#A79FC4]/60 uppercase">Saat ini:</span>
                  {item.currentDisplay}
                </div>
                <div className="col-span-1 flex justify-center text-[#6D5AE6]">
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <div className="col-span-5 rounded bg-[#6D5AE6]/10 border border-[#6D5AE6]/30 p-1.5 text-[#FBFAFF] truncate" title={item.newDisplay}>
                  <span className="text-[9px] block text-[#FFB84D] uppercase">Dari {sourceToolName}:</span>
                  {item.newDisplay}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#2E2748]/70 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none cursor-pointer"
          >
            Batalkan Handoff
          </button>

          {hasViolations && onReconcile && (
            <button
              type="button"
              onClick={onReconcile}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
            >
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sesuaikan untuk Tool Berikutnya</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onApply("fill_empty")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB84D]/40 bg-[#FFB84D]/10 px-3 py-2 text-xs font-semibold text-[#FFB84D] hover:bg-[#FFB84D]/20 focus-visible:ring-2 focus-visible:ring-[#FFB84D] focus-visible:outline-none cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pertahankan Isian Saya</span>
          </button>

          <button
            type="button"
            onClick={() => onApply("overwrite")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6D5AE6] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#5A46D6] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none shadow-md shadow-[#6D5AE6]/20 cursor-pointer"
          >
            <Replace className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Gunakan Data Terbaru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
