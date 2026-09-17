
import { assembleLiteraturePromptA } from "./src/lib/promptAssembler";
import { NOTEBOOKLM_LIMITS } from "./src/config/promptLimits";
const p = (n: number) => "a".repeat(n);

// Cari titik di mana pemadatan bertingkat benar-benar menurunkan plafon bertahap
let lulus = 0, gagal = 0;
const cek = (n: string, k: boolean, d?: string) => { if (k) { lulus++; console.log("  OK   " + n); } else { gagal++; console.log("  GAGAL " + n + (d ? " :: " + d : "")); } };

console.log("[1] Kasus terburuk yang tadinya BLOCKED sekarang muat");
const worst = { prodi:p(100), area:p(350), fenomena:p(800), prioritas_sumber:"NotebookLM prioritas utama", rentang_publikasi:p(100), kata_kunci:p(200), fokus_literatur:p(800), hal_belum_ditentukan:p(800) };
const r = assembleLiteraturePromptA(worst);
cek("isValid true (tombol Salin tidak mati lagi)", r.isValid);
cek("panjang <= 3900", r.totalLength <= NOTEBOOKLM_LIMITS.hardLimit, String(r.totalLength));

console.log("");
console.log("[2] Fenomena (konteks inti) TIDAK PERNAH dipotong");
cek("fenomena 800 char tetap utuh di prompt", r.phenomenonPreserved);
cek("teks fenomena muncul lengkap", r.prompt.includes("a".repeat(800)));
const r2 = assembleLiteraturePromptA({ prodi:"Akuntansi", area:"X", fenomena:p(800) });
cek("kasus fenomena saja: tetap utuh", r2.phenomenonPreserved);

console.log("");
console.log("[3] Yang dipadatkan hanya konteks opsional, bukan konteks inti");
cek("field inti (prodi/area/fenomena) tidak masuk daftar dipadatkan",
  !(r.compactedFields as string[]).includes("prodi") && !(r.compactedFields as string[]).includes("area") && !(r.compactedFields as string[]).includes("fenomena"));
cek("field opsional yang dipadatkan dilaporkan ke mahasiswa", r.compactedFields.length > 0, JSON.stringify(r.compactedFields));
cek("hanya field opsional yang dilaporkan",
  r.compactedFields.every(f => ["prioritas_sumber","rentang_publikasi","kata_kunci","fokus_literatur","hal_belum_ditentukan"].includes(f)));

console.log("");
console.log("[4] Kalau masih muat, JANGAN dipadatkan (jangan buang konteks mahasiswa)");
const longgar = assembleLiteraturePromptA({ prodi:"Akuntansi", area:"Pelaporan asuransi", fenomena:"PSAK 117", fokus_literatur:"Pengungkapan transisi PSAK 117 pada emiten asuransi terdaftar di BEI" });
cek("fokus literatur pendek tidak dipadatkan", longgar.compactedFields.length === 0, JSON.stringify(longgar.compactedFields));
cek("fokus literatur muncul utuh di prompt", longgar.prompt.includes("Pengungkapan transisi PSAK 117 pada emiten asuransi terdaftar di BEI"));

console.log("");
console.log("[5] Bertingkat: plafon paling longgar yang dipakai");
// 5 field x 800 char = 4000 char opsional. Anggaran sekitar 1200 -> plafon harus turun.
const berat = assembleLiteraturePromptA({ prodi:"A", area:"B", fenomena:"C",
  prioritas_sumber:"NotebookLM prioritas utama", rentang_publikasi:p(100), kata_kunci:p(200), fokus_literatur:p(800), hal_belum_ditentukan:p(800) });
cek("kasus berat tetap muat", berat.isValid, String(berat.totalLength));
const panjangOpsional = berat.breakdown.optionalContext;
cek("konteks opsional benar-benar dipangkas (bukan dibuang semua)", panjangOpsional > 0, "opsional=" + panjangOpsional);

console.log("");
console.log("[6] Prompt tetap bisa dipakai: struktur wajib utuh");
cek("instruksi utama ada", r.prompt.includes("Cari 15-25 artikel akademik individual"));
cek("8 sensor utuh", (r.prompt.match(/^\d\./gm) || []).length === 8, String((r.prompt.match(/^\d\./gm) || []).length));
cek("larangan sintesis/gap/novelty masih ada", r.prompt.includes("Dilarang membuat sintesis, gap, novelty"));
cek("instruksi Source Import Cards masih ada", r.prompt.includes("Source Import Cards native"));

console.log("");
console.log("[7] Kasus kosong & normal tidak berubah perilakunya");
const kosong = assembleLiteraturePromptA({});
cek("kosong: muat", kosong.isValid);
cek("kosong: tidak ada yang dipadatkan", kosong.compactedFields.length === 0);
const normal = assembleLiteraturePromptA({ prodi:"Akuntansi", area:"Pelaporan keuangan asuransi", fenomena:"Penerapan PSAK 117 sejak 2025 mengubah penyajian laporan keuangan asuransi.", prioritas_sumber:"NotebookLM prioritas utama", rentang_publikasi:"2019-2025", kata_kunci:"PSAK 117, asuransi", fokus_literatur:"Pengungkapan transisi", hal_belum_ditentukan:"Sampel" });
cek("normal: muat", normal.isValid);
cek("normal: isi tetap utuh tanpa pemadatan", normal.prompt.includes("Pengungkapan transisi") && normal.prompt.includes("2019-2025"));

console.log("");
console.log("RINGKASAN: " + lulus + " lulus, " + gagal + " gagal");
if (gagal > 0) process.exit(1);
