/**
 * Cek regresi: nama penulis-tahun dari paket bukti WAJIB sampai ke prompt 4C.
 *
 * Cacat yang dicegah: `paragraph_claims[].sourceReferences` sudah memuat nama
 * penulis nyata, tetapi jalur 4C hanya membaca `source_ids` sehingga AI cuma bisa
 * menulis ID sumber `(S4, S10)` dan latar belakang keluar tanpa sitasi.
 *
 * Jalankan: npx tsx test-sitasi-4c.mts
 */
import {
  assembleBedahPrompt4C,
  assembleBab1DraftSourceFile,
  bangunPetaSitasi,
} from "./src/lib/promptAssembler";

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

// Fixture: dua sumber berpenulis nyata + satu sumber placeholder + satu tanpa ref.
const f: any = {
  foundation_status: "BAB1_CONDITIONAL",
  status_reason: "Uji regresi sitasi.",
  target_words_total: 1150,
  candidate_research_questions: [{ id: "RQ1", question: "Bagaimana pola respons Filipina?" }],
  candidate_objectives: [{ id: "T1", objective: "Memetakan pola.", linked_question_id: "RQ1" }],
  background_map: FUNGSI.map((fn, i) => ({
    order: i + 1,
    function: fn,
    readiness: "READY",
    key_message: "Pesan paragraf " + (i + 1),
    target_word_range: "130-185",
    transition_to_next: "Transisi.",
    safe_claims: [
      {
        claim_id: "CLM0" + (i + 1),
        claim_type: "SAFE",
        statement: "Klaim aman " + (i + 1),
        source_ids: ["S4", "S7"],
      },
    ],
    prohibited_claims: ["Dilarang gap sintetis."],
    missing_information: [],
  })),
  evidence_ledger: FUNGSI.map((_, i) => ({
    claim_id: "CLM0" + (i + 1),
    support_status: "READY_TO_DRAFT",
    claim: "Klaim bukti " + (i + 1),
    bab1_function: "Menopang paragraf " + (i + 1),
    usage_limit: "Hanya paragraf ini.",
    source_ids: ["S4", "S10", "Bukti 1", "S99"],
  })),
  // S4 & S10 punya nama nyata; "Bukti 1" placeholder; S99 tidak punya ref sama sekali.
  paragraph_claims: [
    {
      function: "PRIOR_RESEARCH",
      claimType: "CROSS_SOURCE_SYNTHESIS",
      proposedClaim: "Penelitian terdahulu menunjukkan pola.",
      sourceIds: ["S4", "S10", "Bukti 1"],
      sourceReferences: [
        { authorsYear: "Desy Nur Shafitri et al., 2024", title: "A", doiOrUrl: "x", locator: "hlm. 3" },
        { authorsYear: "Péter Klemensits, 2025", title: "B", doiOrUrl: "y", locator: "hlm. 7" },
        { authorsYear: "[Penulis tidak disediakan]", title: "C", doiOrUrl: "z", locator: "-" },
      ],
      readiness: "READY_TO_DRAFT",
    },
  ],
  prohibited_claims: ["Belum ada penelitian tentang X."],
  unresolved_decisions: ["Sampel belum ditetapkan."],
  supervisor_questions: ["Apakah periode sudah tepat?"],
  provisional_contributions: { empirical: "E", practical: "P", academic: "A", methodological: "M" },
};

const input: any = { prodi: "Hubungan Internasional", areaEksplorasi: "Laut China Selatan", foundation: f };
const petaSitasi = bangunPetaSitasi(f);
const prompt = assembleBedahPrompt4C(input);
const berkas = assembleBab1DraftSourceFile(input);

console.log("\n[1] Peta sitasi dari paragraph_claims");
cek("S4 dipetakan ke nama penulis asli", petaSitasi.get("S4") === "Desy Nur Shafitri et al., 2024", String(petaSitasi.get("S4")));
cek("S10 dipetakan ke nama penulis asli", petaSitasi.get("S10") === "Péter Klemensits, 2025", String(petaSitasi.get("S10")));
cek("placeholder kurung siku TIDAK dipetakan", !petaSitasi.has("BUKTI 1"), String(petaSitasi.get("BUKTI 1")));
cek("kunci bersih tanpa kurung siku", petaSitasi.has("S4") && !petaSitasi.has("[S4]"));

console.log("\n[2] Prompt 4C memuat nama penulis, bukan cuma ID");
cek("prompt memuat (Desy Nur Shafitri et al., 2024)", prompt.includes("Desy Nur Shafitri et al., 2024"));
cek("prompt memuat (Péter Klemensits, 2025)", prompt.includes("Péter Klemensits, 2025"));
cek("prompt TIDAK lagi menulis 'Sumber: S4, S10'", !prompt.includes("Sumber: S4, S10"), "masih ada bentuk ID mentah");
cek("ID tanpa nama tetap muncul apa adanya", prompt.includes("S99"));
cek("placeholder tidak bocor jadi sitasi", !prompt.includes("([Penulis tidak disediakan])"));

console.log("\n[3] Berkas sumber NotebookLM ikut memuat nama penulis");
cek("berkas memuat nama penulis", berkas.includes("Desy Nur Shafitri et al., 2024"));
cek("berkas memuat SELURUH prompt 4C di dalamnya", berkas.length > prompt.length,
  `${berkas.length} vs ${prompt.length}`);

console.log("\n[4] Larangan mengarang tetap utuh");
cek("masih melarang mengarang sitasi", /Jangan mengarang sitasi/.test(prompt));
cek("ada aturan salin apa adanya", /SALIN APA ADANYA/.test(prompt));
cek("larangan mengarang tetap ada di berkas sumber", /Jangan mengarang sitasi/.test(berkas));

console.log("\n[5] Register Tool 3 melengkapi nama yang tidak disebut fondasi");
// Fondasi di atas hanya menyebut S4 & S10; register punya nama untuk S7 juga.
const register = [{ sourceId: "S7", authorsYear: "Azlia Amira Putri (2023)" }];
const inputReg: any = { ...input, registerSumber: register };
const promptReg = assembleBedahPrompt4C(inputReg);
const petaReg = bangunPetaSitasi(f, register);
cek("peta bertambah dari register", petaReg.get("S7") === "Azlia Amira Putri, 2023", String(petaReg.get("S7")));
cek("bentuk '(2023)' diseragamkan jadi ', 2023'", promptReg.includes("(Azlia Amira Putri, 2023)"));
cek("tidak lahir kurung bersarang '((2023))'", !/\(\([^)]*\)\)/.test(promptReg));
cek("ID telanjang S7 hilang dari prompt", !/Sumber: [^\n]*\bS7\b/.test(promptReg),
  (promptReg.match(/Sumber: [^\n]*S7[^\n]*/) || [""])[0]);cek("nama dari fondasi tetap menang (S4 tidak ditimpa)", promptReg.includes("(Desy Nur Shafitri et al., 2024)"));

console.log("\nRINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
if (gagal > 0) process.exit(1);
