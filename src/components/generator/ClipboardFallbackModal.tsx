"use client";

import React, { useEffect } from "react";
import { AlertCircle, X, RotateCcw, ExternalLink } from "lucide-react";
import { copyToClipboard, openPlatformUrl } from "@/lib/clipboard";

interface ClipboardFallbackModalProps {
  isOpen: boolean;
  prompt: string;
  targetUrl: string;
  platformName: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
}

export const ClipboardFallbackModal: React.FC<ClipboardFallbackModalProps> = ({
  isOpen,
  prompt,
  targetUrl,
  platformName,
  onSuccess,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRetryCopy = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      openPlatformUrl(targetUrl);
      onSuccess("Prompt sudah disalin. Tempel dengan Ctrl+V di tab yang baru dibuka.");
      onClose();
    }
  };

  const handleOpenAnyway = () => {
    openPlatformUrl(targetUrl);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clipboard-fallback-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[#273352] bg-[#11182D] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#FF6F61]/40 bg-[#FF6F61]/10 text-[#FF6F61]">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="clipboard-fallback-title" className="text-base font-bold text-[#FFF9EE]">
                Penyalinan Otomatis Tertahan
              </h3>
              <p className="text-xs text-[#AAB4D0]">
                Izin clipboard peramban belum aktif
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#AAB4D0] hover:bg-[#16213D] hover:text-[#FFF9EE] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[#FFF9EE]">
          Prompt belum berhasil disalin secara otomatis. Klik tombol <strong>Copy Prompt</strong> terlebih dahulu, lalu buka platform.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#273352]/70 pt-4">
          <button
            type="button"
            onClick={handleOpenAnyway}
            className="rounded-lg border border-[#273352] bg-[#080D1D] px-3.5 py-2 text-xs font-semibold text-[#AAB4D0] hover:bg-[#16213D] hover:text-[#FFF9EE] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none inline-flex items-center gap-1.5"
          >
            <span>Tetap Buka {platformName}</span>
            <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleRetryCopy}
            className="rounded-lg bg-[#2959FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E46D9] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none shadow-md shadow-[#2959FF]/20 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Coba Salin Lagi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
