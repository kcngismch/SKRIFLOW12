// Paket Bukti Literatur (Tool 3) — deteksi sumber yang tidak bisa dipertanggungjawabkan.
//
// Latar: audit 16 Sep 2026 menemukan notebook berisi 21 sumber, tapi output Prompt B
// menulis "TOTAL NOTEBOOK 5", dan sumber INTI S1 penulisnya "Anonim / N.A." dengan
// tautan "-". Sumber itu ternyata Laporan Deep Research buatan NotebookLM sendiri.
// Prompt sudah melarangnya dua kali, tapi prompt bukan penegak.
import assert from "node:assert";
import {
  validateLiteratureEvidencePackage,
  auditSumberPaketLiteratur,
} from "./src/lib/bedahParser";

let lulus = 0;
function kasus(nama: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [LULUS] ${nama}`);
    lulus++;
  } catch (e) {
    console.error(`❌ [GAGAL] ${nama}`);
    console.error(e);
    process.exitCode = 1;
  }
}

// Bentuk asli register Tool 3: sel per baris dipisah TAB, bukan tabel pipe.
const REGISTER_TAB = `TOTAL NOTEBOOK
\t
21
\t
S1, S2, S3, S4, S5

2. SOURCE REGISTER
ID
\t
Kategori
\t
Judul
\t
Penulis-Tahun
\t
Jenis
\t
Publikasi
\t
Tautan/DOI
\t
S1
\t
INTI
\t
Analisis Ketimpangan Keterbukaan Laporan Keuangan
\t
Anonim / N.A.
\t
Makalah Konseptual
\t
Portal Digital Resmi
\t
-
\t
S2
\t
INTI
\t
DETERMINAN PUBLIKASI LAPORAN KEUANGAN
\t
Mya Dewi Trisnawati & Komarudin Achmad (2014)
\t
Empirical
\t
JAK
\t
-
\t
S3
\t
INTI
\t
The inefficacy of accrual
\t
Informa UK Limited (2022)
\t
Empirical
\t
TAF
\t
https://doi.org/10.1080/x
\t
3. MATRIKS BUKTI
ID
\t
Fungsi
\t
Klaim Netral
\t
ID Sumber
\t
Lokasi
\t
Konteks
\t
Batas Penggunaan
\t
B01
\t
Hubungan
\t
Penelitian melaporkan 68% KAP
\t
S2
\t
Halaman 45
\t
KAP menengah
\t
Sampel 2022
`;

const PAKET_BERSIH = `A. KONTEKS MAHASISWA
Prodi: Akuntansi

B. STATUS SUMBER
TOTAL NOTEBOOK: 2

C. SOURCE REGISTER
| ID | Kategori | Judul | Penulis | Jenis | Publikasi | Tautan |
| S1 | INTI | Audit Automation | Smith (2022) | Empirical | JAR | https://doi.org/10.2308/jar.2022.1 |
| S2 | INTI | AI in Accounting | Jones (2023) | Empirical | TAR | https://doi.org/10.2308/tar.2023.2 |

D. MATRIKS BUKTI
| ID | Fungsi | Klaim Netral | ID Sumber | Lokasi | Konteks | Batas Penggunaan |
| B01 | Hubungan | Penelitian melaporkan 68% KAP | S1 | Hal 45 | KAP menengah | Sampel 2022 |

E. PENUTUP
PAKET INI HANYA MEMETAKAN BUKTI. STOP.`;

kasus("S1 'Anonim / N.A.' terdeteksi sebagai sumber tanpa penulis", () => {
  const a = auditSumberPaketLiteratur(REGISTER_TAB);
  assert.deepStrictEqual(a.anonim, ["S1"], `dapat: ${JSON.stringify(a.anonim)}`);
});

kasus("TOTAL NOTEBOOK 21 terbaca, register terbaca 3 entri", () => {
  const a = auditSumberPaketLiteratur(REGISTER_TAB);
  assert.strictEqual(a.totalNotebook, 21);
  assert.strictEqual(a.registerCount, 3);
});

kasus("Ketidakcocokan jumlah sumber jadi peringatan di UI", () => {
  const v = validateLiteratureEvidencePackage(REGISTER_TAB);
  assert.ok(
    v.notes.some((n) => n.includes("TOTAL NOTEBOOK 21") && n.includes("hanya memuat 3 entri")),
    `catatan: ${JSON.stringify(v.notes)}`
  );
});

kasus("Sumber anonim menyalakan isResearchReport dan catatan tindakan", () => {
  const v = validateLiteratureEvidencePackage(REGISTER_TAB);
  assert.strictEqual(v.isResearchReport, true);
  assert.ok(v.notes.some((n) => n.includes("tanpa penulis yang jelas")));
});

kasus("Sumber tanpa URL/DOI dilaporkan (S1, S2 tanpa tautan)", () => {
  const a = auditSumberPaketLiteratur(REGISTER_TAB);
  assert.deepStrictEqual(a.tanpaTautan, ["S1", "S2"]);
});

kasus("Paket bersih tidak memunculkan temuan palsu", () => {
  const a = auditSumberPaketLiteratur(PAKET_BERSIH);
  assert.deepStrictEqual(a.anonim, []);
  assert.deepStrictEqual(a.tanpaTautan, []);
  assert.strictEqual(a.totalNotebook, 2);
  const v = validateLiteratureEvidencePackage(PAKET_BERSIH);
  assert.strictEqual(v.isResearchReport, false);
  assert.ok(!v.notes.some((n) => n.includes("TOTAL NOTEBOOK 2, tetapi")));
});

kasus("Paket bersih tetap STRUKTUR_LENGKAP (temuan tidak memblokir)", () => {
  const v = validateLiteratureEvidencePackage(REGISTER_TAB);
  assert.strictEqual(v.status, "STRUKTUR_LENGKAP");
});

kasus("Input kosong/sampah tidak meledak", () => {
  assert.deepStrictEqual(auditSumberPaketLiteratur(""), {
    anonim: [],
    tanpaTautan: [],
    registerCount: 0,
  });
  assert.strictEqual(auditSumberPaketLiteratur("halo").registerCount, 0);
});

console.log(`\n=== PAKET BUKTI LITERATUR: ${lulus} LULUS, ${process.exitCode ? 1 : 0} GAGAL ===`);
if (process.exitCode) process.exit(1);
