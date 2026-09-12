/**
 * Fungsi murni verifikasi sumber (R-05). Dipisah dari route agar bisa diuji
 * tanpa menjalankan server.
 */

/**
 * Kata yang muncul di hampir semua judul skripsi/jurnal sehingga tidak bisa
 * dipakai sebagai bukti dua dokumen itu sama.
 */
export const KATA_UMUM = new Set([
  "analisis","pengaruh","dampak","terhadap","pada","studi","penelitian","kajian",
  "implementasi","penerapan","perusahaan","indonesia","kasus","perbandingan",
  "sebelum","sesudah","dan","atau","serta","dengan","untuk","dari","yang",
  "the","of","and","in","on","for","study","analysis","effect","impact",
  "implementation","application","companies","company","case","evidence",
  "between","before","after","its","our","new",
  // Kata generik ranah akuntansi/asuransi: muncul di hampir semua judul topik
  // ini sehingga tidak membedakan satu dokumen dari dokumen lain.
  "ifrs","psak","insurance","contract","contracts","asuransi","kontrak",
  "keuangan","akuntansi","financial","accounting",
]);

/** Bagi judul jadi kata bermakna (buang kata umum dan kata pendek). */
function kataBermakna(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !KATA_UMUM.has(w))
  );
}

/** Kesamaan judul: bagian judul sumber yang juga muncul di judul pembanding. */
export function kemiripanJudul(a: string, b: string): number {
  const wa = kataBermakna(a);
  const wb = kataBermakna(b);
  if (wa.size < 2 || wb.size < 2) return 0; // judul terlalu umum -> tidak bisa dinilai
  let sama = 0;
  for (const w of wa) if (wb.has(w)) sama++;
  return sama / Math.min(wa.size, wb.size);
}

/** Ambil DOI dari URL doi.org bila ada, mis. https://doi.org/10.1038/nature12373 */
export function doiDariUrl(url: string): string {
  const m = /doi\.org\/(10\.[^\s?#]+)/i.exec(url ?? "");
  return m ? m[1] : "";
}

/**
 * Crossref/OpenAlex hanya mendaftarkan artikel, buku, dan prosiding. Laporan
 * tahunan perusahaan, dokumen regulator, siaran pers, skripsi, dan tesis lokal
 * memang tidak ada di sana — ketiadaan jejak bukan tanda bahaya.
 */
export function jenisDiawasiCrossref(documentType?: string): boolean {
  const t = (documentType ?? "").toLowerCase();
  if (!t) return true; // tidak diketahui -> perlakukan sebagai terbitan ilmiah
  return /peer-reviewed|jurnal|journal|article|prosiding|proceeding|artikel/.test(t);
}


/**
 * DOAJ mengindeks jurnal akses-terbuka, termasuk banyak jurnal Indonesia yang
 * tidak terdaftar di Crossref. Cadangan untuk sumber ilmiah tanpa jejak Crossref.
 *
 * ponytail: hanya judul yang dicocokkan. DOAJ tidak menyediakan pencarian per
 * DOI di jalur ini, jadi sumber ber-DOI tetap lebih akurat lewat Crossref.
 */
export function perluCariDoaj(verdict: string, documentType?: string): boolean {
  // Hanya saat Crossref tidak menemukan apa pun DAN jenisnya terbitan ilmiah.
  return verdict === "TIDAK_DITEMUKAN" && jenisDiawasiCrossref(documentType);
}
