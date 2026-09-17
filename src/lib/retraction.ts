import { doiSah } from "./sourceVerification";

/**
 * Deteksi artikel yang sudah DITARIK (retracted) via OpenAlex.
 *
 * Kenapa OpenAlex, bukan Crossref: endpoint `works/{doi}` Crossref tidak
 * mengembalikan `update-to` untuk artikel yang ditarik (sudah diuji dengan
 * makalah Wakefield 1998 — hasilnya null), sedangkan OpenAlex memberi flag
 * `is_retracted` yang eksplisit.
 *
 * Kenapa batch: satu permintaan `filter=doi:a|b|c` melayani sampai 50 DOI
 * sekaligus, jadi 20 sumber tetap 1 permintaan, bukan 20.
 *
 * Gratis, tanpa API key. DOI yang tidak ada di OpenAlex tidak muncul di hasil —
 * itu BUKAN berarti ditarik, hanya tidak diketahui, jadi diperlakukan `false`.
 */

export const OPENALEX_MAKS_DOI = 50;

export interface StatusRetraksi {
  ditarik: boolean;
  /** Judul menurut OpenAlex; sering berawalan "RETRACTED: ". */
  judul?: string;
  tahun?: string;
}

/** DOI yang layak dikirim ke OpenAlex: yang lolos validasi saja. */
export function kumpulkanDoiSah(items: { doi?: string; url?: string }[]): string[] {
  const hasil: string[] = [];
  for (const it of items) {
    const d = doiSah(it.doi);
    if (d && !hasil.includes(d)) hasil.push(d);
  }
  return hasil.slice(0, OPENALEX_MAKS_DOI);
}

/** URL batch OpenAlex. `|` dan `:` dibiarkan mentah — keduanya bagian sintaks filter. */
export function urlBatchRetraksi(daftarDoi: string[]): string {
  const filter = "doi:" + daftarDoi.join("|");
  return (
    "https://api.openalex.org/works?per_page=" +
    OPENALEX_MAKS_DOI +
    "&select=doi,is_retracted,title,publication_year&filter=" +
    filter.replace(/ /g, "").replace(/%/g, "%25")
  );
}

const KUNCI = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\/doi\.org\//, "");

/**
 * Terima respons OpenAlex (bentuk apa pun), kembalikan peta DOI -> status.
 * Toleran terhadap respons cacat: apa pun yang tidak terbaca jadi "tidak ditarik",
 * supaya sumber sah tidak pernah dilaporkan ditarik karena kesalahan parsing.
 */
export function petakanRetraksi(body: unknown): Record<string, StatusRetraksi> {
  const hasil: Record<string, StatusRetraksi> = {};
  const results = (body as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return hasil;

  for (const r of results) {
    const w = r as { doi?: unknown; is_retracted?: unknown; title?: unknown; publication_year?: unknown };
    const doi = KUNCI(String(w.doi ?? ""));
    if (!doi) continue;
    hasil[doi] = {
      ditarik: w.is_retracted === true,
      judul: w.title ? String(w.title) : undefined,
      tahun: w.publication_year ? String(w.publication_year) : undefined,
    };
  }
  return hasil;
}

/** Ambil status satu DOI dari peta, tahan terhadap perbedaan kapitalisasi DOI. */
export function cariStatus(peta: Record<string, StatusRetraksi>, doi?: string): StatusRetraksi | undefined {
  const d = KUNCI(doiSah(doi) || "");
  return d ? peta[d] : undefined;
}
