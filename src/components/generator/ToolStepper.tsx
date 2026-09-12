"use client";

import React from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";

const JOURNEY = [
  { slug: "cari-ide-skripsi", label: "Cari Ide" },
  { slug: "cari-fenomena-awal", label: "Fenomena" },
  { slug: "cari-literatur-awal", label: "Literatur" },
  { slug: "bedah-hasil-notebooklm", label: "Bedah Hasil" },
  { slug: "susun-bab-1", label: "Bab 1" },
] as const;

/**
 * Stepper horizontal 4 tool di atas halaman tool.
 * Fungsi: user selalu tahu posisi + urutan alur kerja (gap proses ilmiah = sequential).
 * State: done = slug sebelum currentStep; active = halaman ini; upcoming = abu-abu terkunci.
 */
export const ToolStepper: React.FC<{ currentStep: string }> = ({ currentStep }) => {
  const idx = JOURNEY.findIndex((s) => s.slug === currentStep);

  return (
    <nav aria-label="Alur kerja SKRIFLOW" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {JOURNEY.map((step, i) => {
          const isDone = idx >= 0 && i < idx;
          const isActive = i === idx;
          const isUpcoming = idx < 0 || i > idx;
          const stateClass = isDone
            ? "border-[#70E1B6]/40 bg-[#70E1B6]/10 text-[#70E1B6]"
            : isActive
              ? "border-[#2959FF] bg-[#2959FF]/10 text-[#FFF9EE]"
              : "border-[#273352] bg-[#11182D] text-[#AAB4D0]";
          return (
            <li key={step.slug} className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href={`/tools/${step.slug}`}
                aria-current={isActive ? "step" : undefined}
                title={isUpcoming ? `${i + 1}. ${step.label} (belum dilalui)` : `${i + 1}. ${step.label}`}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none ${stateClass} hover:border-[#2959FF]/60`}
              >
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[10px] font-bold ${
                    isDone
                      ? "border-[#70E1B6]/60 bg-[#70E1B6]/20 text-[#70E1B6]"
                      : isActive
                        ? "border-[#2959FF] bg-[#2959FF] text-white"
                        : "border-[#273352] bg-[#080D1D] text-[#AAB4D0]"
                  }`}
                >
                  {isDone ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : i + 1}
                </span>
                <span className={isUpcoming ? "hidden sm:inline" : ""}>
                  {step.label}
                </span>
                {isUpcoming && <Lock className="h-3 w-3 opacity-50 sm:hidden" aria-hidden="true" />}
              </Link>
              {i < JOURNEY.length - 1 && (
                <span aria-hidden="true" className="text-[#273352]">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
