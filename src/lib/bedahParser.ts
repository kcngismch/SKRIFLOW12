import {
  BedahTransferPayload,
  LiteraturePackageValidationResult,
  ResearchGapType,
  ResearchGapStrength,
  DirectionFitRating,
  BedahInputStatus,
  SelectedPhenomenon,
  DirectionV2,
  Bab1FoundationV1,
  DataVerificationQuestionV2,
  FeasibilityAnswerStatus,
  DataReadinessOutcome,
  ResearchGapTypeV2,
  ResearchGapStrengthV2,
  ComparabilityRating,
  DirectionReadinessV2,
  InputAuditStatusV2,
  CandidateGapStatus,
  DirectionConditionalBadge,
  SourceWeight,
  PhenomenonBasisStatus,
  CandidateGapV2,
  SourceIdentityAuditStatus,
  JENIS_SITUS_DATA,
  type JenisSitusData,
} from "@/types/tool";
import { normalizeEvidenceUrl } from "@/lib/phenomenonParser";
import {
  auditFreeTextContent,
  auditClaimBoundaryList,
  auditSourceEntry,
  auditSourceRegister,
  auditGapValidity,
  auditSourceIdentity,
  mergeContentAudit,
  type ContentAuditFinding,
  type SourceIdentityAuditInput,
} from "@/lib/academicGates";

// --- V1 Enum sets (Backward compatibility) ---
export const VALID_GAP_TYPES: ResearchGapType[] = [
  "EMPIRICAL",
  "CONTEXTUAL",
  "MEASUREMENT",
  "DATA",
  "METHODOLOGICAL",
  "THEORETICAL",
];

export const VALID_GAP_STRENGTHS: ResearchGapStrength[] = [
  "TERDUKUNG_KUAT",
  "TERDUKUNG_SEMENTARA",
  "PERLU_SUMBER_TAMBAHAN",
  "TIDAK_CUKUP",
];

export const VALID_FIT_RATINGS: DirectionFitRating[] = [
  "KUAT",
  "SEDANG",
  "LEMAH",
  "PERLU_DIPERIKSA",
];

export const VALID_INPUT_STATUSES: BedahInputStatus[] = [
  "BUKTI_CUKUP_UNTUK_DIBEDAH",
  "BUKTI_TERBATAS",
  "SUMBER_PERLU_DITAMBAH",
  "FENOMENA_DAN_LITERATUR_TIDAK_SELARAS",
];

// --- V2 Enum sets ---
export const VALID_INPUT_AUDIT_STATUSES_V2: InputAuditStatusV2[] = [
  "BUKTI_TIDAK_CUKUP",
  "CUKUP_UNTUK_EKSPLORASI",
  "CUKUP_UNTUK_ARAH",
];

export const VALID_COMPARABILITY_RATINGS: ComparabilityRating[] = [
  "SEBANDING",
  "SEBANDING_SEBAGIAN",
  "TIDAK_SEBANDING",
];

export const VALID_GAP_TYPES_V2: ResearchGapTypeV2[] = [
  "EMPIRICAL_INCONSISTENCY",
  "MEASUREMENT",
  "CONTEXTUAL_BOUNDARY",
  "TEMPORAL_OR_REGULATORY",
  "METHODOLOGICAL_LIMITATION",
  "EVIDENCE_COVERAGE",
];

export const VALID_GAP_STRENGTHS_V2: ResearchGapStrengthV2[] = [
  "DIDUKUNG_DALAM_PAKET",
  "TERDUKUNG_SEMENTARA",
  "PERLU_SUMBER_TAMBAHAN",
  "TIDAK_DAPAT_DIBANDINGKAN",
  "TIDAK_DIDUKUNG",
];

export const VALID_DIRECTION_READINESS_V2: DirectionReadinessV2[] = [
  "LAYAK_DIPERIKSA",
  "PERLU_SUMBER_TAMBAHAN",
  "RISIKO_TINGGI",
  "JANGAN_DIBAWA",
];

export const VALID_GAP_STATUSES_V2: CandidateGapStatus[] = [
  "TERINDIKASI",
  "PERLU_VERIFIKASI",
  "CUKUP_DIDUKUNG",
];

export const VALID_SOURCE_WEIGHTS: SourceWeight[] = [
  "UTAMA",
  "PENDUKUNG",
  "PERLU_DIPERIKSA",
];

export const VALID_CONDITIONAL_BADGES: DirectionConditionalBadge[] = [
  "Paling Dekat dengan Fenomena",
  "Lebih Aman untuk Tenggat",
  "Data Perlu Dicek",
  "Perlu Fokus Lebih Sempit",
  "Bukti Literatur Masih Terbatas",
];

/**
 * Tolerantly validates the pasted Literature Evidence Package from NotebookLM.
 */
export function validateLiteratureEvidencePackage(
  rawText: string
): LiteraturePackageValidationResult {
  const missingParts: string[] = [];

  if (!rawText || rawText.trim().length === 0) {
    return {
      status: "PAKET_TIDAK_DIKENALI",
      hasKonteks: false,
      hasStatusSumber: false,
      hasSourceRegister: false,
      hasIntiSource: false,
      hasMatriksBukti: false,
      hasEvidence: false,
      hasStopSentence: false,
      isPromptAOutput: false,
      isResearchReport: false,
      missingParts: ["Teks paket bukti masih kosong"],
      notes: ["Tempelkan output Prompt B dari NotebookLM."],
    };
  }

  const text = rawText.trim();
  const upper = text.toUpperCase();

  // 1. Detect if user erroneously pasted Prompt A output (Search / Import Cards)
  const isPromptAOutput =
    upper.includes("SOURCE IMPORT CARDS") ||
    upper.includes("SOURCEIMPORTCARD") ||
    upper.includes("A2UI-JSON") ||
    upper.includes("OUTPUT PROMPT A") ||
    upper.includes("OUPUT PROMPT A") ||
    upper.includes("AUTO-IMPORT") ||
    (upper.includes("[PERAN]") && upper.includes("MENGUMPULKAN SUMBER AKADEMIK") && !upper.includes("MATRIKS BUKTI"));

  if (isPromptAOutput) {
    return {
      status: "PAKET_TIDAK_DIKENALI",
      hasKonteks: false,
      hasStatusSumber: false,
      hasSourceRegister: false,
      hasIntiSource: false,
      hasMatriksBukti: false,
      hasEvidence: false,
      hasStopSentence: false,
      isPromptAOutput: true,
      isResearchReport: false,
      missingParts: ["Teks yang ditempel merupakan output Prompt A (Pencarian/Impor Sumber)"],
      notes: [
        "Jalankan Prompt B di NotebookLM terlebih dahulu untuk mengekstrak Paket Bukti Literatur, lalu tempel hasilnya ke sini.",
      ],
    };
  }

  // 2. Tolerant section matching
  const hasKonteks =
    upper.includes("A. KONTEKS") ||
    upper.includes("A.KONTEKS") ||
    upper.includes("### A. KONTEKS") ||
    upper.includes("#### A. KONTEKS") ||
    (upper.includes("KONTEKS") && (upper.includes("PRODI") || upper.includes("PROGRAM STUDI")));

  const hasStatusSumber =
    upper.includes("B. STATUS SUMBER") ||
    upper.includes("B.STATUS SUMBER") ||
    upper.includes("STATUS SUMBER") ||
    upper.includes("TOTAL NOTEBOOK") ||
    // NotebookLM lazim memakai heading bernomor, bukan huruf bagian.
    upper.includes("REKONSILIASI SUMBER") ||
    upper.includes("JUMLAH SUMBER") ||
    upper.includes("TOTAL SUMBER");

  const hasSourceRegister =
    upper.includes("C. SOURCE REGISTER") ||
    upper.includes("C.SOURCE REGISTER") ||
    upper.includes("SOURCE REGISTER") ||
    upper.includes("DAFTAR SUMBER") ||
    upper.includes("REGISTER SUMBER");

  const hasIntiSource =
    upper.includes("INTI") ||
    upper.includes("PRIMARY") ||
    upper.includes("CORE");

  const hasMatriksBukti =
    upper.includes("D. MATRIKS BUKTI") ||
    upper.includes("D.MATRIKS BUKTI") ||
    upper.includes("MATRIKS BUKTI") ||
    upper.includes("EVIDENCE MATRIX") ||
    /\|\s*B0?1\s*\|/i.test(text) ||
    /B0?1\s*[:|]/i.test(text);

  const hasEvidence =
    /B0?1/i.test(text) ||
    upper.includes("KLAIM NETRAL") ||
    upper.includes("BATAS PENGGUNAAN") ||
    upper.includes("TEMUAN");

  const hasStopSentence =
    upper.includes("STOP") ||
    upper.includes("PAKET INI HANYA MEMETAKAN BUKTI") ||
    upper.includes("BELUM DITETAPKAN RESEARCH GAP") ||
    upper.includes("PENUTUP") ||
    upper.includes("CATATAN PENUTUP");

  // Syarat keras: daftar sumber, matriks bukti, dan baris bukti nyata. Inilah
  // yang menentukan paket bisa dipakai sebagai dasar analisis.
  const hardMissing: string[] = [];
  if (!hasSourceRegister) hardMissing.push("Source Register (Bagian C)");
  if (!hasMatriksBukti) hardMissing.push("Matriks Bukti (Bagian D)");
  if (!hasEvidence) hardMissing.push("Baris Bukti Matriks (minimal 1 bukti)");

  // Bagian pendukung: ketiadaannya dicatat sebagai saran, bukan penghalang.
  // NotebookLM sering memakai heading sendiri ("1. REKONSILIASI SUMBER NOTEBOOK")
  // sehingga bagian A/B tidak terdeteksi walau paketnya utuh. Menolak paket utuh
  // karena perbedaan judul bagian justru menyesatkan mahasiswa.
  const softMissing: string[] = [];
  if (!hasKonteks) softMissing.push("Konteks penelitian (Bagian A)");
  if (!hasStatusSumber) softMissing.push("Rekap status sumber (Bagian B)");
  if (!hasIntiSource) softMissing.push("Penanda sumber inti (INTI/PRIMARY)");
  if (!hasStopSentence) softMissing.push("Penutup paket (Bagian E)");

  missingParts.push(...hardMissing);

  // Status decision
  if (hardMissing.length > 0) {
    return {
      status: "PAKET_TIDAK_DIKENALI",
      hasKonteks,
      hasStatusSumber,
      hasSourceRegister,
      hasIntiSource,
      hasMatriksBukti,
      hasEvidence,
      hasStopSentence,
      isPromptAOutput: false,
      isResearchReport: false,
      missingParts,
      notes: [
        "Pastikan kamu menempel seluruh output Prompt B dari NotebookLM yang memuat tabel Source Register dan Matriks Bukti.",
      ],
    };
  }

  if (missingParts.length > 0) {
    return {
      status: "STRUKTUR_PERLU_DIPERIKSA",
      hasKonteks,
      hasStatusSumber,
      hasSourceRegister,
      hasIntiSource,
      hasMatriksBukti,
      hasEvidence,
      hasStopSentence,
      isPromptAOutput: false,
      isResearchReport: false,
      missingParts,
      notes: [
        `Beberapa bagian pendukung tidak terdeteksi: ${missingParts.join(", ")}. Pastikan teks output utuh sebelum lanjut.`,
      ],
    };
  }

  // Identitas sumber yang tidak bisa dipertanggungjawabkan.
  // Kasus nyata (audit 16 Sep 2026): NotebookLM mengimpor Laporan Deep Research-nya
  // sendiri sebagai sumber, lalu Prompt B memberinya kategori INTI dengan penulis
  // "Anonim / N.A." dan tautan "-". Prompt sudah melarangnya, tetapi prompt bukan
  // penegak — jadi diperiksa di sini. Dihitung sebelum keputusan status supaya
  // temuan ini ikut terpakai di semua jalur keluar, bukan cuma jalur terakhir.
  const sumber = auditSumberPaketLiteratur(text);
  // ponytail: app tak punya akses ke NotebookLM, jadi jumlah sumber asli di notebook
  // tak bisa dibaca langsung. Yang bisa dilakukan: bandingkan angka rekap AI dengan
  // entri register yang benar-benar ditulis, lalu minta mahasiswa mencocokkan sisanya.
  const catatanSumber: string[] = [];
  if (sumber.anonim.length > 0) {
    catatanSumber.push(
      `${sumber.anonim.length} sumber tanpa penulis yang jelas (${sumber.anonim.join(", ")}). ` +
        `Ciri paling sering: sumber itu sebenarnya laporan riset buatan AI, bukan artikel akademik. ` +
        `Buka kembali notebook, keluarkan sumber tersebut, lalu jalankan ulang Prompt B.`
    );
  }
  if (sumber.penulisTakTerbaca.length > 0) {
    catatanSumber.push(
      `${sumber.penulisTakTerbaca.length} sumber tidak memuat nama penulis pada daftar ini ` +
        `(${sumber.penulisTakTerbaca.join(", ")}). Bisa jadi kolomnya tidak ikut tersalin — ` +
        `cek langsung di notebook sebelum menyimpulkan apa pun.`
    );
  }
  if (sumber.tanpaTautan.length > 0) {
    catatanSumber.push(
      `${sumber.tanpaTautan.length} sumber tanpa tautan maupun DOI (${sumber.tanpaTautan.join(", ")}) — ` +
        `pembaca tidak bisa menelusuri aslinya.`
    );
  }
  if (sumber.totalNotebook !== undefined && sumber.totalNotebook !== sumber.registerCount) {
    catatanSumber.push(
      `AI menulis TOTAL NOTEBOOK ${sumber.totalNotebook}, tetapi Source Register hanya memuat ` +
        `${sumber.registerCount} entri. Sebagian sumber di notebook tidak ikut terpetakan — ` +
        `periksa kembali notebook sebelum memakai paket ini.`
    );
  } else if (sumber.registerCount > 0) {
    catatanSumber.push(
      `Cocokkan sendiri: buka notebook, hitung jumlah sumber di panel Sources, lalu bandingkan ` +
        `dengan ${sumber.registerCount} entri di register ini. Selisih berarti Prompt B tidak membaca semua sumber.`
    );
  }

  // Bagian C/D ada judulnya tetapi tidak ada isinya -> tetap perlu diperiksa.
  // Sebaliknya, paket dengan isi nyata tidak ditolak hanya karena bagian
  // pendukung memakai judul berbeda.
  if (softMissing.length > 0 && hardMissing.length === 0) {
    const content3 = auditLiteraturePackageContent(text);
    if (content3.missing.length === 0) {
      return {
        status: "STRUKTUR_LENGKAP",
        hasKonteks,
        hasStatusSumber,
        hasSourceRegister,
        hasIntiSource,
        hasMatriksBukti,
        hasEvidence,
        hasStopSentence,
        isPromptAOutput: false,
        // Tidak diisi dari temuan anonim: nama field ini berarti "paketnya laporan
        // riset AI", sedangkan yang bisa diperiksa cuma "ada sumber tanpa penulis".
        // Dua hal itu tidak sama, dan tidak ada konsumen yang membacanya.
        isResearchReport: false,
        missingParts: [],
        notes: [
          `Paket Bukti Literatur memuat ${content3.sourceCount} entri sumber dan ${content3.evidenceRowCount} baris bukti. Bagian inti lengkap.`,
          `Bagian pendukung tidak terdeteksi: ${softMissing.join(", ")}. Paket tetap bisa dipakai, tetapi lengkapi bila tersedia.`,
          ...catatanSumber,
          "Catatan: pemeriksaan ini menilai kelengkapan bentuk dan identitas sumber, bukan kebenaran isinya. Bukti tetap perlu ditelusuri sendiri.",
        ],
      };
    }
  }

  // 3. Pemeriksaan ISI (bukan hanya keberadaan judul bagian).
  // Keberadaan header "C. SOURCE REGISTER" tidak membuktikan ada sumber nyata di
  // dalamnya: teks sampah yang memuat kata kunci pun lolos. Periksa entri nyata.
  const content = auditLiteraturePackageContent(text);
  if (content.missing.length > 0) {
    return {
      status: "STRUKTUR_PERLU_DIPERIKSA",
      hasKonteks,
      hasStatusSumber,
      hasSourceRegister,
      hasIntiSource,
      hasMatriksBukti,
      hasEvidence,
      hasStopSentence,
      isPromptAOutput: false,
      isResearchReport: false,
      missingParts: content.missing,
      notes: [
        `Judul bagian lengkap, tetapi isinya belum memenuhi syarat: ${content.missing.join(", ")}. Paket ini belum bisa dipakai sebagai dasar analisis.`,
        // Jalur ini masih bisa lanjut ke Tool 4 setelah dicentang, jadi temuan
        // identitas sumber WAJIB ikut tampil di sini juga — bukan cuma di jalur
        // STRUKTUR_LENGKAP. Tanpa ini mahasiswa bisa centang lalu lanjut tanpa
        // pernah diberi tahu ada sumber anonim di paketnya.
        ...catatanSumber,
      ],
    };
  }

  // Identitas sumber sudah diperiksa di atas (blok `sumber`/`catatanSumber`).
  return {
    status: "STRUKTUR_LENGKAP",
    hasKonteks: true,
    hasStatusSumber: true,
    hasSourceRegister: true,
    hasIntiSource: true,
    hasMatriksBukti: true,
    hasEvidence: true,
    hasStopSentence: true,
    isPromptAOutput: false,
    // Sama seperti jalur di atas: temuan "sumber tanpa penulis" bukan berarti
    // paketnya laporan riset AI. Temuannya ada di `notes`, bukan di field ini.
    isResearchReport: false,
    missingParts: [],
    notes: [
      `Paket Bukti Literatur dari NotebookLM memuat ${content.sourceCount} entri sumber dan ${content.evidenceRowCount} baris bukti. Struktur lengkap.`,
      ...catatanSumber,
      "Catatan: pemeriksaan ini menilai kelengkapan dan bentuk identitas sumber, bukan kebenaran isinya. Bukti tetap perlu ditelusuri sendiri.",
    ],
  };
}

/**
 * Deteksi sumber yang tidak bisa dipertanggungjawabkan di Paket Bukti Tool 3.
 *
 * ponytail: app tidak punya akses ke NotebookLM, jadi jumlah sumber asli di notebook
 * tidak bisa diperiksa langsung. Yang bisa diperiksa: (a) sumber tanpa identitas
 * penulis, (b) sumber tanpa URL/DOI, dan (c) konsistensi rekap TOTAL NOTEBOOK vs
 * jumlah entri register. Mahasiswa tetap diminta mencocokkan sendiri ke notebook.
 */
export interface SumberTidakLayakAudit {
  /** Sumber yang penulisnya ditulis sebagai tanpa-nama ("Anonim", "N.A.") — ciri laporan AI. */
  anonim: string[];
  /** Sumber yang kolom penulisnya TIDAK TERBACA. Belum tentu anonim — bisa jadi
   *  header tabelnya bergaya lain. Dilaporkan terpisah supaya tidak menuduh. */
  penulisTakTerbaca: string[];
  /** ID sumber tanpa URL maupun DOI — tidak bisa ditelusuri pembaca. */
  tanpaTautan: string[];
  /** Angka yang ditulis AI di baris TOTAL NOTEBOOK, bila ada. */
  totalNotebook?: number;
  /** Jumlah entri register yang benar-benar terbaca dari tabel. */
  registerCount: number;
}

// Nilai penulis tidak bisa dipertanggungjawabkan bila seluruh bagiannya cuma
// penanda "tak ada penulis". Bagian dipisah dulu karena lapangan menulisnya
// majemuk: "Anonim / N.A.". Tanda baca dibuang karena "N.A." vs "NA" vs "n/a"
// sama-sama muncul.
const PENANDA_TANPA_PENULIS = new Set([
  "",
  "anonim",
  "anonym",
  "anonymous",
  "na",
  "tanpanama",
  "noauthor",
  "unknownauthor",
  "tidakdiketahui",
  "noname",
  "namatidakdiketahui",
]);

function penulisMenjelaskanDiri(penulis: string): boolean {
  const bagian = penulis
    .split(/[/,&]|(?:\bdan\b)/i)
    .map((b) => b.replace(/[^a-z]/gi, "").toLowerCase())
    .filter((b) => b.length > 0);
  if (bagian.length === 0) return false;
  // Semua bagian hanya penanda tanpa-nama → AI memang menyatakan tak ada penulis.
  return bagian.every((b) => PENANDA_TANPA_PENULIS.has(b));
}

export function auditSumberPaketLiteratur(rawText: string): SumberTidakLayakAudit {
  const kosong: SumberTidakLayakAudit = {
    anonim: [],
    penulisTakTerbaca: [],
    tanpaTautan: [],
    registerCount: 0,
  };
  if (!rawText || rawText.trim().length === 0) return kosong;

  const register = extractSumberPaketLiteratur(rawText);
  const anonim: string[] = [];
  const penulisTakTerbaca: string[] = [];
  const tanpaTautan: string[] = [];

  for (const s of register) {
    const penulis = (s.authorsYear || "").trim();
    // Dua hal yang berbeda dan tidak boleh dicampur:
    //   - "Anonim / N.A."  → AI MENYATAKAN tidak ada penulis. Ini tuduhan yang sah.
    //   - kolom kosong     → app TIDAK BERHASIL membacanya (header tabel beda gaya).
    //     Menuduh ini sebagai "laporan riset AI" = alarm palsu.
    if (penulis.length === 0) penulisTakTerbaca.push(s.sourceId);
    else if (penulisMenjelaskanDiri(penulis)) anonim.push(s.sourceId);
    if (!s.url && !s.doi) tanpaTautan.push(s.sourceId);
  }

  // "TOTAL NOTEBOOK" lazim diikuti angkanya di baris/tab berikutnya.
  const m = /TOTAL\s+NOTEBOOK[\s\S]{0,40}?(\d{1,3})/i.exec(rawText);

  return {
    anonim,
    penulisTakTerbaca,
    tanpaTautan,
    totalNotebook: m ? Number(m[1]) : undefined,
    registerCount: register.length,
  };
}

/** Bersihkan URL sumber; kembalikan undefined bila tidak layak dipakai. */
function bersihUrl(raw: string): string | undefined {
  if (!raw) return undefined;
  const r = normalizeEvidenceUrl(raw);
  if (r.normalized === null) return undefined;
  const v = (r.normalized || "").trim();
  return v.length > 0 ? v : undefined;
}

/** Bersihkan DOI; "-" berarti AI menyatakan tidak ada. */
function bersihDoi(raw: string): string | undefined {
  const v = (raw || "").trim();
  if (!v || v === "-" || v.toLowerCase() === "n/a") return undefined;
  return v;
}

/**
 * Pemeriksaan isi paket bukti literatur.
 *
 * Menutup lubang F25: validator lama hanya mencocokkan judul bagian sehingga
 * teks sampah dapat berstatus STRUKTUR_LENGKAP. Di sini entri sumber dan baris
 * bukti dihitung dari baris nyata, dan identitas sumber yang tidak mungkin
 * (domain contoh, DOI 10.9999) ditolak.
 */
function auditLiteraturePackageContent(text: string): {
  missing: string[];
  sourceCount: number;
  evidenceRowCount: number;
} {
  const missing: string[] = [];

  // Potong teks per bagian. Heading bisa berbentuk "C. SOURCE REGISTER",
  // "### 2. SOURCE REGISTER", atau "SOURCE REGISTER" saja — NotebookLM tidak
  // konsisten, jadi penanda huruf/nomor bagian dibuat opsional.
  const JUDUL_C = /(^|\n)[ \t]*#{0,4}[ \t]*(?:[A-E][.)]|\d{1,2}[.)])?[ \t]*(SOURCE REGISTER|DAFTAR SUMBER|REGISTER SUMBER|REKONSILIASI SUMBER)/i;
  const JUDUL_D = /(^|\n)[ \t]*#{0,4}[ \t]*(?:[A-E][.)]|\d{1,2}[.)])?[ \t]*(MATRIKS BUKTI|EVIDENCE MATRIX)/i;
  // Batas akhir bagian: heading Markdown apa pun, atau heading huruf/nomor
  // bagian berikutnya.
  const BATAS = /(^|\n)[ \t]*(?:#{1,6}[ \t]\S|[A-E][.)][ \t]*[A-Z][A-Za-z ]{3,}|\d{1,2}[.)][ \t]*[A-Z][A-Za-z ]{3,})/;

  function potong(judul: RegExp): string {
    const m = judul.exec(text);
    if (!m) return "";
    const sisa = text.slice(m.index + m[0].length);
    const batas = BATAS.exec(sisa);
    return batas ? sisa.slice(0, batas.index) : sisa;
  }

  const HEADER_BARIS = /^(id|kode|no\.?|source_id|sumber|kategori|judul)\b/i;
  const PEMISAH = /^[\s|:-]+$/;

  function hitungBarisIsi(blok: string): number {
    return blok
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !PEMISAH.test(l) && !HEADER_BARIS.test(l))
      .length;
  }

  const blokC = potong(JUDUL_C);
  const blokD = potong(JUDUL_D);
  const sourceCount = hitungBarisIsi(blokC);
  const evidenceRowCount = hitungBarisIsi(blokD);

  if (sourceCount < 1) {
    missing.push("Entri sumber nyata di Source Register (Bagian C masih kosong atau hanya berisi judul)");
  }
  if (evidenceRowCount < 1) {
    missing.push("Baris bukti nyata di Matriks Bukti (Bagian D masih kosong atau hanya berisi judul)");
  }

  // Identitas yang mustahil: domain contoh/kosong atau DOI placeholder.
  const placeholders: string[] = [];
  if (/\bexample\.(com|org|net)\b/i.test(text)) placeholders.push("domain contoh (example.com)");
  if (/\b(localhost|127\.0\.0\.1|test\.invalid)\b/i.test(text)) placeholders.push("alamat lokal/uji");
  if (/10\.9999\//.test(text)) placeholders.push("DOI pola 10.9999 (bukan DOI nyata)");
  if (placeholders.length > 0) {
    missing.push(`Identitas sumber tidak nyata: ${placeholders.join(", ")}`);
  }

  return { missing, sourceCount, evidenceRowCount };
}

/**
 * Result structure of parseBedahTransfer.
 */
export interface BedahParseResult {
  success: boolean;
  version?: 1 | 2;
  data?: DirectionV2 | BedahTransferPayload;
  dataV2?: DirectionV2;
  dataV1?: BedahTransferPayload;
  error?: string;
  errorDetails?: string[];
  isNonCompliantWrapper?: boolean;
  /** Temuan audit konten (red line akademik). ERROR memblokir kelanjutan. */
  contentFindings?: ContentAuditFinding[];
}

/**
 * Audit konten payload Tool4 (red line akademik).
 *
 * Mengubah aturan yang semula hanya ditulis di prompt menjadi temuan yang bisa
 * ditampilkan: klaim kausal berlebihan, klaim ketiadaan bukti, sumber tanpa
 * identitas, sumber retracted, dan pengaman klaim yang hilang.
 */
function auditBedahPayload(data: DirectionV2): ContentAuditFinding[] {
  const groups: ContentAuditFinding[][] = [];

  // 1. Klaim kausal / absence di teks fenomena terkalibrasi
  const cp = data.calibrated_phenomenon;
  if (cp) {
    groups.push(
      auditFreeTextContent(String((cp as unknown as Record<string, unknown>).phenomenon_statement ?? ""), "calibrated_phenomenon.phenomenon_statement")
    );
    groups.push(
      auditFreeTextContent(String((cp as unknown as Record<string, unknown>).observed_condition ?? ""), "calibrated_phenomenon.observed_condition")
    );
  }

  // 2. Kandidat gap: statement + pengaman klaim
  for (const gap of data.candidate_gaps ?? []) {
    const g = gap as unknown as Record<string, unknown>;
    groups.push(auditFreeTextContent(String(g.statement ?? ""), `candidate_gaps.${gap.id}.statement`));
    groups.push(auditFreeTextContent(String(g.what_is_unexplained ?? ""), `candidate_gaps.${gap.id}.what_is_unexplained`));
    groups.push(auditClaimBoundaryList(g.prohibited_claims, `candidate_gaps.${gap.id}.prohibited_claims`));

    // Gap validity: absence-claim bukan research gap
    const assessment = auditGapValidity({
      gapStatement: String(g.statement ?? ""),
      gapType: String(g.gap_type ?? ""),
      comparableSourceIds: Array.isArray(g.source_ids) ? (g.source_ids as string[]) : [],
      independentAuthorTeamCount: 0,
      relationToPhenomenon: "",
    });
    if (assessment.validity === "NOT_A_RESEARCH_GAP") {
      groups.push([
        {
          code: "GAP_ABSENCE_CLAIM",
          severity: "ERROR",
          field: `candidate_gaps.${gap.id}`,
          message: `Gap ${gap.id} dirumuskan sebagai pernyataan bahwa penelitian tidak ada. Itu bukan research gap — hasil pencarian hanya membuktikan cakupan paket ini. Rumuskan ulang sebagai kesenjangan antar temuan yang ada.`,
        },
      ]);
    }
  }

  // 3. Arah penelitian: claim_boundary wajib ada dan tidak boleh kosong
  for (const dir of data.directions ?? []) {
    const d = dir as unknown as Record<string, unknown>;
    const cb = (d.claim_boundary ?? {}) as Record<string, unknown>;
    const notSafe = cb.not_safe_to_say;
    const notSafeList = Array.isArray(notSafe) ? notSafe : [];

    if (!d.claim_boundary) {
      groups.push([
        {
          code: "CLAIM_BOUNDARY_MISSING",
          severity: "ERROR",
          field: `directions.${dir.id}`,
          message: `Arah ${dir.id} tidak punya claim_boundary. Batas klaim wajib ada supaya mahasiswa tahu apa yang belum boleh disimpulkan.`,
        },
      ]);
    } else if (notSafeList.length === 0) {
      groups.push([
        {
          code: "CLAIM_BOUNDARY_EMPTY",
          severity: "ERROR",
          field: `directions.${dir.id}.claim_boundary.not_safe_to_say`,
          message: `Arah ${dir.id} punya claim_boundary kosong. Isi minimal satu batas klaim, misalnya apa yang belum bisa disimpulkan dari bukti yang ada.`,
        },
      ]);
    } else {
      groups.push(auditClaimBoundaryList(notSafeList, `directions.${dir.id}.claim_boundary.not_safe_to_say`));
    }

    groups.push(auditFreeTextContent(String(d.problem_focus ?? ""), `directions.${dir.id}.problem_focus`));
  }

  // 4. Identitas sumber: URL/DOI, domain placeholder, agregator, retracted
  const registerEntries: SourceIdentityAuditInput[] = [];
  for (const sw of data.source_weights ?? []) {
    const swr = sw as unknown as Record<string, unknown>;
    const id = String(swr.source_id ?? "").trim();
    const entry = {
      sourceId: id,
      url: String(swr.url ?? ""),
      doi: String(swr.doi ?? ""),
      title: String(swr.title ?? ""),
      declaredType: String(swr.document_type ?? ""),
    };
    registerEntries.push(entry);
    groups.push(auditSourceEntry(entry));

    // Gate A: retracted/withdrawn -> INVALID
    const identity = auditSourceIdentity({
      title: String(swr.title ?? ""),
      authors: [],
      year: "",
      journalOrPublisher: "",
      doi: String(swr.doi ?? ""),
      isRetracted: Boolean(swr.is_retracted),
      isWithdrawn: Boolean(swr.is_withdrawn),
    });
    if (identity.identityStatus === "INVALID") {
      groups.push([
        {
          code: "SOURCE_RETRACTED",
          severity: "ERROR",
          field: `source_weights.${id}`,
          message: `Sumber ${id} ditandai retracted/withdrawn. Sumber yang ditarik tidak boleh dipakai sebagai jangkar argumen.`,
        },
      ]);
    }
  }
  groups.push(auditSourceRegister(registerEntries));

  // 5. Pengaman klaim tingkat fenomena
  if (cp) {
    groups.push(
      auditClaimBoundaryList(
        (cp as unknown as Record<string, unknown>).prohibited_claims,
        "calibrated_phenomenon.prohibited_claims"
      )
    );
  }

  return mergeContentAudit(groups).findings;
}

/**
 * Parses Bedah Transfer JSON block for Tahap 4A (supports V2 with V1 backward compatibility).
 *
 * Hasil parse SELALU melewati audit konten akademik sebelum dikembalikan,
 * supaya aturan red line punya penegak deterministik — bukan hanya instruksi prompt.
 */
export function parseBedahTransfer(rawText: string): BedahParseResult {
  const result = parseBedahTransferInner(rawText);
  if (!result.success) return result;

  const data = (result.dataV2 ?? result.data) as DirectionV2 | undefined;
  if (!data) return result;

  // Audit dijalankan atas payload MENTAH dari AI, bukan hasil sanitasi.
  // Sanitizer menormalkan payload (mis. mengisi claim_boundary kosong), sehingga
  // pelanggaran aslinya hilang sebelum sempat diperiksa bila audit memakai hasil sanitasi.
  const raw = extractBedahPayload(rawText);
  const auditTarget = (raw ?? data) as DirectionV2;
  const contentFindings = auditBedahPayload(auditTarget);

  return { ...result, contentFindings };
}

/** Ambil payload mentah dari teks transfer, tanpa normalisasi. */
function extractBedahPayload(rawText: string): unknown {
  const pairs: [string, string][] = [
    ["=== BEGIN SKRIFLOW_DIRECTION_V2 ===", "=== END SKRIFLOW_DIRECTION_V2 ==="],
    ["=== BEGIN SKRIFLOW_DIRECTION_V1 ===", "=== END SKRIFLOW_DIRECTION_V1 ==="],
  ];
  for (const [startMark, endMark] of pairs) {
    const a = rawText.indexOf(startMark);
    const b = rawText.indexOf(endMark);
    if (a === -1 || b === -1 || b <= a) continue;
    const jsonString = rawText.substring(a + startMark.length, b).trim();
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }
  return null;
}

function parseBedahTransferInner(rawText: string): BedahParseResult {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      success: false,
      error: "Teks output masih kosong.",
      errorDetails: ["Tempelkan output hasil Bedah dari ChatGPT atau Gemini."],
    };
  }

  const v2Start = "=== BEGIN SKRIFLOW_DIRECTION_V2 ===";
  const v2End = "=== END SKRIFLOW_DIRECTION_V2 ===";

  const v1Start = "=== BEGIN SKRIFLOW_DIRECTION_V1 ===";
  const v1End = "=== END SKRIFLOW_DIRECTION_V1 ===";

  const idxV2Start = rawText.indexOf(v2Start);
  const idxV2End = rawText.indexOf(v2End);

  if (idxV2Start !== -1 && idxV2End !== -1 && idxV2End > idxV2Start) {
    const jsonString = rawText.substring(idxV2Start + v2Start.length, idxV2End).trim();
    const isNonCompliantWrapper = rawText.substring(0, idxV2Start).trim().length > 0 || rawText.substring(idxV2End + v2End.length).trim().length > 0;
    return parseDirectionV2Json(jsonString, isNonCompliantWrapper);
  }

  const idxV1Start = rawText.indexOf(v1Start);
  const idxV1End = rawText.indexOf(v1End);

  if (idxV1Start !== -1 && idxV1End !== -1 && idxV1End > idxV1Start) {
    const jsonString = rawText.substring(idxV1Start + v1Start.length, idxV1End).trim();
    const isNonCompliantWrapper = rawText.substring(0, idxV1Start).trim().length > 0 || rawText.substring(idxV1End + v1End.length).trim().length > 0;
    return parseDirectionV1Json(jsonString, isNonCompliantWrapper);
  }

  return {
    success: false,
    error: "Blok data transfer tidak ditemukan.",
    errorDetails: [
      "Pastikan output memuat penanda persis:",
      "=== BEGIN SKRIFLOW_DIRECTION_V2 ===",
      "...",
      "=== END SKRIFLOW_DIRECTION_V2 ===",
    ],
  };
}

function parseDirectionV2Json(jsonString: string, isNonCompliantWrapper: boolean): BedahParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: "Format JSON V2 tidak valid.",
      errorDetails: [
        `Gagal membaca JSON di antara marker: ${msg}`,
        "Pastikan model menggunakan double quotes dan tidak menyertakan trailing comma atau Markdown fence.",
      ],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      error: "Payload harus berupa objek JSON.",
      errorDetails: ["Format data transfer di antara marker bukan objek JSON valid."],
    };
  }

  const payload = parsed as Partial<DirectionV2>;
  const errorDetails: string[] = [];

  if (payload.schema_version !== 2) {
    errorDetails.push("schema_version wajib bernilai angka 2.");
  }

  if (payload.automatic_selection !== false) {
    errorDetails.push("automatic_selection wajib bernilai false.");
  }

  // Input audit validation
  if (!payload.input_audit || typeof payload.input_audit !== "object") {
    errorDetails.push("input_audit wajib berupa objek audit kelayakan input.");
  } else {
    if (!payload.input_audit.status || !VALID_INPUT_AUDIT_STATUSES_V2.includes(payload.input_audit.status as InputAuditStatusV2)) {
      errorDetails.push(`input_audit.status tidak valid. Harus salah satu dari: ${VALID_INPUT_AUDIT_STATUSES_V2.join(", ")}.`);
    }
  }

  // Calibrated phenomenon validation
  if (!payload.calibrated_phenomenon || typeof payload.calibrated_phenomenon !== "object") {
    errorDetails.push("calibrated_phenomenon wajib berupa objek kalibrasi fenomena.");
  } else {
    if (!payload.calibrated_phenomenon.summary || payload.calibrated_phenomenon.summary.trim().length === 0) {
      errorDetails.push("calibrated_phenomenon.summary wajib diisi.");
    }
    if (!payload.calibrated_phenomenon.empirical_problem || payload.calibrated_phenomenon.empirical_problem.trim().length === 0) {
      errorDetails.push("calibrated_phenomenon.empirical_problem wajib diisi.");
    }
    if (!payload.calibrated_phenomenon.knowledge_problem || payload.calibrated_phenomenon.knowledge_problem.trim().length === 0) {
      errorDetails.push("calibrated_phenomenon.knowledge_problem wajib diisi.");
    }
  }

  // Candidate Gaps validation (Allow 0 gaps if input_audit status is BUKTI_TIDAK_CUKUP)
  const gapIdSet = new Set<string>();
  const isInsufficientEvidence = payload.input_audit?.status === "BUKTI_TIDAK_CUKUP";

  if (!Array.isArray(payload.candidate_gaps)) {
    if (!isInsufficientEvidence) {
      errorDetails.push("candidate_gaps wajib berupa array berisi kandidat research gap.");
    }
  } else {
    if (payload.candidate_gaps.length > 4) {
      errorDetails.push("candidate_gaps maksimal berisi 4 kandidat.");
    }
    if (payload.candidate_gaps.length === 0 && !isInsufficientEvidence) {
      errorDetails.push("candidate_gaps wajib memuat minimal 1 kandidat research gap (atau gunakan status input_audit 'BUKTI_TIDAK_CUKUP' jika bukti belum mencukupi).");
    }

    payload.candidate_gaps.forEach((gap, idx) => {
      const label = `Gap #${idx + 1}`;
      if (!gap.id || typeof gap.id !== "string" || gap.id.trim().length === 0) {
        errorDetails.push(`${label}: ID gap tidak valid.`);
      } else {
        gapIdSet.add(gap.id.trim());
      }

      if (!gap.gap_type || !VALID_GAP_TYPES_V2.includes(gap.gap_type as ResearchGapTypeV2)) {
        errorDetails.push(`${label}: gap_type '${gap.gap_type}' tidak valid. Harus salah satu dari: ${VALID_GAP_TYPES_V2.join(", ")}.`);
      }

      if (!gap.strength || !VALID_GAP_STRENGTHS_V2.includes(gap.strength as ResearchGapStrengthV2)) {
        errorDetails.push(`${label}: strength '${gap.strength}' tidak valid. Dilarang menggunakan TERBUKTI. Harus: ${VALID_GAP_STRENGTHS_V2.join(", ")}.`);
      }

      if (!gap.statement || typeof gap.statement !== "string" || gap.statement.trim().length === 0) {
        errorDetails.push(`${label}: statement wajib berupa teks tidak kosong.`);
      }

      if (!Array.isArray(gap.source_ids) || gap.source_ids.length === 0) {
        errorDetails.push(`${label}: source_ids wajib memuat minimal 1 ID sumber.`);
      }
    });
  }

  // Directions validation
  const directionIdSet = new Set<string>();
  // ID sumber yang benar-benar ada di register payload (source_weights). Dipakai untuk
  // menolak anchor_source_ids karangan: sebelum ini parser hanya memeriksa "array tidak
  // kosong", sehingga ID yang tidak ada di paket bukti lolos dan terlihat seolah
  // tertelusuri. Normalisasi mengikuti gaya yang dipakai penormal bobot di bawah.
  const normSourceId = (s: unknown) => String(s ?? "").replace(/[\[\]]/g, "").trim().toUpperCase();
  const sourceIdSet = new Set<string>(
    (Array.isArray(payload.source_weights) ? payload.source_weights : []).map((sw) => normSourceId(sw.source_id)),
  );
  if (!Array.isArray(payload.directions)) {
    if (!isInsufficientEvidence) {
      errorDetails.push("directions wajib berupa array berisi 2–4 arah penelitian.");
    }
  } else {
    const minDirections = isInsufficientEvidence ? 0 : 2;
    if (payload.directions.length < minDirections || payload.directions.length > 4) {
      errorDetails.push(`directions harus berisi ${minDirections}–4 arah penelitian (ditemukan: ${payload.directions.length}).`);
    }

    payload.directions.forEach((dir, idx) => {
      const label = `Arah #${idx + 1}`;
      if (!dir.id || typeof dir.id !== "string" || dir.id.trim().length === 0) {
        errorDetails.push(`${label}: ID arah tidak valid.`);
      } else {
        directionIdSet.add(dir.id.trim());
      }

      if (!dir.name || typeof dir.name !== "string" || dir.name.trim().length === 0) {
        errorDetails.push(`${label}: nama arah wajib diisi.`);
      }

      if (!Array.isArray(dir.gap_ids)) {
        errorDetails.push(`${label}: gap_ids wajib berupa array.`);
      } else if (!isInsufficientEvidence && dir.gap_ids.length === 0) {
        errorDetails.push(`${label}: gap_ids wajib merujuk minimal 1 kandidat gap.`);
      } else {
        dir.gap_ids.forEach((gId) => {
          if (!gapIdSet.has(gId.trim())) {
            errorDetails.push(`${label}: gap_id '${gId}' tidak ditemukan di candidate_gaps.`);
          }
        });
      }

      if (!Array.isArray(dir.anchor_source_ids) || dir.anchor_source_ids.length === 0) {
        errorDetails.push(`${label}: anchor_source_ids wajib diisi — sebutkan minimal 1 source_id dari paket bukti yang menjadi sumber pijakan arah ini (field ini tidak boleh kosong dan tidak boleh diisi ID karangan).`);
      } else if (sourceIdSet.size > 0) {
        // Diperiksa hanya bila payload memuat register sumber (source_weights). Payload
        // lama tanpa register tetap lolos, supaya kompatibilitas ke belakang tidak pecah.
        dir.anchor_source_ids.forEach((sId) => {
          const clean = normSourceId(sId);
          if (clean.length === 0 || !sourceIdSet.has(clean)) {
            errorDetails.push(`${label}: anchor_source_id '${String(sId)}' tidak ada di Source Register paket bukti. Pakai ID sumber yang benar-benar ada di paket, jangan mengarang ID.`);
          }
        });
      }

      if (!dir.readiness || !VALID_DIRECTION_READINESS_V2.includes(dir.readiness as DirectionReadinessV2)) {
        errorDetails.push(`${label}: readiness '${dir.readiness}' tidak valid.`);
      }

      if (!Array.isArray(dir.data_verification_questions) || dir.data_verification_questions.length === 0) {
        errorDetails.push(`${label}: data_verification_questions wajib memuat pertanyaan verifikasi data.`);
      }
    });
  }

  if (errorDetails.length > 0) {
    return {
      success: false,
      error: `Data transfer V2 tidak lolos validasi skema: ${errorDetails.join("; ")}`,
      errorDetails,
    };
  }

  const sanitized: DirectionV2 = {
    schema_version: 2,
    automatic_selection: false,
    input_audit: {
      status: payload.input_audit!.status as InputAuditStatusV2,
      phenomenon_source_count: Number(payload.input_audit!.phenomenon_source_count) || 0,
      core_source_count: Number(payload.input_audit!.core_source_count) || 0,
      supporting_source_count: Number(payload.input_audit!.supporting_source_count) || 0,
      ignored_source_count: Number(payload.input_audit!.ignored_source_count) || 0,
      source_integrity_notes: Array.isArray(payload.input_audit!.source_integrity_notes) ? payload.input_audit!.source_integrity_notes : [],
      main_limitations: Array.isArray(payload.input_audit!.main_limitations) ? payload.input_audit!.main_limitations : [],
      recovery_actions: Array.isArray(payload.input_audit!.recovery_actions) ? payload.input_audit!.recovery_actions : [],
    },
    evidence_basis: payload.evidence_basis && typeof payload.evidence_basis === "object" ? {
      observed_phenomenon: Array.isArray(payload.evidence_basis.observed_phenomenon) ? payload.evidence_basis.observed_phenomenon : [],
      prior_study_findings: Array.isArray(payload.evidence_basis.prior_study_findings) ? payload.evidence_basis.prior_study_findings : [],
      not_yet_established: Array.isArray(payload.evidence_basis.not_yet_established) ? payload.evidence_basis.not_yet_established : [],
    } : {
      observed_phenomenon: payload.calibrated_phenomenon?.summary ? [payload.calibrated_phenomenon.summary] : [],
      prior_study_findings: (payload.knowledge_map?.established_knowledge || []).map((k) => k.statement),
      not_yet_established: Array.isArray(payload.calibrated_phenomenon?.what_is_not_proven) ? payload.calibrated_phenomenon!.what_is_not_proven : [],
    },
    calibrated_phenomenon: {
      summary: payload.calibrated_phenomenon!.summary.trim(),
      empirical_problem: payload.calibrated_phenomenon!.empirical_problem.trim(),
      knowledge_problem: payload.calibrated_phenomenon!.knowledge_problem.trim(),
      scope: {
        object_or_population: payload.calibrated_phenomenon!.scope?.object_or_population || "",
        geography: payload.calibrated_phenomenon!.scope?.geography || "",
        reference_period: payload.calibrated_phenomenon!.scope?.reference_period || "",
        event_or_context: payload.calibrated_phenomenon!.scope?.event_or_context || "",
      },
      evidence: Array.isArray(payload.calibrated_phenomenon!.evidence) ? payload.calibrated_phenomenon!.evidence : [],
      why_it_matters: Array.isArray(payload.calibrated_phenomenon!.why_it_matters) ? payload.calibrated_phenomenon!.why_it_matters : [],
      what_is_not_proven: Array.isArray(payload.calibrated_phenomenon!.what_is_not_proven) ? payload.calibrated_phenomenon!.what_is_not_proven : [],
      prohibited_claims: Array.isArray(payload.calibrated_phenomenon!.prohibited_claims) ? payload.calibrated_phenomenon!.prohibited_claims : [],
    },
    knowledge_map: {
      established_knowledge: Array.isArray(payload.knowledge_map?.established_knowledge) ? payload.knowledge_map!.established_knowledge : [],
      relatively_consistent_findings: Array.isArray(payload.knowledge_map?.relatively_consistent_findings) ? payload.knowledge_map!.relatively_consistent_findings : [],
      differing_findings: Array.isArray(payload.knowledge_map?.differing_findings) ? payload.knowledge_map!.differing_findings : [],
      measurement_limits: Array.isArray(payload.knowledge_map?.measurement_limits) ? payload.knowledge_map!.measurement_limits : [],
      context_limits: Array.isArray(payload.knowledge_map?.context_limits) ? payload.knowledge_map!.context_limits : [],
      data_limits: Array.isArray(payload.knowledge_map?.data_limits) ? payload.knowledge_map!.data_limits : [],
      methodological_limits: Array.isArray(payload.knowledge_map?.methodological_limits) ? payload.knowledge_map!.methodological_limits : [],
      conclusions_not_allowed: Array.isArray(payload.knowledge_map?.conclusions_not_allowed) ? payload.knowledge_map!.conclusions_not_allowed : [],
    },
    comparability_groups: Array.isArray(payload.comparability_groups) ? payload.comparability_groups : [],
    candidate_gaps: (payload.candidate_gaps || []).map((g) => ({
      id: g.id.trim(),
      gap_type: g.gap_type as ResearchGapTypeV2,
      statement: g.statement.trim(),
      what_is_known: Array.isArray(g.what_is_known) ? g.what_is_known : [],
      what_is_unexplained: (g.what_is_unexplained || "").trim(),
      phenomenon_link: (g.phenomenon_link || "").trim(),
      source_ids: Array.isArray(g.source_ids) ? g.source_ids : [],
      comparability_basis: (g.comparability_basis || "").trim(),
      strength: g.strength as ResearchGapStrengthV2,
      gap_status: (() => {
        if (g.gap_status && VALID_GAP_STATUSES_V2.includes(g.gap_status as CandidateGapStatus)) {
          return g.gap_status as CandidateGapStatus;
        }
        if (g.strength === "DIDUKUNG_DALAM_PAKET") return "CUKUP_DIDUKUNG";
        if (g.strength === "TERDUKUNG_SEMENTARA" || g.strength === "PERLU_SUMBER_TAMBAHAN") return "PERLU_VERIFIKASI";
        return "TERINDIKASI";
      })(),
      scope_limits: Array.isArray(g.scope_limits) ? g.scope_limits : [],
      verification_needed: Array.isArray(g.verification_needed) ? g.verification_needed : [],
      prohibited_claims: Array.isArray(g.prohibited_claims) ? g.prohibited_claims : [],
      assessment: g.assessment || {
        phenomenon_relevance: "SEDANG",
        traceability: "SEDANG",
        comparability: "SEDANG",
        evidence_strength: "SEDANG",
        feasibility: "SEDANG",
        overclaim_risk: "SEDANG",
      },
      gap_assessment: g.gap_assessment,
    })),
    directions: (payload.directions || []).map((d) => ({
      id: d.id.trim(),
      name: d.name.trim(),
      problem_focus: d.problem_focus.trim(),
      phenomenon_link: (d.phenomenon_link || "").trim(),
      gap_ids: Array.isArray(d.gap_ids) ? d.gap_ids : [],
      anchor_source_ids: Array.isArray(d.anchor_source_ids) ? d.anchor_source_ids : [],
      potential_unit_of_analysis: Array.isArray(d.potential_unit_of_analysis) ? d.potential_unit_of_analysis : [],
      potential_objects: Array.isArray(d.potential_objects) ? d.potential_objects : [],
      potential_constructs: Array.isArray(d.potential_constructs) ? d.potential_constructs : [],
      candidate_outcomes: Array.isArray(d.candidate_outcomes) ? d.candidate_outcomes : [],
      measurement_focus: d.measurement_focus ? {
        primary_outcome: (d.measurement_focus.primary_outcome || "").trim() || (d.candidate_outcomes?.[0] || "Outcome utama"),
        supporting_outcome: d.measurement_focus.supporting_outcome ? d.measurement_focus.supporting_outcome.trim() : null,
        non_equivalence_note: (d.measurement_focus.non_equivalence_note || "").trim() || "Hasil penelitian dengan ukuran berbeda tidak dapat dibandingkan secara langsung.",
      } : {
        primary_outcome: d.candidate_outcomes?.[0] || "Outcome utama",
        supporting_outcome: d.candidate_outcomes?.[1] || null,
        non_equivalence_note: "Hasil penelitian dengan ukuran berbeda tidak dapat dibandingkan secara langsung.",
      },
      claim_boundary: d.claim_boundary ? {
        safe_to_say: Array.isArray(d.claim_boundary.safe_to_say) ? d.claim_boundary.safe_to_say : [],
        not_safe_to_say: Array.isArray(d.claim_boundary.not_safe_to_say) ? d.claim_boundary.not_safe_to_say : [],
      } : {
        safe_to_say: d.problem_focus ? [`Fokus masalah: ${d.problem_focus}`] : [],
        not_safe_to_say: [
          "Belum aman menyatakan hubungan sebab-akibat langsung.",
          "Belum aman menyatakan belum ada penelitian serupa.",
        ],
      },
      conditional_badge: d.conditional_badge || undefined,
      previously_used_proxies: Array.isArray(d.previously_used_proxies) ? d.previously_used_proxies : [],
      data_needs: Array.isArray(d.data_needs) ? d.data_needs : [],
      data_sources_to_check: Array.isArray(d.data_sources_to_check) ? d.data_sources_to_check : [],
      possible_design_families: Array.isArray(d.possible_design_families) ? d.possible_design_families : [],
      constraint_fit: d.constraint_fit || "SEDANG",
      workload: d.workload || "SEDANG",
      main_work: Array.isArray(d.main_work) ? d.main_work : [],
      academic_risks: Array.isArray(d.academic_risks) ? d.academic_risks : [],
      data_risks: Array.isArray(d.data_risks) ? d.data_risks : [],
      scope_boundaries: d.scope_boundaries || { in_scope: [], out_of_scope: [] },
      unresolved_items: Array.isArray(d.unresolved_items) ? d.unresolved_items : [],
      data_verification_questions: Array.isArray(d.data_verification_questions)
        ? d.data_verification_questions.map((q: DataVerificationQuestionV2) => {
            // ADDENDUM E: field panduan pencarian bersifat opsional saat DIBACA
            // (paket 4B lama tetap lolos). Jenis situs di luar daftar -> LAINNYA.
            const situsRaw = (q as { site_type?: unknown }).site_type;
            const situs = typeof situsRaw === "string" ? situsRaw.trim() : "";
            const situsValid = (JENIS_SITUS_DATA as readonly string[]).includes(situs)
              ? (situs as JenisSitusData)
              : undefined;
            const bersihkanList = (v: unknown): string[] | undefined => {
              if (!Array.isArray(v)) return undefined;
              const isi = v.map((x) => String(x ?? "").trim()).filter((x) => x.length > 0);
              return isi.length > 0 ? isi : undefined;
            };
            return {
              ...q,
              where_to_look: bersihkanList((q as { where_to_look?: unknown }).where_to_look),
              search_keywords: bersihkanList((q as { search_keywords?: unknown }).search_keywords),
              site_type: situsValid,
            };
          })
        : [],
      phenomenon_connection: d.phenomenon_connection || d.phenomenon_link || undefined,
      why_worth_considering: d.why_worth_considering || undefined,
      workload_risk: d.workload_risk || undefined,
      readiness: (d.readiness || "LAYAK_DIPERIKSA") as DirectionReadinessV2,
    })),
    comparison_summary: (payload.comparison_summary || "").trim(),
    conditional_recommendation: payload.conditional_recommendation || {
      recommended_direction_ids: [],
      reasoning: "",
      conditions: [],
      not_a_selection: true,
    },
    guidance_points: Array.isArray(payload.guidance_points) ? payload.guidance_points : [],
    recovery_actions: Array.isArray(payload.recovery_actions) ? payload.recovery_actions : [],
    source_weights: Array.isArray(payload.source_weights)
      ? payload.source_weights.map((sw) => {
          const rawSw = sw as unknown as Record<string, unknown>;
          const url = typeof rawSw.url === "string" ? rawSw.url.trim() : "";
          const doi = typeof rawSw.doi === "string" ? rawSw.doi.trim() : "";
          return {
            source_id: (sw.source_id || "").trim(),
            document_type: sw.document_type ? sw.document_type.trim() : undefined,
            weight: (VALID_SOURCE_WEIGHTS.includes(sw.weight as SourceWeight) ? sw.weight : "PENDUKUNG") as SourceWeight,
            reason: sw.reason ? sw.reason.trim() : sw.note ? sw.note.trim() : undefined,
            note: sw.note ? sw.note.trim() : sw.reason ? sw.reason.trim() : undefined,
            title: typeof rawSw.title === "string" ? rawSw.title.trim() : undefined,
            // URL/DOI dinormalkan seperti di Tool2: AI sering menulis markdown
            // [url](url), DOI tanpa protokol, atau protokol http.
            url: bersihUrl(url),
            doi: bersihDoi(doi),
            // Jejak audit: sumber tanpa URL/DOI tidak bisa diperiksa keberadaannya.
            identity_status: (
              url || doi ? "NEEDS_CHECK" : "MISSING"
            ) as SourceIdentityAuditStatus,
          };
        })
      : undefined,
    academic_audit: payload.academic_audit,
    recovery_search: payload.recovery_search,
  };

  return {
    success: true,
    version: 2,
    data: sanitized,
    dataV2: sanitized,
    isNonCompliantWrapper,
  };
}

function parseDirectionV1Json(jsonString: string, isNonCompliantWrapper: boolean): BedahParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: "Format JSON tidak valid.",
      errorDetails: [`Gagal membaca JSON di antara marker: ${msg}`],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      error: "Payload harus berupa objek JSON.",
      errorDetails: ["Format data transfer di antara marker bukan objek JSON valid."],
    };
  }

  const payload = parsed as Partial<BedahTransferPayload>;
  const errorDetails: string[] = [];

  if (payload.schema_version !== 1) {
    errorDetails.push("schema_version wajib bernilai angka 1.");
  }

  const gapIdSet = new Set<string>();
  if (Array.isArray(payload.candidate_gaps)) {
    payload.candidate_gaps.forEach((gap) => {
      if (gap.id) gapIdSet.add(gap.id.trim());
    });
  }

  if (Array.isArray(payload.directions)) {
    payload.directions.forEach((dir, idx) => {
      const label = `Arah #${idx + 1}`;
      if (Array.isArray(dir.gap_ids)) {
        dir.gap_ids.forEach((gId) => {
          if (!gapIdSet.has(gId.trim())) {
            errorDetails.push(`${label}: gap_id '${gId}' tidak ditemukan dalam candidate_gaps.`);
          }
        });
      }
    });
  }

  if (errorDetails.length > 0) {
    return {
      success: false,
      error: "Data transfer tidak lolos validasi skema.",
      errorDetails,
    };
  }

  const sanitized = payload as BedahTransferPayload;
  return {
    success: true,
    version: 1,
    data: sanitized,
    dataV1: sanitized,
    isNonCompliantWrapper,
  };
}

/**
 * Normalizes Bab 1 Foundation output according to canonical source weights and phenomenon basis status.
 * Ensures consistent status across background_map, evidence_ledger, and paragraph_claims.
 */
export function normalizeBab1Foundation(
  foundation: Bab1FoundationV1,
  canonicalSourceWeights?: { source_id: string; weight: SourceWeight; document_type?: string }[] | Map<string, SourceWeight>,
  options?: {
    phenomenonBasisStatus?: PhenomenonBasisStatus;
    dataReadiness?: DataReadinessOutcome;
    candidateGaps?: CandidateGapV2[];
    warnings?: string[];
  }
): Bab1FoundationV1 {
  const canonicalMap = new Map<string, SourceWeight>();
  if (canonicalSourceWeights instanceof Map) {
    canonicalSourceWeights.forEach((w, id) => {
      const clean = (id || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      if (clean && w) canonicalMap.set(clean, w);
    });
  } else if (Array.isArray(canonicalSourceWeights)) {
    canonicalSourceWeights.forEach((sw) => {
      const clean = (sw.source_id || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      if (clean && sw.weight) canonicalMap.set(clean, sw.weight);
    });
  }

  const formatSourceWeightLabel = (w: string): string => {
    if (w === "UTAMA") return "Sumber Utama";
    if (w === "PENDUKUNG") return "Sumber Pendukung";
    if (w === "PERLU_DIPERIKSA") return "Perlu Diperiksa";
    return w;
  };

  const warnings: string[] = options?.warnings || (Array.isArray(foundation.normalization_warnings) ? [...foundation.normalization_warnings] : []);
  const addWarning = (msg: string) => {
    if (!warnings.includes(msg)) {
      warnings.push(msg);
    }
  };

  const normalized: Bab1FoundationV1 = {
    ...foundation,
    selected_direction: { ...foundation.selected_direction },
    background_map: Array.isArray(foundation.background_map)
      ? foundation.background_map.map((sec) => ({
          ...sec,
          missing_information: Array.isArray(sec.missing_information) ? [...sec.missing_information] : [],
          safe_claims: Array.isArray(sec.safe_claims)
            ? sec.safe_claims.map((sc) => ({
                ...sc,
                source_ids: Array.isArray(sc.source_ids) ? [...sc.source_ids] : [],
              }))
            : [],
        }))
      : [],
    evidence_ledger: Array.isArray(foundation.evidence_ledger)
      ? foundation.evidence_ledger.map((el) => ({
          ...el,
          source_ids: Array.isArray(el.source_ids) ? [...el.source_ids] : (el.source_id ? [el.source_id] : []),
          source_weights: Array.isArray(el.source_weights) ? el.source_weights.map((sw) => ({ ...sw })) : [],
        }))
      : [],
    paragraph_claims: Array.isArray(foundation.paragraph_claims)
      ? foundation.paragraph_claims.map((pc) => ({
          ...pc,
          sourceIds: Array.isArray(pc.sourceIds) ? [...pc.sourceIds] : [],
        }))
      : undefined,
    recovery_actions: Array.isArray(foundation.recovery_actions) ? [...foundation.recovery_actions] : [],
  };

  // 1. Reconcile source weights on evidence_ledger
  normalized.evidence_ledger.forEach((el) => {
    const resolvedWeights: import("@/types/tool").LedgerSourceWeightItem[] = [];

    (el.source_ids || []).forEach((sid) => {
      const cleanSid = sid.replace(/[\[\]]/g, "").trim().toUpperCase();
      const outputWeightItem = Array.isArray(el.source_weights)
        ? el.source_weights.find((sw) => (sw.source_id || "").replace(/[\[\]]/g, "").trim().toUpperCase() === cleanSid)
        : undefined;
      const outputWeight = outputWeightItem?.weight || (el.source_ids?.length === 1 ? el.source_weight : undefined);

      let finalWeight: SourceWeight = "PERLU_DIPERIKSA";
      if (canonicalMap.size > 0) {
        const canonicalWeight = canonicalMap.get(cleanSid) || "PERLU_DIPERIKSA";
        if (outputWeight && outputWeight !== canonicalWeight) {
          addWarning(
            `Bobot ${sid} disesuaikan dari ${formatSourceWeightLabel(outputWeight)} menjadi ${formatSourceWeightLabel(canonicalWeight)} agar sesuai dengan klasifikasi sumber pada Tool 4.`
          );
        }
        finalWeight = canonicalWeight;
      } else {
        finalWeight = outputWeight || "PERLU_DIPERIKSA";
      }
      resolvedWeights.push({ source_id: sid, weight: finalWeight });
    });

    el.source_weights = resolvedWeights;
    if (resolvedWeights.length > 0) {
      el.source_weight = resolvedWeights[0].weight;
    }

    if (resolvedWeights.length > 0) {
      const allNeedCheck = resolvedWeights.every((sw) => sw.weight === "PERLU_DIPERIKSA");
      if (allNeedCheck) {
        el.support_status = "NEEDS_VERIFICATION";
      }

      const isPrimaryClaim =
        el.bab1_function?.toLowerCase().includes("fenomena") ||
        el.bab1_function?.toLowerCase().includes("masalah") ||
        el.bab1_function?.toLowerCase().includes("utama") ||
        el.bab1_function === "EMPIRICAL_PHENOMENON" ||
        el.bab1_function === "WHY_IT_IS_A_PROBLEM" ||
        el.claim_type === "EMPIRICAL_FACT";

      const allPendukung = resolvedWeights.every((sw) => sw.weight === "PENDUKUNG");
      if (isPrimaryClaim && allPendukung) {
        el.support_status = "NEEDS_VERIFICATION";
      }
    }
  });

  // 2. Reconcile data readiness and gaps
  if (options?.dataReadiness === "DATA_BLOCKED") {
    normalized.foundation_status = "BAB1_BLOCKED";
    normalized.status_reason = "Status diturunkan menjadi BAB1_BLOCKED karena terdapat data primer/sekunder kritis yang tidak tersedia.";
  } else if (options?.dataReadiness === "DATA_CONDITIONAL") {
    if (normalized.foundation_status === "BAB1_READY") {
      normalized.foundation_status = "BAB1_CONDITIONAL";
      normalized.status_reason = "Status disesuaikan menjadi BAB1_CONDITIONAL karena akses data masih memerlukan konfirmasi/verifikasi lapangan.";
    }
  }

  if (options?.candidateGaps && options.candidateGaps.length > 0) {
    const allWeak = options.candidateGaps.every(
      (g) => g.strength === "PERLU_SUMBER_TAMBAHAN" || g.strength === "TIDAK_DIDUKUNG" || g.strength === "TIDAK_DAPAT_DIBANDINGKAN"
    );
    if (allWeak && normalized.foundation_status === "BAB1_READY") {
      normalized.foundation_status = "BAB1_CONDITIONAL";
      normalized.status_reason = "Status dibatasi menjadi BAB1_CONDITIONAL karena kandidat research gap masih membutuhkan sumber tambahan.";
    }
  }

  // 3. PATCH A: Phenomenon Basis Status Capping & Cross-Structure Normalization
  const phenBasis: PhenomenonBasisStatus =
    options?.phenomenonBasisStatus ||
    normalized.phenomenon_basis_status ||
    "VERIFIED_REAL_WORLD";
  normalized.phenomenon_basis_status = phenBasis;

  let phenomenonAdjusted = false;

  if (phenBasis !== "VERIFIED_REAL_WORLD") {
    // A1. Clamp status fondasi
    if (phenBasis === "MISSING") {
      normalized.foundation_status = "BAB1_BLOCKED";
      normalized.status_reason = "Status diturunkan menjadi BAB1_BLOCKED karena belum tersedia dasar fenomena dunia nyata maupun petunjuk literatur.";
      phenomenonAdjusted = true;
    } else if (normalized.foundation_status === "BAB1_READY") {
      normalized.foundation_status = "BAB1_CONDITIONAL";
      normalized.status_reason = "Status disesuaikan menjadi BAB1_CONDITIONAL karena fenomena masih ditunjukkan oleh literatur dan belum diverifikasi sebagai kondisi dunia nyata.";
      phenomenonAdjusted = true;
    }

    // A2. Normalisasi background_map
    const phenomenonClaimIds = new Set<string>();

    normalized.background_map.forEach((sec) => {
      const isPhenSec =
        sec.function === "EMPIRICAL_PHENOMENON" ||
        sec.function?.toLowerCase().includes("fenomena");

      if (isPhenSec) {
        if (phenBasis === "MISSING") {
          sec.readiness = "BLOCKED";
          sec.missing_information = sec.missing_information || [];
          if (!sec.missing_information.includes("Dasar fenomena belum tersedia. Silakan cari fenomena pada Tool 2.")) {
            sec.missing_information.push("Dasar fenomena belum tersedia. Silakan cari fenomena pada Tool 2.");
          }
          phenomenonAdjusted = true;
        } else {
          if (sec.readiness !== "NEEDS_VERIFICATION") {
            sec.readiness = "NEEDS_VERIFICATION";
            phenomenonAdjusted = true;
          }
          sec.missing_information = sec.missing_information || [];
          if (!sec.missing_information.includes("Bukti fenomena dunia nyata belum tersedia/terverifikasi dari Tool 2 (masih berupa petunjuk literatur).")) {
            sec.missing_information.push("Bukti fenomena dunia nyata belum tersedia/terverifikasi dari Tool 2 (masih berupa petunjuk literatur).");
          }
        }

        if (Array.isArray(sec.safe_claims)) {
          sec.safe_claims.forEach((sc) => {
            if (sc.claim_id) {
              phenomenonClaimIds.add(sc.claim_id.trim());
            }
            if (sc.support_status !== "NEEDS_VERIFICATION") {
              sc.support_status = "NEEDS_VERIFICATION";
              phenomenonAdjusted = true;
            }
          });
        }
      }
    });

    // A3. Normalisasi evidence_ledger
    normalized.evidence_ledger.forEach((el) => {
      const isPhenClaim =
        (el.claim_id && phenomenonClaimIds.has(el.claim_id.trim())) ||
        el.bab1_function === "EMPIRICAL_PHENOMENON" ||
        el.bab1_function?.toLowerCase().includes("fenomena");

      if (isPhenClaim) {
        if (phenBasis === "MISSING") {
          el.support_status = "DO_NOT_USE";
          phenomenonAdjusted = true;
        } else {
          if (el.support_status !== "NEEDS_VERIFICATION") {
            el.support_status = "NEEDS_VERIFICATION";
            phenomenonAdjusted = true;
          }
        }
      }
    });

    // Sinkronisasi status support_status di background_map safe_claims dari evidence_ledger
    normalized.background_map.forEach((sec) => {
      if (Array.isArray(sec.safe_claims)) {
        sec.safe_claims.forEach((sc) => {
          if (sc.claim_id) {
            const matchingLedger = normalized.evidence_ledger.find((el) => el.claim_id === sc.claim_id);
            if (matchingLedger?.support_status) {
              sc.support_status = matchingLedger.support_status;
            }
          }
        });
      }
    });

    // A4. Normalisasi paragraph_claims
    if (Array.isArray(normalized.paragraph_claims)) {
      normalized.paragraph_claims.forEach((pc) => {
        const isPhenPc =
          pc.function === "EMPIRICAL_PHENOMENON" ||
          pc.function?.toLowerCase().includes("fenomena") ||
          (pc.claimId && phenomenonClaimIds.has(pc.claimId.trim()));

        if (isPhenPc) {
          if (phenBasis === "MISSING") {
            pc.readiness = "DO_NOT_USE";
            phenomenonAdjusted = true;
          } else {
            if (pc.readiness !== "NEEDS_VERIFICATION") {
              pc.readiness = "NEEDS_VERIFICATION";
              phenomenonAdjusted = true;
            }
          }
        }
      });
    }

    // A5. Warning normalisasi fenomena
    if (phenBasis === "LITERATURE_INDICATED" && phenomenonAdjusted) {
      addWarning(
        "Status klaim fenomena disesuaikan menjadi Perlu Diperiksa karena fenomena ini baru ditunjukkan oleh literatur dan belum diverifikasi sebagai kondisi dunia nyata."
      );
    }

    if (phenBasis === "MISSING") {
      if (!normalized.recovery_actions.some((a) => a.toLowerCase().includes("tool 2"))) {
        normalized.recovery_actions.push("Kembali ke Tool 2 untuk mencari dan menetapkan bukti fenomena dunia nyata.");
      }
    } else if (phenBasis === "LITERATURE_INDICATED") {
      if (!normalized.recovery_actions.some((a) => a.toLowerCase().includes("tool 2"))) {
        normalized.recovery_actions.push("Kembali ke Tool 2 untuk memverifikasi bukti fenomena dunia nyata yang terstruktur.");
      }
    }
  }

  // 4. Update support_status for non-phenomenon safe_claims from evidence_ledger
  normalized.background_map.forEach((sec) => {
    if (Array.isArray(sec.safe_claims)) {
      sec.safe_claims.forEach((sc) => {
        if (sc.claim_id) {
          const matchingLedger = normalized.evidence_ledger.find((el) => el.claim_id === sc.claim_id);
          if (matchingLedger?.support_status) {
            sc.support_status = matchingLedger.support_status;
          }
        }
        if (!sc.support_status && sc.source_ids && sc.source_ids.length > 0) {
          const allNeedCheck = sc.source_ids.every((sid) => {
            const clean = sid.replace(/[\[\]]/g, "").trim().toUpperCase();
            return (canonicalMap.get(clean) || "PERLU_DIPERIKSA") === "PERLU_DIPERIKSA";
          });
          if (allNeedCheck) {
            sc.support_status = "NEEDS_VERIFICATION";
          }
        }
      });
    }
  });

  // 5. Update readiness for non-phenomenon paragraph claims if all sources are PERLU_DIPERIKSA
  if (Array.isArray(normalized.paragraph_claims)) {
    normalized.paragraph_claims.forEach((pc) => {
      const isPhenPc =
        pc.function === "EMPIRICAL_PHENOMENON" ||
        pc.function?.toLowerCase().includes("fenomena");
      if (!isPhenPc) {
        const pcSources = (pc.sourceIds || []).map((s) => s.replace(/[\[\]]/g, "").trim().toUpperCase());
        const pcWeights = pcSources.map((s) => canonicalMap.get(s) || "PERLU_DIPERIKSA");
        const allPcNeedCheck = pcWeights.length > 0 && pcWeights.every((w) => w === "PERLU_DIPERIKSA");
        const allPcPendukung = pcWeights.length > 0 && pcWeights.every((w) => w === "PENDUKUNG");
        const isPcPrimary =
          pc.function === "WHY_IT_IS_A_PROBLEM" ||
          pc.function?.toLowerCase().includes("masalah") ||
          pc.claimType === "EMPIRICAL_FACT";

        if (allPcNeedCheck || (isPcPrimary && allPcPendukung)) {
          pc.readiness = "NEEDS_VERIFICATION";
        }
      }
    });
  }

  // Target panjang latar belakang (1000–1300 kata). Redaksi prompt sebelum revisi tidak memuatnya.
  const DEFAULT_WORD_RANGE: Record<string, string> = {
    SPECIFIC_CONTEXT: "130–165",
    OBJECT_AND_SCOPE: "130–165",
    EMPIRICAL_PHENOMENON: "180–210",
    WHY_IT_IS_A_PROBLEM: "160–195",
    PRIOR_RESEARCH: "170–200",
    KNOWLEDGE_LIMIT_OR_GAP: "150–185",
    URGENCY_AND_DIRECTION: "130–165",
  };
  const parseRange = (v?: string): [number, number] | null => {
    const m = (v || "").match(/(\d+)\D+(\d+)/);
    if (!m) return null;
    const lo = parseInt(m[1], 10);
    const hi = parseInt(m[2], 10);
    return lo > 0 && hi >= lo ? [lo, hi] : null;
  };

  let rangeSumLo = 0;
  let rangeSumHi = 0;
  let hasAnyRange = false;
  normalized.background_map = (normalized.background_map || []).map((sec) => {
    let range = sec.target_word_range;
    if (!parseRange(range)) {
      range = DEFAULT_WORD_RANGE[sec.function] || "140–190";
    }
    hasAnyRange = true;
    const parsed = parseRange(range);
    if (parsed) {
      rangeSumLo += parsed[0];
      rangeSumHi += parsed[1];
    }
    return { ...sec, target_word_range: range };
  });

  if (hasAnyRange && (rangeSumHi < 1000 || rangeSumLo > 1300)) {
    addWarning(
      `Total target panjang latar belakang dari peta paragraf adalah ${rangeSumLo}–${rangeSumHi} kata, di luar rentang yang diminta 1000–1300 kata. Sesuaikan target per paragraf sebelum menulis draf.`
    );
  }
  normalized.target_words_total = Math.round((rangeSumLo + rangeSumHi) / 2) || 1150;

  normalized.normalization_warnings = warnings.length > 0 ? warnings : undefined;
  return normalized;
}

/**
 * Parses Bab 1 Foundation transfer block for Tahap 4B.
 */
export function parseBab1FoundationTransfer(
  rawText: string,
  context?: {
    expectedDirectionId?: string;
    dataReadiness?: DataReadinessOutcome;
    candidateGaps?: import("@/types/tool").CandidateGapV2[];
    phenomenonBasisStatus?: import("@/types/tool").PhenomenonBasisStatus;
    sourceWeights?: import("@/types/tool").SourceWeightItem[];
    knownSourceIds?: string[];
    literatureEvidencePackage?: string;
  }
): {
  success: boolean;
  data?: Bab1FoundationV1;
  error?: string;
  errorDetails?: string[];
  warnings?: string[];
  isNonCompliantWrapper?: boolean;
} {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      success: false,
      error: "Teks output masih kosong.",
      errorDetails: ["Tempelkan output hasil Susun Fondasi Bab 1 dari ChatGPT atau Gemini."],
    };
  }

  const startMarker = "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===";
  const endMarker = "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===";

  const startIndex = rawText.indexOf(startMarker);
  const endIndex = rawText.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return {
      success: false,
      error: "Blok data fondasi Bab 1 tidak ditemukan.",
      errorDetails: [
        "Pastikan output memuat penanda persis:",
        "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===",
        "...",
        "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===",
      ],
    };
  }

  const isNonCompliantWrapper = rawText.substring(0, startIndex).trim().length > 0 || rawText.substring(endIndex + endMarker.length).trim().length > 0;
  const jsonString = rawText.substring(startIndex + startMarker.length, endIndex).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: "Format JSON Fondasi Bab 1 tidak valid.",
      errorDetails: [
        `Gagal membaca JSON di antara marker: ${msg}`,
        "Pastikan model tidak menyertakan Markdown fence dan menggunakan double quotes.",
      ],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      error: "Payload fondasi harus berupa objek JSON valid.",
    };
  }

  const payload = parsed as Partial<Bab1FoundationV1>;
  const errorDetails: string[] = [];
  const warnings: string[] = [];

  // Assemble known source IDs for hallucinated source detection (Patch 3)
  const knownSourceIdSet = new Set<string>();
  if (Array.isArray(context?.knownSourceIds)) {
    context.knownSourceIds.forEach((id) => {
      const clean = (id || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      if (clean) knownSourceIdSet.add(clean);
    });
  }
  if (Array.isArray(context?.sourceWeights)) {
    context.sourceWeights.forEach((sw) => {
      const clean = (sw.source_id || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      if (clean) knownSourceIdSet.add(clean);
    });
  }
  if (context?.literatureEvidencePackage) {
    const matches = context.literatureEvidencePackage.match(/\b(ID-\d+|S\d+|S-\d+|[A-Z]+-\d+)\b/gi);
    if (matches) {
      matches.forEach((m) => {
        const clean = m.replace(/[\[\]]/g, "").trim().toUpperCase();
        if (clean) knownSourceIdSet.add(clean);
      });
    }
  }

  const checkUnknownSource = (sid: string, locationDesc: string) => {
    if (knownSourceIdSet.size > 0) {
      const clean = (sid || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      if (clean && !knownSourceIdSet.has(clean)) {
        errorDetails.push(
          `Sumber '${sid}' pada ${locationDesc} tidak ditemukan dalam Paket Bukti atau daftar sumber Tahap 4A. Jangan menambahkan sumber baru yang tidak terdaftar.`
        );
      }
    }
  };

  if (payload.schema_version !== 1) {
    errorDetails.push("schema_version wajib bernilai angka 1.");
  }

  // Selected direction verification
  if (!payload.selected_direction || typeof payload.selected_direction !== "object") {
    errorDetails.push("selected_direction wajib diisi.");
  } else {
    if (payload.selected_direction.student_selected !== true) {
      errorDetails.push("selected_direction.student_selected wajib bernilai true.");
    }
    if (context?.expectedDirectionId && payload.selected_direction.id !== context.expectedDirectionId) {
      errorDetails.push(`Arah pada hasil 4B (${payload.selected_direction.id}) berbeda dengan arah terpilih (${context.expectedDirectionId}).`);
    }
  }

  // Problem structure validation
  if (!payload.problem_structure || typeof payload.problem_structure !== "object") {
    errorDetails.push("problem_structure wajib berupa objek struktur masalah.");
  }

  // Research logic chain (7 stages)
  if (!Array.isArray(payload.research_logic_chain) || payload.research_logic_chain.length < 5) {
    errorDetails.push("research_logic_chain wajib memuat alur rantai logika penelitian.");
  }

  // Research questions & objectives (1-to-1)
  if (!Array.isArray(payload.candidate_research_questions) || payload.candidate_research_questions.length === 0) {
    errorDetails.push("candidate_research_questions wajib memuat 1–3 rumusan masalah.");
  } else if (payload.candidate_research_questions.length > 3) {
    errorDetails.push("candidate_research_questions maksimal 3 item.");
  }

  if (!Array.isArray(payload.candidate_objectives) || payload.candidate_objectives.length === 0) {
    errorDetails.push("candidate_objectives wajib diisi.");
  }

  if (Array.isArray(payload.candidate_research_questions) && Array.isArray(payload.candidate_objectives)) {
    if (payload.candidate_research_questions.length !== payload.candidate_objectives.length) {
      errorDetails.push(`Jumlah rumusan masalah (${payload.candidate_research_questions.length}) dan tujuan (${payload.candidate_objectives.length}) wajib 1-ke-1 berpasangan.`);
    }
  }

  // Working title previews (max 3)
  if (!Array.isArray(payload.working_title_previews) || payload.working_title_previews.length === 0) {
    errorDetails.push("working_title_previews wajib memuat 1–3 gambaran bentuk judul.");
  } else if (payload.working_title_previews.length > 3) {
    errorDetails.push("working_title_previews maksimal 3 item.");
  }

  // Background map (7 to 9 items)
  if (!Array.isArray(payload.background_map) || payload.background_map.length < 7 || payload.background_map.length > 9) {
    const len = Array.isArray(payload.background_map) ? payload.background_map.length : 0;
    errorDetails.push(`background_map wajib memuat tepat 7–9 bagian narasi latar belakang (ditemukan: ${len}).`);
  }

  // Evidence ledger verification & normalization (Patch 1, Patch 2 & Patch 3)
  const ledgerClaimIdSet = new Set<string>();
  const normalizedLedger: import("@/types/tool").EvidenceLedgerItem[] = [];

  // Build canonicalSourceWeightMap strictly from context.sourceWeights (Tahap 4A)
  const canonicalSourceWeightMap = new Map<string, SourceWeight>();
  if (Array.isArray(context?.sourceWeights)) {
    context.sourceWeights.forEach((sw) => {
      const clean = (sw.source_id || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      if (clean && sw.weight) {
        canonicalSourceWeightMap.set(clean, sw.weight);
      }
    });
  }

  if (!Array.isArray(payload.evidence_ledger) || payload.evidence_ledger.length === 0) {
    errorDetails.push("evidence_ledger wajib memuat daftar bukti dan klaim yang digunakan.");
  } else {
    payload.evidence_ledger.forEach((rawItem, idx) => {
      const item = { ...rawItem } as import("@/types/tool").EvidenceLedgerItem;

      if (!item.claim_id) {
        errorDetails.push(`Evidence Ledger #${idx + 1}: claim_id wajib diisi.`);
      } else {
        ledgerClaimIdSet.add(item.claim_id.trim());
      }

      // Backward compatibility normalization: source_id <-> source_ids
      if (item.source_id && (!item.source_ids || item.source_ids.length === 0)) {
        item.source_ids = [item.source_id.trim()];
      } else if (item.source_ids && item.source_ids.length > 0 && !item.source_id) {
        item.source_id = item.source_ids[0].trim();
      }

      // Default claim_type if missing
      if (!item.claim_type) {
        if (item.source_ids && item.source_ids.length > 1) {
          item.claim_type = "CROSS_SOURCE_SYNTHESIS";
        } else if (item.source_ids && item.source_ids.length === 1) {
          item.claim_type = "EMPIRICAL_FACT";
        } else {
          item.claim_type = "RESEARCHER_DECISION";
        }
      }

      // Validate sources according to claim type
      if (item.claim_type !== "RESEARCHER_DECISION") {
        if (!item.source_ids || item.source_ids.length === 0) {
          errorDetails.push(`Evidence Ledger #${idx + 1}: source_ids wajib memuat minimal satu sumber.`);
        } else {
          item.source_ids.forEach((sid) => checkUnknownSource(sid, `evidence_ledger #${idx + 1} (${item.claim_id || "klaim"})`));
        }
      } else {
        item.source_ids = item.source_ids || [];
        const basis = (item.decision_basis || "").trim();
        if (!basis) {
          errorDetails.push(
            `Keputusan sementara mahasiswa pada evidence_ledger #${idx + 1} (${item.claim_id || "tanpa ID"}) belum memiliki dasar keputusan. Isi decision_basis dengan alasan konkret, misalnya hasil pemilihan arah, kecocokan data, batas waktu, atau arahan dosen.`
          );
        }
      }

      normalizedLedger.push(item);
    });
  }

  // Background map safe_claims validation & backward compatibility normalization (Patch 2 & Patch 3)
  const normalizedBackgroundMap: import("@/types/tool").BackgroundMapItemV2[] = [];

  if (Array.isArray(payload.background_map)) {
    payload.background_map.forEach((sec, sIdx) => {
      const normalizedSafeClaims: import("@/types/tool").BackgroundMapSafeClaim[] = [];

      if (Array.isArray(sec.safe_claims)) {
        sec.safe_claims.forEach((sc, cIdx) => {
          const claim: import("@/types/tool").BackgroundMapSafeClaim = { ...sc };

          // Backward compatibility: infer claim_type if missing
          if (!claim.claim_type) {
            if (claim.source_ids && claim.source_ids.length > 1) {
              claim.claim_type = "CROSS_SOURCE_SYNTHESIS";
            } else if (claim.source_ids && claim.source_ids.length === 1) {
              claim.claim_type = "EMPIRICAL_FACT";
            } else if (
              sec.function === "URGENCY_AND_DIRECTION" ||
              sec.function === "OBJECT_AND_SCOPE"
            ) {
              claim.claim_type = "RESEARCHER_DECISION";
              claim.source_ids = [];
            } else {
              claim.claim_type = "EMPIRICAL_FACT";
            }
          }

          if (claim.claim_type === "EMPIRICAL_FACT") {
            if (!claim.source_ids || claim.source_ids.length === 0) {
              errorDetails.push(
                `Background Map Bagian #${sIdx + 1}, Klaim #${cIdx + 1}: Fakta empiris wajib memiliki minimal satu source_id.`
              );
            } else {
              claim.source_ids.forEach((sid) => checkUnknownSource(sid, `background_map Bagian #${sIdx + 1}, Klaim #${cIdx + 1}`));
            }
            if (claim.claim_id && !ledgerClaimIdSet.has(claim.claim_id.trim())) {
              errorDetails.push(`Claim '${claim.claim_id}' pada background_map tidak ditemukan di evidence_ledger.`);
            }
          } else if (claim.claim_type === "CROSS_SOURCE_SYNTHESIS") {
            const uniqueSources = Array.from(new Set(claim.source_ids || []));
            if (uniqueSources.length < 2) {
              errorDetails.push(
                `Background Map Bagian #${sIdx + 1}, Klaim #${cIdx + 1}: Sintesis lintas sumber wajib memuat minimal 2 source_id unik.`
              );
            } else {
              uniqueSources.forEach((sid) => checkUnknownSource(sid, `background_map Bagian #${sIdx + 1}, Klaim #${cIdx + 1}`));
            }
            if (claim.claim_id && !ledgerClaimIdSet.has(claim.claim_id.trim())) {
              errorDetails.push(`Claim '${claim.claim_id}' pada background_map tidak ditemukan di evidence_ledger.`);
            }
          } else if (claim.claim_type === "RESEARCHER_DECISION") {
            claim.source_ids = claim.source_ids || [];
            const basis = (claim.decision_basis || "").trim();
            if (!basis) {
              errorDetails.push(
                `Keputusan sementara mahasiswa pada background_map Bagian #${sIdx + 1} (${sec.function || "tanpa fungsi"}), Klaim #${cIdx + 1} (${claim.claim_id || "tanpa ID"}) belum memiliki dasar keputusan. Isi decision_basis dengan alasan konkret, misalnya hasil pemilihan arah, kecocokan data, batas waktu, atau arahan dosen.`
              );
            }
            // RESEARCHER_DECISION is not forced into evidence_ledger
          }

          // Link support_status from normalizedLedger or evaluate from canonical weights (Patch 1 & Patch 3)
          if (claim.claim_id) {
            const matchingLedger = normalizedLedger.find((el) => el.claim_id === claim.claim_id);
            if (matchingLedger?.support_status) {
              claim.support_status = matchingLedger.support_status;
            }
          }
          if (!claim.support_status && claim.source_ids && claim.source_ids.length > 0) {
            const allNeedCheck = claim.source_ids.every((sid) => {
              const clean = sid.replace(/[\[\]]/g, "").trim().toUpperCase();
              return (canonicalSourceWeightMap.get(clean) || "PERLU_DIPERIKSA") === "PERLU_DIPERIKSA";
            });
            if (allNeedCheck) {
              claim.support_status = "NEEDS_VERIFICATION";
            }
          }

          normalizedSafeClaims.push(claim);
        });
      }

      normalizedBackgroundMap.push({
        ...sec,
        safe_claims: normalizedSafeClaims,
      });
    });
  }

  if (errorDetails.length > 0) {
    return {
      success: false,
      error: "Data transfer Fondasi Bab 1 tidak lolos validasi skema.",
      errorDetails,
    };
  }

  const canonicalPhenStatus: import("@/types/tool").PhenomenonBasisStatus =
    context?.phenomenonBasisStatus ||
    payload.phenomenon_basis_status ||
    "VERIFIED_REAL_WORLD";

  if (
    payload.phenomenon_basis_status &&
    context?.phenomenonBasisStatus &&
    payload.phenomenon_basis_status !== context.phenomenonBasisStatus
  ) {
    warnings.push(
      `Status dasar fenomena pada output (${payload.phenomenon_basis_status}) diselaraskan kembali ke status Tool 4 (${context.phenomenonBasisStatus}).`
    );
  }

  const initialSanitized: Bab1FoundationV1 = {
    schema_version: 1,
    foundation_status: payload.foundation_status || "BAB1_CONDITIONAL",
    status_reason: payload.status_reason || "",
    blocking_items: Array.isArray(payload.blocking_items) ? payload.blocking_items : [],
    selected_direction: {
      id: payload.selected_direction!.id.trim(),
      name: payload.selected_direction!.name.trim(),
      student_selected: true,
      selection_reason: (payload.selected_direction!.selection_reason || "").trim(),
      direction_readiness: (payload.selected_direction!.direction_readiness || "LAYAK_DIPERIKSA").trim(),
      data_readiness: context?.dataReadiness || payload.selected_direction!.data_readiness || "DATA_CONDITIONAL",
    },
    problem_structure: payload.problem_structure as import("@/types/tool").Bab1ProblemStructure,
    research_logic_chain: payload.research_logic_chain as import("@/types/tool").ResearchLogicChainItem[],
    candidate_research_questions: payload.candidate_research_questions as import("@/types/tool").CandidateResearchQuestion[],
    candidate_objectives: payload.candidate_objectives as import("@/types/tool").CandidateObjective[],
    provisional_contributions: payload.provisional_contributions as import("@/types/tool").ProvisionalContributions,
    tentative_scope: payload.tentative_scope as import("@/types/tool").TentativeScope,
    working_title_previews: payload.working_title_previews as import("@/types/tool").WorkingTitlePreview[],
    background_map: normalizedBackgroundMap,
    evidence_ledger: normalizedLedger,
    feasibility_summary: payload.feasibility_summary || { confirmed_data: [], unconfirmed_data: [], unavailable_data: [], implications: [] },
    supervisor_questions: Array.isArray(payload.supervisor_questions) ? payload.supervisor_questions : [],
    unresolved_decisions: Array.isArray(payload.unresolved_decisions) ? payload.unresolved_decisions : [],
    prohibited_claims: Array.isArray(payload.prohibited_claims) ? payload.prohibited_claims : [],
    recovery_actions: Array.isArray(payload.recovery_actions) ? [...payload.recovery_actions] : [],
    phenomenon_basis_status: canonicalPhenStatus,
    academic_audit: payload.academic_audit,
    paragraph_claims: Array.isArray(payload.paragraph_claims) ? payload.paragraph_claims : undefined,
  };

  const finalNormalized = normalizeBab1Foundation(initialSanitized, context?.sourceWeights, {
    phenomenonBasisStatus: canonicalPhenStatus,
    dataReadiness: context?.dataReadiness,
    candidateGaps: context?.candidateGaps,
    warnings,
  });

  return {
    success: true,
    data: finalNormalized,
    warnings: finalNormalized.normalization_warnings,
    isNonCompliantWrapper,
  };
}

/**
 * Calculates deterministic data readiness status based on feasibility answers.
 */

// =========================================================================
// TAHAP 4C: PARSER & PEMERIKSA DRAF BAB 1 (Addendum B)
// =========================================================================

export interface Bab1DraftParseResult {
  success: boolean;
  data?: import("@/types/tool").Bab1DraftV1;
  error?: string;
  errorDetails?: string[];
  warnings?: string[];
  findings?: import("@/types/tool").DraftCheckFinding[];
}

/** Hitung kata: pisahkan pada whitespace, abaikan token kosong. */
export function hitungKata(teks: string): number {
  return (teks || "").trim().split(/\s+/).filter((w) => w.length > 0).length;
}

const FRASA_KLAIM_ABSOLUT = [
  "belum pernah diteliti",
  "tidak ada penelitian",
  "belum ada penelitian",
  "penelitian pertama",
  "satu-satunya penelitian",
  "pasti novel",
  "membuktikan bahwa",
  "terbukti secara universal",
];

const FRASA_GAP_SINTETIS = [
  "belum ada yang meneliti di",
  "belum pernah dilakukan di",
  "belum ada studi yang mengambil lokasi",
];

/** Guard sadar-negasi: frasa kausal di dalam kalimat pembatas klaim BUKAN pelanggaran. */
function frasaKausalTerlarang(kalimat: string): string | null {
  const bersih = (kalimat || "").replace(/\s+/g, " ").trim();
  const m = bersih.match(
    /(menyebabkan|mengakibatkan|berdampak signifikan terhadap|memengaruhi secara signifikan|berpengaruh signifikan terhadap)/i
  );
  if (!m) return null;
  const sebelum = bersih.slice(0, m.index || 0).toLowerCase();
  if (/\b(belum|tidak|jangan|dilarang|bukan|tanpa|hindari)\b/.test(sebelum)) return null;
  return m[1].toLowerCase();
}

/**
 * Memeriksa draf 4C terhadap Paket Fondasi 4B.
 * Temuan mengarahkan revisi; hanya CRITICAL yang menahan simpan.
 *
 * `registerSumber` opsional: register Tool 3 memuat nama penulis untuk sumber yang
 * TIDAK disebut `paragraph_claims` (kasus nyata: fondasi hanya menyebut S4 & S10,
 * sedangkan draf menyitasi S6–S9). Tanpa daftar ini, sitasi sah akan ditandai
 * sebagai karangan (alarm palsu).
 */
export function periksaDrafBab1(
  draft: import("@/types/tool").Bab1DraftV1,
  foundation: import("@/types/tool").Bab1FoundationV1,
  registerSumber?: { sourceId?: string; authorsYear?: string }[]
): import("@/types/tool").DraftCheckFinding[] {
  const findings: import("@/types/tool").DraftCheckFinding[] = [];
  const push = (f: import("@/types/tool").DraftCheckFinding) => findings.push(f);

  const ledgerById = new Map<string, import("@/types/tool").EvidenceLedgerItem>();
  (foundation.evidence_ledger || []).forEach((el) => {
    if (el.claim_id) ledgerById.set(el.claim_id.replace(/[\[\]]/g, "").trim().toUpperCase(), el);
  });

  // Kumpulan sitasi yang SAH: ID sumber + penulis-tahun dari paket bukti & register.
  // Dipakai untuk menandai sitasi yang tidak punya pasangan — kandidat karangan AI.
  //
  // Pencocokan per TOKEN NAMA + TAHUN, bukan string utuh: draf lazim menyingkat nama
  // ("Chen & Wang, 2024" untuk "Yue Chen & Kan Wang") dan menggabung beberapa sumber
  // dalam satu kurung ("(A, 2024; B, 2025)"). Pencocokan string utuh membuat sitasi
  // seperti itu SELALU dituduh karangan — sumber alarm palsu yang dilaporkan Aul.
  const idSitasiSah = new Set<string>(); // "s4", "src-7"
  const idBuktiSah = new Set<string>(); // "1" dari "(Bukti 1)"
  const tahuId = (t: string) => idSitasiSah.has(t) || idBuktiSah.has(t);
  const tambahId = (sid?: string) => {
    const bersih = (sid || "").replace(/[\[\]]/g, "").trim().toLowerCase();
    if (!bersih) return;
    if (/^bukti\b/.test(bersih) || /^\d+$/.test(bersih)) idBuktiSah.add(bersih.replace(/^bukti[\s-]*/, ""));
    else idSitasiSah.add(bersih);
  };
  const entitasSah: EntitasSitasi[] = [];
  const tambahEntitas = (nama?: string) => {
    const e = penulisSah(nama);
    if (e) entitasSah.push(e);
  };
  (foundation.paragraph_claims || []).forEach((pc) => {
    (pc.sourceIds || []).forEach((sid) => tambahId(sid));
    (pc.sourceReferences || []).forEach((ref) => tambahEntitas(ref?.authorsYear));
  });
  // Nama dari register Tool 3 juga sah — sumber ini benar-benar dipakai mahasiswa.
  // Register menulis "Nama (2023)" di satu sel sedangkan draf menyitasi "(Nama, 2023)";
  // pencocokan token menyeragamkan keduanya.
  (registerSumber || []).forEach((s) => {
    tambahId(s.sourceId);
    tambahEntitas(s.authorsYear);
  });
  // ID sumber di Catatan Bukti juga sah — menyitasi ID ledger bukan karangan.
  (foundation.evidence_ledger || []).forEach((el) => {
    (el.source_ids || (el.source_id ? [el.source_id] : [])).forEach((sid) => tambahId(sid));
  });

  const totalKata = (draft.background || []).reduce((acc, p) => acc + hitungKata(p.paragraph_text || ""), 0);

  if (totalKata < 1000 || totalKata > 1300) {
    push({
      code: "WORD_COUNT_OUT_OF_RANGE",
      severity: "MAJOR",
      message: `Draf berisi ${totalKata} kata, di luar rentang 1000–1300 kata yang diminta.`,
      location: "Latar belakang",
    });
  }
  if (draft.word_count_total && Math.abs(draft.word_count_total - totalKata) > 25) {
    push({
      code: "WORD_COUNT_MISMATCH",
      severity: "MINOR",
      message: `Jumlah kata yang dilaporkan AI (${draft.word_count_total}) berbeda dari hitungan sebenarnya (${totalKata}).`,
      location: "word_count_total",
    });
  }

  const mapFungsi = new Map<string, import("@/types/tool").BackgroundMapItemV2>();
  (foundation.background_map || []).forEach((sec) => mapFungsi.set(sec.function, sec));
  const fungsiPeta = Array.from(mapFungsi.keys());
  const fungsiDraf: string[] = (draft.background || []).map((p) => p.function);
  const hilang = fungsiPeta.filter((f) => !fungsiDraf.includes(f));
  const tambahan = fungsiDraf.filter((f) => !fungsiPeta.includes(f));
  if (hilang.length > 0 || tambahan.length > 0) {
    push({
      code: "PARAGRAPH_FUNCTION_MISMATCH",
      severity: "MAJOR",
      message: `Susunan paragraf draf tidak sama dengan peta 4B.${hilang.length ? ` Belum ditulis: ${hilang.join(", ")}.` : ""}${tambahan.length ? ` Tidak ada di peta: ${tambahan.join(", ")}.` : ""}`,
      location: "Latar belakang",
    });
  }

  (draft.background || []).forEach((p) => {
    const lokasi = `Paragraf ${p.order} (${p.function})`;
    const sec = mapFungsi.get(p.function);

    if (sec && sec.readiness === "BLOCKED") {
      push({
        code: "BLOCKED_SECTION_WRITTEN",
        severity: "CRITICAL",
        message: `${lokasi} ditulis padahal peta 4B menandainya BLOCKED. Hapus paragraf ini atau selesaikan dulu dasar fenomenanya.`,
        location: lokasi,
      });
    }

    (p.claim_ids || []).forEach((rawId) => {
      const id = (rawId || "").replace(/[\[\]]/g, "").trim().toUpperCase();
      const el = ledgerById.get(id);
      if (!el) {
        push({
          code: "CLAIM_ID_UNKNOWN",
          severity: "CRITICAL",
          message: `${lokasi} memakai ${rawId} yang tidak ada di Catatan Bukti 4B. Klaim tanpa bukti tidak boleh masuk draf.`,
          location: lokasi,
        });
        return;
      }
      if (el.support_status === "DO_NOT_USE") {
        push({
          code: "CLAIM_STATUS_DO_NOT_USE",
          severity: "CRITICAL",
          message: `${lokasi} memakai ${rawId} yang berstatus DO_NOT_USE.`,
          location: lokasi,
        });
      } else if (el.support_status === "NEEDS_VERIFICATION") {
        push({
          code: "CLAIM_STATUS_NEEDS_VERIFICATION",
          severity: "MAJOR",
          message: `${lokasi} memakai ${rawId} yang masih NEEDS_VERIFICATION. Periksa sumbernya dulu, atau tandai sebagai keterbatasan.`,
          location: lokasi,
        });
      }
    });

    const teks = p.paragraph_text || "";
    const kalimat = teks.split(/(?<=[.!?])\s+/);
    kalimat.forEach((k) => {
      const rendah = k.toLowerCase();
      FRASA_KLAIM_ABSOLUT.forEach((frasa) => {
        if (rendah.includes(frasa)) {
          push({
            code: "ABSOLUTE_CLAIM_PHRASE",
            severity: "MAJOR",
            message: `${lokasi} memuat klaim absolut: "${frasa}".`,
            location: lokasi,
          });
        }
      });
      FRASA_GAP_SINTETIS.forEach((frasa) => {
        if (rendah.includes(frasa)) {
          push({
            code: "SYNTHETIC_GAP_PHRASE",
            severity: "MAJOR",
            message: `${lokasi} memuat frasa gap sintetis: "${frasa}".`,
            location: lokasi,
          });
        }
      });
      const kausal = frasaKausalTerlarang(k);
      if (kausal) {
        push({
          code: "CAUSAL_CLAIM_FROM_CORRELATION",
          severity: "MAJOR",
          message: `${lokasi} menyatakan hubungan sebab-akibat ("${kausal}") padahal desain penelitian ini dokumenter/deskriptif.`,
          location: lokasi,
        });
      }
    });

    (foundation.prohibited_claims || []).forEach((pc) => {
      const inti = (pc || "").toLowerCase().replace(/[.!?]/g, "").trim();
      if (inti.length >= 15 && teks.toLowerCase().includes(inti)) {
        push({
          code: "PROHIBITED_CLAIM_PHRASE",
          severity: "CRITICAL",
          message: `${lokasi} menulis klaim yang dilarang pada peta 4B: "${pc}".`,
          location: lokasi,
        });
      }
    });

    // Sitasi yang tidak punya pasangan di Catatan Bukti = kandidat karangan.
    // Pencocokan per BAGIAN sitasi (dipisah `;`) dan per token nama+TAHUN, bukan string
    // utuh: nama boleh disingkat, digabung dalam satu kurung, atau ditulis lengkap.
    // Kalau ragu, jangan lapor — alarm palsu membuat mahasiswa mengabaikan panelnya.
    const asli = new Map<string, string>();
    (teks.match(/\([^()]{2,60}?\b(19|20)\d{2}[a-z]?\)/g) || []).forEach((x) =>
      asli.set(x.toLowerCase().replace(/\s+/g, " ").trim(), x.trim())
    );
    const tidakDikenal: string[] = [];
    ambilSitasi(teks).forEach((sit) => {
      const isi = sit.replace(/^\(|\)$/g, "").trim();
      const adaYangTidakDikenal = isi
        .split(";")
        .map((b) => b.trim())
        .filter(Boolean)
        .some((bagian) => {
          const { nama, tahun } = tokenSitasi(bagian);
          // Tanpa nama penulis sama sekali (hanya ID/tahun), cocokkan ke daftar ID.
          if (nama.length === 0) return !idBagianSah(bagian, tahuId);
          // Tidak ada nama pembanding di paket bukti → tidak bisa dinilai, jangan tuduh.
          if (entitasSah.length === 0) return false;
          return !cocokEntitas(nama, tahun, entitasSah);
        });
      if (adaYangTidakDikenal) tidakDikenal.push(asli.get(sit) || sit);
    });
    tidakDikenal.forEach((sitAsli) => {
      push({
        code: "CITATION_UNKNOWN_SOURCE",
        severity: "MAJOR",
        message: `${lokasi} memuat sitasi "${sitAsli}" yang belum ditemukan di paket bukti. Cocokkan ke daftar sumbermu sebelum draf dipakai.`,
        location: lokasi,
      });
    });

    const pakaiSitasi = /\((?:[^)]*)(?:19|20)\d{2}[^)]*\)|\bSRC-\d+|\bBukti \d+/.test(teks);
    if (p.function === "URGENCY_AND_DIRECTION" && pakaiSitasi) {
      push({
        code: "CITATION_ON_RESEARCHER_DECISION",
        severity: "MAJOR",
        message: `${lokasi} adalah keputusan mahasiswa; jangan diberi sitasi seolah-olah temuan jurnal.`,
        location: lokasi,
      });
    }
  });

  const dipakai = new Set((draft.used_claim_ids || []).map((x) => (x || "").replace(/[\[\]]/g, "").trim().toUpperCase()));
  (draft.background || []).forEach((p) => (p.claim_ids || []).forEach((c) => dipakai.add((c || "").trim().toUpperCase())));

  ledgerById.forEach((el, id) => {
    if (el.support_status === "READY_TO_DRAFT" && !dipakai.has(id)) {
      push({
        code: "LEDGER_CLAIM_UNUSED",
        severity: "MINOR",
        message: `Klaim ${el.claim_id} siap ditulis tapi belum dipakai di draf.`,
        location: "Catatan Bukti",
      });
    }
  });

  const unik = new Map<string, import("@/types/tool").DraftCheckFinding>();
  findings.forEach((f) => {
    const kunci = `${f.code}|${f.location || ""}|${f.message}`;
    if (!unik.has(kunci)) unik.set(kunci, f);
  });
  return Array.from(unik.values());
}

/** Memproses blok transfer 4C SKRIFLOW_BAB1_DRAFT_V1. */
/**
 * Tahap 4D (Addendum C): parser hasil poles bahasa.
 * Skema SKRIFLOW_BAB1_POLISH_V1. Isi wajib identik dengan draf 4C.
 */
export interface Bab1PolishParseResult {
  success: boolean;
  data?: import("@/types/tool").Bab1PolishV1;
  error?: string;
  errorDetails?: string[];
  warnings?: string[];
  findings?: import("@/types/tool").PolishCheckFinding[];
}

export function parseBab1PolishTransfer(rawText: string): Bab1PolishParseResult {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return { success: false, error: "Teks output masih kosong.", errorDetails: ["Tempelkan output Tahap 4D dari ChatGPT."] };
  }

  const startMarker = "=== BEGIN SKRIFLOW_BAB1_POLISH_V1 ===";
  const endMarker = "=== END SKRIFLOW_BAB1_POLISH_V1 ===";
  const startIndex = rawText.indexOf(startMarker);
  const endIndex = rawText.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return {
      success: false,
      error: "Blok data hasil poles Bab 1 tidak ditemukan.",
      errorDetails: ["Pastikan output memuat penanda persis:", startMarker, "...", endMarker],
    };
  }

  const jsonString = rawText.substring(startIndex + startMarker.length, endIndex).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: "Format JSON hasil poles tidak valid.", errorDetails: [`Gagal membaca JSON di antara marker: ${msg}`] };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { success: false, error: "Payload hasil poles harus berupa objek JSON valid." };
  }

  const payload = parsed as Partial<import("@/types/tool").Bab1PolishV1>;
  const errorDetails: string[] = [];

  if (payload.schema_version !== 1) errorDetails.push("schema_version wajib bernilai angka 1.");
  if (!Array.isArray(payload.background) || payload.background.length === 0) {
    errorDetails.push("background wajib berisi minimal satu paragraf.");
  }

  if (errorDetails.length > 0) {
    return { success: false, error: "Struktur hasil poles belum memenuhi standar SKRIFLOW_BAB1_POLISH_V1.", errorDetails };
  }

  const data: import("@/types/tool").Bab1PolishV1 = {
    schema_version: 1,
    polish_status: payload.polish_status || "POLISH_PARTIAL",
    draft_status_ref: payload.draft_status_ref || "DRAFT_PARTIAL",
    foundation_status_ref: payload.foundation_status_ref || "BAB1_CONDITIONAL",
    word_count_total: typeof payload.word_count_total === "number" ? payload.word_count_total : 0,
    target_words_total: typeof payload.target_words_total === "number" ? payload.target_words_total : 1150,
    background: (payload.background || []).map((p, idx) => ({
      order: typeof p.order === "number" ? p.order : idx + 1,
      function: p.function as import("@/types/tool").BackgroundParagraphFunction,
      paragraph_text: p.paragraph_text || "",
      word_count: hitungKata(p.paragraph_text || ""),
      claim_ids: Array.isArray(p.claim_ids) ? [...p.claim_ids] : [],
      researcher_decision_note: p.researcher_decision_note ?? null,
      withheld_claims: Array.isArray(p.withheld_claims) ? [...p.withheld_claims] : [],
    })),
    language_changes: Array.isArray(payload.language_changes) ? [...payload.language_changes] : [],
    preserved_claim_ids: Array.isArray(payload.preserved_claim_ids) ? [...payload.preserved_claim_ids] : [],
    removed_claims: Array.isArray(payload.removed_claims) ? [...payload.removed_claims] : [],
    prohibited_claims_respected: Array.isArray(payload.prohibited_claims_respected) ? [...payload.prohibited_claims_respected] : [],
    unresolved_notes: Array.isArray(payload.unresolved_notes) ? [...payload.unresolved_notes] : [],
  };

  return { success: true, data };
}

/** Pola angka di teks: menangkap 1.234, 12,5%, 2025, dsb. */
function ambilAngka(teks: string): Set<string> {
  const hasil = new Set<string>();
  const m = teks.match(/\d[\d.,]*/g) || [];
  m.forEach((x) => {
    const bersih = x.replace(/[.,]+$/, "");
    if (bersih.replace(/\D/g, "").length >= 2) hasil.add(bersih);
  });
  return hasil;
}

/** Satu sumber sah dari paket bukti, dipecah jadi token nama-keluarga + tahun. */
interface EntitasSitasi {
  nama: string[];
  tahun: string | null;
}

/** Token huruf kecil: tanda baca & "et al." dibuang supaya "Wang," == "Wang". */
function tokenNama(teks: string): string[] {
  return (teks || "")
    .toLowerCase()
    .replace(/\bet al\.?/g, " ")
    .replace(/[^a-z\u00c0-\u024f\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

/**
 * Pecah nama penulis tahun dari register/paket bukti.
 * Menerima dua bentuk nyata: register Tool 3 "Yue Chen & Kan Wang (2024)"
 * dan `paragraph_claims.sourceReferences` "Desy Nur Shafitri et al., 2024".
 */
function penulisSah(authorsYear?: string): EntitasSitasi | null {
  const mentah = (authorsYear || "").trim();
  if (!mentah || mentah.startsWith("[")) return null;
  const m = mentah.match(/\(?(19|20)\d{2}[a-z]?\)?/);
  const tahun = m ? m[0].replace(/[()]/g, "").toLowerCase() : null;
  const nama = m && m.index !== undefined
    ? mentah.slice(0, m.index) + " " + mentah.slice(m.index + m[0].length)
    : mentah;
  const tokens = tokenNama(nama);
  if (tokens.length === 0) return null;
  return { nama: tokens, tahun };
}

/** Token nama & tahun dari satu bagian sitasi ("Chen & Wang, 2024"). */
function tokenSitasi(bagian: string): { nama: string[]; tahun: string[] } {
  const rendah = (bagian || "").toLowerCase();
  const tahun = [...rendah.matchAll(/\b(19|20)\d{2}[a-z]?\b/g)].map((x) => x[0]);
  const nama = tokenNama(rendah.replace(/\b(19|20)\d{2}[a-z]?\b/g, " "));
  return { nama, tahun };
}

/** Bagian sitasi tanpa nama penulis: sah hanya kalau kuncinya ada di daftar ID. */
function idBagianSah(bagian: string, tahuId: (t: string) => boolean): boolean {
  const kata = (bagian || "").toLowerCase().replace(/[(),]/g, " ").trim().split(/\s+/).filter(Boolean);
  return kata.some((k, i) => tahuId(k) || tahuId(kata.slice(0, i + 1).join(" ")));
}

/** Bandingkan tahun tanpa huruf penanda ("2024a" == "2024"). */
const tahunDasar = (t: string) => (t || "").replace(/[^0-9]/g, "");

/**
 * Cocokkan satu bagian sitasi ke daftar sumber sah.
 *
 * Aturan "kalau ragu, anggap sah": minimal satu token nama bagian itu harus muncul di
 * salah satu entitas sumber. Tahun jadi penguat saat entitas punya tahun, tapi tahun
 * yang tidak sama sendirian TIDAK cukup untuk menuduh (preprint/terbitan berbeda tahun
 * itu kasus nyata). Nama yang tidak menempel sama sekali baru dilaporkan.
 */
function cocokEntitas(nama: string[], tahun: string[], entitasSah: EntitasSitasi[]): boolean {
  return entitasSah.some((e) => {
    if (!nama.some((t) => e.nama.includes(t))) return false;
    if (e.tahun && tahun.length > 0) return tahun.map(tahunDasar).includes(tahunDasar(e.tahun));
    return true;
  });
}

/**
 * Pola sitasi penulis-tahun, mis. (Ramayana, 2025) atau (PSAK 117, 2024).
 * Rentang tahun "(2016–2022)" / "(2022–2024)" DITOLAK di sini: pola "tahun di dalam
 * kurung" saja terlalu longgar dan membuat periode penelitian dilaporkan sebagai sitasi.
 */
function ambilSitasi(teks: string): Set<string> {
  const hasil = new Set<string>();
  const m = teks.match(/\([^()]{2,60}?\b(19|20)\d{2}[a-z]?\)/g) || [];
  m.forEach((x) => {
    const bersih = x.toLowerCase().replace(/\s+/g, " ").trim();
    if (!/[a-z]{3}/.test(bersih)) return;
    hasil.add(bersih);
  });
  return hasil;
}

/**
 * Tahap 4D (Addendum C): pemeriksa perubahan bahasa.
 * Membandingkan draf hasil 4D dengan draf 4C. Menilai APA YANG BERUBAH,
 * bukan apa yang sah — kepatuhan bukti tetap milik periksaDrafBab1 (Tahap 9).
 */
export function periksaPolesBab1(
  hasil: import("@/types/tool").Bab1PolishV1,
  sumber: import("@/types/tool").Bab1DraftV1
): import("@/types/tool").PolishCheckFinding[] {
  const findings: import("@/types/tool").PolishCheckFinding[] = [];
  const push = (f: import("@/types/tool").PolishCheckFinding) => findings.push(f);

  const asal = sumber.background || [];
  const kini = hasil.background || [];

  if (asal.length !== kini.length) {
    push({
      code: "POLISH_PARAGRAPH_COUNT_CHANGED",
      severity: "CRITICAL",
      message: `Jumlah paragraf berubah dari ${asal.length} (draf 4C) menjadi ${kini.length} (hasil 4D).`,
      location: "background",
    });
  }

  const normalId = (x: string) => x.replace(/[\[\]]/g, "").trim().toUpperCase();

  for (let i = 0; i < Math.min(asal.length, kini.length); i++) {
    const a = asal[i];
    const b = kini[i];
    const lokasi = `Paragraf ${b.order ?? i + 1}`;

    if (a.order !== b.order || a.function !== b.function) {
      push({
        code: "POLISH_PARAGRAPH_ORDER_CHANGED",
        severity: "CRITICAL",
        message: `${lokasi}: urutan/fungsi berubah dari ${a.order}/${a.function} menjadi ${b.order}/${b.function}.`,
        location: lokasi,
      });
    }

    const idA = (a.claim_ids || []).map(normalId).sort().join(",");
    const idB = (b.claim_ids || []).map(normalId).sort().join(",");
    if (idA !== idB) {
      push({
        code: "POLISH_CLAIM_IDS_CHANGED",
        severity: "CRITICAL",
        message: `${lokasi}: claim_ids tidak identik dengan draf 4C (${idA || "kosong"} -> ${idB || "kosong"}).`,
        location: lokasi,
      });
    }

    const teksA = a.paragraph_text || "";
    const teksB = b.paragraph_text || "";

    if (teksA.trim() === teksB.trim()) {
      push({
        code: "POLISH_NO_CHANGES",
        severity: "MINOR",
        message: `${lokasi}: tidak ada perubahan bahasa sama sekali.`,
        location: lokasi,
      });
      continue;
    }

    const angkaA = ambilAngka(teksA);
    const angkaB = ambilAngka(teksB);
    const angkaBaru = [...angkaB].filter((x) => !angkaA.has(x));
    if (angkaBaru.length > 0) {
      push({
        code: "POLISH_NEW_NUMBER",
        severity: "MAJOR",
        message: `${lokasi}: muncul angka baru yang tidak ada di draf 4C: ${angkaBaru.join(", ")}.`,
        location: lokasi,
      });
    }

    const sitA = ambilSitasi(teksA);
    const sitB = ambilSitasi(teksB);
    const sitBaru = [...sitB].filter((x) => !sitA.has(x));
    if (sitBaru.length > 0) {
      push({
        code: "POLISH_NEW_CITATION",
        severity: "MAJOR",
        message: `${lokasi}: muncul sitasi baru yang tidak ada di draf 4C: ${sitBaru.join("; ")}.`,
        location: lokasi,
      });
    }

    const rendahA = teksA.toLowerCase();
    const rendahB = teksB.toLowerCase();
    const absolutBaru = FRASA_KLAIM_ABSOLUT.filter((f) => rendahB.includes(f) && !rendahA.includes(f));
    if (absolutBaru.length > 0) {
      push({
        code: "POLISH_NEW_ABSOLUTE_PHRASE",
        severity: "MAJOR",
        message: `${lokasi}: muncul frasa absolut baru: ${absolutBaru.join("; ")}.`,
        location: lokasi,
      });
    }

    const kataA = hitungKata(teksA);
    const kataB = hitungKata(teksB);
    if (kataA > 0 && Math.abs(kataB - kataA) / kataA > 0.25) {
      push({
        code: "POLISH_WORD_DRIFT",
        severity: "MINOR",
        message: `${lokasi}: panjang bergeser dari ${kataA} ke ${kataB} kata (>25%).`,
        location: lokasi,
      });
    }
  }

  return findings;
}

export function parseBab1DraftTransfer(
  rawText: string,
  context?: { foundation?: import("@/types/tool").Bab1FoundationV1 }
): Bab1DraftParseResult {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return { success: false, error: "Teks output masih kosong.", errorDetails: ["Tempelkan output Tahap 4C dari ChatGPT/Gemini."] };
  }

  const startMarker = "=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===";
  const endMarker = "=== END SKRIFLOW_BAB1_DRAFT_V1 ===";
  const startIndex = rawText.indexOf(startMarker);
  const endIndex = rawText.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return {
      success: false,
      error: "Blok data draf Bab 1 tidak ditemukan.",
      errorDetails: ["Pastikan output memuat penanda persis:", startMarker, "...", endMarker],
    };
  }

  const jsonString = rawText.substring(startIndex + startMarker.length, endIndex).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: "Format JSON draf Bab 1 tidak valid.", errorDetails: [`Gagal membaca JSON di antara marker: ${msg}`] };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { success: false, error: "Payload draf harus berupa objek JSON valid." };
  }

  const payload = parsed as Partial<import("@/types/tool").Bab1DraftV1>;
  const errorDetails: string[] = [];

  if (payload.schema_version !== 1) errorDetails.push("schema_version wajib bernilai angka 1.");
  if (!Array.isArray(payload.background) || payload.background.length === 0) {
    errorDetails.push("background wajib berisi minimal satu paragraf.");
  }

  if (errorDetails.length > 0) {
    return { success: false, error: "Struktur draf Bab 1 belum memenuhi standar SKRIFLOW_BAB1_DRAFT_V1.", errorDetails };
  }

  const data: import("@/types/tool").Bab1DraftV1 = {
    schema_version: 1,
    draft_status: payload.draft_status || "DRAFT_PARTIAL",
    foundation_status_ref: payload.foundation_status_ref || "BAB1_CONDITIONAL",
    word_count_total: typeof payload.word_count_total === "number" ? payload.word_count_total : 0,
    target_words_total: typeof payload.target_words_total === "number" ? payload.target_words_total : 1150,
    background: (payload.background || []).map((p, idx) => ({
      order: typeof p.order === "number" ? p.order : idx + 1,
      function: p.function as import("@/types/tool").BackgroundParagraphFunction,
      paragraph_text: p.paragraph_text || "",
      word_count: hitungKata(p.paragraph_text || ""),
      claim_ids: Array.isArray(p.claim_ids) ? [...p.claim_ids] : [],
      researcher_decision_note: p.researcher_decision_note ?? null,
      withheld_claims: Array.isArray(p.withheld_claims) ? [...p.withheld_claims] : [],
    })),
    skipped_sections: Array.isArray(payload.skipped_sections) ? [...payload.skipped_sections] : [],
    used_claim_ids: Array.isArray(payload.used_claim_ids) ? [...payload.used_claim_ids] : [],
    avoided_claims: Array.isArray(payload.avoided_claims) ? [...payload.avoided_claims] : [],
    consistency_notes: Array.isArray(payload.consistency_notes) ? [...payload.consistency_notes] : [],
    prohibited_claims_respected: Array.isArray(payload.prohibited_claims_respected) ? [...payload.prohibited_claims_respected] : [],
    unresolved_notes: Array.isArray(payload.unresolved_notes) ? [...payload.unresolved_notes] : [],
  };

  const findings = context?.foundation ? periksaDrafBab1(data, context.foundation) : [];
  const warnings = findings.filter((f) => f.severity !== "CRITICAL").map((f) => f.message);

  return { success: true, data, findings, warnings };
}

export function calculateDataReadiness(
  questions: DataVerificationQuestionV2[],
  answers: Record<string, FeasibilityAnswerStatus>,
  accessNotes: string
): DataReadinessOutcome {
  if (!questions || questions.length === 0) {
    return (accessNotes || "").trim().length > 0 ? "DATA_READY" : "DATA_CONDITIONAL";
  }

  // Hard-block ONLY applies when at least one critical data need is TIDAK_TERSEDIA
  const hasCriticalUnavailable = questions.some((q) => q.critical && answers[q.id] === "TIDAK_TERSEDIA");
  if (hasCriticalUnavailable) {
    return "DATA_BLOCKED";
  }

  // Non-critical data need marked TIDAK_TERSEDIA degrades to CONDITIONAL, not BLOCKED
  const hasNonCriticalUnavailable = questions.some((q) => !q.critical && answers[q.id] === "TIDAK_TERSEDIA");
  if (hasNonCriticalUnavailable) {
    return "DATA_CONDITIONAL";
  }

  const criticalQuestions = questions.filter((q) => q.critical);
  const allCriticalConfirmed =
    criticalQuestions.length === 0 ||
    criticalQuestions.every((q) => answers[q.id] === "SUDAH_DIPASTIKAN");

  const hasAccessNote = (accessNotes || "").trim().length > 0;

  if (allCriticalConfirmed && hasAccessNote) {
    return "DATA_READY";
  }

  return "DATA_CONDITIONAL";
}

/**
 * Generates prompt to fix format for Tahap 4A.
 */
export function generateBedahFixFormatPrompt4A(rawText: string, errorDetails?: string[]): string {
  return `Format output yang kamu berikan belum terbaca dengan sempurna oleh sistem SKRIFLOW.

Perbaiki hanya format penulisan tanpa mengubah temuan akademik, analisis bukti, gap, atau arah penelitian.

Aturan Perbaikan:
1. Bungkus seluruh data JSON valid di antara penanda persis berikut:
=== BEGIN SKRIFLOW_DIRECTION_V2 ===
{JSON}
=== END SKRIFLOW_DIRECTION_V2 ===
2. Gunakan JSON murni tanpa Markdown code fence (\`\`\`json).
3. Jangan menambahkan pengantar, penjelasan, atau penutup di luar penanda.
4. Gunakan double quotes dan pastikan tidak ada trailing comma.

Detail kendala format sebelumnya:
${(errorDetails || []).map((d) => `- ${d}`).join("\n")}

Berikut adalah teks output sebelumnya yang perlu diformat ulang:
${rawText}`;
}

/**
 * Penerjemah galat validasi Tahap 4A ke bahasa mahasiswa.
 *
 * Alasan: pesan galat 4A berbunyi "Data transfer V2 tidak lolos validasi skema: ..."
 * dan tampil sebagai deretan tulisan teknis merah — mahasiswa mengira aplikasinya
 * rusak, padahal isinya cuma "jawaban AI belum lengkap, kirim ulang". Fungsi murni
 * supaya bisa diuji tanpa browser.
 */
export interface Galat4ADijelaskan {
  judul: string;
  artinya: string;
  kenapaDitolak: string;
}

export function jelaskanGalat4A(details: string[]): Galat4ADijelaskan {
  const d = details.join(" ").toLowerCase();
  const n = details.length;

  if (d.includes("anchor_source_ids") || d.includes("anchor_source_id '")) {
    if (d.includes("tidak ada di source register")) {
      return {
        judul: "AI memakai sumber yang tidak ada di paket buktimu",
        artinya:
          "Tiap arah penelitian wajib menyebut \"sumber jangkar\": sumber di paket buktimu yang jadi dasar arah itu. AI menulis kode sumber (mis. S99) yang tidak ada di paket buktimu.",
        kenapaDitolak:
          "Skriflow menolak ID yang tidak ada di paket supaya arah penelitianmu bisa ditelusuri sampai sumber aslinya. Sumber karangan membuat arah itu terlihat berdasar padahal tidak.",
      };
    }
    return {
      judul: "AI belum menyebutkan sumber pijakan untuk arah penelitiannya",
      artinya:
        "Setiap arah penelitian wajib punya \"sumber jangkar\": sumber di paket buktimu yang jadi dasar arah itu. AI tidak mengisinya.",
      kenapaDitolak:
        "Skriflow menolak supaya arah penelitianmu bisa ditelusuri sampai sumber aslinya. Kalau bagian ini dibiarkan kosong, dosen tidak bisa memeriksa dari mana arah itu muncul.",
    };
  }
  if (d.includes("gap_ids") || d.includes("candidate_gaps")) {
    return {
      judul: "AI belum menghubungkan arah penelitian dengan celah penelitiannya",
      artinya:
        "Tiap arah harus menyebut celah penelitian (gap) yang jadi alasannya, dan setiap celah wajib punya sumber pendukung dari paket buktimu.",
      kenapaDitolak:
        "Skriflow menolak arah yang tidak punya celah jelas, supaya kamu tidak menulis latar belakang di atas alasan yang tidak berdasar.",
    };
  }
  if (d.includes("blok data transfer tidak ditemukan") || d.includes("format json")) {
    return {
      judul: "Sistem belum menemukan bagian data di jawaban AI",
      artinya:
        "Jawaban AI belum memuat blok data dengan penanda yang benar, atau penandanya ikut rusak waktu disalin.",
      kenapaDitolak:
        "Skriflow hanya bisa membaca satu blok data bertanda. Tanpa penanda itu, isi jawabannya tidak bisa dipakai.",
    };
  }
  return {
    judul: `Jawaban AI belum lengkap — ${n} bagian yang kurang`,
    artinya:
      "AI melewati sebagian bagian yang diwajibkan, jadi hasilnya belum bisa diproses Skriflow.",
    kenapaDitolak:
      "Skriflow menolak jawaban yang belum lengkap supaya hasil analisisnya bisa ditelusuri, bukan sekadar diterima.",
  };
}

/**
 * Generates prompt to fix structure for Tahap 4A.
 */
export function generateBedahFixStructurePrompt4A(rawText: string, errorDetails?: string[]): string {
  return `Struktur data pada output yang kamu berikan belum memenuhi skema evaluasi akademik SKRIFLOW_DIRECTION_V2.

Perbaiki struktur JSON berikut dengan melengkapi field yang hilang:
${(errorDetails || []).map((d) => `- ${d}`).join("\n")}

Pastikan:
- automatic_selection bernilai false
- candidate_gaps memuat 1–4 gap dengan source_ids
- directions memuat 2–4 arah penelitian dengan gap_ids dan data_verification_questions
- SETIAP arah memuat anchor_source_ids berisi minimal 1 ID sumber yang PERSIS ada di Source Register/source_weights (jangan mengarang ID, jangan dikosongkan)
- Hasil dibungkus di antara:
=== BEGIN SKRIFLOW_DIRECTION_V2 ===
{JSON}
=== END SKRIFLOW_DIRECTION_V2 ===

Teks sebelumnya:
${rawText}`;
}

/**
 * Generates prompt to fix format for Tahap 4B.
 */
export function generateBab1FoundationFixFormatPrompt(rawText: string, errorDetails?: string[]): string {
  return `Format output Susun Fondasi Bab 1 belum terbaca dengan sempurna oleh sistem SKRIFLOW.

Perbaiki hanya format penulisan tanpa mengubah isi rumusan masalah, tujuan, peta latar belakang, atau evidence ledger.

Aturan Perbaikan:
1. Bungkus seluruh data JSON valid di antara penanda persis berikut:
=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===
{JSON}
=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===
2. Gunakan JSON murni tanpa Markdown code fence.
3. Jangan menambahkan teks di luar penanda.

Detail kendala format:
${(errorDetails || []).map((d) => `- ${d}`).join("\n")}

Teks sebelumnya:
${rawText}`;
}

/**
 * Generates prompt to fix structure for Tahap 4B.
 */
export function generateBab1FoundationFixStructurePrompt(rawText: string, errorDetails?: string[]): string {
  return `Struktur data pada Paket Fondasi Bab 1 belum memenuhi standar SKRIFLOW_BAB1_FOUNDATION_V1.

Perbaiki struktur JSON berikut dengan melengkapi field yang kurang:
${(errorDetails || []).map((d) => `- ${d}`).join("\n")}

Pastikan:
- background_map memuat tepat 7–9 bagian narasi latar belakang
- setiap safe_claim jenis EMPIRICAL_FACT atau CROSS_SOURCE_SYNTHESIS memuat source_ids dan claim_id yang terdaftar di evidence_ledger
- safe_claim jenis RESEARCHER_DECISION memuat decision_basis (source_ids boleh kosong)
- candidate_research_questions dan candidate_objectives berpasangan 1-ke-1 (maks 3)
- working_title_previews maksimal 3
- Hasil dibungkus di antara:
=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===
{JSON}
=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===

Teks sebelumnya:
${rawText}`;
}


/** Memperbaiki format penulisan blok draf 4C. */
export function generateBab1DraftFixFormatPrompt(rawText: string, errorDetails?: string[]): string {
  return `Format output Draf Bab 1 belum terbaca dengan sempurna oleh sistem SKRIFLOW.

Perbaiki HANYA format penulisan. Jangan mengubah isi paragraf, jangan menambah klaim, jangan menambah sitasi.

Aturan Perbaikan:
1. Bungkus seluruh data JSON valid di antara penanda persis berikut:
=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===
{JSON}
=== END SKRIFLOW_BAB1_DRAFT_V1 ===
2. Gunakan JSON murni tanpa Markdown code fence.
3. Jangan menambahkan teks di luar penanda.
4. Pertahankan seluruh claim_ids apa adanya. Jangan mengarang claim_id baru.

Detail kendala format:
${(errorDetails || []).map((d) => `- ${d}`).join("\n")}

Teks sebelumnya:
${rawText}`;
}

/** Melengkapi struktur draf 4C bila ada field yang kurang. */
export function generateBab1DraftFixStructurePrompt(rawText: string, errorDetails?: string[]): string {
  return `Struktur data pada Draf Bab 1 belum memenuhi standar SKRIFLOW_BAB1_DRAFT_V1.

Perbaiki struktur JSON berikut dengan melengkapi field yang kurang, tanpa mengubah isi prosa:

${(errorDetails || []).map((d) => `- ${d}`).join("\n")}

Pastikan:
- schema_version bernilai 1
- background memuat satu objek per fungsi peta 4B, urut sesuai peta
- setiap paragraf memuat paragraph_text (prosa jadi) dan claim_ids
- claim_ids HANYA berisi claim_id yang ada di evidence_ledger 4B
- word_count_total memuat angka hasil hitungan kata
- Hasil dibungkus di antara:
=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===
{JSON}
=== END SKRIFLOW_BAB1_DRAFT_V1 ===

Teks sebelumnya:
${rawText}`;
}

/**
 * Computes a stable hash/fingerprint of the Bedah input package.
 */
export function computeBedahInputFingerprint(
  selectedPhenomenon: SelectedPhenomenon | null | undefined,
  literaturePackage: string,
  constraints?: Record<string, string>,
  supervisorDirection?: string
): string {
  const str = [
    selectedPhenomenon?.candidateId || "",
    selectedPhenomenon?.phenomenonSummary || "",
    selectedPhenomenon?.name || "",
    literaturePackage.trim(),
    JSON.stringify(constraints || {}),
    supervisorDirection || "",
  ].join("|#|");

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `bedah_fp_${Math.abs(hash).toString(36)}`;
}


/** Satu sumber yang terbaca dari paket Tool3 (Source Register). */
export interface SumberPaketLiteratur {
  sourceId: string;
  title: string;
  documentType: string;
  url?: string;
  doi?: string;
  /** Kolom "Penulis & Tahun" apa adanya, mis. "Yue Chen & Kan Wang (2024)". */
  authorsYear?: string;
  /** Nama publikasi/penerbit, mis. "Politika: Jurnal Ilmu Politik (UNDIP)". */
  publication?: string;
}

/**
 * Ambil daftar sumber dari tabel "SOURCE REGISTER" paket Tool3.
 *
 * Tabelnya berbentuk markdown: | ID | Kategori | Judul | Penulis & Tahun | Jenis | ...
 * Baris non-tabel diabaikan, jadi heading, catatan, dan tabel lain tidak ikut terbaca.
 *
 * ponytail: pemetaan kolom mengandalkan urutan kolom tetap dari prompt B. Kalau
 * prompt B berubah kolom, perbarui index di tabelKolom. Belum ada parser markdown
 * umum karena hanya satu tabel ini yang perlu dibaca.
 */
export function extractSumberPaketLiteratur(rawText: string): SumberPaketLiteratur[] {
  if (!rawText || rawText.trim().length === 0) return [];

  const baris = rawText.split(/\r?\n/);

  // Temukan baris heading SOURCE REGISTER, lalu tabel pertama sesudahnya.
  let mulai = -1;
  for (let i = 0; i < baris.length; i++) {
    if (/SOURCE\s*REGISTER/i.test(baris[i])) {
      mulai = i;
      break;
    }
  }
  if (mulai === -1) return [];

  // Kumpulkan baris tabel berurutan setelah heading.
  const tabel: string[] = [];
  for (let i = mulai + 1; i < baris.length; i++) {
    const t = baris[i].trim();
    if (t.startsWith("|")) {
      tabel.push(t);
    } else if (tabel.length > 0) {
      break; // tabel sudah berakhir
    }
  }
  // Dua bentuk tabel yang nyata muncul di lapangan:
  //   (a) pipe markdown  "| S3 | INTI | ... |"  — dipakai sebagian model
  //   (b) sel per baris dengan pemisah TAB       — yang keluar dari salinan NotebookLM
  // Bentuk (b) dulu jatuh ke `tabel.length < 2` lalu keluar [], sehingga daftar
  // pustaka kehilangan SELURUH sumber dan .bib keluar tanpa penulis.
  if (tabel.length < 2) {
    return ekstrakRegisterTab(baris, mulai);
  }

  const potong = (r: string) =>
    r
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

  const header = potong(tabel[0]).map((h) => h.replace(/\*/g, "").trim());
  const cariKolom = (kata: string[]) =>
    header.findIndex((h) => kata.some((k) => h.toLowerCase().includes(k)));

  const iId = cariKolom(["id"]);
  const iJudul = cariKolom(["judul", "title"]);
  // "penulis"/"author" saja tidak cukup: header gaya Inggris sering hanya menulis
  // "Author" atau "Tahun". Tanpa cadangan ini, kolom penulis tak ketemu → SEMUA
  // sumber dilaporkan anonim, dan mahasiswa melihat tuduhan "laporan riset AI"
  // pada register yang penulisnya lengkap.
  const iPenulis = cariKolom(["penulis", "author", "tahun", "year"]);
  const iJenis = cariKolom(["jenis", "type", "document"]);
  const iPublikasi = cariKolom(["publikasi", "penerbit", "publication", "journal", "publisher"]);
  // Kolom DOI/tautan tidak selalu ada di tabel ini.
  const iDoi = cariKolom(["doi"]);
  const iTautan = cariKolom(["tautan", "url", "link", "sumber", "source"]);

  if (iId === -1 || iJudul === -1) return [];

  const hasil: SumberPaketLiteratur[] = [];
  for (const row of tabel.slice(1)) {
    const kol = potong(row);
    if (kol.length <= Math.max(iId, iJudul)) continue;
    // Buang penanda markdown (tebal/miring) supaya judul bersih saat dicocokkan.
    const bersih = (v: string) => (v || "").replace(/\*/g, "").replace(/^_+|_+$/g, "").trim();
    const id = bersih(kol[iId]);
    const judul = bersih(kol[iJudul]);
    // Lewati baris pemisah markdown dan baris kosong.
    if (!id || /^[-: ]+$/.test(id) || !judul || /^[-: ]+$/.test(judul)) continue;
    if (/^(total|jumlah)$/i.test(id)) continue;
    hasil.push({
      sourceId: id,
      title: judul,
      authorsYear: iPenulis > -1 ? bersih(kol[iPenulis]) : undefined,
      publication: iPublikasi > -1 ? bersih(kol[iPublikasi]) : undefined,
      documentType: iJenis > -1 ? bersih(kol[iJenis]) : "",
      // Sel yang berisi label antarmuka ("Akses Artikel") bukan tautan: aturan
      // yang sama dipakai bentuk TAB, supaya pemeriksa tautan menyala konsisten.
      ...tautanDariSel(iTautan > -1 ? kol[iTautan] : ""),
      ...(iDoi > -1 && /doi\.org\/|^10\.\d{4,}\//i.test(kol[iDoi] || "") ? { doi: bersih(kol[iDoi]) } : {}),
    });
  }
  return hasil;
}

/**
 * Tentukan URL/DOI sah dari isi satu sel register.
 *
 * Label antarmuka NotebookLM ("Akses Artikel", "DOI Link", "Link Jurnal") HARUS
 * gugur di sini. Sebelumnya jalur tabel PIPA memakai pembersih markdown biasa,
 * sehingga label itu masuk ke `url` dan membuat pemeriksa "sumber tanpa tautan"
 * tidak pernah menyala — justru pada paket yang tautannya paling rusak.
 * Bentuk PIPA dan bentuk TAB sekarang memakai aturan yang sama.
 */
function tautanDariSel(raw: string): { url?: string; doi?: string } {
  const v = (raw || "").trim();
  if (!v || v === "-" || v.toLowerCase() === "n/a") return {};
  return {
    url: /^https?:\/\//i.test(v) ? v : undefined,
    doi: /doi\.org\/|^10\.\d{4,}\//i.test(v) ? v : undefined,
  };
}

/**
 * Bentuk tabel TAB (salinan NotebookLM): setiap sel duduk di barisnya sendiri.
 *
 *   ID
 *   \t
 *   Kategori
 *   ...
 *   S3
 *   \t
 *   INTI
 *
 * Cara baca: pisah seluruh blok dengan TAB, buang sel kosong, lalu ANGKER pada sel
 * yang berbentuk ID sumber (`S3`, `S-3`, `SRC-01`). Sampah antarmuka NotebookLM
 * ("2", "more_horiz", ".") otomatis terlewati karena tidak cocok pola ID.
 */
function ekstrakRegisterTab(baris: string[], mulai: number): SumberPaketLiteratur[] {
  const sisa = baris.slice(mulai + 1).join("\n");

  // WAJIB dibatasi ke blok register saja. Bagian berikutnya (mis. "3. MATRIKS BUKTI")
  // memuat ID sumber lagi di kolomnya, dan tanpa batas ini entri matriks ikut terbaca
  // sebagai sumber palsu (judul berisi nomor halaman, penulis berisi teks lokasi).
  const batas = sisa.search(/(^|\n)[ \t]*(?:\d{1,2}[.)][ \t]*[A-Z][A-Za-z ]{3,}|[A-F][.)][ \t]*[A-Z][A-Za-z ]{3,})/);
  const blok = batas > 0 ? sisa.slice(0, batas) : sisa;

  // Setiap sel duduk di barisnya sendiri, dipisah TAB. Pisah pada TAB **dan** baris
  // baru sekaligus: ID sumber menempel di ekor sel sebelumnya ("Bukti Keterbacaan\n\n\nS3"),
  // jadi memisah pada TAB saja akan menggabungkan ID ke sel terakhir header.
  const sel = blok
    .split(/[\t\n]+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const POLA_ID = /^(?:S|SRC|SUMBER|BUKTI)[-_ ]?\d+$/i;

  // Baris data pertama menandai akhir header — jumlah kolom tabel = indeks itu.
  // (Menghitung dari N sel pertama salah: potongan itu sudah memuat data.)
  const awalData = sel.findIndex((s) => POLA_ID.test(s));
  if (awalData <= 0) return [];
  const jumlahKolom = awalData;

  const header = sel.slice(0, jumlahKolom);
  // Prioritas per-KATA-KUNCI, bukan per-kolom: "Jenis Publikasi" juga memuat kata
  // "publikasi", jadi pencarian yang menelusuri kolom lebih dulu akan salah ambil.
  const cariKolom = (kata: string[]) => {
    for (const k of kata) {
      const i = header.findIndex((h) => h.toLowerCase().includes(k));
      if (i > -1) return i;
    }
    return -1;
  };

  const iJudul = cariKolom(["judul"]);
  const iPenulis = cariKolom(["penulis"]);
  const iJenis = cariKolom(["jenis"]);
  const iPublikasi = cariKolom(["nama publikasi", "penerbit", "publikasi"]);
  const iTautan = cariKolom(["tautan", "doi"]);

  // Tanpa kolom judul posisinya tidak bisa dipastikan — lebih baik tidak menebak.
  if (iJudul === -1) return [];

  const hasil: SumberPaketLiteratur[] = [];
  // Telusuri token satu per satu, bukan berstride: salinan NotebookLM menyelipkan
  // sampah antarmuka ("2", "more_horiz", ".") di antara baris sumber.
  for (let i = awalData; i < sel.length; i++) {
    if (!POLA_ID.test(sel[i])) continue;
    const kol = sel.slice(i, i + jumlahKolom);
    if (kol.length < jumlahKolom) break;
    const id = kol[0].replace(/[\[\]]/g, "").trim();
    const judul = (kol[iJudul] || "").replace(/[\[\]]/g, "").trim();
    if (!id || !judul) continue;
    hasil.push({
      sourceId: id,
      title: judul,
      authorsYear: iPenulis > -1 ? kol[iPenulis] : undefined,
      publication: iPublikasi > -1 ? kol[iPublikasi] : undefined,
      documentType: iJenis > -1 ? kol[iJenis] : "",
      doi: iTautan > -1 && /doi\.org|^10\./i.test(kol[iTautan] || "") ? kol[iTautan] : undefined,
      url: iTautan > -1 && /^https?:\/\//i.test(kol[iTautan] || "") ? kol[iTautan] : undefined,
    });
    i += jumlahKolom - 1; // lompat ke akhir baris ini
  }
  return hasil;
}
