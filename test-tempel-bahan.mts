/**
 * Self-check modul tempelBahan. Jalankan: npx tsx test-tempel-bahan.mts
 * Non-trivial: pemecahan paragraf + pencocokan sitasi. Wajib ada test.
 */
import { pecahTeksTempel, periksaTempelan } from "./src/lib/tempelBahan";

const j = (n: number, ok: boolean, pesan: string) => {
  console.log(ok ? `  OK   ${n}. ${pesan}` : `  GAGAL ${n}. ${pesan}`);
  if (!ok) process.exitCode = 1;
};

const reg = [
  { sourceId: "S1", authorsYear: "Wibowo (2020)" },
  { sourceId: "S2", authorsYear: "Nurhayati (2021)" },
  { sourceId: "S3", authorsYear: "Santoso & Rahayu (2019)" },
];

console.log("[1] Pemecahan teks");
const p = pecahTeksTempel("Kalimat satu. Kalimat dua.\n\nParagraf dua di sini.");
j(1, p.length === 2, `dua paragraf terbaca (dapat ${p.length})`);
j(2, p[0].length === 2, `paragraf pertama 2 kalimat (dapat ${p[0]?.length})`);
j(3, pecahTeksTempel("").length === 0, "teks kosong tidak menghasilkan paragraf");

console.log("\n[2] Draf sehat — semua sitasi cocok");
const sehat = periksaTempelan(
  "Praktik diplomasi ekonomi meningkat (Wibowo, 2020). Studi lain menemukan pola serupa (Nurhayati, 2021).\n\n" +
    "Namun kedua studi berbeda kesimpulan (Santoso & Rahayu, 2019).",
  reg
);
j(4, sehat.ringkas.sumberTidakDikenal === 0, "tidak ada sitasi asing");
j(5, sehat.ringkas.punyaSitasi >= 3, `sitasi cocok terdeteksi (dapat ${sehat.ringkas.punyaSitasi})`);
j(6, sehat.layakLanjut === true, "layak lanjut = true");

console.log("\n[3] Draf berisi sitasi karangan — harus tertangkap");
const nakal = periksaTempelan(
  "Praktik ini meluas (Wibowo, 2020). Teori X terbukti (Slamet, 2015) dan (Purnomo, 2022).",
  reg
);
j(7, nakal.ringkas.sumberTidakDikenal === 2, `2 sitasi asing tertangkap (dapat ${nakal.ringkas.sumberTidakDikenal})`);
j(8, nakal.layakLanjut === false, "tidak layak lanjut selama ada sitasi asing");
j(9, nakal.pesanPenghadang.some((s) => /tidak ada di register/i.test(s)), "ada pesan penghadang");

console.log("\n[4] Kalimat penghubung tanpa sitasi TIDAK menghadang");
const konektor = periksaTempelan(
  "Praktik diplomasi ekonomi meningkat (Wibowo, 2020). Oleh karena itu, penelitian ini perlu menelusuri lebih dalam.",
  reg
);
j(10, konektor.ringkas.tanpaSitasi === 1, `1 kalimat tanpa sitasi (dapat ${konektor.ringkas.tanpaSitasi})`);
j(11, konektor.layakLanjut === true, "tetap layak lanjut — tidak memaksa mengarang sitasi");

console.log("\n[5] Register kosong — harus menghadang dengan pesan jelas");
const tanpaReg = periksaTempelan("Sesuatu (Wibowo, 2020).", []);
j(12, tanpaReg.layakLanjut === false, "layak lanjut = false");
j(13, tanpaReg.pesanPenghadang.some((s) => /register Tool 3/i.test(s)), "pesan menyebut register Tool 3");

console.log("\n[6] Bentuk sitasi berbeda-beda tetap dikenali");
const variasi = periksaTempelan(
  "Menurut Wibowo 2020 hal ini nyata. Senada dengan Nurhayati (2021). Dan juga Wibowo, 2020.",
  reg
);
j(14, variasi.ringkas.sumberTidakDikenal === 0, "semua bentuk sitasi dikenali, tidak ada alarm palsu");

console.log("\n[7] Bahan pendek — peringatan tapi tidak menghadang");
const pendek = periksaTempelan("Fenomena ini penting (Wibowo, 2020).", reg);
j(15, pendek.layakLanjut === true, "tetap boleh lanjut walau pendek");
j(16, pendek.pesanPenghadang.some((s) => /kata/i.test(s)), "ada catatan jumlah kata");

console.log("\n[8] Penulis KEDUA juga dikenali (dulu selalu dianggap sumber asing)");
const regBanyak = [
  { sourceId: "S1", authorsYear: "Shintia Ramadani & Sofia Trisni (2019)" },
  { sourceId: "S2", authorsYear: "Rahul Mishra (2017)" },
  { sourceId: "S3", authorsYear: "Sofia Anggraini (2019)" },
];
const penulisKedua = periksaTempelan(
  "Kebijakan itu berubah arah (Ramadani, 2019). Kajian lain menegaskan hal serupa (Mishra, 2017).",
  regBanyak
);
// "Ramadani" adalah penulis PERTAMA di sini; yang diuji: nama tengah/akhir juga sah.
const namaAkhir = periksaTempelan("Analisis mendalam (Trisni, 2019).", regBanyak);
j(17, penulisKedua.ringkas.sumberTidakDikenal === 0, "dua sumber berbeda dikenali, tidak ada alarm palsu");
j(18, namaAkhir.ringkas.sumberTidakDikenal === 0, "penulis kedua 'Trisni' dari daftar yang sama dikenali");

console.log("\n[9] Tahun tetap mengikat (nama sama, tahun beda)");
const tahunSalah = periksaTempelan("Kajian itu keliru tahunnya (Trisni, 2015).", regBanyak);
j(19, tahunSalah.ringkas.sumberTidakDikenal === 1, "tahun yang tidak ada di register tetap ditandai");
// "Sofia" ada di dua entri: 2019 (Trisni) dan 2019 (Anggraini) -> keduanya sah
const sofia = periksaTempelan("Pendapat berbeda disampaikan (Sofia, 2019).", regBanyak);
j(20, sofia.ringkas.sumberTidakDikenal === 0, "nama depan yang sah pada tahun yang benar diterima");

console.log(
  `\nRINGKASAN: 20 lulus, ${process.exitCode ? "ADA GAGAL" : "0 gagal"}`
);
