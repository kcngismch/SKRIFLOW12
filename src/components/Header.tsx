import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

interface HeaderProps {
  showBackToLanding?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showBackToLanding = true }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#273352] bg-[#080D1D]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-lg py-1 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            aria-label="Kembali ke Landing Page SKRIFLOW"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2959FF]/15 border border-[#2959FF]/40 text-[#70E1B6] transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-[#70E1B6]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#FFF9EE]">
                  SKRIFLOW
                </span>
                <span className="rounded bg-[#2959FF]/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#70E1B6] border border-[#2959FF]/30">
                  PROTOTYPE
                </span>
              </div>
              <span className="text-xs font-medium text-[#AAB4D0]">
                Prompt Tools
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {showBackToLanding && (
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#11182D] px-3 py-1.5 text-xs font-medium text-[#AAB4D0] transition-colors hover:border-[#2959FF]/50 hover:text-[#FFF9EE] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Landing Page</span>
            </Link>
          )}
          <div className="flex items-center gap-2 text-xs text-[#AAB4D0]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#70E1B6] animate-pulse" />
            <span className="hidden md:inline">Prototype Eksplorasi Awal</span>
            <span className="md:hidden">Prototype</span>
          </div>
        </div>
      </div>
    </header>
  );
};
