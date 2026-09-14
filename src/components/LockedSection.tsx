import React from "react";
import { LOCKED_PHASES } from "@/data/tools";
import { Lock } from "lucide-react";

export const LockedSection: React.FC = () => {
  return (
    <section className="mt-14 border-t border-[#2E2748]/70 pt-10">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FBFAFF]">
            Tahapan Lanjutan
          </h2>
          <p className="text-xs text-[#A79FC4]">
            Fase lanjutan skripsi yang akan dibuka secara bertahap setelah pengujian prototype awal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {LOCKED_PHASES.map((phase) => (
          <div
            key={phase.id}
            aria-disabled="true"
            className="relative flex flex-col justify-between rounded-xl border border-[#2E2748]/60 bg-[#120E24]/70 p-5 select-none cursor-not-allowed opacity-75 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A] text-[#A79FC4]/60">
                <Lock className="h-4 w-4 text-[#A79FC4]" />
              </div>
              <span className="inline-flex items-center rounded border border-[#2E2748] bg-[#191430] px-2 py-0.5 text-[11px] font-bold tracking-wider text-[#A79FC4]">
                {phase.badge}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-semibold text-[#A79FC4]">
                {phase.title}
              </h3>
              <p className="mt-1 text-xs text-[#A79FC4]/60">
                Terkunci • Akan tersedia pada fase berikutnya
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
