import React from "react";
import { AlertCircle, FileSpreadsheet, Compass, ShieldAlert, MessageSquareWarning } from "lucide-react";

const PROBLEMS = [
  {
    number: "01",
    title: "Prompt terlalu umum",
    description:
      "Lo minta ide skripsi, AI langsung memberi judul, variabel, dan metode tanpa memahami data yang bisa lo akses.",
    icon: FileSpreadsheet,
    accentColor: "text-[#FF5C8A]",
    borderColor: "hover:border-[#FF5C8A]/40",
  },
  {
    number: "02",
    title: "Proses penelitian dilompati",
    description:
      "Belum memahami landscape literatur, tetapi sudah buru-buru mencari research gap atau menulis latar belakang.",
    icon: Compass,
    accentColor: "text-[#6D5AE6]",
    borderColor: "hover:border-[#6D5AE6]/40",
  },
  {
    number: "03",
    title: "Hasil AI sulit dipertanggungjawabkan",
    description:
      "Teksnya terlihat rapi, tetapi sumber, alasan pemilihan topik, dan hubungan antarbagian tidak jelas.",
    icon: ShieldAlert,
    accentColor: "text-[#FFB84D]",
    borderColor: "hover:border-[#FFB84D]/40",
  },
  {
    number: "04",
    title: "Makin banyak chat, makin kehilangan arah",
    description:
      "Setiap percakapan membuka kemungkinan baru sampai lo tidak tahu keputusan mana yang sebenarnya sedang dipakai.",
    icon: MessageSquareWarning,
    accentColor: "text-[#FBFAFF]",
    borderColor: "hover:border-[#FBFAFF]/30",
  },
];

export const ProblemSection: React.FC = () => {
  return (
    <section id="masalah" className="relative border-b border-[#2E2748] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FF5C8A]/30 bg-[#FF5C8A]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FF5C8A]">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>MASALAHNYA BUKAN SEKADAR MALAS</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
            Buka AI gampang. Mendapat jawaban yang benar-benar nyambung sama skripsi lo, itu yang bikin muter-muter.
          </h2>

          <p className="mt-4 text-sm text-[#A79FC4] sm:text-base leading-relaxed">
            Ketika konteksnya setengah, pertanyaannya terlalu luas, dan tahap penelitiannya belum jelas, AI akan tetap menjawab—meskipun jawabannya belum tentu bisa lo pakai.
          </p>
        </div>

        {/* 4 Problem Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.number}
                className={`relative flex flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-6 transition-all duration-200 hover:-translate-y-1 ${problem.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#A79FC4]/60">
                      {problem.number}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2E2748] bg-[#0C0A1A]">
                      <Icon className={`h-4 w-4 ${problem.accentColor}`} aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#FBFAFF]">
                    {problem.title}
                  </h3>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#A79FC4]">
                    {problem.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Key Statement */}
        <div className="mt-12 rounded-xl border border-[#2E2748] bg-gradient-to-r from-[#191430] via-[#221A42] to-[#191430] p-6 sm:p-8 text-center shadow-lg">
          <p className="text-base font-bold text-[#FBFAFF] sm:text-lg lg:text-xl">
            &ldquo;AI yang pintar tetap membutuhkan konteks dan instruksi yang benar.&rdquo;
          </p>
          <span className="mt-2 block text-xs text-[#FFB84D]">
            SKRIFLOW menjembatani kondisi nyata skripsimu dengan cara kerja AI
          </span>
        </div>
      </div>
    </section>
  );
};
