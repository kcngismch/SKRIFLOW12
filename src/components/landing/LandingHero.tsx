import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { VisualHeroMockup } from "./VisualHeroMockup";

export const LandingHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden border-b border-[#273352] py-14 sm:py-20 lg:py-24">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#2959FF]/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2959FF]/40 bg-[#2959FF]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
              <Sparkles className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
              <span>SKRIPSI NGGAK HARUS DIMULAI DARI PROMPT KOSONG</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-4xl lg:text-5xl leading-[1.18]">
              AI-nya sudah ada. Masalahnya,{" "}
              <span className="text-[#FF6F61]">lo masih bingung harus nanya apa.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base text-[#AAB4D0] sm:text-lg leading-relaxed max-w-xl">
              SKRIFLOW membantu lo mengubah kondisi skripsi menjadi prompt yang lebih terarah—lalu menjalankannya di NotebookLM, ChatGPT, atau Gemini tanpa kehilangan alur penelitian.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2959FF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2959FF]/25 transition-all hover:bg-[#1E46D9] hover:shadow-[#2959FF]/40 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
              >
                <span>Coba Tools</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <a
                href="#cara-kerja"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#273352] bg-[#11182D] px-5 py-3 text-sm font-semibold text-[#FFF9EE] transition-colors hover:border-[#2959FF]/60 hover:bg-[#16213D] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
              >
                <HelpCircle className="h-4 w-4 text-[#AAB4D0]" aria-hidden="true" />
                <span>Lihat Cara Kerja</span>
              </a>
            </div>

            {/* Microcopy */}
            <p className="mt-4 text-xs font-medium text-[#AAB4D0]/80">
              Prototype gratis · Tanpa login · Tidak memakai API AI
            </p>
          </div>

          {/* Right Column: Visual Product Simulation Mockup */}
          <div className="lg:col-span-5">
            <VisualHeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
};
