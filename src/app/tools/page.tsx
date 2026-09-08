import React from "react";
import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { ToolCatalog } from "@/components/ToolCatalog";
import { LockedSection } from "@/components/LockedSection";
import { ACTIVE_TOOLS } from "@/data/tools";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard Tools — SKRIFLOW Prompt Tools",
  description:
    "Pilih kebutuhanmu, isi kondisi skripsimu, lalu bawa prompt yang dihasilkan ke NotebookLM, ChatGPT, atau Gemini.",
};

export default function ToolsDashboardPage() {
  return (
    <div className="flex flex-col pb-16">
      {/* Hero Section */}
      <Hero />

      {/* Main Dashboard Content */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-tight text-[#FFF9EE] sm:text-2xl">
              Daftar Tools Aktif
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#70E1B6] bg-[#70E1B6]/10 border border-[#70E1B6]/30 px-2.5 py-1 rounded-md">
            Misi 01: Eksplorasi Awal
          </span>
        </div>

        {/* Dynamic Tool Search & Cards Grid */}
        <ToolCatalog tools={ACTIVE_TOOLS} />

        {/* Coming Soon Locked Phases */}
        <LockedSection />
      </div>
    </div>
  );
}
