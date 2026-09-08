"use client";

import React, { useSyncExternalStore, useMemo, useState } from "react";
import { ScrollText, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

const emptySubscribe = () => () => {};

/**
 * Deklarasi penggunaan AI (mengacu Pola rujukan kejujuran akademik, mis. Peraturan Rektor UI 16/2025):
 * di-prefill dari jejak proses asli di aplikasi (tool dipakai + platform), bukan digenerate AI.
 * Mahasiswa yang melengkapi & menyesuaikan — sesuai kebijakan kampus masing-masing.
 */
export const AiUsageDeclaration: React.FC<{
  phenomenonSummary: string;
  literatureCount: number;
}> = ({ phenomenonSummary, literatureCount }) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [copied, setCopied] = useState(false);
  const [edited, setEdited] = useState(false);
  const [value, setValue] = useState("");

  const prefill = useMemo(() => {
    const lines: string[] = [];
    lines.push(
      "Dalam penyusunan kerangka awal penelitian ini, saya menggunakan bantuan AI generatif secara terbatas sebagai alat bantu proses, dengan rincian:"
    );
    lines.push("");
    lines.push(
      "1. Pencarian dan pemilihan fenomena awal: prompt terstruktur dijalankan pada ChatGPT/Gemini; setiap kandidat fenomena wajib disertai bukti dari sumber yang dapat diverifikasi (tautan, lokasi bukti, dan batas interpretasinya). Saya memeriksa dan menyeleksi bukti tersebut sebelum digunakan."
    );
    if (literatureCount > 0) {
      lines.push(
        `2. Pencarian literatur: ${literatureCount} artikel kandidat dikumpulkan melalui NotebookLM (Deep Research) berdasarkan prompt terstruktur; saya meninjau dokumen full-text sebelum memasukkannya.`
      );
    }
    lines.push(
      `${literatureCount > 0 ? 3 : 2}. Rekonsiliasi fenomena dan literatur: hasil dianalisis ulang dengan bantuan AI untuk memetakan keterbatasan pengetahuan, kandidat gap berstatus (bukan gap final), dan alternatif arah penelitian; semua klaim memiliki batas penggunaan dan daftar klaim terlarang.`
    );
    lines.push("");
    lines.push(
      "AI tidak digunakan untuk menentukan judul, rumusan masalah final, gap final, novelty, metode final, maupun menulis draft bab. Keputusan penelitian tetap saya sebagai peneliti yang bertanggung jawab, dan seluruh bagian naskah saya tulis serta pertanggungjawabkan sendiri."
    );
    if (phenomenonSummary.trim().length > 0) {
      lines.push("");
      lines.push(`Fenomena yang menjadi pijakan: ${phenomenonSummary.trim()}`);
    }
    return lines.join("\n");
  }, [phenomenonSummary, literatureCount]);

  const shown = isMounted ? (edited ? value : prefill) : "";

  const handleCopy = async () => {
    const success = await copyToClipboard(shown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-[#273352] bg-[#080D1D] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-bold text-[#FFF9EE]">
          <ScrollText className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
          8. Deklarasi Penggunaan AI (draf — sesuaikan dengan kebijakan kampusmu)
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#16213D] px-3 py-1.5 text-[11px] font-semibold text-[#FFF9EE] hover:border-[#2959FF] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2959FF]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#70E1B6]" aria-hidden="true" />
                <span className="text-[#70E1B6]">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                <span>Salin Deklarasi</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-[#AAB4D0]/80">
        Draf ini disusun otomatis dari jejak prosesmu di SKRIFLOW (bukan tulisan AI). Banyak kampus
        kini meminta deklarasi penggunaan AI; periksa aturan kampusmu lalu sesuaikan sebelum dilampirkan.
      </p>
      <textarea
        rows={10}
        value={shown}
        onChange={(e) => {
          setValue(e.target.value);
          setEdited(true);
        }}
        aria-label="Draf deklarasi penggunaan AI"
        className="w-full resize-y rounded-lg border border-[#273352] bg-[#11182D] p-3 font-mono text-[11px] leading-relaxed text-[#FFF9EE] focus:border-[#2959FF] focus:outline-none focus:ring-1 focus:ring-[#2959FF]"
      />
    </div>
  );
};
