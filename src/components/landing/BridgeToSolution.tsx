import React from "react";
import { CheckCircle2, Workflow, UserCheck, Layers } from "lucide-react";

const PRINCIPLES = [
  {
    title: "Satu tool untuk satu pekerjaan",
    description:
      "Fokus menyelesaikan satu tahapan riset secara spesifik sebelum berpindah ke langkah berikutnya.",
    icon: Layers,
    color: "text-[#2959FF]",
  },
  {
    title: "Konteks mahasiswa masuk ke dalam prompt",
    description:
      "Program studi, batasan data, dan preferensi metode dirangkai rapi ke dalam instruksi terstruktur.",
    icon: Workflow,
    color: "text-[#70E1B6]",
  },
  {
    title: "Keputusan penelitian tetap di tangan mahasiswa",
    description:
      "AI berfungsi sebagai akselerator dan penguji sudut pandang, bukan pengambil keputusan mutlak.",
    icon: UserCheck,
    color: "text-[#FF6F61]",
  },
];

export const BridgeToSolution: React.FC = () => {
  return (
    <section className="relative border-b border-[#273352] py-16 sm:py-24 bg-[#080D1D]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Heading & Explanation */}
          <div className="lg:col-span-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2959FF]/30 bg-[#2959FF]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>MAKANYA SKRIFLOW DIBUAT</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-3xl lg:text-4xl leading-tight">
              Bukan AI baru. Jalur yang lebih jelas untuk memakai AI yang sudah lo punya.
            </h2>

            <p className="mt-4 text-sm text-[#AAB4D0] sm:text-base leading-relaxed">
              SKRIFLOW tidak menulis skripsi di dalam website. Lo memilih kebutuhan, mengisi kondisi penelitian, lalu mendapatkan prompt yang siap dibawa ke tool AI yang sesuai.
            </p>
          </div>

          {/* Right Column: 3 Core Principles */}
          <div className="lg:col-span-6 space-y-4">
            {PRINCIPLES.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-xl border border-[#273352] bg-[#11182D] p-5 transition-colors hover:border-[#2959FF]/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#273352] bg-[#080D1D]">
                    <Icon className={`h-5 w-5 ${principle.color}`} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#FFF9EE]">
                      {principle.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#AAB4D0] leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
