import React from "react";
import { BookMarked, Bot, Sparkles } from "lucide-react";

const PLATFORMS = [
  {
    name: "NotebookLM",
    description: "Sintesis sumber jurnal & riset literatur",
    icon: BookMarked,
    color: "text-[#6D5AE6]",
    bg: "bg-[#6D5AE6]/10",
    border: "border-[#6D5AE6]/30",
  },
  {
    name: "ChatGPT",
    description: "Brainstorming arah topik & bedah hasil",
    icon: Bot,
    color: "text-[#FFB84D]",
    bg: "bg-[#FFB84D]/10",
    border: "border-[#FFB84D]/30",
  },
  {
    name: "Gemini",
    description: "Eksplorasi sudut pandang & analisis konsep",
    icon: Sparkles,
    color: "text-[#FF5C8A]",
    bg: "bg-[#FF5C8A]/10",
    border: "border-[#FF5C8A]/30",
  },
];

export const CompatibilityStrip: React.FC = () => {
  return (
    <section className="relative border-b border-[#2E2748] py-12 bg-[#120E24]/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A79FC4]">
            Prompt dapat digunakan bersama
          </h3>

          <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <div
                  key={platform.name}
                  className={`flex flex-col items-center justify-center rounded-xl border ${platform.border} ${platform.bg} p-4 transition-transform hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${platform.color}`} aria-hidden="true" />
                    <span className="text-sm font-bold text-[#FBFAFF]">
                      {platform.name}
                    </span>
                  </div>
                  <span className="mt-1 text-[12px] text-[#A79FC4]">
                    {platform.description}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-[12px] text-[#A79FC4]/60 max-w-md">
            SKRIFLOW tidak berafiliasi dengan atau mewakili platform tersebut.
          </p>
        </div>
      </div>
    </section>
  );
};
