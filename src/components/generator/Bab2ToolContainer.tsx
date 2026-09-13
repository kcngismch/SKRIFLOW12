"use client";

/**
 * Tool 6 — Bangun Bab 2 (Tinjauan Pustaka). Addendum D v3.3.4.
 *
 * Empat tahap, mengikuti peta D.2:
 *   Tahap 11 Peta Literatur (deterministik, tanpa AI)
 *   Tahap 12 Prompt 6A — Fondasi Bab 2         (ChatGPT/Gemini)
 *   Tahap 13 Prompt 6B — Draf Bab 2            (NotebookLM: berkas sumber + perintah pendek)
 *   Tahap 14 Prompt 6C — Poles Bahasa          (ChatGPT) — WAJIB, bukan opsional
 *
 * Gerbang antar-tahap sengaja nyata: 6A tidak boleh dijalankan sebelum peta ada,
 * 6B tidak boleh sebelum fondasi dikonfirmasi, 6C tidak boleh sebelum draf lolos
 * pemeriksa (temuan CRITICAL menahan).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileText,
  Info,
  Layers,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { extractSumberPaketLiteratur } from "@/lib/bedahParser";
import { bangunPetaBab2 } from "@/lib/bab2Map";
import {
  BAB2_TARGET_WORDS,
  BAB2_WORD_RANGE,
  parseBab2DraftTransfer,
  parseBab2FoundationTransfer,
  parseBab2PolishTransfer,
  strukturBakuBab2,
} from "@/lib/bab2Parser";
import {
  evaluasiGerbangBab2,
  evaluasiGerbangTahap13,
  periksaDrafBab2,
  periksaFondasiBab2,
  periksaPolesBab2,
  ringkasTemuanBab2,
} from "@/lib/bab2Checks";
import {
  analyzeBab2DraftShortCommand,
  assembleBab2DraftShortCommand,
  assembleBab2DraftSourceFile,
  assembleBab2FoundationPrompt,
  assembleBab2PolishPrompt,
  labelPendekatan,
  type Bab2PromptInput,
} from "@/lib/bab2Prompts";
import { eksporBab2Rtf } from "@/lib/bab2Ekspor";
import {
  clearSemuaBab2,
  loadBab1DraftV1,
  loadBab1FoundationV1,
  loadBab1PolishV1,
  loadBab2Draft,
  loadBab2DraftRaw,
  loadBab2Foundation,
  loadBab2FoundationRaw,
  loadBab2Pendekatan,
  loadBab2Polish,
  loadBab2PolishRaw,
  loadBedahDirectionV2,
  loadBedahDraft,
  loadSelectedDirectionId,
  loadSharedResearchContext,
  loadToolData,
  saveBab2Draft,
  saveBab2DraftRaw,
  saveBab2Foundation,
  saveBab2FoundationRaw,
  saveBab2Pendekatan,
  saveBab2Polish,
  saveBab2PolishRaw,
} from "@/lib/storage";
import { copyToClipboard } from "@/lib/clipboard";
import type { Bab2Finding, Bab2Pendekatan } from "@/types/bab2";
import type { HasilVerifikasiSumber } from "./VerifikasiSumberPanel";
import { RingkasanVerifikasi, useVerifikasiSumber } from "./VerifikasiSumberPanel";

// =========================================================================
// Komponen kecil
// =========================================================================

const Kartu: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6 ${className}`}>{children}</div>
);

const JudulTahap: React.FC<{ nomor: string; judul: string; keterangan?: string; platform?: string }> = ({
  nomor,
  judul,
  keterangan,
  platform,
}) => (
  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
    <div>
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[#2959FF]/30 bg-[#2959FF]/10 px-2 py-0.5 text-xs font-semibold text-[#70E1B6]">
          {nomor}
        </span>
        <h3 className="text-base font-bold text-[#FFF9EE]">{judul}</h3>
      </div>
      {keterangan && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#AAB4D0]">{keterangan}</p>}
    </div>
    {platform && <PlatformBadge platform={platform as never} size="sm" />}
  </div>
);

const TombolSalin: React.FC<{ teks: string; label: string; disabled?: boolean }> = ({ teks, label, disabled }) => {
  const [tersalin, setTersalin] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        const ok = await copyToClipboard(teks);
        if (ok) {
          setTersalin(true);
          setTimeout(() => setTersalin(false), 2200);
        }
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] transition-colors hover:bg-[#2959FF]/25 disabled:cursor-not-allowed disabled:border-[#273352] disabled:bg-transparent disabled:text-[#AAB4D0] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
    >
      {tersalin ? <CheckCircle2 className="h-3.5 w-3.5 text-[#70E1B6]" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      <span>{tersalin ? "Tersalin" : label}</span>
    </button>
  );
};

const DaftarTemuan: React.FC<{ temuan: Bab2Finding[]; judul: string }> = ({ temuan, judul }) => {
  if (temuan.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-[#70E1B6]/30 bg-[#70E1B6]/5 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#70E1B6]" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-[#FFF9EE]">
          {judul}: tidak ada pelanggaran. Semua pernyataan bersumber, klaim utuh, dan struktur sesuai rencana.
        </p>
      </div>
    );
  }
  const warna = (s: Bab2Finding["severity"]) =>
    s === "CRITICAL"
      ? "border-[#FF6F61]/40 bg-[#FF6F61]/5 text-[#FF6F61]"
      : s === "MAJOR"
        ? "border-[#FFB84D]/40 bg-[#FFB84D]/5 text-[#FFB84D]"
        : "border-[#273352] bg-[#080D1D] text-[#AAB4D0]";
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#FFF9EE]">
        {judul}: {temuan.length} temuan
      </p>
      {temuan.map((f, i) => (
        <div key={`${f.code}-${i}`} className={`rounded-lg border p-3 ${warna(f.severity)}`}>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span>{f.severity}</span>
            <span className="opacity-60">·</span>
            <span className="opacity-80">{f.where}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#FFF9EE]">{f.message}</p>
          {f.evidence_excerpt && (
            <p className="mt-1.5 border-l-2 border-[#273352] pl-2 text-[11px] italic leading-relaxed text-[#AAB4D0]">
              “{f.evidence_excerpt}”
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// =========================================================================
// Komponen utama
// =========================================================================

export const Bab2ToolContainer: React.FC = () => {
  const [siap, setSiap] = useState(false);
  const [pendekatan, setPendekatan] = useState<Bab2Pendekatan>("BELUM_DITENTUKAN");
  const [teks6A, setTeks6A] = useState("");
  const [teks6B, setTeks6B] = useState("");
  const [teks6C, setTeks6C] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string[]>([]);
  const [sedangVerifikasi, setSedangVerifikasi] = useState(false);
  const { hasil: hasilVerifikasi, catatan: catatanVerifikasi, periksa: periksaSumber } = useVerifikasiSumber();

  // ---- State tersimpan ----
  const [paketLiteratur, setPaketLiteratur] = useState("");
  const [fondasiBab1Teks, setFondasiBab1Teks] = useState("");
  const [arahTerpilih, setArahTerpilih] = useState<{ nama: string }>({ nama: "" });
  const [prodi, setProdi] = useState("");
  const [areaEksplorasi, setAreaEksplorasi] = useState("");

  const [fondasiBab2, setFondasiBab2] = useState(loadBab2Foundation());
  const [drafBab2, setDrafBab2] = useState(loadBab2Draft());
  const [polesBab2, setPolesBab2] = useState(loadBab2Polish());
  const [konfirmasiFondasi, setKonfirmasiFondasi] = useState(false);
  const [gerbang, setGerbang] = useState(() =>
    evaluasiGerbangBab2({ foundation: null, draft: null, polish: null })
  );

  useEffect(() => {
    const paket = loadBedahDraft();
    const fondasi1 = loadBab1FoundationV1();
    const dir = loadBedahDirectionV2();
    const idTerpilih = loadSelectedDirectionId();
    const pendekatanTersimpan = loadBab2Pendekatan();
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");

    // D.2.1: gerbang butuh TIGA artifact Bab 1, bukan satu.
    setGerbang(evaluasiGerbangBab2({
      foundation: fondasi1,
      draft: loadBab1DraftV1(),
      polish: loadBab1PolishV1(),
    }));

    setPaketLiteratur(paket);
    setFondasiBab1Teks(fondasi1 ? JSON.stringify(fondasi1) : "");
    setTeks6A(loadBab2FoundationRaw());
    setTeks6B(loadBab2DraftRaw());
    setTeks6C(loadBab2PolishRaw());
    if (pendekatanTersimpan) setPendekatan(pendekatanTersimpan as Bab2Pendekatan);

    // Prodi & area: sama seperti Tool 5 — konteks riset bersama, fallback Tool 3.
    setProdi(shared?.prodi || t3Data?.prodi || "");
    setAreaEksplorasi(shared?.selectedArea || shared?.area_eksplorasi || t3Data?.area_eksplorasi || "");

    if (dir) {
      const dipilih = (dir.directions || []).find((d) => d.id === idTerpilih) || dir.directions?.[0];
      if (dipilih) {
        setArahTerpilih({ nama: dipilih.name || dipilih.id || "" });
        // Pendekatan ikut rancangan yang diusulkan arah terpilih bila mahasiswa
        // belum memilih manual. Ini usulan, bukan keputusan: tombolnya tetap di
        // tangan mahasiswa dan bisa diganti kapan saja.
        const rancangan = (dipilih.possible_design_families || []).join(" ");
        if (!pendekatanTersimpan && rancangan && /verifik|kuantitat|eksperim|uji hipotesis/i.test(rancangan)) {
          setPendekatan("VERIFIKATIF");
          saveBab2Pendekatan("VERIFIKATIF");
        }
      }
    }
    setSiap(true);
  }, []);

  const register = useMemo(() => extractSumberPaketLiteratur(paketLiteratur), [paketLiteratur]);
  const fondasi4B = useMemo(() => {
    if (!fondasiBab1Teks) return null;
    try {
      return JSON.parse(fondasiBab1Teks);
    } catch {
      return null;
    }
  }, [fondasiBab1Teks]);
  const peta = useMemo(() => bangunPetaBab2(register), [register]);

  // Rumusan masalah yang dipakai 6A/6B berasal dari fondasi Bab 1 (Tool 5),
  // bukan dari DirectionV2 — di situ hanya ada problem_focus, bukan rumusan.
  const rumusanMasalah = useMemo<string[]>(() => {
    const kandidat = (fondasi4B as { candidate_research_questions?: { question?: string }[] } | null)
      ?.candidate_research_questions;
    return (kandidat || []).map((q) => q.question || "").filter(Boolean);
  }, [fondasi4B]);

  const inputPrompt: Bab2PromptInput = useMemo(
    () => ({
      prodi,
      areaEksplorasi,
      pendekatan,
      peta,
      register,
      foundation: fondasi4B,
      arahPenelitian: arahTerpilih.nama,
      rumusanMasalah,
    }),
    [prodi, areaEksplorasi, pendekatan, peta, register, fondasi4B, arahTerpilih, rumusanMasalah]
  );

  // ---- Temuan ----
  const temuanFondasi = useMemo(
    () => (fondasiBab2 ? periksaFondasiBab2(fondasiBab2, register, fondasi4B) : []),
    [fondasiBab2, register, fondasi4B]
  );
  const temuanDraf = useMemo(
    () => (drafBab2 && fondasiBab2 ? periksaDrafBab2(drafBab2, fondasiBab2, register, fondasi4B) : []),
    [drafBab2, fondasiBab2, register, fondasi4B]
  );
  const temuanPoles = useMemo(
    () => (polesBab2 && drafBab2 ? periksaPolesBab2(polesBab2, drafBab2) : []),
    [polesBab2, drafBab2]
  );

  const ringkasFondasi = ringkasTemuanBab2(temuanFondasi);
  const ringkasDraf = ringkasTemuanBab2(temuanDraf);
  const ringkasPoles = ringkasTemuanBab2(temuanPoles);

  // ---- Aksi ----
  const pilihPendekatan = (p: Bab2Pendekatan) => {
    setPendekatan(p);
    saveBab2Pendekatan(p);
  };

  const proses6A = () => {
    setGalat(null);
    const hasil = parseBab2FoundationTransfer(teks6A);
    if (!hasil.success || !hasil.data) {
      setGalat(hasil.error || "Gagal membaca fondasi.");
      setPesan(hasil.errorDetails || []);
      return;
    }
    saveBab2Foundation(hasil.data);
    setFondasiBab2(hasil.data);
    setKonfirmasiFondasi(false);
    setPesan(hasil.warnings || []);
  };

  const proses6B = async () => {
    setGalat(null);
    if (!fondasiBab2) return;
    const hasil = parseBab2DraftTransfer(teks6B, { foundation: fondasiBab2 });
    if (!hasil.success || !hasil.data) {
      setGalat(hasil.error || "Gagal membaca draf.");
      setPesan(hasil.errorDetails || []);
      return;
    }
    saveBab2Draft(hasil.data);
    setDrafBab2(hasil.data);
    setPesan(hasil.warnings || []);

    // Pemeriksaan sumber otomatis (sama seperti Tool 5): hasilnya langsung terlihat,
    // tidak perlu klik. Sumber diambil dari register — bukan dari draf — supaya
    // yang diperiksa tetap sumber yang sudah diverifikasi.
    setSedangVerifikasi(true);
    await periksaSumber(
      register.map((s) => ({
        sourceId: s.sourceId,
        title: s.title,
        url: s.url,
        doi: s.doi,
        documentType: s.documentType,
        authorsYear: s.authorsYear,
        publication: s.publication,
      }))
    );
    setSedangVerifikasi(false);
  };

  const proses6C = () => {
    setGalat(null);
    if (!drafBab2) return;
    const hasil = parseBab2PolishTransfer(teks6C, { draft: drafBab2 });
    if (!hasil.success || !hasil.data) {
      setGalat(hasil.error || "Gagal membaca hasil poles.");
      setPesan(hasil.errorDetails || []);
      return;
    }
    saveBab2Polish(hasil.data);
    setPolesBab2(hasil.data);
    setPesan(hasil.warnings || []);
  };

  const unduhBerkasSumber6B = useCallback(() => {
    const isi = assembleBab2DraftSourceFile(inputPrompt);
    const blob = new Blob([isi], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skriflow-berkas-sumber-6B-${(prodi || "bab2").replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // revokeObjectURL dipanggil langsung setelah click() membatalkan unduhan
    // sebelum Chromium selesai membaca blob (gejala: .crdownload menggantung).
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [inputPrompt, prodi]);

  const unduhRtf = useCallback(() => {
    const sumberTeks = polesBab2 || drafBab2;
    if (!sumberTeks) return;
    const blok = eksporBab2Rtf(sumberTeks, { judul: "BAB II — TINJAUAN PUSTAKA", prodi, foundation: fondasiBab2 });
    const blob = new Blob([blok], { type: "application/rtf;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bab-2-${(prodi || "skriflow").replace(/\s+/g, "-")}.rtf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [polesBab2, drafBab2, prodi, fondasiBab2]);

  const reset = () => {
    clearSemuaBab2();
    setFondasiBab2(null);
    setDrafBab2(null);
    setPolesBab2(null);
    setTeks6A("");
    setTeks6B("");
    setTeks6C("");
    setKonfirmasiFondasi(false);
    setGalat(null);
    setPesan([]);
  };

  if (!siap) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-[#AAB4D0]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Memuat data Bab 2…</span>
      </div>
    );
  }

  // ---- Gerbang: sumber & pendekatan ----
  const gerbangSumber = peta.map_status === "MAP_BLOCKED";
  const gerbangPendekatan = pendekatan === "BELUM_DITENTUKAN";
  const bab1Terblokir = gerbang.status === "BLOKIR";
  // B2-11/B2-12: status blokir fondasi Bab 2 & peta harus menahan Tahap 13 juga,
  // bukan cuma Tahap 12. Sebelumnya mahasiswa bisa menulis draf penuh di atas
  // register yang tool sendiri nyatakan tidak cukup.
  const gerbang13 = evaluasiGerbangTahap13({
    map_status: peta.map_status,
    foundation_status: fondasiBab2?.foundation_status,
    pendekatan,
  });

  return (
    <div className="mt-8 space-y-6">
      {/* Gerbang D.2.1 — Bab 2 hanya boleh dibuka bila Bab 1 selesai. */}
      {gerbang.status === "BLOKIR" ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#FF6F61]/50 bg-[#FF6F61]/5 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6F61]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-[#FFF9EE]">
              Bab 2 belum bisa dibuka — {gerbang.ringkas}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#AAB4D0]">
              {gerbang.alasan.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-[#FFF9EE]">{gerbang.tindakan}</p>
          </div>
        </div>
      ) : gerbang.status === "PERINGATAN" ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/5 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFB84D]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-[#FFF9EE]">Bab 1 belum sepenuhnya final</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#AAB4D0]">
              {gerbang.alasan.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-[#FFF9EE]">{gerbang.tindakan}</p>
          </div>
        </div>
      ) : null}

      {/* Ringkasan peta literatur — Tahap 11 */}
      <Kartu>
        <JudulTahap
          nomor="Tahap 11"
          judul="Peta Literatur & Tabel Penelitian Terdahulu"
          keterangan="Dibuat otomatis oleh tool dari Source Register Tool 3 — tanpa AI, jadi tidak ada sel yang bisa dikarang. Kolom yang tidak ada di register ditandai TIDAK TERCATAT; kamu yang melengkapinya dengan membaca sumbernya."
        />
        {gerbangSumber ? (
          <div className="flex items-start gap-2 rounded-lg border border-[#FF6F61]/40 bg-[#FF6F61]/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6F61]" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[#FFF9EE]">{peta.status_reason}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Sumber terbaca", nilai: peta.source_count },
                { label: "Siap disitasi", nilai: peta.prior_research_table.filter((b) => b.author && b.year).length },
                { label: "Dipakai di Bab 1", nilai: peta.source_coverage.filter((c) => c.dipakai_di_bab1).length },
                { label: "Target kata", nilai: `${BAB2_WORD_RANGE[0]}–${BAB2_WORD_RANGE[1]}` },
              ].map((k) => (
                <div key={k.label} className="rounded-lg border border-[#273352] bg-[#080D1D] p-3">
                  <p className="text-[11px] text-[#AAB4D0]">{k.label}</p>
                  <p className="mt-0.5 text-lg font-bold text-[#FFF9EE]">{k.nilai}</p>
                </div>
              ))}
            </div>

            {peta.map_notes.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {peta.map_notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-[#AAB4D0]">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 overflow-x-auto rounded-lg border border-[#273352]">
              <table className="w-full min-w-[640px] text-left text-[11px]">
                <thead className="bg-[#080D1D] text-[#AAB4D0]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">ID</th>
                    <th className="px-3 py-2 font-semibold">Penulis & Tahun</th>
                    <th className="px-3 py-2 font-semibold">Judul</th>
                    <th className="px-3 py-2 font-semibold">Venue</th>
                    <th className="px-3 py-2 font-semibold">Metode</th>
                    <th className="px-3 py-2 font-semibold">Hasil</th>
                  </tr>
                </thead>
                <tbody className="text-[#FFF9EE]">
                  {peta.prior_research_table.map((b) => (
                    <tr key={b.source_id} className="border-t border-[#273352]">
                      <td className="px-3 py-2 align-top font-semibold text-[#70E1B6]">{b.source_id}</td>
                      <td className="px-3 py-2 align-top">
                        {b.authors_year || <span className="italic text-[#AAB4D0]">TIDAK TERCATAT</span>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {b.title || <span className="italic text-[#AAB4D0]">TIDAK TERCATAT</span>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {b.venue || <span className="italic text-[#AAB4D0]">TIDAK TERCATAT</span>}
                      </td>
                      {/* Dua kolom ini SELALU TIDAK TERCATAT: register Tool 3 tidak
                          memuatnya. Ditampilkan, bukan disembunyikan — kolom inilah
                          yang paling sering diminta dosen. Mahasiswa melengkapinya
                          dengan membaca sumbernya. */}
                      <td className="px-3 py-2 align-top">
                        <span className="italic text-[#FFB84D]">TIDAK TERCATAT</span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="italic text-[#FFB84D]">TIDAK TERCATAT</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#AAB4D0]">
              Dua kolom terakhir (<span className="text-[#FFB84D]">Metode</span> dan{" "}
              <span className="text-[#FFB84D]">Hasil</span>) selalu bertanda TIDAK TERCATAT — Source Register Tool 3 memang tidak
              memuatnya. Lengkapi dengan membaca sumbernya lalu salin ke tabel di Word; itu pekerjaanmu, bukan AI. Kalau kamu
              mengisinya di tool ini, sebutkan dari mana kamu membacanya — isian tanpa jejak bacaan akan ditandai.
            </p>
          </>
        )}
      </Kartu>

      {/* Pendekatan penelitian — menentukan ada/tidaknya Hipotesis (D.8) */}
      <Kartu>
        <JudulTahap
          nomor="Wajib"
          judul="Pendekatan Penelitian"
          keterangan="Struktur Bab 2 bergantung pada pendekatanmu. Rancangan deskriptif/kualitatif TIDAK memakai hipotesis — menambahkannya adalah kesalahan metodologis yang biasanya ketahuan di sidang."
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["VERIFIKATIF", labelPendekatan("VERIFIKATIF")],
              ["DESKRIPTIF", labelPendekatan("DESKRIPTIF")],
              ["KAJIAN_LITERATUR", labelPendekatan("KAJIAN_LITERATUR")],
            ] as [Bab2Pendekatan, string][]
          ).map(([nilai, label]) => (
            <button
              key={nilai}
              type="button"
              onClick={() => pilihPendekatan(nilai)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none ${
                pendekatan === nilai
                  ? "border-[#2959FF] bg-[#2959FF]/20 text-[#FFF9EE]"
                  : "border-[#273352] bg-[#080D1D] text-[#AAB4D0] hover:border-[#2959FF]/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {pendekatan !== "BELUM_DITENTUKAN" && (
          <p className="mt-3 text-[11px] leading-relaxed text-[#AAB4D0]">
            Sub-bab yang akan dibangun:{" "}
            <span className="font-semibold text-[#FFF9EE]">{strukturBakuBab2(pendekatan).join(" → ")}</span>
            {!strukturBakuBab2(pendekatan).includes("Hipotesis") && (
              <span className="ml-1 text-[#70E1B6]">— tanpa Hipotesis.</span>
            )}
          </p>
        )}
      </Kartu>

      {/* Tahap 12 — Fondasi (6A) */}
      <Kartu>
        <JudulTahap
          nomor="Tahap 12"
          judul="Prompt 6A — Susun Fondasi Bab 2"
          keterangan="Menghasilkan PETA: pembagian sub-bab, daftar teori beserta sumbernya, dan ledger klaim. Bukan prosa."
          platform="ChatGPT / Gemini"
        />
        {bab1Terblokir ? (
          <p className="text-xs text-[#AAB4D0]">Selesaikan dulu Bab 1 di Tool 5 — lihat pesan di atas.</p>
        ) : gerbangSumber || gerbangPendekatan ? (
          <p className="text-xs text-[#AAB4D0]">
            Selesaikan dulu sumber register dan pendekatan penelitian di atas.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <TombolSalin
                teks={assembleBab2FoundationPrompt(inputPrompt)}
                label="Salin Prompt 6A"
                disabled={bab1Terblokir}
              />
              <span className="text-[11px] text-[#AAB4D0]">
                {assembleBab2FoundationPrompt(inputPrompt).length.toLocaleString("id-ID")} karakter
              </span>
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#FFF9EE]" htmlFor="bab2-6a">
              Tempelkan output 6A (blok SKRIFLOW_BAB2_FOUNDATION_V1):
            </label>
            <textarea
              id="bab2-6a"
              value={teks6A}
              onChange={(e) => {
                setTeks6A(e.target.value);
                saveBab2FoundationRaw(e.target.value);
              }}
              rows={7}
              className="mt-2 w-full rounded-lg border border-[#273352] bg-[#080D1D] p-3 font-mono text-[11px] text-[#FFF9EE] focus:border-[#2959FF] focus:outline-none"
              placeholder="=== BEGIN SKRIFLOW_BAB2_FOUNDATION_V1 === … === END SKRIFLOW_BAB2_FOUNDATION_V1 ==="
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={proses6A}
                className="rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
              >
                Proses Fondasi Bab 2
              </button>
              {fondasiBab2 && (
                <span className="text-[11px] text-[#70E1B6]">
                  Tersimpan · {fondasiBab2.structure_blueprint.length} sub-bab · {fondasiBab2.claim_ledger.length} klaim
                </span>
              )}
            </div>

            {galat && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#FF6F61]/40 bg-[#FF6F61]/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6F61]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-[#FFF9EE]">{galat}</p>
                  {pesan.length > 0 && (
                    <ul className="mt-1 list-disc pl-4 text-[11px] text-[#AAB4D0]">
                      {pesan.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {!galat && pesan.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {pesan.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-[#AAB4D0]">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {fondasiBab2 && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-md border border-[#273352] bg-[#080D1D] px-2 py-1 font-semibold text-[#FFF9EE]">
                    {fondasiBab2.foundation_status}
                  </span>
                  <span className="text-[#AAB4D0]">{labelPendekatan(fondasiBab2.pendekatan)}</span>
                </div>
                <DaftarTemuan temuan={temuanFondasi} judul="Pemeriksa fondasi" />
                {ringkasFondasi.kritis === 0 && (
                  <label className="flex items-start gap-2 text-[11px] leading-relaxed text-[#AAB4D0]">
                    <input
                      type="checkbox"
                      checked={konfirmasiFondasi}
                      onChange={(e) => setKonfirmasiFondasi(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Saya sudah membaca pembagian sub-bab, daftar teori, dan klaim di atas. Kerangka pemikiran serta hipotesis di
                      dalamnya masih <span className="font-semibold text-[#FFF9EE]">usulan</span> — keputusan akhir milik saya.
                    </span>
                  </label>
                )}
              </div>
            )}
          </>
        )}
      </Kartu>

      {/* Tahap 13 — Draf (6B) */}
      {fondasiBab2 && konfirmasiFondasi && gerbang13.status === "BLOKIR" && (
        <Kartu>
          <JudulTahap
            nomor="Tahap 13"
            judul="Prompt 6B — Tulis Draf Bab 2"
            keterangan="Ditulis di NotebookLM karena ia yang memegang sumbermu."
            platform="NotebookLM"
          />
          <div className="flex items-start gap-3 rounded-xl border border-[#FF6F61]/50 bg-[#FF6F61]/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6F61]" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-[#FFF9EE]">Draf Bab 2 belum boleh ditulis</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#AAB4D0]">
                {gerbang13.alasan.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#FFF9EE]">{gerbang13.tindakan}</p>
            </div>
          </div>
        </Kartu>
      )}

      {fondasiBab2 && konfirmasiFondasi && gerbang13.status !== "BLOKIR" && (
        <Kartu>
          <JudulTahap
            nomor="Tahap 13"
            judul="Prompt 6B — Tulis Draf Bab 2"
            keterangan="Ditulis di NotebookLM karena ia yang memegang sumbermu. Berkas sumber diunggah lebih dulu, lalu perintah pendek dikirim di kolom chat."
            platform="NotebookLM"
          />

          {gerbang13.status === "PERINGATAN" && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/5 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFB84D]" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-[#FFF9EE]">Fondasi Bab 2 belum sepenuhnya pasti</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-[#AAB4D0]">
                  {gerbang13.alasan.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#FFF9EE]">{gerbang13.tindakan}</p>
              </div>
            </div>
          )}

          {/* Addendum D (sama seperti 4C): seluruh aturan jadi berkas sumber, kolom chat hanya perintah pendek. */}
          <ol className="space-y-2 text-xs leading-relaxed text-[#FFF9EE]">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#70E1B6]">1.</span>
              <div>
                <button
                  type="button"
                  onClick={unduhBerkasSumber6B}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3 py-1.5 text-[11px] font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Berkas Sumber 6B
                </button>
                <p className="mt-1 text-[11px] text-[#AAB4D0]">
                  Unggah berkas ini ke NotebookLM sebagai <span className="font-semibold">sumber</span>.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#70E1B6]">2.</span>
              <div>
                <TombolSalin teks={assembleBab2DraftShortCommand(inputPrompt)} label="Salin Perintah Pendek 6B" />
                <p className="mt-1 text-[11px] text-[#AAB4D0]">
                  {analyzeBab2DraftShortCommand(inputPrompt).finalLength} karakter — aman untuk kolom chat NotebookLM.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#70E1B6]">3.</span>
              <span>Tempelkan perintah itu di kolom chat NotebookLM, lalu tunggu sampai selesai menulis.</span>
            </li>
          </ol>

          <label className="mt-4 block text-xs font-semibold text-[#FFF9EE]" htmlFor="bab2-6b">
            Tempelkan hasil 6B (blok SKRIFLOW_BAB2_DRAFT_V1):
          </label>
          <textarea
            id="bab2-6b"
            value={teks6B}
            onChange={(e) => {
              setTeks6B(e.target.value);
              saveBab2DraftRaw(e.target.value);
            }}
            rows={7}
            className="mt-2 w-full rounded-lg border border-[#273352] bg-[#080D1D] p-3 font-mono text-[11px] text-[#FFF9EE] focus:border-[#2959FF] focus:outline-none"
            placeholder="=== BEGIN SKRIFLOW_BAB2_DRAFT_V1 === … === END SKRIFLOW_BAB2_DRAFT_V1 ==="
          />
          <div className="mt-2">
            <button
              type="button"
              onClick={proses6B}
              disabled={sedangVerifikasi}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              {sedangVerifikasi && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verifikasi Draf Bab 2
            </button>
          </div>

          {drafBab2 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#AAB4D0]">
                <span className="rounded-md border border-[#273352] bg-[#080D1D] px-2 py-1 font-semibold text-[#FFF9EE]">
                  {drafBab2.draft_status}
                </span>
                <span>
                  {drafBab2.word_count_total} kata dari target {drafBab2.target_words_total}
                </span>
              </div>
              <DaftarTemuan temuan={temuanDraf} judul="Pemeriksa draf" />

              {/* B2-13: D.11 ditegakkan sebagai ALUR, bukan cuma larangan. Temuan
                  saja tidak cukup — mahasiswa perlu tahu langkah berikutnya, kalau
                  tidak yang paling mudah dilakukan adalah menghapus sitasinya. */}
              {drafBab2.new_sources_introduced.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/5 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFB84D]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-[#FFF9EE]">
                      {drafBab2.new_sources_introduced.length} sumber baru muncul di draf — belum boleh disitasi
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-[#AAB4D0]">
                      {drafBab2.new_sources_introduced.map((s, i) => (
                        <li key={i}>
                          <span className="font-semibold text-[#FFF9EE]">{s.authors_year || s.id_sementara}</span>
                          {s.title ? ` — ${s.title}` : ""}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#FFF9EE]">
                      Langkah berikutnya: masukkan sumber itu lewat pencarian di Tool 3, jalankan penyaringan dan
                      verifikasi sampai masuk Source Register, baru boleh disitasi. Jangan hapus sitasinya hanya
                      supaya temuan ini hilang, dan jangan biarkan sumber ini di dalam naskah.
                    </p>
                    <a
                      href="/tools/cari-literatur-awal"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3 py-1.5 text-[11px] font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
                    >
                      Buka Tool 3 — Cari Literatur
                    </a>
                  </div>
                </div>
              )}

              {ringkasDraf.kritis === 0 && (
                <div className="space-y-3 border-t border-[#273352] pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TombolSalin
                      teks={assembleBab2PolishPrompt({ prodi, areaEksplorasi, draft: drafBab2, foundation: fondasiBab2 })}
                      label="Salin Prompt 6C (Poles Bahasa)"
                    />
                    <span className="text-[11px] text-[#AAB4D0]">
                      Langkah 5: buka ChatGPT — bahasa NotebookLM selalu kaku, tahap ini wajib.
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#273352] bg-[#080D1D] p-3">
                    {drafBab2.background.map((p) => (
                      <div key={p.order} className="mb-3 last:mb-0">
                        <p className="text-[11px] font-semibold text-[#70E1B6]">
                          {p.order}. {p.sub_bab}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#FFF9EE]">{p.paragraph_text}</p>
                        {p.claim_ids.length > 0 && (
                          <p className="mt-1 text-[10px] text-[#AAB4D0]">klaim: {p.claim_ids.join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Kartu>
      )}

      {/* Tahap 14 — Poles bahasa (6C) — WAJIB */}
      {drafBab2 && (
        <Kartu>
          <JudulTahap
            nomor="Tahap 14"
            judul="Prompt 6C — Poles Bahasa Draf Bab 2 (Wajib)"
            keterangan="Tahap ini hanya boleh mengubah bahasa. Klaim, angka, sitasi, dan claim_ids dikunci — perubahan peta klaim dianggap pelanggaran batas bukti."
            platform="ChatGPT / Gemini"
          />
          <label className="block text-xs font-semibold text-[#FFF9EE]" htmlFor="bab2-6c">
            Tempelkan hasil 6C (blok SKRIFLOW_BAB2_POLISH_V1):
          </label>
          <textarea
            id="bab2-6c"
            value={teks6C}
            onChange={(e) => {
              setTeks6C(e.target.value);
              saveBab2PolishRaw(e.target.value);
            }}
            rows={7}
            className="mt-2 w-full rounded-lg border border-[#273352] bg-[#080D1D] p-3 font-mono text-[11px] text-[#FFF9EE] focus:border-[#2959FF] focus:outline-none"
            placeholder="=== BEGIN SKRIFLOW_BAB2_POLISH_V1 === … === END SKRIFLOW_BAB2_POLISH_V1 ==="
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={proses6C}
              className="rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              Proses Hasil Poles
            </button>
            {polesBab2 && (
              <span className="text-[11px] text-[#70E1B6]">
                Tersimpan · {polesBab2.word_count_total} kata · {polesBab2.changed_sections.length} sub-bab dipoles
              </span>
            )}
          </div>

          {polesBab2 && (
            <div className="mt-4 space-y-3">
              <DaftarTemuan temuan={temuanPoles} judul="Pemeriksa perubahan bahasa" />

              {/* Dua pemeriksa, bukan satu (C.6): yang satu tahu apa yang SAH,
                  yang satu tahu apa yang BERUBAH. Hasil 6C wajib lolos keduanya.
                  Draf diperiksa ulang di sini karena 6C bisa menyelundupkan
                  perubahan klaim — dan judulnya mengikuti hasil, bukan harapan. */}
              <DaftarTemuan
                temuan={temuanDraf}
                judul={temuanDraf.length === 0 ? "Lolos pemeriksa draf" : "Pemeriksa draf (jalur klaim)"}
              />

              {ringkasPoles.kritis === 0 && ringkasDraf.kritis === 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-[#273352] pt-3">
                  <button
                    type="button"
                    onClick={unduhRtf}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#70E1B6] bg-[#70E1B6]/10 px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] hover:bg-[#70E1B6]/20 focus-visible:ring-2 focus-visible:ring-[#70E1B6] focus-visible:outline-none"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Unduh Bab 2 (.rtf)
                  </button>
                  <span className="text-[11px] text-[#AAB4D0]">
                    Terbuka di Word/Google Docs tanpa peringatan format. Sitasi tetap kamu pasang sendiri di Word.
                  </span>
                </div>
              )}

              {polesBab2.language_notes.length > 0 && (
                <details className="rounded-lg border border-[#273352] bg-[#080D1D] p-3">
                  <summary className="cursor-pointer text-[11px] font-semibold text-[#FFF9EE]">
                    Catatan perubahan bahasa ({polesBab2.language_notes.length})
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-[#AAB4D0]">
                    {polesBab2.language_notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Kartu>
      )}

      {/* Verifikasi sumber — hasil otomatis, sama seperti Tool 5 */}
      {register.length > 0 && (
        <Kartu>
          <JudulTahap
            nomor="Opsional"
            judul="Periksa Sumber ke Basis Data"
            keterangan="Crossref → OpenAlex → DOAJ. Berjalan otomatis saat draf diproses; tombolnya untuk memeriksa ulang."
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                periksaSumber(
                  register.map((s) => ({
                    sourceId: s.sourceId,
                    title: s.title,
                    url: s.url,
                    doi: s.doi,
                    documentType: s.documentType,
                    authorsYear: s.authorsYear,
                    publication: s.publication,
                  }))
                )
              }
              disabled={sedangVerifikasi}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2959FF] bg-[#2959FF]/15 px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] hover:bg-[#2959FF]/25 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              {sedangVerifikasi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Periksa Semua Sumber
            </button>
          </div>
          <div className="mt-3">
            <RingkasanVerifikasi
              hasil={hasilVerifikasi as unknown as Record<string, HasilVerifikasiSumber>}
              catatan={catatanVerifikasi}
            />
          </div>
        </Kartu>
      )}

      {/* Ringkasan & literatur terkait (gratis) */}
      {register.length > 0 && (
        <Kartu>
          <JudulTahap
            nomor="Bonus"
            judul="Ringkasan & Literatur Terkait"
            keterangan="Ringkasan berasal dari penulis/penerbit lewat Semantic Scholar — untuk memilih bacaan mana yang layak dibuka, bukan sebagai isi kutipan."
          />
          <div className="flex items-center gap-2 text-xs text-[#AAB4D0]">
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>Gunakan tombol di bawah untuk mencari paper serupa dari sumber yang sudah terverifikasi.</span>
          </div>
        </Kartu>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#273352] pt-5">
        <p className="text-[11px] leading-relaxed text-[#AAB4D0]">
          Bab 2 menyiapkan alat analisis, bukan menyimpulkan hasil. Kerangka pemikiran dan hipotesis tetap{" "}
          <span className="font-semibold text-[#FFF9EE]">usulanmu</span> sampai kamu memutuskannya.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-[#273352] bg-[#11182D] px-3.5 py-2 text-xs font-semibold text-[#FFF9EE] hover:border-[#FF6F61]/60 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Tool 6
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-[#273352] bg-[#080D1D] p-3">
        <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#70E1B6]" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-[#AAB4D0]">
          Target panjang Bab 2: {BAB2_WORD_RANGE[0]}–{BAB2_WORD_RANGE[1]} kata (target kerja {BAB2_TARGET_WORDS}). Angka ini
          pedoman kerja, bukan aturan kampus — ikuti panduan prodi kalau berbeda.
        </p>
      </div>
    </div>
  );
};
