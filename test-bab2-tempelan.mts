/**
 * Self-check modul bab2Tempelan. Jalankan: npx tsx test-bab2-tempelan.mts
 *
 * Non-trivial: pemecahan paragraf + status draf. Wajib ada test.
 * Yang dijaga test ini: tulisan mahasiswa TIDAK diubah, dan statusnya TIDAK
 * dinaikkan jadi DRAFT_COMPLETE (itu sama dengan mengklaim verifikasi yang
 * belum dilakukan Skriflow).
 */
import { susunDrafBab2DariTempelan } from "./src/lib/bab2Tempelan";

const j = (n: number, ok: boolean, pesan: string) => {
  console.log(ok ? `  OK   ${n}. ${pesan}` : `  GAGAL ${n}. ${pesan}`);
  if (!ok) process.exitCode = 1;
};

const reg = [
  { sourceId: "S1", authorsYear: "Wibowo (2020)" },
  { sourceId: "S2", authorsYear: "Nurhayati (2021)" },
];

const teks = [
  "Praktik diplomasi ekonomi ASEAN meningkat sejak 2015 (Wibowo, 2020).",
  "",
  "Studi lain menemukan pola serupa di Filipina (Nurhayati, 2021). Namun kedua studi berbeda kesimpulan.",
].join("\n");

console.log("[1] Pemecahan paragraf");
const d = susunDrafBab2DariTempelan(teks, reg, { fondasiBab1Ada: true });
j(1, d !== null, "teks berisi menghasilkan draf (tidak null)");
j(2, d?.background.length === 2, `dua paragraf terbaca (dapat ${d?.background.length})`);
j(3, d?.background[0].order === 1 && d?.background[1].order === 2, "urutan paragraf terjaga");
j(4, d?.background[0].sub_bab !== d?.background[1].sub_bab, "tiap paragraf dapat sub-bab berbeda");

console.log("\n[2] Tulisan mahasiswa tidak diubah");
j(
  5,
  d?.background[0].paragraph_text === "Praktik diplomasi ekonomi ASEAN meningkat sejak 2015 (Wibowo, 2020).",
  "paragraf pertama sama persis dengan yang ditempel"
);
j(
  6,
  d?.background[1].paragraph_text ===
    "Studi lain menemukan pola serupa di Filipina (Nurhayati, 2021). Namun kedua studi berbeda kesimpulan.",
  "paragraf kedua sama persis (kalimat tetap utuh, tidak dipecah)"
);

console.log("\n[3] Batas bukti tetap ditegakkan");
j(7, d?.draft_status === "DRAFT_PARTIAL", `status DRAFT_PARTIAL, bukan COMPLETE (dapat ${d?.draft_status})`);
j(8, (d?.background ?? []).every((p) => p.claim_ids.length === 0), "klaim per paragraf KOSONG (belum diverifikasi Skriflow)");
j(9, d?.used_claim_ids.length === 0, "used_claim_ids kosong");
j(10, d?.new_sources_introduced.length === 0, "tidak mengklaim ada sumber baru");
j(11, d?.used_source_ids.join(",") === "S1,S2", `sumber dari register tercatat (dapat ${d?.used_source_ids.join(",")})`);

console.log("\n[4] Hitungan & catatan");
j(12, (d?.word_count_total ?? 0) > 15, `jumlah kata terhitung (dapat ${d?.word_count_total})`);
j(13, (d?.consistency_notes ?? []).some((n) => /tidak diubah/i.test(n)), "catatan menyebut tulisan tidak diubah");
j(14, (d?.unresolved_notes ?? []).some((n) => /klaim/i.test(n)), "catatan mengingatkan klaim belum dipetakan");

console.log("\n[5] Kasus tepi");
j(15, susunDrafBab2DariTempelan("", reg) === null, "teks kosong menghasilkan null");
j(16, susunDrafBab2DariTempelan("   \n\n  \n", reg) === null, "teks tanpa isi menghasilkan null");
const tanpaFondasi = susunDrafBab2DariTempelan(teks, reg);
j(
  17,
  tanpaFondasi?.foundation_status_ref === "BAB1_TANPA_FONDASI",
  `tanpa fondasi Bab 1 ditandai jujur (dapat ${tanpaFondasi?.foundation_status_ref})`
);
const tanpaRegister = susunDrafBab2DariTempelan(teks, []);
j(18, tanpaRegister?.background.length === 2, "register kosong tetap bisa menyusun draf");
j(19, tanpaRegister?.used_source_ids.length === 0, "register kosong -> daftar sumber kosong, bukan dikarang");
