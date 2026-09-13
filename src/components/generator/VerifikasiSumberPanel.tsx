"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, FileDown } from "lucide-react";
import { keBibtex, namaFileAman } from "@/lib/ekspor";

/**
 * Tombol + panel "Periksa ke Crossref" (R-05).
 *
 * Satu komponen dipakai Tool 2, 3, 4 supaya perilakunya seragam. Pemeriksaan
 * dijalankan di server (/api/verify-source) agar tidak bergantung CORS.
 */

export interface SumberUntukDiperiksa {
  sourceId: string;
  title?: string;
  url?: string;
  doi?: string;
  documentType?: string;
  /** Kolom "Penulis & Tahun" dari register Tool 3, mis. "Yue Chen & Kan Wang (2024)". */
  authorsYear?: string;
  /** Nama publikasi/penerbit, mis. "Politika: Jurnal Ilmu Politik (UNDIP)". */
  publication?: string;
}

export interface HasilVerifikasiSumber {
  sourceId: string;
  verdict:
    | "TERVERIFIKASI"
    | "KEMUNGKINAN_COCOK"
    | "TAUTAN_HIDUP"
    | "TIDAK_DITEMUKAN"
    | "TIDAK_DAPAT_DIPERIKSA";
  sumber: "crossref" | "openalex" | "doaj" | null;
  judulDitemukan?: string;
  tahunDitemukan?: string;
  doiDitemukan?: string;
  catatan: string;
  perluDicurigai?: boolean;
  /** True bila OpenAlex menandai artikel ini sudah DITARIK. */
  ditarik?: boolean;
}

/**
 * Batas per permintaan ke server. Sumber yang lebih banyak dikirim bertahap
 * supaya tiap permintaan tetap cepat dan tidak kena timeout.
 */
const PER_PERMINTAAN = 10;

export function useVerifikasiSumber() {
  const [hasil, setHasil] = useState<Record<string, HasilVerifikasiSumber>>({});
  const [sedangProses, setSedangProses] = useState(false);
  const [catatan, setCatatan] = useState<string | null>(null);

  const periksa = async (daftar: SumberUntukDiperiksa[]) => {
    const bersih = daftar.filter((s) => (s.title || "").trim() || (s.doi || "").trim());
    if (bersih.length === 0) {
      setCatatan("Tidak ada sumber dengan judul atau DOI yang bisa diperiksa.");
      return;
    }
    setSedangProses(true);
    setCatatan(null);
    const map: Record<string, HasilVerifikasiSumber> = {};
    try {
      // Kirim bertahap; hasil tiap tahap langsung ditampilkan supaya user
      // melihat kemajuan, bukan layar diam selama puluhan detik.
      for (let i = 0; i < bersih.length; i += PER_PERMINTAAN) {
        const tahap = bersih.slice(i, i + PER_PERMINTAAN);
        const res = await fetch("/api/verify-source", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: tahap }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        for (const h of data.hasil ?? []) map[h.sourceId] = h;
        setHasil({ ...map });
        if (i + PER_PERMINTAAN < bersih.length) {
          setCatatan(`Memeriksa ${Math.min(i + PER_PERMINTAAN, bersih.length)} dari ${bersih.length} sumber...`);
        }
      }
      setCatatan(null);
    } catch {
      setCatatan(
        Object.keys(map).length > 0
          ? `Sebagian sumber sudah diperiksa (${Object.keys(map).length}). Sisanya gagal diperiksa — periksa koneksi lalu coba lagi.`
          : "Gagal menghubungi layanan verifikasi. Periksa koneksi internet."
      );
    } finally {
      setSedangProses(false);
    }
  };

  const reset = () => {
    setHasil({});
    setCatatan(null);
  };

  return { hasil, sedangProses, catatan, periksa, reset };
}

/** Tombol pemicu, dipakai berdampingan dengan daftar sumber. */
export function TombolPeriksaSumber({
  onClick,
  sedangProses,
  jumlah,
}: {
  onClick: () => void;
  sedangProses: boolean;
  jumlah: number;
}) {
  if (jumlah === 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={sedangProses}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#2959FF]/50 bg-[#2959FF]/15 px-3 py-1.5 text-xs font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 transition-colors disabled:opacity-50"
    >
      {sedangProses ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span>Memeriksa...</span>
        </>
      ) : (
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
          <span>Periksa ke Crossref</span>
        </>
      )}
    </button>
  );
}

/** Ringkasan hasil; dihitung dari hasil, bukan diketik manual. */
export function RingkasanVerifikasi({ hasil, catatan }: { hasil: Record<string, HasilVerifikasiSumber>; catatan: string | null }) {
  const nilai = Object.values(hasil);
  if (nilai.length === 0) return null;
  const hitung = (v: string) => nilai.filter((x) => x.verdict === v).length;
  const ditarik = nilai.filter((x) => x.ditarik).length;
  const perluCek = nilai.filter((x) => x.perluDicurigai && !x.ditarik).length;

  return (
    <div
      className={`rounded-lg border p-3 text-xs space-y-1.5 ${
        ditarik > 0 ? "border-rose-500/60 bg-rose-500/10" : "border-[#273352] bg-[#11182D]"
      }`}
    >
      <p className="font-semibold text-[#FFF9EE]">
        Hasil pemeriksaan {nilai.length} sumber (Crossref → OpenAlex → DOAJ):
      </p>
      {ditarik > 0 && (
        <p className="text-rose-200 font-bold leading-relaxed">
          {ditarik} sumber sudah DITARIK dari terbitan aslinya. Artikel yang ditarik tetap terdaftar di
          Crossref, jadi tanpa pemeriksaan ini ia akan terlihat aman. Jangan pakai sebagai dasar argumen —
          ganti dengan sumber lain.
        </p>
      )}
      <ul className="space-y-0.5 text-[#AAB4D0]">
        {hitung("TERVERIFIKASI") > 0 && <li>• {hitung("TERVERIFIKASI")} DOInya terdaftar resmi</li>}
        {hitung("KEMUNGKINAN_COCOK") > 0 && (
          <li>• {hitung("KEMUNGKINAN_COCOK")} judulnya mirip dengan yang ada di basis data</li>
        )}
        {hitung("TAUTAN_HIDUP") > 0 && (
          <li>• {hitung("TAUTAN_HIDUP")} tautannya hidup tetapi belum terdaftar di ketiga basis data</li>
        )}
        {hitung("TIDAK_DITEMUKAN") > 0 && (
          <li>• {hitung("TIDAK_DITEMUKAN")} tidak ada di ketiga basis data (sebagian wajar — lihat catatan)</li>
        )}
        {hitung("TIDAK_DAPAT_DIPERIKSA") > 0 && <li>• {hitung("TIDAK_DAPAT_DIPERIKSA")} tidak dapat diperiksa</li>}
      </ul>
      {catatan && <p className="text-[11.5px] text-[#F5A623]">{catatan}</p>}
      <p
        className={`text-[11.5px] leading-relaxed pt-1 border-t border-[#273352]/60 ${
          perluCek > 0 ? "text-rose-300 font-semibold" : "text-[#AAB4D0]"
        }`}
      >
        {perluCek > 0
          ? `${perluCek} sumber tandanya "PERIKSA" — jenisnya terbitan ilmiah tetapi tidak punya jejak di Crossref, OpenAlex, maupun DOAJ. Masih ada jurnal nasional yang belum terindeks di ketiganya, jadi ini belum tentu palsu — tetapi wajib dicocokkan ke laman jurnalnya sebelum dipakai.`
          : "Tidak ada sumber yang perlu dicurigai. Laporan perusahaan, regulasi, siaran pers, dan skripsi lokal memang tidak didaftarkan di basis data akademik, jadi tidak ditemukan itu wajar. Terdaftar juga bukan berarti isinya mendukung klaim."}
      </p>
    </div>
  );
}

/**
 * Unduh daftar pustaka (.bib) dari sumber yang sudah dikumpulkan.
 *
 * Tidak menunggu hasil verifikasi: DOI yang tidak ada di paket diisi dari hasil
 * pencocokan judul, jadi entri tetap punya penanda unik. Mendeley/Zotero
 * melengkapi penulis dan tahun sendiri dari DOI saat impor.
 */
export function TombolUnduhBibtex({
  daftar,
  hasil,
  klasifikasi,
}: {
  daftar: SumberUntukDiperiksa[];
  hasil?: Record<string, HasilVerifikasiSumber>;
  /** Kata pengenal untuk nama berkas, mis. "Tool-3". */
  klasifikasi?: string;
}) {
  if (daftar.length === 0) return null;

  const unduh = () => {
    const entri = daftar.map((s) => {
      const v = hasil?.[s.sourceId];
      return {
        sourceId: s.sourceId,
        title: s.title || v?.judulDitemukan,
        doi: s.doi || v?.doiDitemukan,
        year: v?.tahunDitemukan,
        url: s.url,
        // Nama penulis dari register Tool 3 — tanpa ini Mendeley menerima entri
        // berpenulis kosong walau datanya sudah ada sejak tahap pencarian literatur.
        author: s.authorsYear,
        journal: s.publication,
      };
    });
    const blob = new Blob([keBibtex(entri)], { type: "application/x-bibtex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = namaFileAman(`daftar-pustaka-${klasifikasi || "skriflow"}`, "bib");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={unduh}
      title="Impor berkas ini ke Mendeley / Zotero (File > Import)"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#080D1D] px-3 py-1.5 text-xs font-semibold text-[#AAB4D0] hover:border-[#2959FF] hover:text-[#FFF9EE] transition-colors"
    >
      <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Unduh Daftar Pustaka (.bib)</span>
    </button>
  );
}

/** Lencana kecil per sumber, ditampilkan di sebelah judul. */
export function LencanaVerifikasi({ hasil }: { hasil?: HasilVerifikasiSumber }) {
  if (!hasil) return null;
  const warna = hasil.ditarik
    ? "bg-rose-500/30 text-rose-200"
    : hasil.verdict === "TERVERIFIKASI"
    ? "bg-[#70E1B6]/20 text-[#70E1B6]"
    : hasil.perluDicurigai
    ? "bg-rose-500/20 text-rose-300"
    : hasil.verdict === "TAUTAN_HIDUP"
    ? "bg-[#F5A623]/20 text-[#F5C777]"
    : "bg-[#AAB4D0]/20 text-[#AAB4D0]";
  const label =
    hasil.ditarik
      ? "DITARIK"
      : hasil.verdict === "TERVERIFIKASI"
      ? "TERDAFTAR"
      : hasil.verdict === "KEMUNGKINAN_COCOK"
      ? "MIRIP"
      : hasil.verdict === "TAUTAN_HIDUP"
      ? hasil.perluDicurigai
        ? "TAUTAN HIDUP?"
        : "TAUTAN HIDUP"
      : hasil.verdict === "TIDAK_DITEMUKAN"
      ? hasil.perluDicurigai
        ? "PERIKSA"
        : "TIDAK DIAWASI"
      : "--";
  return (
    <span title={hasil.catatan} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${warna}`}>
      {label}
    </span>
  );
}
