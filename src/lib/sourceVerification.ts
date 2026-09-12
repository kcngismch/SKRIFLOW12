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
]);

/**
 * Kata ranah: muncul di hampir semua judul topik ini, jadi lemah sebagai bukti —
 * TAPI tidak boleh dibuang. Dulu kata-kata ini dimasukkan ke KATA_UMUM; akibatnya
 * judul yang sah dan tidak salah ketip pun kehilangan semua kata bermakna,
 * skornya jatuh ke 0, dan sumber asli dilaporkan "tidak ada" (padahal judulnya
 * identik dengan yang ada di Crossref). Sekarang bobotnya kecil, bukan nol.
 */
export const KATA_RANAH = new Set([
  "ifrs","psak","insurance","contract","contracts","asuransi","kontrak",
  "keuangan","akuntansi","financial","accounting",
]);
const BOBOT_RANAH = 0.25;

/** Bagi judul jadi kata berbobot (kata umum bobot 0, kata ranah 0.25, sisanya 1). */
function kataBerbobot(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)) {
    if (w.length <= 3 || KATA_UMUM.has(w)) continue;
    const bobot = KATA_RANAH.has(w) ? BOBOT_RANAH : 1;
    m.set(w, Math.max(m.get(w) ?? 0, bobot));
  }
  return m;
}

/**
 * Kesamaan judul: porsi kata bermakna judul sumber yang juga muncul di judul
 * pembanding. Pembandingnya judul yang PANJANG (penyebut terbesar), supaya judul
 * pendek yang isinya cuma kata ranah tidak mendapat skor tinggi hanya karena
 * seluruh katanya kebetulan ikut muncul di judul panjang.
 *
 * Wajib >= 2 kata yang sama: satu kata yang sama tidak cukup bukti.
 */
export function kemiripanJudul(a: string, b: string): number {
  const wa = kataBerbobot(a);
  const wb = kataBerbobot(b);
  if (wa.size === 0 || wb.size === 0) return 0; // judul terlalu umum -> tidak bisa dinilai
  let sama = 0;
  let jumlahKata = 0;
  for (const [w, bobot] of wa) {
    const lain = wb.get(w);
    if (lain === undefined) continue;
    sama += Math.min(bobot, lain);
    jumlahKata++;
  }
  if (jumlahKata < 2) return 0;
  const jumlah = (m: Map<string, number>) => [...m.values()].reduce((x, y) => x + y, 0);
  return sama / Math.max(jumlah(wa), jumlah(wb));
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

/**
 * DOI yang bentuknya sah selalu diawali "10." lalu kode registrant.
 * Output AI sering mengisi kolom DOI dengan "-", "N/A", atau "tidak ada";
 * nilai seperti itu BUKAN DOI dan tidak boleh dikirim ke Crossref sebagai
 * DOI (kalau dikirim, jawabannya "tidak terdaftar" lalu sumber asli yang
 * sebenarnya ada dilaporkan sebagai palsu).
 */
export function doiSah(raw: string | undefined | null): string {
  const v = (raw || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!/^10\.\d{4,9}\/\S+$/i.test(v)) return "";
  return v;
}

/**
 * Judul inti dari judul halaman web.
 *
 * Halaman jurnal/situs penerbit hampir selalu menambahkan nama terbitan di
 * belakang judul, dipisah "|", "-", atau "::". Contoh nyata: judul halaman
 * "...Life Insurance Companies? | Dinasti International Journal of Economics".
 * Ekor itu bukan bagian judul artikel; kalau ikut dihitung, judul yang sama
 * persis pun skornya jatuh di bawah ambang dan sumber sah tampak mencurigakan.
 *
 * Mengembalikan kandidat dari yang paling panjang; pemanggil memakai yang
 * paling cocok, sehingga judul yang memang mengandung tanda pisah tidak
 * dirugikan.
 */
export function kandidatJudulHalaman(judulHalaman: string): string[] {
  const t = (judulHalaman || "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const kandidat = [t];
  for (const pisah of [/\s*[|·]\s*/, /\s+[–—]\s+/, /\s+::\s+/]) {
    const bagian = t.split(pisah)[0].trim();
    if (bagian.length > 10 && bagian !== t) kandidat.push(bagian);
  }
  return kandidat;
}
