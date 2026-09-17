import {
  SkriflowIdeaResultV3,
  ExplorationAreaCandidateV3,
  ExplorationComparisonV3,
  DataProvenanceItem,
  ResearchContext,
  PhenomenonSearchDirectionV3,
  LiteratureSearchSeeds,
  ScopeBoundary,
  HandoffToPhenomenonV3,
  DataOrigin,
  DataAccessStatus,
  PhenomenonDirectionType,
  PrioritySourceType,
  AreaRole,
  FocusContinuity,
  ConstraintFitAssessment,
} from "@/types/tool";
import { RESEARCH_FIELD_LIMITS } from "@/config/researchFieldLimits";
import { filterNegatedCausal, CAUSAL_CLAIM_TERMS, hasAbsenceClaim } from "@/lib/academicGates";

/**
 * Pola penulisan judul/kesimpulan final (R-11).
 *
 * Tool 1 hanya boleh menghasilkan arah eksplorasi, bukan judul jadi atau
 * kesimpulan. Frasa ini dulu lolos tanpa catatan.
 */
const FINAL_TITLE_PATTERNS: readonly RegExp[] = [
  /\b(judul|title)\s*(final|akhir|skripsi|penelitian)?\s*[:=]/i,
  /\bjudul\s+(yang\s+)?(di)?(rekomendasikan|disarankan|dipilih|final)\b/i,
  /\bkesimpulan\s*(akhir|final|sementara)?\s*[:=]/i,
  /\bkesimpulan\s+penelitian\s+ini\s+adalah\b/i,
  /\b(abstrak|abstract)\s*[:=]/i,
];

export const IDEA_START_MARKER = "=== BEGIN SKRIFLOW_IDEA_V3 ===";
export const IDEA_END_MARKER = "=== END SKRIFLOW_IDEA_V3 ===";
export const LEGACY_IDEA_START_MARKER = "=== BEGIN SKRIFLOW_IDEA_V2 ===";
export const LEGACY_IDEA_END_MARKER = "=== END SKRIFLOW_IDEA_V2 ===";

// Central source of truth limits for Tool 1 (Cari Ide Skripsi)
export const IDEA_RESULT_SOFT_LIMIT = 80_000;
export const IDEA_RESULT_HARD_LIMIT = 120_000;
export const IDEA_TRANSFER_BLOCK_HARD_LIMIT = 100_000;

export const VALID_DATA_ORIGINS: readonly DataOrigin[] = [
  "PUBLIC_SECONDARY",
  "RESEARCHER_GENERATED",
  "PRIMARY_RESPONDENT",
  "INSTITUTIONAL_METADATA",
] as const;

export const VALID_DATA_ACCESS_STATUSES: readonly DataAccessStatus[] = [
  "INDICATED",
  "NEEDS_CHECKING",
  "NOT_CONFIRMED",
] as const;

export const VALID_PHENOMENON_DIRECTION_TYPES: readonly PhenomenonDirectionType[] = [
  "ADOPTION",
  "PRACTICE_CHANGE",
  "OUTPUT_BEHAVIOR",
  "ACCURACY_RELIABILITY",
  "REGULATION",
  "MARKET_PATTERN",
  "DISCLOSURE_USE",
  "DISCREPANCY",
  "OTHER_OBSERVABLE",
] as const;

export const VALID_SOURCE_TYPES: readonly PrioritySourceType[] = [
  "OFFICIAL_DATA",
  "REGULATION",
  "INSTITUTIONAL_REPORT",
  "EMPIRICAL_ARTICLE",
  "WORKING_PAPER",
  "REPUTABLE_NEWS",
] as const;

export const FORBIDDEN_SOURCE_TYPES_AS_PROVENANCE = [
  "PUBLIC_SECONDARY",
  "RESEARCHER_GENERATED",
  "PRIMARY_RESPONDENT",
  "INSTITUTIONAL_METADATA",
] as const;

export const EXPERIMENT_PROCEDURE_PATTERNS: readonly RegExp[] = [
  /\b(jalankan|menjalankan|berikan|masukkan)\s+prompt\b/i,
  /\b(jalankan|run)\s+(prompt|model|chatgpt|llm|ai)\b/i,
  /\b(jalankan|eksekusi)\s+.*\s+(berulang|beberapa)\s+kali\b/i,
  /\b(berikan|input|masukkan)\s+.*\s+(kepada|ke)\s+(chatgpt|llm|ai|model|gpt)\b/i,
  /\b(bandingkan|membandingkan)\s+(output|respons|jawaban|hasil)\s+(chatgpt|llm|ai|model|gpt)\b/i,
  /\b(hasilkan|menghasilkan|buat|membuat|generate)\s+(output|dataset|data baru|respons ai)\b/i,
  /\b(buat|membuat|lakukan|melakukan)\s+simulasi\b/i,
  /\b(sebar|sebarkan|menyebarkan)\s+(survei|kuesioner|angket)\b/i,
  /\b(survei|menyurvei)\s+responden\b/i,
  /\b(lakukan|melakukan)\s+wawancara\b/i,
  /\bwawancarai\s+(responden|subjek|narasumber|analis|investor|pengguna)\b/i,
  /\b(lakukan|melakukan|buat|membuat)\s+(scoring|koding|coding|pengkodean)\b/i,
  /\b(lakukan|melakukan|jalankan|buat)\s+eksperimen\b/i,
  /\b(uji\s+coba\s+mandiri|eksperimen\s+baru)\b/i,
  /\blalu\s+(ukur|periksa|cek|lihat)\s+(akurasinya|jawabannya|responsnya|hasilnya)\b/i,
  // Niat pengumpulan data primer (R-16). Versi lama hanya menangkap frasa
  // eksplisit seperti "sebar kuesioner", sehingga "wawancara 100 responden"
  // dan "ambil sampel" lolos.
  /\b(lakukan|melakukan|mengadakan|adakan)\s+(survei|kuesioner|angket|wawancara|observasi|pengamatan)\b/i,
  /\b(survei|kuesioner|angket|wawancara|observasi|pengamatan)\s+(kepada|terhadap|ke|pada)\s+\d+\b/i,
  /\bwawancara\s+\d+\s+(responden|narasumber|subjek|orang|informan)\b/i,
  /\b(sebarkan|menyebarkan|sebar|bagikan|membagikan)\s+(kuesioner|angket|survei|formulir)\b/i,
  /\b(ambil|mengambil|kumpulkan|mengumpulkan)\s+(sampel|data\s+primer|data\s+lapangan)\b/i,
  /\b(sampel|responden|partisipan)\s+sebanyak\s+\d+\b/i,
  /\b(menyebar|mengirim)\s+(angket|kuesioner)\s+ke\s+\d+\b/i,
] as const;

export const VALID_CONSTRAINT_FIT_STATUSES = [
  "SELARAS_SEMENTARA",
  "PERLU_DIPERIKSA",
  "BERISIKO",
] as const;

export const VALID_INTEREST_FIT = [
  "SANGAT_DEKAT",
  "DEKAT",
  "CUKUP_DEKAT",
  "PERLU_DIPERIKSA",
] as const;

export const VALID_STUDY_PROGRAM_FIT = [
  "KUAT",
  "SEDANG",
  "LEMAH",
  "PERLU_DIPERIKSA",
] as const;

export const VALID_DATA_FIT = [
  "SELARAS_SEMENTARA",
  "PERLU_DIPERIKSA",
  "BERISIKO",
] as const;

export const VALID_COLLECTION_BURDEN = [
  "RENDAH_SEMENTARA",
  "SEDANG",
  "TINGGI",
  "PERLU_DIPERIKSA",
] as const;

export const VALID_METHODOLOGICAL_UNCERTAINTY = [
  "RENDAH",
  "SEDANG",
  "TINGGI",
  "PERLU_DIPERIKSA",
] as const;

export const LITERATURE_CONTAMINATION_TERMS = [
  "penelitian terdahulu",
  "literatur",
  "jurnal",
  "studi sebelumnya",
  "studi terdahulu",
  "teori apa",
  "teori yang",
  "teori",
  "state of the art",
  "research gap",
  "novelty",
  "kebaruan",
  "kajian pustaka",
  "artikel terdahulu",
  "previous studies",
  "prior research",
] as const;

export type IdeaValidationStatus =
  | "HASIL_VALID"
  | "HASIL_PERLU_DIPERIKSA"
  | "HASIL_TIDAK_DIKENALI"
  | "LEGACY_V2_REQUIRES_REGENERATION"
  | "OUTPUT_TERLALU_PANJANG";

export interface ParseIdeaResult {
  success: boolean;
  status: IdeaValidationStatus;
  error?: string;
  errorDetails: string[];
  warnings: string[];
  data?: SkriflowIdeaResultV3;
  blockedAreaIds?: string[];
  legacyV2Detected?: boolean;
}

/**
 * Counts characters accurately using Array.from to handle surrogate pairs & emojis correctly.
 */
export function countChars(val: unknown): number {
  if (typeof val !== "string") return 0;
  return Array.from(val).length;
}

/**
 * Computes deterministic fingerprint from student's original form input.
 */
export function computeIdeaInputFingerprint(values: Record<string, string> = {}): string {
  const parts: string[] = [
    "v3",
    (values.prodi || values.programStudi || "").trim().toLowerCase(),
    (values.minat || values.minatTopik || "").trim().toLowerCase(),
    (values.pendekatan || "unknown").trim().toLowerCase(),
    (values.preferensi_data || values.jenisData || "unknown").trim().toLowerCase(),
    (values.akses_data || "unknown").trim().toLowerCase(),
    (values.akses_data_catatan || "").trim().toLowerCase(),
    (values.avoidances || values.kondisiBatasan || "").trim().toLowerCase(),
    (values.target_waktu || "unknown").trim().toLowerCase(),
    (values.constraints || "").trim().toLowerCase(),
    (values.supervisor_direction || values.arahan_dosen || "").trim().toLowerCase(),
  ];

  const fullStr = parts.join("|||");
  let hash = 0;
  for (let i = 0; i < fullStr.length; i++) {
    const char = fullStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return `idea_fp_v3_${Math.abs(hash).toString(36)}_${fullStr.length}`;
}

/**
 * Computes deterministic payload fingerprint from parsed and normalized SkriflowIdeaResultV3.
 * Considers schema version, area IDs, names, scopes, constraint fit, data provenance,
 * research context, phenomenon directions, research shape preview, and comparison.
 */
export function computePayloadFingerprint(data: SkriflowIdeaResultV3 | null | undefined): string {
  if (!data || !Array.isArray(data.areas) || data.areas.length === 0) return "";

  const parts: string[] = [
    `v${data.schemaVersion || 3}`,
    data.areas
      .map((a) => {
        return [
          a.id,
          (a.name || "").trim().toLowerCase(),
          (a.scopeSummary || "").trim().toLowerCase(),
          (a.academicConnection || "").trim().toLowerCase(),
          (a.interestConnection || "").trim().toLowerCase(),
          a.constraintFit?.status || "UNKNOWN",
          (a.constraintFit?.reason || "").trim().toLowerCase(),
          (a.constraintFit?.risks || []).join("::"),
          (a.dataProvenance || [])
            .map((dp) => `${dp.dataForm}|${dp.origin}|${dp.accessStatus}`)
            .join(";;"),
          (a.phenomenonSearchDirections || [])
            .map((d) => `${d.label}|${d.directionType}|${d.searchQuestion}`)
            .join(";;"),
          a.researchShapePreview?.illustrativeTitlePattern || "",
          a.researchShapePreview?.possibleFocus || "",
        ].join("||");
      })
      .sort()
      .join("___"),
    (data.comparison || [])
      .map(
        (c) =>
          `${c.areaId}:${c.interestFit}:${c.studyProgramFit}:${c.dataFit}:${c.collectionBurden}:${c.methodologicalUncertainty}:${(c.mainCheckNext || "").trim().toLowerCase()}`
      )
      .sort()
      .join("___"),
  ];

  const fullStr = parts.join("####");
  let hash = 0;
  for (let i = 0; i < fullStr.length; i++) {
    const char = fullStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return `payload_fp_v3_${Math.abs(hash).toString(36)}_${fullStr.length}`;
}

/**
 * Parses and validates SKRIFLOW_IDEA_V3 transfer text.
 * Never uses eval() or executes scripts.
 */
export function parseIdeaTransfer(
  rawText: string,
  sourceInputFingerprint: string = ""
): ParseIdeaResult {
  const errorDetails: string[] = [];
  const warnings: string[] = [];
  const blockedAreaIds: string[] = [];

  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: "Hasil masih kosong. Salin seluruh teks output dari ChatGPT atau Gemini lalu tempel di sini.",
      errorDetails: ["Teks tempelan kosong."],
      warnings: [],
    };
  }

  // 1. Hard limit check for raw pasted input (120,000 chars)
  const rawLength = countChars(rawText);
  if (rawLength > IDEA_RESULT_HARD_LIMIT) {
    return {
      success: false,
      status: "OUTPUT_TERLALU_PANJANG",
      error:
        "Output terlalu panjang untuk diproses dengan aman. Pertahankan satu hasil lengkap dan pastikan hanya ada satu blok SKRIFLOW_IDEA_V3.",
      errorDetails: [
        `Ukuran teks output (${rawLength.toLocaleString()} karakter) melebihi batas maksimal ${IDEA_RESULT_HARD_LIMIT.toLocaleString()} karakter.`,
      ],
      warnings: [],
    };
  }

  // 2. Soft limit check (80,000 chars) -> non-blocking warning
  if (rawLength > IDEA_RESULT_SOFT_LIMIT) {
    warnings.push(
      "Output cukup panjang, tetapi masih dapat diproses. Pastikan hasil memuat satu blok SKRIFLOW_IDEA_V3 yang lengkap."
    );
  }

  // 3. Check for legacy V2 format
  if (rawText.includes(LEGACY_IDEA_START_MARKER) || rawText.includes('"schema_version": 2')) {
    return {
      success: false,
      status: "LEGACY_V2_REQUIRES_REGENERATION",
      legacyV2Detected: true,
      error:
        "Output Format Lama Terdeteksi: Hasil yang kamu tempel menggunakan format SKRIFLOW_IDEA_V2 (versi sebelumnya). Format terbaru V3 memisahkan asal data secara metodologis (public secondary vs researcher generated), membagi konteks riset (aktor, entitas, dokumen, artefak, geografi), memisahkan arah fenomena dari seed literatur, dan menambahkan batas ruang lingkup (in-scope / out-of-scope). Silakan generate ulang prompt di Tahap 1.",
      errorDetails: [
        "Blok transfer yang ditempel menggunakan skema versi 2 lama ('SKRIFLOW_IDEA_V2').",
        "Generate ulang prompt Cari Ide di Tahap 1, jalankan kembali di ChatGPT atau Gemini, lalu tempel output yang memiliki blok SKRIFLOW_IDEA_V3.",
      ],
      warnings,
    };
  }

  // 4. Normalize markdown escaped markers (e.g. \=\=\= or **===)
  const normalizedText = rawText.replace(/\\=/g, "=");

  // Search for markers using regex to support minor variations in spacing/formatting
  const startRegex = /={3,}\s*BEGIN\s+SKRIFLOW_IDEA_V3\s*={3,}/gi;
  const endRegex = /={3,}\s*END\s+SKRIFLOW_IDEA_V3\s*={3,}/gi;

  const startMatches = [...normalizedText.matchAll(startRegex)];
  const endMatches = [...normalizedText.matchAll(endRegex)];

  // Duplicate / echo handling: respons AI sering ikut mengutip marker di teks
  // instruksi (echo prompt), sehingga marker muncul >1 kali padahal blok asli
  // cuma satu. Kumpulkan semua kandidat span START->END, urutkan dari yang
  // terpendek, pilih span yang JSON-nya benar-benar blok V3 valid. Tolak HANYA
  // jika ada lebih dari satu blok valid (ambigu).
  const candidateSpans: {
    startMatch: RegExpMatchArray;
    endMatch: RegExpMatchArray;
    text: string;
  }[] = [];
  for (const sm of startMatches) {
    const sIdx = sm.index!;
    for (const em of endMatches) {
      const eIdx = em.index!;
      if (eIdx <= sIdx + sm[0].length) continue;
      const blockText = normalizedText
        .substring(sIdx + sm[0].length, eIdx)
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      candidateSpans.push({ startMatch: sm, endMatch: em, text: blockText });
    }
  }
  candidateSpans.sort((a, b) => a.text.length - b.text.length);

  const validSpans = candidateSpans.filter((span) => {
    if (countChars(span.text) > IDEA_TRANSFER_BLOCK_HARD_LIMIT) return false;
    try {
      const probe = JSON.parse(span.text) as Record<string, unknown>;
      return (
        !!probe &&
        typeof probe === "object" &&
        !Array.isArray(probe) &&
        probe.schema_version === 3 &&
        Array.isArray(probe.areas)
      );
    } catch {
      return false;
    }
  });

  if (validSpans.length > 1) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error:
        "Terdeteksi lebih dari satu blok SKRIFLOW_IDEA_V3. Pastikan hanya menempel satu hasil lengkap.",
      errorDetails: [
        `Ditemukan ${validSpans.length} blok SKRIFLOW_IDEA_V3 yang valid dalam teks.`,
      ],
      warnings,
    };
  }

  if (
    validSpans.length === 0 &&
    (startMatches.length > 1 || endMatches.length > 1)
  ) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error:
        "Terdeteksi lebih dari satu blok SKRIFLOW_IDEA_V3, tetapi tidak ada yang lengkap dan valid. Tempel satu hasil lengkap saja (dari === BEGIN sampai === END).",
      errorDetails: [
        `Ditemukan ${startMatches.length} marker pembuka dan ${endMatches.length} marker penutup, tetapi tidak ada blok JSON V3 valid.`,
      ],
      warnings,
    };
  }

  // Tepat satu blok valid + marker mentah >1 = kemungkinan echo instruksi;
  // proses blok itu dengan catatan nonfatal.
  if (
    validSpans.length === 1 &&
    (startMatches.length > 1 || endMatches.length > 1)
  ) {
    warnings.push(
      "Terdeteksi teks tambahan di luar blok transfer (misal instruksi yang ikut tersalin). Blok SKRIFLOW_IDEA_V3 yang valid tetap diproses."
    );
  }

  const chosenStart =
    validSpans.length === 1 ? validSpans[0].startMatch : startMatches[0];
  const chosenEnd =
    validSpans.length === 1 ? validSpans[0].endMatch : endMatches[0];

  // Check start without end
  if (startMatches.length === 1 && endMatches.length === 0) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error:
        "Marker penutup === END SKRIFLOW_IDEA_V3 === tidak ditemukan. Pastikan seluruh jawaban model tersalin hingga akhir tanpa terpotong.",
      errorDetails: [
        "Marker pembuka === BEGIN SKRIFLOW_IDEA_V3 === ditemukan, namun marker penutup === END SKRIFLOW_IDEA_V3 === hilang atau terpotong.",
      ],
      warnings,
    };
  }

  // Check end without start
  if (startMatches.length === 0 && endMatches.length === 1) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error:
        "Marker pembuka === BEGIN SKRIFLOW_IDEA_V3 === tidak ditemukan. Pastikan seluruh jawaban model tersalin lengkap dari awal blok.",
      errorDetails: [
        "Marker penutup === END SKRIFLOW_IDEA_V3 === ditemukan, namun marker pembuka === BEGIN SKRIFLOW_IDEA_V3 === hilang.",
      ],
      warnings,
    };
  }

  // Check missing both markers
  if (startMatches.length === 0 && endMatches.length === 0) {
    const upper = rawText.toUpperCase();
    const hasLegacyKeywords =
      upper.includes("AREA EKSPLORASI") ||
      upper.includes("ISIAN SIAP PAKAI UNTUK TOOL 2") ||
      upper.includes("PERBANDINGAN SINGKAT") ||
      upper.includes("IDE SKRIPSI") ||
      upper.includes("SKRIPSI") ||
      upper.includes("TOPIK") ||
      upper.includes("PENGARUH") ||
      upper.includes("ANALISIS") ||
      upper.includes("REKOMENDASI") ||
      rawText.trim().length > 30;

    if (hasLegacyKeywords) {
      return {
        success: false,
        status: "HASIL_TIDAK_DIKENALI",
        error:
          "Hasil ini dibuat tanpa blok transfer SKRIFLOW_IDEA_V3. Generate ulang prompt Cari Ide, jalankan kembali di ChatGPT/Gemini, lalu tempel seluruh output yang memuat marker === BEGIN SKRIFLOW_IDEA_V3 === sampai === END SKRIFLOW_IDEA_V3 ===.",
        errorDetails: [
          "Marker === BEGIN SKRIFLOW_IDEA_V3 === dan === END SKRIFLOW_IDEA_V3 === tidak ditemukan.",
          "Terdeteksi teks tanpa blok transfer SKRIFLOW_IDEA_V3.",
        ],
        warnings,
      };
    }

    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error:
        "Blok transfer SKRIFLOW_IDEA_V3 tidak ditemukan. Pastikan seluruh jawaban ChatGPT atau Gemini dari marker BEGIN sampai END ikut disalin.",
      errorDetails: [
        "Marker === BEGIN SKRIFLOW_IDEA_V3 === atau === END SKRIFLOW_IDEA_V3 === tidak ditemukan dalam teks.",
      ],
      warnings,
    };
  }

  const startMatch = chosenStart;
  const endMatch = chosenEnd;
  const startIndex = startMatch.index!;
  const markerLength = startMatch[0].length;
  const endIndex = endMatch.index!;

  if (endIndex <= startIndex + markerLength) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error:
        "Posisi marker blok SKRIFLOW_IDEA_V3 tidak berurutan (marker penutup berada sebelum marker pembuka).",
      errorDetails: ["Urutan marker salah."],
      warnings,
    };
  }

  const rawJsonBlock = normalizedText
    .substring(startIndex + markerLength, endIndex)
    .trim();

  // Strip markdown code fences if output was wrapped in ```json ... ```
  const cleanJsonString = rawJsonBlock
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // 5. Check transfer block length limit (100,000 chars)
  const transferBlockLength = countChars(cleanJsonString);
  if (transferBlockLength > IDEA_TRANSFER_BLOCK_HARD_LIMIT) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: "Blok data SKRIFLOW_IDEA_V3 terlalu besar untuk diproses dengan aman.",
      errorDetails: [
        `Ukuran blok data JSON (${transferBlockLength.toLocaleString()} karakter) melebihi batas maksimal ${IDEA_TRANSFER_BLOCK_HARD_LIMIT.toLocaleString()} karakter.`,
      ],
      warnings,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: `JSON di dalam blok transfer rusak atau tidak valid: ${msg}`,
      errorDetails: [
        `Gagal membaca JSON: ${msg}`,
        "Pastikan output model menggunakan format JSON valid dengan double quote dan tanpa trailing comma.",
      ],
      warnings,
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: "Format blok transfer tidak valid (harus berupa JSON object).",
      errorDetails: ["Payload bukan JSON object."],
      warnings,
    };
  }

  const payload = parsed as Record<string, unknown>;

  // Schema version validation
  if (payload.schema_version !== 3) {
    if (payload.schema_version === 2) {
      return {
        success: false,
        status: "LEGACY_V2_REQUIRES_REGENERATION",
        legacyV2Detected: true,
        error: "Output menggunakan skema versi 2 lama. Silakan generate ulang prompt Cari Ide untuk mendapatkan skema V3.",
        errorDetails: ["schema_version adalah 2, wajib bernilai angka 3."],
        warnings: [],
      };
    }
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: `Versi schema '${payload.schema_version}' tidak didukung. Versi yang didukung adalah 3.`,
      errorDetails: [`schema_version harus bernilai angka 3, diterima: ${payload.schema_version}`],
      warnings: [],
    };
  }

  // Validate areas array
  if (!Array.isArray(payload.areas)) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: "Field 'areas' wajib berupa array berisi 2–4 area eksplorasi.",
      errorDetails: ["Field 'areas' bukan array."],
      warnings: [],
    };
  }

  if (payload.areas.length < 2 || payload.areas.length > 4) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: `Jumlah area eksplorasi harus tepat 2–4 area (ditemukan: ${payload.areas.length} area).`,
      errorDetails: [`Jumlah area adalah ${payload.areas.length}, wajib tepat 2–4 area.`],
      warnings: [],
    };
  }

  const validatedAreas: ExplorationAreaCandidateV3[] = [];
  const seenAreaIds = new Set<string>();

  for (let i = 0; i < payload.areas.length; i++) {
    const rawArea = payload.areas[i];
    if (typeof rawArea !== "object" || rawArea === null || Array.isArray(rawArea)) {
      errorDetails.push(`Area indeks ${i} bukan objek.`);
      continue;
    }

    const area = rawArea as Record<string, unknown>;
    const areaId = typeof area.id === "string" && area.id.trim().length > 0 ? area.id.trim() : `A0${i + 1}`;

    if (seenAreaIds.has(areaId)) {
      errorDetails.push(`ID Area duplikat: '${areaId}'. Setiap area wajib memiliki ID unik.`);
    }
    seenAreaIds.add(areaId);

    // 1. Name validation
    const name = typeof area.name === "string" ? area.name.trim() : "";
    if (!name) {
      errorDetails.push(`Area ${areaId}: 'name' tidak boleh kosong.`);
    } else {
      if (countChars(name) > 120) {
        warnings.push(`Area ${areaId}: 'name' (${countChars(name)} karakter) disarankan maksimal 120 karakter.`);
      }
      const lowerName = name.toLowerCase();
      if (
        lowerName.startsWith("pengaruh ") ||
        lowerName.startsWith("analisis pengaruh ") ||
        lowerName.startsWith("hubungan antara ") ||
        lowerName.startsWith("studi empiris tentang pengaruh ")
      ) {
        warnings.push(
          `Area ${areaId}: Nama '${name}' menyerupai judul skripsi. Area eksplorasi seharusnya berupa ruang lingkup topik luas, bukan judul pengujian variabel.`
        );
      }
    }

    // 2. Scope summary validation
    const scopeSummary = typeof area.scope_summary === "string" ? area.scope_summary.trim() : "";
    if (!scopeSummary) {
      errorDetails.push(`Area ${areaId}: 'scope_summary' tidak boleh kosong.`);
    } else if (countChars(scopeSummary) > 600) {
      warnings.push(`Area ${areaId}: 'scope_summary' (${countChars(scopeSummary)} karakter) melebihi batas aman 600 karakter.`);
    }

    // 3. Academic connection validation
    const academicConnection = typeof area.academic_connection === "string" ? area.academic_connection.trim() : "";
    if (!academicConnection) {
      errorDetails.push(`Area ${areaId}: 'academic_connection' tidak boleh kosong.`);
    } else if (countChars(academicConnection) > 600) {
      warnings.push(`Area ${areaId}: 'academic_connection' melebihi batas aman 600 karakter.`);
    }

    // 4. Interest connection validation
    const interestConnection = typeof area.interest_connection === "string" ? area.interest_connection.trim() : "";
    if (!interestConnection) {
      errorDetails.push(`Area ${areaId}: 'interest_connection' tidak boleh kosong.`);
    } else if (countChars(interestConnection) > 500) {
      warnings.push(`Area ${areaId}: 'interest_connection' melebihi batas aman 500 karakter.`);
    }

    // 5. Data Provenance validation
    const rawProvenance = Array.isArray(area.data_provenance) ? area.data_provenance : [];
    if (rawProvenance.length === 0) {
      errorDetails.push(`Area ${areaId}: 'data_provenance' wajib berisi minimal 1 bentuk data.`);
    }
    const validatedProvenance: DataProvenanceItem[] = [];

    for (let pIdx = 0; pIdx < rawProvenance.length; pIdx++) {
      const pItem = rawProvenance[pIdx];
      if (typeof pItem !== "object" || pItem === null) continue;
      const pObj = pItem as Record<string, unknown>;

      const dataForm = typeof pObj.data_form === "string" ? pObj.data_form.trim() : "";
      if (!dataForm) {
        errorDetails.push(`Area ${areaId} provenance[${pIdx}]: 'data_form' tidak boleh kosong.`);
        continue;
      }

      let origin: DataOrigin = "PUBLIC_SECONDARY";
      const rawOrigin = typeof pObj.origin === "string" ? pObj.origin.trim().toUpperCase() : "";
      if (VALID_DATA_ORIGINS.includes(rawOrigin as DataOrigin)) {
        origin = rawOrigin as DataOrigin;
      } else {
        warnings.push(`Area ${areaId} provenance[${pIdx}]: Origin '${rawOrigin}' tidak valid, diubah ke 'PUBLIC_SECONDARY'.`);
      }

      let accessStatus: DataAccessStatus = "NEEDS_CHECKING";
      const rawStatus = typeof pObj.access_status === "string" ? pObj.access_status.trim().toUpperCase() : "";
      if (VALID_DATA_ACCESS_STATUSES.includes(rawStatus as DataAccessStatus)) {
        accessStatus = rawStatus as DataAccessStatus;
      } else {
        accessStatus = "NEEDS_CHECKING";
      }

      const methodologicalNote = typeof pObj.methodological_note === "string" ? pObj.methodological_note.trim() : "";

      // Provenance Heuristic Warnings
      const lowerForm = dataForm.toLowerCase();
      if ((lowerForm.includes("chatgpt") || lowerForm.includes("output prompt") || lowerForm.includes("llm output")) && origin === "PUBLIC_SECONDARY") {
        warnings.push(
          `Area ${areaId} provenance[${pIdx}]: Bentuk data '${dataForm}' (output ChatGPT/LLM) diklasifikasikan sebagai PUBLIC_SECONDARY. Secara metodologis ini adalah RESEARCHER_GENERATED.`
        );
      }
      if ((lowerForm.includes("wawancara") || lowerForm.includes("kuesioner") || lowerForm.includes("survei")) && origin === "PUBLIC_SECONDARY") {
        warnings.push(
          `Area ${areaId} provenance[${pIdx}]: Bentuk data '${dataForm}' diklasifikasikan sebagai PUBLIC_SECONDARY. Seharusnya PRIMARY_RESPONDENT.`
        );
      }
      if (origin === "RESEARCHER_GENERATED" && accessStatus === "INDICATED") {
        warnings.push(
          `Area ${areaId} provenance[${pIdx}]: Data '${dataForm}' (RESEARCHER_GENERATED) memiliki access_status 'INDICATED'. Seharusnya 'NEEDS_CHECKING' kecuali konteks mahasiswa secara eksplisit menyatakan prosedur dan pengumpulan telah diuji.`
        );
      }

      validatedProvenance.push({
        dataForm,
        origin,
        accessStatus,
        methodologicalNote,
      });
    }

    // 6. Research Context validation (Separated categories)
    const rawContext = (typeof area.research_context === "object" && area.research_context !== null ? area.research_context : {}) as Record<string, unknown>;

    const potentialActors = Array.isArray(rawContext.potential_actors)
      ? rawContext.potential_actors.filter((a): a is string => typeof a === "string" && a.trim().length > 0).map((a) => a.trim().slice(0, 100))
      : [];
    const potentialEntities = Array.isArray(rawContext.potential_entities)
      ? rawContext.potential_entities.filter((e): e is string => typeof e === "string" && e.trim().length > 0).map((e) => e.trim().slice(0, 100))
      : [];
    const potentialDocuments = Array.isArray(rawContext.potential_documents)
      ? rawContext.potential_documents.filter((d): d is string => typeof d === "string" && d.trim().length > 0).map((d) => d.trim().slice(0, 100))
      : [];
    const potentialDataArtifacts = Array.isArray(rawContext.potential_data_artifacts)
      ? rawContext.potential_data_artifacts.filter((da): da is string => typeof da === "string" && da.trim().length > 0).map((da) => da.trim().slice(0, 100))
      : [];
    const potentialGeographies = Array.isArray(rawContext.potential_geographies)
      ? rawContext.potential_geographies.filter((g): g is string => typeof g === "string" && g.trim().length > 0).map((g) => g.trim().slice(0, 100))
      : [];

    if (potentialActors.length === 0 && potentialEntities.length === 0) {
      errorDetails.push(`Area ${areaId}: 'research_context' wajib memiliki minimal 1 aktor atau entitas.`);
    }

    // Context Category Heuristic Warnings
    const DOCUMENT_INDICATOR_TERMS = [
      "laporan",
      "surat",
      "edaran",
      "peringatan",
      "dokumen",
      "publikasi",
      "peraturan",
      "regulasi",
      "opini",
      "riset",
      "transparansi",
      "panduan",
      "kebijakan",
      "keputusan",
      "rekomendasi",
      "disclaimer",
      "disclosure",
      "warning",
      "statement",
      "guideline",
      "report",
      "brief",
      "release",
      "buletin",
      "pengumuman",
      "sanksi",
      "berita",
      "artikel",
      "analisis",
      "notulensi",
      "siaran pers",
      "press release",
      "memorandum",
      "prospektus",
      "calk",
      "keterbukaan",
    ];

    const ACTOR_INDICATOR_TERMS = [
      "penyusun",
      "pembuat",
      "pembaca",
      "pengguna",
      "pejabat",
      "staf",
      "komite",
      "dewan",
      "pimpinan",
      "konsumen",
      "nasabah",
      "karyawan",
      "masyarakat",
      "petani",
      "pelaku",
      "manajemen",
      "praktisi",
      "profesional",
    ];

    for (const actor of potentialActors) {
      const lower = actor.toLowerCase();
      const hasActorIndicator = ACTOR_INDICATOR_TERMS.some((term) => lower.includes(term));
      const hasDocIndicator = DOCUMENT_INDICATOR_TERMS.some((term) => lower.includes(term));
      if (!hasActorIndicator && hasDocIndicator && !lower.includes("aktor") && !lower.includes("pihak")) {
        warnings.push(`Area ${areaId} research_context: Dokumen '${actor}' dimasukkan ke kategori Aktor. Seharusnya dimasukkan ke Dokumen.`);
      }
    }

    for (const doc of potentialDocuments) {
      const lower = doc.toLowerCase();
      const hasDocIndicator = DOCUMENT_INDICATOR_TERMS.some((term) => lower.includes(term));
      // Only warn if it does NOT have document indicators AND is clearly an actor
      if (!hasDocIndicator) {
        if (
          lower === "investor" ||
          lower === "analis" ||
          lower === "regulator" ||
          lower === "auditor" ||
          lower === "investor ritel" ||
          lower === "investor institusi" ||
          lower === "analis keuangan" ||
          lower === "analis efek" ||
          lower === "auditor eksternal" ||
          lower === "auditor internal" ||
          ACTOR_INDICATOR_TERMS.some((term) => lower.includes(term))
        ) {
          warnings.push(`Area ${areaId} research_context: Aktor '${doc}' dimasukkan ke kategori Dokumen. Seharusnya dimasukkan ke Aktor.`);
        }
      }
    }

    for (const geo of potentialGeographies) {
      const lower = geo.toLowerCase();
      const isClearlyDataArtifact =
        lower.includes("harga saham") ||
        lower.includes("volume") ||
        lower.includes("return") ||
        lower.includes("rasio") ||
        lower.includes("skor") ||
        lower.includes("indeks") ||
        lower.includes("metrik");
      const hasGeoIndicator =
        lower.includes("indonesia") ||
        lower.includes("jakarta") ||
        lower.includes("asean") ||
        lower.includes("daerah") ||
        lower.includes("provinsi") ||
        lower.includes("kabupaten") ||
        lower.includes("kota") ||
        lower.includes("nasional") ||
        lower.includes("regional") ||
        lower.includes("global") ||
        lower.includes("wilayah") ||
        lower.includes("negara") ||
        lower.includes("jawa") ||
        lower.includes("sumatera") ||
        lower.includes("kalimantan") ||
        lower.includes("sulawesi") ||
        lower.includes("bali") ||
        lower.includes("papua") ||
        lower.includes("lokal") ||
        lower.includes("pasar modal indonesia") ||
        lower.includes("bei") ||
        lower.includes("idx");

      if (isClearlyDataArtifact && !hasGeoIndicator) {
        warnings.push(`Area ${areaId} research_context: Artefak data '${geo}' dimasukkan ke kategori Geografi. Seharusnya dimasukkan ke Artefak Data.`);
      }
    }

    const validatedContext: ResearchContext = {
      potentialActors,
      potentialEntities,
      potentialDocuments,
      potentialDataArtifacts,
      potentialGeographies,
    };

    // 7. Scope Boundary validation (in_scope min 2, out_of_scope min 2, boundary_note non-empty)
    const rawBoundary = (typeof area.scope_boundary === "object" && area.scope_boundary !== null ? area.scope_boundary : {}) as Record<string, unknown>;

    const inScope = Array.isArray(rawBoundary.in_scope)
      ? rawBoundary.in_scope.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 150))
      : [];
    const outOfScope = Array.isArray(rawBoundary.out_of_scope)
      ? rawBoundary.out_of_scope.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 150))
      : [];
    const boundaryNote = typeof rawBoundary.boundary_note === "string" ? rawBoundary.boundary_note.trim() : "";

    if (inScope.length < 2) {
      errorDetails.push(`Area ${areaId}: 'scope_boundary.in_scope' wajib memiliki minimal 2 item.`);
    }
    if (outOfScope.length < 2) {
      errorDetails.push(`Area ${areaId}: 'scope_boundary.out_of_scope' wajib memiliki minimal 2 item.`);
    }
    if (!boundaryNote) {
      errorDetails.push(`Area ${areaId}: 'scope_boundary.boundary_note' tidak boleh kosong.`);
    }

    const validatedBoundary: ScopeBoundary = {
      inScope,
      outOfScope,
      boundaryNote,
    };

    // 8. Phenomenon search brief
    const phenomenonSearchBrief = typeof area.phenomenon_search_brief === "string" ? area.phenomenon_search_brief.trim() : "";
    if (!phenomenonSearchBrief) {
      errorDetails.push(`Area ${areaId}: 'phenomenon_search_brief' tidak boleh kosong.`);
    } else if (countChars(phenomenonSearchBrief) > 600) {
      warnings.push(`Area ${areaId}: 'phenomenon_search_brief' melebihi batas 600 karakter.`);
    }

    // Check experiment procedure in phenomenonSearchBrief
    if (FINAL_TITLE_PATTERNS.some((rx) => rx.test(phenomenonSearchBrief))) {
      warnings.push(
        `${areaId}: 'phenomenon_search_brief' memuat frasa judul/kesimpulan final. Tool ini hanya menghasilkan arah eksplorasi.`
      );
    }

    const briefCausal = filterNegatedCausal(phenomenonSearchBrief, CAUSAL_CLAIM_TERMS);
    if (briefCausal.length > 0) {
      warnings.push(
        `${areaId}: 'phenomenon_search_brief' memuat frasa sebab-akibat (${briefCausal.join(", ")}). Petunjuk ini sebaiknya memandu pemeriksaan kondisi teramati.`
      );
    }

    const briefExpMatch = EXPERIMENT_PROCEDURE_PATTERNS.some((p) => p.test(phenomenonSearchBrief));
    if (briefExpMatch) {
      errorDetails.push(
        `HASIL BELUM AMAN — ${areaId}: 'phenomenon_search_brief' memuat instruksi prosedur eksperimen/pembuatan data baru ('${phenomenonSearchBrief}'). Petunjuk pencarian harus mencari kondisi dunia nyata dari sumber eksternal yang sudah tersedia.`
      );
    }

    // 9. Phenomenon Search Directions validation (purely empirical)
    const rawDirections = Array.isArray(area.phenomenon_search_directions) ? area.phenomenon_search_directions : [];
    if (rawDirections.length < 2) {
      errorDetails.push(`Area ${areaId}: 'phenomenon_search_directions' wajib berisi minimal 2 arah pencarian fenomena empiris.`);
    }

    const validatedDirections: PhenomenonSearchDirectionV3[] = [];
    let literatureContaminationCount = 0;

    for (let dIdx = 0; dIdx < rawDirections.length; dIdx++) {
      const dirItem = rawDirections[dIdx];
      if (typeof dirItem !== "object" || dirItem === null) continue;
      const dObj = dirItem as Record<string, unknown>;

      const label = typeof dObj.label === "string" ? dObj.label.trim() : `Arah ${dIdx + 1}`;

      let directionType: PhenomenonDirectionType = "OTHER_OBSERVABLE";
      const rawDirType = typeof dObj.direction_type === "string" ? dObj.direction_type.trim().toUpperCase() : "";
      if (VALID_PHENOMENON_DIRECTION_TYPES.includes(rawDirType as PhenomenonDirectionType)) {
        directionType = rawDirType as PhenomenonDirectionType;
      }

      const searchQuestion = typeof dObj.search_question === "string" ? dObj.search_question.trim() : "";
      if (!searchQuestion) {
        errorDetails.push(`Area ${areaId} arah[${dIdx}]: 'search_question' tidak boleh kosong.`);
        continue;
      }
      if (countChars(searchQuestion) > 400) {
        warnings.push(`Area ${areaId} arah[${dIdx}]: 'search_question' melebihi batas 400 karakter.`);
      }

      // Check experiment procedure in search_question
      const searchExpMatch = EXPERIMENT_PROCEDURE_PATTERNS.some((p) => p.test(searchQuestion));
      if (searchExpMatch) {
        errorDetails.push(
          `HASIL BELUM AMAN — ${areaId} arah[${dIdx}]: 'search_question' memuat instruksi prosedur eksperimen/pembuatan data baru ('${searchQuestion}'). Arah fenomena tidak boleh meminta mahasiswa menghasilkan output AI, menjalankan prompt, membuat simulasi, melakukan scoring/coding, menyurvei responden, atau membandingkan data yang baru akan dibuat.`
        );
      }

      // R-11: judul/kesimpulan final tidak boleh muncul di arah eksplorasi.
      if (FINAL_TITLE_PATTERNS.some((rx) => rx.test(searchQuestion))) {
        warnings.push(
          `${areaId} arah[${dIdx}]: 'search_question' memuat frasa judul/kesimpulan final. Tool ini hanya menghasilkan arah eksplorasi, bukan judul atau simpulan jadi.`
        );
      }

      // R-17: klaim kausal / klaim ketiadaan bukti tidak boleh hanya tertangkap
      // saat kebetulan ada frasa literatur. Periksa tiap field teks bebas.
      const causalHits = filterNegatedCausal(searchQuestion, CAUSAL_CLAIM_TERMS);
      if (causalHits.length > 0) {
        warnings.push(
          `${areaId} arah[${dIdx}]: 'search_question' memuat frasa sebab-akibat (${causalHits.join(", ")}). Arah pencarian fenomena sebaiknya menanyakan kondisi teramati, bukan hubungan sebab-akibat.`
        );
      }
      if (hasAbsenceClaim(searchQuestion)) {
        warnings.push(
          `${areaId} arah[${dIdx}]: 'search_question' menyatakan ketiadaan penelitian. Hasil pencarian tidak membuktikan penelitian tidak ada.`
        );
      }

      // Check Literature Contamination in Phenomenon Search Direction
      const lowerQ = searchQuestion.toLowerCase();
      const containsLiteratureTerm = LITERATURE_CONTAMINATION_TERMS.some((term) => lowerQ.includes(term));
      if (containsLiteratureTerm) {
        literatureContaminationCount++;
        errorDetails.push(
          `HASIL BELUM AMAN — ${areaId} arah[${dIdx}]: Pertanyaan '${searchQuestion}' menanyakan penelitian terdahulu/literatur/teori/research gap/novelty. Arah fenomena seharusnya hanya memeriksa kondisi empiris nyata yang sudah terdokumentasi.`
        );
      }

      const observableSignals = Array.isArray(dObj.observable_signals)
        ? dObj.observable_signals.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 150))
        : [];
      if (observableSignals.length === 0) {
        errorDetails.push(`Area ${areaId} arah[${dIdx}]: 'observable_signals' wajib memiliki minimal 1 sinyal.`);
      }

      const rawPST = dObj.priority_source_types;
      const prioritySourceTypes: PrioritySourceType[] = [];
      if (!Array.isArray(rawPST) || rawPST.length === 0) {
        errorDetails.push(`Area ${areaId} arah[${dIdx}]: 'priority_source_types' wajib diisi minimal 1 tipe sumber yang valid.`);
      } else {
        for (const st of rawPST) {
          if (typeof st !== "string") {
            errorDetails.push(`Area ${areaId} arah[${dIdx}]: Nilai pada 'priority_source_types' harus berupa string.`);
            continue;
          }
          const upperSt = st.trim().toUpperCase();
          if ((FORBIDDEN_SOURCE_TYPES_AS_PROVENANCE as readonly string[]).includes(upperSt)) {
            errorDetails.push(
              `HASIL BELUM AMAN — ${areaId} menggunakan ${upperSt} sebagai sumber fenomena. Output buatan peneliti boleh dicatat sebagai asal data, tetapi tidak boleh menjadi sumber fenomena yang sudah tersedia.`
            );
          } else if (VALID_SOURCE_TYPES.includes(upperSt as PrioritySourceType)) {
            if (!prioritySourceTypes.includes(upperSt as PrioritySourceType)) {
              prioritySourceTypes.push(upperSt as PrioritySourceType);
            }
          } else {
            errorDetails.push(
              `HASIL BELUM AMAN — ${areaId} arah[${dIdx}]: Tipe sumber '${st}' tidak valid. priority_source_types hanya boleh berisi OFFICIAL_DATA, REGULATION, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE, WORKING_PAPER, atau REPUTABLE_NEWS.`
            );
          }
        }
      }

      validatedDirections.push({
        label,
        directionType,
        searchQuestion,
        observableSignals,
        prioritySourceTypes,
      });
    }

    // If ALL directions are contaminated by literature search -> Block Area
    if (rawDirections.length > 0 && literatureContaminationCount === rawDirections.length) {
      blockedAreaIds.push(areaId);
      errorDetails.push(
        `HASIL BELUM AMAN — ${areaId} (${name}): Seluruh arah pencarian menanyakan penelitian terdahulu/literatur/teori/research gap. Arah fenomena wajib mencari kondisi empiris nyata yang sudah terdokumentasi.`
      );
    }

    // 10. Literature Search Seeds validation
    const rawSeeds = (typeof area.literature_search_seeds === "object" && area.literature_search_seeds !== null
      ? area.literature_search_seeds
      : {}) as Record<string, unknown>;

    const concepts = Array.isArray(rawSeeds.concepts)
      ? rawSeeds.concepts.filter((c): c is string => typeof c === "string" && c.trim().length > 0).map((c) => c.trim().slice(0, 100))
      : [];
    const keywordsId = Array.isArray(rawSeeds.keywords_id)
      ? rawSeeds.keywords_id.filter((k): k is string => typeof k === "string" && k.trim().length > 0).map((k) => k.trim().slice(0, 80))
      : [];
    const keywordsEn = Array.isArray(rawSeeds.keywords_en)
      ? rawSeeds.keywords_en.filter((k): k is string => typeof k === "string" && k.trim().length > 0).map((k) => k.trim().slice(0, 80))
      : [];

    if (concepts.length === 0 && keywordsId.length === 0 && keywordsEn.length === 0) {
      errorDetails.push(`Area ${areaId}: 'literature_search_seeds' wajib memiliki minimal konsep atau kata kunci.`);
    }

    const validatedLiteratureSeeds: LiteratureSearchSeeds = {
      concepts,
      keywordsId,
      keywordsEn,
    };

    // 11. Constraint Fit validation
    const rawConstraint = (typeof area.constraint_fit === "object" && area.constraint_fit !== null
      ? area.constraint_fit
      : {}) as Record<string, unknown>;

    let constraintStatus: "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO" = "PERLU_DIPERIKSA";
    const rawCStatus = typeof rawConstraint.status === "string" ? rawConstraint.status.trim().toUpperCase() : "";
    if (VALID_CONSTRAINT_FIT_STATUSES.includes(rawCStatus as "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO")) {
      constraintStatus = rawCStatus as "SELARAS_SEMENTARA" | "PERLU_DIPERIKSA" | "BERISIKO";
    }

    const constraintReason = typeof rawConstraint.reason === "string" ? rawConstraint.reason.trim() : "";
    const assumptions = Array.isArray(rawConstraint.assumptions)
      ? rawConstraint.assumptions.filter((a): a is string => typeof a === "string" && a.trim().length > 0).map((a) => a.trim().slice(0, 200))
      : [];
    const risks = Array.isArray(rawConstraint.risks)
      ? rawConstraint.risks.filter((r): r is string => typeof r === "string" && r.trim().length > 0).map((r) => r.trim().slice(0, 200))
      : [];

    // Constraint fit heuristic checks
    const hasResearcherGenerated = validatedProvenance.some((p) => p.origin === "RESEARCHER_GENERATED");
    if (hasResearcherGenerated && constraintStatus === "SELARAS_SEMENTARA") {
      warnings.push(
        `Area ${areaId}: Area bergantung pada bukti output ChatGPT/data buatan peneliti (RESEARCHER_GENERATED) namun berstatus 'SELARAS_SEMENTARA'. Keberadaan dokumen publik sebagai input tidak membuat area selaras mandiri; status yang lebih tepat adalah 'PERLU_DIPERIKSA'.`
      );
    }

    // 12. Unresolved items & Not decided
    const unresolvedItems = Array.isArray(area.unresolved_items)
      ? area.unresolved_items.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u) => u.trim().slice(0, 200))
      : [];
    const notDecided = Array.isArray(area.not_decided)
      ? area.not_decided.filter((nd): nd is string => typeof nd === "string" && nd.trim().length > 0).map((nd) => nd.trim().slice(0, 100))
      : [
          "Judul",
          "Variabel",
          "Teori",
          "Metode",
          "Objek final",
          "Sampel",
          "Teknik analisis",
        ];

    // 13. Handoff to Phenomenon validation
    const rawHandoff = (typeof area.handoff_to_phenomenon === "object" && area.handoff_to_phenomenon !== null
      ? area.handoff_to_phenomenon
      : {}) as Record<string, unknown>;

    // Reject if handoff carries literature search seeds or keywords
    if (
      "literature_search_seeds" in rawHandoff ||
      "keywords_id" in rawHandoff ||
      "keywords_en" in rawHandoff ||
      "concepts" in rawHandoff
    ) {
      errorDetails.push(
        `Area ${areaId}: 'handoff_to_phenomenon' memuat field literatur yang tidak diizinkan. Literature search seeds harus dipisahkan dan tidak boleh masuk ke handoff fenomena.`
      );
    }

    const handoffAreaText = typeof rawHandoff.area_text === "string" && rawHandoff.area_text.trim().length > 0 ? rawHandoff.area_text.trim() : name;
    if (countChars(handoffAreaText) > RESEARCH_FIELD_LIMITS.areaHandoffSummary) {
      errorDetails.push(
        `Area ${areaId}: 'handoff_to_phenomenon.area_text' sepanjang ${countChars(handoffAreaText)} karakter melebihi batas ${RESEARCH_FIELD_LIMITS.areaHandoffSummary} karakter yang dibutuhkan oleh langkah berikutnya.`
      );
    }
    const handoffActorText = typeof rawHandoff.actor_text === "string" ? rawHandoff.actor_text.trim() : potentialActors.join(", ");
    const handoffEntityText = typeof rawHandoff.entity_text === "string" ? rawHandoff.entity_text.trim() : potentialEntities.join(", ");
    const handoffDocumentText = typeof rawHandoff.document_text === "string" ? rawHandoff.document_text.trim() : potentialDocuments.join(", ");
    const handoffDataArtifactText = typeof rawHandoff.data_artifact_text === "string" ? rawHandoff.data_artifact_text.trim() : potentialDataArtifacts.join(", ");
    const handoffInitialClue = typeof rawHandoff.initial_clue === "string" && rawHandoff.initial_clue.trim().length > 0 ? rawHandoff.initial_clue.trim() : phenomenonSearchBrief;

    if (countChars(handoffInitialClue) > 600) {
      warnings.push(`Area ${areaId}: 'handoff_to_phenomenon.initial_clue' melebihi batas 600 karakter.`);
    }

    // Check experiment procedure in handoff initial clue
    const clueExpMatch = EXPERIMENT_PROCEDURE_PATTERNS.some((p) => p.test(handoffInitialClue));
    if (clueExpMatch) {
      errorDetails.push(
        `HASIL BELUM AMAN — ${areaId}: 'handoff_to_phenomenon.initial_clue' memuat instruksi prosedur eksperimen/pembuatan data baru ('${handoffInitialClue}'). Petunjuk pencarian harus mencari kondisi dunia nyata dari sumber eksternal yang sudah tersedia.`
      );
    }

    // Check literature contamination in handoff initial clue
    const lowerClue = handoffInitialClue.toLowerCase();
    const clueLitMatch = LITERATURE_CONTAMINATION_TERMS.some((term) => lowerClue.includes(term));
    if (clueLitMatch) {
      errorDetails.push(
        `HASIL BELUM AMAN — ${areaId}: 'handoff_to_phenomenon.initial_clue' menanyakan penelitian terdahulu/literatur/teori/research gap ('${handoffInitialClue}'). Handoff ke Tool Fenomena hanya boleh memuat petunjuk pencarian kondisi empiris nyata.`
      );
    }

    const handoffObservableSignals = Array.isArray(rawHandoff.observable_signals)
      ? rawHandoff.observable_signals.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 150))
      : validatedDirections.flatMap((d) => d.observableSignals).slice(0, 6);

    const handoffInScope = Array.isArray(rawHandoff.in_scope)
      ? rawHandoff.in_scope.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 150))
      : inScope;

    const handoffOutOfScope = Array.isArray(rawHandoff.out_of_scope)
      ? rawHandoff.out_of_scope.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim().slice(0, 150))
      : outOfScope;

    const rawHandoffPST = rawHandoff.priority_source_types;
    const handoffPrioritySourceTypes: PrioritySourceType[] = [];
    if (!Array.isArray(rawHandoffPST) || rawHandoffPST.length === 0) {
      errorDetails.push(`Area ${areaId} handoff_to_phenomenon: 'priority_source_types' wajib diisi minimal 1 tipe sumber valid.`);
    } else {
      for (const st of rawHandoffPST) {
        if (typeof st !== "string") {
          errorDetails.push(`Area ${areaId} handoff_to_phenomenon: Nilai pada 'priority_source_types' harus berupa string.`);
          continue;
        }
        const upperSt = st.trim().toUpperCase();
        if ((FORBIDDEN_SOURCE_TYPES_AS_PROVENANCE as readonly string[]).includes(upperSt)) {
          errorDetails.push(
            `HASIL BELUM AMAN — ${areaId} handoff_to_phenomenon menggunakan ${upperSt} sebagai sumber fenomena. Nilai tersebut adalah kategori asal data, bukan sumber fenomena yang sudah tersedia.`
          );
        } else if (VALID_SOURCE_TYPES.includes(upperSt as PrioritySourceType)) {
          if (!handoffPrioritySourceTypes.includes(upperSt as PrioritySourceType)) {
            handoffPrioritySourceTypes.push(upperSt as PrioritySourceType);
          }
        } else {
          errorDetails.push(
            `HASIL BELUM AMAN — ${areaId} handoff_to_phenomenon: Tipe sumber '${st}' tidak valid. priority_source_types hanya boleh berisi OFFICIAL_DATA, REGULATION, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE, WORKING_PAPER, atau REPUTABLE_NEWS.`
          );
        }
      }
    }

    const validatedHandoff: HandoffToPhenomenonV3 = {
      areaText: handoffAreaText,
      actorText: handoffActorText,
      entityText: handoffEntityText,
      documentText: handoffDocumentText,
      dataArtifactText: handoffDataArtifactText,
      initialClue: handoffInitialClue,
      observableSignals: handoffObservableSignals,
      inScope: handoffInScope,
      outOfScope: handoffOutOfScope,
      prioritySourceTypes: handoffPrioritySourceTypes,
    };

    // 14. Research Shape Preview validation (Backward compatible)
    let validatedPreview: import("@/types/tool").ResearchShapePreview | undefined = undefined;
    if (typeof area.research_shape_preview === "object" && area.research_shape_preview !== null) {
      const rawPreview = area.research_shape_preview as Record<string, unknown>;
      const possibleFocus = typeof rawPreview.possible_focus === "string" ? rawPreview.possible_focus.trim().slice(0, 400) : "";
      const likelyEvidenceNeeded = Array.isArray(rawPreview.likely_evidence_needed)
        ? rawPreview.likely_evidence_needed.filter((e): e is string => typeof e === "string" && e.trim().length > 0).map((e) => e.trim().slice(0, 150))
        : [];
      const rawPattern = typeof rawPreview.illustrative_title_pattern === "string" ? rawPreview.illustrative_title_pattern.trim() : "";
      const unresolvedBeforeTitle = Array.isArray(rawPreview.unresolved_before_title)
        ? rawPreview.unresolved_before_title.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u) => u.trim().slice(0, 150))
        : [
            "Fenomena empiris",
            "Bukti literatur",
            "Akses data",
            "Objek atau cakupan",
            "Kelayakan metodologis",
          ];
      const warning =
        typeof rawPreview.warning === "string" && rawPreview.warning.trim().length > 0
          ? rawPreview.warning.trim()
          : "Ilustrasi bentuk judul — belum layak diajukan ke dosen.";

      // Check placeholder count in illustrative_title_pattern (min 2 placeholders in [...])
      const placeholderMatches = rawPattern.match(/\[[^\]]+\]/g);
      const placeholderCount = placeholderMatches ? placeholderMatches.length : 0;

      const lowerPattern = rawPattern.toLowerCase();
      const locksMethodOrConcrete =
        lowerPattern.includes("regresi") ||
        lowerPattern.includes("linear regression") ||
        lowerPattern.includes("sem-pls") ||
        lowerPattern.includes("kuantitatif deskriptif") ||
        lowerPattern.includes("universitas") ||
        lowerPattern.includes("studi kasus pada") ||
        (lowerPattern.startsWith("pengaruh ") && placeholderCount < 2);

      let isPatternSafe = true;
      if (placeholderCount < 2 || locksMethodOrConcrete) {
        isPatternSafe = false;
        warnings.push(
          `Area ${areaId}: Preview bentuk penelitian belum dapat ditampilkan karena pola yang dihasilkan ('${rawPattern}') terlalu spesifik.`
        );
      }

      if (isPatternSafe && (possibleFocus || rawPattern || likelyEvidenceNeeded.length > 0)) {
        validatedPreview = {
          possibleFocus,
          likelyEvidenceNeeded,
          illustrativeTitlePattern: rawPattern,
          unresolvedBeforeTitle,
          warning,
        };
      }
    }

    // Area Role
    let areaRole: AreaRole | undefined = undefined;
    const rawRole = typeof area.area_role === "string" ? area.area_role.trim().toUpperCase() : "";
    if (rawRole === "CLOSEST_TO_ORIGINAL_INTEREST" || rawRole === "ADJACENT_MORE_FEASIBLE" || rawRole === "CONSTRAINT_SAFE_ALTERNATIVE") {
      areaRole = rawRole;
    } else if (i === 0) {
      areaRole = "CLOSEST_TO_ORIGINAL_INTEREST";
    } else if (i === 1) {
      areaRole = "ADJACENT_MORE_FEASIBLE";
    } else {
      areaRole = "CONSTRAINT_SAFE_ALTERNATIVE";
    }

    // Focus Continuity
    let focusContinuity: FocusContinuity | undefined = undefined;
    if (typeof area.focus_continuity === "object" && area.focus_continuity !== null) {
      const fc = area.focus_continuity as Record<string, unknown>;
      const originalInterestElements = Array.isArray(fc.original_interest_elements)
        ? fc.original_interest_elements.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
        : [];
      const retainedElements = Array.isArray(fc.retained_elements)
        ? fc.retained_elements.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
        : [];
      const shiftedElements = Array.isArray(fc.shifted_elements)
        ? fc.shifted_elements.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
        : [];
      const rawShiftStatus = typeof fc.shift_status === "string" ? fc.shift_status.trim().toUpperCase() : "";
      const shiftStatus = (rawShiftStatus === "SAME_CORE" || rawShiftStatus === "ADJACENT_SHIFT" || rawShiftStatus === "MAJOR_SHIFT")
        ? rawShiftStatus
        : (shiftedElements.length > 0 ? "ADJACENT_SHIFT" : "SAME_CORE");
      const explanation = typeof fc.explanation === "string" ? fc.explanation.trim() : "";

      focusContinuity = {
        originalInterestElements,
        retainedElements,
        shiftedElements,
        shiftStatus,
        explanation,
      };
    }

    // Constraint Fit Assessment
    let constraintFitAssessment: ConstraintFitAssessment | undefined = undefined;
    if (typeof area.constraint_fit_assessment === "object" && area.constraint_fit_assessment !== null) {
      const cfa = area.constraint_fit_assessment as Record<string, unknown>;
      const normFit = (val: unknown): "ALIGNED" | "NEEDS_CHECKING" | "CONFLICT" => {
        const u = typeof val === "string" ? val.trim().toUpperCase() : "";
        return u === "ALIGNED" || u === "CONFLICT" ? u : "NEEDS_CHECKING";
      };
      const dataOriginFit = normFit(cfa.data_origin_fit);
      const fieldworkFit = normFit(cfa.fieldwork_fit);
      const timeFit = normFit(cfa.time_fit);
      const rawOverall = typeof cfa.overall === "string" ? cfa.overall.trim().toUpperCase() : "";
      const overall = (rawOverall === "SELARAS_SEMENTARA" || rawOverall === "BERISIKO") ? rawOverall : "PERLU_DIPERIKSA";
      const reasons = Array.isArray(cfa.reasons)
        ? cfa.reasons.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
        : [];

      constraintFitAssessment = {
        dataOriginFit,
        fieldworkFit,
        timeFit,
        overall,
        reasons,
      };
    }

    validatedAreas.push({
      id: areaId,
      name,
      scopeSummary,
      academicConnection,
      interestConnection,
      dataProvenance: validatedProvenance,
      researchContext: validatedContext,
      scopeBoundary: validatedBoundary,
      phenomenonSearchBrief,
      phenomenonSearchDirections: validatedDirections,
      literatureSearchSeeds: validatedLiteratureSeeds,
      constraintFit: {
        status: constraintStatus,
        reason: constraintReason,
        assumptions,
        risks,
      },
      unresolvedItems,
      notDecided,
      handoffToPhenomenon: validatedHandoff,
      researchShapePreview: validatedPreview,
      areaRole,
      focusContinuity,
      constraintFitAssessment,
    });
  }

  // Validate comparison array
  const rawComparison = Array.isArray(payload.comparison) ? payload.comparison : [];
  const validatedComparison: ExplorationComparisonV3[] = [];

  for (let cIdx = 0; cIdx < rawComparison.length; cIdx++) {
    const compItem = rawComparison[cIdx];
    if (typeof compItem !== "object" || compItem === null) continue;
    const cObj = compItem as Record<string, unknown>;

    const areaId = typeof cObj.area_id === "string" ? cObj.area_id.trim() : "";
    if (!areaId || !seenAreaIds.has(areaId)) {
      continue;
    }

    const interestFit = typeof cObj.interest_fit === "string" && VALID_INTEREST_FIT.includes(cObj.interest_fit.toUpperCase() as typeof VALID_INTEREST_FIT[number])
      ? (cObj.interest_fit.toUpperCase() as typeof VALID_INTEREST_FIT[number])
      : "CUKUP_DEKAT";

    const studyProgramFit = typeof cObj.study_program_fit === "string" && VALID_STUDY_PROGRAM_FIT.includes(cObj.study_program_fit.toUpperCase() as typeof VALID_STUDY_PROGRAM_FIT[number])
      ? (cObj.study_program_fit.toUpperCase() as typeof VALID_STUDY_PROGRAM_FIT[number])
      : "SEDANG";

    const dataFit = typeof cObj.data_fit === "string" && VALID_DATA_FIT.includes(cObj.data_fit.toUpperCase() as typeof VALID_DATA_FIT[number])
      ? (cObj.data_fit.toUpperCase() as typeof VALID_DATA_FIT[number])
      : "SELARAS_SEMENTARA";

    const collectionBurden = typeof cObj.collection_burden === "string" && VALID_COLLECTION_BURDEN.includes(cObj.collection_burden.toUpperCase() as typeof VALID_COLLECTION_BURDEN[number])
      ? (cObj.collection_burden.toUpperCase() as typeof VALID_COLLECTION_BURDEN[number])
      : "SEDANG";

    const methodologicalUncertainty = typeof cObj.methodological_uncertainty === "string" && VALID_METHODOLOGICAL_UNCERTAINTY.includes(cObj.methodological_uncertainty.toUpperCase() as typeof VALID_METHODOLOGICAL_UNCERTAINTY[number])
      ? (cObj.methodological_uncertainty.toUpperCase() as typeof VALID_METHODOLOGICAL_UNCERTAINTY[number])
      : "SEDANG";

    const mainCheckNext = typeof cObj.main_check_next === "string" ? cObj.main_check_next.trim() : "";

    validatedComparison.push({
      areaId,
      interestFit,
      studyProgramFit,
      dataFit,
      collectionBurden,
      methodologicalUncertainty,
      mainCheckNext,
    });
  }

  // Selection guidance
  const selectionGuidance = Array.isArray(payload.selection_guidance)
    ? payload.selection_guidance.filter((g): g is string => typeof g === "string" && g.trim().length > 0).map((g) => g.trim())
    : [];

  if (errorDetails.length > 0) {
    return {
      success: false,
      status: "HASIL_TIDAK_DIKENALI",
      error: "Data transfer Cari Ide tidak lolos validasi skema V3.",
      errorDetails,
      warnings,
      blockedAreaIds,
    };
  }

  const status: IdeaValidationStatus =
    warnings.length > 0 ? "HASIL_PERLU_DIPERIKSA" : "HASIL_VALID";

  const resultData: SkriflowIdeaResultV3 = {
    schemaVersion: 3,
    areas: validatedAreas,
    comparison: validatedComparison,
    selectionGuidance,
    rawResponse: rawText,
    sourceInputFingerprint,
    importedAt: new Date().toISOString(),
  };
  resultData.payloadFingerprint = computePayloadFingerprint(resultData);

  return {
    success: true,
    status,
    errorDetails: [],
    warnings,
    data: resultData,
    blockedAreaIds,
  };
}

/**
 * Generates copyable prompt for student to ask ChatGPT/Gemini to fix formatting issues for Tool 1 (V3).
 */
export function generateFixIdeaFormatPrompt(): string {
  return `Tolong keluarkan ulang seluruh hasil ide area eksplorasi yang sudah kamu buat sebelumnya ke dalam format blok data transfer JSON SKRIFLOW_IDEA_V3 berikut secara persis tanpa teks, tabel, atau penjelasan di luar marker:

=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Nama Area Eksplorasi 1 (bukan judul skripsi, maks 120 karakter)",
      "scope_summary": "Cakupan area eksplorasi secara ringkas (maks 700 karakter)",
      "academic_connection": "Keterkaitan area dengan program studi mahasiswa (maks 500 karakter)",
      "interest_connection": "Hubungan area dengan minat mahasiswa (maks 500 karakter)",
      "data_provenance": [
        {
          "data_form": "Laporan keuangan tahunan BEI",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Tersedia di keterbukaan informasi IDX (maks 350 karakter)"
        },
        {
          "data_form": "Output prompt ChatGPT untuk analisis laporan",
          "origin": "RESEARCHER_GENERATED",
          "access_status": "NEEDS_CHECKING",
          "methodological_note": "Dibuat oleh peneliti melalui prosedur prompt terstandar (maks 350 karakter)"
        }
      ],
      "research_context": {
        "potential_actors": ["Investor ritel", "Analis keuangan"],
        "potential_entities": ["Perusahaan sektor perbankan terdaftar di BEI"],
        "potential_documents": ["Laporan tahunan", "Keterbukaan informasi"],
        "potential_data_artifacts": ["Harga saham penutupan harian", "Output ringkasan ChatGPT"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["Perusahaan publik di BEI", "Periode 2021–2023"],
        "out_of_scope": ["Pasar kripto", "Perusahaan non-publik"],
        "boundary_note": "Fokus pada pelaporan keuangan publik pasar modal Indonesia"
      },
      "phenomenon_search_brief": "Petunjuk arah pemeriksaan fenomena awal dari sumber eksternal",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "ADOPTION",
          "search_question": "Bagaimana tren adopsi teknologi AI generatif dalam analisis laporan keuangan emiten di BEI yang dilaporkan oleh lembaga atau media kredibel?",
          "observable_signals": ["Publikasi laporan pengungkapan teknologi", "Statistik adopsi OJK/BEI"],
          "priority_source_types": ["OFFICIAL_DATA", "INSTITUTIONAL_REPORT"]
        },
        {
          "label": "Arah 2",
          "direction_type": "DISCREPANCY",
          "search_question": "Apakah laporan empiris atau publikasi institusional mendokumentasikan perbedaan akurasi ringkasan laporan keuangan antara output AI dan laporan analis resmi?",
          "observable_signals": ["Koreksi publikasi laporan", "Laporan evaluasi empiris"],
          "priority_source_types": ["INSTITUTIONAL_REPORT", "EMPIRICAL_ARTICLE"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Financial disclosure quality", "Generative AI in financial reporting"],
        "keywords_id": ["pengungkapan laporan keuangan", "kecerdasan buatan pasar modal"],
        "keywords_en": ["financial reporting AI", "disclosure transparency stock market"]
      },
      "research_shape_preview": {
        "possible_focus": "Pemeriksaan keandalan dan anomali ringkasan pengungkapan keuangan emiten yang dihasilkan oleh alat bantu AI generatif.",
        "likely_evidence_needed": [
          "Dokumentasi publikasi evaluasi AI pasar modal",
          "Keterbukaan informasi dan CALK emiten BEI",
          "Laporan berkala analis sekuritas"
        ],
        "illustrative_title_pattern": "Evaluasi [keandalan ringkasan pengungkapan finansial AI] dalam [konteks pasar modal] pada [emiten sektor dan periode yang belum ditentukan].",
        "unresolved_before_title": [
          "Fenomena empiris",
          "Bukti literatur",
          "Akses data",
          "Objek atau cakupan",
          "Kelayakan metodologis"
        ],
        "warning": "Ilustrasi bentuk judul — belum layak diajukan ke dosen."
      },
      "constraint_fit": {
        "status": "PERLU_DIPERIKSA",
        "reason": "Bukti utama memerlukan keluaran prompt LLM buatan peneliti (RESEARCHER_GENERATED) sehingga memerlukan pengujian prosedur prompt dan keterulangan.",
        "assumptions": ["Data sekunder IDX dapat diakses publik"],
        "risks": ["Variasi performa versi model AI"]
      },
      "unresolved_items": ["Ketersediaan data historis laporan pengungkapan"],
      "not_decided": [
        "Judul",
        "Variabel",
        "Teori",
        "Metode",
        "Objek final",
        "Sampel",
        "Teknik analisis"
      ],
      "handoff_to_phenomenon": {
        "area_text": "Nama Area Eksplorasi 1",
        "actor_text": "Investor ritel, Analis keuangan",
        "entity_text": "Perusahaan sektor perbankan terdaftar di BEI",
        "document_text": "Laporan tahunan, Keterbukaan informasi",
        "data_artifact_text": "Harga saham penutupan harian, Output ringkasan ChatGPT",
        "initial_clue": "Periksa apakah sumber eksternal melaporkan adopsi AI atau anomali akurasi ringkasan pengungkapan finansial.",
        "observable_signals": ["Publikasi laporan pengungkapan teknologi", "Statistik adopsi OJK/BEI"],
        "in_scope": ["Perusahaan publik di BEI", "Periode 2021–2023"],
        "out_of_scope": ["Pasar kripto", "Perusahaan non-publik"],
        "priority_source_types": ["OFFICIAL_DATA", "INSTITUTIONAL_REPORT"]
      }
    },
    {
      "id": "A02",
      "name": "Nama Area Eksplorasi 2 (bukan judul skripsi)",
      "scope_summary": "Cakupan area eksplorasi 2",
      "academic_connection": "Keterkaitan prodi",
      "interest_connection": "Hubungan minat",
      "data_provenance": [
        {
          "data_form": "Publikasi statistik resmi OJK",
          "origin": "INSTITUTIONAL_METADATA",
          "access_status": "INDICATED",
          "methodological_note": "Tersedia di portal statistik OJK"
        }
      ],
      "research_context": {
        "potential_actors": ["Regulator", "Auditor eksternal"],
        "potential_entities": ["Kantor Akuntan Publik"],
        "potential_documents": ["Surat edaran regulasi", "Laporan transparansi KAP"],
        "potential_data_artifacts": ["Tingkat kepatuhan regulasi"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["KAP terdaftar di OJK", "Regulasi audit berbasis TI"],
        "out_of_scope": ["KAP luar negeri", "Auditor internal non-KAP"],
        "boundary_note": "Fokus pada kepatuhan KAP terhadap regulasi audit berbasis teknologi di Indonesia"
      },
      "phenomenon_search_brief": "Petunjuk arah fenomena regulasi",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "REGULATION",
          "search_question": "Bagaimana perkembangan regulasi IAPI dan OJK terkait penggunaan software otomasi audit?",
          "observable_signals": ["Surat edaran IAPI", "Peraturan OJK terbaru"],
          "priority_source_types": ["REGULATION", "OFFICIAL_DATA"]
        },
        {
          "label": "Arah 2",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Seberapa luas KAP skala menengah menerapkan otomasi dalam kertas kerja audit berdasarkan survei atau laporan transparansi?",
          "observable_signals": ["Laporan survei IAPI", "Publikasi transparansi KAP"],
          "priority_source_types": ["INSTITUTIONAL_REPORT", "EMPIRICAL_ARTICLE"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Audit automation adoption", "Regulatory compliance in auditing"],
        "keywords_id": ["otomasi audit", "kepatuhan regulasi KAP"],
        "keywords_en": ["audit automation", "auditor regulatory compliance"]
      },
      "research_shape_preview": {
        "possible_focus": "Pola kepatuhan dan respon KAP terhadap regulasi adopsi software audit berbasis teknologi.",
        "likely_evidence_needed": [
          "Surat edaran dan publikasi regulasi IAPI/OJK",
          "Laporan transparansi tahunan KAP",
          "Kertas kerja atau survei kepatuhan profesi"
        ],
        "illustrative_title_pattern": "Analisis [pola respon regulasi otomasi audit] pada [KAP terdaftar] untuk [wilayah dan periode yang belum ditentukan].",
        "unresolved_before_title": [
          "Fenomena empiris",
          "Bukti literatur",
          "Akses data",
          "Objek atau cakupan",
          "Kelayakan metodologis"
        ],
        "warning": "Ilustrasi bentuk judul — belum layak diajukan ke dosen."
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Regulasi dan laporan transparansi tersedia publik tanpa memerlukan data buatan mahasiswa atau responden.",
        "assumptions": ["Dokumen regulasi dan transparansi dapat diunduh bebas"],
        "risks": ["Jumlah KAP yang mempublikasikan laporan transparansi terbatas"]
      },
      "unresolved_items": ["Daftar KAP yang aktif menggunakan tools otomasi"],
      "not_decided": [
        "Judul",
        "Variabel",
        "Teori",
        "Metode",
        "Objek final",
        "Sampel",
        "Teknik analisis"
      ],
      "handoff_to_phenomenon": {
        "area_text": "Nama Area Eksplorasi 2",
        "actor_text": "Regulator, Auditor eksternal",
        "entity_text": "Kantor Akuntan Publik",
        "document_text": "Surat edaran regulasi, Laporan transparansi KAP",
        "data_artifact_text": "Tingkat kepatuhan regulasi",
        "initial_clue": "Periksa perkembangan surat edaran OJK/IAPI mengenai pedoman penggunaan tools otomasi audit.",
        "observable_signals": ["Surat edaran IAPI", "Peraturan OJK terbaru"],
        "in_scope": ["KAP terdaftar di OJK", "Regulasi audit berbasis TI"],
        "out_of_scope": ["KAP luar negeri", "Auditor internal non-KAP"],
        "priority_source_types": ["REGULATION", "OFFICIAL_DATA"]
      }
    }
  ],
  "comparison": [
    {
      "area_id": "A01",
      "interest_fit": "SANGAT_DEKAT",
      "study_program_fit": "KUAT",
      "data_fit": "PERLU_DIPERIKSA",
      "collection_burden": "SEDANG",
      "methodological_uncertainty": "SEDANG",
      "main_check_next": "Periksa ketersediaan data keterbukaan informasi di BEI dan stabilitas prompt"
    },
    {
      "area_id": "A02",
      "interest_fit": "DEKAT",
      "study_program_fit": "KUAT",
      "data_fit": "SELARAS_SEMENTARA",
      "collection_burden": "RENDAH_SEMENTARA",
      "methodological_uncertainty": "RENDAH",
      "main_check_next": "Periksa publikasi regulasi IAPI dan transparansi KAP"
    }
  ],
  "selection_guidance": [
    "Pilih A01 jika ingin mendalami analisis data emiten pasar modal.",
    "Pilih A02 jika ingin fokus pada kepatuhan regulasi profesi akuntansi."
  ]
}
=== END SKRIFLOW_IDEA_V3 ===

Aturan penting:
1. Keluarkan TEPAT satu blok transfer di atas tanpa teks naratif sebelum atau sesudah marker.
2. Pastikan JSON valid (double quote, tanpa trailing comma, tanpa Markdown code fence).
3. Tepat 2–4 area eksplorasi dengan ID unik (A01, A02, dst).
4. Output ChatGPT buatan mahasiswa wajib diklasifikasikan sebagai 'RESEARCHER_GENERATED' dengan status akses 'NEEDS_CHECKING'.
5. priority_source_types HANYA boleh berisi: OFFICIAL_DATA, REGULATION, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE, WORKING_PAPER, REPUTABLE_NEWS.
6. 'phenomenon_search_directions' dan 'initial_clue' hanya boleh berisi pertanyaan/petunjuk fenomena empiris teramati dari sumber eksternal yang sudah tersedia. Jangan menanyakan literatur, teori, jurnal, atau research gap. Dilarang meminta mahasiswa menjalankan prompt, membuat output, menyebar survei, atau melakukan eksperimen baru.
7. 'literature_search_seeds' memuat konsep dan kata kunci pencarian literatur untuk tahapan berikutnya. Jangan masukkan 'literature_search_seeds' ke dalam 'handoff_to_phenomenon'.
8. 'research_shape_preview' wajib memiliki illustrative_title_pattern dengan minimal 2 placeholder '[...]'. Dilarang membuat judul konkret atau mengunci metode/variabel.
9. 'scope_boundary' wajib memiliki minimal 2 item in_scope, 2 item out_of_scope, dan boundary_note yang jelas.`;
}

/**
 * Generates targeted prompt to repair fields that exceeded downstream character limits.
 * Does not mutate unaffected fields, academic substance, or make auto-selections.
 */
export function generateIdeaLengthRepairPrompt(
  violations: Array<{ field: string; actualLength: number; allowedLength: number }> = []
): string {
  const violationBullets = violations.length > 0
    ? violations.map((v) => `- ${v.field}: ${v.actualLength} karakter (maksimal ${v.allowedLength} karakter)`).join("\n")
    : `- handoff_to_phenomenon.area_text: maksimal ${RESEARCH_FIELD_LIMITS.areaHandoffSummary} karakter`;

  return `Perbaiki HANYA panjang karakter field yang melanggar batas berikut agar sesuai dengan kebutuhan form langkah berikutnya:

[FIELD MELEBIHI BATAS]
${violationBullets}

[INSTRUKSI PERBAIKAN]
1. Ringkas HANYA field yang disebutkan di atas agar panjangnya berada di bawah batas maksimal.
2. Jangan mengubah field lain yang sudah sesuai format.
3. Jangan mengubah id, nama, atau substansi akademik area.
4. Jangan memilih satu area secara otomatis.
5. Pertahankan seluruh informasi kunci dalam batas karakter yang ditentukan.
6. Keluarkan kembali blok utuh === BEGIN SKRIFLOW_IDEA_V3 === ... === END SKRIFLOW_IDEA_V3 ===.`;
}

export const parseIdeaTransferV3 = parseIdeaTransfer;
