"use client";

import React from "react";
import { Compass, Info, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import type { RekomendasiFenomena } from "@/lib/fenomenaRekomendasi";
import type { PhenomenonStatus } from "@/types/tool";

const LABEL_STATUS: Record<PhenomenonStatus, string> = {
  SIAP_DIBAWA: "Siap dibawa",
  PERLU_DIPERIKSA: "Perlu diperiksa",
  JANGAN_DIGUNAKAN: "Jangan digunakan",
};

interface Props {
  rekomendasi: RekomendasiFenomena;
  selectedId: string | null;
  onPilih: (id: string) => void;
}

/**
 * Panel rekomendasi Tool 2 — "periksa yang mana dulu".
 * Terbungkus sendiri (tertutup) supaya tidak menambah kepadatan halaman; mahasiswa yang
 * sudah tahu mau pilih apa bisa langsung mengabaikannya.
 */
export const FenomenaRekomendasiPanel: React.FC<Props> = ({ rekomendasi, selectedId, onPilih }) => {
  const [terbuka, setTerbuka] = React.useState(false);
  const [tampilkanSemua, setTampilkanSemua] = React.useState(false);

  const { peringkat, utamaId, utamaNama, pengantar, langkahBerikut, semuaTidakLayak } = rekomendasi;
  if (peringkat.length === 0) return null;

  const daftar = tampilkanSemua ? peringkat : peringkat.slice(0, 3);

  return (
    <div className="rounded-xl border border-[#6D5AE6]/40 bg-[#191430]">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[#221A42]/40 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Compass className="h-4.5 w-4.5 text-[#FFB84D]" aria-hidden="true" />
          <span className="text-sm font-bold text-[#FBFAFF]">
            {semuaTidakLayak
              ? "Belum ada kandidat yang layak diperiksa lebih dulu"
              : `Mulai dari kandidat mana? ${utamaId} — ${utamaNama}`}
          </span>
        </span>
        {terbuka ? (
          <ChevronUp className="h-4.5 w-4.5 shrink-0 text-[#A79FC4]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 shrink-0 text-[#A79FC4]" aria-hidden="true" />
        )}
      </button>

      {terbuka && (
        <div className="space-y-4 border-t border-[#2E2748] px-5 py-4">
          <p className="flex gap-2 text-[13px] leading-relaxed text-[#A79FC4]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8E86AB]" aria-hidden="true" />
            <span>{pengantar}</span>
          </p>

          <ol className="space-y-3">
            {daftar.map((p, i) => (
              <li
                key={p.id}
                className={`rounded-lg border p-3.5 ${
                  p.id === utamaId ? "border-[#FFB84D]/50 bg-[#FFB84D]/5" : "border-[#2E2748] bg-[#0C0A1A]/60"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#2E2748] px-1.5 py-0.5 text-[13px] font-bold text-[#A79FC4]">
                        {i === 0 ? "Disarankan" : `Urutan ${i + 1}`}
                      </span>
                      <span className="text-sm font-bold text-[#FBFAFF]">
                        {p.id} — {p.nama}
                      </span>
                      <span className="rounded border border-[#2E2748] px-1.5 py-0.5 text-[13px] text-[#A79FC4]">
                        {LABEL_STATUS[p.status]}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {p.alasan.map((a, k) => (
                        <li key={k} className="text-[13px] leading-relaxed text-[#A79FC4]">
                          • {a}
                        </li>
                      ))}
                    </ul>
                    {p.catatan.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {p.catatan.slice(0, 3).map((c, k) => (
                          <li key={k} className="text-[13px] leading-relaxed text-[#FFB84D]/90">
                            ! {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onPilih(p.id)}
                    disabled={p.status === "JANGAN_DIGUNAKAN" || selectedId === p.id}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      selectedId === p.id
                        ? "bg-[#FFB84D] text-[#0C0A1A]"
                        : p.status === "JANGAN_DIGUNAKAN"
                        ? "cursor-not-allowed bg-[#2E2748]/30 text-[#A79FC4]/40"
                        : "border border-[#6D5AE6] bg-[#6D5AE6]/15 text-[#FBFAFF] hover:bg-[#6D5AE6]/30"
                    }`}
                  >
                    {selectedId === p.id ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Terpilih
                      </span>
                    ) : (
                      "Pilih ini"
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {peringkat.length > 3 && !tampilkanSemua && (
            <button
              type="button"
              onClick={() => setTampilkanSemua(true)}
              className="text-[13px] font-semibold text-[#8B7CF0] hover:text-[#FFB84D] transition-colors"
            >
              Tampilkan {peringkat.length - 3} kandidat lainnya
            </button>
          )}

          <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A]/60 p-3.5">
            <p className="text-[13px] font-bold text-[#FFB84D]">Setelah memilih, lakukan ini:</p>
            <ul className="mt-1.5 space-y-1">
              {langkahBerikut.map((l, k) => (
                <li key={k} className="text-[13px] leading-relaxed text-[#A79FC4]">
                  {k + 1}. {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
