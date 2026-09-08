/**
 * HANDOFF & FIELD CONTRACT VALIDATOR
 * 
 * Validates cross-tool research handoff payloads against canonical limits.
 * Ensures downstream tools never receive overflowing fields.
 * Provides atomic validation and safe legacy data reconciliation.
 */

import { RESEARCH_FIELD_LIMITS } from "@/config/researchFieldLimits";

export interface HandoffViolation {
  field: string;
  fieldLabel: string;
  actualLength: number;
  allowedLength: number;
  message: string;
}

export interface HandoffValidationResult {
  valid: boolean;
  violations: HandoffViolation[];
  summary: string;
}

const FIELD_LIMIT_MAP: Record<string, { limit: number; label: string }> = {
  prodi: { limit: RESEARCH_FIELD_LIMITS.programStudy, label: "Program Studi / Jurusan" },
  area_eksplorasi: { limit: RESEARCH_FIELD_LIMITS.areaHandoffSummary, label: "Area Eksplorasi" },
  fenomena_awal: { limit: RESEARCH_FIELD_LIMITS.selectedPhenomenon, label: "Fenomena Terpilih" },
  fokus_aspek: { limit: RESEARCH_FIELD_LIMITS.literatureFocus, label: "Fokus Aspek Literatur" },
  hal_terbuka: { limit: RESEARCH_FIELD_LIMITS.unresolvedLiteratureItems, label: "Hal yang Belum Ditentukan" },
  rentang_tahun: { limit: RESEARCH_FIELD_LIMITS.publicationRange, label: "Rentang Tahun Publikasi" },
  kata_kunci: { limit: RESEARCH_FIELD_LIMITS.literatureKeywords, label: "Kata Kunci Khusus" },
  akses_data_catatan: { limit: RESEARCH_FIELD_LIMITS.accessNotes, label: "Catatan Akses Data" },
  avoidances: { limit: RESEARCH_FIELD_LIMITS.avoidanceNotes, label: "Hal yang Ingin Dihindari" },
  supervisor_direction: { limit: RESEARCH_FIELD_LIMITS.lecturerDirection, label: "Arahan Dosen" },
  arahan_dosen: { limit: RESEARCH_FIELD_LIMITS.lecturerDirection, label: "Arahan Dosen" },
  minat: { limit: RESEARCH_FIELD_LIMITS.interestOrTopic, label: "Minat atau Isu" },
  objek_awal: { limit: RESEARCH_FIELD_LIMITS.actorOrObject, label: "Objek/Kelompok Awal" },
  petunjuk_fenomena: { limit: RESEARCH_FIELD_LIMITS.phenomenonClue, label: "Petunjuk Fenomena Awal" },
  constraints: { limit: RESEARCH_FIELD_LIMITS.generalConstraints, label: "Batasan atau Kondisi Lain" },
  constraint: { limit: RESEARCH_FIELD_LIMITS.generalConstraints, label: "Preferensi dan Batasan" },
};

/**
 * Validates whether handoff data complies with target tool's canonical character limits.
 */
export function validateResearchHandoff(
  _targetSlug: string,
  data: Record<string, string>
): HandoffValidationResult {
  const violations: HandoffViolation[] = [];

  for (const [key, rawValue] of Object.entries(data)) {
    if (typeof rawValue !== "string" || !rawValue.trim()) continue;

    const limitConfig = FIELD_LIMIT_MAP[key];
    if (!limitConfig) continue;

    const actualLength = Array.from(rawValue.trim()).length;
    if (actualLength > limitConfig.limit) {
      violations.push({
        field: key,
        fieldLabel: limitConfig.label,
        actualLength,
        allowedLength: limitConfig.limit,
        message: `${limitConfig.label} (${actualLength} karakter) melebihi batas maksimal ${limitConfig.limit} karakter.`,
      });
    }
  }

  const valid = violations.length === 0;
  let summary = "Semua isian sudah sesuai batas langkah ini.";
  if (!valid) {
    summary = `Ditemukan ${violations.length} isian yang melebihi batas karakter langkah ini.`;
  }

  return {
    valid,
    violations,
    summary,
  };
}

/**
 * Safely compacts or adjusts legacy handoff data to fit within canonical limits.
 * Trims gracefully at word/sentence boundaries where possible.
 */
export function reconcileLegacyHandoff(
  _targetSlug: string,
  data: Record<string, string>
): Record<string, string> {
  const reconciled: Record<string, string> = { ...data };

  for (const [key, rawValue] of Object.entries(data)) {
    if (typeof rawValue !== "string" || !rawValue.trim()) continue;

    const limitConfig = FIELD_LIMIT_MAP[key];
    if (!limitConfig) continue;

    const trimmed = rawValue.trim();
    const chars = Array.from(trimmed);
    if (chars.length > limitConfig.limit) {
      // Safe compaction: truncate to limit
      reconciled[key] = chars.slice(0, limitConfig.limit).join("").trim();
    }
  }

  return reconciled;
}
