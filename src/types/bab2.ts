/**
 * Tipe Tool 6 (Bangun Bab 2) — Addendum D v3.3.4.
 *
 * Dipisah dari `tool.ts` supaya berkas tipe Tool 1–5 yang sudah besar tidak
 * disentuh. Isi di sini HANYA Bab 2.
 */

/** Kolom yang tidak ada di register ditulis apa adanya, bukan ditebak. */
export type StatusPencatatan = "TERCATAT" | "TIDAK_TERCATAT";

// =========================================================================
// TAHAP 11: PETA LITERATUR (detereministik — dibuat tool, bukan AI)
// =========================================================================

export interface Bab2BarisPenelitianTerdahulu {
  source_id: string;
  /** Kolom "Penulis & Tahun" apa adanya, mis. "Péter Klemensits (2025)". */
  authors_year: string;
  author: string;
  year: string;
  title: string;
  venue: string;
  /** Jenis publikasi dari register (mis. "Jurnal"). */
  source_kind: string;
  /**
   * Kolom yang paling sering diminta dosen dan paling sering dikarang AI.
   * Register Tool 3 tidak memuatnya, jadi SELALU kosong di sini dan ditampilkan
   * sebagai TIDAK TERCATAT — mahasiswa yang melengkapinya dengan membaca sumber.
   */
  method: string;
  results: string;
  /** Nama kolom yang register tidak memuatnya untuk baris ini. */
  not_recorded_fields: string[];
}

/**
 * Sel tabel penelitian terdahulu yang diisi MANUAL oleh mahasiswa (D.6).
 *
 * Tool ini tidak pernah mengisinya; kalau ada isinya, itu pekerjaan mahasiswa
 * dan wajib menyebut dari mana dibacanya. Isian tanpa jejak sumber ditandai
 * NOT_RECORDED_OVERWRITTEN.
 */
export interface Bab2SelManual {
  source_id: string;
  field: "method" | "results" | string;
  value: string;
  /** Dari mana nilai ini dibaca (halaman/bagian sumber). Wajib diisi. */
  read_from: string;
}

export interface Bab2CakupanSumber {
  source_id: string;
  author: string;
  year: string;
  title: string;
  /** Sumber ini dirujuk di Paket Fondasi Bab 1 (ledger/paragraph_claims). */
  dipakai_di_bab1: boolean;
}

export interface Bab2TemaKlaster {
  tema: string;
  source_ids: string[];
  dasar_pengelompokan: string;
  /** Jumlah sumber yang menopang tema; 0–1 berarti cakupan tipis. */
  jumlah_sumber: number;
}

export interface Bab2KonflikPasangan {
  source_ids: [string, string];
  catatan_comparability: string;
  jenis: "TRUE_CONFLICT" | "CONTEXTUAL_HETEROGENEITY" | "BELUM_DITENTUKAN";
}

export interface Bab2MapV1 {
  schema_version: 1;
  map_status: "MAP_COMPLETE" | "MAP_PARTIAL" | "MAP_BLOCKED";
  status_reason: string;
  source_count: number;
  prior_research_table: Bab2BarisPenelitianTerdahulu[];
  source_coverage: Bab2CakupanSumber[];
  /**
   * Dua field ini SENGAJA kosong saat peta dibuat: register tidak memuat tema
   * maupun arah temuan. Mengisinya di sini = menebak. Diisi di Tahap 12 (6A).
   */
  theme_clusters: Bab2TemaKlaster[];
  conflict_pairs: Bab2KonflikPasangan[];
  coverage_gaps: string[];
  map_notes: string[];
  not_recorded: string[];
}

// =========================================================================
// TAHAP 12: FONDASI BAB 2 (Prompt 6A — peta, bukan prosa)
// =========================================================================

export type Bab2FoundationStatus = "BAB2_READY" | "BAB2_NEEDS_VERIFICATION" | "BAB2_BLOCKED";

/** Pendekatan menentukan ada/tidaknya Hipotesis (Addendum D.8). */
export type Bab2Pendekatan = "VERIFIKATIF" | "DESKRIPTIF" | "KAJIAN_LITERATUR" | "BELUM_DITENTUKAN";

export type Bab2ClaimType =
  | "THEORY_CLAIM"
  | "PRIOR_FINDING_CLAIM"
  | "COMPARISON_CLAIM"
  | "CONTEXT_CLAIM"
  | "DERIVED_CLAIM";

export interface Bab2BlueprintItem {
  order: number;
  sub_bab: string;
  function: string;
  target_word_range?: [number, number];
  source_ids?: string[];
  claim_ids?: string[];
}

export interface Bab2TeoriItem {
  konstruk: string;
  definisi_ringkas: string;
  source_ids: string[];
  status_klaim: "READY_TO_DRAFT" | "NEEDS_VERIFICATION" | "DO_NOT_USE";
}

export interface Bab2ClaimLedgerItem {
  claim_id: string;
  claim_text: string;
  claim_type: Bab2ClaimType;
  source_ids: string[];
  status: "READY_TO_DRAFT" | "NEEDS_VERIFICATION" | "DO_NOT_USE";
}

export interface Bab2SumberBaru {
  id_sementara: string;
  authors_year: string;
  title: string;
  alasan_muncul: string;
}

export interface Bab2FoundationV1 {
  schema_version: 1;
  foundation_status: Bab2FoundationStatus;
  status_reason: string;
  pendekatan: Bab2Pendekatan;
  pendekatan_sumber: string;
  structure_blueprint: Bab2BlueprintItem[];
  theory_map: Bab2TeoriItem[];
  claim_ledger: Bab2ClaimLedgerItem[];
  prohibited_claims: string[];
  not_safe_to_say: string[];
  unresolved_notes: string[];
  /** Sumber di luar register: WAJIB kembali ke rantai 02→06 (D.11). */
  candidate_new_sources: Bab2SumberBaru[];
  /** Selalu CANDIDATE_ONLY + researcher_decision pending. */
  conceptual_framework?: {
    konstruk: string[];
    hubungan: string;
    status: "CANDIDATE_ONLY";
    researcher_decision: "pending";
  };
  /** Kosong bila pendekatan non-verifikatif. */
  hypothesis_candidates?: {
    pernyataan: string;
    arah: string;
    status: "CANDIDATE_ONLY";
    researcher_decision: "pending";
  }[];
  target_words_total: number;
  normalization_warnings?: string[];
}

// =========================================================================
// TAHAP 13: DRAF BAB 2 (Prompt 6B — prosa)
// =========================================================================

export interface Bab2DrafParagraf {
  order: number;
  sub_bab: string;
  function: string;
  paragraph_text: string;
  claim_ids: string[];
  withheld_claims?: string[];
}

export interface Bab2DraftV1 {
  schema_version: 1;
  draft_status: "DRAFT_COMPLETE" | "DRAFT_PARTIAL" | "DRAFT_BLOCKED";
  foundation_status_ref: string;
  word_count_total: number;
  target_words_total: number;
  background: Bab2DrafParagraf[];
  skipped_sections: string[];
  used_claim_ids: string[];
  used_source_ids: string[];
  avoided_claims: string[];
  /**
   * HARUS kosong. Sumber yang muncul di sini adalah sumber teleport (D.11) —
   * bukan catatan, tapi pelanggaran batas bukti.
   */
  new_sources_introduced: Bab2SumberBaru[];
  /**
   * Sel tabel yang dilengkapi manual (D.6). Boleh kosong — memang begitu
   * seharusnya di sebagian besar kasus. Isian tanpa `read_from` ditandai.
   */
  prior_research_filled?: Bab2SelManual[];
  consistency_notes: string[];
  unresolved_notes: string[];
}

// =========================================================================
// TAHAP 14: POLES BAHASA (Prompt 6C) — skema mengikuti Addendum C
// =========================================================================

export interface Bab2PolishV1 {
  schema_version: 1;
  polish_status: "POLISH_COMPLETE" | "POLISH_PARTIAL" | "POLISH_BLOCKED";
  word_count_total: number;
  background: Bab2DrafParagraf[];
  claim_ids_unchanged: boolean;
  language_notes: string[];
  changed_sections: string[];
  unresolved_notes: string[];
}

// =========================================================================
// TEMUAN PEMERIKSA (Addendum D.5)
// =========================================================================

export type Bab2FindingCode =
  // CRITICAL — pelanggaran batas bukti
  | "SOURCE_NOT_IN_REGISTER"
  | "NEW_SOURCE_INTRODUCED"
  | "FABRICATED_ATTRIBUTION"
  | "SYNTHETIC_GAP_PHRASE"
  | "VERBATIM_COPY"
  | "HYPOTHESIS_ON_NON_VERIFICATIVE"
  | "CLAIM_ID_UNKNOWN"
  | "CLAIM_STATUS_DO_NOT_USE"
  | "BLOCKED_SECTION_WRITTEN"
  | "PROHIBITED_CLAIM_PHRASE"
  // MAJOR — perlu revisi
  | "CONFLICT_FLATTENED"
  | "THEORY_WITHOUT_SOURCE"
  | "FRAMEWORK_STATED_AS_FINAL"
  | "CONCLUSION_IN_BAB2"
  | "ABSOLUTE_CLAIM_PHRASE"
  | "CAUSAL_CLAIM_FROM_CORRELATION"
  | "SUBBAB_STRUCTURE_MISMATCH"
  | "WORD_COUNT_OUT_OF_RANGE"
  | "CLAIM_STATUS_NEEDS_VERIFICATION"
  /**
   * Pelanggaran batas bukti 6C: peta klaim berubah setelah poles bahasa.
   * Memakai kode yang sama dengan Bab 1 (types/tool.ts), bukan CLAIM_ID_UNKNOWN.
   */
  | "POLISH_CLAIM_IDS_CHANGED"
  // MINOR — catatan kualitas
  | "WORD_COUNT_MISMATCH"
  | "LEDGER_CLAIM_UNUSED"
  /** Roll-up used_claim_ids tidak cocok dengan peta klaim per paragraf (D.4.3). */
  | "CLAIM_ROLLUP_MISMATCH"
  | "NOT_RECORDED_OVERWRITTEN"
  | "CITATION_STYLE_INCONSISTENT";

export type Bab2FindingSeverity = "CRITICAL" | "MAJOR" | "MINOR";

export interface Bab2Finding {
  code: Bab2FindingCode;
  severity: Bab2FindingSeverity;
  /** Lokasi manusiawi: nama sub-bab atau "Fondasi". */
  where: string;
  message: string;
  /** Kutipan pendek dari draf/fondasi yang memicu temuan. */
  evidence_excerpt?: string;
}
