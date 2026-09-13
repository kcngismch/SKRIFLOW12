/**
 * Cek regresi BERBASIS DATA ASLI: draf 4C hasil NotebookLM (akun asli mahasiswa HI)
 * harus diterima, bersitasi nama penulis asli, dan lolos tanpa alarm palsu.
 *
 * Berkas di `fixtures/` adalah artefak nyata dari uji end-to-end 13 Sep 2026:
 * - `fondasi-4b-asli.txt`     : output 4B mahasiswa (paket fondasi Bab 1)
 * - `register-t3-asli.txt`    : register Tool 3 (11 sumber, semua berpenulis)
 * - `draf-4c-berpenulis.txt`  : draf 4C dari NotebookLM SETELAH perbaikan jalur sitasi
 *
 * Yang dikunci:
 * 1) Parser menerima blok draf 4C utuh (7 paragraf, ~1.100 kata).
 * 2) Sitasi berbasis NAMA (bukan ID mentah `S4`/`Bukti 1`) — inti perbaikan.
 * 3) Pemeriksa TIDAK menandai sitasi sah sebagai karangan (pernah 7 alarm palsu).
 * 4) Nama di draf benar-benar ada di register (bukan karangan AI).
 *
 * Jalankan: npx tsx test-draf-4c-asli.mts
 */
import { readFileSync } from "node:fs";
import {
  parseBab1DraftTransfer,
  periksaDrafBab1,
  extractSumberPaketLiteratur,
} from "./src/lib/bedahParser";

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

const mentah = readFileSync("fixtures/draf-4c-berpenulis.txt", "utf8");
const raw4b = readFileSync("fixtures/fondasi-4b-asli.txt", "utf8");
const B = "=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===";
const E = "=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===";
const foundation = JSON.parse(raw4b.slice(raw4b.indexOf(B) + B.length, raw4b.indexOf(E)).trim());
const register = extractSumberPaketLiteratur(readFileSync("fixtures/register-t3-asli.txt", "utf8"));

console.log("\n[1] Parser menerima draf nyata");
const res = parseBab1DraftTransfer(mentah, { foundation });
cek("parse sukses", res.success === true, res.error || "");
if (!res.success) {
  console.log("\nRINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
  process.exit(1);
}
const d = res.data!;
cek("7 paragraf", d.background.length === 7, String(d.background.length));
const prosa = d.background.map((p) => p.paragraph_text || "").join(" ");
const kata = prosa.split(/\s+/).length;
cek("panjang 1000-1300 kata", kata >= 1000 && kata <= 1300, String(kata));

console.log("\n[2] Sitasi berbasis NAMA, bukan ID sumber");
const idMentah = (prosa.match(/\(\s*(?:S|Bukti)\s*\d+\s*\)/g) || []).length;
const namaTahun = [...new Set(prosa.match(/\([A-Z][^()]{2,70}?,\s*(?:19|20)\d\d[a-z]?\)/g) || [])];
cek("tidak ada ID mentah (S4 / Bukti 1)", idMentah === 0, "ditemukan " + idMentah);
cek("ada sitasi nama-tahun", namaTahun.length >= 4, String(namaTahun.length));

console.log("\n[3] Pemeriksa tidak memberi alarm palsu");
const temuan = periksaDrafBab1(d, foundation, register);
const kritis = temuan.filter((f) => f.severity === "CRITICAL");
const palsu = temuan.filter((f) => f.code === "CITATION_UNKNOWN_SOURCE");
cek("nol temuan kritis", kritis.length === 0, kritis.map((f) => f.code).join(","));
cek("nol CITATION_UNKNOWN_SOURCE (pernah 7)", palsu.length === 0,
  palsu.map((f) => (f.message || "").slice(0, 70)).join(" | "));

console.log("\n[4] Semua nama di draf benar-benar ada di sumber yang dikenal");
// Dua himpunan sah: register Tool 3 (artikel) DAN sumber di paragraph_claims fondasi
// (termasuk dokumen pemerintah seperti "Pemerintah Filipina").
const namaSah = new Set<string>();
register.forEach((s) => {
  const n = (s.authorsYear || "").replace(/\s*\(\d{4}[a-z]?\)\s*$/, "").trim().toLowerCase();
  if (n) namaSah.add(n);
});
type KlaimFondasi = { sourceReferences?: { authorsYear?: string }[] };
(foundation.paragraph_claims as KlaimFondasi[] || []).forEach((pc) =>
  (pc.sourceReferences || []).forEach((r) => {
    const n = (r?.authorsYear || "").replace(/\s*,?\s*\d{4}[a-z]?$/, "").trim().toLowerCase();
    if (n && !n.startsWith("[")) namaSah.add(n);
  })
);
const namaDiDraf = namaTahun.map((s) => s.slice(1, -1).split(",")[0].trim());
cek("register terbaca (" + register.length + " sumber)", register.length >= 8, String(register.length));
cek("himpunan nama sah terisi (" + namaSah.size + ")", namaSah.size >= 8, String(namaSah.size));
const takDikenal = [...new Set(namaDiDraf)].filter((n) => {
  const inti = n.replace(/\s*et al\.?$/, "").toLowerCase();
  return ![...namaSah].some((s) => s.includes(inti) || inti.includes(s));
});
cek("semua nama dikenal", takDikenal.length === 0, takDikenal.join(" | "));

console.log("\nRINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
process.exit(gagal === 0 ? 0 : 1);
