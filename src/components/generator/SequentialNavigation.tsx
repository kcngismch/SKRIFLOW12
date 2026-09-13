"use client";

import React from "react";
import Link from "next/link";
import { ToolNavigationStep } from "@/types/tool";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, LayoutGrid } from "lucide-react";

interface SequentialNavigationProps {
  previousStep?: ToolNavigationStep;
  nextStep: ToolNavigationStep;
  isPromptGenerated?: boolean;
  isNextEnabled?: boolean;
  nextStatusLabel?: string;
  nextDisabledReason?: string;
  nextHelperText?: string;
}

export const SequentialNavigation: React.FC<SequentialNavigationProps> = ({
  previousStep,
  nextStep,
  isPromptGenerated,
  isNextEnabled,
  nextStatusLabel,
  nextDisabledReason,
  nextHelperText,
}) => {
  const isEnabled = typeof isNextEnabled === "boolean" ? isNextEnabled : !!isPromptGenerated;

  const defaultEnabledLabel = "Prompt Siap Digunakan";
  const defaultDisabledReason = "Generate prompt terlebih dahulu untuk melanjutkan";
  const defaultHelperText =
    "Pastikan kamu sudah menjalankan prompt dan menyimpan hasilnya sebelum melanjutkan ke langkah berikutnya.";

  return (
    <div className="mt-8 rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6 space-y-4">
      {/* Top Status & Caution Info */}
      <div className="flex flex-col gap-1 border-b border-[#273352]/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#70E1B6]">
            {nextStep.eyebrow || "LANGKAH BERIKUTNYA"}
          </span>
          {isEnabled ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#70E1B6]">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              <span>{nextStatusLabel || defaultEnabledLabel}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#AAB4D0]">
              <AlertCircle className="h-3 w-3 text-[#AAB4D0]" aria-hidden="true" />
              <span>{nextDisabledReason || defaultDisabledReason}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-[#AAB4D0]">
          {nextHelperText || defaultHelperText}
        </p>
      </div>

      {/* UX-02: jalan keluar ke daftar tool. Tombol "Kembali" selalu ke tool
          sebelumnya, jadi tanpa ini satu-satunya jalan ke daftar hanyalah menu
          kecil di header — menyiksa di halaman panjang seperti Tool 5 (48 layar). */}
      <div className="border-b border-[#273352]/60 pb-3">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#AAB4D0] hover:text-[#FFF9EE] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none rounded"
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Semua tool</span>
        </Link>
      </div>

      {/* Navigation Buttons: Previous (Left) and Next (Right) */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Previous Button (Left) */}
        <div>
          {previousStep ? (
            <Link
              href={previousStep.href}
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#273352] bg-[#0E1526] px-4 py-3 text-xs sm:text-sm font-semibold text-[#AAB4D0] hover:text-[#FFF9EE] hover:bg-[#162038] hover:border-[#2959FF]/50 transition-all focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              <ArrowLeft className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
              <span>{previousStep.label}</span>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Next Button (Right) */}
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          {isEnabled ? (
            <Link
              href={nextStep.href}
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#2959FF] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#2959FF]/20 transition-all hover:bg-[#1E46D9] hover:shadow-[#2959FF]/35 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              <span>{nextStep.title || nextStep.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={nextDisabledReason || defaultDisabledReason}
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#273352] bg-[#080D1D] px-5 py-3 text-xs sm:text-sm font-semibold text-[#AAB4D0]/50 cursor-not-allowed opacity-60"
            >
              <span>{nextStep.title || nextStep.label}</span>
              <ArrowRight className="h-4 w-4 opacity-50" aria-hidden="true" />
            </button>
            {/* UX-04: alasan tombol mati ditempel di tombolnya, bukan cuma di kepala panel. */}
            <p className="max-w-xs text-[11px] leading-relaxed text-[#AAB4D0] sm:text-right">
              {nextDisabledReason || defaultDisabledReason}
            </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
