import React from "react";
import { PlatformTarget } from "@/types/tool";
import { Bot, BookMarked } from "lucide-react";

interface PlatformBadgeProps {
  platform: PlatformTarget;
  size?: "sm" | "md";
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = "sm",
}) => {
  const isNotebookLM = platform === "NotebookLM";

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-3 py-1.5 text-xs sm:text-sm gap-2";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border transition-colors ${sizeClasses} ${
        isNotebookLM
          ? "bg-[#2959FF]/10 border-[#2959FF]/30 text-[#FFF9EE]"
          : "bg-[#70E1B6]/10 border-[#70E1B6]/30 text-[#FFF9EE]"
      }`}
    >
      {isNotebookLM ? (
        <BookMarked className="h-3.5 w-3.5 text-[#2959FF] shrink-0" />
      ) : (
        <Bot className="h-3.5 w-3.5 text-[#70E1B6] shrink-0" />
      )}
      <span>{platform}</span>
    </span>
  );
};
