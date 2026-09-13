/**
 * Cek: pemeriksa draf menandai sitasi yang tidak ada di paket bukti.
 *
 * Cacat yang dicegah: AI menulis "(Santoso, 2019)" untuk sumber yang tidak pernah
 * dipakai mahasiswa; tanpa pemeriksa, sitasi karangan itu lolos ke draf akhir.
 * Sebaliknya, sitasi yang SAH (nama dari paragraph_claims) tidak boleh ditandai —
 * alarm palsu bikin mahasiswa mengabaikan seluruh panel.
 *
 * Jalankan: npx tsx test-sitasi-palsu.mts
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

const foundation: any = {
  foundation_status: "BAB1_CONDITIONAL",
  status_reason: "Uji.",
  target_words_total: 1150,
  background_map: FUNGSI.map((fn, i) => ({
    order: i + 1,
    function: fn,
    readiness: "READY",
    key_message: "Pesan " + (i + 1),
    target_word_range: "150-200",
    safe_claims: [{ claim_id: "CLM0" + (i + 1), claim_type: "SAFE", statement: "Klaim " + (i + 1), source_ids: ["S4"] }],
  })),
  evidence_ledger: FUNGSI.map((_, i) => ({
    claim_id: "CLM0" + (i + 1),
    support_status: "READY_TO_DRAFT",
    claim: "Klaim bukti " + (i + 1),
    bab1_function: "Fungsi " + (i + 1),
    usage_limit: "Terbatas.",
    source_ids: ["S4"],
  })),
  // Nama penulis yang SAH ada di sini — dipakai sebagai daftar pembanding.
  paragraph_claims: [
    {
      function: "PRIOR_GOOD_RESEARCH",
      sourceIds: ["S4"],
      sourceReferences: [{ authorsYear: "Desy Nur Shafitri et al., 2024", title: "A", doiOrUrl: "x", locator: "hlm. 1" }],
    },
  ],
  prohibited_claims: [],
  unresolved_decisions: [],
} as any;

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

const kode = (r: any[]) => r.map((f) => f.code);

console.log("\n[1] Sitasi KARANGAN ditandai");
const rPalsu = periksaDrafBab1(buatDraf("Temuan ini sejalan dengan (Santoso, 2019).") as any, foundation);
cek("menghasilkan CITATION_UNKNOWN_SOURCE", kode(rPalsu).includes("CITATION_UNKNOWN_SOURCE"), kode(rPalsu).join(","));
cek("pesannya menyebut sitasi yang salah", rPalsu.some((f) => f.message.includes("(Santoso, 2019)")),
  rPalsu.map((f) => f.message).join(" | "));

console.log("\n[2] Sitasi SAH tidak ditandai (anti alarm palsu)");
const rSah = periksaDrafBab1(buatDraf("Temuan ini sejalan dengan (Desy Nur Shafitri et al., 2024).") as any, foundation);
cek("TIDAK menghasilkan CITATION_UNKNOWN_SOURCE", !kode(rSah).includes("CITATION_UNKNOWN_SOURCE"), kode(rSah).join(","));

console.log("\n[3] ID sumber tetap diterima apa adanya");
const rId = periksaDrafBab1(buatDraf("Sesuai (S4, 2024) dan (S4).") as any, foundation);
cek("tidak menandai sitasi berbasis ID sumber", !kode(rId).includes("CITATION_UNKNOWN_SOURCE"), kode(rId).join(","));

console.log("\n[4] Tanpa nama penulis di fondasi, pemeriksa tidak menyala");
const tanpaNama: any = { ...foundation, paragraph_claims: [] };
const rKosong = periksaDrafBab1(buatDraf("Temuan ini sejalan dengan (Santoso, 2019).") as any, tanpaNama);
cek("tidak menandai apa pun (tidak ada pembanding)", !kode(rKosong).includes("CITATION_UNKNOWN_SOURCE"), kode(rKosong).join(","));

console.log("\nRINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
if (gagal > 0) process.exit(1);
