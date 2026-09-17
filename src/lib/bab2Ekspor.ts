/**
 * Ekspor Bab 2 ke RTF. Addendum D §D.12.
 *
 * Memakai `keRtf` yang sudah ada di ekspor.ts — tidak ada penulis RTF kedua.
 * Yang ditambahkan di sini hanya pemetaan draf/poles -> daftar blok.
 */

import { keRtf, type BlokRtf } from "./ekspor";
import type { Bab2DraftV1, Bab2FoundationV1, Bab2PolishV1 } from "@/types/bab2";

export interface OpsiEksporBab2 {
  judul: string;
  prodi?: string;
  /**
   * Kerangka pemikiran & hipotesis hidup di FONDASI (6A), bukan di draf (6B) —
   * draf hanya memuat prosa. Tanpa fondasi, bagian itu dilewati saja.
   */
  foundation?: Bab2FoundationV1 | null;
}

/**
 * Draf 6B atau hasil poles 6C -> dokumen RTF.
 *
 * Bagian non-prosa (tabel penelitian terdahulu, kerangka pemikiran, catatan
 * status) ditulis sebagai blok teks polos: RTF tanpa library belum bisa
 * menggambar tabel, dan tabel Markdown setengah jadi lebih buruk daripada
 * daftar yang jelas.
 */
export function eksporBab2Rtf(hasil: Bab2DraftV1 | Bab2PolishV1, opsi: OpsiEksporBab2): string {
  const blok: BlokRtf[] = [{ teks: opsi.judul, gaya: "judul" }];

  if (opsi.prodi) blok.push({ teks: opsi.prodi, gaya: "normal" });

  // Kerangka pemikiran & hipotesis SELALU dicap kandidat di badan dokumen:
  // mahasiswa yang memutuskan, dan cap itu pengingatnya.
  const fondasi = opsi.foundation;
  const kerangka = fondasi?.conceptual_framework;
  const hipotesisKandidat = fondasi?.hypothesis_candidates || [];

  // Sub-bab diturunkan dari isi draf (urutan kemunculan), bukan dari blueprint —
  // blueprint ada di fondasi, bukan di skema draf. Urutan draf = urutan tulisan,
  // yang memang urutan yang benar untuk ekspor.
  const urutanSubBab = Array.from(new Set(hasil.background.map((p) => p.sub_bab)));

  for (const subBab of urutanSubBab) {
    blok.push({ teks: subBab, gaya: "subjudul" });
    for (const p of hasil.background.filter((x) => x.sub_bab === subBab)) {
      blok.push({ teks: p.paragraph_text, gaya: "normal" });
    }
  }

  if (kerangka?.hubungan) {
    blok.push({ teks: "Kerangka Pemikiran", gaya: "subjudul" });
    blok.push({ teks: `Konstruk: ${kerangka.konstruk.join(", ")}`, gaya: "normal" });
    blok.push({ teks: kerangka.hubungan, gaya: "normal" });
    blok.push({ teks: "[Status: kandidat — keputusan akhir peneliti]", gaya: "normal" });
  }

  if (hipotesisKandidat.length > 0) {
    blok.push({ teks: "Hipotesis (Kandidat)", gaya: "subjudul" });
    for (const h of hipotesisKandidat) {
      blok.push({ teks: `- ${h.pernyataan}`, gaya: "normal" });
    }
    blok.push({ teks: "[Status: kandidat — keputusan akhir peneliti]", gaya: "normal" });
  }

  for (const catatan of hasil.unresolved_notes || []) {
    blok.push({ teks: `Catatan: ${catatan}`, gaya: "normal" });
  }

  return keRtf(blok);
}
