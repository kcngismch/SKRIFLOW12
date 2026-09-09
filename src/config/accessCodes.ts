/**
 * Konfigurasi Hash Kode Akses Skriflow Pass (v1)
 *
 * Nilai di bawah adalah SHA-256 hex lowercase dari kode akses resmi.
 * Kode mentah tidak disimpan di repository untuk menjaga keamanan sederhana pada v1.
 * Format kode: SKRIFLOW-XXXX-XXXX
 *
 * Cara generate hash & kode baru (jalankan satu baris ini di terminal node):
 * node -e "console.log(require('crypto').createHash('sha256').update('SKRIFLOW-XXXX-XXXX').digest('hex'))"
 *
 * Kode demo:
 * SKRIFLOW-DEMO-2026-0001 -> 821ee208b52e6ccba45999f9d339d9bce500a8a717c01043bfb1ec8ae97b00e3
 * SKRIFLOW-DEMO-2026-0002 -> b095e2a88f8d6eac8d91cbd6f2f9320493afeb548850d1bc207c032089a9ef2a
 */

export const VALID_ACCESS_HASHES: readonly string[] = [
  // SKRIFLOW-DEMO-2026-0001
  "821ee208b52e6ccba45999f9d339d9bce500a8a717c01043bfb1ec8ae97b00e3",
  // SKRIFLOW-DEMO-2026-0002
  "b095e2a88f8d6eac8d91cbd6f2f9320493afeb548850d1bc207c032089a9ef2a",
];

export const VALID_PASS_HASHES = VALID_ACCESS_HASHES;
