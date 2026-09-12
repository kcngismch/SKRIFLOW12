import { NextResponse } from "next/server";

/**
 * Verifikasi sumber ke Crossref/OpenAlex (R-05).
 *
 * Gratis, tanpa API key. Dipanggil dari server agar tidak bergantung CORS dan
 * agar User-Agent sopan (Crossref meminta kontak di UA).
 *
 * Batas: maksimal 12 sumber per permintaan untuk mencegah penyalahgunaan.
 */

import {
  doiDariUrl,
  doiSah,
  jenisDiawasiCrossref,
  kandidatJudulHalaman,
  kemiripanJudul,
  perluCariDoaj,
} from "@/lib/sourceVerification";

const MAX_ITEMS = 12;
const TIMEOUT_MS = 8000;
// Situs penerbit Indonesia sering lambat (ada yang 17 detik), jadi cek
// halaman diberi waktu lebih longgar daripada panggilan API metadata.
const TIMEOUT_HALAMAN_MS = 20000;
const UA = "Skriflow/1.0 (verifikasi sumber akademik; mailto:support@skriflow.app)";

type Verdict =
  | "TERVERIFIKASI"
  | "KEMUNGKINAN_COCOK"
  | "TAUTAN_HIDUP"
  | "TIDAK_DITEMUKAN"
  | "TIDAK_DAPAT_DIPERIKSA";

interface Item {
  sourceId?: string;
  doi?: string;
  url?: string;
  title?: string;
  documentType?: string;
}

interface Hasil {
  sourceId: string;
  verdict: Verdict;
  sumber: "crossref" | "openalex" | "doaj" | null;
  judulDitemukan?: string;
  tahunDitemukan?: string;
  doiDitemukan?: string;
  catatan: string;
  /** True hanya bila ketiadaan jejak memang layak dicurigai (artikel jurnal). */
  perluDicurigai: boolean;
}

async function ambil(url: string): Promise<{ status: number; body: unknown }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return { status: res.status, body: null };
    return { status: res.status, body: await res.json() };
  } catch {
    // Jaringan mati/timeout bukan bukti sumber tidak ada.
    return { status: 0, body: null };
  }
}

/**
 * Buka tautan sumber dan ambil judul halamannya.
 *
 * Dipakai saat jejak sumber tidak ada di ketiga basis data. Banyak sumber nyata
 * Indonesia (prosiding kampus, repositori, jurnal lokal) memang belum terindeks,
 * jadi "tidak ada di Crossref" saja tidak cukup untuk menuduhnya palsu.
 * Mengembalikan null bila halaman tidak dapat dibuka.
 */
async function judulHalaman(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_HALAMAN_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);
    const m = /<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html);
    return m ? m[1].replace(/\s+/g, " ").trim() : "";
  } catch {
    return null;
  }
}

function tahunDariCrossref(msg: Record<string, unknown>): string {
  const issued = msg.issued as { "date-parts"?: number[][] } | undefined;
  const p = issued?.["date-parts"]?.[0]?.[0];
  return p ? String(p) : "";
}

async function periksaDoi(item: Item, doi: string): Promise<Hasil | null> {
  const cr = await ambil(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (cr.status === 200 && cr.body) {
    const msg = (cr.body as { message: Record<string, unknown> }).message;
    const judul = Array.isArray(msg.title) ? String((msg.title as string[])[0] ?? "") : "";
    return {
      sourceId: item.sourceId ?? doi,
      verdict: "TERVERIFIKASI",
      sumber: "crossref",
      judulDitemukan: judul,
      tahunDitemukan: tahunDariCrossref(msg),
      doiDitemukan: String(msg.DOI ?? doi),
      catatan: `DOI terdaftar di Crossref. Judul terdaftar: "${judul}".`,
      perluDicurigai: false,
    };
  }
  if (cr.status === 0) {
    return {
      sourceId: item.sourceId ?? doi,
      verdict: "TIDAK_DAPAT_DIPERIKSA",
      sumber: null,
      catatan: "Tidak dapat menghubungi Crossref (jaringan/timeout). Coba lagi nanti.",
      perluDicurigai: false,
    };
  }

  // Crossref bilang tidak ada -> uji OpenAlex sebagai cadangan
  const oa = await ambil(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`);
  if (oa.status === 200 && oa.body) {
    const d = oa.body as Record<string, unknown>;
    return {
      sourceId: item.sourceId ?? doi,
      verdict: "TERVERIFIKASI",
      sumber: "openalex",
      judulDitemukan: String(d.title ?? ""),
      tahunDitemukan: d.publication_year ? String(d.publication_year) : "",
      doiDitemukan: doi,
      catatan: "DOI ditemukan di OpenAlex meski tidak ada di Crossref.",
      perluDicurigai: false,
    };
  }
  if (oa.status === 0) {
    return {
      sourceId: item.sourceId ?? doi,
      verdict: "TIDAK_DAPAT_DIPERIKSA",
      sumber: null,
      catatan: "Crossref menjawab tidak ditemukan, tetapi OpenAlex tidak dapat dihubungi. Belum bisa dipastikan.",
      perluDicurigai: false,
    };
  }
  return {
    sourceId: item.sourceId ?? doi,
    verdict: "TIDAK_DITEMUKAN",
    sumber: null,
    catatan: `DOI ${doi} tidak terdaftar di Crossref maupun OpenAlex. DOI ini kemungkinan besar karangan; periksa langsung ke penerbitnya.`,
    perluDicurigai: true,
  };
}

/**
 * Cari judul di DOAJ. Mengembalikan null bila tidak ada yang cukup mirip,
 * supaya pemanggil bisa lanjut ke verdict akhir.
 */
async function periksaDoaj(item: Item, judul: string): Promise<Hasil | null> {
  const q = encodeURIComponent(judul.slice(0, 200));
  const res = await ambil(`https://doaj.org/api/search/articles/${q}?pageSize=3`);
  if (res.status !== 200 || !res.body) return null;

  const hasil = (res.body as { results?: Record<string, unknown>[] }).results ?? [];
  let terbaik: { skor: number; judul: string; tahun: string; doi: string } | null = null;
  for (const r of hasil) {
    const bib = (r as { bibjson?: Record<string, unknown> }).bibjson;
    if (!bib) continue;
    const t = String(bib.title ?? "");
    const skor = kemiripanJudul(judul, t);
    if (!terbaik || skor > terbaik.skor) {
      const ids = (bib.identifier as { id?: string; type?: string }[] | undefined) ?? [];
      const doi = ids.find((x) => x.type === "doi")?.id ?? "";
      terbaik = { skor, judul: t, tahun: String(bib.year ?? ""), doi };
    }
  }
  if (!terbaik || terbaik.skor < 0.85) return null;

  return {
    sourceId: item.sourceId ?? judul.slice(0, 40),
    verdict: "KEMUNGKINAN_COCOK",
    sumber: "doaj",
    judulDitemukan: terbaik.judul,
    tahunDitemukan: terbaik.tahun,
    doiDitemukan: terbaik.doi || undefined,
    catatan: `Ditemukan di DOAJ (indeks jurnal akses-terbuka): "${terbaik.judul}"${terbaik.tahun ? ` (${terbaik.tahun})` : ""}. DOAJ mengindeks jurnal Indonesia yang sering tidak terdaftar di Crossref — cocokkan sendiri karena kesamaan judul bukan bukti dokumennya sama.`,
    perluDicurigai: false,
  };
}

async function periksaJudul(item: Item, judul: string): Promise<Hasil> {
  const diawasi = jenisDiawasiCrossref(item.documentType);
  const q = encodeURIComponent(judul.slice(0, 300));
  const cr = await ambil(
    `https://api.crossref.org/works?query.bibliographic=${q}&rows=3&select=title,DOI,issued`
  );
  if (cr.status === 0) {
    return {
      sourceId: item.sourceId ?? judul.slice(0, 40),
      verdict: "TIDAK_DAPAT_DIPERIKSA",
      sumber: null,
      catatan: "Tidak dapat menghubungi Crossref (jaringan/timeout).",
      perluDicurigai: false,
    };
  }
  const items =
    cr.status === 200 && cr.body
      ? ((cr.body as { message?: { items?: Record<string, unknown>[] } }).message?.items ?? [])
      : [];

  let terbaik: { skor: number; judul: string; tahun: string; doi: string } | null = null;
  for (const it of items) {
    const t = Array.isArray(it.title) ? String((it.title as string[])[0] ?? "") : "";
    const skor = kemiripanJudul(judul, t);
    if (!terbaik || skor > terbaik.skor) {
      terbaik = { skor, judul: t, tahun: tahunDariCrossref(it), doi: String(it.DOI ?? "") };
    }
  }

  if (terbaik && terbaik.skor >= 0.85) {
    return {
      sourceId: item.sourceId ?? judul.slice(0, 40),
      verdict: "KEMUNGKINAN_COCOK",
      sumber: "crossref",
      judulDitemukan: terbaik.judul,
      tahunDitemukan: terbaik.tahun,
      doiDitemukan: terbaik.doi || undefined,
      catatan: `Crossref memuat judul mirip: "${terbaik.judul}"${terbaik.tahun ? ` (${terbaik.tahun})` : ""}. Cocokkan sendiri karena kesamaan judul bukan bukti dokumennya sama.`,
      perluDicurigai: false,
    };
  }
  // Cadangan DOAJ: banyak jurnal Indonesia akses-terbuka terindeks di sini
  // meski belum mendaftarkan DOI di Crossref.
  if (perluCariDoaj("TIDAK_DITEMUKAN", item.documentType)) {
    const doaj = await periksaDoaj(item, judul);
    if (doaj) return doaj;
  }

  // Sumber belum terindeks, tetapi tautannya mungkin hidup. Cek halamannya dulu
  // supaya sumber asli tidak dilaporkan sama seperti sumber karangan.
  if (diawasi && item.url) {
    const jh = await judulHalaman(item.url);
    if (jh !== null) {
      const cocok = kandidatJudulHalaman(jh).some((k) => kemiripanJudul(judul, k) >= 0.85);
      return {
        sourceId: item.sourceId ?? judul.slice(0, 40),
        verdict: "TAUTAN_HIDUP",
        sumber: null,
        judulDitemukan: jh || undefined,
        catatan: jh
          ? `Halaman sumber dapat dibuka (judul halaman: "${jh}"). ${cocok ? "Judulnya cocok dengan sumber ini, tetapi" : "Judul halaman berbeda dari yang tertulis di paket, dan"} sumber ini belum terdaftar di Crossref, OpenAlex, maupun DOAJ — periksa isinya sebelum dipakai.`
          : "Halaman sumber dapat dibuka, tetapi judul halamannya tidak terbaca. Sumber ini belum terdaftar di Crossref, OpenAlex, maupun DOAJ — periksa isinya sebelum dipakai.",
        perluDicurigai: !cocok,
      };
    }
  }

  return {
    sourceId: item.sourceId ?? judul.slice(0, 40),
    verdict: "TIDAK_DITEMUKAN",
    sumber: "crossref",
    catatan: diawasi
      ? "Judul ini tidak ada di Crossref, OpenAlex, maupun DOAJ padahal jenisnya terbitan ilmiah. Masih ada jurnal nasional yang belum terindeks di ketiganya, jadi ini belum tentu sumber palsu — tetapi wajib dicocokkan ke laman jurnalnya sebelum dipakai."
      : `Jenis dokumen ini (${item.documentType ?? "tidak diketahui"}) tidak didaftarkan di Crossref, jadi tidak ditemukan itu wajar. Cek langsung ke situs resminya.`,
    perluDicurigai: diawasi,
  };
}

export async function POST(req: Request) {
  let body: { items?: Item[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Tidak ada sumber untuk diperiksa." }, { status: 400 });
  }

  const hasil: Hasil[] = [];
  for (const item of items) {
    // "-" / "N/A" bukan DOI: kalau diteruskan, Crossref menjawab "tidak ada"
    // dan sumber yang sebenarnya sah ikut dilaporkan palsu.
    const doi = doiSah(item.doi) || doiDariUrl(item.url || "");
    const judul = (item.title || "").trim();

    if (doi) {
      const r = await periksaDoi(item, doi);
      if (r) {
        hasil.push(r);
        continue;
      }
    }
    if (judul) {
      hasil.push(await periksaJudul(item, judul));
      continue;
    }
    hasil.push({
      sourceId: item.sourceId ?? "(tanpa id)",
      verdict: "TIDAK_DAPAT_DIPERIKSA",
      sumber: null,
      catatan: "Sumber tidak punya DOI maupun judul, jadi tidak ada yang bisa dicocokkan.",
      perluDicurigai: true,
    });
  }

  return NextResponse.json({ hasil });
}
