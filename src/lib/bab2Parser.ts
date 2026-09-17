/**
 * Parser transfer Bab 2 — Addendum D §D.4.
 *
 * Tiga blok penanda, satu gaya dengan Bab 1 supaya mahasiswa tidak belajar
 * format baru: JSON di antara BEGIN/END, schema_version 1.
 *
 * `hitungKata` diimpor dari bedahParser — aturan hitung kata WAJIB sama di
 * seluruh aplikasi, kalau tidak target 1000–1300 dan 1800–3000 dihitung dua cara.
 */

import { hitungKata, type SumberPaketLiteratur } from "./bedahParser";
import type {
  Bab2ClaimLedgerItem,
  Bab2ClaimType,
  Bab2DraftV1,
  Bab2FoundationV1,
  Bab2Pendekatan,
  Bab2PolishV1,
  Bab2SumberBaru,
} from "@/types/bab2";

export const BAB2_FOUNDATION_BEGIN = "=== BEGIN SKRIFLOW_BAB2_FOUNDATION_V1 ===";
export const BAB2_FOUNDATION_END = "=== END SKRIFLOW_BAB2_FOUNDATION_V1 ===";
export const BAB2_DRAFT_BEGIN = "=== BEGIN SKRIFLOW_BAB2_DRAFT_V1 ===";
export const BAB2_DRAFT_END = "=== END SKRIFLOW_BAB2_DRAFT_V1 ===";
export const BAB2_POLISH_BEGIN = "=== BEGIN SKRIFLOW_BAB2_POLISH_V1 ===";
export const BAB2_POLISH_END = "=== END SKRIFLOW_BAB2_POLISH_V1 ===";

/** Target panjang Bab 2 (Addendum D.10). Angka kerja, bukan hukum akademik. */
export const BAB2_TARGET_WORDS = 2400;
export const BAB2_WORD_RANGE: [number, number] = [1800, 3000];

export interface Bab2ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: string[];
  /** Backfill/koreksi yang dilakukan tool — ditampilkan apa adanya ke mahasiswa. */
  warnings?: string[];
}

// =========================================================================
// Utilitas
// =========================================================================

function ambilBlokJson(rawText: string, begin: string, end: string): { json?: string; error?: string; errorDetails?: string[] } {
  const start = rawText.indexOf(begin);
  const stop = rawText.lastIndexOf(end);
  if (start === -1 || stop === -1 || stop <= start) {
    return {
      error: "Blok data tidak ditemukan.",
      errorDetails: ["Pastikan output memuat penanda persis:", begin, "...", end],
    };
  }
  return { json: rawText.substring(start + begin.length, stop).trim() };
}

function parseJson(json: string, sebutan: string): { obj?: Record<string, unknown>; error?: string; errorDetails?: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Format JSON ${sebutan} tidak valid.`, errorDetails: [`Gagal membaca JSON di antara marker: ${msg}`] };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: `Payload ${sebutan} harus berupa objek JSON valid.` };
  }
  return { obj: parsed as Record<string, unknown> };
}

const arrayDari = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);

const PENDEKATAN_SAH: Bab2Pendekatan[] = ["VERIFIKATIF", "DESKRIPTIF", "KAJIAN_LITERATUR", "BELUM_DITENTUKAN"];

/** Hipotesis hanya sah bila pendekatan verifikatif (D.7). */
export function pendekatanBolehHipotesis(p: Bab2Pendekatan): boolean {
  return p === "VERIFIKATIF";
}

/** Struktur sub-bab baku per pendekatan (D.8). Sumber tunggal kebenaran. */
export function strukturBakuBab2(p: Bab2Pendekatan): string[] {
  switch (p) {
    case "VERIFIKATIF":
      return ["Landasan Teori", "Penelitian Terdahulu", "Kerangka Pemikiran", "Hipotesis"];
    case "DESKRIPTIF":
      return ["Landasan Teori", "Penelitian Terdahulu", "Kerangka Pemikiran"];
    case "KAJIAN_LITERATUR":
      return ["Konsep & Landasan Teori", "Kajian Penelitian Terdahulu", "Kerangka Analisis"];
    default:
      return [];
  }
}

// =========================================================================
// TAHAP 12 — FONDASI BAB 2 (6A)
// =========================================================================

export function parseBab2FoundationTransfer(rawText: string): Bab2ParseResult<Bab2FoundationV1> {
  if (!rawText || rawText.trim().length === 0) {
    return { success: false, error: "Teks output masih kosong.", errorDetails: ["Tempelkan output Tahap 6A."] };
  }

  const blok = ambilBlokJson(rawText, BAB2_FOUNDATION_BEGIN, BAB2_FOUNDATION_END);
  if (blok.error) return { success: false, error: `Blok data fondasi Bab 2 tidak ditemukan.`, errorDetails: blok.errorDetails };
  const parsed = parseJson(blok.json!, "fondasi Bab 2");
  if (parsed.error) return { success: false, error: parsed.error, errorDetails: parsed.errorDetails };

  const p = parsed.obj!;
  const detail: string[] = [];
  const warnings: string[] = [];

  if (p.schema_version !== 1) detail.push("schema_version wajib bernilai angka 1.");
  if (!Array.isArray(p.structure_blueprint) || p.structure_blueprint.length === 0) {
    detail.push("structure_blueprint wajib berisi minimal satu sub-bab.");
  }
  if (!Array.isArray(p.claim_ledger)) detail.push("claim_ledger wajib berupa array (boleh kosong).");
  if (detail.length > 0) {
    return { success: false, error: "Struktur fondasi Bab 2 belum memenuhi standar SKRIFLOW_BAB2_FOUNDATION_V1.", errorDetails: detail };
  }

  let pendekatan: Bab2Pendekatan = PENDEKATAN_SAH.includes(p.pendekatan as Bab2Pendekatan)
    ? (p.pendekatan as Bab2Pendekatan)
    : "BELUM_DITENTUKAN";
  if (p.pendekatan && pendekatan === "BELUM_DITENTUKAN") {
    warnings.push(`Pendekatan "${String(p.pendekatan)}" tidak dikenali — diperlakukan sebagai BELUM_DITENTUKAN. Mahasiswa perlu memilih pendekatan.`);
  }

  const blueprint = (p.structure_blueprint as Record<string, unknown>[]).map((b, idx) => {
    const rentang = Array.isArray(b.target_word_range) ? b.target_word_range : undefined;
    return {
      order: typeof b.order === "number" ? b.order : idx + 1,
      sub_bab: String(b.sub_bab || `Sub-bab ${idx + 1}`),
      function: String(b.function || ""),
      target_word_range:
        rentang && rentang.length === 2 ? ([Number(rentang[0]), Number(rentang[1])] as [number, number]) : undefined,
      source_ids: arrayDari(b.source_ids),
      claim_ids: arrayDari(b.claim_ids),
    };
  });

  // Backfill target per sub-bab bila AI tidak mengisinya (D.10) — dibagi rata,
  // maksimum tidak boleh melebihi batas atas rentang.
  const targetTotal = typeof p.target_words_total === "number" ? p.target_words_total : BAB2_TARGET_WORDS;
  const adaRentang = blueprint.some((b) => b.target_word_range);
  if (!adaRentang && blueprint.length > 0) {
    const per = Math.round(targetTotal / blueprint.length);
    blueprint.forEach((b) => (b.target_word_range = [Math.round(per * 0.8), Math.round(per * 1.2)]));
    warnings.push(`Rentang kata per sub-bab tidak diisi AI — dibagi rata (${per} kata/sub-bab) dari target ${targetTotal}.`);
  }

  const ledger: Bab2ClaimLedgerItem[] = (p.claim_ledger as Record<string, unknown>[]).map((c, idx) => ({
    claim_id: String(c.claim_id || `CLM-B2-${String(idx + 1).padStart(2, "0")}`),
    claim_text: String(c.claim_text || ""),
    claim_type: (c.claim_type as Bab2ClaimType) || "THEORY_CLAIM",
    source_ids: arrayDari(c.source_ids),
    status: (["READY_TO_DRAFT", "NEEDS_VERIFICATION", "DO_NOT_USE"] as const).includes(c.status as never)
      ? (c.status as Bab2ClaimLedgerItem["status"])
      : "NEEDS_VERIFICATION",
  }));

  // Hipotesis pada pendekatan non-verifikatif DIBUANG di parser, bukan hanya
  // ditandai — menahan sampai tahap pemeriksa berarti draf bisa terlanjur ditulis.
  let hipotesis = Array.isArray(p.hypothesis_candidates)
    ? (p.hypothesis_candidates as Record<string, unknown>[]).map((h) => ({
        pernyataan: String(h.pernyataan || ""),
        arah: String(h.arah || ""),
        status: "CANDIDATE_ONLY" as const,
        researcher_decision: "pending" as const,
      }))
    : [];

  if (hipotesis.length > 0 && !pendekatanBolehHipotesis(pendekatan)) {
    warnings.push(
      `Hipotesis dibuang: pendekatan ${pendekatan} tidak menguji hipotesis. Hipotesis hanya sah pada pendekatan verifikatif (Addendum D.7).`
    );
    hipotesis = [];
  }

  const strukturBaku = strukturBakuBab2(pendekatan);
  if (strukturBaku.length > 0) {
    const subBabAi = blueprint.map((b) => b.sub_bab.toLowerCase());
    const kurang = strukturBaku.filter((s) => !subBabAi.some((x) => x.includes(s.toLowerCase())));
    if (kurang.length > 0) {
      warnings.push(`Sub-bab yang belum ada di blueprint untuk pendekatan ${pendekatan}: ${kurang.join(", ")}.`);
    }
  }

  const sumberBaru: Bab2SumberBaru[] = Array.isArray(p.candidate_new_sources)
    ? (p.candidate_new_sources as Record<string, unknown>[]).map((s, i) => ({
        id_sementara: String(s.id_sementara || `BARU-${i + 1}`),
        authors_year: String(s.authors_year || ""),
        title: String(s.title || ""),
        alasan_muncul: String(s.alasan_muncul || ""),
      }))
    : [];

  const data: Bab2FoundationV1 = {
    schema_version: 1,
    foundation_status: (["BAB2_READY", "BAB2_NEEDS_VERIFICATION", "BAB2_BLOCKED"] as const).includes(p.foundation_status as never)
      ? (p.foundation_status as Bab2FoundationV1["foundation_status"])
      : pendekatan === "BELUM_DITENTUKAN"
        ? "BAB2_NEEDS_VERIFICATION"
        : "BAB2_READY",
    status_reason: String(p.status_reason || ""),
    pendekatan,
    pendekatan_sumber: String(p.pendekatan_sumber || ""),
    structure_blueprint: blueprint.sort((a, b) => a.order - b.order),
    theory_map: Array.isArray(p.theory_map)
      ? (p.theory_map as Record<string, unknown>[]).map((t) => ({
          konstruk: String(t.konstruk || ""),
          definisi_ringkas: String(t.definisi_ringkas || ""),
          source_ids: arrayDari(t.source_ids),
          status_klaim: (["READY_TO_DRAFT", "NEEDS_VERIFICATION", "DO_NOT_USE"] as const).includes(t.status_klaim as never)
            ? (t.status_klaim as "READY_TO_DRAFT" | "NEEDS_VERIFICATION" | "DO_NOT_USE")
            : "NEEDS_VERIFICATION",
        }))
      : [],
    claim_ledger: ledger,
    prohibited_claims: arrayDari(p.prohibited_claims),
    not_safe_to_say: arrayDari(p.not_safe_to_say),
    unresolved_notes: arrayDari(p.unresolved_notes),
    candidate_new_sources: sumberBaru,
    conceptual_framework: p.conceptual_framework
      ? {
          konstruk: arrayDari((p.conceptual_framework as Record<string, unknown>).konstruk),
          hubungan: String((p.conceptual_framework as Record<string, unknown>).hubungan || ""),
          status: "CANDIDATE_ONLY",
          researcher_decision: "pending",
        }
      : undefined,
    hypothesis_candidates: hipotesis,
    target_words_total: targetTotal,
    normalization_warnings: warnings,
  };

  return { success: true, data, warnings };
}

// =========================================================================
// TAHAP 13 — DRAF BAB 2 (6B)
// =========================================================================

export function parseBab2DraftTransfer(
  rawText: string,
  context?: { foundation?: Bab2FoundationV1 }
): Bab2ParseResult<Bab2DraftV1> {
  if (!rawText || rawText.trim().length === 0) {
    return { success: false, error: "Teks output masih kosong.", errorDetails: ["Tempelkan output Tahap 6B."] };
  }

  const blok = ambilBlokJson(rawText, BAB2_DRAFT_BEGIN, BAB2_DRAFT_END);
  if (blok.error) return { success: false, error: "Blok data draf Bab 2 tidak ditemukan.", errorDetails: blok.errorDetails };
  const parsed = parseJson(blok.json!, "draf Bab 2");
  if (parsed.error) return { success: false, error: parsed.error, errorDetails: parsed.errorDetails };

  const p = parsed.obj!;
  const detail: string[] = [];
  const warnings: string[] = [];

  if (p.schema_version !== 1) detail.push("schema_version wajib bernilai angka 1.");
  if (!Array.isArray(p.background) || p.background.length === 0) {
    detail.push("background wajib berisi minimal satu sub-bab.");
  }
  if (detail.length > 0) {
    return { success: false, error: "Struktur draf Bab 2 belum memenuhi standar SKRIFLOW_BAB2_DRAFT_V1.", errorDetails: detail };
  }

  const background = (p.background as Record<string, unknown>[]).map((b, idx) => ({
    order: typeof b.order === "number" ? b.order : idx + 1,
    sub_bab: String(b.sub_bab || `Sub-bab ${idx + 1}`),
    function: String(b.function || ""),
    paragraph_text: String(b.paragraph_text || ""),
    claim_ids: arrayDari(b.claim_ids),
    withheld_claims: arrayDari(b.withheld_claims),
  }));

  const hitungSendiri = background.reduce((a, b) => a + hitungKata(b.paragraph_text), 0);
  const klaimAi = typeof p.word_count_total === "number" ? p.word_count_total : 0;
  const target = typeof p.target_words_total === "number" ? p.target_words_total : BAB2_TARGET_WORDS;
  if (klaimAi !== 0 && klaimAi !== hitungSendiri) {
    warnings.push(`Hitungan kata AI (${klaimAi}) berbeda dari hitungan tool (${hitungSendiri}). Yang dipakai: hitungan tool.`);
  }

  const sumberBaru: Bab2SumberBaru[] = Array.isArray(p.new_sources_introduced)
    ? (p.new_sources_introduced as Record<string, unknown>[]).map((s, i) => ({
        id_sementara: String(s.id_sementara || `BARU-${i + 1}`),
        authors_year: String(s.authors_year || ""),
        title: String(s.title || ""),
        alasan_muncul: String(s.alasan_muncul || ""),
      }))
    : [];

  const data: Bab2DraftV1 = {
    schema_version: 1,
    draft_status: (["DRAFT_COMPLETE", "DRAFT_PARTIAL", "DRAFT_BLOCKED"] as const).includes(p.draft_status as never)
      ? (p.draft_status as Bab2DraftV1["draft_status"])
      : "DRAFT_PARTIAL",
    foundation_status_ref: String(p.foundation_status_ref || context?.foundation?.foundation_status || ""),
    word_count_total: hitungSendiri,
    target_words_total: target,
    background: background.sort((a, b) => a.order - b.order),
    skipped_sections: arrayDari(p.skipped_sections),
    used_claim_ids: arrayDari(p.used_claim_ids),
    used_source_ids: arrayDari(p.used_source_ids),
    avoided_claims: arrayDari(p.avoided_claims),
    new_sources_introduced: sumberBaru,
    consistency_notes: arrayDari(p.consistency_notes),
    unresolved_notes: arrayDari(p.unresolved_notes),
  };

  return { success: true, data, warnings };
}

// =========================================================================
// TAHAP 14 — POLES BAHASA BAB 2 (6C)
// =========================================================================

export function parseBab2PolishTransfer(
  rawText: string,
  context?: { draft?: Bab2DraftV1 }
): Bab2ParseResult<Bab2PolishV1> {
  if (!rawText || rawText.trim().length === 0) {
    return { success: false, error: "Teks output masih kosong.", errorDetails: ["Tempelkan output Tahap 6C."] };
  }

  const blok = ambilBlokJson(rawText, BAB2_POLISH_BEGIN, BAB2_POLISH_END);
  if (blok.error) return { success: false, error: "Blok data hasil poles Bab 2 tidak ditemukan.", errorDetails: blok.errorDetails };
  const parsed = parseJson(blok.json!, "hasil poles Bab 2");
  if (parsed.error) return { success: false, error: parsed.error, errorDetails: parsed.errorDetails };

  const p = parsed.obj!;
  if (!Array.isArray(p.background) || p.background.length === 0) {
    return {
      success: false,
      error: "Struktur hasil poles Bab 2 belum memenuhi standar SKRIFLOW_BAB2_POLISH_V1.",
      errorDetails: ["background wajib berisi minimal satu sub-bab."],
    };
  }

  const warnings: string[] = [];
  const background = (p.background as Record<string, unknown>[]).map((b, idx) => ({
    order: typeof b.order === "number" ? b.order : idx + 1,
    sub_bab: String(b.sub_bab || `Sub-bab ${idx + 1}`),
    function: String(b.function || ""),
    paragraph_text: String(b.paragraph_text || ""),
    claim_ids: arrayDari(b.claim_ids),
    withheld_claims: arrayDari(b.withheld_claims),
  }));

  // Klaim dikunci di 6C (Addendum C). Perubahan peta klaim = pelanggaran batas
  // bukti, jadi dibandingkan di sini juga, bukan hanya di pemeriksa draf.
  const klaimDraf = (context?.draft?.background || []).flatMap((b) => b.claim_ids).sort().join(",");
  const klaimPoles = background.flatMap((b) => b.claim_ids).sort().join(",");
  const klaimUtuh = !context?.draft || klaimDraf === klaimPoles;

  if (!klaimUtuh) {
    warnings.push(
      "Peta klaim berubah setelah poles bahasa. 4D/6C hanya boleh mengubah bahasa — kembalikan claim_ids ke bentuk semula."
    );
  }

  const data: Bab2PolishV1 = {
    schema_version: 1,
    polish_status: (["POLISH_COMPLETE", "POLISH_PARTIAL", "POLISH_BLOCKED"] as const).includes(p.polish_status as never)
      ? (p.polish_status as Bab2PolishV1["polish_status"])
      : "POLISH_PARTIAL",
    word_count_total: background.reduce((a, b) => a + hitungKata(b.paragraph_text), 0),
    background: background.sort((a, b) => a.order - b.order),
    claim_ids_unchanged: typeof p.claim_ids_unchanged === "boolean" ? p.claim_ids_unchanged && klaimUtuh : klaimUtuh,
    language_notes: arrayDari(p.language_notes),
    changed_sections: arrayDari(p.changed_sections),
    unresolved_notes: arrayDari(p.unresolved_notes),
  };

  return { success: true, data, warnings };
}

// =========================================================================
// Pemeriksa tanda tangan sumber
// =========================================================================

/**
 * Cari tanda sitasi dalam teks. Dipakai pemeriksa Bab 2.
 * ponytail: pola `(Nama, Tahun)` saja — gaya `Nama (Tahun)` ditangani terpisah
 * lewat `ambilNamaTahun`. Sitasi bernomor gaya IEEE belum didukung; tambahkan
 * kalau ada mahasiswa yang memakainya.
 */
export function ambilSitasiTanda(teks: string): string[] {
  const out: string[] = [];
  const re = /\(([^()]{2,120}?),\s*(\d{4}[a-z]?)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks))) out.push(`${m[1].trim()}, ${m[2]}`);
  return out;
}

/** Nama+tahun gaya "Menurut Mishra (2017)" dan "Mishra (2017) menunjukkan". */
export function ambilNamaTahun(teks: string): string[] {
  const out: string[] = [];
  const re = /([A-Z][\p{L}'’.-]+(?:\s+(?:&|dan|et al\.?)\s+[A-Z][\p{L}'’.-]+)?(?:\s+[A-Z][\p{L}'’.-]+)?)\s*\((\d{4}[a-z]?)\)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks))) out.push(`${m[1].trim()}, ${m[2]}`);
  return out;
}

/**
 * Nama sah untuk Bab 2: register Tool 3 (artikel) DAN paket fondasi Bab 1
 * (dokumen pemerintah/lembaga). Dua-duanya benar-benar dipakai mahasiswa.
 */
export function namaSahBab2(
  register: SumberPaketLiteratur[],
  foundation?: import("@/types/tool").Bab1FoundationV1 | null
): Set<string> {
  const sah = new Set<string>();
  const tambah = (teks?: string) => {
    const t = (teks || "").trim();
    if (!t) return;
    // "Shintia Ramadani & Sofia Trisni (2019)" -> "shintia ramadani & sofia trisni, 2019"
    const a = t.match(/^(.*?)[\s,]*\((\d{4}[a-z]?)\)\s*$/i);
    const nama = (a ? a[1] : t).replace(/[,\s]+$/, "").trim().toLowerCase();
    const tahun = a ? a[2] : "";
    if (nama) sah.add(tahun ? `${nama}, ${tahun}` : nama);
  };

  register.forEach((s) => tambah(s.authorsYear));

  (foundation?.paragraph_claims || []).forEach((c) =>
    (c.sourceReferences || []).forEach((r) => tambah(r.authorsYear))
  );

  return sah;
}
