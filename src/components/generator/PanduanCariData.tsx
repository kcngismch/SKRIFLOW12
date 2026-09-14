"use client";

import React from "react";
import { Search, Copy, Check, MapPin, AlertTriangle } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import { LABEL_JENIS_SITUS, type JenisSitusData } from "@/types/tool";

interface Props {
  whereToLook?: string[];
  searchKeywords?: string[];
  siteType?: JenisSitusData;
}

/**
 * ADDENDUM E §E.5 — panduan mencari data untuk Uji Kelayakan Data.
 *
 * Ditaruh SEBELUM tombol jawaban, supaya mahasiswa memeriksa dulu, baru menekan
 * "Sudah Dipastikan". Kalau panduan kosong (paket 4B lama), bagian ini tetap tampil
 * dengan peringatan — menyembunyikannya membuat tombol jawaban terasa aman padahal
 * mahasiswa belum memeriksa apa pun (§E.3).
 */
export const PanduanCariData: React.FC<Props> = ({ whereToLook, searchKeywords, siteType }) => {
  const [salin, setSalin] = React.useState<string | null>(null);

  const adaPanduan = (whereToLook?.length ?? 0) > 0 || (searchKeywords?.length ?? 0) > 0;

  const handleCopy = async (teks: string) => {
    const ok = await copyToClipboard(teks);
    if (ok) {
      setSalin(teks);
      setTimeout(() => setSalin(null), 2000);
    }
  };

  if (!adaPanduan) {
    return (
      <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-amber-200">
          <strong>Belum ada panduan pencarian untuk pertanyaan ini.</strong> Artinya kamu belum diberi
          tahu harus mencari ke mana. Jawab dari dugaan, dan tandai sebagai{" "}
          <strong>Belum Dipastikan</strong> — jangan tekan Sudah Dipastikan sebelum kamu benar-benar
          memeriksa sumbernya.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-[#2E2748] bg-[#191430]/60 p-3.5">
      {whereToLook && whereToLook.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#FFB84D]">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Cari di:
          </p>
          <ul className="mt-1.5 space-y-1">
            {whereToLook.map((w, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-[#FBFAFF]">
                • {w}
              </li>
            ))}
          </ul>
          {siteType && (
            <p className="mt-1 text-[13px] text-[#A79FC4]">
              Jenis situs: <strong className="text-[#A79FC4]">{LABEL_JENIS_SITUS[siteType]}</strong>
            </p>
          )}
        </div>
      )}

      {searchKeywords && searchKeywords.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#FFB84D]">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Kata kunci siap tempel (klik untuk menyalin):
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {searchKeywords.map((k, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCopy(k)}
                title="Klik untuk menyalin kata kunci ini"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-2.5 py-1 text-left font-mono text-[13px] text-[#FBFAFF] transition-colors hover:border-[#FFB84D]/50 hover:bg-[#221A42]"
              >
                {salin === k ? (
                  <Check className="h-3 w-3 shrink-0 text-green-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-3 w-3 shrink-0 text-[#8E86AB]" aria-hidden="true" />
                )}
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="border-t border-[#2E2748]/70 pt-2 text-[13px] leading-relaxed text-[#A79FC4]">
        Buka situsnya, tempel kata kuncinya, lalu lihat sendiri datanya ada atau tidak. Baru setelah itu
        pilih jawaban di bawah.
      </p>
    </div>
  );
};
