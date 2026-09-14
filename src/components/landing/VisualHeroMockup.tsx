import React from "react";
import { Lightbulb, Play, Terminal, Sparkles, Check } from "lucide-react";

export const VisualHeroMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Glow Effect */}
      <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-[#6D5AE6]/20 via-[#FFB84D]/10 to-[#FF5C8A]/20 blur-xl opacity-75 pointer-events-none" />

      {/* Main Mockup Card Container */}
      <div className="relative overflow-hidden rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6 shadow-2xl shadow-black/40">
        {/* Mockup Header */}
        <div className="flex items-center justify-between border-b border-[#2E2748] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A] text-[#FF5C8A]">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FBFAFF]">Cari Ide Skripsi</h3>
              <p className="text-[12px] text-[#A79FC4]">Simulasi Konfigurasi Mahasiswa</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FFB84D]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Simulasi tampilan</span>
          </div>
        </div>

        {/* Input Examples */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A]/80 p-2.5">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#A79FC4]">
              Program Studi
            </span>
            <span className="mt-0.5 font-semibold text-[#FBFAFF]">Akuntansi</span>
          </div>

          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A]/80 p-2.5">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#A79FC4]">
              Jenis Data
            </span>
            <span className="mt-0.5 font-semibold text-[#FBFAFF]">Data sekunder (Laporan Keuangan IDX)</span>
          </div>

          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A]/80 p-2.5">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#A79FC4]">
              Yang Ingin Dihindari
            </span>
            <span className="mt-0.5 font-semibold text-[#FBFAFF]">Wawancara dan turun lapangan</span>
          </div>
        </div>

        {/* Generate Prompt Simulated Action */}
        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D5AE6]/20 border border-[#6D5AE6]/40 py-2 text-xs font-semibold text-[#FFB84D]">
            <Play className="h-3 w-3 fill-[#FFB84D]" aria-hidden="true" />
            <span>Generate Prompt</span>
          </div>
        </div>

        {/* Prompt Output Excerpt */}
        <div className="mt-4 rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3.5">
          <div className="flex items-center justify-between border-b border-[#2E2748]/60 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#FFB84D]">
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Prompt Terstruktur (Siap Pakai)</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-[#A79FC4]">
              <Check className="h-3 w-3 text-[#FFB84D]" aria-hidden="true" />
              Tersusun
            </span>
          </div>

          <p className="font-mono text-xs leading-relaxed text-[#FBFAFF]/90">
            &ldquo;Kamu adalah partner brainstorming akademik untuk mahasiswa S1 Program Studi Akuntansi.
            Bantu rumuskan 3 arah penelitian berbasis data sekunder (laporan tahunan/keuangan) tanpa memerlukan wawancara narasumber atau survei lapangan...&rdquo;
            <span className="inline-block h-3.5 w-1.5 translate-y-0.5 bg-[#FFB84D] ml-1 opacity-80" />
          </p>
        </div>

        {/* Footer Badge Label */}
        <div className="mt-3.5 flex items-center justify-center">
          <span className="text-[12px] font-medium text-[#FFB84D] bg-[#FFB84D]/10 border border-[#FFB84D]/20 px-3 py-1 rounded-full">
            Simulasi tampilan
          </span>
        </div>
      </div>
    </div>
  );
};
