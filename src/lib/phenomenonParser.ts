import {
  PhenomenonTransferPayload,
  SourceIdentityAuditStatus,
  RawPhenomenonCandidate,
  RawPhenomenonEvidence,
  SelectedPhenomenon,
  PhenomenonStatus,
  PhenomenonQualityRating,
} from "@/types/tool";
import { RESEARCH_FIELD_LIMITS } from "@/config/researchFieldLimits";
import {
  auditPhenomenonCoherence,
  auditSourceIndependence,
  calculateEffectivePhenomenonStatus,
  normalizeEventFamily,
  auditEvidenceMetadata,
  auditFreeTextContent,
  auditSourceEntry,
  auditSourceRegister,
  RANK,
  type ContentAuditFinding,
} from "./academicGates";

export const FENOMENA_START_MARKER = "=== BEGIN SKRIFLOW_FENOMENA_V1 ===";
export const FENOMENA_END_MARKER = "=== END SKRIFLOW_FENOMENA_V1 ===";

export const VALID_SOURCE_TYPES = [
  "OFFICIAL_DATA",
  "REGULATION",
  "INSTITUTIONAL_REPORT",
  "EMPIRICAL_ARTICLE",
  "WORKING_PAPER",
  "REPUTABLE_NEWS",
] as const;

export type ValidSourceType = typeof VALID_SOURCE_TYPES[number];

export const VALID_PHENOMENON_STATUSES: PhenomenonStatus[] = [
  "SIAP_DIBAWA",
  "PERLU_DIPERIKSA",
  "JANGAN_DIGUNAKAN",
];

export const VALID_QUALITY_VALUES: PhenomenonQualityRating[] = [
  "KUAT",
  "SEDANG",
  "LEMAH",
];

export interface EvidenceUrlNormalizationResult {
  original: string;
  normalized: string | null;
  changed: boolean;
  reason:
    | "RAW_HTTPS_URL"
    | "MARKDOWN_LINK_EXTRACTED"
    | "ANGLE_BRACKET_URL_EXTRACTED"
    | "WHITESPACE_TRIMMED"
    | "EMPTY"
    | "MULTIPLE_URLS"
    | "UNSAFE_PROTOCOL"
    | "INVALID_URL"
    | "EXTRA_TEXT"
    | "AMBIGUOUS";
}

export interface UrlCorrectionDetail {
  candidateId: string;
  candidateName: string;
  evidenceIndex: number;
  original: string;
  normalized: string;
  reason: EvidenceUrlNormalizationResult["reason"];
}

export interface ParsePhenomenonResult {
  success: boolean;
  error?: string;
  payload?: PhenomenonTransferPayload;
  structuralStatus:
    | "Struktur lengkap"
    | "Valid dengan perbaikan format"
    | "Struktur perlu diperiksa"
    | "Format tidak valid";
  warnings: string[];
  urlCorrections?: UrlCorrectionDetail[];
  /** Temuan audit konten (red line akademik) atas payload mentah dari AI. */
  contentFindings?: ContentAuditFinding[];
}

/**
 * Validates whether a URL is a strictly valid HTTPS URL.
 * Rejects localhost, loopback, private IPs, credentials, plain names, placeholders, non-HTTPS protocols,
 * and uncleaned Markdown characters.
 */
export function isValidHttpsUrl(urlString: unknown): boolean {
  if (typeof urlString !== "string") return false;
  const trimmed = urlString.trim();
  if (!trimmed) return false;

  // Reject leftover markdown formatting or angle brackets
  if (
    trimmed.includes("[") ||
    trimmed.includes("]") ||
    trimmed.includes("<") ||
    trimmed.includes(">")
  ) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") {
      return false;
    }

    // Reject credentials
    if (url.username || url.password) {
      return false;
    }

    const hostname = url.hostname.trim().toLowerCase();
    if (!hostname) return false;

    // Reject localhost, loopback, and local network hostnames
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }

    // Reject private IP ranges (127.x, 10.x, 192.168.x, 172.16-31.x)
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
      return false;
    }

    // Domain shape validation: must have dot, no starting/ending dot, no consecutive dots
    if (
      !hostname.includes(".") ||
      hostname.startsWith(".") ||
      hostname.endsWith(".") ||
      hostname.includes("..")
    ) {
      return false;
    }

    const parts = hostname.split(".");
    if (parts.length < 2) return false;
    const tld = parts[parts.length - 1];
    // TLD must be >= 2 characters or numeric IP part
    if (tld.length < 2 && !/^\d+$/.test(tld)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes evidence URL string safely before validation.
 * Extracts raw HTTPS URL from Markdown links [label](url) and angle brackets <url>.
 */
export function normalizeEvidenceUrl(input: string): EvidenceUrlNormalizationResult {
  const original = String(input ?? "");
  const trimmed = original.trim();

  // 1. Empty string
  if (trimmed.length === 0) {
    return {
      original,
      normalized: "",
      changed: original !== "",
      reason: "EMPTY",
    };
  }

  // 2. Unsafe protocols check (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase();
  if (
    lowerTrimmed.startsWith("javascript:") ||
    lowerTrimmed.startsWith("data:") ||
    lowerTrimmed.startsWith("file:") ||
    lowerTrimmed.startsWith("blob:") ||
    lowerTrimmed.startsWith("vbscript:") ||
    lowerTrimmed.startsWith("about:")
  ) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "UNSAFE_PROTOCOL",
    };
  }

  // 3. Raw DOI without protocol (e.g. 10.1234/...)
  if (
    lowerTrimmed.startsWith("10.") ||
    lowerTrimmed.startsWith("doi:") ||
    lowerTrimmed.startsWith("doi.org/")
  ) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "INVALID_URL",
    };
  }

  // 4. Check for multiple Markdown links in a single string
  const mdMatches = Array.from(trimmed.matchAll(/\[([\s\S]*?)\]\(([\s\S]*?)\)/g));
  if (mdMatches.length > 1) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "MULTIPLE_URLS",
    };
  }

  // 5. Single Markdown link: [label](target)
  if (mdMatches.length === 1) {
    const match = mdMatches[0];
    const matchFull = match[0];

    // Check if there is extra text outside the markdown link
    if (trimmed !== matchFull) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "EXTRA_TEXT",
      };
    }

    const rawTarget = match[2].trim();

    // Target cannot contain whitespace (e.g. multiple URLs inside target)
    if (/\s/.test(rawTarget)) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "MULTIPLE_URLS",
      };
    }

    if (rawTarget.toLowerCase().startsWith("http://")) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "UNSAFE_PROTOCOL",
      };
    }

    if (!rawTarget.toLowerCase().startsWith("https://")) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "UNSAFE_PROTOCOL",
      };
    }

    if (!isValidHttpsUrl(rawTarget)) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "INVALID_URL",
      };
    }

    return {
      original,
      normalized: rawTarget,
      changed: true,
      reason: "MARKDOWN_LINK_EXTRACTED",
    };
  }

  // 6. Angle bracket URL: <https://...>
  const angleMatch = trimmed.match(/^<([\s\S]*?)>$/);
  if (angleMatch) {
    const rawTarget = angleMatch[1].trim();
    if (/\s/.test(rawTarget)) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "MULTIPLE_URLS",
      };
    }
    if (rawTarget.toLowerCase().startsWith("http://")) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "UNSAFE_PROTOCOL",
      };
    }
    if (!rawTarget.toLowerCase().startsWith("https://")) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "UNSAFE_PROTOCOL",
      };
    }
    if (!isValidHttpsUrl(rawTarget)) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "INVALID_URL",
      };
    }
    return {
      original,
      normalized: rawTarget,
      changed: true,
      reason: "ANGLE_BRACKET_URL_EXTRACTED",
    };
  }

  // If there's an angle bracket with text outside it
  if (trimmed.includes("<") && trimmed.includes(">")) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "EXTRA_TEXT",
    };
  }

  // 7. Check for multiple raw URLs
  const httpOccurrences = trimmed.match(/https?:\/\//gi);
  if (httpOccurrences && httpOccurrences.length > 1) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "MULTIPLE_URLS",
    };
  }

  // 8. Reject HTTP protocol
  if (lowerTrimmed.startsWith("http://")) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "UNSAFE_PROTOCOL",
    };
  }

  // 9. Extra text around raw URL (e.g. "Sumber: https://..." or "https://... dan artikel lain")
  if (/\s/.test(trimmed)) {
    return {
      original,
      normalized: null,
      changed: false,
      reason: "EXTRA_TEXT",
    };
  }

  // 10. Raw HTTPS URL
  if (lowerTrimmed.startsWith("https://")) {
    // Check trailing punctuation that was attached to URL, e.g. `https://example.org/article,`
    if (/[,;]$/.test(trimmed)) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "EXTRA_TEXT",
      };
    }

    if (!isValidHttpsUrl(trimmed)) {
      return {
        original,
        normalized: null,
        changed: false,
        reason: "INVALID_URL",
      };
    }

    const changed = trimmed !== original;
    return {
      original,
      normalized: trimmed,
      changed,
      reason: changed ? "WHITESPACE_TRIMMED" : "RAW_HTTPS_URL",
    };
  }

  // 11. Fallback
  return {
    original,
    normalized: null,
    changed: false,
    reason: "INVALID_URL",
  };
}

/**
 * Validates whether a URL is a valid absolute HTTP or HTTPS URL (legacy support).
 */
export function isValidHttpUrl(urlString: unknown): boolean {
  if (typeof urlString !== "string") return false;
  const trimmed = urlString.trim();
  if (!trimmed) return false;

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("doi:") ||
    trimmed.startsWith("www.") ||
    trimmed === "..." ||
    trimmed === '""'
  ) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    const hostname = url.hostname.trim();
    if (!hostname) return false;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    if (
      !hostname.includes(".") ||
      hostname.startsWith(".") ||
      hostname.endsWith(".") ||
      hostname.includes("..")
    ) {
      return false;
    }

    const parts = hostname.split(".");
    if (parts.length < 2) return false;
    const tld = parts[parts.length - 1];
    if (tld.length < 2 && !/^\d+$/.test(tld)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes title / text for canonical work identification.
 */
export function normalizeTextForIdentity(text?: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”"]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts 4-digit year from date string or reference period.
 */
export function extractYearFromDate(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const match = dateStr.match(/\b(19\d\d|20\d\d)\b/);
  return match ? match[1] : "";
}

/**
 * Extracts DOI from URL or text.
 */
export function extractDoiFromUrlOrText(input?: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const doiRegex = /(?:https?:\/\/doi\.org\/|doi:\s*|doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i;
  const match = trimmed.match(doiRegex);
  if (match && match[1]) {
    return match[1].toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "").trim();
  }
  return null;
}

/**
 * Strips tracking query parameters and normalizes URL for deduplication.
 */
export function normalizeUrlForIdentity(urlString?: string): string {
  if (!urlString || typeof urlString !== "string") return "";
  try {
    const url = new URL(urlString.trim());
    const searchParams = new URLSearchParams(url.search);
    const trackingKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "fbclid",
      "gclid",
    ];
    trackingKeys.forEach((k) => searchParams.delete(k));
    const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return `${url.protocol}//${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "")}${cleanSearch}`;
  } catch {
    return urlString.trim().toLowerCase().replace(/\/+$/, "");
  }
}

export interface SourceIdentityFields {
  claim?: string;
  source_title?: string;
  sourceTitle?: string;
  publisher_or_institution?: string;
  publisherOrInstitution?: string;
  publication_date?: string;
  publicationDate?: string;
  reference_period?: string;
  referencePeriod?: string;
  url?: string;
}

/**
 * Computes deterministic canonical source identity key for evidence deduplication.
 */
export function getCanonicalSourceKey(evidence: SourceIdentityFields): string {
  const title = evidence.source_title || evidence.sourceTitle || "";
  const publisher = evidence.publisher_or_institution || evidence.publisherOrInstitution || "";
  const pubDate = evidence.publication_date || evidence.publicationDate || "";
  const refPeriod = evidence.reference_period || evidence.referencePeriod || "";
  const url = evidence.url || "";

  const normTitle = normalizeTextForIdentity(title);
  const normPub = normalizeTextForIdentity(publisher);
  const year = extractYearFromDate(pubDate) || extractYearFromDate(refPeriod);

  // 1. If normalized title is substantial (>= 5 chars), match work identity
  if (normTitle.length >= 5) {
    return `work:${normTitle}|${normPub}|${year}`;
  }

  // 2. If DOI can be extracted from URL or title
  const doi = extractDoiFromUrlOrText(url) || extractDoiFromUrlOrText(title);
  if (doi) {
    return `doi:${doi}`;
  }

  // 3. Fallback to normalized URL
  if (url) {
    return `url:${normalizeUrlForIdentity(url)}`;
  }

  // 4. Default fallback
  return `unknown:${normTitle || "untitled"}`;
}

/**
 * Calculates number of unique academic sources across a list of evidence items.
 */
export function getUniqueSourceCount(evidenceList: SourceIdentityFields[]): number {
  if (!evidenceList || evidenceList.length === 0) return 0;
  const keys = new Set<string>();
  for (const ev of evidenceList) {
    const key = getCanonicalSourceKey(ev);
    if (key) keys.add(key);
  }
  return keys.size;
}

/**
 * Returns distinct canonical source keys for a list of evidence items.
 */
export function getCanonicalSourceKeys(evidenceList: SourceIdentityFields[]): string[] {
  if (!evidenceList || evidenceList.length === 0) return [];
  const keySet = new Set<string>();
  for (const ev of evidenceList) {
    const key = getCanonicalSourceKey(ev);
    if (key) keySet.add(key);
  }
  return Array.from(keySet);
}

/**
 * Computes deterministic identity fingerprint for a phenomenon candidate.
 * Combines schema version, candidate ID, status, normalized summary, and sorted canonical source keys.
 */
export function computeCandidateFingerprint(
  candidate: RawPhenomenonCandidate,
  schemaVersion: number = 1
): string {
  if (!candidate) return "";
  const canonicalKeys = getCanonicalSourceKeys(candidate.evidence || []).sort().join("||");
  const normSummary = (candidate.phenomenon_summary || "").trim();
  return `${schemaVersion}::${candidate.id}::${candidate.status}::${normSummary}::${canonicalKeys}`;
}

/**
 * Computes deterministic identity fingerprint for a stored SelectedPhenomenon.
 */
export function computeSelectedPhenomenonFingerprint(
  selected: SelectedPhenomenon
): string {
  if (!selected) return "";
  const canonicalKeys = (selected.evidence || [])
    .map((ev) => getCanonicalSourceKey(ev))
    .filter((k, idx, arr) => arr.indexOf(k) === idx)
    .sort()
    .join("||");
  const normSummary = (selected.phenomenonSummary || "").trim();
  return `${selected.schemaVersion || 1}::${selected.candidateId}::${selected.status}::${normSummary}::${canonicalKeys}`;
}

/**
 * Safely parses and validates SKRIFLOW_FENOMENA_V1 transfer text pasted by student.
 * Never executes eval() or code execution. Handles corrupt inputs safely.
 */
export function parsePhenomenonTransfer(rawText: string): ParsePhenomenonResult {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      success: false,
      error: "Hasil masih kosong. Salin seluruh teks output dari ChatGPT atau Gemini lalu tempel di sini.",
      structuralStatus: "Format tidak valid",
      warnings: [],
    };
  }

  const startIndex = rawText.indexOf(FENOMENA_START_MARKER);
  const endIndex = rawText.indexOf(FENOMENA_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return {
      success: false,
      error: "Hasil belum dapat dibaca. Pastikan seluruh blok dari BEGIN sampai END ikut disalin.",
      structuralStatus: "Format tidak valid",
      warnings: ["Marker transfer data SKRIFLOW_FENOMENA_V1 tidak ditemukan."],
    };
  }

  const jsonString = rawText
    .substring(startIndex + FENOMENA_START_MARKER.length, endIndex)
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sintaks JSON tidak valid.";
    return {
      success: false,
      error: `JSON di dalam blok transfer rusak atau tidak valid: ${message}`,
      structuralStatus: "Format tidak valid",
      warnings: ["Gunakan tombol 'Salin Prompt Perbaikan Format' untuk meminta AI mengeluarkan ulang JSON valid."],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      error: "Format blok transfer tidak valid (harus berupa JSON object).",
      structuralStatus: "Format tidak valid",
      warnings: [],
    };
  }

  const data = parsed as Record<string, unknown>;

  // Validate Schema Version (default to 1 if omitted or provided as string "1")
  const schemaVer = Number(data.schema_version ?? 1);
  if (schemaVer !== 1 || isNaN(schemaVer)) {
    return {
      success: false,
      error: `Schema version '${data.schema_version}' tidak didukung. Versi yang didukung adalah 1.`,
      structuralStatus: "Format tidak valid",
      warnings: [],
    };
  }

  const warnings: string[] = [];
  if (data.schema_version === undefined || data.schema_version === null) {
    warnings.push("schema_version tidak disertakan oleh AI, diasumsikan versi 1.");
  }

  // Handle insufficient evidence state
  if (data.insufficient_evidence === true) {
    const searchNotes = Array.isArray(data.search_notes)
      ? data.search_notes.map((n) => String(n))
      : [];

    return {
      success: true,
      payload: {
        schema_version: 1,
        insufficient_evidence: true,
        candidates: [],
        search_notes: searchNotes,
        context: (data.context as PhenomenonTransferPayload["context"]) || {},
      },
      structuralStatus: "Struktur lengkap",
      warnings: ["AI melaporkan bukti tidak mencukupi (insufficient_evidence: true). Periksa catatan pencarian."],
    };
  }

  // Validate candidates array
  if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
    return {
      success: false,
      error: "Tidak ada kandidat fenomena yang ditemukan dalam data transfer.",
      structuralStatus: "Format tidak valid",
      warnings: [],
    };
  }

  if (data.candidates.length > 4) {
    return {
      success: false,
      error: `Jumlah kandidat melebihi batas maksimal (${data.candidates.length} kandidat ditemukan, maksimal 4 kandidat).`,
      structuralStatus: "Format tidak valid",
      warnings: [],
    };
  }

  const validatedCandidates: RawPhenomenonCandidate[] = [];
  const urlCorrections: UrlCorrectionDetail[] = [];

  const contentFindings: ContentAuditFinding[] = [];

  for (let i = 0; i < data.candidates.length; i++) {
    const cand = data.candidates[i];
    const candidateIdx = i + 1;

    if (typeof cand !== "object" || cand === null || Array.isArray(cand)) {
      return {
        success: false,
        error: `Kandidat #${candidateIdx} bukan objek JSON yang valid.`,
        structuralStatus: "Format tidak valid",
        warnings,
      };
    }

    const candObj = cand as Record<string, unknown>;
    const id = typeof candObj.id === "string" && candObj.id.trim().length > 0 ? candObj.id.trim() : `F0${candidateIdx}`;
    const name = typeof candObj.name === "string" ? candObj.name.trim() : "";
    if (!name) {
      return {
        success: false,
        error: `Kandidat ${id} tidak memiliki nama fenomena ('name').`,
        structuralStatus: "Format tidak valid",
        warnings,
      };
    }

    const phenomenonSummary = typeof candObj.phenomenon_summary === "string" ? candObj.phenomenon_summary.trim() : "";
    if (!phenomenonSummary) {
      return {
        success: false,
        error: `Kandidat ${id} (${name}) tidak memiliki 'phenomenon_summary'.`,
        structuralStatus: "Format tidak valid",
        warnings,
      };
    }

    const summaryLength = Array.from(phenomenonSummary).length;
    if (summaryLength > RESEARCH_FIELD_LIMITS.selectedPhenomenon) {
      return {
        success: false,
        error: `Kandidat ${id} (${name}) memiliki 'phenomenon_summary' sepanjang ${summaryLength} karakter (maksimal ${RESEARCH_FIELD_LIMITS.selectedPhenomenon} karakter).`,
        structuralStatus: "Format tidak valid",
        warnings,
      };
    }

    // Status validation
    const statusStr = String(candObj.status || "").trim().toUpperCase();
    if (!VALID_PHENOMENON_STATUSES.includes(statusStr as PhenomenonStatus)) {
      return {
        success: false,
        error: `Kandidat ${id} (${name}) memiliki status '${candObj.status}' yang tidak valid. Status harus salah satu dari: SIAP_DIBAWA, PERLU_DIPERIKSA, atau JANGAN_DIGUNAKAN.`,
        structuralStatus: "Format tidak valid",
        warnings,
      };
    }
    const status = statusStr as PhenomenonStatus;

    // Scope validation
    const scopeRaw = candObj.scope;
    const scopeObj = typeof scopeRaw === "object" && scopeRaw !== null && !Array.isArray(scopeRaw)
      ? (scopeRaw as Record<string, unknown>)
      : {};

    const scope = {
      object_or_population: String(scopeObj.object_or_population || candObj.object_or_population || "Belum diketahui").trim(),
      geography: String(scopeObj.geography || candObj.geography || "Belum diketahui").trim(),
      reference_period: String(scopeObj.reference_period || candObj.reference_period || "Belum diketahui").trim(),
    };

    // Evidence validation
    if (!Array.isArray(candObj.evidence) || candObj.evidence.length === 0) {
      return {
        success: false,
        error: `Kandidat ${id} (${name}) tidak memiliki bukti ('evidence' minimal 1 item).`,
        structuralStatus: "Format tidak valid",
        warnings,
      };
    }

    const validatedEvidence: RawPhenomenonEvidence[] = [];
    const seenUrls = new Set<string>();
    const candidateFindings: ContentAuditFinding[] = [];

    // R-13: klaim kausal dan klaim ketiadaan bukti tidak boleh lolos hanya
    // karena aturan ini ditulis di prompt. Periksa teks bebas kandidat.
    candidateFindings.push(
      ...auditFreeTextContent(phenomenonSummary, `candidates.${id}.phenomenon_summary`),
      ...auditFreeTextContent(String(candObj.observed_condition ?? ""), `candidates.${id}.observed_condition`),
      ...auditFreeTextContent(String(candObj.relation_to_area ?? ""), `candidates.${id}.relation_to_area`),
      ...auditFreeTextContent(String(candObj.what_is_not_proven ?? ""), `candidates.${id}.what_is_not_proven`)
    );

    for (let j = 0; j < candObj.evidence.length; j++) {
      const ev = candObj.evidence[j];
      const evIdx = j + 1;

      if (typeof ev !== "object" || ev === null || Array.isArray(ev)) {
        return {
          success: false,
          error: `Bukti #${evIdx} pada kandidat ${id} bukan objek JSON yang valid.`,
          structuralStatus: "Format tidak valid",
          warnings,
        };
      }

      const evObj = ev as Record<string, unknown>;
      const claim = String(evObj.claim || "").trim();
      const sourceTitle = String(evObj.source_title || evObj.sourceTitle || evObj.title || "").trim();
      const publisherOrInstitution = String(evObj.publisher_or_institution || evObj.publisherOrInstitution || evObj.publisher || "").trim();
      const observedDataOrEvent = String(evObj.observed_data_or_event || evObj.observedDataOrEvent || "").trim();
      const publicationDate = String(evObj.publication_date || evObj.publicationDate || evObj.year || "").trim();
      const referencePeriod = String(evObj.reference_period || evObj.referencePeriod || "").trim();
      const methodOrMetadata = String(evObj.method_or_metadata || evObj.methodOrMetadata || "").trim();
      const limitations = String(evObj.limitations || "").trim();
      const rawUrl = String(evObj.url ?? "").trim();

      const normRes = normalizeEvidenceUrl(rawUrl);

      let finalUrl = "";

      if (normRes.normalized === null) {
        return {
          success: false,
          error: `FORMAT URL tidak valid — Kandidat ${id} — Bukti ${evIdx}: URL '${rawUrl || "kosong"}' tidak dapat diproses (${normRes.reason}). Gunakan URL HTTP/HTTPS yang valid.`,
          structuralStatus: "Format tidak valid",
          warnings,
        };
      }
      finalUrl = normRes.normalized;

      if (normRes.changed && normRes.reason !== "WHITESPACE_TRIMMED" && finalUrl) {
        urlCorrections.push({
          candidateId: id,
          candidateName: name,
          evidenceIndex: evIdx,
          original: rawUrl,
          normalized: finalUrl,
          reason: normRes.reason,
        });
      }

      if (finalUrl && seenUrls.has(finalUrl.toLowerCase())) {
        warnings.push(`Kandidat ${id} memuat URL duplikat: ${finalUrl}`);
      }
      if (finalUrl) {
        seenUrls.add(finalUrl.toLowerCase());
      }

      const rawSourceType = String(evObj.source_type || evObj.sourceType || "OFFICIAL_DATA").trim().toUpperCase();
      if (!VALID_SOURCE_TYPES.includes(rawSourceType as ValidSourceType)) {
        return {
          success: false,
          error: `Kandidat ${id} — Bukti ${evIdx}: source_type '${rawSourceType}' yang tidak valid. Gunakan salah satu dari: ${VALID_SOURCE_TYPES.join(", ")}.`,
          structuralStatus: "Format tidak valid",
          warnings,
        };
      }
      const sourceType = rawSourceType as ValidSourceType;

      const evidenceLocation = typeof evObj.evidence_location === "string" && evObj.evidence_location.trim().length > 0
        ? evObj.evidence_location.trim()
        : typeof evObj.evidenceLocation === "string" && evObj.evidenceLocation.trim().length > 0
        ? evObj.evidenceLocation.trim()
        : "Tidak dapat dipastikan";

      const accessNote = typeof evObj.access_note === "string" && evObj.access_note.trim().length > 0
        ? evObj.access_note.trim()
        : typeof evObj.accessNote === "string" && evObj.accessNote.trim().length > 0
        ? evObj.accessNote.trim()
        : "Tidak dapat dipastikan";

      validatedEvidence.push({
        claim: claim || "Klaim bukti empiris",
        observed_data_or_event: observedDataOrEvent,
        source_title: sourceTitle || "Sumber Data / Publikasi",
        publisher_or_institution: publisherOrInstitution,
        source_type: sourceType,
        publication_date: publicationDate,
        reference_period: referencePeriod,
        url: finalUrl,
        evidence_location: evidenceLocation,
        access_note: accessNote,
        method_or_metadata: methodOrMetadata,
        limitations: limitations,
      });
    }

    // Quality ratings validation with safe fallback to KUAT / SEDANG / LEMAH
    const qualityRaw = (typeof candObj.quality === "object" && candObj.quality !== null && !Array.isArray(candObj.quality))
      ? (candObj.quality as Record<string, unknown>)
      : {};

    const quality: Record<string, PhenomenonQualityRating> = {};
    const qualityDimensions = [
      "relevance",
      "scope_clarity",
      "traceability",
      "metadata_quality",
      "timeliness",
      "comparability",
      "source_independence",
    ];

    for (const dim of qualityDimensions) {
      const val = String(qualityRaw[dim] || "").trim().toUpperCase();
      if (VALID_QUALITY_VALUES.includes(val as PhenomenonQualityRating)) {
        quality[dim] = val as PhenomenonQualityRating;
      } else {
        quality[dim] = "SEDANG";
      }
    }

    // R-12: identitas sumber diperiksa, bukan sekadar diterima. Sumber karangan
    // (domain contoh, DOI pola palsu) ditandai agar tidak lolos di pangkal rantai.
    const registerEntries: Parameters<typeof auditSourceRegister>[0] = [];

    // Audit metadata tiap bukti: rating AI tidak dipercaya, dihitung ulang dari
    // kelengkapan identitas sumber (F20/F21). Rating yang berlebihan diturunkan.
    for (let j = 0; j < validatedEvidence.length; j++) {
      const ev = validatedEvidence[j];

      // R-07: status identitas sumber disertakan di output agar mahasiswa (dan
      // dosen) bisa membedakan sumber yang bisa dilacak dari asumsi AI.
      const idStatus: SourceIdentityAuditStatus =
        ev.url && !/^(https?:\/\/)?(www\.)?(example\.(com|org|net)|localhost)/i.test(ev.url) && ev.source_title && !/^Sumber Data/i.test(ev.source_title)
          ? "VERIFIED"
          : ev.url || (/^Sumber Data/i.test(ev.source_title) ? false : ev.source_title)
          ? "NEEDS_CHECK"
          : "MISSING";
      (ev as unknown as Record<string, unknown>).identity_status = idStatus;

      const mAudit = auditEvidenceMetadata({
        candidateId: id,
        evidenceIndex: j + 1,
        metadata: {
          sourceTitle: ev.source_title,
          publisherOrInstitution: ev.publisher_or_institution,
          publicationDate: ev.publication_date,
          referencePeriod: ev.reference_period,
          url: ev.url,
          evidenceLocation: ev.evidence_location,
        },
        declaredQuality: quality.metadata_quality,
        declaredTraceability: quality.traceability,
        sourceType: ev.source_type,
      });
      candidateFindings.push(...mAudit.findings);

      const entry = {
        sourceId: `${id}-EV${j + 1}`,
        url: ev.url,
        doi: "",
        title: /^Sumber Data/i.test(ev.source_title) ? "" : ev.source_title,
        declaredType: ev.source_type,
      };
      registerEntries.push(entry);
      candidateFindings.push(...auditSourceEntry(entry));
      // Rating dihitung dari bukti TERLEMAH, bukan dari klaim AI
      if (RANK[mAudit.metadataQuality] < RANK[quality.metadata_quality]) {
        quality.metadata_quality = mAudit.metadataQuality;
      }
      if (RANK[mAudit.traceability] < RANK[quality.traceability]) {
        quality.traceability = mAudit.traceability;
      }
    }

    const keywordsId = Array.isArray(candObj.keywords_id) ? candObj.keywords_id.map((k) => String(k).trim()).filter(Boolean) : [];
    const keywordsEn = Array.isArray(candObj.keywords_en) ? candObj.keywords_en.map((k) => String(k).trim()).filter(Boolean) : [];
    const unresolvedItems = Array.isArray(candObj.unresolved_items) ? candObj.unresolved_items.map((u) => String(u).trim()).filter(Boolean) : [];

    // 1. Phenomenon Definition
    let phenomenonDefinition: import("@/types/tool").PhenomenonDefinition | undefined = undefined;
    if (typeof candObj.phenomenon_definition === "object" && candObj.phenomenon_definition !== null) {
      const pDef = candObj.phenomenon_definition as Record<string, unknown>;
      const normFam = normalizeEventFamily(String(pDef.event_family || "OTHER"));
      phenomenonDefinition = {
        eventOrCondition: String(pDef.event_or_condition || candObj.observed_condition || "").trim(),
        eventFamily: normFam.family,
        eventFamilyDetail: String(pDef.event_family_detail || normFam.detail).trim(),
        primaryOutcome: String(pDef.primary_outcome || "").trim(),
        secondaryOutcome: pDef.secondary_outcome ? String(pDef.secondary_outcome).trim() : undefined,
        objectOrPopulation: String(pDef.object_or_population || scope.object_or_population || "").trim(),
        geography: String(pDef.geography || scope.geography || "").trim(),
        referencePeriod: String(pDef.reference_period || scope.reference_period || "").trim(),
      };
    } else {
      const normFam = normalizeEventFamily(String(candObj.observed_condition || name));
      phenomenonDefinition = {
        eventOrCondition: String(candObj.observed_condition || name).trim(),
        eventFamily: normFam.family,
        eventFamilyDetail: normFam.detail,
        primaryOutcome: "Respons atau dampak teramati",
        objectOrPopulation: scope.object_or_population,
        geography: scope.geography,
        referencePeriod: scope.reference_period,
      };
    }

    // 2. Phenomenon Coherence Audit
    let phenomenonCoherenceAudit: import("@/types/tool").PhenomenonCoherenceAudit | undefined = undefined;
    if (typeof candObj.phenomenon_coherence_audit === "object" && candObj.phenomenon_coherence_audit !== null) {
      const pca = candObj.phenomenon_coherence_audit as Record<string, unknown>;
      const rawStatus = String(pca.status || "").trim().toUpperCase();
      const pcaStatus = (rawStatus === "COHERENT_ENOUGH" || rawStatus === "NEEDS_NARROWING" || rawStatus === "INCOHERENT")
        ? rawStatus
        : "COHERENT_ENOUGH";
      phenomenonCoherenceAudit = {
        status: pcaStatus,
        mixedEvents: Array.isArray(pca.mixed_events) ? pca.mixed_events.map(String) : [],
        mixedOutcomes: Array.isArray(pca.mixed_outcomes) ? pca.mixed_outcomes.map(String) : [],
        notes: Array.isArray(pca.notes) ? pca.notes.map(String) : [],
      };
    } else {
      phenomenonCoherenceAudit = auditPhenomenonCoherence({
        rawSummary: phenomenonSummary,
        objectOrPopulation: scope.object_or_population,
        geography: scope.geography,
        referencePeriod: scope.reference_period,
      });
    }

    // 3. Source Independence Audit (Deterministically calculated)
    const distinctUrls = new Set(validatedEvidence.map((e) => e.url).filter(Boolean));
    const uniqueSourceCount = distinctUrls.size > 0 ? distinctUrls.size : validatedEvidence.length;
    const computedIndependence = auditSourceIndependence(
      validatedEvidence.map((ev, idx) => ({
        sourceId: `EV${idx + 1}`,
        authors: [ev.publisher_or_institution || ev.source_title],
      }))
    );
    const sourceIndependenceAudit = computedIndependence;

    // 4. Calculate Effective Status (Never trust reported AI status blindly)
    const hasAiReport = validatedEvidence.some((e) =>
      e.source_title.toLowerCase().includes("research report ai") ||
      e.publisher_or_institution.toLowerCase().includes("notebooklm report")
    );
    const hasUnclearLocation = validatedEvidence.some((e) => e.evidence_location === "Tidak dapat dipastikan");
    const isTraceabilityWeak = quality.traceability === "LEMAH";
    const hasUntraceableUrl = validatedEvidence.some((e) => !e.url || e.url.trim().length === 0 || !isValidHttpsUrl(e.url));
    const hasUntraceableSource = hasUntraceableUrl || validatedEvidence.some((e) => !e.source_title || e.source_title.trim().length === 0);
    const hasUnsupportedClaim = validatedEvidence.length === 0 || validatedEvidence.some((e) => !e.claim || e.claim.trim().length === 0);
    const hasOfficialRetraction = validatedEvidence.some((e) =>
      e.limitations.toLowerCase().includes("retracted") ||
      e.limitations.toLowerCase().includes("withdrawn") ||
      e.source_title.toLowerCase().includes("retracted") ||
      e.source_title.toLowerCase().includes("withdrawn")
    );

    const effectiveResult = calculateEffectivePhenomenonStatus({
      reportedStatus: status,
      coherenceStatus: phenomenonCoherenceAudit.status,
      evidenceCount: validatedEvidence.length,
      uniqueSourceCount,
      independentAuthorTeamCount: sourceIndependenceAudit.independentAuthorTeamCount,
      hasFabricatedOrUntraceableSource: hasUntraceableSource,
      hasUnsupportedClaim,
      hasOfficialRetraction,
      hasAiResearchReportAsSource: hasAiReport,
      evidenceLocationIsUnclear: hasUnclearLocation,
      scopeIsStillBroad: phenomenonCoherenceAudit.status === "NEEDS_NARROWING",
      traceabilityIsNotStrong: isTraceabilityWeak,
    });

    // R-13: klaim kausal di dalam butir bukti itu sendiri
    for (let j = 0; j < validatedEvidence.length; j++) {
      const ev = validatedEvidence[j];
      candidateFindings.push(
        ...auditFreeTextContent(ev.claim, `candidates.${id}.evidence[${j + 1}].claim`)
      );
    }

    candidateFindings.push(...auditSourceRegister(registerEntries));
    contentFindings.push(...candidateFindings);

    validatedCandidates.push({
      id,
      name,
      phenomenon_type: String(candObj.phenomenon_type || "TREND").trim(),
      phenomenon_summary: phenomenonSummary,
      observed_condition: String(candObj.observed_condition || "").trim(),
      scope,
      relation_to_area: String(candObj.relation_to_area || "").trim(),
      evidence: validatedEvidence,
      triangulation_note: String(candObj.triangulation_note || "").trim(),
      what_is_not_proven: String(candObj.what_is_not_proven || "").trim(),
      quality,
      status,
      effective_status: effectiveResult.effectiveStatus,
      status_override_reason: effectiveResult.overrideReason,
      keywords_id: keywordsId,
      keywords_en: keywordsEn,
      unresolved_items: unresolvedItems,
      phenomenon_definition: phenomenonDefinition,
      phenomenon_coherence_audit: phenomenonCoherenceAudit,
      source_independence_audit: sourceIndependenceAudit,
    });
  }

  let structuralStatus: ParsePhenomenonResult["structuralStatus"] = "Struktur lengkap";
  if (urlCorrections.length > 0) {
    structuralStatus = "Valid dengan perbaikan format";
    warnings.unshift(
      "FORMAT URL DIPERBAIKI OTOMATIS: Beberapa URL ditulis AI dalam format Markdown dan telah diubah menjadi URL mentah. Isi sumber tidak diubah."
    );
  } else if (warnings.length > 0) {
    structuralStatus = "Struktur perlu diperiksa";
  }

  return {
    success: true,
    payload: {
      schema_version: 1,
      insufficient_evidence: false,
      candidates: validatedCandidates,
      search_notes: Array.isArray(data.search_notes) ? data.search_notes.map((n) => String(n)) : [],
      context: (data.context as PhenomenonTransferPayload["context"]) || {},
    },
    structuralStatus,
    warnings,
    urlCorrections: urlCorrections.length > 0 ? urlCorrections : undefined,
    contentFindings: contentFindings.length > 0 ? contentFindings : undefined,
  };
}

/**
 * Generates copyable prompt for student to ask ChatGPT/Gemini to fix formatting issues.
 */
export function generateFixFormatPrompt(): string {
  return `Tolong keluarkan ulang hasil kandidat fenomena yang sudah kamu temukan sebelumnya ke dalam format blok data transfer JSON SKRIFLOW_FENOMENA_V1 berikut secara persis tanpa teks atau penjelasan di luar marker:

=== BEGIN SKRIFLOW_FENOMENA_V1 ===
{
  "schema_version": 1,
  "insufficient_evidence": false,
  "context": {
    "prodi": "...",
    "area": "...",
    "scope_preference": "...",
    "time_preference": "..."
  },
  "candidates": [
    {
      "id": "F01",
      "name": "Nama Fenomena Ringkas",
      "phenomenon_type": "TREND",
      "phenomenon_summary": "Ringkasan fenomena maksimal 800 karakter mencakup fakta, objek, periode, dan sumber.",
      "observed_condition": "Kondisi teramati nyata",
      "scope": {
        "object_or_population": "Objek/populasi",
        "geography": "Lokasi/cakupan",
        "reference_period": "Periode data"
      },
      "relation_to_area": "Hubungan dengan area eksplorasi",
      "evidence": [
        {
          "claim": "Klaim bukti 1",
          "observed_data_or_event": "Data/angka/peristiwa",
          "source_title": "Judul Laporan/Dataset/Jurnal",
          "publisher_or_institution": "Nama Lembaga/Penerbit",
          "source_type": "OFFICIAL_DATA",
          "publication_date": "Tahun/Tanggal publikasi rujukan",
          "reference_period": "Periode data yang dibahas",
          "url": "https://www.example.org/path-to-source",
          "evidence_location": "Halaman, tabel, bagian, paragraf, atau lokasi informasi dalam sumber. Jika tidak tersedia, tulis Tidak dapat dipastikan.",
          "access_note": "Keterangan apakah halaman/PDF dapat dibuka langsung dan bagian relevan dapat ditemukan.",
          "method_or_metadata": "Metode/metadata singkat",
          "limitations": "Keterbatasan bukti"
        }
      ],
      "triangulation_note": "Catatan triangulasi bukti",
      "what_is_not_proven": "Hal yang belum dapat dibuktikan",
      "quality": {
        "relevance": "KUAT",
        "scope_clarity": "KUAT",
        "traceability": "KUAT",
        "metadata_quality": "KUAT",
        "timeliness": "KUAT",
        "comparability": "KUAT",
        "source_independence": "KUAT"
      },
      "status": "SIAP_DIBAWA",
      "keywords_id": ["kata kunci 1"],
      "keywords_en": ["keyword 1"],
      "unresolved_items": ["hal yang belum pasti"]
    }
  ],
  "search_notes": ["catatan pencarian"]
}
=== END SKRIFLOW_FENOMENA_V1 ===

Aturan penting:
1. Pastikan JSON valid (double quote, tanpa trailing comma, tanpa Markdown code fence).
2. 'phenomenon_summary' setiap kandidat maksimal 800 karakter.
3. 'source_type' wajib salah satu dari: OFFICIAL_DATA, REGULATION, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE, WORKING_PAPER, REPUTABLE_NEWS.
4. Seluruh URL bukti wajib berupa URL mentah diawali https:// (tanpa Markdown link, tanpa label).
5. Jangan mengarang nomor halaman. Jika lokasi bukti tidak dapat dipastikan, tulis: Tidak dapat dipastikan.
6. Status harus salah satu dari: SIAP_DIBAWA, PERLU_DIPERIKSA, atau JANGAN_DIGUNAKAN.`;
}

/**
 * Generates copyable prompt for student to ask ChatGPT/Gemini to fix invalid URLs.
 */
export function generateFixUrlPrompt(): string {
  return `Perbaiki HANYA format field evidence[].url pada blok SKRIFLOW_FENOMENA_V1 berikut.

ATURAN:
1. Jangan mengubah kandidat, nama fenomena, klaim, angka, tanggal, sumber, status, quality, limitation, atau field lain.
2. Ubah Markdown link [teks](https://...) menjadi URL mentah https://...
3. Setiap field url harus berisi tepat satu URL mentah.
4. Gunakan hanya https://.
5. Jangan menambahkan label, catatan, tanda baca, atau teks setelah URL.
6. Jika satu field memuat lebih dari satu URL, jangan memilih sembarangan. Kosongkan field url dan jelaskan masalahnya pada access_note.
7. Keluarkan kembali tepat satu blok SKRIFLOW_FENOMENA_V1.
8. Gunakan JSON valid.
9. Jangan menulis teks di luar marker.`;
}

/**
 * Generates targeted prompt to repair phenomenon fields that exceeded downstream character limits.
 * Does not mutate unaffected fields, academic substance, or auto-select.
 */
export function generatePhenomenonLengthRepairPrompt(
  violations: Array<{ field: string; actualLength: number; allowedLength: number }> = []
): string {
  const violationBullets = violations.length > 0
    ? violations.map((v) => `- ${v.field}: ${v.actualLength} karakter (maksimal ${v.allowedLength} karakter)`).join("\n")
    : `- phenomenon_summary: maksimal ${RESEARCH_FIELD_LIMITS.selectedPhenomenon} karakter`;

  return `Perbaiki HANYA panjang karakter field kandidat fenomena yang melanggar batas berikut agar sesuai dengan kebutuhan form langkah berikutnya:

[FIELD MELEBIHI BATAS]
${violationBullets}

[INSTRUKSI PERBAIKAN]
1. Ringkas HANYA field yang disebutkan di atas agar panjangnya berada di bawah batas maksimal.
2. Jangan mengubah kandidat lain, klaim bukti, sumber, angka, URL, atau status.
3. Jangan memilih satu fenomena secara otomatis untuk mahasiswa.
4. Pertahankan seluruh informasi kunci (fakta, objek, periode, rujukan) dalam batas karakter yang ditentukan.
5. Keluarkan kembali blok utuh === BEGIN SKRIFLOW_FENOMENA_V1 === ... === END SKRIFLOW_FENOMENA_V1 ===.`;
}
