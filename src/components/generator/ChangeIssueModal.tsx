"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, CheckSquare, Square, AlertCircle, ArrowRight } from "lucide-react";

interface ChangeIssueModalProps {
  isOpen: boolean;
  onConfirm: (preserveProfile: boolean) => void;
  onCancel: () => void;
}

export const ChangeIssueModal: React.FC<ChangeIssueModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [preserveProfile, setPreserveProfile] = useState<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
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
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(preserveProfile);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-issue-modal-title"
      aria-describedby="change-issue-modal-desc"
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#6D5AE6]/40 bg-[#6D5AE6]/10 text-[#FFB84D] shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="change-issue-modal-title"
                className="text-base sm:text-lg font-bold text-[#FBFAFF] leading-snug"
              >
                Mulai eksplorasi isu baru?
              </h3>
              <p className="text-xs text-[#A79FC4] mt-0.5">
                Eksplorasi Cari Ide Skripsi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[#A79FC4] hover:bg-[#221A42] hover:text-[#FBFAFF] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            aria-label="Tutup dialog ganti isu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#A79FC4]">
          <p id="change-issue-modal-desc" className="text-[#FBFAFF] leading-relaxed">
            Sesi Cari Ide yang sekarang akan diakhiri. Putaran alternatif, hasil area, rekomendasi, pilihan, dan handoff aktif dari sesi ini akan dibersihkan.
          </p>

          <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-[#A79FC4]">
              <AlertCircle className="h-4 w-4 text-[#FFB84D] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">
                Hasil yang sudah tersimpan pada tool berikutnya <strong className="text-[#FBFAFF]">tidak akan dihapus</strong>, tetapi tidak akan otomatis digunakan untuk isu baru.
              </p>
            </div>
          </div>

          {/* Preserve Profile Checkbox Option */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#2E2748] bg-[#191430] hover:bg-[#221A42]/70 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preserveProfile}
                onChange={(e) => setPreserveProfile(e.target.checked)}
                className="sr-only"
              />
              <div className="mt-0.5 text-[#6D5AE6] shrink-0">
                {preserveProfile ? (
                  <CheckSquare className="h-4 w-4 text-[#FFB84D]" />
                ) : (
                  <Square className="h-4 w-4 text-[#A79FC4]" />
                )}
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-[#FBFAFF] text-xs block">
                  Pertahankan profil dan preferensi pengerjaan
                </span>
                <p className="text-[11px] text-[#A79FC4] leading-relaxed">
                  Program studi, pendekatan yang disukai, jenis data yang nyaman, akses data, hal yang dihindari, kondisi waktu, dan batasan umum akan tetap diisi. Hanya minat/isu yang akan dikosongkan.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-[#2E2748] p-5 sm:p-6 bg-[#191430]/70">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto rounded-xl border border-[#2E2748] bg-[#0C0A1A] px-5 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Batal
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            id="btn-confirm-start-new-issue"
            onClick={handleConfirm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D5AE6] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#6D5AE6]/30 hover:bg-[#5A46D6] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191430] focus-visible:outline-none min-h-[44px] cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>Mulai Isu Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
