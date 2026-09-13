"use client";

import { useState } from "react";
import { Sparkles, Loader2, BookMarked } from "lucide-react";
import {
  ambilTerkait,
  bacaKandidatJudul,
  bacaPaperTerkait,
  bacaRingkasanS2,
  bodyS2Batch,
  doiUntukRingkasan,
  idOpenAlexDariUrls,
  kumpulkanSemuaId,
  petaTerkait,
  RESOLVE_MAKS_SUMBER,
  URL_OPENALEX_CARI,
  URL_OPENALEX_TERKAIT,
  URL_RESOLVE_OPENALEX,
  URL_S2_BATCH,
  type PaperTerkait,
  type RingkasanPaper,
} from "@/lib/literaturTerkait";
import { doiSah, doiDariUrl } from "@/lib/sourceVerification";
import type { SumberUntukDiperiksa } from "./VerifikasiSumberPanel";

interface BarisHasil {
  sourceId: string;
  judul: string;
  /** DOI yang dipakai (dari paket atau hasil pencocokan judul). */
  doi?: string;
  dariPencarian: boolean;
  ringkasan?: string;
  terkait: PaperTerkait[];
}

/**
 * Ringkasan 1 kalimat + literatur terkait untuk tiap sumber.
 *
 * Berjalan untuk sumber TANPA DOI juga. Ini penting: sumber skripsi Indonesia
 * banyak yang tidak berDOI (laporan tahunan, siaran pers OJK, standar IAI), dan
 * versi pertama komponen ini diam saja untuk kasus itu — artinya fiturnya hilang
 * justru pada data yang paling sering dipakai mahasiswa.
 *
 * Jujur soal batas: sumber jenis laporan/regulasi memang tidak punya ringkasan
 * akademik, jadi barisnya diberi keterangan, bukan disembunyikan.
 */
export function PanelRingkasanDanTerkait({ daftar }: { daftar: SumberUntukDiperiksa[] }) {
  const [hasil, setHasil] = useState<BarisHasil[] | null>(null);
  const [sedang, setSedang] = useState(false);
  const [catatan, setCatatan] = useState<string | null>(null);

  const layak = daftar.filter((s) => (s.title || "").trim() || s.doi);
  if (layak.length === 0) return null;

  const ambil = async () => {
    setSedang(true);
    setCatatan(null);
    try {
      // --- Langkah 1: tentukan DOI tiap sumber -------------------------------
      const barisAwal: BarisHasil[] = layak.map((s) => ({
        sourceId: s.sourceId,
        judul: (s.title || "").trim(),
        doi: doiSah(s.doi) || doiDariUrl(s.url || "") || undefined,
        dariPencarian: false,
        terkait: [],
      }));

      const tanpaDoi = barisAwal.filter((b) => !b.doi && b.judul);
      // Peta per sourceId. JANGAN pakai array sejajar dengan barisAwal: dua loop di
      // bawah memasukkan sumber secara tidak berurutan, jadi indeks akan bergeser
      // dan karya serupa bisa menempel ke sumber yang salah.
      const idTerkaitPerSumber: Record<string, string[]> = {};

      // Sumber tanpa DOI: cari judulnya di OpenAlex. Satu permintaan per sumber,
      // dibatasi jumlahnya supaya halaman tidak menggantung untuk paket besar.
      for (const b of tanpaDoi.slice(0, RESOLVE_MAKS_SUMBER)) {
        try {
          const r = await fetch(URL_OPENALEX_CARI(b.judul));
          if (!r.ok) continue;
          const kandidat = bacaKandidatJudul(await r.json(), b.judul);
          if (kandidat.length === 0) continue;
          b.doi = kandidat[0].doi;
          b.dariPencarian = true;
          idTerkaitPerSumber[b.sourceId] = kandidat[0].relatedIds;
        } catch {
          // satu sumber gagal tidak boleh membatalkan sisanya
        }
      }

      // --- Langkah 2: ringkasan lewat SATU permintaan batch S2 ----------------
      const doiList = doiUntukRingkasan(barisAwal.map((b) => ({ doi: b.doi })));
      if (doiList.length > 0) {
        const res = await fetch(URL_S2_BATCH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyS2Batch(doiList),
        });
        if (res.ok) {
          const peta = bacaRingkasanS2(await res.json(), doiList);
          for (const b of barisAwal) {
            const kunci = doiSah(b.doi)?.toLowerCase();
            if (kunci && peta[kunci]) b.ringkasan = peta[kunci].ringkasan || undefined;
          }
        }
      }

      // --- Langkah 3: karya serupa -------------------------------------------
      // Sumber ber-DOI: ambil related_works langsung.
      for (const b of barisAwal) {
        if (b.dariPencarian || !b.doi) continue;
        try {
          const r = await fetch(URL_OPENALEX_TERKAIT(b.doi));
          if (!r.ok) continue;
          idTerkaitPerSumber[b.sourceId] = idOpenAlexDariUrls((await r.json())?.related_works);
        } catch {
          // abaikan
        }
      }

      const semuaId = kumpulkanSemuaId(Object.values(idTerkaitPerSumber));
      let petaPaper: Record<string, PaperTerkait> = {};
      if (semuaId.length > 0) {
        try {
          const r = await fetch(URL_RESOLVE_OPENALEX(semuaId));
          if (r.ok) petaPaper = petaTerkait(bacaPaperTerkait(await r.json()));
        } catch {
          // abaikan
        }
      }

      // Tempelkan karya serupa kembali ke sumber pemiliknya, lewat sourceId.
      for (const b of barisAwal) {
        const ids = idTerkaitPerSumber[b.sourceId];
        if (ids) b.terkait = ambilTerkait(petaPaper, ids);
      }

      setHasil(barisAwal);
    } catch {
      setCatatan(
        "Layanan ringkasan sedang tidak menjawab (jatah gratis habis atau tidak ada koneksi). Coba lagi beberapa menit lagi."
      );
      setHasil(null);
    } finally {
      setSedang(false);
    }
  };

  const adaRingkasan = hasil?.filter((b) => b.ringkasan).length ?? 0;
  const adaTerkait = hasil?.filter((b) => b.terkait.length > 0).length ?? 0;

  return (
    <div className="rounded-xl border border-[#2E2748] bg-[#191430] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-xs font-bold text-[#FBFAFF]">
          Ringkasan &amp; Literatur Terkait (gratis)
        </h5>
        <button
          type="button"
          onClick={ambil}
          disabled={sedang}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB84D]/50 bg-[#FFB84D]/10 px-3 py-1.5 text-xs font-semibold text-[#FFB84D] hover:bg-[#FFB84D]/20 disabled:opacity-50 transition-colors"
        >
          {sedang ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Mengambil...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Ambil Ringkasan &amp; Paper Serupa
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-[#A79FC4] leading-relaxed">
        Ringkasan berasal dari penulis/penerbit lewat Semantic Scholar — bukan hasil membacakan PDF-mu.
        Pakai untuk memilih bacaan mana yang layak dibuka, bukan sebagai isi kutipan. Sumber yang tidak
        punya DOI dicarikan dulu judulnya di OpenAlex; kalau tidak ketemu, sumber itu dibiarkan apa adanya.
      </p>

      {catatan && <p className="text-[11px] text-[#FF9E5E]">{catatan}</p>}

      {hasil && (
        <div className="space-y-2">
          <p className="text-[11px] text-[#A79FC4]">
            Diperiksa {hasil.length} sumber: {adaRingkasan} punya ringkasan, {adaTerkait} punya paper serupa.
          </p>
          <ul className="space-y-2">
            {hasil.map((b) => (
              <li
                key={b.sourceId}
                className="rounded-lg bg-[#0C0A1A] border border-[#2E2748]/60 p-2.5 space-y-1.5"
              >
                <p className="text-[11.5px] font-semibold text-[#FBFAFF]">
                  <span className="text-[#A79FC4]">{b.sourceId}</span> — {b.judul.slice(0, 120)}
                </p>

                {b.doi && (
                  <p className="text-[10.5px] text-[#A79FC4]">
                    DOI: <span className="text-[#FFB84D]">{b.doi}</span>
                    {b.dariPencarian && (
                      <span className="text-[#FF9E5E]"> — hasil pencocokan judul, cocokkan sendiri</span>
                    )}
                  </p>
                )}

                {b.ringkasan ? (
                  <p className="text-[11.5px] text-[#A79FC4] leading-relaxed">{b.ringkasan}</p>
                ) : (
                  <p className="text-[11px] text-[#A79FC4]/70">
                    {b.doi
                      ? "Belum ada ringkasan otomatis untuk artikel ini (sering terjadi pada terbitan Indonesia)."
                      : "Sumber ini tidak punya DOI dan judulnya tidak ditemukan di OpenAlex — wajar untuk laporan perusahaan, siaran pers, atau peraturan. Buka dokumennya langsung."}
                  </p>
                )}

                {b.terkait.length > 0 && (
                  <div className="pt-1 border-t border-[#2E2748]/40">
                    <p className="text-[11px] text-[#FFB84D] font-semibold flex items-center gap-1">
                      <BookMarked className="h-3 w-3" aria-hidden="true" />
                      Paper serupa (menurut sitasi bersama):
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {b.terkait.map((p) => (
                        <li key={p.openalexId} className="text-[11px] text-[#A79FC4]">
                          • {p.judul.slice(0, 110)}
                          {p.tahun ? ` (${p.tahun})` : ""}
                          {p.doi && (
                            <>
                              {" "}
                              <a
                                href={`https://doi.org/${p.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#6D5AE6] hover:underline"
                              >
                                [DOI]
                              </a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10.5px] text-[#A79FC4]/70 pt-0.5">
                      Karya serupa belum tentu cocok dengan topikmu — periksa judulnya dulu.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
