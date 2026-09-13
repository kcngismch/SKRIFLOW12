"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  toolName: string;
  title?: string;
  description?: string;
  confirmButtonText?: string;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  toolName,
  title = "Reset Input Formulir?",
  description,
  confirmButtonText = "Ya, Reset Formulir",
}) => {
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

  const defaultDesc =
    "Seluruh isian parameter dan hasil prompt yang telah dirakit untuk tool ini akan dihapus dari penyimpanan peramban. Tindakan ini tidak dapat dibatalkan.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      aria-describedby="reset-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-2xl overflow-hidden focus:outline-none animate-scale-up"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF5C8A]/40 bg-[#FF5C8A]/10 text-[#FF5C8A] shadow-sm">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="reset-modal-title" className="text-base font-bold text-[#FBFAFF]">
                {title}
              </h3>
              <p className="text-xs text-[#A79FC4]">
                {toolName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[#A79FC4] hover:bg-[#221A42] hover:text-[#FBFAFF] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            aria-label="Tutup dialog konfirmasi"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p id="reset-modal-desc" className="mt-4 text-xs leading-relaxed text-[#A79FC4]">
          {description || defaultDesc}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-[#2E2748]/70 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto rounded-xl border border-[#2E2748] bg-[#0C0A1A] px-4 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#221A42] transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Batal
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            id="btn-confirm-reset-action"
            onClick={onConfirm}
            className="w-full sm:w-auto rounded-xl bg-[#FF5C8A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#FA5747] transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5C8A] focus-visible:outline-none shadow-md shadow-[#FF5C8A]/20 min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
