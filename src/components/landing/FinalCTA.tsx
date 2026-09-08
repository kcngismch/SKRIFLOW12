import React from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, Sparkles } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-[#080D1D] to-[#11182D] border-b border-[#273352]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#2959FF]/15 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2959FF]/30 bg-[#2959FF]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
          <Sparkles className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
          <span>MULAI SEKARANG</span>
        </div>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-4xl lg:text-5xl leading-tight">
          Berhenti mulai skripsi dari chat kosong.
        </h2>

        <p className="mt-4 text-sm text-[#AAB4D0] sm:text-base leading-relaxed max-w-xl mx-auto">
          Pilih apa yang sedang lo butuhkan, isi konteksnya, lalu bawa prompt yang lebih jelas ke AI pilihan lo.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2959FF] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2959FF]/25 hover:bg-[#1E46D9] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
          >
            <span>Coba Tools</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <a
            href="#cara-kerja"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#273352] bg-[#11182D] px-6 py-3.5 text-sm font-semibold text-[#FFF9EE] transition-colors hover:border-[#2959FF]/50 hover:bg-[#16213D] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
          >
            <HelpCircle className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
            <span>Lihat Cara Kerja</span>
          </a>
        </div>
      </div>
    </section>
  );
};
