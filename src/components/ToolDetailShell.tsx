import React from "react";
import Link from "next/link";
import { Tool } from "@/types/tool";
import { PlatformBadge } from "./PlatformBadge";
import { ToolGeneratorContainer } from "./generator/ToolGeneratorContainer";
import { IdeaToolContainer } from "./generator/IdeaToolContainer";
import { PhenomenonToolContainer } from "./generator/PhenomenonToolContainer";
import { BedahToolContainer } from "./generator/BedahToolContainer";
import { AccessGate } from "./generator/AccessGate";
import { ToolStepper } from "./generator/ToolStepper";
import {
  ArrowLeft,
  ChevronRight,
  Lightbulb,
  BookOpen,
  GitCompare,
} from "lucide-react";

interface ToolDetailShellProps {
  tool: Tool;
}

const getToolIcon = (iconName: Tool["iconName"]) => {
  switch (iconName) {
    case "Lightbulb":
      return <Lightbulb className="h-6 w-6 text-[#FF6F61]" aria-hidden="true" />;
    case "BookOpen":
      return <BookOpen className="h-6 w-6 text-[#2959FF]" aria-hidden="true" />;
    case "GitCompare":
      return <GitCompare className="h-6 w-6 text-[#70E1B6]" aria-hidden="true" />;
    default:
      return <Lightbulb className="h-6 w-6 text-[#FF6F61]" aria-hidden="true" />;
  }
};

export const ToolDetailShell: React.FC<ToolDetailShellProps> = ({ tool }) => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Stepper: posisi dalam alur 4 tool */}
      <ToolStepper currentStep={tool.slug} />

      {/* Navigation & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={tool.previousStep?.href || "/tools"}
          className="inline-flex items-center gap-2 rounded-lg border border-[#273352] bg-[#11182D] px-3.5 py-1.5 text-xs font-semibold text-[#FFF9EE] transition-colors hover:border-[#2959FF] hover:bg-[#16213D] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{tool.previousStep?.label || "Kembali ke Dashboard"}</span>
        </Link>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#AAB4D0]">
          <Link
            href="/tools"
            className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none rounded px-1"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#AAB4D0]/50" aria-hidden="true" />
          <span className="text-[#FFF9EE] font-medium truncate max-w-[200px] sm:max-w-none">
            {tool.name}
          </span>
        </nav>
      </div>

      {/* Tool Header Summary Card */}
      <div className="relative overflow-hidden rounded-xl border border-[#273352] bg-[#11182D] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#273352] bg-[#080D1D]">
              {getToolIcon(tool.iconName)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-[#FFF9EE] sm:text-2xl">
                  {tool.name}
                </h1>
                <span className="rounded-md border border-[#2959FF]/30 bg-[#2959FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#70E1B6]">
                  {tool.badgeText || "Template generator"}
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#AAB4D0]">
                {tool.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <PlatformBadge platform={tool.targetPlatform} size="md" />
          </div>
        </div>
      </div>

      {/* Active Container: Tool 1 gratis, Tool 2-4 diproteksi AccessGate */}
      {tool.id === "tool-1" || tool.slug === "cari-ide-skripsi" ? (
        <IdeaToolContainer tool={tool} />
      ) : (
        <AccessGate>
          {tool.slug === "cari-fenomena-awal" || tool.slug === "cari-validasi-fenomena" ? (
            <PhenomenonToolContainer tool={tool} />
          ) : tool.slug === "bedah-hasil-notebooklm" ? (
            <BedahToolContainer tool={tool} />
          ) : (
            <ToolGeneratorContainer key={tool.slug} tool={tool} />
          )}
        </AccessGate>
      )}
    </div>
  );
};
