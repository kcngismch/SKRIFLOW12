/**
 * SKRIFLOW Cross-Tool Academic Gates Engine (Gates A – J)
 * 
 * Reusable, deterministic pure validation functions enforcing academic rigor
 * and traceability across Tool 1 through Tool 4.
 */

import {
  SourceIdentity,
  DirectRelevance,
  AcademicRole,
  PhenomenonCoherenceAudit,
  SourceIndependenceAudit,
  GapAssessment,
  Bab1FoundationStatus,
} from "@/types/tool";

// =========================================================================
// SHARED DETECTORS (dipakai lintas gate & parser)
// =========================================================================

/**
 * Leksikon klaim kausal Bahasa Indonesia. Menangkap frasa yang lazim dipakai
 * mahasiswa untuk menyatakan sebab-akibat dari data korelasional.
 * Dipakai untuk menandai (bukan menghapus) klaim yang perlu diperiksa.
 */
export const CAUSAL_CLAIM_TERMS: readonly RegExp[] = [
  /\bmenyebabkan\b/gi,
  /\bmengakibatkan\b/gi,
  /\bberpengaruh\b/gi,
  /\bmemengaruhi\b/gi,
  /\bmempengaruhi\b/gi,
  /\bberdampak\b/gi,
  /\bdampak\s+(nyata|signifikan|positif|negatif)\b/gi,
  /\bmenimbulkan\b/gi,
  /\bmendatangkan\b/gi,
  /\bmengubah\b/gi,
  /\bmeningkatkan\b/gi,
  /\bmenurunkan\b/gi,
  /\bmemperbaiki\b/gi,
  /\bmendorong\b/gi,
  /\bmembuktikan\s+bahwa\b/gi,
  /\bmembuktikan\b/gi,
  /\bterbukti\s+(menyebabkan|berpengaruh|memengaruhi|mempengaruhi|meningkatkan|menurunkan)\b/gi,
  /\bmenghasilkan\s+dampak\s+mutlak\b/gi,
  /\bperlu\s+dikendalikan\b/gi,
];

/**
 * Frasa klaim ketiadaan bukti (absence claim). Melanggar prinsip
 * "no evidence != evidence of absence": hasil pencarian tidak boleh
 * diubah menjadi pernyataan bahwa penelitian tidak ada.
 */
export const ABSENCE_CLAIM_TERMS: readonly RegExp[] = [
  /\bbelum\s+pernah\s+diteliti\b/gi,
  /\bbelum\s+pernah\s+dilakukan\s+penelitian\b/gi,
  /\bbelum\s+ada\s+penelitian\b/gi,
  /\btidak\s+ada\s+penelitian\b/gi,
  /\bbelum\s+ada\s+(yang\s+)?(meneliti|membahas|mengkaji)\b/gi,
  /\btidak\s+ada\s+(yang\s+)?(meneliti|membahas|mengkaji)\b/gi,
  /\bmasih\s+(sangat\s+)?(jarang|sedikit)\s+(penelitian|studi|kajian)\b/gi,
  /\bminim\s+(penelitian|studi|kajian)\b/gi,
  /\bpenelitian\s+pertama\b/gi,
  /\bstudi\s+pertama\b/gi,
  /\bmerupakan\s+celah\s+(penelitian|literatur)\b/gi,
  /\bmengisi\s+kekosongan\s+literatur\b/gi,
  /\btingkat\s+nasional\s+belum\s+ada\b/gi,
];

/** Ambil contoh frasa yang cocok, untuk ditampilkan sebagai alasan. */
export function findMatchingTerms(text: string, lexicon: readonly RegExp[]): string[] {
  const found: string[] = [];
  for (const rx of lexicon) {
    const re = new RegExp(rx.source, rx.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const hit = m[0].trim();
      if (hit && !found.includes(hit)) found.push(hit);
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  return found;
}

/** true bila teks memuat klaim ketiadaan bukti. */
export function hasAbsenceClaim(text: string): boolean {
  return findMatchingTerms(text, ABSENCE_CLAIM_TERMS).length > 0;
}

/** true bila teks memuat klaim kausal. */
export function hasCausalClaim(text: string): boolean {
  return findMatchingTerms(text, CAUSAL_CLAIM_TERMS).length > 0;
}

// =========================================================================
// GATE A: SOURCE IDENTITY AUDIT
// =========================================================================

export interface SourceIdentityInput {
  title?: string;
  authors?: string[] | string;
  year?: string;
  journalOrPublisher?: string;
  documentType?: string;
  doi?: string;
  fullTextUrl?: string;
  officialMetadataTitle?: string;
  officialMetadataAuthors?: string[] | string;
  officialMetadataYear?: string;
  isRetracted?: boolean;
  isWithdrawn?: boolean;
}

export function auditSourceIdentity(input: SourceIdentityInput): SourceIdentity {
  const title = (input.title || "").trim();
  const rawAuthors = input.authors;
  const authors = Array.isArray(rawAuthors)
    ? rawAuthors.map((a) => a.trim()).filter(Boolean)
    : typeof rawAuthors === "string" && rawAuthors.trim()
    ? rawAuthors.split(/[,;&]/).map((a) => a.trim()).filter(Boolean)
    : [];
  const year = (input.year || "").trim();
  const journalOrPublisher = (input.journalOrPublisher || "").trim();
  const documentType = (input.documentType || "EMPIRICAL_ARTICLE").trim();
  const doi = (input.doi || "").trim() || undefined;
  const fullTextUrl = (input.fullTextUrl || "").trim();

  // Check officially withdrawn / retracted
  if (input.isRetracted || input.isWithdrawn) {
    return {
      title,
      authors,
      year,
      journalOrPublisher,
      documentType,
      doi,
      fullTextUrl,
      identityStatus: "INVALID",
      fullTextStatus: "UNAVAILABLE",
    };
  }

  // Check conflicting metadata
  let hasConflict = false;
  if (input.officialMetadataTitle && title) {
    const normDeclared = input.officialMetadataTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normActual = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normDeclared && normActual && normDeclared !== normActual && !normDeclared.includes(normActual) && !normActual.includes(normDeclared)) {
      hasConflict = true;
    }
  }

  if (input.officialMetadataYear && year && input.officialMetadataYear.trim() !== year.trim()) {
    hasConflict = true;
  }

  if (hasConflict) {
    return {
      title,
      authors,
      year,
      journalOrPublisher,
      documentType,
      doi,
      fullTextUrl,
      identityStatus: "NEEDS_MANUAL_CHECK",
      fullTextStatus: fullTextUrl ? "PARTIAL" : "UNAVAILABLE",
    };
  }

  // Check presence of core identity
  const isComplete = title.length > 5 && authors.length > 0 && year.length >= 4 && journalOrPublisher.length > 2;

  return {
    title,
    authors,
    year,
    journalOrPublisher,
    documentType,
    doi,
    fullTextUrl,
    identityStatus: isComplete ? "VERIFIED" : "INDICATED",
    fullTextStatus: fullTextUrl ? "FULL_TEXT_VERIFIED" : "METADATA_ONLY",
  };
}

// =========================================================================
// GATE B: FULL-TEXT STATUS AUDIT
// =========================================================================

export interface FullTextAuditInput {
  hasBodyText: boolean;
  hasMethodsAndData: boolean;
  hasResultsAndConclusion: boolean;
  isAbstractOnly?: boolean;
  isLandingPageOnly?: boolean;
  isMetadataOnly?: boolean;
  isDoiLandingPageOnly?: boolean;
  documentType?: string;
}

export function auditFullTextStatus(input: FullTextAuditInput): "FULL_TEXT_VERIFIED" | "PARTIAL" | "METADATA_ONLY" | "UNAVAILABLE" {
  if (input.isAbstractOnly || input.isLandingPageOnly || input.isMetadataOnly || input.isDoiLandingPageOnly) {
    return "METADATA_ONLY";
  }

  if (!input.hasBodyText) {
    return "UNAVAILABLE";
  }

  if (input.hasMethodsAndData && input.hasResultsAndConclusion) {
    return "FULL_TEXT_VERIFIED";
  }

  if (input.hasMethodsAndData || input.hasResultsAndConclusion) {
    return "PARTIAL";
  }

  return "METADATA_ONLY";
}

// =========================================================================
// GATE C: DIRECT RELEVANCE AUDIT
// =========================================================================

export interface DirectRelevanceInput {
  sourceEventOrExposure: string;
  sourceConstruct: string;
  sourceOutcome: string;
  sourceObject?: string;
  sourceGeography?: string;
  sourceDesign?: string;

  targetEventOrExposure: string;
  targetConstruct: string;
  targetOutcome: string;
  targetObject?: string;
  targetGeography?: string;
  targetDesign?: string;
}

export function auditDirectRelevance(input: DirectRelevanceInput): {
  relevance: DirectRelevance;
  academicRole: AcademicRole;
} {
  const norm = (s?: string) => (s || "").toLowerCase().trim();

  const srcEvent = norm(input.sourceEventOrExposure);
  const tgtEvent = norm(input.targetEventOrExposure);
  const srcOutcome = norm(input.sourceOutcome);
  const tgtOutcome = norm(input.targetOutcome);
  const srcConst = norm(input.sourceConstruct);
  const tgtConst = norm(input.targetConstruct);

  // Axis 1: Event / Exposure
  let eventMatch: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN" = "UNKNOWN";
  if (!srcEvent || !tgtEvent) {
    eventMatch = "UNKNOWN";
  } else if (srcEvent === tgtEvent || srcEvent.includes(tgtEvent) || tgtEvent.includes(srcEvent)) {
    eventMatch = "MATCH";
  } else if (
    (srcEvent.includes("announcement") || srcEvent.includes("publikasi") || srcEvent.includes("pengumuman")) &&
    (tgtEvent.includes("announcement") || tgtEvent.includes("publikasi") || tgtEvent.includes("pengumuman"))
  ) {
    eventMatch = "MATCH";
  } else if (
    (srcEvent.includes("laporan keuangan") || srcEvent.includes("laba")) &&
    (tgtEvent.includes("laporan keuangan") || tgtEvent.includes("laba"))
  ) {
    eventMatch = "PARTIAL";
  } else {
    eventMatch = "NO_MATCH";
  }

  // Axis 2: Construct / Information
  let constructMatch: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN" = "UNKNOWN";
  if (!srcConst || !tgtConst) {
    constructMatch = "UNKNOWN";
  } else if (srcConst === tgtConst || srcConst.includes(tgtConst) || tgtConst.includes(srcConst)) {
    constructMatch = "MATCH";
  } else if (srcConst.includes("laba") || tgtConst.includes("laba") || srcConst.includes("earnings") || tgtConst.includes("earnings")) {
    constructMatch = "PARTIAL";
  } else {
    constructMatch = "NO_MATCH";
  }

  // Axis 3: Outcome
  let outcomeMatch: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN" = "UNKNOWN";
  if (!srcOutcome || !tgtOutcome) {
    outcomeMatch = "UNKNOWN";
  } else if (srcOutcome === tgtOutcome || srcOutcome.includes(tgtOutcome) || tgtOutcome.includes(srcOutcome)) {
    outcomeMatch = "MATCH";
  } else if (
    (srcOutcome.includes("return") || srcOutcome.includes("erc") || srcOutcome.includes("reaksi") || srcOutcome.includes("respons")) &&
    (tgtOutcome.includes("return") || tgtOutcome.includes("erc") || tgtOutcome.includes("reaksi") || tgtOutcome.includes("respons"))
  ) {
    outcomeMatch = "MATCH";
  } else if (
    (srcOutcome.includes("harga") || srcOutcome.includes("volume") || srcOutcome.includes("tva") || srcOutcome.includes("likuiditas")) &&
    (tgtOutcome.includes("harga") || tgtOutcome.includes("volume") || tgtOutcome.includes("tva") || tgtOutcome.includes("likuiditas"))
  ) {
    outcomeMatch = "PARTIAL";
  } else {
    outcomeMatch = "NO_MATCH";
  }

  // Special Accounting Rule: Value relevance without event announcement != direct core for event announcement
  const isTargetEventAnnouncement = tgtEvent.includes("announcement") || tgtEvent.includes("pengumuman") || tgtEvent.includes("publikasi");
  const isSourceValueRelevanceOnly = srcEvent.includes("value relevance") || srcConst.includes("value relevance") || (srcOutcome.includes("harga akhir tahun") && !srcEvent.includes("pengumuman"));

  if (isTargetEventAnnouncement && isSourceValueRelevanceOnly) {
    eventMatch = "NO_MATCH";
  }

  // Axis 4: Object
  const objectMatch: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN" = "MATCH";
  // Axis 5: Geography
  const geographyMatch: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN" = "MATCH";
  // Axis 6: Design
  const designMatch: "MATCH" | "PARTIAL" | "NO_MATCH" | "UNKNOWN" = "MATCH";

  // Overall conclusion
  let overall: "DIRECT" | "PARTIAL" | "CONTEXT_ONLY" | "IRRELEVANT" = "CONTEXT_ONLY";
  let academicRole: AcademicRole = "PENDUKUNG_KONTEKS";
  let reason = "Memberikan konteks umum atau metodologis.";

  if (eventMatch === "MATCH" && (outcomeMatch === "MATCH" || outcomeMatch === "PARTIAL")) {
    overall = "DIRECT";
    academicRole = "INTI_LANGSUNG";
    reason = "Cocok langsung pada peristiwa/exposure dan outcome penelitian.";
  } else if (eventMatch === "PARTIAL" && outcomeMatch === "MATCH") {
    overall = "PARTIAL";
    academicRole = "INTI_SEBAGIAN";
    reason = "Dekat secara konsep tetapi salah satu unsur inti hanya sebagian sesuai.";
  } else if (isSourceValueRelevanceOnly || (constructMatch !== "NO_MATCH" && constructMatch !== "UNKNOWN")) {
    overall = "CONTEXT_ONLY";
    academicRole = "PENDUKUNG_KONTEKS";
    reason = "Mendukung konteks teori atau konsep informasi tetapi bukan bukti empiris langsung peristiwa aktif.";
  } else if (eventMatch === "NO_MATCH" && outcomeMatch === "NO_MATCH") {
    overall = "IRRELEVANT";
    academicRole = "DIABAIKAN";
    reason = "Tidak menguji peristiwa maupun outcome yang relevan dengan fokus aktif.";
  } else {
    overall = "CONTEXT_ONLY";
    academicRole = "PENDUKUNG_KONTEKS";
    reason = "Mendukung konteks teori atau konsep tetapi bukan bukti empiris langsung.";
  }

  return {
    relevance: {
      eventOrExposure: eventMatch,
      constructOrInformation: constructMatch,
      outcome: outcomeMatch,
      object: objectMatch,
      geography: geographyMatch,
      design: designMatch,
      overall,
      classificationReason: reason,
    },
    academicRole,
  };
}

// =========================================================================
// GATE D: PHENOMENON COHERENCE AUDIT
// =========================================================================

export interface PhenomenonCoherenceInput {
  events?: string[];
  outcomes?: string[];
  objectOrPopulation?: string;
  geography?: string;
  referencePeriod?: string;
  rawSummary?: string;
}

export function auditPhenomenonCoherence(input: PhenomenonCoherenceInput): PhenomenonCoherenceAudit {
  const mixedEvents: string[] = [];
  const mixedOutcomes: string[] = [];
  const notes: string[] = [];

  const text = ((input.rawSummary || "") + " " + (input.events || []).join(" ") + " " + (input.outcomes || []).join(" ")).toLowerCase();

  // 1. Detect mixed event families (capital markets + generic)
  const eventTypes = [
    { label: "audited financial statement announcement", match: /audited|audit report|laporan keuangan.*teraudit|laporan audit/i },
    { label: "earnings announcement/release", match: /earnings announcement|pengumuman laba|rilis laba/i },
    { label: "annual report", match: /annual report|laporan tahunan/i },
    { label: "interim report", match: /interim report|laporan triwulan|triwulan|kuartal/i },
    { label: "general corporate disclosure", match: /pengungkapan sukarela|voluntary disclosure|corporate disclosure/i },
    { label: "policy or regulation change", match: /\b(policy_change|perubahan regulasi|kebijakan baru|regulasi baru)\b/i },
    { label: "technology/system adoption", match: /\b(adoption|adopsi teknologi|implementasi ai|adopsi sistem)\b/i },
    { label: "business/operational practice", match: /\b(practice|praktik operasional|praktik bisnis|tata kelola)\b/i },
    { label: "incident/crisis/fraud", match: /\b(incident|insiden|krisis|fraud|kasus fraud|skandal)\b/i },
  ];

  const foundEvents = eventTypes.filter((e) => e.match.test(text)).map((e) => e.label);
  if (foundEvents.length > 1) {
    mixedEvents.push(...foundEvents);
  }

  // 2. If structured events are provided, check distinct normalized event families
  if (input.events && input.events.length > 1) {
    const families = new Set(input.events.map((ev) => normalizeEventFamily(ev).family).filter((f) => f !== "OTHER"));
    if (families.size > 1) {
      for (const fam of families) {
        if (!mixedEvents.includes(fam)) {
          mixedEvents.push(fam);
        }
      }
    }
  }

  // Detect mixed outcome measures
  const outcomeTypes = [
    { label: "harga saham (price level)", match: /\bharga saham\b|\bstock price\b|\bclosing price\b/i },
    { label: "abnormal return (event window return)", match: /\babnormal return\b|\bcar\b|\bcaar\b/i },
    { label: "earnings response coefficient (ERC)", match: /\berc\b|\bearnings response coefficient\b/i },
    { label: "trading volume activity (TVA)", match: /\btva\b|\btrading volume\b|\bvolume perdagangan\b/i },
    { label: "bid-ask spread / liquidity", match: /\bbid-ask\b|\blikuiditas\b|\bspread\b/i },
  ];

  const foundOutcomes = outcomeTypes.filter((o) => o.match.test(text)).map((o) => o.label);
  if (foundOutcomes.length > 1) {
    mixedOutcomes.push(...foundOutcomes);
  }

  let status: "COHERENT_ENOUGH" | "NEEDS_NARROWING" | "INCOHERENT" = "COHERENT_ENOUGH";

  if (mixedEvents.length > 2 || mixedOutcomes.length > 2) {
    status = "INCOHERENT";
    notes.push("Fenomena mencampuradukkan terlalu banyak jenis peristiwa dan indikator respons yang berbeda.");
  } else if (mixedEvents.length > 1 || mixedOutcomes.length > 1) {
    status = "NEEDS_NARROWING";
    notes.push("Fenomena masih terlalu lebar karena mencakup beberapa jenis peristiwa atau ukuran pasar sekaligus.");
  } else {
    status = "COHERENT_ENOUGH";
    notes.push("Keluarga peristiwa dan ukuran outcome terdefinisi secara terfokus.");
  }

  return {
    status,
    mixedEvents,
    mixedOutcomes,
    notes,
  };
}

// =========================================================================
// GENERIC EVENT FAMILY NORMALIZATION
// =========================================================================

export function normalizeEventFamily(raw?: string): {
  family: import("@/types/tool").GenericEventFamily;
  detail: string;
} {
  if (!raw || typeof raw !== "string") {
    return { family: "OTHER", detail: "Peristiwa Umum" };
  }
  const clean = raw.trim().toLowerCase().replace(/_/g, " ");

  if (clean.includes("audited") || clean.includes("audit report") || clean.includes("laporan keuangan teraudit")) {
    return { family: "PUBLICATION", detail: "Publikasi Laporan Keuangan Teraudit" };
  }
  if (clean.includes("earnings") || clean.includes("laba")) {
    return { family: "PUBLICATION", detail: "Pengumuman Laba" };
  }
  if (clean.includes("annual report") || clean.includes("laporan tahunan")) {
    return { family: "PUBLICATION", detail: "Publikasi Laporan Tahunan" };
  }
  if (clean.includes("interim") || clean.includes("triwulan") || clean.includes("kuartal")) {
    return { family: "PUBLICATION", detail: "Publikasi Laporan Triwulan" };
  }
  if (clean.includes("disclosure") || clean.includes("pengungkapan")) {
    return { family: "PUBLICATION", detail: "Pengungkapan Informasi Korporasi" };
  }
  if (clean.includes("policy") || clean.includes("kebijakan") || clean.includes("regulasi") || clean.includes("regulation")) {
    return { family: "POLICY_CHANGE", detail: "Perubahan Regulasi atau Kebijakan" };
  }
  if (clean.includes("adopt") || clean.includes("adopsi") || clean.includes("implementasi")) {
    return { family: "ADOPTION", detail: "Adopsi Teknologi / Standar" };
  }
  if (clean.includes("practice") || clean.includes("praktik")) {
    return { family: "PRACTICE", detail: "Praktik Operasional / Bisnis" };
  }
  if (clean.includes("performance") || clean.includes("kinerja")) {
    return { family: "PERFORMANCE", detail: "Kinerja atau Hasil Finansial/Operasional" };
  }
  if (clean.includes("incident") || clean.includes("kasus") || clean.includes("krisis") || clean.includes("fraud")) {
    return { family: "INCIDENT", detail: "Insiden / Kasus Khusus" };
  }

  const GENERIC_SET: import("@/types/tool").GenericEventFamily[] = [
    "PUBLICATION",
    "POLICY_CHANGE",
    "ADOPTION",
    "PRACTICE",
    "PERFORMANCE",
    "INCIDENT",
    "OTHER",
  ];
  const upper = raw.trim().toUpperCase() as import("@/types/tool").GenericEventFamily;
  if (GENERIC_SET.includes(upper)) {
    return { family: upper, detail: raw.trim() };
  }

  return { family: "OTHER", detail: raw.trim() };
}

// =========================================================================
// EFFECTIVE STATUS COMPUTATION
// =========================================================================

export interface EffectiveStatusEvaluationInput {
  reportedStatus: import("@/types/tool").PhenomenonStatus;
  coherenceStatus?: "COHERENT_ENOUGH" | "NEEDS_NARROWING" | "INCOHERENT";
  evidenceCount: number;
  uniqueSourceCount: number;
  independentAuthorTeamCount?: number;
  hasFabricatedOrUntraceableSource?: boolean;
  hasUnsupportedClaim?: boolean;
  hasOfficialRetraction?: boolean;
  hasAiResearchReportAsSource?: boolean;
  evidenceLocationIsUnclear?: boolean;
  scopeIsStillBroad?: boolean;
  traceabilityIsNotStrong?: boolean;
}

export function calculateEffectivePhenomenonStatus(input: EffectiveStatusEvaluationInput): {
  effectiveStatus: import("@/types/tool").PhenomenonStatus;
  isOverridden: boolean;
  overrideReason?: string;
} {
  const isFatal =
    input.hasFabricatedOrUntraceableSource ||
    input.hasUnsupportedClaim ||
    input.hasOfficialRetraction ||
    input.hasAiResearchReportAsSource ||
    input.coherenceStatus === "INCOHERENT" ||
    input.reportedStatus === "JANGAN_DIGUNAKAN";

  if (isFatal) {
    const reasons: string[] = [];
    if (input.coherenceStatus === "INCOHERENT") {
      reasons.push("Fenomena mencampuradukkan peristiwa atau ukuran respons yang tidak sejalan.");
    }
    if (input.hasFabricatedOrUntraceableSource) {
      reasons.push("Terdapat indikasi sumber yang tidak dapat ditelusuri atau URL rusak.");
    }
    if (input.hasOfficialRetraction) {
      reasons.push("Sumber terkonfirmasi ditarik kembali (retracted).");
    }
    if (input.hasAiResearchReportAsSource) {
      reasons.push("Research Report AI digunakan sebagai artikel akademik.");
    }
    if (input.hasUnsupportedClaim) {
      reasons.push("Klaim fenomena tidak didukung sumber.");
    }
    const reasonText = reasons.length > 0
      ? reasons.join(" ")
      : "Kandidat memiliki kendala akademik fatal sehingga tidak dapat digunakan.";

    return {
      effectiveStatus: "JANGAN_DIGUNAKAN",
      isOverridden: input.reportedStatus !== "JANGAN_DIGUNAKAN",
      overrideReason: input.reportedStatus !== "JANGAN_DIGUNAKAN" ? reasonText : undefined,
    };
  }

  const isConditional =
    input.evidenceCount < 2 ||
    input.uniqueSourceCount < 2 ||
    (input.independentAuthorTeamCount !== undefined && input.independentAuthorTeamCount < 2) ||
    input.coherenceStatus === "NEEDS_NARROWING" ||
    input.evidenceLocationIsUnclear ||
    input.scopeIsStillBroad ||
    input.traceabilityIsNotStrong ||
    input.reportedStatus === "PERLU_DIPERIKSA";

  if (isConditional) {
    const reasons: string[] = [];
    if (input.coherenceStatus === "NEEDS_NARROWING") {
      reasons.push("Ruang lingkup fenomena masih terlalu lebar dan perlu dipersempit.");
    }
    if (input.evidenceCount < 2 || input.uniqueSourceCount < 2) {
      reasons.push("Jumlah bukti atau sumber rujukan masih minimal (hanya 1 sumber utama).");
    } else if (input.independentAuthorTeamCount !== undefined && input.independentAuthorTeamCount < 2) {
      reasons.push("Artikel yang tersedia ditulis oleh tim peneliti yang saling beririsan.");
    }
    if (input.evidenceLocationIsUnclear) {
      reasons.push("Lokasi halaman bukti belum dapat dipastikan secara presisi.");
    }
    if (input.traceabilityIsNotStrong) {
      reasons.push("Ketertelusuran metadata sumber masih memerlukan konfirmasi manual.");
    }

    const reasonText = reasons.length > 0
      ? reasons.join(" ")
      : "Kandidat memiliki aspek yang masih perlu diperiksa sebelum dijadikan keputusan final.";

    return {
      effectiveStatus: "PERLU_DIPERIKSA",
      isOverridden: input.reportedStatus === "SIAP_DIBAWA",
      overrideReason: input.reportedStatus === "SIAP_DIBAWA" ? reasonText : undefined,
    };
  }

  return {
    effectiveStatus: "SIAP_DIBAWA",
    isOverridden: false,
  };
}

// =========================================================================
// GATE E: SOURCE INDEPENDENCE AUDIT
// =========================================================================

export interface SourceAuthorItem {
  sourceId: string;
  authors: string[];
}

export function auditSourceIndependence(sources: SourceAuthorItem[]): SourceIndependenceAudit {
  const articleCount = sources.length;
  if (articleCount === 0) {
    return {
      articleCount: 0,
      independentAuthorTeamCount: 0,
      repeatedAuthorClusters: [],
      strength: "WEAK",
    };
  }

  // Normalize author names (take last name or full lowercase)
  const getAuthorKeys = (authorList: string[]) =>
    authorList.map((a) => {
      const parts = a.trim().toLowerCase().split(/\s+/);
      return parts[parts.length - 1]; // last name
    }).filter(Boolean);

  const clusters: string[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < sources.length; i++) {
    if (assigned.has(i)) continue;
    const currentCluster = [sources[i].sourceId];
    const authorsI = new Set(getAuthorKeys(sources[i].authors));

    for (let j = i + 1; j < sources.length; j++) {
      if (assigned.has(j)) continue;
      const authorsJ = getAuthorKeys(sources[j].authors);
      const overlap = authorsJ.filter((a) => authorsI.has(a));
      if (overlap.length > 0) {
        currentCluster.push(sources[j].sourceId);
        assigned.add(j);
      }
    }
    assigned.add(i);
    clusters.push(currentCluster);
  }

  const repeatedClusters = clusters.filter((c) => c.length > 1);
  const independentAuthorTeamCount = clusters.length;

  let strength: "STRONG" | "MODERATE" | "WEAK" = "WEAK";
  if (independentAuthorTeamCount >= 3) {
    strength = "STRONG";
  } else if (independentAuthorTeamCount >= 2) {
    strength = "MODERATE";
  } else {
    strength = "WEAK";
  }

  return {
    articleCount,
    independentAuthorTeamCount,
    repeatedAuthorClusters: repeatedClusters,
    strength,
  };
}

// =========================================================================
// GATE F: CLAIM INTERPRETATION & STATISTICAL RED FLAGS
// =========================================================================

export interface ClaimAuditInput {
  claim: string;
  hasFTestOnly?: boolean;
  hasR2DifferenceOnly?: boolean;
  hasInteractionTerm?: boolean;
  hasIndirectEffectTest?: boolean;
  vafValue?: number;
  r2Value?: number;
  isObservational?: boolean;
}

export function auditClaimInterpretation(input: ClaimAuditInput): {
  interpretationStatus: "SAFE" | "NEEDS_CHECK" | "STATISTICAL_RED_FLAG";
  prohibitedClaims: string[];
  reasons: string[];
  neutralClaim: string;
} {
  const prohibitedClaims: string[] = [];
  const reasons: string[] = [];
  let status: "SAFE" | "NEEDS_CHECK" | "STATISTICAL_RED_FLAG" = "SAFE";

  // Check statistical red flags
  if (input.vafValue !== undefined && (input.vafValue > 1.0 || input.vafValue > 100)) {
    status = "STATISTICAL_RED_FLAG";
    reasons.push(`Nilai VAF ${input.vafValue} di luar rentang wajar (0–1 atau 0%–100%). Perlu dicocokkan ke tabel asli.`);
    prohibitedClaims.push("Klaim mediasi penuh/parsial berdasarkan nilai VAF > 1");
  }

  if (input.r2Value !== undefined && input.r2Value > 1.0) {
    status = "STATISTICAL_RED_FLAG";
    reasons.push(`Nilai R² ${input.r2Value} tidak valid (> 1.0).`);
  }

  // Check moderation claims from F-test / R² only
  if (input.hasFTestOnly && !input.hasInteractionTerm) {
    prohibitedClaims.push("Klaim efek moderasi hanya berdasarkan signifikansi uji F");
    reasons.push("Uji F menguji model secara keseluruhan, bukan bukti efek variabel atau moderator tertentu.");
    if (status !== "STATISTICAL_RED_FLAG") status = "NEEDS_CHECK";
  }

  if (input.hasR2DifferenceOnly && !input.hasInteractionTerm) {
    prohibitedClaims.push("Klaim efek moderasi berdasarkan perbedaan R² antarkelompok");
    reasons.push("Perbedaan R² antarkelompok bukan uji formal perbedaan koefisien atau moderasi.");
    if (status !== "STATISTICAL_RED_FLAG") status = "NEEDS_CHECK";
  }

  // Observational causality guard
  let neutral = input.claim;
  if (input.isObservational || !input.claim.includes("eksperimen acak")) {
    // Replace strong causal language with association terms.
    // Leksikon diperluas: frasa kausal paling umum di skripsi Indonesia dulu
    // lolos tanpa flag (hanya 'menyebabkan' & 'membuktikan bahwa' yang ditangkap).
    neutral = neutral
      .replace(/\bmenyebabkan\b/gi, "berasosiasi dengan")
      .replace(/\bmengakibatkan\b/gi, "berasosiasi dengan")
      .replace(/\bberpengaruh\s+(secara\s+)?(positif|negatif|signifikan)?\s*(terhadap)?\b/gi, "berasosiasi dengan")
      .replace(/\bberpengaruh\b/gi, "berasosiasi dengan")
      .replace(/\bme?mengaruhi\b/gi, "berasosiasi dengan")
      .replace(/\bberdampak\b/gi, "berasosiasi dengan")
      .replace(/\bmenimbulkan\b/gi, "berkaitan dengan")
      .replace(/\bmendatangkan\b/gi, "berkaitan dengan")
      .replace(/\bmembuktikan bahwa\b/gi, "menunjukkan bahwa")
      .replace(/\bmembuktikan\b/gi, "menunjukkan")
      .replace(/\bmenghasilkan dampak mutlak\b/gi, "dilaporkan berkaitan dengan")
      .replace(/\bterbukti\s+(menyebabkan|berpengaruh|memengaruhi|mempengaruhi)\b/gi, "berasosiasi dengan")
      .replace(/\bmenyebabkan\b/gi, "berasosiasi dengan");

    // Deteksi frasa kausal yang tersisa (mis. 'meningkatkan', 'menurunkan',
    // 'memperbaiki') — tidak dinetralkan otomatis karena bisa sah secara
    // deskriptif, tetapi wajib ditandai agar peneliti memeriksa.
    const remaining = findMatchingTerms(neutral, CAUSAL_CLAIM_TERMS);
    if (remaining.length > 0) {
      if (status !== "STATISTICAL_RED_FLAG") status = "NEEDS_CHECK";
      reasons.push(
        `Teks memuat frasa sebab-akibat yang belum dapat disimpulkan dari data korelasional: ${remaining.join(", ")}. Gunakan bahasa asosiatif atau jelaskan desain yang mendukung klaim kausal.`
      );
    }
  }

  // Absence claim guard: "tidak ada penelitian" bukan hasil yang sah dari
  // pencarian; hasil pencarian hanya boleh dinyatakan sebagai cakupan paket ini.
  if (hasAbsenceClaim(input.claim)) {
    if (status !== "STATISTICAL_RED_FLAG") status = "NEEDS_CHECK";
    const hits = findMatchingTerms(input.claim, ABSENCE_CLAIM_TERMS);
    prohibitedClaims.push(
      "Klaim ketiadaan bukti ('belum pernah diteliti', 'tidak ada penelitian')."
    );
    reasons.push(
      `Teks menyatakan ketiadaan penelitian (${hits.join(", ")}). Hasil pencarian tidak membuktikan penelitian tidak ada. Tulis: "Tidak ditemukan studi eligible dalam kondisi pencarian dan kriteria inklusi ini."`
    );
    neutral = neutral.replace(
      /\bbelum pernah diteliti\b/gi,
      "belum ditemukan studi eligible dalam pencarian ini"
    );
  }

  return {
    interpretationStatus: status,
    prohibitedClaims,
    reasons,
    neutralClaim: neutral,
  };
}

// =========================================================================
// GATE G: COMPARABILITY AUDIT
// =========================================================================

export interface ComparabilityPairInput {
  constructA: string;
  constructB: string;
  outcomeA: string;
  outcomeB: string;
  proxyA?: string;
  proxyB?: string;
  contextA?: string;
  contextB?: string;
}

export function auditComparability(input: ComparabilityPairInput): {
  comparability: "SEBANDING" | "SEBANDING_SEBAGIAN" | "TIDAK_SEBANDING";
  status: "COMPARABLE" | "PARTIALLY_COMPARABLE" | "NOT_DIRECTLY_COMPARABLE";
  reason: string;
} {
  const norm = (s?: string) => (s || "").toLowerCase().trim();
  const cA = norm(input.constructA);
  const cB = norm(input.constructB);
  const oA = norm(input.outcomeA);
  const oB = norm(input.outcomeB);

  // If constructs or outcomes are completely different measures
  const isErcA = cA.includes("erc") || oA.includes("erc");
  const isErcB = cB.includes("erc") || oB.includes("erc");
  const isPriceA = cA.includes("harga") || cA.includes("price") || oA.includes("harga") || oA.includes("price");
  const isPriceB = cB.includes("harga") || cB.includes("price") || oB.includes("harga") || oB.includes("price");

  if ((isErcA && isPriceB) || (isPriceA && isErcB) || (isErcA !== isErcB && (cA !== cB || oA !== oB))) {
    return {
      comparability: "TIDAK_SEBANDING",
      status: "NOT_DIRECTLY_COMPARABLE",
      reason: "Ukuran ERC dan harga saham memiliki unit dan interpretasi yang berbeda sehingga tidak dapat dibandingkan langsung.",
    };
  }

  if (cA === cB && oA === oB) {
    return {
      comparability: "SEBANDING",
      status: "COMPARABLE",
      reason: "Konstruk dan outcome setara sehingga hasil studi dapat disintesis langsung.",
    };
  }

  return {
    comparability: "SEBANDING_SEBAGIAN",
    status: "PARTIALLY_COMPARABLE",
    reason: "Konstruk atau proksi memiliki kedekatan konsep tetapi batas perbandingan harus dicantumkan.",
  };
}

// =========================================================================
// GATE H: GAP VALIDITY AUDIT
// =========================================================================

export interface GapValidityInput {
  gapStatement: string;
  gapType: string;
  comparableSourceIds: string[];
  independentAuthorTeamCount: number;
  isPackageCoverageOnly?: boolean;
  isComparabilityLimitOnly?: boolean;
  relationToPhenomenon: string;
}

export function auditGapValidity(input: GapValidityInput): GapAssessment {
  const prohibitedClaims: string[] = [
    "Dilarang mengklaim topik 'belum pernah diteliti' hanya karena belum ada di paket literatur saat ini.",
    "Dilarang menyamakan perbedaan proksi instrumen sebagai bukti ketidakpastian empiris tanpa studi sebanding.",
  ];

  if (input.isPackageCoverageOnly || input.gapStatement.toLowerCase().includes("belum ada di paket") || input.gapStatement.toLowerCase().includes("sumber internasional belum ada")) {
    return {
      origin: "PACKAGE_COVERAGE",
      validity: "NOT_A_RESEARCH_GAP",
      comparableSourceIds: input.comparableSourceIds,
      independentAuthorTeamCount: input.independentAuthorTeamCount,
      relationToPhenomenon: input.relationToPhenomenon,
      prohibitedClaims,
    };
  }

  if (input.isComparabilityLimitOnly || input.gapStatement.toLowerCase().includes("tidak dapat digabung")) {
    return {
      origin: "COMPARABILITY_LIMIT",
      validity: "NOT_A_RESEARCH_GAP",
      comparableSourceIds: input.comparableSourceIds,
      independentAuthorTeamCount: input.independentAuthorTeamCount,
      relationToPhenomenon: input.relationToPhenomenon,
      prohibitedClaims,
    };
  }

  // Guard absence-claim: pernyataan "belum pernah diteliti" BUKAN bukti adanya
  // research gap. Hasil pencarian hanya membuktikan cakupan paket ini, bukan
  // ketiadaan penelitian di lapangan. Wajib diturunkan sampai ada bukti pencarian.
  if (hasAbsenceClaim(input.gapStatement)) {
    const hits = findMatchingTerms(input.gapStatement, ABSENCE_CLAIM_TERMS);
    return {
      origin: "PACKAGE_COVERAGE",
      validity: "NOT_A_RESEARCH_GAP",
      comparableSourceIds: input.comparableSourceIds,
      independentAuthorTeamCount: input.independentAuthorTeamCount,
      relationToPhenomenon: input.relationToPhenomenon,
      prohibitedClaims: [
        ...prohibitedClaims,
        `Klaim ketiadaan bukti terdeteksi (${hits.join(", ")}). Bukan research gap sampai pencarian sistematis menunjukkan tidak ada studi eligible dalam kondisi pencarian ini.`,
      ],
    };
  }

  // Product guard: >= 2 direct comparable studies from independent teams for SUPPORTED
  if (input.comparableSourceIds.length >= 2 && input.independentAuthorTeamCount >= 2) {
    return {
      origin: "FIELD_EVIDENCE",
      validity: "SUPPORTED",
      comparableSourceIds: input.comparableSourceIds,
      independentAuthorTeamCount: input.independentAuthorTeamCount,
      relationToPhenomenon: input.relationToPhenomenon,
      prohibitedClaims,
    };
  }

  return {
    origin: "FIELD_EVIDENCE",
    validity: "PROVISIONAL",
    comparableSourceIds: input.comparableSourceIds,
    independentAuthorTeamCount: input.independentAuthorTeamCount,
    relationToPhenomenon: input.relationToPhenomenon,
    prohibitedClaims,
  };
}

// =========================================================================
// GATE I: DATA FEASIBILITY AUDIT
// =========================================================================

export interface DataFeasibilityInput {
  dataForm: string;
  origin: "PUBLIC_SECONDARY" | "RESEARCHER_GENERATED" | "PRIMARY_RESPONDENT" | "INSTITUTIONAL_METADATA";
  isAccessConfirmed: boolean;
  providerOrUrl?: string;
  isAiPromptOutput?: boolean;
}

export function auditDataFeasibility(input: DataFeasibilityInput): {
  status:
    | "PUBLICLY_ACCESSIBLE_CONFIRMED"
    | "ACCESS_INDICATED_NOT_TESTED"
    | "RESEARCHER_GENERATED"
    | "PRIMARY_RESPONDENT_REQUIRED"
    | "UNAVAILABLE_OR_UNKNOWN";
  isSecondaryData: boolean;
  note: string;
} {
  if (input.isAiPromptOutput || input.origin === "RESEARCHER_GENERATED") {
    return {
      status: "RESEARCHER_GENERATED",
      isSecondaryData: false,
      note: "Data dibuat sendiri oleh peneliti (misal melalui prompt AI/coding), bukan data sekunder publik.",
    };
  }

  if (input.origin === "PRIMARY_RESPONDENT") {
    return {
      status: "PRIMARY_RESPONDENT_REQUIRED",
      isSecondaryData: false,
      note: "Memerlukan pengumpulan data primer langsung dari responden/lapangan.",
    };
  }

  if (input.isAccessConfirmed && input.providerOrUrl && input.providerOrUrl.trim().length > 0) {
    return {
      status: "PUBLICLY_ACCESSIBLE_CONFIRMED",
      isSecondaryData: true,
      note: "Data publik terkonfirmasi dan URL/penyedia data dapat diakses langsung.",
    };
  }

  return {
    status: "ACCESS_INDICATED_NOT_TESTED",
    isSecondaryData: true,
    note: "Penyedia data sudah terindikasi tetapi akses, kelengkapan, dan periode observasi belum diuji.",
  };
}

// =========================================================================
// GATE J: BAB 1 READINESS AUDIT
// =========================================================================

export interface Bab1ReadinessInput {
  phenomenonCoherence: "COHERENT_ENOUGH" | "NEEDS_NARROWING" | "INCOHERENT";
  directCoreSourceCount: number;
  independentAuthorTeamCount: number;
  metadataConflictCount: number;
  hasSupportedOrProvisionalGap: boolean;
  isCriticalDataConfirmed: boolean;
  isCriticalDataBlocked?: boolean;
  exactLocatorCount: number;
  totalEmpiricalClaims: number;
}

export function auditBab1Readiness(input: Bab1ReadinessInput): {
  status: Bab1FoundationStatus;
  blockers: string[];
  recoveryActions: string[];
  studentSummary: string;
} {
  const blockers: string[] = [];
  const recoveryActions: string[] = [];

  if (input.phenomenonCoherence !== "COHERENT_ENOUGH") {
    blockers.push("Fenomena penelitian belum koheren (masih mencampur beberapa jenis peristiwa atau ukuran).");
    recoveryActions.push("Persempit fenomena menjadi satu keluarga peristiwa dan satu bentuk respons terukur.");
  }

  if (input.metadataConflictCount > 0) {
    blockers.push(`Terdapat ${input.metadataConflictCount} sumber jangkar dengan konflik identitas naskah/metadata.`);
    recoveryActions.push("Cocokkan kembali judul, penulis, dan DOI naskah ke situs resmi penerbit sebelum digunakan.");
  }

  if (input.isCriticalDataBlocked) {
    blockers.push("Kebutuhan data kritis belum dapat diakses atau tidak tersedia.");
    recoveryActions.push("Pilih arah penelitian alternatif yang datanya benar-benar dapat diakses.");
  }

  if (!input.hasSupportedOrProvisionalGap) {
    blockers.push("Belum ada research gap valid yang ditopang oleh sintesis bukti literatur sebanding.");
    recoveryActions.push("Lakukan pencarian literatur tambahan (recovery search) yang langsung menguji hubungan terkait.");
  }

  if (input.directCoreSourceCount < 3 || input.independentAuthorTeamCount < 2) {
    blockers.push(
      `Paket bukti baru memuat ${input.directCoreSourceCount} sumber langsung dari ${input.independentAuthorTeamCount} tim independen (syarat internal SKRIFLOW: minimal 3 sumber langsung dari 2 tim independen).`
    );
    recoveryActions.push("Tambahkan artikel jurnal empiris yang langsung membahas topik serupa dari tim peneliti berbeda.");
  }

  if (input.exactLocatorCount < input.totalEmpiricalClaims && input.totalEmpiricalClaims > 0) {
    blockers.push("Sebagian klaim empiris belum memiliki nomor halaman atau tabel spesifik.");
    recoveryActions.push("Periksa naskah full-text dan cantumkan lokasi halaman/tabel untuk setiap fakta empiris.");
  }

  // Determine readiness
  let status: Bab1FoundationStatus = "BAB1_READY";

  if (
    input.phenomenonCoherence === "INCOHERENT" ||
    input.metadataConflictCount > 0 ||
    input.isCriticalDataBlocked ||
    input.directCoreSourceCount < 1
  ) {
    status = "BAB1_BLOCKED";
  } else if (
    input.phenomenonCoherence === "NEEDS_NARROWING" ||
    !input.isCriticalDataConfirmed ||
    input.directCoreSourceCount < 3 ||
    input.independentAuthorTeamCount < 2 ||
    blockers.length > 0
  ) {
    status = "BAB1_CONDITIONAL";
  } else {
    status = "BAB1_READY";
  }

  const studentSummary =
    status === "BAB1_READY"
      ? "Fondasi Bab 1 sudah lengkap, koheren, dan siap digunakan untuk menyusun draf latar belakang."
      : status === "BAB1_CONDITIONAL"
      ? "Kamu sudah punya beberapa sumber yang bisa dipakai untuk mulai menyusun kerangka. Namun, bukti untuk bagian tertentu masih perlu dilengkapi."
      : "Fondasi Bab 1 belum aman dilanjutkan karena ada syarat penting yang belum terpenuhi.";

  return {
    status,
    blockers,
    recoveryActions,
    studentSummary,
  };
}


/** Urutan kekuatan rating; dipakai untuk memilih rating terlemah antar-bukti. */
export const RANK: Record<string, number> = { LEMAH: 0, SEDANG: 1, KUAT: 2 };

// =========================================================================
// AUDIT KONTEN OUTPUT (dipakai parser Tool1–Tool4 sebelum output dirender)
//
// Prinsip: aturan akademik yang ditulis di prompt harus punya penegak
// deterministik. Fungsi di bawah mengubah instruksi teks menjadi temuan
// yang bisa ditampilkan ke mahasiswa.
// =========================================================================

export interface ContentAuditFinding {
  code: string;
  severity: "ERROR" | "WARNING";
  message: string;
  field?: string;
}

export interface ContentAuditResult {
  findings: ContentAuditFinding[];
  hasError: boolean;
  hasWarning: boolean;
}

/**
 * Audit teks bebas (judul, ringkasan, klaim, batas klaim) terhadap red line:
 * klaim kausal berlebihan dan klaim ketiadaan bukti.
 * Dipakai Tool1–Tool4 karena semuanya memuat field teks bebas.
 */
/** Penanda negasi/larangan; dipakai agar kalimat pengaman tidak dianggap klaim. */
const NEGATION_MARKERS = /\b(belum|tidak|jangan|dilarang|hindari|bukan|tanpa|tidak dapat|belum dapat|belum aman|hati-hati|perlu diperiksa)\b/i;

/**
 * Filter kecocokan kausal yang sebenarnya kalimat pengaman.
 *
 * "Bukti ini belum membuktikan bahwa PSAK 117 menyebabkan penurunan kinerja"
 * memuat frasa kausal, tetapi maknanya justru membatasi klaim. Tanpa filter ini
 * field pengaman (what_is_not_proven, claim_boundary) selalu salah ditandai.
 */
export function filterNegatedCausal(text: string, terms: readonly RegExp[]): string[] {
  const kalimat = text.split(/(?<=[.!?])\s+|\n+/);
  const hasil: string[] = [];
  for (const k of kalimat) {
    for (const rx of terms) {
      const re = new RegExp(rx.source, rx.flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(k)) !== null) {
        const sebelum = k.slice(0, m.index);
        if (!NEGATION_MARKERS.test(sebelum)) {
          const hit = m[0].trim();
          if (hit && !hasil.includes(hit)) hasil.push(hit);
        }
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
  }
  return hasil;
}

export function auditFreeTextContent(
  text: string,
  field: string,
  opts: { allowCausal?: boolean } = {}
): ContentAuditFinding[] {
  const out: ContentAuditFinding[] = [];
  const val = (text || "").trim();
  if (!val) return out;

  const absence = findMatchingTerms(val, ABSENCE_CLAIM_TERMS);
  if (absence.length > 0) {
    out.push({
      code: "ABSENCE_CLAIM",
      severity: "ERROR",
      field,
      message: `Field '${field}' menyatakan ketiadaan penelitian (${absence.join(", ")}). Hasil pencarian tidak membuktikan penelitian tidak ada. Tulis: "Tidak ditemukan studi eligible dalam kondisi pencarian dan kriteria inklusi ini."`,
    });
  }

  if (!opts.allowCausal) {
    const causal = filterNegatedCausal(val, CAUSAL_CLAIM_TERMS);
    if (causal.length > 0) {
      out.push({
        code: "CAUSAL_CLAIM",
        severity: "WARNING",
        field,
        message: `Field '${field}' memuat frasa sebab-akibat (${causal.join(", ")}) yang tidak dapat disimpulkan dari data korelasional atau dokumen yang hanya melaporkan asosiasi.`,
      });
    }
  }

  return out;
}

/**
 * Audit daftar teks bebas (mis. prohibited_claims milik AI sendiri).
 * Teks di sini justru HARUS memuat frasa kausal — sebab isinya larangan
 * ("Belum aman menyatakan X menyebabkan Y"). Karena itu, klaim kausal tidak
 * ditandai di sini; hanya klaim ketiadaan bukti yang bocor sebagai pernyataan.
 */
export function auditClaimBoundaryList(
  items: unknown,
  field: string
): ContentAuditFinding[] {
  const out: ContentAuditFinding[] = [];
  const list = Array.isArray(items) ? items : [];
  for (let i = 0; i < list.length; i++) {
    const raw = typeof list[i] === "string" ? list[i] : "";
    if (!raw.trim()) continue;
    // Kalimat pengaman lazimnya sudah memuat penanda negasi/larangan
    // ("Belum aman menyatakan ...", "Jangan simpulkan ..."). Selama penanda itu
    // ada, pernyataan tidak dianggap sebagai klaim ketiadaan bukti.
    const negativeMarkers = /belum|tidak|jangan|dilarang|hindari|bukan|tanpa bukti|perlu diperiksa|hati-hati/i;
    if (negativeMarkers.test(raw.trim())) continue;
    const absence = findMatchingTerms(raw, ABSENCE_CLAIM_TERMS);
    if (absence.length > 0) {
      out.push({
        code: "ABSENCE_CLAIM",
        severity: "ERROR",
        field: `${field}[${i}]`,
        message: `Pernyataan '${raw.slice(0, 120)}' berbunyi sebagai fakta ketiadaan penelitian, bukan sebagai peringatan. Nyatakan sebagai batas cakupan pencarian, atau bungkus sebagai kalimat larangan.`,
      });
    }
  }
  return out;
}

/**
 * Gabungkan temuan dari beberapa audit menjadi satu hasil.
 */
export function mergeContentAudit(
  groups: ContentAuditFinding[][]
): ContentAuditResult {
  const seen = new Set<string>();
  const findings: ContentAuditFinding[] = [];
  for (const g of groups) {
    for (const f of g) {
      const key = `${f.code}|${f.field}|${f.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(f);
    }
  }
  return {
    findings,
    hasError: findings.some((f) => f.severity === "ERROR"),
    hasWarning: findings.some((f) => f.severity === "WARNING"),
  };
}

/**
 * Audit identitas sumber: dipakai Tool2/Tool4 untuk memastikan setiap sumber
 * punya jejak yang bisa diverifikasi (URL atau DOI) dan tidak menyamar sebagai
 * dokumen resmi padahal berasal dari agregator pihak ketiga.
 */
export const AGGREGATOR_DOMAINS: readonly string[] = [
  "scribd.com",
  "id.scribd.com",
  "financialfilings.com",
  "academia.edu",
  "researchgate.net",
  "slideshare.net",
  "coursehero.com",
  "studocu.com",
  "pdfcoffee.com",
  "123dok.com",
  "docplayer.net",
];

export const PLACEHOLDER_DOMAINS: readonly string[] = [
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "localhost",
  "invalid",
];

export const PLACEHOLDER_DOI_PREFIXES: readonly string[] = [
  "10.9999/",
  "10.1234/",
  "10.0000/",
  "10.5555/",
];

export function extractDomain(url?: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export interface SourceIdentityAuditInput {
  sourceId: string;
  url?: string;
  doi?: string;
  title?: string;
  declaredType?: string;
}

/**
 * Audit identitas entri sumber. Mengembalikan temuan (bukan menghapus sumber),
 * supaya mahasiswa melihat sendiri sumber mana yang belum bisa dicek.
 */
export function auditSourceEntry(input: SourceIdentityAuditInput): ContentAuditFinding[] {
  const out: ContentAuditFinding[] = [];
  const url = (input.url || "").trim();
  const doi = (input.doi || "").trim();
  const title = (input.title || "").trim();
  const domain = extractDomain(url);
  const label = `Sumber ${input.sourceId}`;

  // 1. Tanpa jejak identitas sama sekali.
  // Peringatan, bukan error: satu-dua sumber tanpa tautan masih wajar. Tetapi
  // bila SELURUH register sumber tanpa identitas, itu ditandai terpisah
  // (lihat auditSourceRegister) karena tidak ada satu pun yang bisa diperiksa.
  if (!url && !doi) {
    out.push({
      code: "SOURCE_NO_IDENTITY",
      severity: "WARNING",
      field: input.sourceId,
      message: `${label} tidak punya URL maupun DOI, jadi keberadaannya belum dapat diperiksa. Tambahkan tautan atau DOI agar bisa diverifikasi.`,
    });
  }

  // 2. Domain placeholder (contoh: example.com)
  if (domain && PLACEHOLDER_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    out.push({
      code: "SOURCE_PLACEHOLDER_DOMAIN",
      severity: "ERROR",
      field: input.sourceId,
      message: `${label} memakai domain contoh (${domain}) yang tidak pernah memuat dokumen nyata.`,
    });
  }

  // 3. DOI pola placeholder
  const doiLower = doi.toLowerCase().replace(/^https?:\/\/doi\.org\//, "");
  const badDoi = PLACEHOLDER_DOI_PREFIXES.find((p) => doiLower.startsWith(p));
  if (badDoi) {
    out.push({
      code: "SOURCE_PLACEHOLDER_DOI",
      severity: "ERROR",
      field: input.sourceId,
      message: `${label} memakai DOI berpola contoh (${doiLower}). DOI seperti ini tidak terdaftar di Crossref dan biasanya hasil karangan.`,
    });
  }

  // 4. Agregator pihak ketiga menyamar sebagai dokumen resmi
  if (domain && AGGREGATOR_DOMAINS.includes(domain)) {
    const t = (input.declaredType || "").toUpperCase();
    if (t === "INSTITUTIONAL_REPORT" || t === "REGULATION" || t === "OFFICIAL_DATA") {
      out.push({
        code: "SOURCE_AGGREGATOR_MISLABEL",
        severity: "WARNING",
        field: input.sourceId,
        message: `${label} bersumber dari situs agregator (${domain}) tetapi diberi label '${input.declaredType}' yang berarti dokumen resmi. Turunkan labelnya atau ganti dengan dokumen aslinya.`,
      });
    } else {
      out.push({
        code: "SOURCE_AGGREGATOR",
        severity: "WARNING",
        field: input.sourceId,
        message: `${label} berasal dari situs agregator pihak ketiga (${domain}); isinya belum tentu sama dengan dokumen aslinya.`,
      });
    }
  }

  // 5. Judul tidak ada
  if (!title) {
    out.push({
      code: "SOURCE_NO_TITLE",
      severity: "WARNING",
      field: input.sourceId,
      message: `${label} tidak punya judul, sehingga mahasiswa tidak tahu dokumen apa yang dimaksud.`,
    });
  }

  return out;
}

/**
 * Audit seluruh register sumber. Menandai ERROR hanya bila TIDAK ADA SATU PUN
 * sumber yang punya identitas yang bisa diperiksa — pada kondisi itu, seluruh
 * rantai bukti berdiri di atas dokumen yang keberadaannya tidak bisa dibuktikan.
 */
export function auditSourceRegister(
  entries: SourceIdentityAuditInput[]
): ContentAuditFinding[] {
  const out: ContentAuditFinding[] = [];
  if (entries.length === 0) return out;

  const terverifikasi = entries.filter((e) => (e.url || "").trim() || (e.doi || "").trim());
  // Judul juga dihitung: sumber tanpa tautan/DOI masih bisa diperiksa keberadaannya
  // bila judul dokumennya jelas. Yang benar-benar buta adalah sumber tanpa keduanya.
  const terjJudul = entries.filter((e) => (e.title || "").trim());
  if (terverifikasi.length === 0 && terjJudul.length === 0) {
    out.push({
      code: "SOURCE_REGISTER_NO_IDENTITY",
      severity: "ERROR",
      field: "source_weights",
      message: `Tidak ada satu pun dari ${entries.length} sumber yang punya judul, URL, atau DOI. Seluruh bukti berdiri di atas dokumen yang keberadaannya belum bisa diperiksa. Kembali ke prompt Tool 4: keluarkan ulang bagian source_weights dengan field title dan url/doi terisi, lalu proses ulang.`,
    });
  } else if (terverifikasi.length === 0 && terjJudul.length > 0) {
    out.push({
      code: "SOURCE_REGISTER_NO_IDENTITY",
      severity: "WARNING",
      field: "source_weights",
      message: `${entries.length} sumber punya judul tetapi tidak ada satu pun yang menyertakan URL atau DOI. Keberadaan dokumen belum bisa dicek; minimal tautan untuk sumber utama.`,
    });
  } else if (terverifikasi.length < entries.length / 2) {
    out.push({
      code: "SOURCE_REGISTER_MOSTLY_UNVERIFIED",
      severity: "WARNING",
      field: "source_weights",
      message: `Hanya ${terverifikasi.length} dari ${entries.length} sumber yang punya URL atau DOI. Sebagian besar bukti belum bisa diperiksa mandiri.`,
    });
  }

  return out;
}


// =========================================================================
// AUDIT TOOL2: KUALITAS METADATA & LABEL JENIS SUMBER
// Dipakai phenomenonParser. Rating kualitas TIDAK boleh dipercaya dari AI:
// AI menulis "KUAT" walau judul/penerbit/tanggal kosong (temuan F20/F21).
// =========================================================================

export interface SourceMetadataFields {
  sourceTitle?: string;
  publisherOrInstitution?: string;
  publicationDate?: string;
  referencePeriod?: string;
  url?: string;
  evidenceLocation?: string;
}

const KOSONG = new Set([
  "", "-", "n/a", "na", "tidak ada", "tidak diketahui", "belum diketahui",
  "tidak dapat dipastikan", "sumber data / publikasi", "unknown", "none",
]);

function terisi(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s.length > 0 && !KOSONG.has(s);
}

/**
 * Hitung kualitas metadata secara deterministik dari kelengkapan identitas sumber.
 * Mengembalikan rating KUAT/SEDANG/LEMAH + dimensi mana yang kosong.
 */
export function deriveMetadataQuality(ev: SourceMetadataFields): {
  rating: "KUAT" | "SEDANG" | "LEMAH";
  missing: string[];
} {
  const missing: string[] = [];
  if (!terisi(ev.sourceTitle)) missing.push("judul sumber");
  if (!terisi(ev.publisherOrInstitution)) missing.push("penerbit/lembaga");
  if (!terisi(ev.publicationDate) && !terisi(ev.referencePeriod)) {
    missing.push("tanggal/periode");
  }
  if (!terisi(ev.url)) missing.push("tautan");

  // 4 dimensi identitas; tautan saja tidak cukup untuk dianggap KUAT.
  let rating: "KUAT" | "SEDANG" | "LEMAH";
  if (missing.length === 0) rating = "KUAT";
  else if (missing.length <= 2 || terisi(ev.url)) rating = "SEDANG";
  else rating = "LEMAH";
  return { rating, missing };
}

/**
 * Turunkan rating traceability secara deterministik; AI cenderung menulis KUAT
 * bahkan saat tautan tidak ada.
 */
export function deriveTraceability(ev: SourceMetadataFields): "KUAT" | "SEDANG" | "LEMAH" {
  if (terisi(ev.url) && terisi(ev.sourceTitle)) return "KUAT";
  if (terisi(ev.url) || terisi(ev.sourceTitle)) return "SEDANG";
  return "LEMAH";
}

const AGREGATOR_DOMAINS = [
  "scribd.com", "slideshare.net", "academia.edu", "coursehero.com",
  "123dok.com", "docplayer", "pdfcoffee.com", "studocu",
];

export interface SourceTypeLabelInput {
  url: string;
  declaredType: string;
}

/**
 * Periksa apakah label jenis sumber tidak cocok dengan domainnya.
 * Contoh: halaman Scribd tidak boleh dilabeli INSTITUTIONAL_REPORT.
 */
export function auditSourceTypeLabel(input: SourceTypeLabelInput): ContentAuditFinding[] {
  const out: ContentAuditFinding[] = [];
  const url = String(input.url ?? "").toLowerCase();
  const tipe = String(input.declaredType ?? "").toUpperCase();
  if (!url) return out;

  const agregator = AGREGATOR_DOMAINS.find((d) => url.includes(d));
  const klaim = ["INSTITUTIONAL_REPORT", "GOVERNMENT_PUBLICATION", "PEER_REVIEWED"];

  if (agregator && klaim.includes(tipe)) {
    out.push({
      code: "SOURCE_AGGREGATOR_MISLABEL",
      severity: "WARNING",
      field: `evidence.url(${agregator})`,
      message: `Sumber dari ${agregator} dilabeli ${tipe}. ${agregator} adalah situs unggahan pengguna, bukan penerbit resmi. Turunkan label menjadi DOKUMEN_BELUM_TERVERIFIKASI atau verifikasi ke penerbit aslinya.`,
    });
  }
  return out;
}

export interface EvidenceMetadataAuditInput {
  candidateId: string;
  evidenceIndex: number;
  metadata: SourceMetadataFields;
  declaredQuality?: string;
  declaredTraceability?: string;
  sourceType: string;
}

/**
 * Audit satu butir bukti Tool2: kecocokan rating yang diklaim AI dengan
 * kelengkapan metadata yang nyata, plus label jenis sumber.
 */
export function auditEvidenceMetadata(input: EvidenceMetadataAuditInput): {
  findings: ContentAuditFinding[];
  metadataQuality: "KUAT" | "SEDANG" | "LEMAH";
  traceability: "KUAT" | "SEDANG" | "LEMAH";
} {
  const findings: ContentAuditFinding[] = [];
  const { rating: computed, missing } = deriveMetadataQuality(input.metadata);
  const trace = deriveTraceability(input.metadata);
  const label = `${input.candidateId} bukti #${input.evidenceIndex}`;

  const klaimMq = String(input.declaredQuality ?? "").toUpperCase();
  const klaimTr = String(input.declaredTraceability ?? "").toUpperCase();

  if (klaimMq === "KUAT" && computed !== "KUAT") {
    findings.push({
      code: "METADATA_QUALITY_OVERSTATED",
      severity: "ERROR",
      field: `${label}.metadata_quality`,
      message: `AI menilai metadata_quality KUAT, tetapi identitas sumber tidak lengkap (kurang: ${missing.join(", ")}). Rating diturunkan menjadi ${computed}.`,
    });
  }
  if (klaimTr === "KUAT" && trace !== "KUAT") {
    findings.push({
      code: "TRACEABILITY_OVERSTATED",
      severity: "WARNING",
      field: `${label}.traceability`,
      message: `AI menilai traceability KUAT, tetapi ${missing.includes("tautan") ? "tautan sumber tidak ada" : "identitas sumber tidak lengkap"}. Rating diturunkan menjadi ${trace}.`,
    });
  }
  if (computed === "LEMAH") {
    findings.push({
      code: "SOURCE_IDENTITY_THIN",
      severity: "WARNING",
      field: label,
      message: `Identitas sumber sangat minim (kurang: ${missing.join(", ")}). Bukti ini belum bisa ditelusuri ulang.`,
    });
  }

  findings.push(...auditSourceTypeLabel({ url: String(input.metadata.url ?? ""), declaredType: input.sourceType }));

  return { findings, metadataQuality: computed, traceability: trace };
}
