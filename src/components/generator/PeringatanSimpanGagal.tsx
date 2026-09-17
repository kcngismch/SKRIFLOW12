"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Peringatan saat penyimpanan browser gagal (kuota penuh).
 *
 * Tanpa ini, kegagalannya SENYAP: isian tetap terlihat di layar karena state
 * React masih hidup, tetapi begitu halaman di-refresh, semuanya lenyap tanpa
 * pesan apa pun. Dipasang sekali di kerangka tool supaya berlaku untuk semua.
 *
 * ponytail: satu event global, tanpa state per-tool. Kalau nanti butuh tahu
 * TOOL mana yang gagal, kirim slug di detail event-nya.
 */
export const PeringatanSimpanGagal: React.FC = () => {
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onGagal = () => setGagal(true);
    window.addEventListener("skriflow_storage_gagal", onGagal);
    return () => window.removeEventListener("skriflow_storage_gagal", onGagal);
  }, []);

  if (!gagal) return null;

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border border-[#FF5C8A]/50 bg-[#FF5C8A]/10 p-4"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5C8A]" aria-hidden="true" />
      <div className="text-xs leading-relaxed text-[#FBFAFF]">
        <p className="text-sm font-bold text-[#FF5C8A]">
          Penyimpanan browser penuh — perubahan terakhir belum tersimpan.
        </p>
        <p className="mt-1">
          Tulisanmu masih tampil di layar, tapi akan hilang kalau halaman ini di-refresh atau ditutup.
          Segera <span className="font-semibold">unduh/salin hasilmu</span> lewat panel ekspor, lalu
          kosongkan ruang penyimpanan browser sebelum melanjutkan.
        </p>
        <button
          type="button"
          onClick={() => setGagal(false)}
          className="mt-2 rounded-lg border border-[#FF5C8A]/50 px-3 py-1.5 text-[12px] font-semibold text-[#FF5C8A] transition hover:bg-[#FF5C8A]/15"
        >
          Saya sudah mengerti
        </button>
      </div>
    </div>
  );
};
