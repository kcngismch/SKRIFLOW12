"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { AreaRecommendationResult } from "@/types/tool";

interface RecommendationPanelProps {
  recommendation: AreaRecommendationResult;
  onSelectArea: (areaId: string) => void;
  onDismiss: () => void;
  onRequestAlternative?: () => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendation,
  onSelectArea,
  onDismiss,
  onRequestAlternative,
  panelRef,
  headingRef,
}) => {
  const {
    status,
    primaryAreaId,
    primaryAreaName,
    reasons,
    assumptions,
    risks,
    mainCheckNext,
    secondaryAreaId,
    secondaryAreaName,
    tieAreaIds,
    tieAreaNames,
    tieDistinctions,
    conflictingConstraints,
    clarificationNeeded,
  } = recommendation;

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Panel Rekomendasi Area Eksplorasi"
      className="scroll-mt-24 rounded-xl border border-[#6D5AE6]/60 bg-[#0C1427] p-5 sm:p-6 space-y-4 shadow-xl shadow-[#6D5AE6]/10 animate-fade-in relative overflow-hidden"
    >
      {/* Background ambient badge */}
      <div className="flex items-start justify-between border-b border-[#2E2748] pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#6D5AE6]/20 p-1.5 text-[#6D5AE6] border border-[#6D5AE6]/30">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3
              ref={headingRef}
              id="recommendation-heading"
              tabIndex={-1}
              className="text-xs font-bold uppercase tracking-wider text-[#FFB84D] focus:outline-none focus:ring-1 focus:ring-[#FFB84D] rounded px-1 -ml-1"
            >
              Rekomendasi Sementara untuk Diperiksa
            </h3>
            <p className="text-[11px] text-[#A79FC4]">
              Dihitung berdasarkan kesesuaian data, beban pengerjaan, dan batasan metodologismu.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup rekomendasi"
          className="rounded-lg p-2 text-[#A79FC4] hover:bg-[#221A42] hover:text-[#FBFAFF] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* CASE 1: NO SAFE RECOMMENDATION (ALL RISKY) */}
      {status === "NO_SAFE_RECOMMENDATION" && (
        <div className="space-y-3.5 text-xs text-[#FBFAFF]">
          <div className="flex items-start gap-2.5 rounded-lg border border-[#FF5C8A]/40 bg-[#FF5C8A]/10 p-3 text-[#FF5C8A]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="font-bold block">Belum ada area yang cukup selaras untuk direkomendasikan.</strong>
              <p className="mt-0.5 text-[11px] text-[#FBFAFF]/90 leading-relaxed">
                Seluruh opsi yang dihasilkan saat ini memiliki benturan signifikan dengan batasan yang kamu masukkan.
              </p>
            </div>
          </div>

          {conflictingConstraints && conflictingConstraints.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-[#A79FC4] uppercase tracking-wider text-[10px]">
                Batasan yang Berbenturan:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#FBFAFF]">
                {conflictingConstraints.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {clarificationNeeded && clarificationNeeded.length > 0 && (
            <div className="rounded-lg bg-[#0C0A1A] border border-[#2E2748] p-3 space-y-1.5 text-[11px]">
              <span className="font-semibold text-[#FF9E5E]">Hal yang Perlu Diperjelas:</span>
              <ul className="list-disc list-inside space-y-1 text-[#A79FC4]">
                {clarificationNeeded.map((cl, idx) => (
                  <li key={idx}>{cl}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onRequestAlternative && (
              <button
                type="button"
                onClick={onRequestAlternative}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#5A46D6] transition-colors min-h-[44px]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Buat Alternatif Area Baru</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-lg border border-[#2E2748] bg-[#191430] px-3.5 py-2.5 text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF] transition-colors min-h-[44px]"
            >
              Tetap Tinjau Opsi Manual
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: TIE RECOMMENDATION (TWO EQUALLY VIABLE AREAS) */}
      {status === "RECOMMENDED_TIE" && tieAreaIds && (
        <div className="space-y-4 text-xs">
          <div className="rounded-lg border border-[#6D5AE6]/40 bg-[#6D5AE6]/10 p-3 text-xs text-[#FBFAFF] space-y-1">
            <strong className="text-[#FFB84D] font-bold block">
              Ada dua area yang sama-sama layak diperiksa lebih dahulu.
            </strong>
            <p className="text-[11px] text-[#A79FC4] leading-relaxed">
              Kedua area memiliki skor kelayakan seimbang. Kamu dapat menimbang pembeda berikut:
            </p>
          </div>

          {tieDistinctions && tieDistinctions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#0C0A1A] p-3.5 border border-[#2E2748] space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-[#FFB84D] block">{tieAreaIds[0]} — {tieAreaNames?.[0]}</span>
                  <p className="text-[11px] text-[#A79FC4] mt-1">{tieDistinctions[0]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectArea(tieAreaIds[0])}
                  className="mt-2 w-full rounded-md bg-[#6D5AE6]/20 border border-[#6D5AE6]/50 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6] hover:text-white transition-colors min-h-[44px]"
                >
                  Pilih {tieAreaIds[0]}
                </button>
              </div>

              <div className="rounded-lg bg-[#0C0A1A] p-3.5 border border-[#2E2748] space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-[#6D5AE6] block">{tieAreaIds[1]} — {tieAreaNames?.[1]}</span>
                  <p className="text-[11px] text-[#A79FC4] mt-1">{tieDistinctions[1]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectArea(tieAreaIds[1])}
                  className="mt-2 w-full rounded-md bg-[#6D5AE6]/20 border border-[#6D5AE6]/50 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6] hover:text-white transition-colors min-h-[44px]"
                >
                  Pilih {tieAreaIds[1]}
                </button>
              </div>
            </div>
          )}

          {/* Academic Principle Disclaimer */}
          <div className="rounded-lg border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 p-3 text-[11px] text-[#FBFAFF] flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Prinsip:</strong> Rekomendasi ini hanya menentukan area yang akan diperiksa melalui fenomena dan literatur. Ini belum menjadi judul, variabel, teori, metode, objek, sampel, atau keputusan penelitian final.
            </p>
          </div>
        </div>
      )}

      {/* CASE 3: SINGLE RECOMMENDED AREA */}
      {status === "RECOMMENDED_SINGLE" && primaryAreaId && (
        <div className="space-y-4 text-xs">
          {/* Primary Recommended Area Banner */}
          <div className="rounded-lg border border-[#FFB84D]/40 bg-[#FFB84D]/10 p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#FFB84D] tracking-wider block">
              Area yang paling layak diperiksa lebih dahulu:
            </span>
            <h4 className="text-sm font-bold text-[#FBFAFF]">
              <span className="text-[#FFB84D] mr-1.5 font-mono">[{primaryAreaId}]</span> {primaryAreaName}
            </h4>
          </div>

          {/* Why this area */}
          {reasons.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-[#A79FC4] uppercase tracking-wider text-[10px]">
                Kenapa area ini:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#FBFAFF]">
                {reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Assumptions & Risks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            {assumptions.length > 0 && (
              <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748] space-y-0.5">
                <span className="font-semibold text-[#FFB84D]">Asumsi yang masih digunakan:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[#A79FC4]">
                  {assumptions.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {risks.length > 0 && (
              <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748] space-y-0.5">
                <span className="font-semibold text-[#FF5C8A]">Risiko:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[#A79FC4]">
                  {risks.map((rk, idx) => (
                    <li key={idx}>{rk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main Check Next */}
          {mainCheckNext && (
            <div className="rounded-lg bg-[#0C0A1A] p-2.5 border border-[#2E2748] text-[11px]">
              <span className="font-semibold text-[#FF9E5E]">Hal yang wajib diperiksa selanjutnya:</span>
              <p className="text-[#FBFAFF] mt-0.5">{mainCheckNext}</p>
            </div>
          )}

          {/* Secondary Alternative */}
          {secondaryAreaId && secondaryAreaName && (
            <div className="text-[11px] text-[#A79FC4] border-t border-[#2E2748] pt-2">
              <span className="font-semibold text-[#FBFAFF]">Alternatif cadangan: </span>
              <span className="text-[#FFB84D] font-mono">[{secondaryAreaId}]</span> {secondaryAreaName}
            </div>
          )}

          {/* Academic Principle Warning */}
          <div className="rounded-lg border border-[#FF9E5E]/30 bg-[#FF9E5E]/10 p-3 text-[11px] text-[#FBFAFF] flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-[#FF9E5E] shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Prinsip:</strong> Rekomendasi ini hanya menentukan area yang akan diperiksa melalui fenomena dan literatur. Ini belum menjadi judul, variabel, teori, metode, objek, sampel, atau keputusan penelitian final.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              id="btn-apply-recommendation"
              onClick={() => onSelectArea(primaryAreaId)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFB84D] px-4 py-2.5 text-xs font-bold text-[#0C0A1A] shadow-md shadow-[#FFB84D]/20 hover:bg-[#5cd4a7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB84D] min-h-[44px]"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Pilih Rekomendasi Ini ({primaryAreaId})</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-lg border border-[#2E2748] bg-[#191430] px-3.5 py-2.5 text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF] transition-colors min-h-[44px]"
            >
              Tetap Pilih Sendiri
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
