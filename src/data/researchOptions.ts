export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 1. Pendekatan Penelitian (Research Approaches)
 */
export const PENDEKATAN_OPTIONS: SelectOption[] = [
  { value: "unknown", label: "Belum tahu" },
  { value: "quantitative", label: "Kuantitatif" },
  { value: "qualitative", label: "Kualitatif" },
  { value: "mixed", label: "Campuran" },
];

/**
 * 2. Preferensi Jenis Data (Data Preferences)
 */
export const PREFERENSI_DATA_OPTIONS: SelectOption[] = [
  { value: "unknown", label: "Belum tahu" },
  { value: "secondary_public", label: "Data sekunder atau data publik" },
  { value: "survey", label: "Survei atau kuesioner" },
  { value: "interview", label: "Wawancara" },
  { value: "observation_field", label: "Observasi atau turun lapangan" },
  { value: "combined", label: "Kombinasi beberapa sumber" },
];

/**
 * 3. Akses Data yang Sudah Dimiliki (Data Access Readiness)
 */
export const AKSES_DATA_OPTIONS: SelectOption[] = [
  { value: "unknown", label: "Belum punya akses yang jelas" },
  { value: "public", label: "Punya akses data publik" },
  { value: "respondents", label: "Punya calon responden" },
  { value: "organization", label: "Punya akses organisasi atau perusahaan" },
  { value: "own_dataset", label: "Punya dataset sendiri" },
  { value: "other", label: "Lainnya" },
];

/**
 * 4. Kondisi Waktu Pengerjaan (Timeline & Time Constraints)
 */
export const KONDISI_WAKTU_OPTIONS: SelectOption[] = [
  { value: "unknown", label: "Belum tahu" },
  { value: "fast", label: "Ingin relatif cepat" },
  { value: "flexible", label: "Punya waktu cukup fleksibel" },
  { value: "deadline", label: "Sedang mengejar tenggat dosen atau kampus" },
  { value: "working", label: "Mengerjakan sambil bekerja atau magang" },
];

/**
 * 5. Cakupan Fenomena (Phenomenon Scope Priority)
 */
export const CAKUPAN_FENOMENA_OPTIONS: SelectOption[] = [
  { value: "unknown", label: "Belum tahu" },
  { value: "indonesia", label: "Indonesia" },
  { value: "specific_region", label: "Daerah atau institusi tertentu" },
  { value: "international", label: "Internasional" },
  { value: "mixed", label: "Indonesia dan internasional" },
];

/**
 * 6. Rentang Waktu Fenomena (Phenomenon Timeframe)
 */
export const RENTANG_FENOMENA_OPTIONS: SelectOption[] = [
  { value: "three_years", label: "Utamakan 3 tahun terakhir" },
  { value: "five_years", label: "Utamakan 5 tahun terakhir" },
  { value: "ten_years", label: "Utamakan 10 tahun terakhir" },
  { value: "unrestricted", label: "Tidak dibatasi" },
];

/**
 * 7. Prioritas Sumber Literatur (Literature Source Priority)
 */
export const PRIORITAS_SUMBER_OPTIONS: SelectOption[] = [
  { value: "campuran", label: "Campuran Indonesia & internasional" },
  { value: "indonesia", label: "Prioritaskan sumber Indonesia" },
  { value: "internasional", label: "Prioritaskan sumber internasional" },
];

/**
 * Mapping text for prompt assembly based on prioritas_sumber value.
 */
export const PRIORITAS_SUMBER_MAPPING: Record<string, string> = {
  campuran:
    "Gabungkan sumber Indonesia dan internasional yang paling relevan; jangan memaksakan kuota.",
  indonesia:
    "Prioritaskan konteks Indonesia; gunakan sumber internasional untuk teori, metode, atau kekurangan bukti lokal.",
  internasional:
    "Prioritaskan sumber internasional berkualitas; sertakan Indonesia jika relevan untuk konteks lokal.",
};

/**
 * Resolves prompt instruction text from a prioritas_sumber value with fallback to 'campuran'.
 */
export function resolvePrioritasSumberPrompt(value?: string): string {
  if (!value || typeof value !== "string") {
    return PRIORITAS_SUMBER_MAPPING.campuran;
  }
  const trimmed = value.trim();
  return PRIORITAS_SUMBER_MAPPING[trimmed] || trimmed;
}

/**
 * Maps a field ID to its respective select options array.
 */
export function getOptionsForField(fieldId: string): SelectOption[] | undefined {
  switch (fieldId) {
    case "pendekatan":
      return PENDEKATAN_OPTIONS;
    case "preferensi_data":
      return PREFERENSI_DATA_OPTIONS;
    case "akses_data":
      return AKSES_DATA_OPTIONS;
    case "target_waktu":
      return KONDISI_WAKTU_OPTIONS;
    case "cakupan_fenomena":
      return CAKUPAN_FENOMENA_OPTIONS;
    case "rentang_fenomena":
      return RENTANG_FENOMENA_OPTIONS;
    case "prioritas_sumber":
      return PRIORITAS_SUMBER_OPTIONS;
    default:
      return undefined;
  }
}

/**
 * Resolves a human-readable Indonesian label from a stable option value.
 */
export function resolveOptionLabel(fieldId: string, value: string): string {
  const options = getOptionsForField(fieldId);
  if (!options) return value;
  const match = options.find((opt) => opt.value === value);
  if (!match) return value;
  return match.label;
}
