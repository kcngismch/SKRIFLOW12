/**
 * Uji Tahap 4D (Addendum C): parser hasil poles + pemeriksa perubahan bahasa.
 * Jalankan: npx tsx test-polish-4d.mts
 */
import { parseBab1PolishTransfer, periksaPolesBab1 } from "./src/lib/bedahParser";
import { assembleBedahPrompt4D } from "./src/lib/promptAssembler";

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

/** Draf 4C sumber (isi mengikat). */
const draf4C = {
  schema_version: 1 as const,
  draft_status: "DRAFT_COMPLETE" as const,
  foundation_status_ref: "BAB1_CONDITIONAL" as const,
  word_count_total: 1200,
  target_words_total: 1150,
  background: [
    {
      order: 1,
      function: "SPECIFIC_CONTEXT" as const,
      paragraph_text:
        "PSAK 117 berlaku efektif di Indonesia mulai 1 Januari 2025 dan mengubah pengakuan serta pengungkapan kontrak asuransi. Perubahan ini menyentuh industri asuransi secara menyeluruh.",
      word_count: 30,
      claim_ids: ["CLM01"],
      researcher_decision_note: null,
      withheld_claims: [],
    },
    {
      order: 2,
      function: "EMPIRICAL_PHENOMENON" as const,
      paragraph_text:
        "Laporan tahunan 2025 PT Asuransi Ramayana Tbk menunjukkan penyesuaian pada pos liabilitas kontrak asuransi. Angka tersebut dilaporkan pada catatan atas laporan keuangan.",
      word_count: 28,
      claim_ids: ["CLM02", "CLM03"],
      researcher_decision_note: null,
      withheld_claims: [],
    },
    {
      order: 3,
      function: "URGENCY_AND_DIRECTION" as const,
      paragraph_text:
        "Berdasarkan hal tersebut, peneliti memilih memfokuskan kajian pada konsistensi pengungkapan PSAK 117 pada perusahaan asuransi.",
      word_count: 20,
      claim_ids: [] as string[],
      researcher_decision_note: "Keputusan mahasiswa, bukan temuan.",
      withheld_claims: [],
    },
  ],
  used_claim_ids: ["CLM01", "CLM02", "CLM03"],
  skipped_sections: [] as string[],
  avoided_claims: [] as string[],
  consistency_notes: [] as string[],
  prohibited_claims_respected: [] as string[],
  unresolved_notes: [] as string[],
};

const fondasi = {
  foundation_status: "BAB1_CONDITIONAL",
  prohibited_claims: ["Belum ada penelitian tentang pengungkapan PSAK 117"],
  evidence_ledger: [
    { claim_id: "CLM01", claim: "PSAK 117 efektif 1 Januari 2025", support_status: "READY_TO_DRAFT" },
    { claim_id: "CLM02", claim: "Ramayana menyesuaikan liabilitas", support_status: "READY_TO_DRAFT" },
    { claim_id: "CLM03", claim: "Angka dilaporkan di catatan", support_status: "READY_TO_DRAFT" },
  ],
  background_map: [
    { order: 1, function: "SPECIFIC_CONTEXT" },
    { order: 2, function: "EMPIRICAL_PHENOMENON" },
    { order: 3, function: "URGENCY_AND_DIRECTION" },
  ],
} as never;

function bungkus(obj: unknown, marker = "SKRIFLOW_BAB1_POLISH_V1"): string {
  return `=== BEGIN ${marker} ===\n${JSON.stringify(obj)}\n=== END ${marker} ===`;
}

/** Hasil 4D yang bersih: hanya bahasa berubah. */
function hasilBersih() {
  return {
    schema_version: 1,
    polish_status: "POLISH_COMPLETE",
    draft_status_ref: "DRAFT_COMPLETE",
    foundation_status_ref: "BAB1_CONDITIONAL",
    word_count_total: 1180,
    target_words_total: 1150,
    background: [
      {
        order: 1,
        function: "SPECIFIC_CONTEXT",
        paragraph_text:
          "PSAK 117 mulai berlaku di Indonesia sejak 1 Januari 2025 dan mengubah cara kontrak asuransi diakui serta diungkapkan. Perubahan ini berdampak pada hampir seluruh industri asuransi.",
        claim_ids: ["CLM01"],
        researcher_decision_note: null,
        withheld_claims: [],
      },
      {
        order: 2,
        function: "EMPIRICAL_PHENOMENON",
        paragraph_text:
          "Pada laporan tahunan 2025, PT Asuransi Ramayana Tbk terlihat menyesuaikan pos liabilitas kontrak asuransinya. Angka itu tersaji di catatan atas laporan keuangan.",
        claim_ids: ["CLM02", "CLM03"],
        researcher_decision_note: null,
        withheld_claims: [],
      },
      {
        order: 3,
        function: "URGENCY_AND_DIRECTION",
        paragraph_text:
          "Dari gambaran itu, peneliti memutuskan memfokuskan kajian pada konsistensi pengungkapan PSAK 117 di perusahaan asuransi.",
        claim_ids: [],
        researcher_decision_note: "Keputusan mahasiswa, bukan temuan.",
        withheld_claims: [],
      },
    ],
    language_changes: ["Paragraf 1: memecah kalimat panjang", "Paragraf 2: mengganti istilah kaku"],
    preserved_claim_ids: ["CLM01", "CLM02", "CLM03"],
    removed_claims: [],
    prohibited_claims_respected: [],
    unresolved_notes: [],
  };
}

console.log("=== Uji Tahap 4D: poles bahasa (Addendum C) ===");

console.log("\n[1] Parser SKRIFLOW_BAB1_POLISH_V1");
const p1 = parseBab1PolishTransfer(bungkus(hasilBersih()));
cek("parser menerima blok valid", p1.success === true, p1.error);
cek("parser mengisi data", !!p1.data);
cek("parser menghitung ulang word_count per paragraf", (p1.data?.background?.[0].word_count ?? 0) > 0);
cek("parser menyimpan language_changes", (p1.data?.language_changes || []).length === 2);
cek("parser menyimpan preserved_claim_ids", (p1.data?.preserved_claim_ids || []).length === 3);
cek("parser menolak teks kosong", parseBab1PolishTransfer("").success === false);
cek("parser menolak tanpa marker", parseBab1PolishTransfer("halo").success === false);
cek("parser menolak JSON rusak", parseBab1PolishTransfer("=== BEGIN SKRIFLOW_BAB1_POLISH_V1 ===\n{bukan json\n=== END SKRIFLOW_BAB1_POLISH_V1 ===").success === false);
cek("parser menolak schema_version salah", parseBab1PolishTransfer(bungkus({ ...hasilBersih(), schema_version: 2 })).success === false);
cek("parser menolak background kosong", parseBab1PolishTransfer(bungkus({ ...hasilBersih(), background: [] })).success === false);

console.log("\n[2] Pemeriksa 4D: hasil bersih");
const t1 = periksaPolesBab1(p1.data!, draf4C as never);
cek("hasil bersih tanpa CRITICAL", t1.filter((f) => f.severity === "CRITICAL").length === 0, t1.map((f) => f.code).join(","));
cek("hasil bersih tanpa MAJOR", t1.filter((f) => f.severity === "MAJOR").length === 0, t1.map((f) => f.code).join(","));

console.log("\n[3] Pemeriksa 4D: pelanggaran isi");
const hapus = hasilBersih();
hapus.background = hapus.background.slice(0, 2);
cek(
  "paragraf dihapus -> POLISH_PARAGRAPH_COUNT_CHANGED (CRITICAL)",
  periksaPolesBab1(hapus as never, draf4C as never).some((f) => f.code === "POLISH_PARAGRAPH_COUNT_CHANGED" && f.severity === "CRITICAL"),
);

const tukarId = hasilBersih();
tukarId.background[0].claim_ids = ["CLM09"];
cek(
  "claim_id diubah -> POLISH_CLAIM_IDS_CHANGED (CRITICAL)",
  periksaPolesBab1(tukarId as never, draf4C as never).some((f) => f.code === "POLISH_CLAIM_IDS_CHANGED" && f.severity === "CRITICAL"),
);

const tukarFungsi = hasilBersih();
tukarFungsi.background[0].function = "KNOWLEDGE_LIMIT_OR_GAP";
cek(
  "fungsi paragraf diubah -> POLISH_PARAGRAPH_ORDER_CHANGED (CRITICAL)",
  periksaPolesBab1(tukarFungsi as never, draf4C as never).some((f) => f.code === "POLISH_PARAGRAPH_ORDER_CHANGED" && f.severity === "CRITICAL"),
);

const angkaBaru = hasilBersih();
angkaBaru.background[0].paragraph_text += " Totalnya mencapai 45,7% dari premi.";
cek(
  "angka baru disisipkan -> POLISH_NEW_NUMBER (MAJOR)",
  periksaPolesBab1(angkaBaru as never, draf4C as never).some((f) => f.code === "POLISH_NEW_NUMBER" && f.severity === "MAJOR"),
);

const sitasiBaru = hasilBersih();
sitasiBaru.background[1].paragraph_text += " Hal ini sejalan dengan (Santoso, 2023).";
cek(
  "sitasi baru disisipkan -> POLISH_NEW_CITATION (MAJOR)",
  periksaPolesBab1(sitasiBaru as never, draf4C as never).some((f) => f.code === "POLISH_NEW_CITATION" && f.severity === "MAJOR"),
);

const absolutBaru = hasilBersih();
absolutBaru.background[1].paragraph_text += " Ini adalah penelitian pertama yang membahas topik tersebut.";
const temuanAbsolut = periksaPolesBab1(absolutBaru as never, draf4C as never);
cek(
  "frasa absolut baru -> POLISH_NEW_ABSOLUTE_PHRASE (MAJOR)",
  temuanAbsolut.some((f) => f.code === "POLISH_NEW_ABSOLUTE_PHRASE" && f.severity === "MAJOR"),
  temuanAbsolut.map((f) => f.code).join(","),
);

const takBerubah = hasilBersih();
takBerubah.background[0].paragraph_text = draf4C.background[0].paragraph_text;
cek(
  "paragraf tanpa perubahan -> POLISH_NO_CHANGES (MINOR)",
  periksaPolesBab1(takBerubah as never, draf4C as never).some((f) => f.code === "POLISH_NO_CHANGES" && f.severity === "MINOR"),
);

const melar = hasilBersih();
melar.background[0].paragraph_text = draf4C.background[0].paragraph_text + " " + Array.from({ length: 40 }, (_, i) => `tambahan${i}`).join(" ");
cek(
  "panjang melar >25% -> POLISH_WORD_DRIFT (MINOR)",
  periksaPolesBab1(melar as never, draf4C as never).some((f) => f.code === "POLISH_WORD_DRIFT" && f.severity === "MINOR"),
);

console.log("\n[4] Pemeriksa 4D tidak menyentuh ranah pemeriksa 4C");
const klaimTerlarangTapiTidakBaru = hasilBersih();
klaimTerlarangTapiTidakBaru.background[0].paragraph_text = draf4C.background[0].paragraph_text;
cek(
  "pemeriksa 4D tidak melaporkan kode milik pemeriksa 4C",
  periksaPolesBab1(klaimTerlarangTapiTidakBaru as never, draf4C as never).every((f) => f.code.startsWith("POLISH_")),
);

console.log("\n[5] Prompt 4D");
const prompt4D = assembleBedahPrompt4D({ prodi: "akuntansi", areaEksplorasi: "PSAK 117", draft: draf4C as never, foundation: fondasi });
cek("prompt 4D memuat penanda keluaran SKRIFLOW_BAB1_POLISH_V1", prompt4D.includes("SKRIFLOW_BAB1_POLISH_V1"));
cek("prompt 4D melarang menambah klaim", /JANGAN menambah klaim/i.test(prompt4D));
cek("prompt 4D melarang menambah angka/sitasi", /JANGAN menambah angka/i.test(prompt4D) && /sitasi baru/i.test(prompt4D));
cek("prompt 4D melarang menghapus klaim", /JANGAN menghapus klaim/i.test(prompt4D));
cek("prompt 4D mengunci claim_ids", /claim_ids WAJIB dipertahankan persis/i.test(prompt4D));
cek("prompt 4D memuat seluruh teks draf 4C", draf4C.background.every((p) => prompt4D.includes(p.paragraph_text)));
cek("prompt 4D memuat claim_ids tiap paragraf", prompt4D.includes("CLM02, CLM03"));
cek("prompt 4D memuat klaim terlarang dari fondasi", prompt4D.includes("Belum ada penelitian tentang pengungkapan PSAK 117"));
cek("prompt 4D mempertahankan larangan gap sintetis", /gap sintetis/i.test(prompt4D));
cek("prompt 4D mempertahankan aturan NEEDS_VERIFICATION", /NEEDS_VERIFICATION/.test(prompt4D));
cek("prompt 4D memuat aturan transparan 1000-1300", prompt4D.includes("1000–1300"));
cek("prompt 4D meminta language_changes", prompt4D.includes("language_changes"));
cek("prompt 4D mengizinkan arahan gaya mahasiswa", assembleBedahPrompt4D({ prodi: "a", areaEksplorasi: "b", draft: draf4C as never, foundation: fondasi, styleNote: "pakai bahasa santai dikit" }).includes("pakai bahasa santai dikit"));
cek("prompt 4D memuat status draf 4C sebagai acuan", prompt4D.includes("DRAFT_COMPLETE"));

console.log("\n[6] Sabuk ganda (Addendum C.6): 4D lewat, 4C yang menangkap");
// Pemeriksa 4D hanya tahu APA YANG BERUBAH. Pelanggaran batas bukti yang sudah
// ada sejak draf 4C harus tetap ditangkap oleh periksaDrafBab1 (Tahap 9).
const frasaTerlarang = "Belum ada yang meneliti di industri asuransi";
const fondasiTerlarang = {
  ...(fondasi as Record<string, unknown>),
  prohibited_claims: [frasaTerlarang],
} as never;

const lolos4D = hasilBersih();
lolos4D.background[1].paragraph_text += " " + frasaTerlarang + " secara khusus.";
const temuan4D = periksaPolesBab1(lolos4D as never, draf4C as never);
cek(
  "pemeriksa 4D tidak menangkap frasa terlarang (di luar wewenangnya)",
  !temuan4D.some((f) => f.severity === "CRITICAL"),
  temuan4D.map((f) => `${f.severity}:${f.code}`).join(","),
);

import { periksaDrafBab1 } from "./src/lib/bedahParser";
const temuan4C = periksaDrafBab1(lolos4D as never, fondasiTerlarang);
cek(
  "pemeriksa 4C menangkap pelanggaran yang lolos dari 4D",
  temuan4C.some((f) => f.code === "PROHIBITED_CLAIM_PHRASE"),
  temuan4C.map((f) => f.code).join(","),
);
cek(
  "temuan 4C pada hasil 4D berhasil dibaca (tipe cocok)",
  temuan4C.every((f) => typeof f.code === "string" && typeof f.severity === "string"),
);

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
