"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ACTIVE_TOOLS } from "@/data/tools";
import { PlatformBadge } from "@/components/PlatformBadge";
import { EmptyPromptState } from "@/components/EmptyPromptState";
import {
  Sparkles,
  LayoutDashboard,
  FileCode2,
  ArrowRight,
  Lightbulb,
  BookOpen,
  GitCompare,
  Compass,
  Sliders,
  Play,
  Info,
  Search,
} from "lucide-react";

const getToolIcon = (iconName?: string) => {
  switch (iconName) {
    case "Lightbulb":
      return <Lightbulb className="h-5 w-5 text-[#FF6F61]" aria-hidden="true" />;
    case "Compass":
      return <Compass className="h-5 w-5 text-[#2959FF]" aria-hidden="true" />;
    case "BookOpen":
      return <BookOpen className="h-5 w-5 text-[#70E1B6]" aria-hidden="true" />;
    case "GitCompare":
      return <GitCompare className="h-5 w-5 text-[#70E1B6]" aria-hidden="true" />;
    default:
      return <Lightbulb className="h-5 w-5 text-[#FF6F61]" aria-hidden="true" />;
  }
};

export const ProductDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "generator">("dashboard");
  const selectedTool = ACTIVE_TOOLS[0]; // "Cari Ide Skripsi"

  return (
    <section id="preview" className="relative border-b border-[#273352] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2959FF]/30 bg-[#2959FF]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
              <Sparkles className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
              <span>LIHAT DALAMNYA</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-3xl lg:text-4xl leading-tight">
              Bukan sekadar janji. Ini bentuk tools yang akan lo pakai.
            </h2>
            <p className="mt-2 text-sm text-[#AAB4D0] max-w-xl">
              Antarmuka terstruktur yang didesain khusus agar fokus mahasiswa tidak terdistraksi saat menyiapkan prompt skripsi.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center rounded-lg border border-[#273352] bg-[#0D1426] p-1 self-start">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#2959FF] text-white shadow-sm"
                  : "text-[#AAB4D0] hover:text-[#FFF9EE]"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("generator")}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "generator"
                  ? "bg-[#2959FF] text-white shadow-sm"
                  : "text-[#AAB4D0] hover:text-[#FFF9EE]"
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Generator</span>
            </button>
          </div>
        </div>

        {/* Mock Browser Container */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-[#273352] bg-[#080D1D] shadow-2xl shadow-black/50">
          {/* Browser Top Window Chrome */}
          <div className="flex items-center justify-between border-b border-[#273352] bg-[#11182D] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF6F61]/80" />
              <span className="h-3 w-3 rounded-full bg-[#70E1B6]/80" />
              <span className="h-3 w-3 rounded-full bg-[#2959FF]/80" />
            </div>

            <div className="flex items-center gap-2 rounded-md border border-[#273352] bg-[#080D1D] px-4 py-1 text-[11px] font-mono text-[#AAB4D0]">
              <span>skriflow.app{activeTab === "dashboard" ? "/tools" : `/tools/${selectedTool.slug}`}</span>
            </div>

            <div className="text-[11px] font-semibold text-[#70E1B6]">
              {activeTab === "dashboard" ? "Mode Katalog" : "Mode Perakit"}
            </div>
          </div>

          {/* Simulated Browser Inner Canvas */}
          <div className="p-5 sm:p-8 bg-[#080D1D]">
            {activeTab === "dashboard" ? (
              <div className="space-y-6">
                {/* Mini Header */}
                <div className="flex items-center justify-between border-b border-[#273352]/70 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#FFF9EE]">SKRIFLOW</span>
                    <span className="rounded bg-[#2959FF]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#70E1B6] border border-[#2959FF]/30">
                      PROTOTYPE
                    </span>
                  </div>
                  <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#AAB4D0]" aria-hidden="true" />
                    <input
                      type="text"
                      disabled
                      placeholder="Cari tool..."
                      className="w-full rounded-md border border-[#273352] bg-[#11182D] py-1.5 pl-8 pr-2 text-xs text-[#AAB4D0]"
                    />
                  </div>
                </div>

                {/* 4 Active Tool Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ACTIVE_TOOLS.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex flex-col justify-between rounded-xl border border-[#273352] bg-[#11182D] p-4 text-left"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D]">
                            {getToolIcon(tool.iconName)}
                          </div>
                          <PlatformBadge platform={tool.targetPlatform} />
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-[#FFF9EE]">
                          {tool.name}
                        </h4>
                        <p className="mt-1 text-xs text-[#AAB4D0] line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#273352]/60 pt-3 text-[11px] text-[#2959FF]">
                        <span>Tersedia</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#70E1B6]">
                          Buka Generator →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Simulated Generator Header */}
                <div className="rounded-xl border border-[#273352] bg-[#11182D] p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D]">
                        <Lightbulb className="h-5 w-5 text-[#FF6F61]" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#FFF9EE]">
                            {selectedTool.name}
                          </h4>
                          <span className="rounded bg-[#2959FF]/20 px-2 py-0.5 text-[10px] font-semibold text-[#70E1B6] border border-[#2959FF]/30">
                            Template prototype
                          </span>
                        </div>
                        <p className="text-xs text-[#AAB4D0] line-clamp-1">
                          {selectedTool.description}
                        </p>
                      </div>
                    </div>
                    <PlatformBadge platform={selectedTool.targetPlatform} />
                  </div>
                </div>

                {/* 2-Panel Simulated Layout */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Left Panel */}
                  <div className="rounded-xl border border-[#273352] bg-[#11182D] p-4 text-left">
                    <div className="flex items-center justify-between border-b border-[#273352] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-[#2959FF]" aria-hidden="true" />
                        <span className="text-xs font-bold text-[#FFF9EE]">Input Data</span>
                      </div>
                      <span className="text-[10px] text-[#AAB4D0]">Konfigurasi Mahasiswa</span>
                    </div>

                    <div className="mt-3 rounded border border-[#2959FF]/30 bg-[#2959FF]/10 p-2.5 text-[11px] text-[#FFF9EE] flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-[#70E1B6] shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-[#AAB4D0]">
                        Form terstruktur memandu mahasiswa menyusun parameter riset yang tepat.
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedTool.fields.map((field, i) => {
                        const demoFieldId = `demo-field-${i}`;
                        return (
                          <div key={i} className="space-y-1">
                            <label
                              htmlFor={demoFieldId}
                              className="text-[11px] font-semibold text-[#FFF9EE]"
                            >
                              {field.label}
                            </label>
                            <input
                              id={demoFieldId}
                              type="text"
                              disabled
                              placeholder={field.placeholder}
                              className="w-full rounded border border-[#273352] bg-[#080D1D] p-2 text-[11px] text-[#AAB4D0]/60"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#273352]/60">
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-md border border-[#273352] bg-[#080D1D] py-1.5 text-xs font-semibold text-[#AAB4D0]/50"
                      >
                        <Play className="inline h-3 w-3 mr-1" aria-hidden="true" />
                        Generate Prompt
                      </button>
                    </div>
                  </div>

                  {/* Right Panel */}
                  <EmptyPromptState platform={selectedTool.targetPlatform} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2959FF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2959FF]/20 hover:bg-[#1E46D9] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
          >
            <span>Coba Tools</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
