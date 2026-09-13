import React from "react";
import { ACTIVE_TOOLS } from "@/data/tools";
import { ToolCard } from "@/components/ToolCard";
import { Compass } from "lucide-react";

export const CurrentToolsSection: React.FC = () => {
  return (
    <section className="relative border-b border-[#2E2748] py-16 sm:py-24 bg-[#0C0A1A]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
            <Compass className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
            <span>KATALOG PROTOTYPE</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
            Empat tools pertama yang bisa lo uji.
          </h2>

          <p className="mt-3 text-sm text-[#A79FC4]">
            Pilih salah satu tool di bawah untuk melihat struktur parameter dan template prompt yang dirancang untuk kebutuhan penelitianmu.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVE_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
};
