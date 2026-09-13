"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import { RejectionReason } from "@/types/tool";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasons: RejectionReason[], additionalNote: string) => void;
}

const REJECTION_OPTIONS: Array<{ id: RejectionReason; label: string }> = [
  { id: "INTEREST_MISMATCH", label: "Kurang sesuai dengan minat saya" },
  { id: "STUDY_PROGRAM_MISMATCH", label: "Terlalu jauh dari program studi" },
  { id: "DATA_DISCOMFORT", label: "Jenis datanya kurang nyaman" },
  { id: "ACCESS_UNCLEAR", label: "Akses datanya tidak jelas" },
  { id: "TOO_COMPLEX", label: "Kelihatannya terlalu rumit" },
  { id: "TOO_HEAVY", label: "Beban pengerjaannya terlalu berat" },
  { id: "RESPONDENT_OR_FIELDWORK", label: "Terlalu membutuhkan responden atau lapangan" },
  { id: "LECTURER_DIRECTION_MISMATCH", label: "Kurang sesuai dengan arahan dosen" },
  { id: "AREAS_TOO_SIMILAR", label: "Area-area ini terlalu mirip" },
  { id: "OTHER", label: "Alasan lain" },
];

export const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReasons, setSelectedReasons] = useState<RejectionReason[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Focus modal container for screen reader / keyboard accessibility
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setSelectedReasons([]);
    setAdditionalNote("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleToggleReason = (id: RejectionReason) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const isFormValid = selectedReasons.length > 0 || additionalNote.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSubmit(selectedReasons, additionalNote.trim());
    setSelectedReasons([]);
    setAdditionalNote("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-modal-title"
      aria-describedby="rejection-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl border border-[#2E2748] bg-[#0E1528] shadow-2xl overflow-hidden focus:outline-none max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2748] p-5 pb-4 bg-[#191430]">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#6D5AE6]/20 p-2 text-[#6D5AE6] border border-[#6D5AE6]/30">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 id="rejection-modal-title" className="text-base font-bold text-[#FBFAFF]">
              Apa yang belum cocok?
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-1.5 text-[#A79FC4] hover:bg-[#221A42] hover:text-[#FBFAFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <p id="rejection-modal-desc" className="text-[#A79FC4] leading-relaxed">
            Pilih alasan yang paling sesuai. Jawabanmu akan digunakan untuk membuat alternatif area baru tanpa mengulang arah yang sama.
          </p>

          {/* Options Checklist */}
          <div className="space-y-2 pt-1">
            <span className="font-semibold text-[#FBFAFF] block">Pilih satu atau beberapa alasan:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REJECTION_OPTIONS.map((opt) => {
                const checked = selectedReasons.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                      checked
                        ? "border-[#6D5AE6] bg-[#221A42] text-[#FBFAFF]"
                        : "border-[#2E2748] bg-[#0C0A1A] text-[#A79FC4] hover:border-[#2E2748]/90 hover:text-[#FBFAFF]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleReason(opt.id)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-[#2E2748] bg-[#191430] text-[#6D5AE6] focus:ring-[#6D5AE6] focus:ring-offset-0 accent-[#6D5AE6]"
                    />
                    <span className="text-[11px] leading-tight select-none">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optional Additional Notes */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label htmlFor="textarea-rejection-note" className="font-semibold text-[#FBFAFF]">
                Catatan tambahan (opsional):
              </label>
              <span className="text-[10px] text-[#A79FC4]">{additionalNote.length}/500</span>
            </div>
            <textarea
              id="textarea-rejection-note"
              rows={3}
              maxLength={500}
              placeholder="Contoh: Saya lebih tertarik pada kualitas informasi AI daripada perilaku investor."
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              className="w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3 text-xs text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6] leading-relaxed"
            />
          </div>

          {!isFormValid && (
            <div className="flex items-center gap-2 text-[11px] text-[#FF9E5E]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Pilih minimal satu alasan atau isi catatan tambahan untuk melanjutkan.</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2748]">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[#2E2748] bg-[#191430] px-4 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6]"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-confirm-rejection-prompt"
              disabled={!isFormValid}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6D5AE6]/20 hover:bg-[#5A46D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Buat Prompt Alternatif Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
