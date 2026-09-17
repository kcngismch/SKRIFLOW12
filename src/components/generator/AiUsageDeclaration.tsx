"use client";

import React, { useSyncExternalStore, useMemo, useState } from "react";
import { ScrollText, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

const emptySubscribe = () => () => {};

/**
 * Deklarasi penggunaan AI (mengacu Pola rujukan kejujuran akademik, mis. Peraturan Rektor UI 16/2025):
 * di-prefill HANYA fakta proses yang produk benar-benar tahu (tool dipakai, platform, jumlah artikel,
 * fenomena pijakan, batas penggunaan klaim).
 * Klaim pertanggungjawaban mahasiswa TIDAK di-prefill — bagian bertanda `[isi sendiri]` wajib
 * ditulis mahasiswa sendiri. Produk melaporkan proses; mahasiswa yang menulis pertanggungjawabannya.
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
      "Catatan proses penggunaan AI dalam penelitian ini. Butir di bawah diisi otomatis dari jejak pemakaian tool (fakta proses, bukan tulisan AI). Bagian bertanda [isi sendiri] adalah pertanggungjawaban yang harus kamu tulis sendiri — tool ini tidak mengisinya untukmu."
    );
    lines.push("");
    lines.push(
      "1. Pencarian dan pemilihan fenomena awal: prompt terstruktur dijalankan pada ChatGPT/Gemini. Tool mewajibkan setiap kandidat fenomena disertai bukti dari sumber yang dapat diverifikasi (tautan, lokasi bukti, batas interpretasi)."
    );
    lines.push(
      "   Pemeriksaan dan penyeleksian bukti: [isi sendiri — kapan dan bagaimana kamu memeriksanya]"
    );
    if (literatureCount > 0) {
      lines.push(
        `2. Pencarian literatur: ${literatureCount} artikel kandidat dikumpulkan melalui NotebookLM (Deep Research) berdasarkan prompt terstruktur.`
      );
      lines.push(
        "   Peninjauan dokumen full-text: [isi sendiri — berapa artikel yang benar-benar kamu baca penuh, dan catatan apa yang kamu ambil]"
      );
    }
    lines.push(
      `${literatureCount > 0 ? 3 : 2}. Rekonsiliasi fenomena dan literatur: hasil dianalisis ulang dengan bantuan AI untuk memetakan keterbatasan pengetahuan, kandidat gap berstatus (bukan gap final), dan alternatif arah penelitian. Semua klaim dibatasi oleh catatan batas penggunaan dan daftar klaim terlarang yang disertakan tool.`
    );
    lines.push(
      `${literatureCount > 0 ? 4 : 3}. Batas penggunaan AI pada alur ini: judul, rumusan masalah final, gap final, novelty, metode final, dan penulisan draf bab tidak dihasilkan oleh tool ini.`
    );
    lines.push(
      "   Peran dan tanggung jawab peneliti: [isi sendiri — tulis sendiri bagian ini]"
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
    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-bold text-[#FBFAFF]">
          <ScrollText className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
          8. Deklarasi Penggunaan AI (catatan proses — lengkapi bagian [isi sendiri])
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#221A42] px-3 py-1.5 text-[12px] font-semibold text-[#FBFAFF] hover:border-[#6D5AE6] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6D5AE6]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#FFB84D]" aria-hidden="true" />
                <span className="text-[#FFB84D]">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                <span>Salin Catatan Proses</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-[#A79FC4]/80">
        Teks di bawah memuat fakta proses dari jejak pemakaianmu di SKRIFLOW (bukan tulisan AI) — bukan
        pernyataan bahwa kamu sudah mengerjakan sesuatu. Bagian bertanda [isi sendiri] wajib kamu isi
        dengan tulisanmu sendiri; periksa juga aturan kampusmu sebelum dilampirkan.
      </p>
      <textarea
        rows={10}
        value={shown}
        onChange={(e) => {
          setValue(e.target.value);
          setEdited(true);
        }}
        aria-label="Catatan proses penggunaan AI (lengkapi bagian bertanda [isi sendiri])"
        className="w-full resize-y rounded-lg border border-[#2E2748] bg-[#191430] p-3 font-mono text-[12px] leading-relaxed text-[#FBFAFF] focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6]"
      />
    </div>
  );
};
