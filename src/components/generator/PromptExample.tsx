"use client";

import React from "react";
import { Eye } from "lucide-react";

/**
 * Contoh tampilan hasil prompt di empty state (ilustrasi statis, bukan prompt asli).
 * Tujuan: user yang belum pernah pakai AI paham "nanti hasilnya kayak gini" sebelum mengisi form.
 * ponytail: teks contoh statis bisa bergeser dari output assembler — upgrade: render dari fixture asli.
 */

const SINGLE_EXAMPLE = `[PERAN]

Kamu adalah partner brainstorming akademik untuk mahasiswa S1.

[KONTEKS MAHASISWA]

- Program Studi: Akuntansi
- Minat atau Isu yang Menarik: pengelolaan keuangan UMKM
- Pendekatan yang Lebih Disukai: Kualitatif
- ... (isi sesuai formulirmu)

[TUGAS ANALISIS]

...
(Kurang lebih 2.000-3.000 karakter: instruksi langkah demi
langkah, aturan MAIN, dan format output yang harus diikuti AI.)`;

const NOTEBOOKLM_EXAMPLE = `Langkah 1 — Kumpulkan Literatur:
Prompt untuk NotebookLM mencari & memetakan jurnal/sumber
terverifikasi sesuai topikmu (dengan tabel register sumber).

Langkah 2 — Buat Paket Bukti:
Prompt untuk menyusun paket bukti dari sumber Langkah 1 —
dilengkapi ID sumber, bukti keterbacaan, dan status verifikasi.`;

export const PromptExample: React.FC<{ variant: "single" | "notebooklm" }> = ({ variant }) => {
  return (
    <details className="mt-4 w-full max-w-md rounded-lg border border-[#273352] bg-[#080D1D]/60 text-left">
      <summary className="flex cursor-pointer items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold text-[#70E1B6] hover:text-[#FFF9EE] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        Lihat contoh hasil nanti
      </summary>
      <div className="px-4 pb-4">
        <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-[#273352] bg-[#080D1D] p-3 font-mono text-[10px] leading-relaxed text-[#AAB4D0]">
          {variant === "single" ? SINGLE_EXAMPLE : NOTEBOOKLM_EXAMPLE}
        </pre>
        <p className="mt-2 text-[10px] text-[#AAB4D0]/60">
          Ilustrasi bentuk output — isi aslinya mengikuti formulirmu.
        </p>
      </div>
    </details>
  );
};
