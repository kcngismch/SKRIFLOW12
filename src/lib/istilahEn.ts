/**
 * Terjemahan istilah pencarian Indonesia -> Inggris.
 *
 * Masalah nyata: mahasiswa mengetik "pengungkapan asuransi" di Google Scholar
 * dan tidak menemukan apa pun, padahal padanannya "insurance disclosure" ada
 * ratusan. Sumber anglo-saxon tidak terindeks dengan kata Indonesia.
 *
 * Memakai MyMemory (api.mymemory.translated.net) — gratis, tanpa API key,
 * CORS terbuka. Batas resmi ±10.000 kata/hari tanpa email; pengguna anonim
 * juga dibatasi per-IP, jadi kegagalan ditangani sebagai "tidak tersedia",
 * bukan error yang terlihat user.
 *
 * SENGAJA dijalankan dari browser (bukan lewat /api) supaya tidak menghabiskan
 * kuota server, dan supaya tetap jalan walau route server sedang sibuk.
 */

export const MYMEMORY_MAKS_PER_PERMINTAAN = 12;

/** Istilah yang sudah lazim: jangan diterjemahkan mesin (sering salah). */
const KAMUS_TETAP: Record<string, string> = {
  "laba rugi": "profit and loss",
  "laba-rugi": "profit and loss",
  "arus kas": "cash flow",
  "nilai wajar": "fair value",
  "nilai intrinsic": "intrinsic value",
  "pengendalian internal": "internal control",
  "tata kelola": "corporate governance",
  "manajemen laba": "earnings management",
  "audit": "audit",
  "kepatuhan": "compliance",
  "pengungkapan": "disclosure",
  "keberlanjutan": "sustainability",
  "laporan tahunan": "annual report",
};

export function terjemahanTetap(istilah: string): string | undefined {
  return KAMUS_TETAP[istilah.trim().toLowerCase()];
}

/** Satu istilah tidak layak dikirim: kosong atau cuma sepatah angka. */
export function istilahLayakDiterjemahkan(istilah: string): boolean {
  const t = (istilah || "").trim();
  return t.length >= 3 && /[a-zA-Z]/.test(t);
}

/** Buang duplikat (tanpa peduli besar-kecil huruf), jaga urutan, batasi jumlah. */
export function siapkanIstilah(daftar: string[]): string[] {
  const keluar: string[] = [];
  const terlihat = new Set<string>();
  for (const mentah of daftar) {
    const t = (mentah || "").trim().replace(/\s+/g, " ");
    if (!istilahLayakDiterjemahkan(t)) continue;
    const kunci = t.toLowerCase();
    if (terlihat.has(kunci)) continue;
    terlihat.add(kunci);
    keluar.push(t);
    if (keluar.length >= MYMEMORY_MAKS_PER_PERMINTAAN) break;
  }
  return keluar;
}

export interface HasilTerjemahan {
  istilah: string;
  inggris: string;
  /** true bila dari kamus tetap, bukan mesin — lebih bisa dipercaya. */
  dariKamus: boolean;
}

/** URL MyMemory untuk satu istilah. */
export function urlTerjemahan(istilah: string): string {
  const q = encodeURIComponent(istilah.slice(0, 300));
  return `https://api.mymemory.translated.net/get?q=${q}&langpair=id|en`;
}

/**
 * Baca satu respons MyMemory. Mengembalikan "" bila respons tidak memuat
 * terjemahan yang bisa dipakai (kuota habis, bahasa tidak dikenal, dll).
 */
export function bacaTerjemahan(body: unknown): string {
  const d = (body as { responseData?: { translatedText?: unknown } } | null)?.responseData;
  const t = typeof d?.translatedText === "string" ? d.translatedText.trim() : "";
  // MyMemory mengembalikan pesan-pesan ini saat kuota habis / input ditolak.
  if (!t || /^(MYMEMORY WARNING|INVALID|QUERY LENGTH LIMIT)/i.test(t)) return "";
  return t;
}

/**
 * Terjemahkan satu istilah: kamus tetap dulu, lalu MyMemory.
 * Tidak pernah melempar — kegagalan jaringan menghasilkan "" supaya pemanggil
 * bisa lanjut ke istilah berikutnya tanpa kehilangan seluruh hasil.
 */
export async function terjemahkanIstilah(istilah: string): Promise<HasilTerjemahan> {
  const tetap = terjemahanTetap(istilah);
  if (tetap) return { istilah, inggris: tetap, dariKamus: true };

  try {
    const res = await fetch(urlTerjemahan(istilah), { method: "GET" });
    if (!res.ok) return { istilah, inggris: "", dariKamus: false };
    return { istilah, inggris: bacaTerjemahan(await res.json()), dariKamus: false };
  } catch {
    return { istilah, inggris: "", dariKamus: false };
  }
}

/** Bentuk daftar kata kunci gabungan Indonesia + Inggris untuk ditempel ke form. */
export function gabungKataKunci(hasil: HasilTerjemahan[]): string {
  const semua: string[] = [];
  for (const h of hasil) {
    if (h.istilah) semua.push(h.istilah);
    if (h.inggris) semua.push(h.inggris);
  }
  return siapkanIstilah(semua).join(", ");
}
