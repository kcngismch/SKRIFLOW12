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
      return <Lightbulb className="h-5 w-5 text-[#FF6F61]" />;
    case "Compass":
      return <Compass className="h-5 w-5 text-[#2959FF]" />;
    case "BookOpen":
      return <BookOpen className="h-5 w-5 text-[#70E1B6]" />;
    case "GitCompare":
      return <GitCompare className="h-5 w-5 text-[#70E1B6]" />;
    default:
      return <Lightbulb className="h-5 w-5 text-[#FF6F61]" />;
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col justify-between rounded-xl border border-[#273352] bg-[#11182D] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#2959FF]/60 hover:bg-[#16213D] hover:shadow-xl hover:shadow-[#2959FF]/5 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D] transition-colors group-hover:border-[#2959FF]/50 group-hover:bg-[#2959FF]/10">
            {getToolIcon(tool.iconName)}
          </div>
          <PlatformBadge platform={tool.targetPlatform} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-[#FFF9EE] transition-colors group-hover:text-white">
          {tool.name}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#AAB4D0]">
          {tool.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#273352]/70 pt-4 text-xs font-semibold text-[#AAB4D0] transition-colors group-hover:text-[#FFF9EE]">
        <span className="text-[11px] text-[#AAB4D0]/80">Siap digunakan</span>
        <span className="inline-flex items-center gap-1.5 text-[#2959FF] transition-transform group-hover:translate-x-1 group-hover:text-[#70E1B6]">
          Buka Generator
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};
