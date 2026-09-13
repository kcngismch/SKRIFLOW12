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
          ? "bg-[#6D5AE6]/10 border-[#6D5AE6]/30 text-[#FBFAFF]"
          : "bg-[#FFB84D]/10 border-[#FFB84D]/30 text-[#FBFAFF]"
      }`}
    >
      {isNotebookLM ? (
        <BookMarked className="h-3.5 w-3.5 text-[#6D5AE6] shrink-0" />
      ) : (
        <Bot className="h-3.5 w-3.5 text-[#FFB84D] shrink-0" />
      )}
      <span>{platform}</span>
    </span>
  );
};
