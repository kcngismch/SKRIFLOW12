"use client";

import React, { useEffect, useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { bisaBacaClipboard, pasteFromClipboard } from "@/lib/clipboard";

interface Props {
  /** Dipanggil dengan isi clipboard saat berhasil dibaca. */
  onPaste: (teks: string) => void;
  /** Label kustom; default "Tempel dari clipboard". */
  label?: string;
  className?: string;
}

/**
 * Tombol "Tempel dari clipboard" — membaca clipboard langsung supaya mahasiswa
 * tidak perlu klik kotak + Ctrl+V.
 *
 * SENGAJA MENYEMBUNYIKAN DIRI bila `navigator.clipboard.readText` tidak ada.
 * Di HTTP LAN (`http://192.168.1.26:3000`) `navigator.clipboard` UNDEFINED —
 * tombol yang selalu gagal lebih buruk daripada tidak ada tombol. Di HTTPS
 * (produksi/Vercel) tombol ini muncul sendiri tanpa perubahan kode.
 *
 * Catatan: `readText()` menuntut user gesture asli. Klik tombol dari skrip
 * (`element.click()`) memang ditolak browser — itu batasan keamanan, bukan bug.
 */
export const TombolTempelClipboard: React.FC<Props> = ({ onPaste, label, className }) => {
  const [didukung, setDidukung] = useState(false);
  const [status, setStatus] = useState<"idle" | "gagal" | "sukses">("idle");

  // Deteksi di klien saja — nilai server selalu false supaya tidak hydration mismatch.
  useEffect(() => {
    setDidukung(bisaBacaClipboard());
  }, []);

  if (!didukung) return null;

  const handleClick = async () => {
    const teks = await pasteFromClipboard();
    if (teks) {
      onPaste(teks);
      setStatus("sukses");
    } else {
      setStatus("gagal");
    }
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3 py-1.5 text-xs font-semibold text-[#A79FC4] transition hover:border-[#6D5AE6] hover:text-[#FBFAFF]"
      }
    >
      <ClipboardPaste className="h-3.5 w-3.5" />
      <span>
        {status === "sukses"
          ? "Terempel!"
          : status === "gagal"
          ? "Clipboard kosong / izin ditolak"
          : label ?? "Tempel dari clipboard"}
      </span>
    </button>
  );
};
