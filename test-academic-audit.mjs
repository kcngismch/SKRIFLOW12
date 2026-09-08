// Test audit akademik: rule gap sintetis (Tool 4) + deklarasi AI komponen kontrak
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { assembleBedahPrompt } from "./src/lib/promptAssembler.ts";
import { assembleLiteraturePromptA } from "./src/lib/promptAssembler.ts";
import { ACTIVE_TOOLS } from "./src/data/tools.ts";

let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log(`  ✓ ${name}`); };

console.log("=== Audit Akademik: penguatan pondasi ===");

ok("Prompt Bedah memuat kriteria anti gap sintetis (bukan klaim absolut saja)", () => {
  const p = assembleBedahPrompt({});
  assert.ok(p.includes("BUKAN gap yang sah"), "frasa kriteria gap sintetis ada");
  assert.ok(p.includes("gap_status PERLU_VERIFIKASI"), "instruksi status turun ke PERLU_VERIFIKASI");
  assert.ok(p.includes("belum pernah diteliti"), "klaim absolut tetap dilarang (regresi)");
});

ok("Prompt Bedah TIDAK melanggar red line: tidak menulis draft Bab 1", () => {
  const p = assembleBedahPrompt({});
  assert.ok(p.includes("Jangan menulis draft Bab 1"), "rule #7 tetap ada");
});

ok("Tool 3 Prompt A tetap 15-25 artikel & full-text wajib (sumber primer by construction)", () => {
  const t3 = ACTIVE_TOOLS.find((t) => t.slug === "cari-literatur-awal");
  const res = assembleLiteraturePromptA(t3, {});
  assert.ok(res.prompt.includes("15-25 artikel"), "kuota artikel ada");
  assert.ok(res.prompt.includes("Full-text wajib"), "full-text gate ada");
  assert.ok(res.breakdown.staticText <= 1600, `statis ${res.breakdown.staticText} <= 1600`);
});

ok("Tool 3 rentang publikasi default terjaga (kekinian pustaka)", () => {
  const t3 = ACTIVE_TOOLS.find((t) => t.slug === "cari-literatur-awal");
  const field = t3.fields.find((f) => f.id === "rentang_tahun");
  assert.ok(field && field.defaultValue && /tahun terakhir/.test(field.defaultValue), "default rentang tahun ada");
});

ok("Deklarasi AI: kontrak teks di depan (draf dari jejak proses, bukan tulisan AI)", () => {
  const src = readFileSync("src/components/generator/AiUsageDeclaration.tsx", "utf8");
  assert.ok(src.includes("bukan tulisan AI"), "penegasan bukan tulisan AI ada");
  assert.ok(src.includes("Deklarasi Penggunaan AI"), "judul section ada");
  assert.ok(src.includes("textarea"), "editable oleh mahasiswa");
  const bedah = readFileSync("src/components/generator/BedahToolContainer.tsx", "utf8");
  assert.ok(bedah.includes("AiUsageDeclaration"), "terpasang di Tool 4");
});

console.log(`\n${passed} PASSED, 0 FAILED (audit akademik)`);
