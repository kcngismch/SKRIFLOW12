"use client";

import React, { useState } from "react";
import { MessageSquareWarning, Copy, Check, Send } from "lucide-react";

/**
 * Jalur lapor hasil yang salah. Tanpa ini, mahasiswa yang menemukan keluaran
 * keliru tidak punya cara memberi tahu — dan produk yang akurasinya dipertanyakan
 * kehilangan satu-satunya sumber belajar dari kegagalan nyata.
 *
 * ponytail: tanpa backend, laporan disusun jadi teks siap kirim (salin ke
 * WhatsApp/email). Kalau Supabase sudah ada, ganti handler-nya jadi POST.
 */
const NOMOR_WA = ""; // diisi Aul kalau sudah ada nomor resmi

export const LaporHasilPanel: React.FC<{
  namaTool: string;
  konteks?: string;
}> = ({ namaTool, konteks }) => {
  const [terbuka, setTerbuka] = useState(false);
  const [jenis, setJenis] = useState("Salah menyebut sumber");
  const [catatan, setCatatan] = useState("");
  const [tersalin, setTersalin] = useState(false);

  const rekap = [
    `Laporan hasil Skriflow`,
    `Tool: ${namaTool}`,
    `Jenis masalah: ${jenis}`,
    catatan.trim() ? `Catatan: ${catatan.trim()}` : "",
    konteks ? `Konteks: ${konteks}` : "",
    `Waktu: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(rekap);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2500);
    } catch {
      setTersalin(false);
    }
  };

  const kirim = () => {
    const teks = encodeURIComponent(rekap);
    window.open(
      NOMOR_WA
        ? `https://wa.me/${NOMOR_WA}?text=${teks}`
        : `mailto:?subject=${encodeURIComponent("Laporan hasil Skriflow")}&body=${teks}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-[#FF9E5E]" aria-hidden="true" />
          <span className="text-sm font-bold text-[#FBFAFF]">Ada hasil yang terasa salah?</span>
        </div>
        <button
          type="button"
          onClick={() => setTerbuka((v) => !v)}
          className="inline-flex min-h-[36px] items-center rounded-lg border border-[#2E2748] px-3 text-xs font-semibold text-[#A79FC4] transition hover:border-[#FF9E5E]/50 hover:text-[#FBFAFF]"
        >
          {terbuka ? "Tutup" : "Laporkan"}
        </button>
      </div>

      {!terbuka && (
        <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
          Laporkan keluaran yang keliru, sumber yang salah, atau langkah yang membingungkan. Laporanmu dipakai untuk
          memperbaiki tool ini — bukan untuk menilai kamu.
        </p>
      )}

      {terbuka && (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#FBFAFF]">Jenis masalah</span>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-2.5 text-xs text-[#FBFAFF] focus:border-[#6D5AE6] focus:outline-none"
            >
              <option>Salah menyebut sumber</option>
              <option>Sitasi atau nama penulis keliru</option>
              <option>Kalimat AI terasa mengarang</option>
              <option>Langkahnya membingungkan</option>
              <option>Hasil tidak sesuai permintaan</option>
              <option>Lainnya</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#FBFAFF]">
              Yang salah bagian mana? <span className="font-normal text-[#A79FC4]">(opsional)</span>
            </span>
            <textarea
              rows={4}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis singkat: bagian mana yang keliru dan kenapa menurutmu keliru."
              className="w-full rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-2.5 text-xs leading-relaxed text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none"
            />
          </label>

          <details className="rounded-lg bg-[#191430] p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF]">
              Lihat isi laporan
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#A79FC4]">
              {rekap}
            </pre>
          </details>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={salin}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#2E2748] px-4 text-xs font-bold text-[#FBFAFF] transition hover:border-[#FFB84D]/50"
            >
              {tersalin ? <Check className="h-4 w-4 text-[#70E1B6]" /> : <Copy className="h-4 w-4" />}
              <span>{tersalin ? "Tersalin" : "Salin laporan"}</span>
            </button>
            <button
              type="button"
              onClick={kirim}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FFB84D] px-4 text-xs font-bold text-[#0C0A1A] transition hover:bg-[#F0A63C]"
            >
              <Send className="h-4 w-4" />
              <span>Kirim laporan</span>
            </button>
          </div>

          <p className="text-[12px] leading-relaxed text-[#A79FC4]">
            Belum ada nomor resmi, jadi tombol kirim membuka aplikasi email/WhatsApp milikmu. Kamu selalu bisa salin
            laporannya dan kirim lewat kanal apa pun.
          </p>
        </div>
      )}
    </div>
  );
};
