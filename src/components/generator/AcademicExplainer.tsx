"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { getAcademicTermInfo } from "@/lib/studentLanguage";

interface AcademicExplainerProps {
  termKey?: string;
  title?: string;
  simpleMeaning?: string;
  whyItMatters?: string;
  technicalDetails?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const AcademicExplainer: React.FC<AcademicExplainerProps> = ({
  termKey,
  title,
  simpleMeaning,
  whyItMatters,
  technicalDetails,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const termInfo = termKey ? getAcademicTermInfo(termKey) : null;

  const displayTitle = title || termInfo?.friendlyLabel || "Penjelasan Konsep";
  const displayMeaning = simpleMeaning || termInfo?.simpleMeaning;
  const displayWhy = whyItMatters || termInfo?.whyItMatters;

  return (
    <div className={`rounded-xl border border-[#273352]/70 bg-[#11182D]/80 p-3.5 text-xs ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 shrink-0 text-[#70E1B6] mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#FFF9EE] text-xs">{displayTitle}</h4>
            {displayMeaning && <p className="text-[#AAB4D0] leading-relaxed">{displayMeaning}</p>}
            {displayWhy && (
              <p className="text-[#70E1B6] text-[11px] font-medium leading-relaxed">
                <strong>Kenapa ini penting? </strong>
                {displayWhy}
              </p>
            )}
          </div>
        </div>

        {(technicalDetails || children || termInfo?.technicalTerm) && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-[#2959FF] hover:text-[#FFF9EE] hover:bg-[#16213D] transition-colors focus-visible:ring-1 focus-visible:ring-[#2959FF] focus-visible:outline-none shrink-0"
          >
            <span>{isOpen ? "Tutup Detail" : "Lihat Detail"}</span>
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {isOpen && (technicalDetails || children || termInfo?.technicalTerm) && (
        <div className="mt-3 pt-3 border-t border-[#273352]/60 text-[11px] text-[#AAB4D0] space-y-2 animate-in fade-in duration-150">
          {termInfo?.technicalTerm && (
            <div className="text-[10px] font-mono text-[#AAB4D0]/60">
              Istilah Akademik / Sistem: {termInfo.technicalTerm}
            </div>
          )}
          {technicalDetails}
          {children}
        </div>
      )}
    </div>
  );
};
