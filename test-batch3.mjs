// Test Batch 3: Export/Import/Clear all data (backup anti-hilang)
// Jalankan: npx -y tsx test-batch3.mjs
import assert from "node:assert";
import {
  saveToolData,
  loadToolData,
  exportAllData,
  importAllData,
  clearAllData,
} from "./src/lib/storage.ts";

let passed = 0;
function ok(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log("=== Export/Import/Clear All Data ===");

ok("export berisi data tool yang disimpan", () => {
  saveToolData("cari-ide-skripsi", { topik: "UMKM", metode: "kualitatif" });
  saveToolData("cari-fenomena-awal", { fenomena: "gen Z tidak nabung" });
  const parsed = JSON.parse(exportAllData());
  assert.strictEqual(parsed.app, "skriflow");
  assert.strictEqual(parsed.schemaVersion, 1);
  assert.ok(parsed.exportedAt);
  const keys = Object.keys(parsed.data);
  assert.ok(keys.some((k) => k.includes("cari-ide-skripsi")), `key ide ada di ${keys.join(",")}`);
  assert.ok(keys.some((k) => k.includes("cari-fenomena-awal")));
  // semua key harus prefix skriflow_
  assert.ok(keys.every((k) => k.startsWith("skriflow_")));
});

ok("clearAllData menghapus semua dan mengembalikan jumlah", () => {
  const n = clearAllData();
  assert.ok(n >= 2, `minimal 2 key dihapus, dapat ${n}`);
  assert.deepStrictEqual(loadToolData("cari-ide-skripsi"), {});
  assert.deepStrictEqual(loadToolData("cari-fenomena-awal"), {});
});

ok("import memulihkan data dari export (round-trip publik API)", () => {
  saveToolData("cari-ide-skripsi", { topik: "UMKM" });
  saveToolData("cari-fenomena-awal", { fenomena: "A" });
  const backup = exportAllData();
  clearAllData();
  assert.deepStrictEqual(loadToolData("cari-ide-skripsi"), {});
  const res = importAllData(backup);
  assert.strictEqual(res.error, undefined);
  assert.ok(res.restored >= 2, `restored=${res.restored}`);
  assert.deepStrictEqual(loadToolData("cari-ide-skripsi"), { topik: "UMKM" });
  assert.deepStrictEqual(loadToolData("cari-fenomena-awal"), { fenomena: "A" });
});

ok("import menolak JSON rusak dengan pesan jelas", () => {
  const res = importAllData("{ini bukan json");
  assert.strictEqual(res.restored, 0);
  assert.strictEqual(res.error, "File bukan JSON yang valid.");
});

ok("import menolak struktur bukan backup Skriflow", () => {
  const res = importAllData(JSON.stringify({ app: "lain", data: { x: "1" } }));
  assert.strictEqual(res.restored, 0);
  assert.strictEqual(res.error, "Struktur file bukan backup Skriflow yang dikenali.");
});

ok("import mengabaikan key non-skriflow & nilai non-string", () => {
  const res = importAllData(
    JSON.stringify({
      app: "skriflow",
      data: { skriflow_ok: "ya", tema_dark: "1", skriflow_num: 42 },
    })
  );
  assert.strictEqual(res.restored, 1);
  assert.deepStrictEqual(loadToolData("ok"), { }); // key skriflow_ok bukan data tool; cukup cek tidak error
  assert.strictEqual(JSON.parse(exportAllData()).data.skriflow_ok, "ya");
});

ok("round-trip: export→clear→import→export identik", () => {
  clearAllData();
  saveToolData("uji-roundtrip", { nested: JSON.stringify({ x: [1, 2] }), z: "akhir" });
  const first = exportAllData();
  clearAllData();
  importAllData(first);
  const second = JSON.parse(exportAllData());
  const orig = JSON.parse(first);
  assert.deepStrictEqual(second.data, orig.data);
});

console.log(`\n${passed} PASSED, 0 FAILED (export/import/clear)`);
