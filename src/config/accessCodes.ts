/**
 * Konfigurasi Hash Kode Akses Skriflow Pass (v1)
 *
 * Nilai di bawah adalah FNV-1a 64-bit hex lowercase (16 karakter) dari kode akses resmi.
 * Kode mentah tidak disimpan di repository untuk menjaga keamanan sederhana pada v1.
 * Format kode: SKRIFLOW-XXXX-XXXX
 *
 * Cara generate hash & kode baru (jalankan satu baris ini di terminal node):
 * node -e "const b=new TextEncoder().encode('SKRIFLOW-XXXX-XXXX');let h=14695981039346656037n;for(const x of b)h=(h^BigInt(x))*1099511628211n&0xffffffffffffffffn;console.log(h.toString(16).padStart(16,'0'))"
 *
 * Kode demo:
 * SKRIFLOW-DEMO-2026-0001 -> 007c561bad5c0809
 * SKRIFLOW-DEMO-2026-0002 -> 007c531bad5c02f0
 */

export const VALID_ACCESS_HASHES: readonly string[] = [
  // SKRIFLOW-DEMO-2026-0001
  "007c561bad5c0809",
  // SKRIFLOW-DEMO-2026-0002
  "007c531bad5c02f0",
];

export const VALID_PASS_HASHES = VALID_ACCESS_HASHES;
