"use client";

import React, { useMemo, useState } from "react";
import { ClipboardPaste, CheckCircle2, AlertTriangle, ArrowRight, FileText } from "lucide-react";
import { periksaTempelan, SumberRegister } from "@/lib/tempelBahan";

/**
 * Pintu masuk untuk mahasiswa yang SUDAH punya bahan (draf separuh jadi atau
 * outline dari dosen). Tanpa ini, jalur Tool 4 -> Tool 5 menuntut paket fondasi
 * lengkap dan mahasiswa semester akhir terkunci total.
 *
 * Aturan yang TIDAK dilonggarkan: sitasi yang tidak ada di register tetap
 * ditandai, dan kalimat tanpa sitasi tetap dihitung. Modul ini menandai, bukan
 * menyatakan "beres".
 */
interface TempelBahanPanelProps {
  register: SumberRegister[];
  onTerima: (teks: string) => void;
  sudahAdaBahan?: boolean;
  namaBahan?: string;
}

export const TempelBahanPanel: React.FC<TempelBahanPanelProps> = ({
  register,
  onTerima,
  sudahAdaBahan = false,
  namaBahan = "draf Bab 1",
}) => {
  const [terbuka, setTerbuka] = useState(false);
  const [teks, setTeks] = useState("");
  const [hasilDitampilkan, setHasilDitampilkan] = useState(false);

  const hasil = useMemo(
    () => (teks.trim().length > 40 ? periksaTempelan(teks, register) : null),
    [teks, register]
  );

  return (
    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
          <span className="text-sm font-bold text-[#FBFAFF]">
            Sudah punya {namaBahan} sendiri?
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTerbuka((v) => !v)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#2E2748] px-3 text-xs font-semibold text-[#A79FC4] transition hover:border-[#FFB84D]/50 hover:text-[#FBFAFF]"
        >
          {terbuka ? "Tutup" : "Tempel bahan saya"}
        </button>
      </div>

      {!terbuka && (
        <p className="text-xs leading-relaxed text-[#A79FC4]">
          {sudahAdaBahan
            ? "Bahanmu sudah masuk. Periksa hasilnya di panel ini."
            : "Kamu tidak perlu mengulang dari awal. Tempel yang sudah kamu tulis, sistem akan memeriksa sitasinya terhadap daftar sumber Tool 3 — tanpa menghapus apa pun."}
        </p>
      )}

      {terbuka && (
        <>
          <p className="text-xs leading-relaxed text-[#A79FC4]">
            Tempel {namaBahan} milikmu di bawah. Pisahkan antar paragraf dengan satu baris kosong supaya terbagi rapi.
            Tulisannya tidak akan diubah — hanya diperiksa.
          </p>
          <textarea
            rows={8}
            value={teks}
            onChange={(e) => {
              setTeks(e.target.value);
              setHasilDitampilkan(false);
            }}
            placeholder={"Tempel di sini...\n\nPisahkan antar paragraf dengan baris kosong."}
            className="w-full rounded-xl border border-[#2E2748] bg-[#191430] p-4 text-xs leading-relaxed text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none"
          />

          {hasil && (
            <div className="space-y-3 rounded-xl border border-[#2E2748] bg-[#191430] p-4">
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="text-[#A79FC4]">
                  <b className="text-[#FBFAFF]">{hasil.jumlahParagraf}</b> paragraf
                </span>
                <span className="text-[#A79FC4]">
                  <b className="text-[#FBFAFF]">{hasil.jumlahKalimat}</b> kalimat
                </span>
                <span className="text-[#A79FC4]">
                  <b className="text-[#FBFAFF]">{hasil.totalKata}</b> kata
                </span>
                <span className="text-[#FFB84D]">
                  <b>{hasil.ringkas.punyaSitasi}</b> sitasi cocok
                </span>
                {hasil.ringkas.sumberTidakDikenal > 0 && (
                  <span className="text-[#FF5C8A]">
                    <b>{hasil.ringkas.sumberTidakDikenal}</b> sitasi tidak dikenal
                  </span>
                )}
                {hasil.ringkas.tanpaSitasi > 0 && (
                  <span className="text-[#A79FC4]">
                    {hasil.ringkas.tanpaSitasi} kalimat tanpa sitasi
                  </span>
                )}
              </div>

              {hasil.pesanPenghadang.length > 0 && (
                <ul className="space-y-1.5 border-t border-[#2E2748] pt-3">
                  {hasil.pesanPenghadang.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-[#FFB84D]">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}

              {hasil.ringkas.sumberTidakDikenal === 0 && (
                <p className="flex items-center gap-2 border-t border-[#2E2748] pt-3 text-xs text-[#70E1B6]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    Semua sitasi cocok dengan daftar sumbermu. {hasil.ringkas.tanpaSitasi > 0
                      ? "Kalimat tanpa sitasi dibiarkan — itu bisa kalimat penghubung milikmu sendiri."
                      : ""}
                  </span>
                </p>
              )}

              <details className="border-t border-[#2E2748] pt-3">
                <summary className="cursor-pointer text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF]">
                  Lihat pemeriksaan tiap kalimat ({hasil.kalimat.length})
                </summary>
                <ul className="mt-2 space-y-2">
                  {hasil.kalimat.map((k, i) => (
                    <li key={i} className="rounded-lg bg-[#0C0A1A] p-2.5 text-xs leading-relaxed">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                            k.status === "PUNYA_SITASI"
                              ? "bg-[#70E1B6]/15 text-[#70E1B6]"
                              : k.status === "SUMBER_TIDAK_DIKENAL"
                                ? "bg-[#FF5C8A]/15 text-[#FF5C8A]"
                                : "bg-[#A79FC4]/15 text-[#A79FC4]"
                          }`}
                        >
                          {k.status === "PUNYA_SITASI"
                            ? "SITASI COCOK"
                            : k.status === "SUMBER_TIDAK_DIKENAL"
                              ? "SUMBER TIDAK DIKENAL"
                              : "TANPA SITASI"}
                        </span>
                        <span className="text-[11px] text-[#A79FC4]">paragraf {k.paragraf}</span>
                      </div>
                      <p className="text-[#A79FC4]">{k.teks}</p>
                      {k.status !== "PUNYA_SITASI" && (
                        <p className="mt-1 text-[12px] text-[#A79FC4]/80">{k.catatan}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>

              <button
                type="button"
                disabled={!hasil.layakLanjut}
                title={
                  hasil.layakLanjut
                    ? undefined
                    : "Perbaiki dulu sitasi yang bertanda 'sumber tidak dikenal', atau isi daftar sumber di Tool 3."
                }
                onClick={() => {
                  onTerima(teks);
                  setHasilDitampilkan(true);
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFB84D] px-5 text-sm font-bold text-[#0C0A1A] transition hover:bg-[#F0A63C] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <span>{hasilDitampilkan ? "Bahan Diterima" : `Pakai ${namaBahan} ini`}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              {!hasil.layakLanjut && (
                <p className="text-[12px] leading-relaxed text-[#A79FC4]">
                  Belum bisa dilanjutkan sampai sitasi yang tidak dikenal dibereskan. Ini bukan hukuman — sitasi yang tidak
                  ada di daftar sumber tidak akan bisa kamu pertanggungjawabkan saat diuji dosen.
                </p>
              )}
            </div>
          )}

          {!hasil && (
            <p className="text-[12px] text-[#A79FC4]">
              Minimal beberapa kalimat supaya bisa diperiksa. Hitungan muncul begitu kamu menulis cukup banyak.
            </p>
          )}
        </>
      )}
    </div>
  );
};
