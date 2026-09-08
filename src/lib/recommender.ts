import {
  ExplorationAreaCandidateV3,
  ExplorationComparisonV3,
  StudentResearchProfile,
  AreaRecommendationResult,
} from "@/types/tool";

/**
 * Calculates a conditional, rule-based recommendation for the most viable exploration area
 * to investigate next based on validated V3 JSON and student constraints.
 *
 * Principles:
 * - Pure rule-based ranking (NO fake percentages, NO confidence scores, NO probability).
 * - Recommendation is only for which area to check first via phenomena/literature, NOT a final title or topic.
 * - If all areas are BERISIKO, returns NO_SAFE_RECOMMENDATION.
 * - If two areas are equally balanced, returns RECOMMENDED_TIE with clear distinctions.
 */
export function calculateAreaRecommendation(
  areas: ExplorationAreaCandidateV3[],
  comparison: ExplorationComparisonV3[],
  studentProfile: StudentResearchProfile | Record<string, string> = {},
  resultSetId?: string,
  payloadFingerprint?: string
): AreaRecommendationResult {
  const createdAt = new Date().toISOString();

  if (!areas || areas.length === 0) {
    return {
      resultSetId,
      payloadFingerprint,
      createdAt,
      status: "NO_SAFE_RECOMMENDATION",
      reasons: ["Belum ada data area eksplorasi yang valid untuk dinilai."],
      assumptions: [],
      risks: ["Data area kosong atau belum tervalidasi."],
      mainCheckNext: "Lakukan generate prompt dan tempel hasil Cari Ide V3.",
    };
  }

  // Normalize student profile constraints
  const avoidances = (
    ("avoidances" in studentProfile ? studentProfile.avoidances : "") ||
    ("avoidedActivities" in studentProfile ? studentProfile.avoidedActivities : "") ||
    ""
  ).toLowerCase();

  const timeCondition = (
    ("target_waktu" in studentProfile ? studentProfile.target_waktu : "") ||
    ("timeCondition" in studentProfile ? studentProfile.timeCondition : "") ||
    ""
  ).toLowerCase();

  const preferredData = (
    ("preferensi_data" in studentProfile ? studentProfile.preferensi_data : "") ||
    ("preferredData" in studentProfile ? studentProfile.preferredData : "") ||
    ""
  ).toLowerCase();

  const isRushing =
    timeCondition.includes("tenggat") ||
    timeCondition.includes("cepat") ||
    timeCondition.includes("tiga_bulan") ||
    timeCondition.includes("mendesak") ||
    timeCondition.includes("terbatas") ||
    timeCondition.includes("kejar");

  const avoidsInterview =
    avoidances.includes("wawancara") ||
    avoidances.includes("survei") ||
    avoidances.includes("kuesioner") ||
    avoidances.includes("responden") ||
    avoidances.includes("lapangan") ||
    avoidances.includes("gamau");

  // Check if ALL areas are BERISIKO
  const allRisky = areas.every((a) => a.constraintFit.status === "BERISIKO");
  if (allRisky) {
    const conflictingConstraints: string[] = [];
    if (avoidsInterview) {
      conflictingConstraints.push(
        "Mahasiswa menghindari wawancara/responden lapangan, namun seluruh area membutuhkan data primer atau belum memiliki akses data mandiri."
      );
    }
    if (preferredData.includes("sekunder")) {
      conflictingConstraints.push(
        "Mahasiswa menginginkan data sekunder publik, namun area yang tersedia membutuhkan prosedur buatan peneliti atau akses berbayar/terbatas."
      );
    }
    if (conflictingConstraints.length === 0) {
      conflictingConstraints.push(
        "Seluruh area yang diajukan memiliki ketidakpastian atau beban pengumpulan data yang tidak selaras dengan batasan mahasiswa."
      );
    }

    const mainRisks = areas.flatMap((a) => a.constraintFit.risks).slice(0, 4);
    const clarificationNeeded = [
      "Perjelas ketersediaan akses data yang riil bisa kamu peroleh.",
      "Persempit atau geser minat ke isu yang memiliki dokumen publik terbuka.",
      "Konsultasikan kembali batasan metodologis dengan dosen pembimbing.",
    ];

    return {
      resultSetId,
      payloadFingerprint,
      createdAt,
      status: "NO_SAFE_RECOMMENDATION",
      reasons: [
        "Seluruh area eksplorasi saat ini berstatus BERISIKO terhadap batasan yang kamu masukkan.",
      ],
      assumptions: [],
      risks: mainRisks.length > 0 ? mainRisks : ["Tingkat ketidakpastian data dan metodologi terlalu tinggi."],
      mainCheckNext: "Perbaiki kondisi atau buat prompt alternatif baru.",
      conflictingConstraints,
      mainRisks,
      clarificationNeeded,
    };
  }

  // Calculate heuristic score for each area
  interface ScoredCandidate {
    area: ExplorationAreaCandidateV3;
    comp?: ExplorationComparisonV3;
    score: number;
    reasons: string[];
    assumptions: string[];
    risks: string[];
    mainCheckNext: string;
  }

  const scoredCandidates: ScoredCandidate[] = areas.map((area) => {
    const comp = comparison.find((c) => c.areaId === area.id);
    let score = 100;
    const reasons: string[] = [];

    // 1. Conflict with avoided activities
    const requiresPrimary = area.dataProvenance.some((p) => p.origin === "PRIMARY_RESPONDENT");
    if (avoidsInterview && requiresPrimary) {
      score -= 50;
    }

    // 2. Constraint fit status
    if (area.constraintFit.status === "SELARAS_SEMENTARA") {
      score += 30;
      reasons.push("Jalur data dan ruang lingkup selaras sementara dengan preferensi pengerjaan.");
    } else if (area.constraintFit.status === "PERLU_DIPERIKSA") {
      score += 10;
      reasons.push("Memiliki jalur pemeriksaan yang masuk akal namun memerlukan konfirmasi akses data atau prosedur teknis.");
    } else if (area.constraintFit.status === "BERISIKO") {
      score -= 40;
    }

    // 3. Data fit and provenance
    const hasResearcherGenerated = area.dataProvenance.some((p) => p.origin === "RESEARCHER_GENERATED");
    const hasPublicSecondary = area.dataProvenance.some(
      (p) => p.origin === "PUBLIC_SECONDARY" || p.origin === "INSTITUTIONAL_METADATA"
    );

    if (preferredData.includes("sekunder") && hasPublicSecondary && !hasResearcherGenerated) {
      score += 15;
      reasons.push("Tersedia dokumen atau statistik publik yang dapat berdiri sendiri.");
    }

    // 4. Time condition & Collection Burden & Uncertainty
    const burden = comp?.collectionBurden || "SEDANG";
    const uncertainty = comp?.methodologicalUncertainty || "SEDANG";

    if (burden === "RENDAH_SEMENTARA") {
      score += 15;
      if (isRushing) {
        score += 10;
        reasons.push("Beban pengumpulan data relatif lebih ringan untuk target waktu yang terbatas.");
      }
    } else if (burden === "SEDANG") {
      score += 5;
    } else if (burden === "TINGGI") {
      score -= 15;
    }

    if (uncertainty === "RENDAH") {
      score += 20;
      if (isRushing) {
        score += 10;
        reasons.push("Ketidakpastian metodologis lebih rendah sehingga alur pemeriksaan lebih terstruktur.");
      }
    } else if (uncertainty === "SEDANG") {
      score += 5;
      if (isRushing) {
        reasons.push("Ketidakpastian metodologis berada pada tingkat moderat.");
      }
    } else if (uncertainty === "TINGGI") {
      score -= 20;
    }

    // 6. Interest and Study Program Fit
    const studyFit = comp?.studyProgramFit || "SEDANG";
    const interestFit = comp?.interestFit || "DEKAT";

    if (studyFit === "KUAT") {
      score += 10;
      reasons.push("Keterkaitan dengan kurikulum program studi sangat kuat.");
    } else if (studyFit === "LEMAH") {
      score -= 10;
    }

    if (interestFit === "SANGAT_DEKAT" || interestFit === "DEKAT") {
      score += 5;
      reasons.push(`Sesuai dengan minat eksplorasi mahasiswa (${area.interestConnection.slice(0, 100)}).`);
    }

    // 7. Focus Shift Consequence Note
    const initialInterestText = (
      ("minat" in studentProfile ? studentProfile.minat : "") ||
      ("initialInterest" in studentProfile ? studentProfile.initialInterest : "") ||
      ""
    ).trim();

    if (area.focusContinuity && (area.focusContinuity.shiftStatus === "ADJACENT_SHIFT" || area.focusContinuity.shiftStatus === "MAJOR_SHIFT" || (area.focusContinuity.shiftedElements && area.focusContinuity.shiftedElements.length > 0))) {
      const shifted = (area.focusContinuity.shiftedElements || []).join(" dan ");
      if (shifted) {
        reasons.push(`Pilihan ini lebih sesuai dengan akses data publikmu, tetapi tidak lagi mempertahankan fokus ${shifted}.`);
      } else if (initialInterestText) {
        reasons.push(`Pilihan ini lebih sesuai dengan akses data publikmu, tetapi tidak lagi mempertahankan fokus ${initialInterestText}.`);
      } else if (area.focusContinuity.explanation) {
        reasons.push(`Konsekuensi fokus: ${area.focusContinuity.explanation.slice(0, 140)}`);
      }
    } else if (interestFit === "CUKUP_DEKAT" || interestFit === "PERLU_DIPERIKSA") {
      if (initialInterestText) {
        reasons.push(`Pilihan ini lebih sesuai dengan akses data publikmu, tetapi tidak lagi mempertahankan fokus ${initialInterestText}.`);
      }
    }

    // Sanitize any accidental forbidden claim strings
    const sanitizedReasons = reasons
      .map((r) =>
        r
          .replace(/tanpa (memerlukan )?pengujian rumit/gi, "alur pengujian terstandarisasi")
          .replace(/pasti mudah/gi, "lebih terkelola")
          .replace(/pasti cepat/gi, "relatif lebih terfokus")
          .replace(/data pasti tersedia/gi, "indikasi akses data publik terbuka")
      )
      .filter(Boolean);

    const mainCheckNext =
      comp?.mainCheckNext ||
      (area.unresolvedItems.length > 0 ? area.unresolvedItems[0] : "Periksa ketersediaan sumber fenomena empiris.");

    return {
      area,
      comp,
      score,
      reasons: Array.from(new Set(sanitizedReasons)).slice(0, 3),
      assumptions: area.constraintFit.assumptions.length > 0 ? area.constraintFit.assumptions : ["Dokumen terkait dapat diakses publik"],
      risks: area.constraintFit.risks.length > 0 ? area.constraintFit.risks : ["Akses data memerlukan verifikasi"],
      mainCheckNext,
    };
  });

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  const best = scoredCandidates[0];
  const second = scoredCandidates.length > 1 ? scoredCandidates[1] : undefined;

  // Check for TIE (exact same score between top 2 candidates and both are viable)
  if (second && best.score === second.score && best.score > 50) {
    const distinction1 = `${best.area.id} (${best.area.name}): ${best.reasons[0] || "Lebih terfokus pada aspek minat"}`;
    const distinction2 = `${second.area.id} (${second.area.name}): ${second.reasons[0] || "Memiliki jalur data yang terukur"}`;

    return {
      resultSetId,
      payloadFingerprint,
      createdAt,
      status: "RECOMMENDED_TIE",
      tieAreaIds: [best.area.id, second.area.id],
      tieAreaNames: [best.area.name, second.area.name],
      tieDistinctions: [distinction1, distinction2],
      primaryAreaId: best.area.id,
      primaryAreaName: best.area.name,
      secondaryAreaId: second.area.id,
      secondaryAreaName: second.area.name,
      reasons: [
        "Ada dua area yang memiliki bobot kelayakan seimbang untuk diperiksa lebih lanjut.",
        distinction1,
        distinction2,
      ],
      assumptions: [...best.assumptions, ...second.assumptions].slice(0, 3),
      risks: [...best.risks, ...second.risks].slice(0, 3),
      mainCheckNext: `Bandingkan ketersediaan data awal antara ${best.area.id} dan ${second.area.id}.`,
    };
  }

  // Single Best Recommendation
  return {
    resultSetId,
    payloadFingerprint,
    createdAt,
    status: "RECOMMENDED_SINGLE",
    primaryAreaId: best.area.id,
    primaryAreaName: best.area.name,
    reasons: best.reasons,
    assumptions: best.assumptions,
    risks: best.risks,
    mainCheckNext: best.mainCheckNext,
    secondaryAreaId: second?.area.id,
    secondaryAreaName: second?.area.name,
  };
}
