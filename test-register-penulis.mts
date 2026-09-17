/**
 * Cek: register Tool 3 (bentuk TAB, salinan NotebookLM) terparse dan nama penulis
 * mengalir sampai ke daftar pustaka .bib.
 *
 * Cacat yang dicegah: parser hanya mengenal tabel pipe markdown, sedangkan output
 * nyata NotebookLM memakai TAB — hasilnya 0 sumber, .bib keluar tanpa satu pun
 * field `author`, dan mahasiswa mengimpor daftar pustaka kosong ke Mendeley.
 *
 * Jalankan: npx tsx test-register-penulis.mts
 */
import { readFileSync } from "node:fs";
import { extractSumberPaketLiteratur } from "./src/lib/bedahParser";
import { keBibtex, pisahPenulisTahun } from "./src/lib/ekspor";

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

// Fixture bentuk TAB: persis pola yang keluar dari salinan NotebookLM,
// termasuk sampah antarmuka ("2", "more_horiz", ".") di antara entri.
const TAB = [
  "1. REKONSILIASI SUMBER",
  "INTI + PENDUKUNG = TOTAL",
  "",
  "2. SOURCE REGISTER",
  "ID", "\t", "Kategori", "\t", "Judul Artikel", "\t", "Penulis & Tahun", "\t",
  "Jenis Publikasi", "\t", "Nama Publikasi / Penerbit", "\t", "Tautan / DOI", "\t",
  "Metode & Sampel", "\t", "Bukti Keterbacaan", "",
  "",
  "S3", "\t", "INTI", "\t", "The Evolution of the Philippines Policy Towards Taiwan Since 2016", "\t",
  "Yue Chen & Kan Wang (2024)", "\t", "Jurnal Peer-Reviewed", "\t",
  "Asian Journal of Social Science Studies, Vol. 9, No. 3", "\t",
  "https://doi.org/10.20849/ajsss.v9i3.1455", "\t", "Kualitatif komparatif", "\t", "Teks utuh terakses",
  "2", "more_horiz", ".",
  "",
  "S4", "\t", "INTI", "\t", "Respon ASEAN atas Keterlibatan Amerika Serikat di Laut China Selatan", "\t",
  "Desy Nur Shafitri, Ira Patriani, Hardi Alunaza SD (2024)", "\t", "Jurnal Peer-Reviewed", "\t",
  "Politika: Jurnal Ilmu Politik (UNDIP)", "\t", "https://doi.org/10.14710/politika.15.1.2024.1", "\t",
  "Kualitatif", "\t", "Teks utuh terakses",
  "",
  "3. MATRIKS BUKTI",
  "ID", "\t", "Fungsi / Sub-topik", "\t", "Klaim Netral", "\t", "ID Sumber & Sitasi", "\t",
  "Lokasi Pasase / Bab", "\t", "Konteks Tematik", "\t", "Batas Penggunaan", "",
  "",
  "B1", "\t", "Orientasi Kebijakan", "\t", "Studi mencatat bahwa pemerintahan adopsi prinsip", "15", "16", ".", "\t",
  "S10", "\t", "Hlm. 5 & 10 / Section Interpreting", "\t", "Menjelaskan pergeseran orientasi", "\t",
  "Terbatas pada analisis kebijakan luar negeri.",
].join("\n");

// Bentuk pipe markdown harus TETAP jalan (jangan merusak yang sudah ada).
const PIPE = [
  "SOURCE REGISTER",
  "| ID | Kategori | Judul Artikel | Penulis & Tahun | Jenis Publikasi | Publikasi | Tautan/DOI |",
  "|----|----|----|----|----|----|----|",
  "| S7 | INTI | Kebijakan Maritim Filipina | Budi Santoso (2023) | Jurnal | Jurnal HI | https://doi.org/10.1/x |",
].join("\n");

console.log("\n[1] Bentuk TAB (salinan NotebookLM) — dulu 0 sumber");
const tab = extractSumberPaketLiteratur(TAB);
cek("sumber terparse (bukan 0)", tab.length >= 2, String(tab.length));
cek("ID benar (S3, S4)", tab.map((s) => s.sourceId).join(",") === "S3,S4", tab.map((s) => s.sourceId).join(","));
cek("judul terambil", (tab[0]?.title || "").includes("Philippines Policy Towards Taiwan"), tab[0]?.title);
cek("nama penulis terambil", tab[0]?.authorsYear === "Yue Chen & Kan Wang (2024)", tab[0]?.authorsYear);
cek("penulis entri kedua terambil", tab[1]?.authorsYear === "Desy Nur Shafitri, Ira Patriani, Hardi Alunaza SD (2024)", tab[1]?.authorsYear);
cek("penerbit terambil", (tab[0]?.publication || "").includes("Asian Journal of Social Science"), tab[0]?.publication);
cek("DOI terambil", (tab[0]?.doi || "").includes("10.20849"), tab[0]?.doi);
cek("berhenti di bagian berikutnya (tidak makan MATRIKS BUKTI)", tab.length === 2, String(tab.length));
cek("sampah antarmuka tidak jadi sumber", !tab.some((s) => /more_horiz|^2$/.test(s.sourceId)));
console.log("\n[2] Bentuk pipe markdown tetap jalan (tidak ada regresi)");
const pipe = extractSumberPaketLiteratur(PIPE);
cek("sumber terparse", pipe.length === 1, String(pipe.length));
cek("ID + judul benar", pipe[0]?.sourceId === "S7" && (pipe[0]?.title || "").includes("Kebijakan Maritim"), JSON.stringify(pipe[0]));
cek("penulis ikut terambil di bentuk pipe", pipe[0]?.authorsYear === "Budi Santoso (2023)", pipe[0]?.authorsYear);

console.log("\n[3] Daftar pustaka .bib memuat author");
const bib = keBibtex(
  tab.map((s) => ({
    sourceId: s.sourceId,
    title: s.title,
    ...pisahPenulisTahun(s.authorsYear),
    journal: s.publication,
    doi: s.doi,
    url: s.url,
  }))
);
cek("bib memuat field author", /author = \{/.test(bib));
cek("bib memuat nama penulis nyata", bib.includes("Yue Chen & Kan Wang"));
cek("tahun DIPISAH ke field year, bukan menempel di author", /year = \{2024\}/.test(bib) && !/author = \{[^}]*\(20\d\d\)/.test(bib),
  (bib.match(/author = \{[^}]*\}/) || [""])[0]);
cek("bib memuat kunci unik berbasis nama", /@(article|misc)\{Yue/.test(bib), bib.split("\n").find((l) => l.startsWith("@")));
cek("bib TIDAK punya author kosong", !/author = \{\s*\}/.test(bib));

console.log("\n[4] Berkas register nyata (bila tersedia di disk)");
try {
  const nyata = readFileSync("/tmp/uji-hi/lit-asli.txt", "utf8");
  const s = extractSumberPaketLiteratur(nyata);
  cek("register mahasiswa nyata terparse", s.length === 11, `${s.length} sumber`);
  cek("SEMUA membawa nama penulis", s.filter((x) => x.authorsYear).length === s.length,
    `${s.filter((x) => x.authorsYear).length}/${s.length} berpenulis`);
  cek("ID unik (tidak ada entri MATRIKS BUKTI menyusup)", new Set(s.map((x) => x.sourceId)).size === s.length,
    s.map((x) => x.sourceId).join(","));
  cek("judul tidak berupa nomor halaman", !s.some((x) => /^\d+$/.test((x.title || "").trim())),
    s.map((x) => x.title).filter((x) => /^\d+$/.test((x || "").trim())).join(","));
  cek("penulis tidak berupa teks lokasi", !s.some((x) => /^Hlm\./.test((x.authorsYear || "").trim())));
} catch {
  console.log("  (dilewati — /tmp/uji-hi/lit-asli.txt tidak ada)");
}

console.log("\nRINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
if (gagal > 0) process.exit(1);
