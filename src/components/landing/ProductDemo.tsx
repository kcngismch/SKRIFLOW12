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
      return <Lightbulb className="h-5 w-5 text-[#FF5C8A]" aria-hidden="true" />;
    case "Compass":
      return <Compass className="h-5 w-5 text-[#6D5AE6]" aria-hidden="true" />;
    case "BookOpen":
      return <BookOpen className="h-5 w-5 text-[#FFB84D]" aria-hidden="true" />;
    case "GitCompare":
      return <GitCompare className="h-5 w-5 text-[#FFB84D]" aria-hidden="true" />;
    default:
      return <Lightbulb className="h-5 w-5 text-[#FF5C8A]" aria-hidden="true" />;
  }
};

export const ProductDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "generator">("dashboard");
  const selectedTool = ACTIVE_TOOLS[0]; // "Cari Ide Skripsi"

  return (
    <section id="preview" className="relative border-b border-[#2E2748] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
              <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
              <span>LIHAT DALAMNYA</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
              Bukan sekadar janji. Ini bentuk tools yang akan lo pakai.
            </h2>
            <p className="mt-2 text-sm text-[#A79FC4] max-w-xl">
              Antarmuka terstruktur yang didesain khusus agar fokus mahasiswa tidak terdistraksi saat menyiapkan prompt skripsi.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center rounded-lg border border-[#2E2748] bg-[#120E24] p-1 self-start">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#6D5AE6] text-white shadow-sm"
                  : "text-[#A79FC4] hover:text-[#FBFAFF]"
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
                  ? "bg-[#6D5AE6] text-white shadow-sm"
                  : "text-[#A79FC4] hover:text-[#FBFAFF]"
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Generator</span>
            </button>
          </div>
        </div>

        {/* Mock Browser Container */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-[#2E2748] bg-[#0C0A1A] shadow-2xl shadow-black/50">
          {/* Browser Top Window Chrome */}
          <div className="flex items-center justify-between border-b border-[#2E2748] bg-[#191430] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF5C8A]/80" />
              <span className="h-3 w-3 rounded-full bg-[#FFB84D]/80" />
              <span className="h-3 w-3 rounded-full bg-[#6D5AE6]/80" />
            </div>

            <div className="flex items-center gap-2 rounded-md border border-[#2E2748] bg-[#0C0A1A] px-4 py-1 text-[12px] font-mono text-[#A79FC4]">
              <span>skriflow.app{activeTab === "dashboard" ? "/tools" : `/tools/${selectedTool.slug}`}</span>
            </div>

            <div className="text-[12px] font-semibold text-[#FFB84D]">
              {activeTab === "dashboard" ? "Mode Katalog" : "Mode Perakit"}
            </div>
          </div>

          {/* Simulated Browser Inner Canvas */}
          <div className="p-5 sm:p-8 bg-[#0C0A1A]">
            {activeTab === "dashboard" ? (
              <div className="space-y-6">
                {/* Mini Header */}
                <div className="flex items-center justify-between border-b border-[#2E2748]/70 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#FBFAFF]">SKRIFLOW</span>
                    <span className="rounded bg-[#6D5AE6]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#FFB84D] border border-[#6D5AE6]/30">
                      PROTOTYPE
                    </span>
                  </div>
                  <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#A79FC4]" aria-hidden="true" />
                    <input
                      type="text"
                      disabled
                      placeholder="Cari tool..."
                      className="w-full rounded-md border border-[#2E2748] bg-[#191430] py-1.5 pl-8 pr-2 text-xs text-[#A79FC4]"
                    />
                  </div>
                </div>

                {/* 4 Active Tool Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ACTIVE_TOOLS.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-4 text-left"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A]">
                            {getToolIcon(tool.iconName)}
                          </div>
                          <PlatformBadge platform={tool.targetPlatform} />
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-[#FBFAFF]">
                          {tool.name}
                        </h4>
                        <p className="mt-1 text-xs text-[#A79FC4] line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#2E2748]/60 pt-3 text-[12px] text-[#6D5AE6]">
                        <span>Tersedia</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#FFB84D]">
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
                <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A]">
                        <Lightbulb className="h-5 w-5 text-[#FF5C8A]" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#FBFAFF]">
                            {selectedTool.name}
                          </h4>
                          <span className="rounded bg-[#6D5AE6]/20 px-2 py-0.5 text-[11px] font-semibold text-[#FFB84D] border border-[#6D5AE6]/30">
                            Template prototype
                          </span>
                        </div>
                        <p className="text-xs text-[#A79FC4] line-clamp-1">
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
                  <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-4 text-left">
                    <div className="flex items-center justify-between border-b border-[#2E2748] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-[#6D5AE6]" aria-hidden="true" />
                        <span className="text-xs font-bold text-[#FBFAFF]">Input Data</span>
                      </div>
                      <span className="text-[11px] text-[#A79FC4]">Konfigurasi Mahasiswa</span>
                    </div>

                    <div className="mt-3 rounded border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 p-2.5 text-[12px] text-[#FBFAFF] flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-[#FFB84D] shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-[#A79FC4]">
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
                              className="text-[12px] font-semibold text-[#FBFAFF]"
                            >
                              {field.label}
                            </label>
                            <input
                              id={demoFieldId}
                              type="text"
                              disabled
                              placeholder={field.placeholder}
                              className="w-full rounded border border-[#2E2748] bg-[#0C0A1A] p-2 text-[12px] text-[#A79FC4]/60"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#2E2748]/60">
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-md border border-[#2E2748] bg-[#0C0A1A] py-1.5 text-xs font-semibold text-[#A79FC4]/50"
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
            className="inline-flex items-center gap-2 rounded-lg bg-[#6D5AE6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6D5AE6]/20 hover:bg-[#5A46D6] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
          >
            <span>Coba Tools</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
