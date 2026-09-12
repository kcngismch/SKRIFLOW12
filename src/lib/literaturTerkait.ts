/**
 * Ringkasan otomatis + literatur terkait (Gelombang 3).
 *
 * Dua API gratis, tanpa key, CORS terbuka:
 * - Semantic Scholar: field `tldr` = ringkasan 1-2 kalimat per artikel, jadi
 *   mahasiswa tidak perlu membuka PDF 20 halaman untuk tahu artikelnya relevan.
 *   WAJIB batch POST: jatah anonim ±1 permintaan/detik, sedangkan `paper/search`
 *   sering langsung dijawab 429 tanpa key. Karena itu pencarian judul memakai
 *   OpenAlex, bukan S2.
 * - OpenAlex: `search` (cari DOI dari judul) + `related_works` (karya serupa).
 *
 * Realitas yang harus dihormati: banyak sumber skripsi Indonesia TIDAK punya DOI
 * (laporan tahunan, siaran pers OJK, standar IAI, peraturan). Sumber seperti itu
 * memang tidak akan punya ringkasan akademik — itu jawaban yang benar, bukan
 * kegagalan, dan harus dikatakan apa adanya ke mahasiswa.
 *
 * Fungsi pengurai di bawah murni (tanpa jaringan) supaya bisa dites langsung.
 */

import { doiSah, kemiripanJudul } from "./sourceVerification";

export const S2_MAKS_PER_BATCH = 500;
/** Sumber yang dicaritahu judulnya per sekali tekan. */
export const RESOLVE_MAKS_SUMBER = 8;
/** Id OpenAlex per satu permintaan resolve. */
export const RESOLVE_MAKS_ID = 50;
export const TERKAIT_MAKS_PER_SUMBER = 5;
/** Ambang kecocokan judul; sama dengan ambang verifikasi sumber. */
export const AMBANG_COCOK = 0.85;

export interface RingkasanPaper {
  doi: string;
  judul?: string;
  tahun?: string;
  ringkasan: string;
}

export interface PaperTerkait {
  openalexId: string;
  doi?: string;
  judul: string;
  tahun?: string;
}

// --- Semantic Scholar: ringkasan -------------------------------------------

export const URL_S2_BATCH =
  "https://api.semanticscholar.org/graph/v1/paper/batch?fields=title,tldr,year,externalIds";

export function doiUntukRingkasan(items: { doi?: string }[]): string[] {
  const keluar: string[] = [];
  for (const it of items) {
    const d = doiSah(it.doi);
    if (d && !keluar.includes(d)) keluar.push(d);
  }
  return keluar.slice(0, S2_MAKS_PER_BATCH);
}

/** Body POST S2: id berbentuk "DOI:<doi>". */
export function bodyS2Batch(daftarDoi: string[]): string {
  return JSON.stringify({ ids: daftarDoi.map((d) => `DOI:${d}`) });
}

/**
 * Baca respons S2 batch.
 *
 * PENTING: S2 mempertahankan URUTAN permintaan dan mengisi `null` untuk id yang
 * tidak ditemukan. Jadi pencocokan memakai indeks, BUKAN field di dalam hasil —
 * kalau salah, ringkasan artikel A bisa menempel ke artikel B.
 */
export function bacaRingkasanS2(body: unknown, daftarDoi: string[]): Record<string, RingkasanPaper> {
  const hasil: Record<string, RingkasanPaper> = {};
  if (!Array.isArray(body)) return hasil;

  body.forEach((entri, i) => {
    const doi = daftarDoi[i];
    if (!doi) return;
    const e = entri as { title?: unknown; year?: unknown; tldr?: { text?: unknown } } | null;
    const ringkasan = typeof e?.tldr?.text === "string" ? e.tldr.text.trim() : "";
    hasil[doi.toLowerCase()] = {
      doi,
      judul: e?.title ? String(e.title) : undefined,
      tahun: e?.year ? String(e.year) : undefined,
      ringkasan,
    };
  });
  return hasil;
}

export function cariRingkasan(peta: Record<string, RingkasanPaper>, doi?: string) {
  const d = doiSah(doi);
  return d ? peta[d.toLowerCase()] : undefined;
}

// --- OpenAlex: cari dari judul ---------------------------------------------

/** Cari karya menurut judul. Mengembalikan kandidat + id karya serupa. */
export const URL_OPENALEX_CARI = (judul: string) =>
  "https://api.openalex.org/works?per-page=3&select=doi,title,publication_year,related_works&search=" +
  encodeURIComponent(judul.slice(0, 300));

/** Karya serupa untuk DOI yang sudah diketahui. */
export const URL_OPENALEX_TERKAIT = (doi: string) =>
  `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?select=related_works`;

/** Ambil id OpenAlex (W123...) dari daftar URL, buang duplikat, batasi jumlah. */
export function idOpenAlexDariUrls(urls: unknown, maks = RESOLVE_MAKS_ID): string[] {
  if (!Array.isArray(urls)) return [];
  const keluar: string[] = [];
  for (const u of urls) {
    const m = /openalex\.org\/(W\d+)/.exec(String(u));
    if (m && !keluar.includes(m[1])) keluar.push(m[1]);
    if (keluar.length >= maks) break;
  }
  return keluar;
}

/** Satu permintaan untuk banyak id sekaligus (filter OR memang didukung di sini). */
export const URL_RESOLVE_OPENALEX = (ids: string[]) =>
  `https://api.openalex.org/works?per-page=${ids.length}` +
  `&select=doi,title,publication_year,id&filter=openalex_id:${ids.join("|")}`;

export interface KandidatJudul {
  doi: string;
  judul: string;
  tahun?: string;
  /** 0..1 — seberapa mirip dengan judul yang dicari. */
  skor: number;
  relatedIds: string[];
}

/**
 * Baca respons pencarian OpenAlex, kembalikan kandidat yang melewati ambang.
 *
 * Ambang dipakai supaya judul yang kebetulan mirip tidak dipasangkan — salah
 * pasang berarti ringkasan karya orang lain ditempelkan ke sumber mahasiswa.
 */
export function bacaKandidatJudul(body: unknown, judulDicari: string): KandidatJudul[] {
  const results = (body as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return [];

  const keluar: KandidatJudul[] = [];
  for (const r of results) {
    const w = r as { doi?: unknown; title?: unknown; publication_year?: unknown; related_works?: unknown };
    const judul = String(w.title ?? "").trim();
    const doi = String(w.doi ?? "").replace(/^https?:\/\/doi\.org\//, "");
    if (!judul || !doiSah(doi)) continue;
    const skor = kemiripanJudul(judulDicari, judul);
    if (skor < AMBANG_COCOK) continue;
    keluar.push({
      doi,
      judul,
      tahun: w.publication_year ? String(w.publication_year) : undefined,
      skor,
      relatedIds: idOpenAlexDariUrls(w.related_works, RESOLVE_MAKS_ID),
    });
  }
  return keluar.sort((a, b) => b.skor - a.skor);
}

/** Baca hasil resolve id OpenAlex jadi daftar paper; peta id -> paper. */
export function bacaPaperTerkait(body: unknown): PaperTerkait[] {
  const results = (body as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const keluar: PaperTerkait[] = [];
  for (const r of results) {
    const w = r as { id?: unknown; doi?: unknown; title?: unknown; publication_year?: unknown };
    const openalexId = String(w.id ?? "").split("/").pop() ?? "";
    const judul = String(w.title ?? "").trim();
    if (!openalexId || !judul) continue;
    keluar.push({
      openalexId,
      doi: String(w.doi ?? "").replace(/^https?:\/\/doi\.org\//, "") || undefined,
      judul,
      tahun: w.publication_year ? String(w.publication_year) : undefined,
    });
  }
  return keluar;
}

/** Peta openalexId -> paper, untuk menempelkan karya serupa kembali ke sumbernya. */
export function petaTerkait(daftar: PaperTerkait[]): Record<string, PaperTerkait> {
  const peta: Record<string, PaperTerkait> = {};
  for (const p of daftar) peta[p.openalexId] = p;
  return peta;
}

/** Ubah daftar id jadi daftar paper memakai peta, jaga urutan, batasi jumlah. */
export function ambilTerkait(peta: Record<string, PaperTerkait>, ids: string[]): PaperTerkait[] {
  const keluar: PaperTerkait[] = [];
  for (const id of ids) {
    const p = peta[id];
    if (p) keluar.push(p);
    if (keluar.length >= TERKAIT_MAKS_PER_SUMBER) break;
  }
  return keluar;
}

/** Kumpulkan semua id unik dari beberapa sumber sekaligus, dibatasi total. */
export function kumpulkanSemuaId(perSumber: string[][]): string[] {
  const keluar: string[] = [];
  for (const ids of perSumber) {
    for (const id of ids) {
      if (!keluar.includes(id)) keluar.push(id);
      if (keluar.length >= RESOLVE_MAKS_ID) return keluar;
    }
  }
  return keluar;
}
