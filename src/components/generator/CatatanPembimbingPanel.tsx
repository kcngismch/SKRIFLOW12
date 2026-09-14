"use client";

import React, { useState } from "react";
import { UserCheck, Check, AlertTriangle } from "lucide-react";
import { loadSharedResearchContext, saveSharedResearchContext } from "@/lib/storage";

/**
 * Catatan Pembimbing (tingkat A).
 *
 * Yang menentukan skripsi lulus adalah dosen, dan koreksi pembimbing adalah
 * siklus paling sering diulang. Sebelum ini, catatan koreksi hanya bisa diketik
 * sekali di Tool 1 dan tidak bisa diperbarui — begitu dosen minta hal berbeda di
 * pertemuan berikutnya, mahasiswa mentok.
 *
 * Panel ini menampung arahan dan MENERUSKANNYA ke mekanisme yang sudah ada:
 * `constraints.arahanDosen` sudah ikut dibaca prompt 4B di promptAssembler.
 * Jadi tidak ada jalur kedua — cuma pintu untuk memperbaruinya.
 *
 * ponytail: tingkat A = penampung + penerus, tanpa mengubah perilaku prompt.
 * Naik ke tingkat B (arahan benar-benar mengubah aturan prompt) hanya setelah
 * pola koreksi nyata terkumpul dari laporan mahasiswa.
 */
interface CatatanPembimbingPanelProps {
  /** Dipanggil tiap arahan berubah, supaya prompt yang sedang tampil ikut segar. */
  onBerubah?: (teks: string) => void;
  ringkas?: boolean;
}

export const CatatanPembimbingPanel: React.FC<CatatanPembimbingPanelProps> = ({
  onBerubah,
  ringkas = false,
}) => {
  const [tersimpan, setTersimpan] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return loadSharedResearchContext()?.constraints?.arahanDosen || "";
  });
  const [draf, setDraf] = useState(tersimpan);
  const [baruSaja, setBaruSaja] = useState(false);

  const berubah = draf.trim() !== tersimpan.trim();

  const simpan = () => {
    if (typeof window === "undefined") return;
    const lama = loadSharedResearchContext();
    const teks = draf.trim();

    if (!lama) {
      // Belum ada konteks bersama sama sekali. Jangan bikin konteks setengah isi
      // yang bisa merusak pembacaan tool lain — minta mahasiswa mengisi Tool 1 dulu.
      return;
    }

    saveSharedResearchContext({
      ...lama,
      constraints: { ...(lama.constraints || {}), arahanDosen: teks },
      // Ditulis ke dua kunci: pembaca lama memakai supervisor_direction,
      // pembaca baru memakai constraints.arahanDosen. Satu nilai, dua pintu.
      supervisor_direction: teks,
      lastUpdated: new Date().toISOString(),
    });

    setTersimpan(teks);
    setBaruSaja(true);
    setTimeout(() => setBaruSaja(false), 2500);
    onBerubah?.(teks);
  };

  const adaKonteks = typeof window !== "undefined" && !!loadSharedResearchContext();

  return (
    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#6D5AE6]" aria-hidden="true" />
          <span className="text-sm font-bold text-[#FBFAFF]">Catatan Pembimbing</span>
        </div>
        {tersimpan && !ringkas && (
          <span className="rounded bg-[#70E1B6]/15 px-2 py-0.5 text-[12px] font-semibold text-[#70E1B6]">
            sudah ada catatan
          </span>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
        Tulis arahan atau koreksi dosen pembimbing di sini — misalnya permintaan mempersempit topik, teori yang harus
        dipakai, atau bagian yang harus diperbaiki. Catatan ini ikut terbawa ke prompt yang kamu jalankan berikutnya.
      </p>

      {!adaKonteks && (
        <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#FF9E5E]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Belum ada data dari Tool 1. Isi Tool 1 dulu supaya catatan ini bisa tersimpan dan terbawa — tanpa itu,
            catatannya tidak punya tempat menempel.
          </span>
        </p>
      )}

      <textarea
        rows={ringkas ? 3 : 4}
        value={draf}
        onChange={(e) => setDraf(e.target.value)}
        disabled={!adaKonteks}
        placeholder="Contoh: dosen minta fokus ke satu provinsi saja, dan minta teori kelembagaan dipakai di Bab 2."
        className="mt-3 w-full rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-2.5 text-xs leading-relaxed text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none disabled:opacity-50"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={simpan}
          disabled={!berubah || !adaKonteks}
          title={
            !adaKonteks
              ? "Isi Tool 1 dulu supaya catatan ini punya tempat menempel."
              : !berubah
                ? "Catatan belum berubah."
                : undefined
          }
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#6D5AE6] px-4 text-xs font-bold text-white transition hover:bg-[#5A46D6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {baruSaja ? <Check className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          <span>{baruSaja ? "Catatan Tersimpan" : "Simpan Catatan"}</span>
        </button>

        {berubah && adaKonteks && (
          <span className="text-[12px] text-[#FFB84D]">Ada perubahan belum disimpan.</span>
        )}
        {!berubah && tersimpan && !baruSaja && (
          <span className="text-[12px] text-[#A79FC4]">
            Tersimpan {tersimpan.length} karakter — ikut ke prompt berikutnya.
          </span>
        )}
      </div>
    </div>
  );
};
