import React from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, Sparkles } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-[#0C0A1A] to-[#191430] border-b border-[#2E2748]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#6D5AE6]/15 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
          <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
          <span>MULAI SEKARANG</span>
        </div>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-4xl lg:text-5xl leading-tight">
          Berhenti mulai skripsi dari chat kosong.
        </h2>

        <p className="mt-4 text-sm text-[#A79FC4] sm:text-base leading-relaxed max-w-xl mx-auto">
          Pilih apa yang sedang lo butuhkan, isi konteksnya, lalu bawa prompt yang lebih jelas ke AI pilihan lo.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6D5AE6]/25 hover:bg-[#5A46D6] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
          >
            <span>Coba Tools</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <a
            href="#cara-kerja"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2748] bg-[#191430] px-6 py-3.5 text-sm font-semibold text-[#FBFAFF] transition-colors hover:border-[#6D5AE6]/50 hover:bg-[#221A42] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
          >
            <HelpCircle className="h-4 w-4 text-[#A79FC4]" aria-hidden="true" />
            <span>Lihat Cara Kerja</span>
          </a>
        </div>
      </div>
    </section>
  );
};
