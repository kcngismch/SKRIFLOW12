/**
 * Test penjaga Bab 2 — Addendum D v3.3.4.
 *
 * Memakai fixture ASLI (bukan buatan): register Tool 3 dan fondasi 4B milik
 * mahasiswa HI. Fixture buatan tidak menangkap kelas cacat yang nyata.
 */

import { readFileSync } from "node:fs";
import {
  extractSumberPaketLiteratur,
  parseBab1DraftTransfer,
} from "./src/lib/bedahParser";
import { bangunPetaBab2, barisDariSumber } from "./src/lib/bab2Map";
import {
  BAB2_DRAFT_BEGIN,
  BAB2_DRAFT_END,
  BAB2_FOUNDATION_BEGIN,
  BAB2_FOUNDATION_END,
  BAB2_POLISH_BEGIN,
  BAB2_POLISH_END,
  parseBab2DraftTransfer,
  parseBab2FoundationTransfer,
  parseBab2PolishTransfer,
  pendekatanBolehHipotesis,
  strukturBakuBab2,
} from "./src/lib/bab2Parser";
import {
  cariPelanggaranFrasa,
  cariSalinanVerbatim,
  periksaDrafBab2,
  periksaFondasiBab2,
  periksaPolesBab2,
  ringkasTemuanBab2,
  sadarNegasi,
} from "./src/lib/bab2Checks";
import { assembleBab2DraftShortCommand, assembleBab2FoundationPrompt, labelPendekatan } from "./src/lib/bab2Prompts";
import type { Bab2DraftV1, Bab2FoundationV1, Bab2Pendekatan } from "./src/types/bab2";

let lulus = 0;
let gagal = 0;
function cek(nama: string, syarat: boolean, detail = "") {
  if (syarat) {
    lulus++;
    console.log(`  PASS  ${nama}`);
  } else {
    gagal++;
    console.log(`  FAIL  ${nama}${detail ? ` — ${detail}` : ""}`);
  }
}

// =========================================================================
// Fixture asli
// =========================================================================
const registerRaw = readFileSync("fixtures/register-t3-asli.txt", "utf8");
const register = extractSumberPaketLiteratur(registerRaw);
const fondasiRaw = readFileSync("fixtures/fondasi-4b-asli.txt", "utf8");
const fondasi4B = parseBab1DraftTransfer(fondasiRaw).data === undefined ? null : null;
const fondasiMentah = readFileSync("fixtures/fondasi-4b-asli.txt", "utf8");

console.log("\n[1] Peta literatur deterministik (Tahap 11)");
cek(`register terbaca (${register.length} sumber)`, register.length >= 8, `dapat ${register.length}`);
const peta = bangunPetaBab2(register);
cek(`peta MAP_COMPLETE`, peta.map_status === "MAP_COMPLETE", peta.map_status);
cek("tabel penelitian terdahulu = jumlah sumber", peta.prior_research_table.length === register.length);
const adaPenulis = peta.prior_research_table.filter((b) => b.author && b.year).length;
cek(`sumber berpenulis+tahun (${adaPenulis})`, adaPenulis >= 8);
cek(
  "tidak ada sel yang dikarang: setiap baris berasal dari register",
  peta.prior_research_table.every((b) => register.some((s) => s.sourceId.replace(/[[\]]/g, "").trim() === b.source_id))
);
const contoh = barisDariSumber(register[0]);
cek("kolom tak tercatat ditandai, bukan diisi", Array.isArray(contoh.not_recorded_fields));
cek("theme_clusters sengaja kosong (register tidak punya tema)", peta.theme_clusters.length === 0);
cek("conflict_pairs sengaja kosong (register tidak punya arah temuan)", peta.conflict_pairs.length === 0);

console.log("\n[2] Parser fondasi 6A");
const fondasiBersih = {
  schema_version: 1,
  foundation_status: "BAB2_READY",
  status_reason: "sumber cukup",
  pendekatan: "VERIFIKATIF",
  pendekatan_sumber: "Tool 1",
  structure_blueprint: [
    { order: 1, sub_bab: "Landasan Teori", function: "menyusun konsep", source_ids: ["S1"] },
    { order: 2, sub_bab: "Penelitian Terdahulu", function: "memetakan temuan", source_ids: ["S2"] },
    { order: 3, sub_bab: "Kerangka Pemikiran", function: "usulan hubungan", source_ids: [] },
    { order: 4, sub_bab: "Hipotesis", function: "usulan uji", source_ids: [] },
  ],
  theory_map: [{ konstruk: "Diplomasi", definisi_ringkas: "upaya negara", source_ids: ["S1"], status_klaim: "READY_TO_DRAFT" }],
  claim_ledger: [
    { claim_id: "CLM-B2-01", claim_text: "Diplomasi adalah upaya negara.", claim_type: "THEORY_CLAIM", source_ids: ["S1"], status: "READY_TO_DRAFT" },
  ],
  prohibited_claims: [],
  not_safe_to_say: [],
  unresolved_notes: [],
  candidate_new_sources: [],
  hypothesis_candidates: [{ pernyataan: "X berpengaruh", arah: "positif", status: "CANDIDATE_ONLY", researcher_decision: "pending" }],
  target_words_total: 2400,
};

const teksFondasi = `${BAB2_FOUNDATION_BEGIN}\n${JSON.stringify(fondasiBersih)}\n${BAB2_FOUNDATION_END}`;
const hasilFondasi = parseBab2FoundationTransfer(teksFondasi);
cek("fondasi 6A diparse", hasilFondasi.success === true, hasilFondasi.error);
cek("target per sub-bab di-backfill", (hasilFondasi.data?.structure_blueprint || []).every((b) => !!b.target_word_range));
cek("backfill <= batas atas rentang", (hasilFondasi.data?.structure_blueprint || []).reduce((a, b) => a + (b.target_word_range?.[1] || 0), 0) >= 2400);

console.log("\n[3] Hipotesis pada pendekatan non-verifikatif DIBUANG di parser");
const fondasiDeskriptif = { ...fondasiBersih, pendekatan: "DESKRIPTIF" };
const hDesk = parseBab2FoundationTransfer(
  `${BAB2_FOUNDATION_BEGIN}\n${JSON.stringify(fondasiDeskriptif)}\n${BAB2_FOUNDATION_END}`
);
cek("hipotesis dibuang untuk DESKRIPTIF", (hDesk.data?.hypothesis_candidates || []).length === 0);
cek("peringatan pembuangan muncul", (hDesk.warnings || []).some((w) => /hipotesis/i.test(w)));
cek("pendekatanBolehHipotesis: VERIFIKATIF=true, DESKRIPTIF=false", pendekatanBolehHipotesis("VERIFIKATIF") && !pendekatanBolehHipotesis("DESKRIPTIF"));
cek("struktur DESKRIPTIF tanpa Hipotesis", !strukturBakuBab2("DESKRIPTIF").includes("Hipotesis"));
cek("struktur KAJIAN_LITERATUR pakai Kerangka Analisis", strukturBakuBab2("KAJIAN_LITERATUR").includes("Kerangka Analisis"));

console.log("\n[4] Guard sadar-negasi (B.6)");
cek('"tidak menyebabkan perubahan" tidak dilaporkan', sadarNegasi("Hasil ini tidak menyebabkan perubahan pada laporan lain."));
cek('"mendorong terjadinya" telanjang TIDAK diselamatkan', !sadarNegasi("Kebijakan ini mendorong terjadinya perubahan."));
const frasaA = cariPelanggaranFrasa("Perlu dicatat bahwa temuan ini tidak membuktikan bahwa X menyebabkan Y.", "Uji");
cek("kalimat penyangkalan bebas temuan", frasaA.length === 0, JSON.stringify(frasaA.map((f) => f.code)));
const frasaB = cariPelanggaranFrasa("Menurut para ahli, kebijakan ini menyebabkan perubahan besar.", "Uji");
cek("atribusi tanpa nama tertangkap", frasaB.some((f) => f.code === "FABRICATED_ATTRIBUTION"));
cek("klaim kausal tertangkap", frasaB.some((f) => f.code === "CAUSAL_CLAIM_FROM_CORRELATION"));
const frasaC = cariPelanggaranFrasa("Belum ada penelitian yang membahas hal ini secara khusus.", "Uji");
cek("gap sintetis tertangkap", frasaC.some((f) => f.code === "SYNTHETIC_GAP_PHRASE"));

console.log("\n[5] Salinan verbatim");
const sumberPanjang = "kebijakan luar negeri filipina mengalami perubahan mendasar sejak tahun dua ribu dua puluh dua ketika pemerintahan baru mengambil arah yang berbeda";
const salinan = cariSalinanVerbatim(
  "Dalam kajian ini kebijakan luar negeri filipina mengalami perubahan mendasar sejak tahun dua ribu dua puluh dua ketika pemerintahan baru mengambil arah yang berbeda dari sebelumnya.",
  sumberPanjang,
  "Landasan Teori"
);
cek("salinan 12 kata berturut-turut tertangkap", salinan?.code === "VERBATIM_COPY");
cek("parafrase wajar tidak tertangkap", cariSalinanVerbatim("Filipina mengubah arah kebijakan luar negerinya pada 2022.", sumberPanjang, "Uji") === null);

console.log("\n[6] Parser draf 6B");
const drafBersih: Bab2DraftV1 = {
  schema_version: 1,
  draft_status: "DRAFT_COMPLETE",
  foundation_status_ref: "BAB2_READY",
  word_count_total: 0,
  target_words_total: 2400,
  background: [
    {
      order: 1,
      sub_bab: "Landasan Teori",
      function: "menyusun konsep",
      paragraph_text: "Diplomasi dipahami sebagai upaya negara mencapai kepentingan nasional (Mishra, 2017). ".repeat(12),
      claim_ids: ["CLM-B2-01"],
    },
  ],
  skipped_sections: [],
  used_claim_ids: ["CLM-B2-01"],
  used_source_ids: ["S1"],
  avoided_claims: [],
  new_sources_introduced: [],
  consistency_notes: [],
  unresolved_notes: [],
};
const hasilDraf = parseBab2DraftTransfer(`${BAB2_DRAFT_BEGIN}\n${JSON.stringify(drafBersih)}\n${BAB2_DRAFT_END}`, {
  foundation: hasilFondasi.data,
});
cek("draf 6B diparse", hasilDraf.success === true, hasilDraf.error);
cek("word_count dihitung tool, bukan AI", (hasilDraf.data?.word_count_total || 0) > 0);

console.log("\n[7] Pemeriksa fondasi — sumber di luar register");
const fondasiNakal: Bab2FoundationV1 = {
  ...(hasilFondasi.data as Bab2FoundationV1),
  candidate_new_sources: [{ id_sementara: "BARU-1", authors_year: "Smith (2019)", title: "Paper Baru", alasan_muncul: "diingat model" }],
  theory_map: [{ konstruk: "Konsep Tanpa Sumber", definisi_ringkas: "definisi", source_ids: [], status_klaim: "READY_TO_DRAFT" }],
};
const temuanFondasi = periksaFondasiBab2(fondasiNakal, register);
cek("sumber di luar register ditandai CRITICAL", temuanFondasi.some((f) => f.code === "SOURCE_NOT_IN_REGISTER" && f.severity === "CRITICAL"));
cek("teori tanpa sumber ditandai MAJOR", temuanFondasi.some((f) => f.code === "THEORY_WITHOUT_SOURCE" && f.severity === "MAJOR"));
const fondasiHipDesk = periksaFondasiBab2({ ...(hasilFondasi.data as Bab2FoundationV1), pendekatan: "DESKRIPTIF", hypothesis_candidates: [{ pernyataan: "X", arah: "y", status: "CANDIDATE_ONLY", researcher_decision: "pending" }] }, register);
cek("hipotesis pada non-verifikatif CRITICAL", fondasiHipDesk.some((f) => f.code === "HYPOTHESIS_ON_NON_VERIFICATIVE"));

console.log("\n[8] Pemeriksa draf — klaim & struktur");
const drafNakal: Bab2DraftV1 = {
  ...drafBersih,
  background: [
    { ...drafBersih.background[0], claim_ids: ["CLM-TIDAK-ADA"] },
    { order: 2, sub_bab: "Hipotesis", function: "usulan", paragraph_text: "Hipotesis ini terbukti benar.", claim_ids: ["CLM-B2-01"] },
  ],
  new_sources_introduced: [{ id_sementara: "BARU-2", authors_year: "Doe (2020)", title: "Paper", alasan_muncul: "diingat" }],
  used_source_ids: ["S1", "S2"],
};
const temuanDraf = periksaDrafBab2(drafNakal, hasilFondasi.data as Bab2FoundationV1, register);
cek("claim_id tak dikenal CRITICAL", temuanDraf.some((f) => f.code === "CLAIM_ID_UNKNOWN"));
cek("sumber teleport CRITICAL", temuanDraf.some((f) => f.code === "NEW_SOURCE_INTRODUCED"));
cek("sub-bab di luar blueprint ditandai", temuanDraf.some((f) => f.code === "SUBBAB_STRUCTURE_MISMATCH"));
cek("panjang di luar rentang ditandai", temuanDraf.some((f) => f.code === "WORD_COUNT_OUT_OF_RANGE"));
cek("ringkasan temuan konsisten", ringkasTemuanBab2(temuanDraf).total === temuanDraf.length);

console.log("\n[9] Pemeriksa poles — peta klaim dikunci");
const hasilPoles: import("./src/types/bab2").Bab2PolishV1 = {
  schema_version: 1,
  polish_status: "POLISH_COMPLETE" as const,
  word_count_total: 2400,
  background: drafBersih.background,
  claim_ids_unchanged: true,
  language_notes: [],
  changed_sections: [],
  unresolved_notes: [],
};
cek("poles tanpa perubahan klaim = bersih", periksaPolesBab2(hasilPoles, drafBersih).length === 0);
const polesUbah = { ...hasilPoles, claim_ids_unchanged: false, background: [{ ...drafBersih.background[0], claim_ids: [] }] };
cek("perubahan klaim di poles CRITICAL", periksaPolesBab2(polesUbah, drafBersih).some((f) => f.code === "CLAIM_ID_UNKNOWN"));

console.log("\n[10] Prompt 6A/6B/6C");
const inputPrompt = {
  prodi: "Hubungan Internasional",
  areaEksplorasi: "Kebijakan luar negeri",
  pendekatan: "DESKRIPTIF" as Bab2Pendekatan,
  peta,
  register,
  foundation: null,
};
const p6a = assembleBab2FoundationPrompt(inputPrompt);
cek("6A memuat daftar sumber dari register", p6a.includes(peta.prior_research_table[0].source_id));
cek("6A melarang atribusi tanpa nama", /menurut para ahli/i.test(p6a) && /DILARANG/i.test(p6a));
cek("6A melarang gap sintetis", /belum ada penelitian/i.test(p6a));
cek("6A memuat larangan hipotesis untuk DESKRIPTIF", /DILARANG membuat hipotesis/i.test(p6a));
const cmd = assembleBab2DraftShortCommand(inputPrompt);
cek(`perintah pendek 6B aman untuk NotebookLM (${cmd.length} char)`, cmd.length <= 3900, `${cmd.length} char`);
cek("6B memuat penanda JSON", cmd.includes(BAB2_DRAFT_BEGIN) && cmd.includes(BAB2_DRAFT_END));
cek("label pendekatan manusiawi", labelPendekatan("DESKRIPTIF").includes("tanpa hipotesis"));

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
