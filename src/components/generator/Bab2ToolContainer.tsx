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
import { SequentialNavigation } from "./SequentialNavigation";
import { TempelBahanPanel } from "./TempelBahanPanel";
import { CatatanPembimbingPanel } from "./CatatanPembimbingPanel";
import { ResetConfirmModal } from "./ResetConfirmModal";
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
import { susunDrafBab2DariTempelan } from "@/lib/bab2Tempelan";
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
  loadBab2Tempelan,
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
  saveBab2Tempelan,
} from "@/lib/storage";
import { copyToClipboard } from "@/lib/clipboard";
import type { Bab2Finding, Bab2Pendekatan } from "@/types/bab2";
import type { HasilVerifikasiSumber } from "./VerifikasiSumberPanel";
import { RingkasanVerifikasi, useVerifikasiSumber } from "./VerifikasiSumberPanel";

// =========================================================================
// Komponen kecil
// =========================================================================

const Kartu: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6 ${className}`}>{children}</div>
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
        <span className="rounded-md border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-2 py-0.5 text-xs font-semibold text-[#FFB84D]">
          {nomor}
        </span>
        <h3 className="text-base font-bold text-[#FBFAFF]">{judul}</h3>
      </div>
      {keterangan && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#A79FC4]">{keterangan}</p>}
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
      className="inline-flex items-center gap-2 rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] transition-colors hover:bg-[#6D5AE6]/25 disabled:cursor-not-allowed disabled:border-[#2E2748] disabled:bg-transparent disabled:text-[#A79FC4] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
    >
      {tersalin ? <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB84D]" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      <span>{tersalin ? "Tersalin" : label}</span>
    </button>
  );
};

const DaftarTemuan: React.FC<{ temuan: Bab2Finding[]; judul: string }> = ({ temuan, judul }) => {
  if (temuan.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-[#FFB84D]/30 bg-[#FFB84D]/5 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB84D]" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-[#FBFAFF]">
          {judul}: tidak ada pelanggaran. Semua pernyataan bersumber, klaim utuh, dan struktur sesuai rencana.
        </p>
      </div>
    );
  }
  const warna = (s: Bab2Finding["severity"]) =>
    s === "CRITICAL"
      ? "border-[#FF5C8A]/40 bg-[#FF5C8A]/5 text-[#FF5C8A]"
      : s === "MAJOR"
        ? "border-[#FFB84D]/40 bg-[#FFB84D]/5 text-[#FFB84D]"
        : "border-[#2E2748] bg-[#0C0A1A] text-[#A79FC4]";
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#FBFAFF]">
        {judul}: {temuan.length} temuan
      </p>
      {temuan.map((f, i) => (
        <div key={`${f.code}-${i}`} className={`rounded-lg border p-3 ${warna(f.severity)}`}>
          <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
            <span>{f.severity}</span>
            <span className="opacity-60">·</span>
            <span className="opacity-80">{f.where}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#FBFAFF]">{f.message}</p>
          {f.evidence_excerpt && (
            <p className="mt-1.5 border-l-2 border-[#2E2748] pl-2 text-[12px] italic leading-relaxed text-[#A79FC4]">
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
  /** Bahan Bab 2 milik mahasiswa sendiri (jalur cepat untuk yang sudah menulis). */
  const [tempelanBab2, setTempelanBab2] = useState<string>("");
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
  /** Data mentah Tool 3 — dipakai sebagai cadangan register sumber. */
  const [dataTool3, setDataTool3] = useState<Record<string, string> | null>(null);

  const [fondasiBab2, setFondasiBab2] = useState(loadBab2Foundation());
  const [drafBab2, setDrafBab2] = useState(loadBab2Draft());
  const [polesBab2, setPolesBab2] = useState(loadBab2Polish());
  const [konfirmasiFondasi, setKonfirmasiFondasi] = useState(false);
  // Reset Bab 2 menghapus seluruh rantai (fondasi, draf, poles, 6A/6B/6C).
  // Tool 5 sudah lama punya modal konfirmasi; Tool 6 tidak, jadi satu klik
  // di tombol kecil di kaki halaman bisa membuang kerjaan berjam-jam.
  const [konfirmasiReset, setKonfirmasiReset] = useState(false);
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
    setTempelanBab2(loadBab2Tempelan());
    setTeks6B(loadBab2DraftRaw());
    setTeks6C(loadBab2PolishRaw());
    if (pendekatanTersimpan) setPendekatan(pendekatanTersimpan as Bab2Pendekatan);

    // Prodi & area: sama seperti Tool 5 — konteks riset bersama, fallback Tool 3.
    setProdi(shared?.prodi || t3Data?.prodi || "");
    setAreaEksplorasi(shared?.selectedArea || shared?.area_eksplorasi || t3Data?.area_eksplorasi || "");
    setDataTool3((t3Data as Record<string, string> | null) ?? null);

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

  /**
   * Daftar sumber untuk memeriksa sitasi. Kalau paket Tool 4 belum ada, jatuh ke
   * daftar Tool 3 — sama seperti Tool 5. Tanpa ini, mahasiswa yang sudah mengisi
   * Tool 3 tapi belum lewat Tool 4 tidak pernah bisa memakai jalur tempelan:
   * pemeriksa sitasi melihat register kosong dan tombolnya selalu mati.
   */
  const register = useMemo(() => {
    const dariPaket = extractSumberPaketLiteratur(paketLiteratur);
    if (dariPaket.length > 0) return dariPaket;
    return extractSumberPaketLiteratur(dataTool3?.literaturePackage || "");
  }, [paketLiteratur, dataTool3]);
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

  // 07 tingkat A: koreksi dosen bisa datang kapan saja, termasuk setelah Bab 2
  // mulai ditulis. Dibaca dari konteks bersama supaya panel Tool 5 dan Tool 6
  // selalu menunjuk sumber yang sama — tidak ada dua tempat penyimpanan.
  const bacaArahan = () => {
    if (typeof window === "undefined") return "";
    const ctx = loadSharedResearchContext();
    return ctx?.constraints?.arahanDosen || ctx?.supervisor_direction || "";
  };
  const [arahanDosen, setArahanDosen] = useState<string>(bacaArahan);

  useEffect(() => {
    setArahanDosen(bacaArahan());
    // sekali saat mount: arahan biasanya sudah diketik di Tool 5 sebelum ke sini
    // ponytail: tanpa polling; panel memanggil setArahanDosen sendiri saat disimpan.
  }, []);

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
      arahanDosen,
    }),
    [prodi, areaEksplorasi, pendekatan, peta, register, fondasi4B, arahTerpilih, rumusanMasalah, arahanDosen]
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

  /**
   * Terima bahan Bab 2 milik mahasiswa. Sebelumnya tombol ini memanggil fungsi
   * kosong: labelnya berubah jadi "Bahan Diterima" tetapi tidak ada yang
   * tersimpan maupun dipakai. Sekarang bahan disimpan, diperiksa, lalu disusun
   * jadi draf berstruktur supaya bisa diekspor dan lanjut ke Tahap 14.
   */
  const terimaTempelanBab2 = (teks: string) => {
    saveBab2Tempelan(teks);
    setTempelanBab2(teks);

    const draf = susunDrafBab2DariTempelan(
      teks,
      register.map((s) => ({ sourceId: s.sourceId, authorsYear: String(s.authorsYear ?? "") })),
      { fondasiBab1Ada: !!fondasiBab1Teks }
    );
    if (!draf) {
      setGalat("Bahan yang ditempel belum bisa dibaca. Pisahkan antar paragraf dengan satu baris kosong.");
      return;
    }
    saveBab2Draft(draf);
    setDrafBab2(draf);
    setGalat(null);
    setPesan([
      `${draf.background.length} paragraf dari tulisanmu tersimpan sebagai draf Bab 2. Isinya tidak diubah sama sekali.`,
    ]);
  };

  const reset = () => {
    clearSemuaBab2();
    setTempelanBab2("");
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
      <div className="mt-8 flex items-center gap-2 text-sm text-[#A79FC4]">
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

  /**
   * Apakah blok hasil Tahap 13 (6B) tampil? Blok itu baru muncul setelah fondasi
   * 6A diproses DAN dikonfirmasi. Dipakai untuk memutuskan apakah hasil jalur
   * tempelan perlu punya kartu sendiri — supaya bahan mahasiswa tidak tersimpan
   * tanpa terlihat.
   */
  const blok6BTampil = !!fondasiBab2 && konfirmasiFondasi && gerbang13.status !== "BLOKIR";

  return (
    <div className="mt-8 space-y-6">
      {/* Gerbang D.2.1 — Bab 2 hanya boleh dibuka bila Bab 1 selesai. */}
      {gerbang.status === "BLOKIR" ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#FF5C8A]/50 bg-[#FF5C8A]/5 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5C8A]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-[#FBFAFF]">
              Bab 2 belum bisa dibuka — {gerbang.ringkas}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#A79FC4]">
              {gerbang.alasan.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-[#FBFAFF]">{gerbang.tindakan}</p>
          </div>
        </div>
      ) : gerbang.status === "PERINGATAN" ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/5 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFB84D]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-[#FBFAFF]">Bab 1 belum sepenuhnya final</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#A79FC4]">
              {gerbang.alasan.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-[#FBFAFF]">{gerbang.tindakan}</p>
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
          <div className="flex items-start gap-2 rounded-lg border border-[#FF5C8A]/40 bg-[#FF5C8A]/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C8A]" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[#FBFAFF]">{peta.status_reason}</p>
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
                <div key={k.label} className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3">
                  <p className="text-[12px] text-[#A79FC4]">{k.label}</p>
                  <p className="mt-0.5 text-lg font-bold text-[#FBFAFF]">{k.nilai}</p>
                </div>
              ))}
            </div>

            {peta.map_notes.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {peta.map_notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-[#A79FC4]">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 overflow-x-auto rounded-lg border border-[#2E2748]">
              <table className="w-full min-w-[640px] text-left text-[12px]">
                <thead className="bg-[#0C0A1A] text-[#A79FC4]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">ID</th>
                    <th className="px-3 py-2 font-semibold">Penulis & Tahun</th>
                    <th className="px-3 py-2 font-semibold">Judul</th>
                    <th className="px-3 py-2 font-semibold">Venue</th>
                    <th className="px-3 py-2 font-semibold">Metode</th>
                    <th className="px-3 py-2 font-semibold">Hasil</th>
                  </tr>
                </thead>
                <tbody className="text-[#FBFAFF]">
                  {peta.prior_research_table.map((b) => (
                    <tr key={b.source_id} className="border-t border-[#2E2748]">
                      <td className="px-3 py-2 align-top font-semibold text-[#FFB84D]">{b.source_id}</td>
                      <td className="px-3 py-2 align-top">
                        {b.authors_year || <span className="italic text-[#A79FC4]">TIDAK TERCATAT</span>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {b.title || <span className="italic text-[#A79FC4]">TIDAK TERCATAT</span>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {b.venue || <span className="italic text-[#A79FC4]">TIDAK TERCATAT</span>}
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
            <p className="mt-2 text-[12px] leading-relaxed text-[#A79FC4]">
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
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none ${
                pendekatan === nilai
                  ? "border-[#6D5AE6] bg-[#6D5AE6]/20 text-[#FBFAFF]"
                  : "border-[#2E2748] bg-[#0C0A1A] text-[#A79FC4] hover:border-[#6D5AE6]/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {pendekatan !== "BELUM_DITENTUKAN" && (
          <p className="mt-3 text-[12px] leading-relaxed text-[#A79FC4]">
            Sub-bab yang akan dibangun:{" "}
            <span className="font-semibold text-[#FBFAFF]">{strukturBakuBab2(pendekatan).join(" → ")}</span>
            {!strukturBakuBab2(pendekatan).includes("Hipotesis") && (
              <span className="ml-1 text-[#FFB84D]">— tanpa Hipotesis.</span>
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
          <div className="space-y-4">
            {/* Dulu buntu: pesan satu baris tanpa jalan keluar. Mahasiswa yang
                sudah menulis Bab 2 sendiri tidak punya cara memasukkannya. */}
            <p className="text-xs text-[#A79FC4]">Jalur lewat Tool 5 belum lengkap.</p>
            <TempelBahanPanel
              register={register.map((s) => ({
                sourceId: String(s.sourceId ?? ""),
                authorsYear: String(s.authorsYear ?? ""),
              }))}
              namaBahan="Bab 2 (tinjauan pustaka)"
              onTerima={terimaTempelanBab2}
              sudahAdaBahan={!!tempelanBab2}
            />
          </div>
        ) : gerbangSumber || gerbangPendekatan ? (
          <p className="text-xs text-[#A79FC4]">
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
              <span className="text-[12px] text-[#A79FC4]">
                {assembleBab2FoundationPrompt(inputPrompt).length.toLocaleString("id-ID")} karakter
              </span>
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#FBFAFF]" htmlFor="bab2-6a">
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
              className="mt-2 w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3 font-mono text-[12px] text-[#FBFAFF] focus:border-[#6D5AE6] focus:outline-none"
              placeholder="=== BEGIN SKRIFLOW_BAB2_FOUNDATION_V1 === … === END SKRIFLOW_BAB2_FOUNDATION_V1 ==="
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={proses6A}
                className="rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6]/25 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
              >
                Proses Fondasi Bab 2
              </button>
              {fondasiBab2 && (
                <span className="text-[12px] text-[#FFB84D]">
                  Tersimpan · {fondasiBab2.structure_blueprint.length} sub-bab · {fondasiBab2.claim_ledger.length} klaim
                </span>
              )}
            </div>

            {galat && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#FF5C8A]/40 bg-[#FF5C8A]/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C8A]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-[#FBFAFF]">{galat}</p>
                  {pesan.length > 0 && (
                    <ul className="mt-1 list-disc pl-4 text-[12px] text-[#A79FC4]">
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
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-[#A79FC4]">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {fondasiBab2 && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="rounded-md border border-[#2E2748] bg-[#0C0A1A] px-2 py-1 font-semibold text-[#FBFAFF]">
                    {fondasiBab2.foundation_status}
                  </span>
                  <span className="text-[#A79FC4]">{labelPendekatan(fondasiBab2.pendekatan)}</span>
                </div>
                <DaftarTemuan temuan={temuanFondasi} judul="Pemeriksa fondasi" />
                {ringkasFondasi.kritis === 0 && (
                  <label className="flex items-start gap-2 text-[12px] leading-relaxed text-[#A79FC4]">
                    <input
                      type="checkbox"
                      checked={konfirmasiFondasi}
                      onChange={(e) => setKonfirmasiFondasi(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Saya sudah membaca pembagian sub-bab, daftar teori, dan klaim di atas. Kerangka pemikiran serta hipotesis di
                      dalamnya masih <span className="font-semibold text-[#FBFAFF]">usulan</span> — keputusan akhir milik saya.
                    </span>
                  </label>
                )}
              </div>
            )}
          </>
        )}
      </Kartu>

      {/* Jalur cepat: mahasiswa yang sudah menulis Bab 2 sendiri. Sebelum ini
          satu-satunya pintu masuk ada di dalam cabang "Tool 5 belum lengkap" —
          jadi yang sudah menulis tetap tidak punya jalan. */}
      {!tempelanBab2 && !bab1Terblokir && (
        <Kartu>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#FFB84D]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#FBFAFF]">Sudah punya Bab 2 (tinjauan pustaka) sendiri?</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
            Kamu tidak perlu mengulang dari awal. Tempel yang sudah kamu tulis — tulisanmu tidak diubah,
            hanya diperiksa sitasinya terhadap daftar sumber Tool 3, lalu bisa langsung diekspor ke Word.
          </p>
          <div className="mt-3">
            <TempelBahanPanel
              register={register.map((s) => ({ sourceId: s.sourceId, authorsYear: String(s.authorsYear ?? "") }))}
              namaBahan="Bab 2 (tinjauan pustaka)"
              onTerima={terimaTempelanBab2}
              sudahAdaBahan={!!tempelanBab2}
            />
          </div>
          {tempelanBab2 && (
            <p className="mt-3 text-[12px] leading-relaxed text-[#FFB84D]">
              Bahanmu tersimpan. Lihat hasilnya di bagian bawah halaman ini — bisa langsung diunduh ke Word.
            </p>
          )}
        </Kartu>
      )}

      {/* Hasil jalur tempelan. Blok hasil Tahap 13 ada di dalam cabang yang
          menuntut fondasi 6A, jadi tanpa kartu ini bahan mahasiswa tersimpan
          tetapi tidak terlihat sama sekali — sama saja tombolnya masih mati. */}
      {tempelanBab2 && drafBab2 && !blok6BTampil && (
        <Kartu>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-bold text-[#FBFAFF]">Bahanmu sudah masuk</h3>
            <span className="rounded-md border border-[#2E2748] bg-[#0C0A1A] px-2 py-1 text-[12px] font-semibold text-[#FBFAFF]">
              {drafBab2.word_count_total} kata · {drafBab2.background.length} paragraf
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
            Tulisanmu disimpan apa adanya — tidak ada satu kata pun yang diubah Skriflow. Karena bahan ini
            ditulis sendiri (bukan lewat Prompt 6B), peta klaim per paragraf belum diperiksa: itulah sebabnya
            statusnya <span className="font-semibold text-[#FBFAFF]">{drafBab2.draft_status}</span>, bukan
            DRAFT_COMPLETE. Pemeriksaan sitasi tetap sudah dijalankan di panel tempel di atas.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={unduhRtf}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFB84D] px-4 py-2.5 text-xs font-bold text-[#0C0A1A] transition hover:bg-[#F0A63C]"
            >
              <FileText className="h-3.5 w-3.5" />
              Unduh Bab 2 (.rtf)
            </button>
            <span className="text-[12px] text-[#A79FC4]">
              Terbuka di Word/Google Docs tanpa peringatan format. Sitasi kamu pasang sendiri di Word.
            </span>
          </div>

          {drafBab2.unresolved_notes.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-[#2E2748] pt-3">
              {drafBab2.unresolved_notes.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-[#FFB84D]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}

          <details className="mt-3 border-t border-[#2E2748] pt-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF]">
              Lihat tulisan yang tersimpan ({drafBab2.background.length} paragraf)
            </summary>
            <div className="mt-2 space-y-3">
              {drafBab2.background.map((p) => (
                <div key={p.order}>
                  <p className="text-[12px] font-semibold text-[#FFB84D]">{p.order}. {p.sub_bab}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#FBFAFF]">{p.paragraph_text}</p>
                </div>
              ))}
            </div>
          </details>
        </Kartu>
      )}

      {/* Tahap 13 — Draf (6B) */}
      {fondasiBab2 && konfirmasiFondasi && gerbang13.status === "BLOKIR" && (
        <Kartu>
          <JudulTahap
            nomor="Tahap 13"
            judul="Prompt 6B — Tulis Draf Bab 2"
            keterangan="Ditulis di NotebookLM karena ia yang memegang sumbermu."
            platform="NotebookLM"
          />
          <div className="flex items-start gap-3 rounded-xl border border-[#FF5C8A]/50 bg-[#FF5C8A]/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5C8A]" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-[#FBFAFF]">Draf Bab 2 belum boleh ditulis</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#A79FC4]">
                {gerbang13.alasan.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#FBFAFF]">{gerbang13.tindakan}</p>
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
                <p className="text-xs font-bold text-[#FBFAFF]">Fondasi Bab 2 belum sepenuhnya pasti</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-[#A79FC4]">
                  {gerbang13.alasan.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#FBFAFF]">{gerbang13.tindakan}</p>
              </div>
            </div>
          )}

          {/* Addendum D (sama seperti 4C): seluruh aturan jadi berkas sumber, kolom chat hanya perintah pendek. */}
          <ol className="space-y-2 text-xs leading-relaxed text-[#FBFAFF]">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#FFB84D]">1.</span>
              <div>
                <button
                  type="button"
                  onClick={unduhBerkasSumber6B}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3 py-1.5 text-[12px] font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6]/25 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Berkas Sumber 6B
                </button>
                <p className="mt-1 text-[12px] text-[#A79FC4]">
                  Unggah berkas ini ke NotebookLM sebagai <span className="font-semibold">sumber</span>.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#FFB84D]">2.</span>
              <div>
                <TombolSalin teks={assembleBab2DraftShortCommand(inputPrompt)} label="Salin Perintah Pendek 6B" />
                <p className="mt-1 text-[12px] text-[#A79FC4]">
                  {analyzeBab2DraftShortCommand(inputPrompt).finalLength} karakter — aman untuk kolom chat NotebookLM.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#FFB84D]">3.</span>
              <span>Tempelkan perintah itu di kolom chat NotebookLM, lalu tunggu sampai selesai menulis.</span>
            </li>
          </ol>

          <label className="mt-4 block text-xs font-semibold text-[#FBFAFF]" htmlFor="bab2-6b">
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
            className="mt-2 w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3 font-mono text-[12px] text-[#FBFAFF] focus:border-[#6D5AE6] focus:outline-none"
            placeholder="=== BEGIN SKRIFLOW_BAB2_DRAFT_V1 === … === END SKRIFLOW_BAB2_DRAFT_V1 ==="
          />
          <div className="mt-2">
            <button
              type="button"
              onClick={proses6B}
              disabled={sedangVerifikasi}
              className="inline-flex items-center gap-2 rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6]/25 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            >
              {sedangVerifikasi && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verifikasi Draf Bab 2
            </button>
          </div>

          {drafBab2 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#A79FC4]">
                <span className="rounded-md border border-[#2E2748] bg-[#0C0A1A] px-2 py-1 font-semibold text-[#FBFAFF]">
                  {drafBab2.draft_status}
                </span>
                <span>
                  {drafBab2.word_count_total} kata dari target {drafBab2.target_words_total}
                </span>
              </div>
              <DaftarTemuan temuan={temuanDraf} judul="Pemeriksa draf" />

              {/* Jalur tempelan belum boleh lewat Tahap 14 (6C) karena peta klaim
                  milik tulisan mahasiswa sendiri belum diperiksa. Kalau begitu,
                  hasilnya mentok tanpa bisa dibawa ke Word. Tombol ini jalan
                  keluar itu — RTF memuat seluruh sub-bab apa adanya. */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={unduhRtf}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#FFB84D] bg-[#FFB84D]/10 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#FFB84D]/20 focus-visible:ring-2 focus-visible:ring-[#FFB84D] focus-visible:outline-none"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Unduh Bab 2 (.rtf)
                </button>
                <span className="text-[12px] text-[#A79FC4]">
                  Terbuka di Word/Google Docs. Sitasi tetap kamu pasang sendiri di Word.
                </span>
              </div>

              {/* B2-13: D.11 ditegakkan sebagai ALUR, bukan cuma larangan. Temuan
                  saja tidak cukup — mahasiswa perlu tahu langkah berikutnya, kalau
                  tidak yang paling mudah dilakukan adalah menghapus sitasinya. */}
              {drafBab2.new_sources_introduced.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-[#FFB84D]/40 bg-[#FFB84D]/5 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFB84D]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-[#FBFAFF]">
                      {drafBab2.new_sources_introduced.length} sumber baru muncul di draf — belum boleh disitasi
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-[#A79FC4]">
                      {drafBab2.new_sources_introduced.map((s, i) => (
                        <li key={i}>
                          <span className="font-semibold text-[#FBFAFF]">{s.authors_year || s.id_sementara}</span>
                          {s.title ? ` — ${s.title}` : ""}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#FBFAFF]">
                      Langkah berikutnya: masukkan sumber itu lewat pencarian di Tool 3, jalankan penyaringan dan
                      verifikasi sampai masuk Source Register, baru boleh disitasi. Jangan hapus sitasinya hanya
                      supaya temuan ini hilang, dan jangan biarkan sumber ini di dalam naskah.
                    </p>
                    <a
                      href="/tools/cari-literatur-awal"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3 py-1.5 text-[12px] font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6]/25 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
                    >
                      Buka Tool 3 — Cari Literatur
                    </a>
                  </div>
                </div>
              )}

              {ringkasDraf.kritis === 0 && (
                <div className="space-y-3 border-t border-[#2E2748] pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TombolSalin
                      teks={assembleBab2PolishPrompt({ prodi, areaEksplorasi, draft: drafBab2, foundation: fondasiBab2 })}
                      label="Salin Prompt 6C (Poles Bahasa)"
                    />
                    <span className="text-[12px] text-[#A79FC4]">
                      Langkah 5: buka ChatGPT — bahasa NotebookLM selalu kaku, tahap ini wajib.
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3">
                    {drafBab2.background.map((p) => (
                      <div key={p.order} className="mb-3 last:mb-0">
                        <p className="text-[12px] font-semibold text-[#FFB84D]">
                          {p.order}. {p.sub_bab}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#FBFAFF]">{p.paragraph_text}</p>
                        {p.claim_ids.length > 0 && (
                          <p className="mt-1 text-[11px] text-[#A79FC4]">klaim: {p.claim_ids.join(", ")}</p>
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
          <label className="block text-xs font-semibold text-[#FBFAFF]" htmlFor="bab2-6c">
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
            className="mt-2 w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3 font-mono text-[12px] text-[#FBFAFF] focus:border-[#6D5AE6] focus:outline-none"
            placeholder="=== BEGIN SKRIFLOW_BAB2_POLISH_V1 === … === END SKRIFLOW_BAB2_POLISH_V1 ==="
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={proses6C}
              className="rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6]/25 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            >
              Proses Hasil Poles
            </button>
            {polesBab2 && (
              <span className="text-[12px] text-[#FFB84D]">
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
                <div className="flex flex-wrap items-center gap-2 border-t border-[#2E2748] pt-3">
                  <button
                    type="button"
                    onClick={unduhRtf}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#FFB84D] bg-[#FFB84D]/10 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#FFB84D]/20 focus-visible:ring-2 focus-visible:ring-[#FFB84D] focus-visible:outline-none"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Unduh Bab 2 (.rtf)
                  </button>
                  <span className="text-[12px] text-[#A79FC4]">
                    Terbuka di Word/Google Docs tanpa peringatan format. Sitasi tetap kamu pasang sendiri di Word.
                  </span>
                </div>
              )}

              {polesBab2.language_notes.length > 0 && (
                <details className="rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3">
                  <summary className="cursor-pointer text-[12px] font-semibold text-[#FBFAFF]">
                    Catatan perubahan bahasa ({polesBab2.language_notes.length})
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] text-[#A79FC4]">
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
              className="inline-flex items-center gap-2 rounded-lg border border-[#6D5AE6] bg-[#6D5AE6]/15 px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:bg-[#6D5AE6]/25 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
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
          <div className="flex items-center gap-2 text-xs text-[#A79FC4]">
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>Gunakan tombol di bawah untuk mencari paper serupa dari sumber yang sudah terverifikasi.</span>
          </div>
        </Kartu>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2E2748] pt-5">
        <p className="text-[12px] leading-relaxed text-[#A79FC4]">
          Bab 2 menyiapkan alat analisis, bukan menyimpulkan hasil. Kerangka pemikiran dan hipotesis tetap{" "}
          <span className="font-semibold text-[#FBFAFF]">usulanmu</span> sampai kamu memutuskannya.
        </p>
        <button
          type="button"
          onClick={() => setKonfirmasiReset(true)}
          title="Mengosongkan paket fondasi, draf, dan hasil poles Bab 2."
          className="inline-flex items-center gap-2 rounded-lg border border-[#2E2748] bg-[#191430] px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] hover:border-[#FF5C8A]/60 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Tool 6
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-3">
        <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB84D]" aria-hidden="true" />
        <p className="text-[12px] leading-relaxed text-[#A79FC4]">
          Target panjang Bab 2: {BAB2_WORD_RANGE[0]}–{BAB2_WORD_RANGE[1]} kata (target kerja {BAB2_TARGET_WORDS}). Angka ini
          pedoman kerja, bukan aturan kampus — ikuti panduan prodi kalau berbeda.
        </p>
      </div>
      {/* HANDOFF: Tool 6 adalah hulu Bab 3 (belum dibangun). Tanpa panel ini
          mahasiswa selesai Bab 2 tanpa ditunjukkan langkah berikutnya — halaman
          48 layar berakhir di catatan kecil. */}
      {/* 07 tingkat A: pintu yang sama dengan Tool 5, supaya koreksi dosen yang
          datang setelah Bab 2 mulai ditulis tetap bisa dimasukkan. */}
      <div className="mb-6">
        <CatatanPembimbingPanel onBerubah={setArahanDosen} />
      </div>

      {konfirmasiReset && (
        <ResetConfirmModal
          isOpen={konfirmasiReset}
          onConfirm={() => {
            reset();
            setKonfirmasiReset(false);
          }}
          onCancel={() => setKonfirmasiReset(false)}
          toolName="Bangun Bab 2"
          title="Reset Paket &amp; Draf Bab 2?"
          description="Tindakan ini mengosongkan paket fondasi Bab 2, draf, hasil poles bahasa, dan teks 6A/6B/6C. Source Register dari Tool 3 dan pilihan arah dari Tool 4 TIDAK terhapus — kamu bisa menyusun ulang Bab 2 tanpa mengulang dari nol."
          confirmButtonText="Ya, Reset Bab 2"
        />
      )}

      <SequentialNavigation
        previousStep={{ label: "Kembali ke Susun Bab 1", href: "/tools/susun-bab-1" }}
        nextStep={{
          eyebrow: "SELESAI UNTUK PROTOTYPE INI",
          title: "Kembali ke Dashboard",
          href: "/tools",
        }}
        isNextEnabled
        nextStatusLabel="Bab 2 selesai — Bab 3 belum dibangun di prototype ini"
        nextHelperText="Bab 2 sudah lengkap: tabel, fondasi, draf, dan hasil pemeriksaan bisa diekspor ke RTF. Bab 3 belum ada di prototype ini."
      />
    </div>
  );
};
