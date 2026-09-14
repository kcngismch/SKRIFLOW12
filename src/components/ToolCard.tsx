import React from "react";
import Link from "next/link";
import { Tool } from "@/types/tool";
import { PlatformBadge } from "./PlatformBadge";
import { Lightbulb, BookOpen, GitCompare, Compass, ArrowRight } from "lucide-react";

interface ToolCardProps {
  tool: Tool;
}

const getToolIcon = (iconName: Tool["iconName"]) => {
  switch (iconName) {
    case "Lightbulb":
      return <Lightbulb className="h-5 w-5 text-[#FF5C8A]" />;
    case "Compass":
      return <Compass className="h-5 w-5 text-[#6D5AE6]" />;
    case "BookOpen":
      return <BookOpen className="h-5 w-5 text-[#FFB84D]" />;
    case "GitCompare":
      return <GitCompare className="h-5 w-5 text-[#FFB84D]" />;
    default:
      return <Lightbulb className="h-5 w-5 text-[#FF5C8A]" />;
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#6D5AE6]/60 hover:bg-[#221A42] hover:shadow-xl hover:shadow-[#6D5AE6]/5 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A] transition-colors group-hover:border-[#6D5AE6]/50 group-hover:bg-[#6D5AE6]/10">
            {getToolIcon(tool.iconName)}
          </div>
          <PlatformBadge platform={tool.targetPlatform} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-[#FBFAFF] transition-colors group-hover:text-white">
          {tool.name}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#A79FC4]">
          {tool.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#2E2748]/70 pt-4 text-xs font-semibold text-[#A79FC4] transition-colors group-hover:text-[#FBFAFF]">
        <span className="text-[12px] text-[#A79FC4]/80">Siap digunakan</span>
        <span className="inline-flex items-center gap-1.5 text-[#6D5AE6] transition-transform group-hover:translate-x-1 group-hover:text-[#FFB84D]">
          Buka Generator
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};
