import React from "react";
import { CheckCircle2, Compass, Layers } from "lucide-react";
import { ACTIVE_TOOLS } from "@/data/tools";

export const Hero: React.FC = () => {
  const toolCount = ACTIVE_TOOLS.length;

  return (
    <section className="relative w-full border-b border-[#2E2748] py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Main Hero Content */}
          <div className="lg:col-span-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
              <Compass className="h-3.5 w-3.5 text-[#FFB84D]" />
              <span>SKRIPSI, SATU LANGKAH SEKALI JALAN</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-4xl lg:text-5xl leading-tight">
              Prompt yang tepat,{" "}
              <span className="text-[#FF5C8A]">tanpa harus jago nulis prompt.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base text-[#A79FC4] sm:text-lg leading-relaxed">
              Pilih kebutuhanmu, isi kondisi skripsimu, lalu bawa prompt yang
              dihasilkan ke NotebookLM, ChatGPT, atau Gemini.
            </p>
          </div>

          {/* Side Target Prototype Card */}
          <div className="lg:col-span-4">
            <div className="relative overflow-hidden rounded-xl border border-[#2E2748] bg-[#191430] p-5 shadow-lg shadow-black/20">
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-[#6D5AE6]/10 blur-xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#2E2748] pb-3">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#FFB84D]">
                  TARGET PROTOTYPE
                </span>
                <span className="flex items-center gap-1 rounded bg-[#2E2748]/70 px-2 py-0.5 text-[12px] font-medium text-[#A79FC4]">
                  <Layers className="h-3 w-3 text-[#6D5AE6]" />
                  {toolCount} Tools Tersedia
                </span>
              </div>

              <div className="mt-3">
                <h2 className="text-lg font-bold text-[#FBFAFF] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FFB84D] shrink-0" />
                  Uji empat tools pertama
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
                  Kita validasi cara pakainya dulu sebelum menambah seluruh
                  perjalanan skripsi.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2E2748]/60 flex items-center justify-between text-[12px] text-[#A79FC4]">
                <span>Empat tools pertama siap diuji</span>
                <span className="text-[#FFB84D] font-medium">Form aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
