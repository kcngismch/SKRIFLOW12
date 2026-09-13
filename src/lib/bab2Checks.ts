/**
 * Pemeriksa Bab 2 — Addendum D §D.5.
 *
 * DUA pemeriksa + satu pemeriksa poles, mengikuti pola C.6:
 *   periksaFondasiBab2  -> menilai APA YANG SAH (fondasi 6A vs register/ledger)
 *   periksaDrafBab2     -> menilai APA YANG DITULIS (draf 6B vs fondasi)
 *   periksaPolesBab2    -> menilai APA YANG BERUBAH (6C vs 6B)
 *
 * Jangan menyederhanakan jadi satu: pemeriksa tunggal buta pada salah satu kelas
 * pelanggaran (lihat Addendum C.6).
 *
 * Guard sadar-negasi (B.6) berlaku identik: frasa kausal/absolut TIDAK dilaporkan
 * bila muncul di dalam kalimat pembatas ("belum", "tidak", "jangan", "dilarang",
 * "bukan", "tanpa", "hindari").
 */

import type { Bab1FoundationV1 } from "@/types/tool";
import type {
  Bab2DraftV1,
  Bab2Finding,
  Bab2FindingCode,
  Bab2FindingSeverity,
  Bab2FoundationV1,
  Bab2MapV1,
  Bab2PolishV1,
} from "@/types/bab2";
import {
  BAB2_WORD_RANGE,
  ambilNamaTahun,
  ambilSitasiTanda,
  namaSahBab2,
  pendekatanBolehHipotesis,
  strukturBakuBab2,
} from "./bab2Parser";
import type { SumberPaketLiteratur } from "./bedahParser";

// =========================================================================
// Utilitas bersama
// =========================================================================

/** Kata pengantar penyangkalan/pembatasan (B.6). */
const KATA_PENYANGKAL = ["belum", "tidak", "jangan", "dilarang", "bukan", "tanpa", "hindari"];

/**
 * Ambil kalimat yang memuat posisi tertentu.
 * ponytail: pemisahan kalimat naif (titik/!/?) — cukup untuk memeriksa keberadaan
 * kata penyangkal di sekitar frasa. Kalau nanti muncul salah lapor karena
 * singkatan ("dll.", "No."), tambahkan daftar singkatan, jangan matikan guard.
 */
function kalimatSekitar(teks: string, posisi: number): string {
  const sebelum = teks.lastIndexOf(".", Math.max(0, posisi - 1));
  const titik = teks.indexOf(".", posisi);
  const a = sebelum === -1 ? Math.max(0, posisi - 200) : sebelum + 1;
  const b = titik === -1 ? Math.min(teks.length, posisi + 200) : titik + 1;
  return teks.slice(a, b).trim();
}

/** Guard sadar-negasi: true = kalimat ini menyanggah, jadi jangan dilaporkan. */
export function sadarNegasi(kalimat: string): boolean {
  const t = kalimat.toLowerCase();
  return KATA_PENYANGKAL.some((k) => new RegExp(`\\b${k}\\b`).test(t));
}

interface PolaFrasa {
  pola: RegExp;
  code: Bab2FindingCode;
  severity: Bab2FindingSeverity;
  pesan: string;
  /**
   * true = jangan lewatkan guard sadar-negasi.
   *
   * Frasa gap sintetis WAJIB melewati guard, karena pelanggarannya MEMANG
   * berbentuk penyangkalan ("belum ada penelitian ..."). Kalau guard dipakai,
   * kata "belum" menyelamatkan kalimat yang justru sedang dilanggar.
   */
  abaikanGuard?: boolean;
}

/**
 * Frasa yang diperiksa di prosa draf & fondasi.
 * Semua pola WAJIB melewati guard sadar-negasi sebelum dilaporkan.
 */
export const POLA_FRASA: PolaFrasa[] = [
  // --- atribusi tanpa nama (khas Bab 2, paling sering ditandai dosen) ---
  {
    pola: /menurut\s+(para\s+)?(ahli|pakar|peneliti|banyak\s+ahli|beberapa\s+ahli|berbagai\s+ahli)/gi,
    code: "FABRICATED_ATTRIBUTION",
    severity: "CRITICAL",
    pesan: 'Atribusi tanpa nama: "menurut para ahli". Bab 2 wajib menyebut nama penulis dan tahun.',
  },
  {
    pola: /\b(sebuah|suatu|beberapa|banyak)\s+penelitian\s+(menunjukkan|membuktikan|menemukan|menyatakan)/gi,
    code: "FABRICATED_ATTRIBUTION",
    severity: "CRITICAL",
    pesan: 'Atribusi tanpa nama: "sebuah penelitian menunjukkan". Sebutkan nama penulis dan tahun.',
  },
  {
    pola: /\b(penelitian|studi)\s+terdahulu\s+(menunjukkan|membuktikan|menemukan)/gi,
    code: "FABRICATED_ATTRIBUTION",
    severity: "CRITICAL",
    pesan: 'Atribusi tanpa nama: "penelitian terdahulu menunjukkan". Rujuk sumber tertentu dengan nama dan tahun.',
  },
  {
    pola: /\bsecara\s+umum\s+(diketahui|diakui|diyakini)/gi,
    code: "FABRICATED_ATTRIBUTION",
    severity: "CRITICAL",
    pesan: '"Secara umum diketahui" bukan rujukan. Pakai sumber bernama atau hapus.',
  },

  // --- gap sintetis ---
  {
    pola: /\bbelum\s+(ada|pernah)\s+(ada\s+)?(penelitian|studi|kajian|yang\s+meneliti|diteliti)/gi,
    code: "SYNTHETIC_GAP_PHRASE",
    severity: "CRITICAL",
    pesan: 'Gap sintetis ("belum ada penelitian"). Klaim ketiadaan bukti bukan bukti ketiadaan — gap harus dibuktikan dari pencarian.',
    abaikanGuard: true,
  },
  {
    pola: /\b(masih\s+)?(sangat\s+)?(sedikit|jarang)\s+(sekali\s+)?(penelitian|studi|kajian)\b(?![^.]{0,80}(20\d{2}))/gi,
    code: "SYNTHETIC_GAP_PHRASE",
    severity: "CRITICAL",
    pesan: 'Klaim "masih sedikit penelitian" tanpa dasar pencarian. Buktikan lewat cakupan sumber, bukan diklaim.',
    abaikanGuard: true,
  },
  {
    pola: /\btidak\s+ada\s+(satu\s+pun\s+)?(penelitian|studi|kajian)\b/gi,
    code: "SYNTHETIC_GAP_PHRASE",
    severity: "CRITICAL",
    pesan: 'Klaim tiadanya penelitian tanpa dasar. Gap hanya sah bila punya basis evidence.',
    abaikanGuard: true,
  },

  // --- kesimpulan di Bab 2 (pekerjaan Bab 4) ---
  {
    pola: /\b(dapat|bisa)\s+disimpulkan\b/gi,
    code: "CONCLUSION_IN_BAB2",
    severity: "MAJOR",
    pesan: 'Bab 2 menyiapkan alat, bukan menyimpulkan. "Dapat disimpulkan" tempatnya di Bab 4.',
  },
  {
    pola: /\bhasil\s+(penelitian\s+)?ini\s+(menunjukkan|membuktikan|membuktikan\s+bahwa)\b/gi,
    code: "CONCLUSION_IN_BAB2",
    severity: "MAJOR",
    pesan: 'Bab 2 belum punya hasil. Kalimat ini menyimpulkan penelitian sendiri, bukan literatur.',
  },
  {
    pola: /\bhipotesis\s+(ini\s+)?(terbukti|diterima|ditolak|didukung)\b/gi,
    code: "CONCLUSION_IN_BAB2",
    severity: "MAJOR",
    pesan: 'Hipotesis tidak diuji di Bab 2. Hapus penilaian hasil.',
  },

  // --- klaim absolut ---
  {
    pola: /\bmembuktikan\s+bahwa\b/gi,
    code: "ABSOLUTE_CLAIM_PHRASE",
    severity: "MAJOR",
    pesan: '"Membuktikan bahwa" terlalu kuat. Satu penelitian tidak membuktikan; ia menyediakan bukti.',
  },
  {
    pola: /\b(seluruh|semua|setiap)\s+(penelitian|studi|kajian)\b/gi,
    code: "ABSOLUTE_CLAIM_PHRASE",
    severity: "MAJOR",
    pesan: 'Klaim menyeluruh tanpa dasar. Sebutkan penelitian mana.',
  },
  {
    pola: /\b(pasti|selalu|tidak\s+pernah\s+gagal)\b/gi,
    code: "ABSOLUTE_CLAIM_PHRASE",
    severity: "MAJOR",
    pesan: 'Kata absolut ("pasti"/"selalu") tidak dipakai dalam klaim akademik.',
  },
  {
    pola: /\bsatu-satunya\s+(faktor|penyebab|variabel|yang)\b/gi,
    code: "ABSOLUTE_CLAIM_PHRASE",
    severity: "MAJOR",
    pesan: '"Satu-satunya" mengklaim eksklusivitas yang jarang bisa dibuktikan.',
  },

  // --- kausal dari korelasi ---
  {
    pola: /\b(menyebabkan|mengakibatkan|menimbulkan|mendorong\s+terjadinya)\b/gi,
    code: "CAUSAL_CLAIM_FROM_CORRELATION",
    severity: "MAJOR",
    pesan: 'Klaim sebab-akibat. Hanya sah bila klaim di ledger bertipe kausal; desain dokumenter/deskriptif tidak melahirkan klaim kausal.',
  },
  {
    pola: /\bberdampak\s+(signifikan\s+)?(terhadap|pada)\b/gi,
    code: "CAUSAL_CLAIM_FROM_CORRELATION",
    severity: "MAJOR",
    pesan: '"Berdampak terhadap" adalah klaim kausal. Pakai "berhubungan dengan" bila buktinya asosiatif.',
  },

  // --- kerangka pemikiran dinyatakan final ---
  {
    pola: /\b(kerangka\s+(pemikiran|berpikir|analisis)|model\s+penelitian)\s+(ini\s+)?(terbukti|telah\s+dibuktikan|bersifat\s+final|pasti)\b/gi,
    code: "FRAMEWORK_STATED_AS_FINAL",
    severity: "MAJOR",
    pesan: 'Kerangka pemikiran selalu CANDIDATE_ONLY. Dilarang dinyatakan terbukti atau final di Bab 2.',
  },
  {
    pola: /\bhubungan\s+antar\s+variabel\s+(ini\s+)?(terbukti|nyata|pasti)\b/gi,
    code: "FRAMEWORK_STATED_AS_FINAL",
    severity: "MAJOR",
    pesan: 'Hubungan antar-variabel belum diuji di Bab 2. Sajikan sebagai kerangka kandidat.',
  },
];

/** Cari pelanggaran frasa di satu blok teks. */
export function cariPelanggaranFrasa(
  teks: string,
  where: string,
  pola: PolaFrasa[] = POLA_FRASA
): Bab2Finding[] {
  const out: Bab2Finding[] = [];
  for (const p of pola) {
    const re = new RegExp(p.pola.source, p.pola.flags.includes("g") ? p.pola.flags : p.pola.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(teks))) {
      const kalimat = kalimatSekitar(teks, m.index);
      // Pola gap sintetis dilewatkan guard: pelanggarannya memang berbentuk penyangkalan.
      if (!p.abaikanGuard && sadarNegasi(kalimat)) continue;
      out.push({
        code: p.code,
        severity: p.severity,
        where,
        message: p.pesan,
        evidence_excerpt: kalimat.slice(0, 220),
      });
      if (out.filter((f) => f.code === p.code && f.where === where).length >= 3) break;
    }
  }
  return out;
}

/** Deteksi salinan verbatim: run kata identik yang terlalu panjang. */
export function cariSalinanVerbatim(
  teksDraf: string,
  teksSumber: string,
  where: string,
  ambangKata = 12
): Bab2Finding | null {
  const norm = (t: string) =>
    t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const a = norm(teksDraf);
  const b = norm(teksSumber);
  if (a.length < ambangKata || b.length < ambangKata) return null;

  for (let i = 0; i + ambangKata <= a.length; i++) {
    const potongan = a.slice(i, i + ambangKata).join(" ");
    if (b.join(" ").includes(potongan)) {
      return {
        code: "VERBATIM_COPY",
        severity: "CRITICAL",
        where,
        message: `Terdapat ${ambangKata} kata berturut-turut yang identik dengan sumber. Bab 2 wajib memparafrase, dan tetap menyebut sumbernya.`,
        evidence_excerpt: a.slice(i, i + ambangKata).join(" ").slice(0, 220),
      };
    }
  }
  return null;
}

// =========================================================================
// PEMERIKSA 1 — FONDASI BAB 2 (6A)
// =========================================================================

export function periksaFondasiBab2(
  foundation: Bab2FoundationV1,
  register: SumberPaketLiteratur[],
  bab1Foundation?: Bab1FoundationV1 | null
): Bab2Finding[] {
  const out: Bab2Finding[] = [];
  const idSah = new Set(register.map((s) => (s.sourceId || "").replace(/[[\]]/g, "").trim()).filter(Boolean));

  // Sumber di luar register: pelanggaran batas bukti (D.11).
  (foundation.candidate_new_sources || []).forEach((s) => {
    out.push({
      code: "SOURCE_NOT_IN_REGISTER",
      severity: "CRITICAL",
      where: "Fondasi",
      message: `Sumber "${s.authors_year || s.id_sementara}" tidak ada di Source Register Tool 3. Sumber baru wajib kembali ke rantai pencarian (Tool 3 → 4) sebelum dipakai.`,
      evidence_excerpt: s.title?.slice(0, 200),
    });
  });

  // source_ids di blueprint & ledger harus menunjuk sumber yang benar-benar ada.
  const periksaIds = (ids: string[] | undefined, konteks: string) => {
    (ids || []).forEach((id) => {
      const bersih = id.replace(/[[\]]/g, "").trim();
      if (bersih && !idSah.has(bersih)) {
        out.push({
          code: "SOURCE_NOT_IN_REGISTER",
          severity: "CRITICAL",
          where: konteks,
          message: `Sumber "${bersih}" dirujuk tetapi tidak ada di Source Register Tool 3.`,
        });
      }
    });
  };
  foundation.structure_blueprint.forEach((b) => periksaIds(b.source_ids, b.sub_bab));
  foundation.claim_ledger.forEach((c) => periksaIds(c.source_ids, `Klaim ${c.claim_id}`));
  foundation.theory_map.forEach((t) => periksaIds(t.source_ids, `Teori ${t.konstruk || "-"}`));

  // Teori tanpa sumber: definisi/konsep wajib punya rujukan.
  foundation.theory_map.forEach((t) => {
    if (!t.konstruk) return;
    if ((t.source_ids || []).length === 0) {
      out.push({
        code: "THEORY_WITHOUT_SOURCE",
        severity: "MAJOR",
        where: "Landasan Teori",
        message: `Konsep "${t.konstruk}" dipakai tanpa sumber. Setiap teori di Bab 2 wajib menyebut sumbernya.`,
      });
    }
  });

  // Hipotesis pada pendekatan non-verifikatif (dijaga juga di parser).
  if ((foundation.hypothesis_candidates || []).length > 0 && !pendekatanBolehHipotesis(foundation.pendekatan)) {
    out.push({
      code: "HYPOTHESIS_ON_NON_VERIFICATIVE",
      severity: "CRITICAL",
      where: "Hipotesis",
      message: `Pendekatan "${foundation.pendekatan}" tidak menguji hipotesis. Rancangan deskriptif/kualitatif/normatif tidak memakai hipotesis.`,
    });
  }

  // Kerangka pemikiran harus jelas berstatus kandidat.
  if (foundation.conceptual_framework) {
    if (foundation.conceptual_framework.status !== "CANDIDATE_ONLY") {
      out.push({
        code: "FRAMEWORK_STATED_AS_FINAL",
        severity: "MAJOR",
        where: "Kerangka Pemikiran",
        message: "Kerangka pemikiran wajib berstatus CANDIDATE_ONLY dengan keputusan peneliti tertunda.",
      });
    }
  }

  // Struktur sub-bab harus sesuai pendekatan (D.8) — kalau pendekatan jelas.
  const baku = strukturBakuBab2(foundation.pendekatan);
  if (baku.length > 0) {
    const daftar = foundation.structure_blueprint.map((b) => b.sub_bab.toLowerCase());
    const kurang = baku.filter((s) => !daftar.some((x) => x.includes(s.toLowerCase())));
    if (kurang.length > 0) {
      out.push({
        code: "SUBBAB_STRUCTURE_MISMATCH",
        severity: "MAJOR",
        where: "Struktur",
        message: `Sub-bab wajib untuk pendekatan ${foundation.pendekatan} belum ada: ${kurang.join(", ")}.`,
      });
    }
  }

  // Frasa terlarang di teks fondasi (prohibited_claims/not_safe_to_say juga diperiksa).
  const teksFondasi = [
    foundation.status_reason,
    foundation.prohibited_claims.join("\n"),
    foundation.not_safe_to_say.join("\n"),
    foundation.claim_ledger.map((c) => c.claim_text).join("\n"),
    foundation.theory_map.map((t) => t.definisi_ringkas).join("\n"),
  ].join("\n");
  out.push(...cariPelanggaranFrasa(teksFondasi, "Fondasi"));

  // Verbatim: definisi teori tidak boleh menyalin original_context dari ledger.
  if (bab1Foundation) {
    const konteks = (bab1Foundation.evidence_ledger || []).map((l) => l.original_context || "").join("\n");
    foundation.theory_map.forEach((t) => {
      const f = cariSalinanVerbatim(t.definisi_ringkas || "", konteks, `Teori ${t.konstruk || "-"}`);
      if (f) out.push(f);
    });
  }

  return out;
}

// =========================================================================
// PEMERIKSA 2 — DRAF BAB 2 (6B)
// =========================================================================

export function periksaDrafBab2(
  draft: Bab2DraftV1,
  foundation: Bab2FoundationV1,
  register: SumberPaketLiteratur[],
  bab1Foundation?: Bab1FoundationV1 | null
): Bab2Finding[] {
  const out: Bab2Finding[] = [];
  const ledgerById = new Map(foundation.claim_ledger.map((c) => [c.claim_id, c]));
  const namaSah = namaSahBab2(register, bab1Foundation);

  // Sumber teleport: field ini HARUS kosong (D.4.3).
  (draft.new_sources_introduced || []).forEach((s) => {
    out.push({
      code: "NEW_SOURCE_INTRODUCED",
      severity: "CRITICAL",
      where: "Draf",
      message: `Draf memunculkan sumber yang tidak ada di register: "${s.authors_year || s.id_sementara}". Sumber baru harus lewat rantai pencarian dulu.`,
      evidence_excerpt: s.title?.slice(0, 200),
    });
  });

  // Sub-bab yang ditandai BLOCKED tidak boleh ditulis.
  const blokir = new Set(
    foundation.structure_blueprint.filter((b) => b.function?.toUpperCase().includes("BLOCKED")).map((b) => b.sub_bab.toLowerCase())
  );

  draft.background.forEach((p) => {
    const where = p.sub_bab || `Sub-bab ${p.order}`;
    const teks = p.paragraph_text || "";

    if (blokir.has(where.toLowerCase())) {
      out.push({
        code: "BLOCKED_SECTION_WRITTEN",
        severity: "CRITICAL",
        where,
        message: `Sub-bab "${where}" berstatus BLOCKED tetapi ditulis. Bagian berstatus BLOCKED harus masuk skipped_sections.`,
      });
    }

    // claim_id wajib ada di ledger, dan statusnya tidak boleh DO_NOT_USE.
    p.claim_ids.forEach((id) => {
      const c = ledgerById.get(id);
      if (!c) {
        out.push({
          code: "CLAIM_ID_UNKNOWN",
          severity: "CRITICAL",
          where,
          message: `claim_id "${id}" tidak ada di claim_ledger fondasi Bab 2.`,
        });
        return;
      }
      if (c.status === "DO_NOT_USE") {
        out.push({
          code: "CLAIM_STATUS_DO_NOT_USE",
          severity: "CRITICAL",
          where,
          message: `Klaim "${id}" berstatus DO_NOT_USE tetapi dipakai: ${c.claim_text.slice(0, 120)}`,
        });
      }
      if (c.status === "NEEDS_VERIFICATION") {
        out.push({
          code: "CLAIM_STATUS_NEEDS_VERIFICATION",
          severity: "MAJOR",
          where,
          message: `Klaim "${id}" masih NEEDS_VERIFICATION. Wajib dibingkai sebagai hal yang belum pasti ("perlu diverifikasi lebih lanjut"), bukan sebagai temuan.`,
        });
      }
    });

    // Frasa terlarang per sub-bab.
    out.push(...cariPelanggaranFrasa(teks, where));

    // Klaim terlarang dari fondasi tidak boleh muncul walau diparafrase.
    foundation.prohibited_claims.forEach((klaim) => {
      const inti = klaim.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().toLowerCase();
      if (inti.length < 20) return;
      const potongan = inti.split(/\s+/).slice(0, 6).join(" ");
      if (potongan && teks.toLowerCase().includes(potongan)) {
        out.push({
          code: "PROHIBITED_CLAIM_PHRASE",
          severity: "CRITICAL",
          where,
          message: `Klaim terlarang muncul di draf: "${klaim.slice(0, 140)}"`,
          evidence_excerpt: teks.slice(0, 200),
        });
      }
    });

    // Sitasi harus menunjuk nama yang sah (register atau fondasi Bab 1).
    const sitasi = [...ambilSitasiTanda(teks), ...ambilNamaTahun(teks)];
    sitasi.forEach((s) => {
      const nama = s.split(",")[0].trim().toLowerCase();
      // Nama institusi/dokumen pemerintah tetap sah bila ada di fondasi Bab 1.
      const cocok = [...namaSah].some((sah) => sah.startsWith(nama) || nama.startsWith(sah.split(",")[0]));
      if (!cocok) {
        out.push({
          code: "SOURCE_NOT_IN_REGISTER",
          severity: "CRITICAL",
          where,
          message: `Sitasi "${s}" tidak cocok dengan sumber mana pun di register maupun paket fondasi Bab 1.`,
          evidence_excerpt: kalimatSekitar(teks, teks.indexOf(s)).slice(0, 220),
        });
      }
    });

    // Verbatim terhadap konteks asli sumber (satu-satunya teks sumber yang kita punya).
    if (bab1Foundation) {
      const konteks = (bab1Foundation.evidence_ledger || []).map((l) => l.original_context || "").join("\n");
      const f = cariSalinanVerbatim(teks, konteks, where);
      if (f) out.push(f);
    }
  });

  // Konflik antar-penelitian wajib ditampilkan, bukan dihaluskan (D.5 CONFLICT_FLATTENED).
  const teksSemua = draft.background.map((p) => p.paragraph_text || "").join("\n").toLowerCase();
  const idDipakai = new Set(draft.used_source_ids.map((s) => s.replace(/[[\]]/g, "").trim()));
  foundation.claim_ledger
    .filter((c) => c.claim_type === "COMPARISON_CLAIM")
    .forEach((c) => {
      const adaSumber = (c.source_ids || []).some((s) => idDipakai.has(s.replace(/[[\]]/g, "").trim()));
      if (!adaSumber) {
        out.push({
          code: "CONFLICT_FLATTENED",
          severity: "MAJOR",
          where: "Penelitian Terdahulu",
          message: `Perbandingan antar-penelitian belum ditampilkan: ${c.claim_text.slice(0, 140)}. Hasil yang berbeda wajib ditampilkan, bukan dihaluskan.`,
        });
      }
    });
  if (/semua\s+penelitian\s+(sepakat|setuju|menunjukkan\s+hal\s+yang\s+sama)/i.test(teksSemua)) {
    out.push({
      code: "CONFLICT_FLATTENED",
      severity: "MAJOR",
      where: "Penelitian Terdahulu",
      message: 'Klaim "semua penelitian sepakat" menghaluskan perbedaan. Tampilkan juga hasil yang berbeda.',
    });
  }

  // Struktur sub-bab harus sama dengan blueprint.
  const blueprint = foundation.structure_blueprint.map((b) => b.sub_bab.toLowerCase());
  const ditulis = draft.background.map((p) => (p.sub_bab || "").toLowerCase());
  const hilang = blueprint.filter((b) => !ditulis.some((d) => d.includes(b) || b.includes(d)));
  if (hilang.length > 0) {
    out.push({
      code: "SUBBAB_STRUCTURE_MISMATCH",
      severity: "MAJOR",
      where: "Struktur",
      message: `Sub-bab di blueprint tidak ditulis: ${hilang.join(", ")}. Urutan dan cakupan sub-bab mengikat.`,
    });
  }

  // Panjang.
  if (draft.word_count_total < BAB2_WORD_RANGE[0] || draft.word_count_total > BAB2_WORD_RANGE[1]) {
    out.push({
      code: "WORD_COUNT_OUT_OF_RANGE",
      severity: "MAJOR",
      where: "Panjang",
      message: `Total ${draft.word_count_total} kata, di luar rentang ${BAB2_WORD_RANGE[0]}–${BAB2_WORD_RANGE[1]}.`,
    });
  }

  // Klaim READY_TO_DRAFT yang belum terpakai.
  const dipakai = new Set(draft.used_claim_ids);
  const belum = foundation.claim_ledger.filter((c) => c.status === "READY_TO_DRAFT" && !dipakai.has(c.claim_id));
  if (belum.length > 0) {
    out.push({
      code: "LEDGER_CLAIM_UNUSED",
      severity: "MINOR",
      where: "Catatan Bukti",
      message: `Klaim siap pakai belum terpakai di draf: ${belum.map((c) => c.claim_id).join(", ")}.`,
    });
  }

  // Gaya sitasi harus seragam.
  const gayaKurung = draft.background.some((p) => ambilSitasiTanda(p.paragraph_text || "").length > 0);
  const gayaNaratif = draft.background.some((p) => ambilNamaTahun(p.paragraph_text || "").length > 0);
  if (gayaKurung && gayaNaratif) {
    out.push({
      code: "CITATION_STYLE_INCONSISTENT",
      severity: "MINOR",
      where: "Sitasi",
      message: "Dua gaya sitasi dipakai bersamaan. Pilih satu gaya (kurung atau naratif) dan pakai konsisten.",
    });
  }

  return out;
}

// =========================================================================
// PEMERIKSA 3 — POLES BAHASA (6C) — mengikuti aturan Addendum C.6
// =========================================================================

export function periksaPolesBab2(hasil: Bab2PolishV1, draft: Bab2DraftV1): Bab2Finding[] {
  const out: Bab2Finding[] = [];

  const klaimA = draft.background.flatMap((p) => p.claim_ids).sort().join(",");
  const klaimB = hasil.background.flatMap((p) => p.claim_ids).sort().join(",");
  if (klaimA !== klaimB) {
    out.push({
      code: "CLAIM_ID_UNKNOWN",
      severity: "CRITICAL",
      where: "Poles Bahasa",
      message: "Peta klaim berubah setelah poles bahasa. 6C hanya boleh mengubah bahasa, bukan isi.",
    });
  }

  if (!hasil.claim_ids_unchanged) {
    out.push({
      code: "CLAIM_ID_UNKNOWN",
      severity: "CRITICAL",
      where: "Poles Bahasa",
      message: "Hasil poles melaporkan claim_ids berubah. Kembalikan peta klaim ke bentuk semula.",
    });
  }

  // Bergeser >25% per sub-bab = tanda isi berubah, bukan bahasa.
  draft.background.forEach((p, i) => {
    const q = hasil.background.find((x) => x.order === p.order);
    if (!q) {
      out.push({
        code: "SUBBAB_STRUCTURE_MISMATCH",
        severity: "MAJOR",
        where: `Sub-bab ${p.order}`,
        message: `Sub-bab "${p.sub_bab}" hilang setelah poles bahasa.`,
      });
      return;
    }
    const a = (p.paragraph_text || "").split(/\s+/).filter(Boolean).length;
    const b = (q.paragraph_text || "").split(/\s+/).filter(Boolean).length;
    if (a > 40 && Math.abs(b - a) / a > 0.25) {
      out.push({
        code: "WORD_COUNT_MISMATCH",
        severity: "MINOR",
        where: q.sub_bab || `Sub-bab ${p.order}`,
        message: `Panjang sub-bab berubah ${a} → ${b} kata (lebih dari 25%). Poles bahasa seharusnya tidak mengubah isi sebanyak itu.`,
      });
    }
    // Frasa terlarang yang muncul BARU setelah poles.
    const baru = cariPelanggaranFrasa(q.paragraph_text || "", q.sub_bab || `Sub-bab ${p.order}`);
    const lama = new Set(cariPelanggaranFrasa(p.paragraph_text || "", p.sub_bab || "").map((f) => f.code + f.evidence_excerpt));
    baru.filter((f) => !lama.has(f.code + f.evidence_excerpt)).forEach((f) => out.push(f));
    void i;
  });

  return out;
}

/** Ringkas temuan jadi hitungan status per severity. */
export function ringkasTemuanBab2(temuan: Bab2Finding[]): { kritis: number; major: number; minor: number; total: number } {
  const kritis = temuan.filter((f) => f.severity === "CRITICAL").length;
  const major = temuan.filter((f) => f.severity === "MAJOR").length;
  const minor = temuan.filter((f) => f.severity === "MINOR").length;
  return { kritis, major, minor, total: temuan.length };
}
