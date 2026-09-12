/**
 * Ekspor hasil akhir tanpa dependency baru.
 *
 * Ke RTF, bukan .docx: tanpa library, menghasilkan .docx asli tidak mungkin, dan
 * trik "HTML berekstensi .doc" bikin Word memunculkan peringatan "format file
 * tidak cocok" — tidak pantas untuk berkas yang diserahkan ke dosen. RTF dibuka
 * Word/Google Docs/LibreOffice tanpa peringatan, dan bisa di-Save As .docx.
 *
 * RTF mengenali ASCII saja; huruf beraksen wajib jadi `\uN?`.
 */

/** Escape satu teks RTF. Non-ASCII -> \uN?, kurung & backslash di-escape. */
export function escapeRtf(teks: string): string {
  let out = "";
  for (const ch of teks) {
    const kode = ch.codePointAt(0)!;
    if (ch === "\\") out += "\\\\";
    else if (ch === "{") out += "\\{";
    else if (ch === "}") out += "\\}";
    else if (kode < 128) out += ch;
    // RTF untuk char di atas 32767 memakai nilai bertanda negatif.
    else out += "\\u" + (kode > 32767 ? kode - 65536 : kode) + "?";
  }
  return out.replace(/\r?\n/g, "\\line ");
}

export interface BlokRtf {
  teks: string;
  /** Judul bab / subjudul: tebal + lebih besar. */
  gaya?: "judul" | "subjudul" | "normal";
}

/**
 * Susun dokumen RTF dari daftar blok. Paragraf kosong dibiarkan sebagai baris
 * kosong supaya jarak antarbab tetap terlihat saat dibuka di Word.
 */
export function keRtf(blok: BlokRtf[]): string {
  const bagian = blok.map((b) => {
    const t = escapeRtf(b.teks);
    if (b.gaya === "judul") return "\\pard\\qc\\b\\fs32 " + t + "\\b0\\fs24\\par";
    if (b.gaya === "subjudul") return "\\pard\\b\\fs26 " + t + "\\b0\\fs24\\par";
    // Paragraf isi: jarak 1,5 baris, rata kiri-kanan.
    return "\\pard\\sl360\\slmult1\\qj " + t + "\\par";
  });
  return (
    "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}" +
    "\\f0\\fs24 " +
    bagian.join("\n") +
    "}"
  );
}

export interface EntriSitasi {
  sourceId?: string;
  title?: string;
  author?: string;
  year?: string;
  journal?: string;
  doi?: string;
  url?: string;
}

/** Kunci BibTeX aman: huruf/angka saja, unik per entri. */
export function kunciBibtex(e: EntriSitasi, i: number): string {
  const dasar = (e.author || e.title || e.sourceId || "sumber")
    .split(/[,;\s]+/)[0]
    .replace(/[^A-Za-z0-9]/g, "");
  return `${dasar || "sumber"}${e.year || ""}${i}`;
}

/**
 * Format satu entri BibTeX. Field kosong DILEWATI, bukan ditulis kosong —
 * entri berisi `author = {}` bikin Mendeley/Zotero menampilkan penulis kosong.
 */
export function entriKeBibtex(e: EntriSitasi, i: number): string {
  const jenis = e.journal ? "@article" : "@misc";
  const baris: string[] = [];
  const tambah = (k: string, v?: string) => {
    const t = (v || "").trim().replace(/\s+/g, " ");
    if (t) baris.push(`  ${k} = {${t}}`);
  };
  tambah("title", e.title);
  tambah("author", e.author);
  tambah("year", e.year);
  tambah("journal", e.journal);
  tambah("doi", e.doi);
  tambah("url", e.url);
  tambah("note", e.sourceId ? `Sumber ${e.sourceId} (Skriflow)` : undefined);
  return `${jenis}{${kunciBibtex(e, i)},\n${baris.join(",\n")}\n}`;
}

/** Dokumen .bib lengkap; entri tanpa judul DAN tanpa DOI dilewati. */
export function keBibtex(daftar: EntriSitasi[]): string {
  const layak = daftar.filter((e) => (e.title || "").trim() || (e.doi || "").trim());
  const kepala = "% Daftar pustaka dari Skriflow\n% Impor ke Mendeley/Zotero: File > Import\n\n";
  return kepala + layak.map((e, i) => entriKeBibtex(e, i)).join("\n\n") + "\n";
}

/** Nama berkas aman: tanpa karakter yang dilarang Windows/macOS. */
export function namaFileAman(teks: string, ext: string): string {
  const bersih = (teks || "skriflow")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/^[-.]+|[-.]+$/g, "");
  return `${bersih || "skriflow"}.${ext}`;
}
