import React from "react";
import { Sliders, Cpu, GitFork, HardDriveDownload, Sparkles } from "lucide-react";

const FEATURES = [
  {
    title: "Form yang memandu konteks",
    description:
      "Field disesuaikan dengan pekerjaan yang sedang lo lakukan, bukan satu form generik untuk semua kebutuhan.",
    icon: Sliders,
    badge: null,
    iconColor: "text-[#2959FF]",
  },
  {
    title: "Prompt dirakit otomatis",
    description:
      "Jawaban form diubah menjadi konteks, tugas, aturan, dan format output yang lebih terstruktur.",
    icon: Cpu,
    badge: null,
    iconColor: "text-[#70E1B6]",
  },
  {
    title: "Tool AI sesuai pekerjaan",
    description:
      "NotebookLM digunakan untuk pekerjaan berbasis sumber, sedangkan ChatGPT atau Gemini digunakan untuk brainstorming dan membedah hasil.",
    icon: GitFork,
    badge: null,
    iconColor: "text-[#FF6F61]",
  },
  {
    title: "Input tersimpan di perangkat",
    description:
      "Isian dapat dipulihkan tanpa menyimpan data penelitian ke database SKRIFLOW.",
    icon: HardDriveDownload,
    badge: null,
    iconColor: "text-[#FFF9EE]",
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="fitur" className="relative border-b border-[#273352] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#70E1B6]/30 bg-[#70E1B6]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
            <Sparkles className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
            <span>YANG DIBUAT LEBIH MUDAH</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-3xl lg:text-4xl leading-tight">
            Lo nggak perlu menghafal cara menulis prompt panjang.
          </h2>

          <p className="mt-4 text-sm text-[#AAB4D0] sm:text-base leading-relaxed">
            Biarkan sistem merapikan instruksi, peran AI, dan batasan metodologi ke dalam format prompt standar akademik.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-xl border border-[#273352] bg-[#11182D] p-6 sm:p-7 transition-all duration-200 hover:border-[#2959FF]/50 hover:bg-[#16213D]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D]">
                      <Icon className={`h-5 w-5 ${feature.iconColor}`} aria-hidden="true" />
                    </div>

                    {feature.badge && (
                      <span className="rounded bg-[#2959FF]/20 border border-[#2959FF]/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#70E1B6]">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[#FFF9EE]">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#AAB4D0]">
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
