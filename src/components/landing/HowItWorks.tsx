import React from "react";
import { MousePointerClick, FormInput, CopyCheck, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Pilih kebutuhan",
    description:
      "Mulai dari mencari ide, fenomena empiris, memetakan literatur, atau membedah hasil NotebookLM.",
    icon: MousePointerClick,
    accent: "text-[#2959FF]",
    badgeBg: "bg-[#2959FF]/10 text-[#2959FF] border-[#2959FF]/30",
  },
  {
    step: "02",
    title: "Isi kondisi skripsimu",
    description:
      "Masukkan program studi, preferensi data, batasan, dan bahan yang sudah tersedia.",
    icon: FormInput,
    accent: "text-[#70E1B6]",
    badgeBg: "bg-[#70E1B6]/10 text-[#70E1B6] border-[#70E1B6]/30",
  },
  {
    step: "03",
    title: "Salin dan jalankan",
    description:
      "Copy prompt yang dihasilkan, lalu gunakan di NotebookLM, ChatGPT, atau Gemini.",
    icon: CopyCheck,
    accent: "text-[#FF6F61]",
    badgeBg: "bg-[#FF6F61]/10 text-[#FF6F61] border-[#FF6F61]/30",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="cara-kerja" className="relative border-b border-[#273352] py-16 sm:py-24 bg-[#080D1D]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2959FF]/30 bg-[#2959FF]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
            <span>CARA KERJA</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-3xl lg:text-4xl leading-tight">
            Dari bingung ke prompt siap pakai dalam tiga langkah.
          </h2>
          <p className="mt-3 text-sm text-[#AAB4D0]">
            Proses terarah tanpa perlu prompt engineering yang rumit.
          </p>
        </div>

        {/* 3 Step Cards with Visual Connector */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-xl border border-[#273352] bg-[#11182D] p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 hover:border-[#2959FF]/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center justify-center font-mono text-xs font-bold rounded-lg border px-2.5 py-1 ${item.badgeBg}`}>
                      Langkah {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D]">
                      <Icon className={`h-5 w-5 ${item.accent}`} aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-[#FFF9EE]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#AAB4D0]">
                    {item.description}
                  </p>
                </div>

                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#080D1D] border border-[#273352] text-[#AAB4D0]">
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
