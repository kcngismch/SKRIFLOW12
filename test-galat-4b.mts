// Pengalaman Aul: "Prompt 4B ga lolos validasi skema, agak bingungin pengguna,
// gabisa lanjut uji karena 4Bnya salah terus."
// Yang diuji: pesan galat 4B menjelaskan MASALAHNYA dan menyebut LANGKAH, serta
// tidak lagi menawarkan perbaikan format untuk galat yang sebenarnya soal isi.
import { jelaskanGalat4B, judulGalat4B, sebabGalat4B } from "./src/lib/bab1ErrorHelp";

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

console.log("\n=== GALAT 4B DIJELASKAN KE MAHASISWA ===\n");

// Galat yang benar-benar dialami Aul
const gArah = "Arah pada hasil 4B (D01) berbeda dengan arah terpilih (A01).";
const j1 = jelaskanGalat4B(gArah);
cek("galat arah dikenali sebagai kelas 'arah', bukan 'format'", j1.kelas === "arah");
cek("menyebut kedua ID arah supaya mahasiswa tahu bedanya", /D01/.test(j1.artinya) && /A01/.test(j1.artinya));
cek("langkahnya menyuruh ganti ID, bukan perbaiki format", /Ganti selected_direction\.id/i.test(j1.langkah));
cek("langkah TIDAK menyebut format", !/format/i.test(j1.langkah));

// Galat struktur yang nyata
const gPeta = "background_map wajib memuat tepat 7–9 bagian narasi latar belakang (ditemukan: 5).";
const j2 = jelaskanGalat4B(gPeta);
cek("galat jumlah bagian peta dikenali sebagai struktur", j2.kelas === "struktur");
cek("menyebut angka yang ditemukan supaya tidak menebak", /5/.test(j2.artinya));
cek("langkahnya menyebut 7–9 bagian", /7–9/.test(j2.langkah));

const gKlaim = "Claim 'C03' pada background_map tidak ditemukan di evidence_ledger.";
const j3 = jelaskanGalat4B(gKlaim);
cek("klaim tanpa bukti dikenali sebagai kelas arah", j3.kelas === "arah");
cek("menyebut claim_id yang bermasalah", /C03/.test(j3.artinya));

// Galat format murni harus tetap bisa diperbaiki lewat jalur format
const gVersi = "schema_version wajib bernilai angka 1.";
cek("schema_version tetap kelas format", jelaskanGalat4B(gVersi).kelas === "format");

// Judul tidak boleh lagi berbunyi "validasi skema"
const judulArah = judulGalat4B([gArah]);
cek("judul untuk galat arah menyebut arah penelitian", /arah penelitian/i.test(judulArah));
cek("judul TIDAK menyebut 'validasi skema'", !/validasi skema/i.test(judulArah));
cek("judul menyebut jumlah saat galatnya banyak", /\d+/.test(judulGalat4B([gArah, gPeta, gKlaim])));

// Sebab: mahasiswa tidak boleh menyalahkan diri sendiri
const sebab = sebabGalat4B([gArah]);
cek("sebab menyatakan ini bukan kesalahan mahasiswa", /bukan salahmu/i.test(sebab));
cek("sebab menjelaskan kenapa sistem menolak", /menolak|tidak sejalan/i.test(sebab));

// Kelas campuran: arah + struktur harus tetap mengutamakan perbaikan isi
const judulCampur = judulGalat4B([gArah, gPeta]);
cek("campuran arah+struktur: judul menyebut jumlah", /\d+ hal/.test(judulCampur));

// Kasus tidak dikenal tidak boleh crash dan tetap memberi langkah
const jX = jelaskanGalat4B("Ada masalah yang belum pernah sistem lihat.");
cek("galat tak dikenal tetap punya artinya", jX.artinya.length > 10);
cek("galat tak dikenal tetap punya langkah", jX.langkah.length > 10);

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal\n`);
if (gagal > 0) process.exit(1);
