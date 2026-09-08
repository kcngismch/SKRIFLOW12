"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { getStudentStatus } from "@/lib/studentLanguage";

interface StudentFriendlyStatusProps {
  status: string | undefined | null;
  domain?: string;
  showExplanation?: boolean;
  showRawOnExpand?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StudentFriendlyStatus: React.FC<StudentFriendlyStatusProps> = ({
  status,
  domain,
  showExplanation = false,
  showRawOnExpand = false,
  size = "md",
  className = "",
}) => {
  const [expanded, setExpanded] = useState(false);
  const info = getStudentStatus(status, domain);

  const getIcon = () => {
    switch (info.iconType) {
      case "check":
        return <CheckCircle2 className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />;
      case "alert":
        return <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />;
      case "x":
        return <XCircle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />;
      case "clock":
        return <Clock className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />;
      default:
        return <Info className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />;
    }
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size];

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses} ${info.badgeClass}`}
        >
          {getIcon()}
          <span>{info.label}</span>
        </span>

        {(info.description || showRawOnExpand) && showExplanation && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-0.5 text-[#AAB4D0] hover:text-[#FFF9EE] transition-colors focus-visible:ring-1 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            aria-label={expanded ? "Sembunyikan penjelasan status" : "Lihat penjelasan status"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {expanded && (info.description || showRawOnExpand) && (
        <div className="rounded-lg border border-[#273352] bg-[#080D1D] p-2.5 text-xs text-[#AAB4D0] space-y-1 animate-in fade-in duration-150">
          {info.description && <p className="text-[#FFF9EE] leading-relaxed">{info.description}</p>}
          {info.recommendedAction && (
            <p className="text-amber-300/90 text-[11px]">
              <strong>Saran Dosen: </strong>
              {info.recommendedAction}
            </p>
          )}
          {showRawOnExpand && status && (
            <p className="text-[10px] text-[#AAB4D0]/60 font-mono pt-1 border-t border-[#273352]/50">
              Internal Code: {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
