import React from "react";
import { Sliders, Cpu, GitFork, HardDriveDownload, Sparkles } from "lucide-react";

const FEATURES = [
  {
    title: "Form yang memandu konteks",
    description:
      "Field disesuaikan dengan pekerjaan yang sedang lo lakukan, bukan satu form generik untuk semua kebutuhan.",
    icon: Sliders,
    badge: null,
    iconColor: "text-[#6D5AE6]",
  },
  {
    title: "Prompt dirakit otomatis",
    description:
      "Jawaban form diubah menjadi konteks, tugas, aturan, dan format output yang lebih terstruktur.",
    icon: Cpu,
    badge: null,
    iconColor: "text-[#FFB84D]",
  },
  {
    title: "Tool AI sesuai pekerjaan",
    description:
      "NotebookLM digunakan untuk pekerjaan berbasis sumber, sedangkan ChatGPT atau Gemini digunakan untuk brainstorming dan membedah hasil.",
    icon: GitFork,
    badge: null,
    iconColor: "text-[#FF5C8A]",
  },
  {
    title: "Input tersimpan di perangkat",
    description:
      "Isian dapat dipulihkan tanpa menyimpan data penelitian ke database SKRIFLOW.",
    icon: HardDriveDownload,
    badge: null,
    iconColor: "text-[#FBFAFF]",
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="fitur" className="relative border-b border-[#2E2748] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
            <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
            <span>YANG DIBUAT LEBIH MUDAH</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
            Lo nggak perlu menghafal cara menulis prompt panjang.
          </h2>

          <p className="mt-4 text-sm text-[#A79FC4] sm:text-base leading-relaxed">
            Biarkan sistem merapikan instruksi, peran AI, dan batasan metodologi ke dalam format prompt standar akademik.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-6 sm:p-7 transition-all duration-200 hover:border-[#6D5AE6]/50 hover:bg-[#221A42]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A]">
                      <Icon className={`h-5 w-5 ${feature.iconColor}`} aria-hidden="true" />
                    </div>

                    {feature.badge && (
                      <span className="rounded bg-[#6D5AE6]/20 border border-[#6D5AE6]/40 px-2 py-0.5 text-[11px] font-bold tracking-wider text-[#FFB84D]">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[#FBFAFF]">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#A79FC4]">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
