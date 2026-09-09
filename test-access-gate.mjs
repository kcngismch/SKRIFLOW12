// Test: Access Gate (Skriflow Pass v1)
// Jalankan: npx -y tsx test-access-gate.mjs
import assert from "node:assert";
import {
  hashCode,
  isPassActive,
  activatePass,
  deactivatePass,
} from "./src/lib/accessGate.ts";
import { VALID_ACCESS_HASHES } from "./src/config/accessCodes.ts";

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log("=== Test Suite: Skriflow Access Gate (Pass v1) ===");

// ---------------------------------------------------------------------------
// 1. DETERMINISTIC HASH CODE
// ---------------------------------------------------------------------------
await test("hashCode menghasilkan FNV-1a 64-bit hex lowercase 16-karakter secara deterministik", () => {
  const code = "SKRIFLOW-DEMO-2026-0001";
  const hash1 = hashCode(code);
  const hash2 = hashCode(code);

  assert.strictEqual(typeof hash1, "string");
  assert.strictEqual(hash1.length, 16);
  assert.match(hash1, /^[0-9a-f]{16}$/);
  assert.strictEqual(hash1, hash2, "Hash harus deterministik pada input yang sama");
});

// ---------------------------------------------------------------------------
// 2. NORMALISASI (LOWERCASE & SPASI)
// ---------------------------------------------------------------------------
await test("hashCode menormalisasi lowercase dan whitespace (spasi, tab, newline)", () => {
  const canonical = "SKRIFLOW-DEMO-2026-0001";
  const baseHash = hashCode(canonical);

  const lowerHash = hashCode("skriflow-demo-2026-0001");
  assert.strictEqual(lowerHash, baseHash, "Kode lowercase harus menghasilkan hash yang sama");

  const spacedHash = hashCode("   SKRIFLOW-DEMO-2026-0001   ");
  assert.strictEqual(spacedHash, baseHash, "Kode dengan spasi di awal/akhir harus menghasilkan hash yang sama");

  const mixedHash = hashCode("\t\n  skriflow-demo-2026-0001 \r\n  ");
  assert.strictEqual(mixedHash, baseHash, "Kode lowercase dengan ragam whitespace harus tetap cocok");

  // Cocok dengan hash yang tersimpan di config
  assert.strictEqual(baseHash, VALID_ACCESS_HASHES[0], "Hash demo 1 harus cocok dengan config");

  const demo2Hash = hashCode("skriflow-demo-2026-0002");
  assert.strictEqual(demo2Hash, VALID_ACCESS_HASHES[1], "Hash demo 2 harus cocok dengan config");
});

// ---------------------------------------------------------------------------
// 3. ACTIVATE PASS GAGAL UNTUK KODE SALAH
// ---------------------------------------------------------------------------
await test("activatePass menolak kode kosong, invalid, dan kode tidak terdaftar", async () => {
  deactivatePass();
  assert.strictEqual(await isPassActive(), false);

  // Input kosong
  const emptyRes = await activatePass("");
  assert.strictEqual(emptyRes, false);
  assert.strictEqual(await isPassActive(), false);

  // Whitespace saja
  const whitespaceRes = await activatePass("    ");
  assert.strictEqual(whitespaceRes, false);
  assert.strictEqual(await isPassActive(), false);

  // Kode salah / asal
  const wrongCodeRes = await activatePass("KODE-SALAH-1234");
  assert.strictEqual(wrongCodeRes, false);
  assert.strictEqual(await isPassActive(), false);

  // Format serupa tapi tidak terdaftar
  const fakeCodeRes = await activatePass("SKRIFLOW-FAKE-9999-9999");
  assert.strictEqual(fakeCodeRes, false);
  assert.strictEqual(await isPassActive(), false);
});

// ---------------------------------------------------------------------------
// 4. ACTIVATE PASS BERHASIL UNTUK KODE DEMO
// ---------------------------------------------------------------------------
await test("activatePass berhasil untuk kode demo resmi", async () => {
  deactivatePass();
  assert.strictEqual(await isPassActive(), false);

  // Kode demo 1
  const demo1Success = await activatePass("SKRIFLOW-DEMO-2026-0001");
  assert.strictEqual(demo1Success, true, "Kode demo 1 harus berhasil diaktifkan");
  assert.strictEqual(await isPassActive(), true, "isPassActive harus true setelah demo 1 aktif");

  // Deactivate lalu aktifkan kode demo 2 dengan variasi spasi & lowercase
  deactivatePass();
  assert.strictEqual(await isPassActive(), false);

  const demo2Success = await activatePass("  skriflow-demo-2026-0002  ");
  assert.strictEqual(demo2Success, true, "Kode demo 2 dengan spasi & lowercase harus berhasil diaktifkan");
  assert.strictEqual(await isPassActive(), true, "isPassActive harus true setelah demo 2 aktif");
});

// ---------------------------------------------------------------------------
// 5. IS PASS ACTIVE SETELAH AKTIVASI DAN DEAKTIVASI
// ---------------------------------------------------------------------------
await test("isPassActive mencerminkan status siklus hidup pass (aktif -> deaktif -> aktif)", async () => {
  deactivatePass();
  assert.strictEqual(await isPassActive(), false, "Awal: pass harus non-aktif");

  await activatePass("SKRIFLOW-DEMO-2026-0001");
  assert.strictEqual(await isPassActive(), true, "Setelah aktivasi: pass harus aktif");

  deactivatePass();
  assert.strictEqual(await isPassActive(), false, "Setelah deactivatePass: pass harus non-aktif");

  await activatePass("SKRIFLOW-DEMO-2026-0002");
  assert.strictEqual(await isPassActive(), true, "Aktivasi ulang: pass harus aktif");

  deactivatePass();
  assert.strictEqual(await isPassActive(), false);
});

console.log(`\n${passed} PASSED, 0 FAILED (access-gate)`);
