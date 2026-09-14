// 07 tingkat A: pastikan arahan dosen pembimbing benar-benar masuk ke prompt.
// Yang diuji: arahan yang diketik mahasiswa muncul apa adanya di 6A dan 6B,
// tidak ditafsirkan ulang, dan tidak muncul saat kosong.
// Jalankan: npx tsx test-arahan-dosen.mts
import {
  assembleBab2FoundationPrompt,
  assembleBab2DraftSourceFile,
} from "./src/lib/bab2Prompts";
import type { Bab2PromptInput } from "./src/lib/bab2Prompts";

let lulus = 0;
let gagal = 0;
function cek(nama: string, syarat: boolean) {
  if (syarat) {
    lulus++;
    console.log(`  OK   ${lulus}. ${nama}`);
  } else {
    gagal++;
    console.log(`  FAIL ${nama}`);
  }
}

const ARAHAN_NYATA =
  "Dosen minta fokus ke satu provinsi saja, dan minta teori kelembagaan dipakai di Bab 2.";

const dasar: Bab2PromptInput = {
  prodi: "Hubungan Internasional",
  areaEksplorasi: "Kerja sama maritim",
  pendekatan: "KUALITATIF" as never,
  peta: { prior_research_table: [] } as never,
  register: [],
  arahanDosen: ARAHAN_NYATA,
};

console.log("\n=== 07 TINGKAT A: ARAHAN DOSEN MASUK PROMPT ===\n");

const prompt6A = assembleBab2FoundationPrompt(dasar);
cek("6A memuat arahan dosen apa adanya", prompt6A.includes(ARAHAN_NYATA));
// Catatan: /WAJIB DIPATUHI/ saja TIDAK cukup — judul bagian lama
// "# ATURAN MENULIS — WAJIB DIPATUHI" juga cocok. Pakai penanda yang hanya
// ada di blok arahan dosen.
const PENANDA = "jangan ditafsirkan ulang";
cek("6A menandai arahan sebagai wajib dipatuhi", prompt6A.includes(PENANDA));
cek("6A tidak menerjemahkan isi arahan", !/provinsi saja.*provinsi saja.*provinsi saja/is.test(prompt6A));

const prompt6B = assembleBab2DraftSourceFile(dasar);
cek("6B memuat arahan dosen apa adanya", prompt6B.includes(ARAHAN_NYATA));
cek("6B menaruh arahan di blok KONTEKS MAHASISWA", /KONTEKS MAHASISWA[\s\S]*teori kelembagaan/.test(prompt6B));
cek("6B tetap memuat larangan sintesis gap", /gap sintetis/i.test(prompt6B));

// Kosong = jujur bilang belum ada, bukan menghapus baris
const kosong = assembleBab2FoundationPrompt({
  ...dasar,
  arahanDosen: "",
});
cek("tanpa arahan: 6A bilang belum ada", /Arahan dosen pembimbing: belum ada/.test(kosong));
const kosong2 = assembleBab2DraftSourceFile({ ...dasar, arahanDosen: "   " });
cek("arahan kosong-spasi diperlakukan belum ada", /Arahan dosen pembimbing: belum ada/.test(kosong2));

// Arahan panjang multi-baris harus utuh, tidak terpotong
const panjang = ["Baris satu: persempit topik.", "Baris dua: jangan pakai teori X.", "Baris tiga: tambah data BPS."].join(
  "\n"
);
const promptPanjang = assembleBab2DraftSourceFile({ ...dasar, arahanDosen: panjang });
cek("arahan multi-baris utuh", promptPanjang.includes("Baris satu") && promptPanjang.includes("Baris tiga"));

// Batas aman: arahan tidak boleh mengubah daftar sumber yang sah
cek("6B tetap menyatakan daftar sumber sebagai satu-satunya yang sah", /SATU-SATUNYA sumber yang sah/i.test(prompt6B));
cek("6B tetap melarang sumber di luar daftar", /DILARANG memakai sumber di luar daftar/i.test(prompt6B));
const p6bKosong = assembleBab2DraftSourceFile({ ...dasar, arahanDosen: "" });
cek("tanpa arahan: 6B bilang belum ada, bukan menyalin penanda", !p6bKosong.includes(PENANDA));
const p6aKosong = assembleBab2FoundationPrompt({ ...dasar, arahanDosen: "" });
cek("tanpa arahan: 6A bilang belum ada, bukan menyalin penanda", !p6aKosong.includes(PENANDA));

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal\n`);
if (gagal > 0) process.exit(1);
