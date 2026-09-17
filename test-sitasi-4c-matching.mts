/**
 * Cek regresi Tahap 4C: sitasi BENAR tidak boleh dituduh karangan.
 *
 * Cacat yang dicegah: himpunan "sitasi sah" dulu disimpan sebagai string UTUH
 * ("(chen & wang, 2024)"), sehingga nama disingkat dan sitasi gabungan selalu
 * gagal cocok. Uji nyata: 8 dari 10 temuan di draf asli adalah CITATION_UNKNOWN_SOURCE
 * palsu. Sebaliknya pemeriksa TIDAK boleh jadi longgar — sitasi karangan tetap wajib
 * tertangkap (lihat test-sitasi-palsu.mts).
 *
 * Jalankan: npx tsx test-sitasi-4c-matching.mts
 */
import { periksaDrafBab1 } from "./src/lib/bedahParser";

let lulus = 0;
let gagal = 0;
const cek = (nama: string, kondisi: boolean, detail?: string) => {
  if (kondisi) {
    lulus++;
    console.log("  OK   " + nama);
  } else {
    gagal++;
    console.log("  GAGAL " + nama + (detail ? " :: " + detail : ""));
  }
};

const FUNGSI = [
  "SPECIFIC_CONTEXT",
  "OBJECT_AND_SCOPE",
  "EMPIRICAL_PHENOMENON",
  "WHY_IT_IS_A_PROBLEM",
  "PRIOR_GOOD_RESEARCH",
  "KNOWLEDGE_LIMIT_OR_GAP",
  "URGENCY_AND_DIRECTION",
];
const isiKata = (n: number) => Array.from({ length: n }, (_, i) => `kata${i}`).join(" ") + ".";
const buatDraf = (sisipan: string) => ({
  schema_version: 1,
  draft_status: "DRAFT_COMPLETE",
  foundation_status_ref: "BAB1_CONDITIONAL",
  word_count_total: 1050,
  target_words_total: 1150,
  background: FUNGSI.map((fn, i) => ({
    order: i + 1,
    function: fn,
    paragraph_text: isiKata(150) + (i === 4 ? " " + sisipan : ""),
    claim_ids: ["CLM0" + (i + 1)],
    researcher_decision_note: null,
    withheld_claims: [],
  })),
  used_claim_ids: FUNGSI.map((_, i) => "CLM0" + (i + 1)),
});

const foundation: any = {
  foundation_status: "BAB1_CONDITIONAL",
  status_reason: "Uji regresi pencocokan sitasi.",
  target_words_total: 1150,
  background_map: FUNGSI.map((fn, i) => ({
    order: i + 1,
    function: fn,
    readiness: "READY",
    key_message: "Pesan " + (i + 1),
    target_word_range: "150-200",
    safe_claims: [{ claim_id: "CLM0" + (i + 1), claim_type: "SAFE", statement: "K" + (i + 1), source_ids: ["S3"] }],
  })),
  evidence_ledger: FUNGSI.map((_, i) => ({
    claim_id: "CLM0" + (i + 1),
    support_status: "READY_TO_DRAFT",
    claim: "Klaim " + (i + 1),
    bab1_function: "Fungsi " + (i + 1),
    usage_limit: "Terbatas.",
    source_ids: ["S3", "S10", "Bukti 1"],
  })),
  paragraph_claims: [{ function: "PRIOR_GOOD_RESEARCH", sourceIds: ["S3", "S10"], sourceReferences: [] }],
  prohibited_claims: [],
  unresolved_decisions: [],
} as any;

// Register Tool 3 nyata: penulis ditulis LENGKAP dalam satu sel, "Nama (Tahun)".
const REGISTER = [
  { sourceId: "S3", authorsYear: "Yue Chen & Kan Wang (2024)" },
  { sourceId: "S5", authorsYear: "Fitri Chintya Febriani, Syaiful Anam, Kinanti Rizsa Sabilla (2023)" },
  { sourceId: "S10", authorsYear: "Péter Klemensits (2025)" },
];

const temuanSitasi = (sisipan: string) =>
  (periksaDrafBab1(buatDraf(sisipan) as any, foundation, REGISTER) as any[])
    .filter((f) => f.code === "CITATION_UNKNOWN_SOURCE")
    .map((f) => f.message);

console.log("\n[1] Lima bentuk sitasi lazim lolos tanpa alarm");
const lazim: [string, string][] = [
  ["nama lengkap persis register", "Sejalan dengan (Yue Chen & Kan Wang, 2024)."],
  ["nama disingkat", "Sejalan dengan (Chen & Wang, 2024)."],
  ["et al.", "Sejalan dengan (Febriani et al., 2023)."],
  ["satu sumber", "Sejalan dengan (Klemensits, 2025)."],
  ["tahun berhuruf", "Sejalan dengan (Chen & Wang, 2024a)."],
];
for (const [nama, teks] of lazim) {
  const t = temuanSitasi(teks);
  cek(nama + " -> 0 temuan", t.length === 0, t.join(" | "));
}

console.log("\n[2] Sitasi gabungan dalam satu kurung");
const gabungan: [string, string][] = [
  ["dua sumber, pemisah ';'", "Sejalan dengan (Chen & Wang, 2024; Klemensits, 2025)."],
  ["dua sumber, pemisah ','", "Sejalan dengan (Chen & Wang 2024, Klemensits 2025)."],
  ["tiga sumber, satu nama karangan", "Sejalan dengan (Chen & Wang, 2024; Klemensits, 2025; Santoso, 2019)."],
];
for (const [nama, teks] of gabungan) {
  const t = temuanSitasi(teks);
  if (nama.startsWith("tiga")) {
    cek(nama + " -> satu temuan untuk yang karangan saja", t.length === 1 && t[0].includes("Santoso"),
      t.join(" | "));
  } else {
    cek(nama + " -> 0 temuan", t.length === 0, t.join(" | "));
  }
}

console.log("\n[3] Rentang tahun BUKAN sitasi");
const rentang = ["Periode (2016–2022) menjadi fokus.", "Periode (2022–2024) menjadi fokus.",
  "Periode (2016-2022) menjadi fokus."];
for (const teks of rentang) {
  const t = temuanSitasi(teks);
  cek(`"${teks.match(/\([^)]*\)/)![0]}" -> 0 temuan`, t.length === 0, t.join(" | "));
}

console.log("\n[4] Bentuk berbasis ID sumber tetap sah");
const idBentuk: [string, string][] = [
  ["(S3, 2024)", "Sejalan dengan (S3, 2024)."],
  ["(Bukti 1)", "Sejalan dengan (Bukti 1)."],
  ["S7 telanjang", "Sejalan dengan S7."],
];
for (const [nama, teks] of idBentuk) {
  const t = temuanSitasi(teks);
  cek(nama + " -> 0 temuan", t.length === 0, t.join(" | "));
}

console.log("\n[5] Sitasi karangan tetap ketangkap (tidak dilonggarkan)");
const karangan = ["Temuan ini sejalan dengan (Santoso, 2019).",
  "Temuan ini sejalan dengan (Chen & Wang, 2019)."];
for (const teks of karangan) {
  const t = temuanSitasi(teks);
  cek(`"${teks.match(/\([^)]*\)/)![0]}" -> ditandai`, t.length === 1, t.join(" | "));
}

console.log("\n[6] Pesan tidak menuduh mengarang");
const pesanKarangan = temuanSitasi("Temuan ini sejalan dengan (Santoso, 2019).")[0] || "";
cek("menyebut 'belum ditemukan di paket bukti'", pesanKarangan.includes("belum ditemukan di paket bukti"), pesanKarangan);
cek("tidak memakai kata 'karangan'", !/karangan/i.test(pesanKarangan), pesanKarangan);

console.log("\nRINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
if (gagal > 0) process.exit(1);
