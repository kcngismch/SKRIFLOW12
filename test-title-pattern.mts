/**
 * Uji pola judul Tool 4 (src/lib/titlePattern.ts).
 *
 * Yang diuji bukan "kata-katanya bagus" (itu urusan mahasiswa & dosen), tapi
 * syarat yang bisa gagal secara diam-diam:
 *  - tidak ada placeholder tersisa di dalam slot
 *  - tiap arah menghasilkan pola berbeda
 *  - batas "bukan judul final" selalu ikut
 */
import assert from "node:assert/strict";
import { susunPolaJudul, BATAS_POLA } from "./src/lib/titlePattern";

let lulus = 0;
let gagal = 0;
function cek(nama: string, fn: () => void) {
  try {
    fn();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal++;
    console.log(`  ✗ ${nama}`);
    console.log(`     ${(e as Error).message}`);
  }
}

const scope = { objectOrPopulation: "Perusahaan asuransi", referencePeriod: "2024-2025" };

// Bentuk data arah asli dari output 4A (PSAK 117), diringkas ke field yang dipakai.
const D01 = {
  name: "Konsistensi pengungkapan dan penyajian PSAK 117",
  potential_constructs: ["Kelengkapan pengungkapan penerapan PSAK 117", "Konsistensi penyajian informasi transisi"],
  potential_objects: ["Perusahaan asuransi"],
  possible_design_families: ["Analisis isi kuantitatif", "Perbandingan dokumenter antarperiode"],
  measurement_focus: { primary_outcome: "Tingkat kelengkapan atau konsistensi pengungkapan PSAK 117" },
};
const D02 = {
  name: "Perubahan posisi keuangan setelah penerapan PSAK 117",
  potential_constructs: ["Perubahan posisi keuangan setelah transisi PSAK 117"],
  potential_objects: ["Perusahaan asuransi yang memiliki laporan komparatif 2024 dan 2025"],
  possible_design_families: ["Perbandingan sebelum dan sesudah", "Analisis perubahan deskriptif"],
  measurement_focus: { primary_outcome: "Perubahan ekuitas" },
};
const D03 = {
  name: "Perbedaan pola transisi antarjenis perusahaan asuransi",
  potential_constructs: ["Pola transisi PSAK 117"],
  potential_objects: ["Asuransi umum", "Asuransi jiwa"],
  possible_design_families: ["Analisis isi komparatif", "Perbandingan kelompok"],
  measurement_focus: { primary_outcome: "Perbedaan pola pengungkapan transisi PSAK 117" },
};

console.log("\n[1] Pola terbentuk dan tiap arah berbeda");
const p1 = susunPolaJudul(D01, scope);
const p2 = susunPolaJudul(D02, scope);
const p3 = susunPolaJudul(D03, scope);
cek("D01 menghasilkan pola", () => assert.ok(p1.pola.length > 10));
cek("D02 menghasilkan pola", () => assert.ok(p2.pola.length > 10));
cek("D03 menghasilkan pola", () => assert.ok(p3.pola.length > 10));
cek("pola D02 beda dari D01 (desain beda -> pola beda)", () => assert.notEqual(p1.pola, p2.pola));
cek("pola D03 beda dari D01", () => assert.notEqual(p1.pola, p3.pola));
cek("semua pola punya minimal satu placeholder", () =>
  [p1, p2, p3].forEach((p) => assert.ok(/\[[a-zA-Z]+\]/.test(p.pola))));

console.log("\n[2] Slot diisi, tidak ada placeholder tersisa");
cek("setiap placeholder di pola punya isian", () => {
  [p1, p2, p3].forEach((p) => {
    const slotDiPola = Array.from(p.pola.matchAll(/\[([a-zA-Z]+)\]/g)).map((m) => m[1]);
    slotDiPola.forEach((s) => {
      const found = p.slot_terisi.find((x) => x.slot === s);
      assert.ok(found, `slot [${s}] tidak ada di slot_terisi`);
      assert.ok(found!.nilai.trim().length > 0, `slot [${s}] kosong`);
    });
  });
});
cek("nilai slot bukan teks bertanda kurung", () =>
  [p1, p2, p3].forEach((p) => p.slot_terisi.forEach((s) => assert.ok(!/[\[\]]/.test(s.nilai), `nilai ${s.slot} masih bertanda kurung`))));
cek("tidak ada nested bracket [..[..]..]", () =>
  [p1, p2, p3].forEach((p) => assert.ok(!/\[[^\]]*\[/.test(p.pola), `pola rusak: ${p.pola}`)));

console.log("\n[3] Slot terisi dari data arah, bukan karangan");
cek("D02 memakai outcome 'perubahan ekuitas'", () => assert.equal(p2.slot_terisi.find((s) => s.slot === "outcome")!.nilai, "perubahan ekuitas"));
cek("D02: 'perubahan' tidak dobel di contoh judul", () =>
  assert.ok(!/perubahan\s+perubahan/i.test(p2.contoh_terisi), `dobel: ${p2.contoh_terisi}`));
cek("D02: [peristiwa] terisi dari nama arah, bukan plesetan", () =>
  assert.ok(p2.contoh_terisi.includes("penerapan PSAK 117"), `tidak ada peristiwa: ${p2.contoh_terisi}`));
cek("D01 dan D03 dapat pola berbeda (desain pertamanya beda)", () =>
  assert.notEqual(p1.pola, p3.pola));
cek("periode fenomena masuk ke contoh terisi", () => assert.ok(p1.contoh_terisi.includes("2024-2025")));
cek("objek dari data arah dipakai bila ada", () => assert.ok(p1.contoh_terisi.toLowerCase().includes("perusahaan asuransi")));
cek("contoh terisi tidak menyisakan placeholder kosong", () =>
  [p1, p2, p3].forEach((p) =>
    assert.ok(!/\[[a-zA-Z]+\]/.test(p.contoh_terisi), `masih ada placeholder: ${p.contoh_terisi}`)
  ));
cek("slot yang tak punya data ditandai jelas, bukan dikarang", () => {
  const t = susunPolaJudul({ name: "Arah baru" }); // tanpa [peristiwa] -> tak ada slot itu
  const dgnSlotKosong = susunPolaJudul({ potential_objects: ["X"] });
  assert.ok(dgnSlotKosong.contoh_terisi.length > 0);
  return t;
});
cek("contoh terisi berbentuk kalimat judul, bukan pola mentah", () =>
  assert.notEqual(p1.contoh_terisi, p1.pola));

console.log("\n[4] Batas 'bukan judul final' selalu ikut");
cek("batas sama dengan konstanta", () => [p1, p2, p3].forEach((p) => assert.equal(p.batas, BATAS_POLA)));
cek("batas menyebut 'bukan judul final'", () => assert.ok(/bukan judul final/i.test(BATAS_POLA)));
cek("ada daftar hal yang belum bisa diisi otomatis", () =>
  [p1, p2, p3].forEach((p) => assert.ok(p.slot_belum_diputuskan.length >= 3)));

console.log("\n[5] Tahan data kurang (arah baru belum lengkap)");
cek("arah kosong tidak melempar error", () => {
  const kosong = susunPolaJudul({}, undefined);
  assert.ok(kosong.pola.length > 10);
  assert.ok(kosong.slot_terisi.length > 0);
});
cek("tanpa scope tetap jalan tanpa '[undefined]'", () => {
  const t = susunPolaJudul({ name: "Arah baru" });
  assert.ok(!/undefined|null|\[object/i.test(t.pola));
  t.slot_terisi.forEach((s) => assert.ok(!/undefined|null|\[object/i.test(s.nilai)));
});
cek("nama arah dipakai sebagai aspek bila field lain kosong", () =>
  assert.ok(susunPolaJudul({ name: "Arah baru" }).contoh_terisi.toLowerCase().includes("arah baru")));
cek("arah tanpa desain keluarga tetap dapat pola", () =>
  assert.ok(susunPolaJudul({ name: "Arah baru" }).pola.includes("[aspek]")));
cek("tanpa periode acuan: tidak ada 'periode periode' dobel", () =>
  [p1, p2, p3].forEach((p) => {
    const t = susunPolaJudul({ potential_objects: ["X"] });
    assert.ok(!/periode\s+periode/i.test(t.contoh_terisi), `dobel periode: ${t.contoh_terisi}`);
  }));
cek("tanpa periode acuan: kalimat tetap terbaca", () => {
  const t = susunPolaJudul({ potential_objects: ["Perusahaan asuransi"] }, { objectOrPopulation: "Perusahaan asuransi" });
  assert.ok(!/periode\s+periode/i.test(t.contoh_terisi));
  assert.ok(t.contoh_terisi.includes("periode yang datanya tersedia") || t.contoh_terisi.includes("yang datanya tersedia"));
});

console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
