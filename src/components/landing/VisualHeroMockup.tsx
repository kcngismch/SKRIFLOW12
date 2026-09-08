import React from "react";
import { Lightbulb, Play, Terminal, Sparkles, Check } from "lucide-react";

export const VisualHeroMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Glow Effect */}
      <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-[#2959FF]/20 via-[#70E1B6]/10 to-[#FF6F61]/20 blur-xl opacity-75 pointer-events-none" />

      {/* Main Mockup Card Container */}
      <div className="relative overflow-hidden rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6 shadow-2xl shadow-black/40">
        {/* Mockup Header */}
        <div className="flex items-center justify-between border-b border-[#273352] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D] text-[#FF6F61]">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FFF9EE]">Cari Ide Skripsi</h3>
              <p className="text-[11px] text-[#AAB4D0]">Simulasi Konfigurasi Mahasiswa</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[#70E1B6]/30 bg-[#70E1B6]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#70E1B6]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Simulasi tampilan</span>
          </div>
        </div>

        {/* Input Examples */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="rounded-lg border border-[#273352] bg-[#080D1D]/80 p-2.5">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#AAB4D0]">
              Program Studi
            </span>
            <span className="mt-0.5 font-semibold text-[#FFF9EE]">Akuntansi</span>
          </div>

          <div className="rounded-lg border border-[#273352] bg-[#080D1D]/80 p-2.5">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#AAB4D0]">
              Jenis Data
            </span>
            <span className="mt-0.5 font-semibold text-[#FFF9EE]">Data sekunder (Laporan Keuangan IDX)</span>
          </div>

          <div className="rounded-lg border border-[#273352] bg-[#080D1D]/80 p-2.5">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#AAB4D0]">
              Yang Ingin Dihindari
            </span>
            <span className="mt-0.5 font-semibold text-[#FFF9EE]">Wawancara dan turun lapangan</span>
          </div>
        </div>

        {/* Generate Prompt Simulated Action */}
        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2959FF]/20 border border-[#2959FF]/40 py-2 text-xs font-semibold text-[#70E1B6]">
            <Play className="h-3 w-3 fill-[#70E1B6]" aria-hidden="true" />
            <span>Generate Prompt</span>
          </div>
        </div>

        {/* Prompt Output Excerpt */}
        <div className="mt-4 rounded-lg border border-[#273352] bg-[#080D1D] p-3.5">
          <div className="flex items-center justify-between border-b border-[#273352]/60 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#70E1B6]">
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Prompt Terstruktur (Siap Pakai)</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[#AAB4D0]">
              <Check className="h-3 w-3 text-[#70E1B6]" aria-hidden="true" />
              Tersusun
            </span>
          </div>

          <p className="font-mono text-xs leading-relaxed text-[#FFF9EE]/90">
            &ldquo;Kamu adalah partner brainstorming akademik untuk mahasiswa S1 Program Studi Akuntansi.
            Bantu rumuskan 3 arah penelitian berbasis data sekunder (laporan tahunan/keuangan) tanpa memerlukan wawancara narasumber atau survei lapangan...&rdquo;
            <span className="inline-block h-3.5 w-1.5 translate-y-0.5 bg-[#70E1B6] ml-1 opacity-80" />
          </p>
        </div>

        {/* Footer Badge Label */}
        <div className="mt-3.5 flex items-center justify-center">
          <span className="text-[11px] font-medium text-[#70E1B6] bg-[#70E1B6]/10 border border-[#70E1B6]/20 px-3 py-1 rounded-full">
            Simulasi tampilan
          </span>
        </div>
      </div>
    </div>
  );
};
