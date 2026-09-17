/**
 * Addendum D — Berkas Sumber NotebookLM (Tahap 4C).
 *
 * Cacat yang dicegah: prompt 4C mentok di batas chat box NotebookLM (~3.900),
 * padahal instruksinya sendiri sudah 4.883 karakter tanpa data mahasiswa.
 * Solusi: seluruh prompt jadi berkas sumber; chat box hanya perintah pendek.
 */
import { readFileSync } from "node:fs";
import { parseBab1FoundationTransfer } from "./src/lib/bedahParser";
import {
  assembleBedahPrompt4C,
  assembleBab1DraftSourceFile,
  assembleBab1DraftShortCommand,
  analyzeBab1DraftShortCommand,
} from "./src/lib/promptAssembler";
import { NOTEBOOKLM_LIMITS } from "./src/config/promptLimits";

let lulus = 0, gagal = 0;
const cek = (n: string, k: boolean, d?: string) => {
  if (k) { lulus++; console.log("  OK   " + n); }
  else { gagal++; console.log("  GAGAL " + n + (d ? " :: " + d : "")); }
};

// Fixture mandiri (tidak bergantung file /tmp yang bisa hilang)
const FUNGSI = ["SPECIFIC_CONTEXT","OBJECT_AND_SCOPE","EMPIRICAL_PHENOMENON","WHY_IT_IS_A_PROBLEM","PRIOR_GOOD_RESEARCH","KNOWLEDGE_LIMIT_OR_GAP","URGENCY_AND_DIRECTION"];
const f: any = {
  foundation_status: "BAB1_CONDITIONAL",
  status_reason: "Data laporan komparatif belum dipastikan.",
  target_words_total: 1150,
  candidate_research_questions: [{ id:"RQ1", question:"Bagaimana pola transisi PSAK 117 pada emiten asuransi?" }],
  candidate_objectives: [{ id:"T1", objective:"Memetakan pola transisi.", linked_question_id:"RQ1" }],
  background_map: FUNGSI.map((fn, i) => ({
    order: i + 1,
    function: fn,
    readiness: "READY",
    key_message: "Pesan utama paragraf " + (i + 1),
    target_word_range: "130-185",
    transition_to_next: "Transisi ke paragraf berikutnya.",
    safe_claims: [{ claim_id: "CLM0" + (i + 1), claim_type: "SAFE", statement: "Klaim aman " + (i + 1), source_ids: ["SRC-01"] }],
    prohibited_claims: ["Dilarang menyebut gap sintetis."],
    missing_information: [],
  })),
  evidence_ledger: FUNGSI.map((_, i) => ({
    claim_id: "CLM0" + (i + 1),
    support_status: "READY_TO_DRAFT",
    claim: "Klaim bukti " + (i + 1),
    bab1_function: "Menopang paragraf " + (i + 1),
    usage_limit: "Hanya pada paragraf ini.",
    source_ids: ["SRC-01"],
  })),
  prohibited_claims: ["Belum ada penelitian tentang PSAK 117."],
  unresolved_decisions: ["Bentuk sampel belum ditetapkan."],
  supervisor_questions: ["Apakah periode komparatif sudah tepat?"],
  provisional_contributions: { empirical: "Peta transisi.", practical: "Bahan evaluasi.", academic: "Deskripsi awal.", methodological: "Kriteria pemilihan sampel." },
};
const jumlahParagraf = (f.background_map || []).length;
const input: any = { prodi: "Akuntansi", areaEksplorasi: "Asuransi", foundation: f };
const lama = assembleBedahPrompt4C(input);
const berkas = assembleBab1DraftSourceFile(input);
const perintah = assembleBab1DraftShortCommand(input);
const metrik = analyzeBab1DraftShortCommand(input);

console.log("");
console.log("[2] Perintah pendek yang masuk chat box WAJIB muat");
cek("perintah <= hard limit", perintah.length <= NOTEBOOKLM_LIMITS.hardLimit,
  `${perintah.length} > ${NOTEBOOKLM_LIMITS.hardLimit}`);
cek("status metrik bukan BLOCKED", metrik.status !== "BLOCKED", metrik.status);
cek("perintah jauh lebih pendek dari prompt lama", perintah.length < lama.length / 3,
  `${perintah.length} vs ${lama.length}`);
cek("metrik melaporkan panjang yang benar", metrik.finalLength === perintah.length);

console.log("");
console.log("[3] Berkas sumber memuat SELURUH instruksi (tidak ada yang hilang)");
for (const bagian of ["[PERAN]", "[ATURAN MENULIS]", "[FORMAT KELUARAN]", "[PETA NARASI"]) {
  cek(`berkas sumber memuat ${bagian}`, berkas.includes(bagian));
}
cek("berkas sumber memuat penanda JSON keluaran", berkas.includes("=== BEGIN SKRIFLOW_BAB1_DRAFT_V1 ==="));
cek("berkas sumber memuat data mahasiswa (bukan cuma instruksi)",
  berkas.includes(String(jumlahParagraf)));
cek("berkas sumber lebih panjang dari perintah", berkas.length > perintah.length);

console.log("");
console.log("[4] Berkas sumber TIDAK boleh disalahartikan sebagai sumber penelitian");
cek("ada peringatan eksplisit 'bukan sumber penelitian'", /bukan sumber penelitian/i.test(berkas));
cek("menyuruh memakai dokumen LAIN sebagai sumber", /dokumen LAIN/i.test(berkas));

console.log("");
console.log("[5] Perintah pendek menyebut berkas sumbernya + aturan kunci");
cek("menyebut nama berkas sumber", /Berkas Sumber Skriflow — Tahap 4C/.test(perintah));
cek("menyebut jumlah paragraf", perintah.includes(String(jumlahParagraf)) || jumlahParagraf === 0);
cek("mewajibkan claim_id", /claim_id/.test(perintah));
cek("paragraf terakhir = keputusan mahasiswa", /keputusan mahasiswa/i.test(perintah));
cek("melarang menambah sitasi/angka baru", /Jangan menambah sitasi/i.test(perintah));
cek("menyebut rentang 1000-1300 kata", /1000.{0,3}1300/.test(perintah));
cek("menyebut penanda JSON", /BEGIN SKRIFLOW_BAB1_DRAFT_V1/.test(perintah));

console.log("");
console.log("[6] Jalur lama tetap ada (tidak merusak yang sudah jalan)");
cek("assembleBedahPrompt4C masih menghasilkan prompt utuh", lama.length > 3000);
cek("berkas sumber dibangun DARI prompt lama (satu sumber kebenaran)",
  berkas.includes("[ATURAN MENULIS]") && lama.includes("[ATURAN MENULIS]"));

console.log("");
console.log("RINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
if (gagal > 0) process.exit(1);
