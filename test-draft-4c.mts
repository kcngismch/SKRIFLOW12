/**
 * Uji Tahap 4C: parser draf + pemeriksa draf.
 * Jalankan: npx tsx scratch/verify-draft-4c.mts
 */
import { parseBab1FoundationTransfer, parseBab1DraftTransfer, periksaDrafBab1, hitungKata } from "./src/lib/bedahParser";
import { assembleBedahPrompt4C } from "./src/lib/promptAssembler";
import { readFileSync } from "node:fs";

let lulus = 0;
let gagal = 0;
function cek(nama: string, kondisi: boolean, detail?: string) {
  if (kondisi) {
    lulus++;
    console.log(`  OK   ${nama}`);
  } else {
    gagal++;
    console.log(`  GAGAL ${nama}${detail ? ` :: ${detail}` : ""}`);
  }
}

const DOC = process.env.DOC || "/home/docker-server/.hermes/cache/documents/doc_dcd6fe7618e9_kumpulan.md - Copy.md";
const raw = readFileSync(DOC, "utf8");
const S = "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===";
const E = "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===";
// Dokumen memuat 2 pasang marker: contoh di dalam prompt 4B, lalu output asli.
// Ambil pasangan TERAKHIR (output asli).
const blok = raw.slice(raw.lastIndexOf(S), raw.lastIndexOf(E) + E.length);
const fondasi = parseBab1FoundationTransfer(blok);
cek("fondasi 4B terparse", fondasi.success === true, JSON.stringify(fondasi.errorDetails));
const f = fondasi.data!;

console.log("\n[1] Prompt 4C");
const prompt = assembleBedahPrompt4C({ prodi: "akuntansi", areaEksplorasi: "uji", foundation: f });
cek("prompt memuat penanda draft", prompt.includes("SKRIFLOW_BAB1_DRAFT_V1"));
cek("prompt memuat target total 1000–1300", prompt.includes("1000–1300 kata"));
cek("prompt memuat tiap fungsi peta", (f.background_map || []).every((p) => prompt.includes(p.function)));
cek("prompt memuat tiap claim_id ledger", (f.evidence_ledger || []).every((e) => prompt.includes(e.claim_id)));
cek("prompt melarang ngarang sitasi", /Jangan mengarang sitasi/.test(prompt));
cek("prompt melarang gap sintetis", /belum ada penelitian tentang/.test(prompt));
cek("prompt menjelaskan claim_ids wajib", /WAJIB berasal dari satu atau lebih claim_id/.test(prompt));
cek("prompt memuat aturan DO_NOT_USE", /DO_NOT_USE tidak boleh muncul/.test(prompt));
console.log(`  panjang prompt: ${prompt.length} karakter`);

console.log("\n[2] Parser draf — kasus bahagia");
const drafBagus = {
  schema_version: 1,
  draft_status: "DRAFT_COMPLETE",
  foundation_status_ref: f.foundation_status,
  word_count_total: 0,
  target_words_total: f.target_words_total || 1150,
  background: (f.background_map || []).map((p, i) => ({
    order: p.order,
    function: p.function,
    paragraph_text: Array.from({ length: 150 }, (_, k) => `kata${k}`).join(" ") + ".",
    claim_ids: (f.evidence_ledger || []).slice(i, i + 1).map((e) => e.claim_id),
    researcher_decision_note: null,
    withheld_claims: [],
  })),
  skipped_sections: [],
  used_claim_ids: (f.evidence_ledger || []).map((e) => e.claim_id),
  avoided_claims: [],
  consistency_notes: [],
  prohibited_claims_respected: [],
  unresolved_notes: [],
};
const r1 = parseBab1DraftTransfer(
  `=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n${JSON.stringify(drafBagus)}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ===`,
  { foundation: f }
);
cek("parse sukses", r1.success === true, r1.errorDetails?.join(" | "));
cek("7 paragraf kebaca", r1.data?.background.length === 7, String(r1.data?.background.length));
cek("word_count dihitung ulang tool", r1.data?.background[0].word_count === 150, String(r1.data?.background[0].word_count));
const kritis = (r1.findings || []).filter((x) => x.severity === "CRITICAL");
cek("draf bersih tanpa temuan CRITICAL", kritis.length === 0, kritis.map((x) => x.code).join(","));

console.log("\n[3] Parser draf — penolakan");
cek(
  "tolak marker hilang",
  parseBab1DraftTransfer("tidak ada marker").success === false
);
cek(
  "tolak json rusak",
  parseBab1DraftTransfer("=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n{bukan json}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ===").success === false
);
cek(
  "tolak background kosong",
  parseBab1DraftTransfer(
    '=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n{"schema_version":1,"background":[]}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ==='
  ).success === false
);
cek(
  "tolak schema_version salah",
  parseBab1DraftTransfer(
    '=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ===\n{"schema_version":2,"background":[{"order":1,"function":"SPECIFIC_CONTEXT","paragraph_text":"a","claim_ids":[]}]}\n=== END SKRIFLOW_BAB1_DRAFT_V1 ==='
  ).success === false
);

console.log("\n[4] Pemeriksa draf — kode temuan");
const idKlaim = (f.evidence_ledger || [])[0]?.claim_id || "CLM01";
const base = () => JSON.parse(JSON.stringify(drafBagus));

function temuanCode(mutasi: (d: typeof drafBagus) => void): string[] {
  const d = base();
  mutasi(d);
  return periksaDrafBab1(d as never, f).map((x) => x.code);
}

const kasus: Array<[string, () => string[], string]> = [
  ["CLAIM_ID_UNKNOWN", () => temuanCode((d) => ((d.background[0] as never as { claim_ids: string[] }).claim_ids = ["CLM99"])), "CLM99"],
  ["WORD_COUNT_OUT_OF_RANGE", () => temuanCode((d) => (d.background.forEach((p) => ((p as never as { paragraph_text: string }).paragraph_text = "kata kata.")))), "pendek"],
  ["ABSOLUTE_CLAIM_PHRASE", () => temuanCode((d) => ((d.background[0] as never as { paragraph_text: string }).paragraph_text += " Belum ada penelitian tentang hal ini.")), "absolut"],
  ["CAUSAL_CLAIM_FROM_CORRELATION", () => temuanCode((d) => ((d.background[1] as never as { paragraph_text: string }).paragraph_text += " Pengungkapan ini menyebabkan naiknya kepercayaan investor.")), "kausal"],
  ["BLOCKED_SECTION_WRITTEN", () => {
    const f2 = JSON.parse(JSON.stringify(f));
    f2.background_map[0].readiness = "BLOCKED";
    const d = base();
    return periksaDrafBab1(d as never, f2).map((x) => x.code);
  }, "blocked"],
  ["PARAGRAPH_FUNCTION_MISMATCH", () => temuanCode((d) => d.background.pop()!), "kurang 1"],
];

kasus.forEach(([kode, fn, ket]) => {
  const codes = fn();
  cek(`terdeteksi ${kode} (${ket})`, codes.includes(kode as never), `dapat: ${[...new Set(codes)].join(",")}`);
});

console.log("\n[5] Guard sadar-negasi (klaim terlarang di dalam kalimat batas BUKAN pelanggaran)");
const dNegasi = base();
dNegasi.background[3].paragraph_text =
  Array.from({ length: 150 }, (_, k) => `kata${k}`).join(" ") +
  " Perlu dicatat bahwa hasil ini tidak menyebabkan perubahan pada laporan lain.";
const codeNegasi = periksaDrafBab1(dNegasi as never, f).map((x) => x.code);
cek("kalimat 'tidak menyebabkan' tidak dilaporkan sebagai kausal", !codeNegasi.includes("CAUSAL_CLAIM_FROM_CORRELATION" as never), codeNegasi.join(","));

console.log("\n[6] Hitung kata");
cek("hitungKata dasar", hitungKata("satu dua tiga") === 3);
cek("hitungKata string kosong", hitungKata("") === 0);
cek("hitungKata spasi berlebih", hitungKata("  satu   dua  ") === 2);


console.log("\n[7] Red line kontrak: 4A/4B tidak berubah, 4C tahap terpisah");
import { assembleBedahPrompt } from "./src/lib/promptAssembler";
const prompt4A = assembleBedahPrompt({ prodi: "akuntansi", areaEksplorasi: "uji", literatureEvidencePackage: "" });
cek("4A masih melarang menulis draft Bab 1", prompt4A.includes("Jangan menulis draft Bab 1"));
cek("4C hanya boleh jalan setelah fondasi 4B ada", assembleBedahPrompt4C({ prodi: "a", areaEksplorasi: "b", foundation: f }).includes(f.foundation_status));

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
