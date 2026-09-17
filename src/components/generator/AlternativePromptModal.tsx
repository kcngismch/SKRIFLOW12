"use client";

import React, { useEffect, useRef } from "react";
import { Sparkles, Copy, X, ArrowRight } from "lucide-react";

interface AlternativePromptModalProps {
  isOpen: boolean;
  roundNumber: number; // e.g. 2 for round 2 of 3
  maxRounds?: number; // default 3
  onCopyAndProceed: () => void;
  onClose: () => void;
}

export const AlternativePromptModal: React.FC<AlternativePromptModalProps> = ({
  isOpen,
  roundNumber,
  maxRounds = 3,
  onCopyAndProceed,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus primary action button after render
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alt-prompt-modal-title"
      aria-describedby="alt-prompt-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl border border-[#6D5AE6]/50 bg-[#0E1528] shadow-2xl overflow-hidden focus:outline-none max-h-[90vh] flex flex-col my-auto animate-scale-up"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#2E2748] p-5 sm:p-6 bg-[#191430]/90">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/10 text-[#FFB84D] shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="alt-prompt-modal-title"
                className="text-base sm:text-lg font-bold text-[#FBFAFF] leading-snug"
              >
                Prompt Alternatif Sudah Siap
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#6D5AE6]/20 px-2 py-0.5 text-[12px] font-mono font-semibold text-[#FFB84D] border border-[#6D5AE6]/30">
                  Putaran eksplorasi: {roundNumber} dari {maxRounds}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A79FC4] hover:bg-[#221A42] hover:text-[#FBFAFF] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            aria-label="Tutup dialog prompt alternatif"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#A79FC4]">
          <p id="alt-prompt-modal-desc" className="text-[#FBFAFF] leading-relaxed">
            Prompt alternatif untuk putaran berikutnya sudah dibuat berdasarkan area yang ditolak dan alasan yang kamu pilih.
          </p>

          <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#FFB84D] font-semibold text-xs uppercase tracking-wide">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Instruksi Langkah Selanjutnya:</span>
            </div>
            <p className="text-xs text-[#A79FC4] leading-relaxed">
              Salin prompt ini ke ChatGPT atau Gemini, lalu tempel hasil barunya kembali ke SKRIFLOW.
            </p>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-[#2E2748] p-5 sm:p-6 bg-[#191430]/70">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-[#2E2748] bg-[#0C0A1A] px-5 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Tutup
          </button>
          <button
            ref={primaryButtonRef}
            type="button"
            id="btn-copy-and-view-alt-prompt"
            onClick={onCopyAndProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D5AE6] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#6D5AE6]/30 hover:bg-[#5A46D6] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191430] focus-visible:outline-none min-h-[44px] cursor-pointer"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>Lihat &amp; Salin Prompt Alternatif</span>
          </button>
        </div>
      </div>
    </div>
  );
};
