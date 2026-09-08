// Test XSS audit: gate URL untuk semua <a href> dari output parser + verifikasi React escape
import assert from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { safeHref } from "./src/lib/xss.ts";
import { normalizeEvidenceUrl } from "./src/lib/phenomenonParser.ts";

function readDirRecursive(dir, base = "") {
  let out = "";
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out += readDirRecursive(full, join(base, entry));
    } else if (/\.(tsx?|mjs|jsx)$/.test(entry)) {
      out += readFileSync(full, "utf8");
    }
  }
  return out;
}

let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log(`  ✓ ${name}`); };

console.log("=== XSS Audit: URL safety gate ===");

ok("safeHref menolak javascript: / data: / vbscript: (case-insensitive)", () => {
  assert.strictEqual(safeHref("javascript:alert(1)"), null);
  assert.strictEqual(safeHref("JaVaScRiPt:alert(1)"), null);
  assert.strictEqual(safeHref("data:text/html,<script>alert(1)</script>"), null);
  assert.strictEqual(safeHref("vbscript:msgbox"), null);
  assert.strictEqual(safeHref("file:///etc/passwd"), null);
  assert.strictEqual(safeHref("blob:https://evil/x"), null);
});

ok("safeHref menerima URL http(s) yang valid", () => {
  assert.strictEqual(safeHref("https://www.ojk.go.id/id/berita"), "https://www.ojk.go.id/id/berita");
  assert.strictEqual(safeHref("http://example.org/a?b=1&c=2#frag"), "http://example.org/a?b=1&c=2#frag");
  assert.strictEqual(safeHref(" https://doi.org/10.1234/abc "), "https://doi.org/10.1234/abc");
});

ok("safeHref menolak URL relatif, kosong, panjang ekstrem, non-string", () => {
  assert.strictEqual(safeHref("/relative/path"), null);
  assert.strictEqual(safeHref("//protocol-relative.example"), null);
  assert.strictEqual(safeHref(""), null);
  assert.strictEqual(safeHref(null), null);
  assert.strictEqual(safeHref(undefined), null);
  assert.strictEqual(safeHref("https://a.b/" + "x".repeat(3000)), null);
});

ok("defense in depth: parser hard-reject protokol berbahaya SEBELUM render", () => {
  assert.strictEqual(normalizeEvidenceUrl("javascript:alert(1)").normalized, null);
  assert.strictEqual(normalizeEvidenceUrl("javascript:alert(1)").reason, "UNSAFE_PROTOCOL");
  assert.strictEqual(normalizeEvidenceUrl("data:text/html,x").normalized, null);
});

ok("React escape: tidak ada dangerouslySetInnerHTML / innerHTML di seluruh src/", () => {
  const srcDir = readDirRecursive("src");
  assert.ok(!srcDir.includes("dangerouslySetInnerHTML"), "tidak ada dangerouslySetInnerHTML");
});

ok("semua href={ev.url} dari parser dibungkus safeHref", () => {
  const p1 = readFileSync("src/components/generator/PhenomenonToolContainer.tsx", "utf8");
  const p2 = readFileSync("src/components/generator/BedahToolContainer.tsx", "utf8");
  assert.ok(p1.includes("safeHref(ev.url)"), "PhenomenonToolContainer memakai safeHref");
  assert.ok(p2.includes("safeHref(ev.url)"), "BedahToolContainer memakai safeHref");
  // tidak ada lagi href={ev.url} mentah
  assert.ok(!p1.includes("href={ev.url}"), "tidak ada href mentah ev.url (Phenomenon)");
  assert.ok(!p2.includes("href={ev.url}"), "tidak ada href mentah ev.url (Bedah)");
});

ok("semua target=_blank punya rel noopener noreferrer", () => {
  const files = [
    "src/components/generator/PhenomenonToolContainer.tsx",
    "src/components/generator/BedahToolContainer.tsx",
  ];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const blanks = (src.match(/target="_blank"/g) || []).length;
    const rels = (src.match(/rel="noopener noreferrer"/g) || []).length;
    assert.ok(blanks === rels, `${f}: ${blanks} target=_blank vs ${rels} rel`);
  }
});

console.log(`\n${passed} PASSED, 0 FAILED (xss audit)`);
