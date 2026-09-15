"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import {
  Tool,
  ResearchBedahInput,
  BedahTransferPayload,
  DirectionV2,
  PhenomenonBasisStatus,
} from "@/types/tool";
import {
  loadSelectedPhenomenon,
  getSelectedPhenomenonSnapshot,
  loadSharedResearchContext,
  saveSharedResearchContext,
  getSharedResearchContextSnapshot,
  subscribeToToolData,
  saveBedahDraft,
  loadBedahDraft,
  clearBedahDraft,
  saveBedahOutput,
  loadBedahOutput,
  clearBedahOutput,
  saveBedahDirectionV2,
  loadBedahDirectionV2,
  clearBedahDirectionV2,
  saveSelectedDirectionId,
  loadSelectedDirectionId,
  clearSelectedDirectionId,
  loadToolData,
} from "@/lib/storage";
import {
  validateLiteratureEvidencePackage,
  parseBedahTransfer,
  generateBedahFixFormatPrompt4A,
  generateBedahFixStructurePrompt4A,
  jelaskanGalat4A,
  extractSumberPaketLiteratur,
} from "@/lib/bedahParser";
import {
  TombolPeriksaSumber,
  RingkasanVerifikasi,
  LencanaVerifikasi,
  TombolUnduhBibtex,
  useVerifikasiSumber,
} from "./VerifikasiSumberPanel";
import { PanelRingkasanDanTerkait } from "./PanelRingkasanDanTerkait";
import {
  assembleBedahPrompt,
  analyzeBedahPrompt,
} from "@/lib/promptAssembler";
import { copyToClipboard } from "@/lib/clipboard";
import { SequentialNavigation } from "./SequentialNavigation";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { TombolTempelClipboard } from "./TombolTempelClipboard";
import { safeHref } from "@/lib/xss";
import { susunPolaJudul } from "@/lib/titlePattern";
import {
  getStudentLabel,
  getStudentStatus,
  getGapTypeInfo,
  deriveDirectionRiskLevel,
  formatConstraintFitLabel,
  formatWorkloadLabel,
} from "@/lib/studentLanguage";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Edit3,
  FileCheck,
  Check,
  Compass,
  BookOpen,
} from "lucide-react";

const emptySubscribe = () => () => {};
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface BedahToolContainerProps {
  tool: Tool;
}

type ActiveTab4A =
  | "audit"
  | "evidence_basis"
  | "phenomenon"
  | "knowledge"
  | "gaps"
  | "directions"
  | "recommendation";

/**
 * Addendum: Tool 4 punya tujuh tampilan. Menyodorkan tujuh tab sekaligus membuat
 * mahasiswa tidak tahu harus mulai dari mana (keluhan: "terlalu ramai"). Di sini
 * ketujuhnya dikelompokkan jadi tiga langkah nyata; isi tiap tampilan tidak berubah.
 */
const KELOMPOK_TAB_4A: Array<{
  id: string;
  label: string;
  Ikon: typeof Compass;
  buka: ActiveTab4A;
  hitung?: (p: DirectionV2) => number;
  isi: Array<{ id: ActiveTab4A; label: string }>;
}> = [
  {
    id: "arah",
    label: "Arah Penelitian",
    Ikon: Compass,
    buka: "directions",
    isi: [{ id: "directions", label: "2–4 Alternatif Arah" }],
  },
  {
    id: "celah",
    label: "Celah & Dasar Bukti",
    Ikon: BookOpen,
    buka: "gaps",
    hitung: (p) => p.candidate_gaps.length,
    isi: [
      { id: "gaps", label: "Kandidat Celah Penelitian" },
      { id: "evidence_basis", label: "Dasar Bukti" },
    ],
  },
  {
    id: "periksa",
    label: "Pemeriksaan & Catatan",
    Ikon: ShieldAlert,
    buka: "audit",
    isi: [
      { id: "audit", label: "Audit Bahan" },
      { id: "phenomenon", label: "Fenomena yang Sudah Dicek" },
      { id: "knowledge", label: "Peta Pengetahuan & Keterbandingan" },
      { id: "recommendation", label: "Rekomendasi Sementara" },
    ],
  },
];

export const BedahToolContainer: React.FC<BedahToolContainerProps> = () => {
  const isMounted = useIsMounted();
  // 1. Sync external stores
  const selectedPhenomenonRaw = useSyncExternalStore(
    subscribeToToolData,
    getSelectedPhenomenonSnapshot,
    () => "null"
  );
  const sharedContextRaw = useSyncExternalStore(
    subscribeToToolData,
    getSharedResearchContextSnapshot,
    () => "null"
  );

  // 2. Local State with lazy initializers
  const [prodi, setProdi] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");
    return shared?.prodi || t3Data?.prodi || "";
  });

  const [areaEksplorasi, setAreaEksplorasi] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");
    return shared?.selectedArea || shared?.area_eksplorasi || t3Data?.area_eksplorasi || "";
  });

  const [additionalNotes] = useState("");

  const [supervisorDirection] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const shared = loadSharedResearchContext();
    const t3Data = loadToolData("cari-literatur-awal");
    return shared?.constraints?.arahanDosen || t3Data?.arahan_dosen || t3Data?.supervisor_direction || "";
  });

  const [literaturePackage, setLiteraturePackage] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahDraft() : "";
  });

  const [isPhenomenonAckChecked, setIsPhenomenonAckChecked] = useState(false);
  const [isLitStructureAckChecked, setIsLitStructureAckChecked] = useState(false);

  // UI state
  const [showFullPhenomenonEvidence, setShowFullPhenomenonEvidence] = useState(false);
  const [showAdjustDataModal, setShowAdjustDataModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [copyStatus4A, setCopyStatus4A] = useState<"idle" | "copied" | "error">("idle");
  const [activeTab4A, setActiveTab4A] = useState<ActiveTab4A>("directions");
  const [showRawLitInput, setShowRawLitInput] = useState(false);

  // Adjust Data Modal Form State
  const [modalProdi, setModalProdi] = useState("");
  const [modalArea, setModalArea] = useState("");
  const [modalPendekatan, setModalPendekatan] = useState("");
  const [modalDataNyaman, setModalDataNyaman] = useState("");
  const [modalAksesData, setModalAksesData] = useState("");
  const [modalCatatanAkses, setModalCatatanAkses] = useState("");
  const [modalHalDihindari, setModalHalDihindari] = useState("");
  const [modalKondisiWaktu, setModalKondisiWaktu] = useState("");

  // Stage 4A State
  const [pastedLLMOutput4A, setPastedLLMOutput4A] = useState<string>(() => {
    return typeof window !== "undefined" ? loadBedahOutput() : "";
  });

  const [parsedPayloadV2, setParsedPayloadV2] = useState<DirectionV2 | null>(() => {
    return typeof window !== "undefined" ? loadBedahDirectionV2() : null;
  });

  const [parsedPayloadV1, setParsedPayloadV1] = useState<BedahTransferPayload | null>(() => {
    return null;
  });

  // Arah terpilih: Tool 4 hanya menyimpan pilihannya, lalu menyerahkan penyusunan
  // Bab 1 (uji kelayakan, fondasi, draf) ke halaman /tools/susun-bab-1.
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(() => {
    return typeof window !== "undefined" ? loadSelectedDirectionId() : null;
  });

  const [parseError4A, setParseError4A] = useState<{ error: string; details?: string[] } | null>(null);
  /** Temuan audit konten 4A (red line akademik). Dihitung parser. */
  const [auditFindings4A, setAuditFindings4A] = useState<import("@/lib/academicGates").ContentAuditFinding[]>([]);
  /** Verifikasi sumber ke Crossref/OpenAlex (R-05) — dipakai bersama Tool 2/3/4. */
  const {
    hasil: verifikasiSumber,
    sedangProses: sedangVerifikasi,
    catatan: verifikasiCatatan,
    periksa: periksaSumber,
    reset: resetVerifikasi,
  } = useVerifikasiSumber();

  /** Jalur penulisan: kerangka saja, atau kerangka + draf berbantuan AI. */
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedPhenomenon = useMemo(() => {
    if (selectedPhenomenonRaw === "invalid") return null;
    return loadSelectedPhenomenon();
  }, [selectedPhenomenonRaw]);

  const sharedContext = useMemo(() => {
    if (sharedContextRaw === "invalid") return null;
    return loadSharedResearchContext();
  }, [sharedContextRaw]);

  // Handle literature package change (with state invalidation)
  const handleLiteraturePackageChange = (val: string) => {
    setLiteraturePackage(val);
    saveBedahDraft(val);

    // Invalidate downstream
    if (parsedPayloadV2 || parsedPayloadV1 || selectedDirectionId) {
      setParsedPayloadV2(null);
      clearBedahDirectionV2();
      setParsedPayloadV1(null);
      setSelectedDirectionId(null);
      clearSelectedDirectionId();
      resetVerifikasi();
    }
  };

  // Validation of Literature Evidence Package
  const litValidation = useMemo(() => {
    return validateLiteratureEvidencePackage(literaturePackage);
  }, [literaturePackage]);

  const hasFullPhenomenonEvidence = useMemo(() => {
    return (
      !!selectedPhenomenon &&
      Array.isArray(selectedPhenomenon.evidence) &&
      selectedPhenomenon.evidence.length > 0 &&
      typeof selectedPhenomenon.phenomenonSummary === "string" &&
      selectedPhenomenon.phenomenonSummary.trim().length > 0
    );
  }, [selectedPhenomenon]);

  // Status dasar bukti fenomena (Patch 4)
  const phenomenonBasisStatus = useMemo<PhenomenonBasisStatus>(() => {
    if (hasFullPhenomenonEvidence) return "VERIFIED_REAL_WORLD";
    if (isPhenomenonAckChecked || (selectedPhenomenon && selectedPhenomenon.phenomenonSummary)) return "LITERATURE_INDICATED";
    return "MISSING";
  }, [hasFullPhenomenonEvidence, isPhenomenonAckChecked, selectedPhenomenon]);

  // Construct Bedah Input 4A Context
  const bedahInput: ResearchBedahInput = useMemo(() => {
    return {
      prodi,
      areaEksplorasi,
      selectedPhenomenon,
      studentConstraints: {
        preferredApproach: sharedContext?.constraints?.pendekatan || sharedContext?.pendekatan || "",
        preferredData: sharedContext?.constraints?.dataNyaman || sharedContext?.preferensi_data || "",
        existingDataAccess: sharedContext?.constraints?.aksesData || sharedContext?.akses_data || "",
        dataAccessNotes: sharedContext?.constraints?.catatanAkses || sharedContext?.akses_data_catatan || "",
        avoidedActivities: sharedContext?.constraints?.halDihindari || sharedContext?.avoidances || "",
        timeCondition: sharedContext?.constraints?.kondisiWaktu || sharedContext?.target_waktu || "",
        additionalNotes,
      },
      additionalNotes,
      supervisorDirection,
      literatureEvidencePackage: literaturePackage,
    };
  }, [
    prodi,
    areaEksplorasi,
    selectedPhenomenon,
    sharedContext,
    additionalNotes,
    supervisorDirection,
    literaturePackage,
  ]);

  const generatedPrompt4A = useMemo(() => {
    return assembleBedahPrompt(bedahInput);
  }, [bedahInput]);

  const promptAnalysis4A = useMemo(() => {
    return analyzeBedahPrompt(bedahInput);
  }, [bedahInput]);

  // Can Generate / Execute Prompt 4A?
  const canGeneratePrompt4A = useMemo(() => {
    const phenValid = hasFullPhenomenonEvidence || isPhenomenonAckChecked;
    const litValid =
      litValidation.status === "STRUKTUR_LENGKAP" ||
      (litValidation.status === "STRUKTUR_PERLU_DIPERIKSA" && isLitStructureAckChecked);
    return phenValid && litValid && literaturePackage.trim().length > 0;
  }, [hasFullPhenomenonEvidence, isPhenomenonAckChecked, litValidation, isLitStructureAckChecked, literaturePackage]);

  // Handle Copy Prompt 4A
  const handleCopyPrompt4A = async () => {
    if (promptAnalysis4A.status === "BLOCKED") return;
    try {
      const ok = await copyToClipboard(generatedPrompt4A);
      if (ok) {
        setCopyStatus4A("copied");
        setTimeout(() => setCopyStatus4A("idle"), 3000);
      }
    } catch {
      setCopyStatus4A("error");
    }
  };

  // Sumber mana yang diperiksa: paket Tool3 yang ditempel (paling relevan untuk
  // arah penelitian), dan bila belum ada, register 4A dari parse terakhir.
  const sumberUntukDiperiksa = useMemo(() => {
    const dariPaketTool3 = extractSumberPaketLiteratur(literaturePackage);
    if (dariPaketTool3.length > 0) {
      return dariPaketTool3.map((x) => ({
        sourceId: x.sourceId,
        title: x.title,
        url: x.url,
        doi: x.doi,
        documentType: x.documentType,
        authorsYear: x.authorsYear,
        publication: x.publication,
      }));
    }
    return (parsedPayloadV2?.source_weights ?? []).map((sw) => {
      const x = sw as unknown as Record<string, unknown>;
      return {
        sourceId: String(x.source_id ?? ""),
        title: String(x.title ?? ""),
        url: String(x.url ?? ""),
        doi: String(x.doi ?? ""),
        documentType: String(x.document_type ?? ""),
      };
    });
  }, [literaturePackage, parsedPayloadV2]);

  // Handle Process LLM Output 4A
  const handleProcessLLMOutput4A = () => {
    setParseError4A(null);
    const res = parseBedahTransfer(pastedLLMOutput4A);
    setAuditFindings4A(res.contentFindings ?? []);
    resetVerifikasi();
    if (res.success) {
      if (res.version === 2 && res.dataV2) {
        setParsedPayloadV2(res.dataV2);
        setParsedPayloadV1(null);
        saveBedahDirectionV2(res.dataV2);
        saveBedahOutput(pastedLLMOutput4A);

        // Reset downstream on new 4A paste
        setSelectedDirectionId(null);
        clearSelectedDirectionId();

        setToastMessage("Hasil Bedah 4A (V2) berhasil diverifikasi dan dimuat.");
      } else if (res.version === 1 && res.dataV1) {
        setParsedPayloadV1(res.dataV1);
        setParsedPayloadV2(null);
        saveBedahOutput(pastedLLMOutput4A);
        setToastMessage("Hasil format V1 terbaca. Disarankan menggunakan Prompt V2 untuk fitur lengkap.");
      }
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setParseError4A({
        error: res.error || "Gagal memproses hasil transfer 4A.",
        details: res.errorDetails,
      });
    }
  };

  // Handle Direction Selection (Stage 4A -> 5)
  const handleSelectDirection = (dirId: string) => {
    if (selectedDirectionId !== dirId) {
      setSelectedDirectionId(dirId);
      saveSelectedDirectionId(dirId);
    }
  };

  // Open Adjust Data Modal
  const openAdjustDataModal = () => {
    setModalProdi(prodi);
    setModalArea(areaEksplorasi);
    setModalPendekatan(sharedContext?.constraints?.pendekatan || "");
    setModalDataNyaman(sharedContext?.constraints?.dataNyaman || "");
    setModalAksesData(sharedContext?.constraints?.aksesData || "");
    setModalCatatanAkses(sharedContext?.constraints?.catatanAkses || "");
    setModalHalDihindari(sharedContext?.constraints?.halDihindari || "");
    setModalKondisiWaktu(sharedContext?.constraints?.kondisiWaktu || "");
    setShowAdjustDataModal(true);
  };

  const saveAdjustDataModal = () => {
    setProdi(modalProdi.trim());
    setAreaEksplorasi(modalArea.trim());

    const updatedContext = {
      ...(sharedContext || {}),
      prodi: modalProdi.trim(),
      selectedArea: modalArea.trim(),
      area_eksplorasi: modalArea.trim(),
      constraints: {
        ...(sharedContext?.constraints || {}),
        pendekatan: modalPendekatan.trim(),
        dataNyaman: modalDataNyaman.trim(),
        aksesData: modalAksesData.trim(),
        catatanAkses: modalCatatanAkses.trim(),
        halDihindari: modalHalDihindari.trim(),
        kondisiWaktu: modalKondisiWaktu.trim(),
        arahanDosen: supervisorDirection.trim(),
      },
    };

    saveSharedResearchContext(updatedContext);
    setShowAdjustDataModal(false);
  };


  // Reset Tool 4 State
  const handleConfirmReset = () => {
    setLiteraturePackage("");
    clearBedahDraft();
    setPastedLLMOutput4A("");
    clearBedahOutput();
    setParsedPayloadV2(null);
    clearBedahDirectionV2();
    setParsedPayloadV1(null);
    setParseError4A(null);
    setAuditFindings4A([]);
    setSelectedDirectionId(null);
    clearSelectedDirectionId();
    setIsPhenomenonAckChecked(false);
    setIsLitStructureAckChecked(false);
    setCopyStatus4A("idle");
    setShowResetModal(false);
    setToastMessage("Formulir paket literatur dan hasil Tool 4 berhasil direset.");
    setTimeout(() => {
      setToastMessage((prev) => (prev === "Formulir paket literatur dan hasil Tool 4 berhasil direset." ? null : prev));
    }, 3000);
  };

  if (!isMounted) {
    return (
      <div className="mt-8 space-y-10 animate-pulse">
        <section className="rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-xl sm:p-8">
          <div className="h-6 w-48 rounded bg-[#2E2748]/50"></div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-20 rounded-xl bg-[#0C0A1A]"></div>
            <div className="h-20 rounded-xl bg-[#0C0A1A] sm:col-span-2"></div>
            <div className="h-20 rounded-xl bg-[#0C0A1A]"></div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#FFB84D]/30 bg-[#0C0A1A]/95 px-5 py-3.5 text-sm font-semibold text-[#FFB84D] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FFB84D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 1: PERIKSA KONTEKS DAN BUKTI FENOMENA                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#2E2748]/70 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6D5AE6]/20 text-[#FFB84D] font-bold">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FBFAFF]">Konteks & Bukti Fenomena Terpilih</h2>
              <p className="text-xs text-[#A79FC4]">
                Data canonical dari langkah 1 (Cari Ide) dan langkah 2 (Cari & Validasi Fenomena).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAdjustDataModal}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-3.5 py-2 text-xs font-semibold text-[#FBFAFF] transition hover:border-[#6D5AE6] hover:bg-[#221A42]"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#FFB84D]" />
            <span>Sesuaikan Data</span>
          </button>
        </div>

        {/* Summary Context Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#2E2748]/80 bg-[#0C0A1A] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#A79FC4]/70 uppercase">
              Program Studi
            </span>
            <p className="mt-1 text-sm font-bold text-[#FBFAFF]">{prodi || "Belum ditentukan"}</p>
          </div>

          <div className="rounded-xl border border-[#2E2748]/80 bg-[#0C0A1A] p-4 sm:col-span-2">
            <span className="text-[13px] font-semibold tracking-wider text-[#A79FC4]/70 uppercase">
              Area Eksplorasi
            </span>
            <p className="mt-1 text-sm font-bold text-[#FBFAFF]">{areaEksplorasi || "Belum ditentukan"}</p>
          </div>

          <div className="rounded-xl border border-[#2E2748]/80 bg-[#0C0A1A] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#A79FC4]/70 uppercase">
              Pendekatan Disukai
            </span>
            <p className="mt-1 text-xs text-[#FBFAFF]">
              {getStudentLabel(sharedContext?.constraints?.pendekatan || sharedContext?.pendekatan || "Belum ditentukan")}
            </p>
          </div>

          <div className="rounded-xl border border-[#2E2748]/80 bg-[#0C0A1A] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#A79FC4]/70 uppercase">
              Data Nyaman
            </span>
            <p className="mt-1 text-xs text-[#FBFAFF]">
              {getStudentLabel(sharedContext?.constraints?.dataNyaman || sharedContext?.preferensi_data || "Belum ditentukan")}
            </p>
          </div>

          <div className="rounded-xl border border-[#2E2748]/80 bg-[#0C0A1A] p-4">
            <span className="text-[13px] font-semibold tracking-wider text-[#A79FC4]/70 uppercase">
              Akses Data & Waktu
            </span>
            <p className="mt-1 text-xs text-[#FBFAFF]">
              {getStudentLabel(sharedContext?.constraints?.aksesData || sharedContext?.akses_data || "Belum ditentukan")} (
              {getStudentLabel(sharedContext?.constraints?.kondisiWaktu || sharedContext?.target_waktu || "Waktu standar")})
            </p>
          </div>
        </div>

        {/* Phenomenon Card */}
        <div className="mt-6 rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <span className="text-[13px] font-semibold tracking-wider text-[#FFB84D] uppercase">
                {phenomenonBasisStatus === "VERIFIED_REAL_WORLD"
                  ? "Fenomena yang Sudah Dicek"
                  : phenomenonBasisStatus === "LITERATURE_INDICATED"
                  ? "Petunjuk Fenomena dari Literatur"
                  : "Bukti Fenomena Belum Tersedia"}
              </span>
              <h3 className="mt-1 text-base font-bold text-[#FBFAFF]">
                {selectedPhenomenon?.name || (phenomenonBasisStatus === "LITERATURE_INDICATED" ? "Petunjuk Fenomena dari Paket Literatur" : "Belum Memilih Fenomena Terpilih")}
              </h3>
            </div>
            {selectedPhenomenon?.status && (
              <span className="self-start rounded-full bg-[#6D5AE6]/20 px-3 py-1 text-xs font-semibold text-[#FFB84D]">
                {selectedPhenomenon.status}
              </span>
            )}
          </div>

          {selectedPhenomenon?.phenomenonSummary && (
            <p className="mt-3 text-sm text-[#A79FC4] leading-relaxed">
              {selectedPhenomenon.phenomenonSummary}
            </p>
          )}

          {/* Evidence Count & Warning */}
          {selectedPhenomenon?.evidence && selectedPhenomenon.evidence.length > 0 ? (
            <div className="mt-4 border-t border-[#2E2748]/60 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#FFB84D]">
                  {selectedPhenomenon.evidence.length} Bukti Fenomena Tersedia
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullPhenomenonEvidence(!showFullPhenomenonEvidence)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#A79FC4] hover:text-[#FBFAFF]"
                >
                  <span>{showFullPhenomenonEvidence ? "Sembunyikan Bukti" : "Lihat Rincian Bukti"}</span>
                  {showFullPhenomenonEvidence ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {showFullPhenomenonEvidence && (
                <div className="mt-3 space-y-2">
                  {selectedPhenomenon.evidence.map((ev, idx) => (
                    <div key={idx} className="rounded-lg border border-[#2E2748]/60 bg-[#191430] p-3 text-xs text-[#A79FC4]">
                      <div className="flex items-center justify-between text-[#FBFAFF] font-semibold">
                        <span>{ev.sourceTitle || `Bukti #${idx + 1}`}</span>
                        {ev.referencePeriod && <span className="text-[13px] text-[#FFB84D]">{ev.referencePeriod}</span>}
                      </div>
                      {ev.claim && <p className="mt-1 text-[#FBFAFF]">{ev.claim}</p>}
                      {ev.observedDataOrEvent && <p className="mt-1 text-[13px] text-[#A79FC4]">{ev.observedDataOrEvent}</p>}
                      {ev.url && safeHref(ev.url) && (
                        <a
                          href={safeHref(ev.url) as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[13px] text-[#6D5AE6] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Buka Tautan Sumber</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="space-y-2">
                  <p className="text-xs text-amber-200">
                    Petunjuk ini membantu menentukan arah pencarian, tetapi belum cukup disebut sebagai bukti fenomena dunia nyata.
                  </p>
                  <label className="flex items-center gap-2 text-xs text-[#FBFAFF] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPhenomenonAckChecked}
                      onChange={(e) => setIsPhenomenonAckChecked(e.target.checked)}
                      className="rounded border-[#2E2748] bg-[#0C0A1A] text-[#6D5AE6] focus:ring-0"
                    />
                    <span>Saya mengerti dan ingin tetap melanjutkan dengan petunjuk literatur.</span>
                  </label>
                </div>
              </div>
              <div className="border-t border-amber-500/20 pt-2 flex items-center justify-between">
                <a
                  href="/tools/cari-fenomena-awal"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB84D] hover:underline"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Kembali ke Tool 2 untuk melengkapi bukti fenomena dunia nyata</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 2: PAKET BUKTI LITERATUR DARI NOTEBOOKLM                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#2E2748]/70 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6D5AE6]/20 text-[#FFB84D] font-bold">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FBFAFF]">Paket Bukti Literatur dari NotebookLM</h2>
              <p className="text-xs text-[#A79FC4]">
                Tempelkan hasil lengkap Prompt B (Langkah 2 — Ekstrak Paket Bukti) dari NotebookLM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                if (literaturePackage.trim().length > 0 || pastedLLMOutput4A.trim().length > 0 || parsedPayloadV2 !== null) {
                  setShowResetModal(true);
                } else {
                  handleConfirmReset();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#A79FC4] hover:border-[#FF5C8A]/50 hover:text-[#FF5C8A] transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5C8A] focus-visible:outline-none cursor-pointer"
              aria-label="Reset formulir paket literatur dan hasil Tool 4"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Form</span>
            </button>

            {litValidation.status === "STRUKTUR_LENGKAP" && (
              <button
                type="button"
                onClick={() => setShowRawLitInput(!showRawLitInput)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFB84D] hover:underline cursor-pointer ml-2"
              >
                <span>{showRawLitInput ? "Sembunyikan Hasil Mentah" : "Lihat Hasil Mentah"}</span>
                {showRawLitInput ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex justify-end">
            <TombolTempelClipboard onPaste={handleLiteraturePackageChange} />
          </div>
          {(litValidation.status !== "STRUKTUR_LENGKAP" || showRawLitInput) && (
            <div className="relative animate-fade-in">
              <textarea
                rows={8}
                value={literaturePackage}
                onChange={(e) => handleLiteraturePackageChange(e.target.value)}
                placeholder="Tempelkan teks output Prompt B dari NotebookLM di sini (harus memuat tabel Source Register dan Matriks Bukti)..."
                className="w-full rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 font-mono text-xs text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6]"
              />
            </div>
          )}

          {/* Validation Feedback */}
          {literaturePackage.trim().length > 0 && (
            <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A79FC4]">Status Validasi Struktur:</span>
                {litValidation.status === "STRUKTUR_LENGKAP" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFB84D]/20 px-3 py-1 text-xs font-semibold text-[#FFB84D]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Struktur Lengkap & Terverifikasi</span>
                  </span>
                )}
                {litValidation.status === "STRUKTUR_PERLU_DIPERIKSA" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Perlu Diperiksa</span>
                  </span>
                )}
                {litValidation.status === "PAKET_TIDAK_DIKENALI" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Format Belum Sesuai</span>
                  </span>
                )}
              </div>

              {litValidation.notes && litValidation.notes.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-[#A79FC4]">
                  {litValidation.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#6D5AE6]">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}

              {sumberUntukDiperiksa.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-[#2E2748]/60 pt-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-[#A79FC4]">
                      Periksa {sumberUntukDiperiksa.length} sumber di paket ini ke Crossref/OpenAlex (gratis).
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TombolPeriksaSumber
                        jumlah={sumberUntukDiperiksa.length}
                        sedangProses={sedangVerifikasi}
                        onClick={() => periksaSumber(sumberUntukDiperiksa)}
                      />
                      <TombolUnduhBibtex
                        daftar={sumberUntukDiperiksa}
                        hasil={verifikasiSumber}
                        klasifikasi="Tool-4"
                      />
                    </div>
                  </div>
                  <RingkasanVerifikasi hasil={verifikasiSumber} catatan={verifikasiCatatan} />
                  <PanelRingkasanDanTerkait daftar={sumberUntukDiperiksa} />
                </div>
              )}

              {litValidation.status === "STRUKTUR_PERLU_DIPERIKSA" && (
                <label className="mt-3 flex items-center gap-2 text-xs text-[#FBFAFF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLitStructureAckChecked}
                    onChange={(e) => setIsLitStructureAckChecked(e.target.checked)}
                    className="rounded border-[#2E2748] bg-[#0C0A1A] text-[#6D5AE6] focus:ring-0"
                  />
                  <span>Saya mengonfirmasi bahwa teks yang ditempel sudah memuat bukti utama yang cukup.</span>
                </label>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 3: PROMPT 4A (BEDAH BUKTI & EKSPLORASI ARAH)                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#2E2748]/70 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6D5AE6]/20 text-[#FFB84D] font-bold">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FBFAFF]">Prompt Tahap 4A — Bedah Bukti & Eksplorasi Arah</h2>
              <p className="text-xs text-[#A79FC4]">
                Jalankan prompt ini di ChatGPT (GPT-4o/o1) atau Gemini (1.5 Pro) untuk menghasilkan 2–4 alternatif arah.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                promptAnalysis4A.status === "SAFE"
                  ? "bg-[#FFB84D]/20 text-[#FFB84D]"
                  : promptAnalysis4A.status === "WARNING"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {promptAnalysis4A.finalLength.toLocaleString("id-ID")} karakter
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Pratinjau selalu tampil: beberapa baris pertama prompt, tanpa membuka prompt teknis penuh */}
          <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4">
            <pre className="font-mono text-xs leading-relaxed text-[#A79FC4] whitespace-pre-wrap line-clamp-4 select-all">
              {generatedPrompt4A}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canGeneratePrompt4A || promptAnalysis4A.status === "BLOCKED"}
              onClick={handleCopyPrompt4A}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6D5AE6] to-[#1E40AF] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#6D5AE6]/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {copyStatus4A === "copied" ? (
                <>
                  <Check className="h-4 w-4 text-[#FFB84D]" />
                  <span>Prompt 4A Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin Prompt Tahap 4A</span>
                </>
              )}
            </button>

            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#2E2748] bg-[#0C0A1A] px-4 py-3 text-xs font-semibold text-[#FBFAFF] transition hover:border-[#6D5AE6] hover:bg-[#221A42]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#FFB84D]" />
              <span>Buka ChatGPT</span>
            </a>

            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#2E2748] bg-[#0C0A1A] px-4 py-3 text-xs font-semibold text-[#FBFAFF] transition hover:border-[#6D5AE6] hover:bg-[#221A42]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#FFB84D]" />
              <span>Buka Gemini</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAHAP 4: OUTPUT 4A & PROGRESSIVE DISCLOSURE                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-xl sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#2E2748]/70 pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6D5AE6]/20 text-[#FFB84D] font-bold">
            4
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FBFAFF]">Hasil Analisis Tahap 4A (Bedah Bukti)</h2>
            <p className="text-xs text-[#A79FC4]">
              Tempelkan output lengkap dari ChatGPT/Gemini di sini untuk memetakan gap dan 2–4 alternatif arah.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex justify-end">
            <TombolTempelClipboard onPaste={setPastedLLMOutput4A} />
          </div>
          <textarea
            rows={6}
            value={pastedLLMOutput4A}
            onChange={(e) => setPastedLLMOutput4A(e.target.value)}
            placeholder="Tempelkan hasil respons dari ChatGPT / Gemini (termasuk blok SKRIFLOW_DIRECTION_V2) di sini..."
            className="w-full rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 font-mono text-xs text-[#FBFAFF] placeholder-[#A79FC4]/40 focus:border-[#6D5AE6] focus:outline-none"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleProcessLLMOutput4A}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D5AE6] min-h-[44px] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#1E40AF]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Verifikasi & Proses Hasil 4A</span>
            </button>
          </div>

          {/* Temuan audit konten (red line akademik): klaim kausal, klaim
              ketiadaan bukti, pengaman klaim hilang, sumber tanpa identitas. */}
          {auditFindings4A.length > 0 && (() => {
            const errors = auditFindings4A.filter((x) => x.severity === "ERROR");
            const warnings = auditFindings4A.filter((x) => x.severity !== "ERROR");
            const tampil = [...errors, ...warnings].slice(0, 8);
            return (
              <div
                className={`rounded-xl border p-4 space-y-2 ${
                  errors.length > 0
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-[#FF9E5E]/30 bg-[#FF9E5E]/10"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#FBFAFF]">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-[#FF9E5E]" aria-hidden="true" />
                  <span>
                    Pemeriksaan Akademik: {auditFindings4A.length} temuan
                    {errors.length > 0 ? ` (${errors.length} perlu diperbaiki)` : ""}
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#FBFAFF]">
                  {tampil.map((x, i) => (
                    <li key={i} className="leading-relaxed">
                      <span
                        className={`mr-1.5 rounded px-1 py-0.5 text-[11px] font-bold ${
                          x.severity === "ERROR"
                            ? "bg-rose-500/25 text-rose-300"
                            : "bg-[#FF9E5E]/25 text-[#FF9E5E]"
                        }`}
                      >
                        {x.severity === "ERROR" ? "PERLU DIPERBAIKI" : "CATATAN"}
                      </span>
                      {x.message}
                    </li>
                  ))}
                </ul>
                {auditFindings4A.length > tampil.length && (
                  <p className="text-[12px] text-[#A79FC4]">
                    +{auditFindings4A.length - tampil.length} temuan lain pada daftar sumber.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Parse Errors & Repair Actions */}
          {parseError4A && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                <div className="space-y-3 w-full">
                  {(() => {
                    const g4a = jelaskanGalat4A(parseError4A.details || []);
                    return (
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-wide text-rose-300/80">
                          Bukan error aplikasi — jawaban AI-nya yang belum lengkap
                        </p>
                        <h4 className="mt-1 text-base font-bold text-rose-200">{g4a.judul}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-rose-100">{g4a.artinya}</p>
                        <p className="mt-2 text-sm leading-relaxed text-rose-200/90">
                          <span className="font-semibold">Kenapa Skriflow menolak: </span>
                          {g4a.kenapaDitolak}
                        </p>
                        <p className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-semibold leading-relaxed text-rose-100">
                          Yang perlu kamu lakukan: jangan isi ulang form. Kembali ke chat AI yang
                          tadi (ChatGPT / Gemini), tempel jawaban barusan, lalu kirim tombol
                          &quot;Salin Prompt Perbaikan&quot; di bawah ini. AI akan memperbaiki
                          jawabannya, dan hasil barunya kamu tempel lagi ke kolom atas.
                        </p>
                      </div>
                    );
                  })()}
                  {parseError4A.details && parseError4A.details.length > 0 && (
                    <details className="rounded-lg bg-rose-500/10 px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-rose-200/80">
                        Lihat rincian teknis ({parseError4A.details.length} bagian)
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-rose-200/70">
                        {parseError4A.details.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-500/20">
                    <button
                      type="button"
                      onClick={() => {
                        const fixPrompt = generateBedahFixStructurePrompt4A(pastedLLMOutput4A, parseError4A.details);
                        copyToClipboard(fixPrompt);
                        setToastMessage("Prompt Perbaikan Isi tersalin — tempel ke chat AI yang sama.");
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-100 hover:bg-rose-500/40"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Salin Prompt Perbaikan Isi (disarankan)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fixPrompt = generateBedahFixFormatPrompt4A(pastedLLMOutput4A, parseError4A.details);
                        copyToClipboard(fixPrompt);
                        setToastMessage("Prompt Perbaikan Format tersalin — pakai kalau masalahnya cuma soal penulisan.");
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-200/80 hover:bg-rose-500/15"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Salin Prompt Perbaikan Format (kalau penandanya rusak)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* V1 FALLBACK BADGE                                                         */}
        {/* ========================================================================= */}
        {parsedPayloadV1 && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Format V1 Terdeteksi</h4>
                <p className="mt-1 text-xs text-amber-200">
                  Data dapat dibaca, tetapi belum memiliki seluruh komponen Paket Fondasi Bab 1 (Peta Pengetahuan V2, Komparabilitas Studi, dan Uji Kelayakan 4B).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyPrompt4A();
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-[#0C0A1A] hover:bg-amber-400"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Salin Prompt V2 & Buat Ulang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* V2 PROGRESSIVE DISCLOSURE DISPLAY                                         */}
        {/* ========================================================================= */}
        {parsedPayloadV2 && (
          <div className="mt-8 space-y-6">
            {/* Tab Navigation — dikelompokkan jadi 3 supaya mahasiswa tidak disodori
                tujuh pintu sekaligus. Isi tiap tab tidak berubah; hanya cara memilihnya. */}
            <div className="flex flex-wrap gap-2 border-b border-[#2E2748] pb-3">
              {KELOMPOK_TAB_4A.map((k) => {
                const aktif = k.isi.some((v) => v.id === activeTab4A);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setActiveTab4A(k.buka)}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                      aktif ? "bg-[#6D5AE6] text-white" : "bg-[#0C0A1A] text-[#A79FC4] hover:text-[#FBFAFF]"
                    }`}
                  >
                    <k.Ikon className="h-3.5 w-3.5" />
                    <span>
                      {k.label}
                      {k.hitung ? ` (${k.hitung(parsedPayloadV2)})` : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-pilihan: hanya muncul untuk kelompok yang isinya lebih dari satu tampilan */}
            {(() => {
              const grup = KELOMPOK_TAB_4A.find((k) => k.isi.some((v) => v.id === activeTab4A));
              if (!grup || grup.isi.length < 2) return null;
              return (
                <div className="flex flex-wrap gap-2">
                  {grup.isi.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveTab4A(v.id)}
                      className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                        activeTab4A === v.id
                          ? "border border-[#FFB84D]/60 bg-[#FFB84D]/10 text-[#FFB84D]"
                          : "border border-[#2E2748] bg-[#0C0A1A] text-[#A79FC4] hover:text-[#FBFAFF]"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* TAB 1: 2-4 ALTERNATIF ARAH */}
            {activeTab4A === "directions" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#FBFAFF]">
                      Pilih Satu Arah Penelitian untuk Masuk ke Uji Kelayakan & Fondasi Bab 1:
                    </h3>
                    <p className="text-xs text-[#A79FC4]">
                      Pilih arah yang paling masuk akal buat kondisi kamu. Pilihan alternatif lain tetap tersimpan aman.
                    </p>
                  </div>
                  <span className="text-xs text-[#FFB84D] shrink-0 font-medium">Tidak ada pilihan otomatis—kamu yang menentukan</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {parsedPayloadV2.directions.map((dir) => {
                    const isSelected = selectedDirectionId === dir.id;
                    const polaJudul = susunPolaJudul(dir, {
                      objectOrPopulation: selectedPhenomenon?.scope?.objectOrPopulation,
                      referencePeriod: selectedPhenomenon?.scope?.referencePeriod,
                    });
                    const badgeClass =
                      dir.conditional_badge === "Paling Dekat dengan Fenomena"
                        ? "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]"
                        : dir.conditional_badge === "Lebih Aman untuk Tenggat"
                        ? "bg-[#6D5AE6]/15 border border-[#6D5AE6]/30 text-blue-300"
                        : dir.conditional_badge === "Data Perlu Dicek"
                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                        : dir.conditional_badge === "Perlu Fokus Lebih Sempit"
                        ? "bg-purple-500/15 border border-purple-500/30 text-purple-300"
                        : dir.conditional_badge === "Bukti Literatur Masih Terbatas"
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                        : "bg-[#2E2748] text-[#A79FC4]";

                    return (
                      <div
                        key={dir.id}
                        onClick={() => handleSelectDirection(dir.id)}
                        className={`cursor-pointer rounded-xl border p-5 transition space-y-3.5 ${
                          isSelected
                            ? "border-[#FFB84D] bg-[#0C0A1A] shadow-lg shadow-[#FFB84D]/10 ring-2 ring-[#FFB84D]"
                            : "border-[#2E2748] bg-[#0C0A1A] hover:border-[#6D5AE6] hover:bg-[#191430]"
                        }`}
                      >
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-[#6D5AE6]/20 px-2 py-0.5 text-[13px] font-bold text-[#FFB84D]">
                                {dir.id}
                              </span>
                              {dir.conditional_badge && (
                                <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${badgeClass}`}>
                                  {dir.conditional_badge}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[#FBFAFF]">{dir.name}</h4>
                          </div>
                          <div>
                            {(() => {
                              const readInfo = getStudentStatus(dir.readiness);
                              return (
                                <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${readInfo.badgeClass}`}>
                                  {readInfo.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Problem Focus & Phenomenon Connection */}
                        <div className="space-y-2 text-xs text-[#A79FC4] leading-relaxed">
                          <p>{dir.problem_focus}</p>
                          {dir.phenomenon_connection && (
                            <div className="rounded-lg bg-[#191430] p-2.5 text-[13px]">
                              <span className="font-semibold text-[#FFB84D]">Hubungan dengan Fenomena: </span>
                              <span className="text-[#FBFAFF]">{dir.phenomenon_connection}</span>
                            </div>
                          )}
                        </div>

                        {/* Gambaran Bentuk Judul (pola, bukan judul final) */}
                        <div className="rounded-lg border border-dashed border-[#6D5AE6]/40 bg-[#0B1226] p-2.5 text-[13px] space-y-1.5">
                          <span className="font-semibold text-[#FBFAFF] block">
                            Kira-kira judulnya bakal begini:
                          </span>
                          <p className="font-mono text-[13px] text-[#FFB84D] leading-snug">{polaJudul.pola}</p>
                          {polaJudul.contoh_terisi !== polaJudul.pola && (
                            <p className="text-[13px] text-[#FBFAFF] leading-snug">
                              <span className="text-[12px] uppercase font-bold text-[#8A94B0] block">Contoh terisi:</span>
                              {polaJudul.contoh_terisi}
                            </p>
                          )}
                          {polaJudul.slot_terisi.length > 0 && (
                            <ul className="text-[13px] text-[#A79FC4] space-y-0.5">
                              {polaJudul.slot_terisi.map((s) => (
                                <li key={s.slot}>
                                  <span className="font-mono text-[#FFB84D]/80">[{s.slot}]</span> = {s.nilai}
                                </li>
                              ))}
                            </ul>
                          )}
                          {polaJudul.slot_belum_diputuskan.length > 0 && (
                            <details className="text-[13px]">
                              <summary className="cursor-pointer text-amber-300/90">
                                {polaJudul.slot_belum_diputuskan.length} hal yang belum bisa diisi otomatis
                              </summary>
                              <ul className="list-disc pl-3.5 pt-1 text-[#A79FC4] space-y-0.5">
                                {polaJudul.slot_belum_diputuskan.map((x, i) => (
                                  <li key={i}>{x}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                          <p className="text-[12px] text-[#8A94B0] italic">{polaJudul.batas}</p>
                        </div>

                        {/* Measurement Focus */}
                        {dir.measurement_focus && (
                          <div className="rounded-lg bg-[#191430] p-2.5 text-[13px] text-[#A79FC4] space-y-1">
                            <div>
                              <span className="font-semibold text-[#FBFAFF]">Ukuran/Hasil Utama: </span>
                              <span className="font-bold text-[#FFB84D]">{dir.measurement_focus.primary_outcome}</span>
                            </div>
                            {dir.measurement_focus.supporting_outcome && (
                              <div>
                                <span className="font-semibold text-[#FBFAFF]">Ukuran/Hasil Pendukung: </span>
                                <span>{dir.measurement_focus.supporting_outcome}</span>
                              </div>
                            )}
                            {dir.measurement_focus.non_equivalence_note && (
                              <p className="text-[13px] text-amber-300/90 italic pt-0.5">
                                * {dir.measurement_focus.non_equivalence_note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Claim Boundary */}
                        {dir.claim_boundary && (
                          <div className="rounded-lg border border-[#2E2748]/60 bg-[#191430]/80 p-2.5 text-[13px] space-y-1.5">
                            <span className="font-semibold text-[#FBFAFF] block">Batas Klaim yang Aman:</span>
                            {dir.claim_boundary.safe_to_say.length > 0 && (
                              <div className="text-[#FFB84D]">
                                <span className="text-[13px] uppercase font-bold text-[#FFB84D]/70 block">Aman Dinyatakan:</span>
                                <ul className="list-disc pl-3.5 space-y-0.5">
                                  {dir.claim_boundary.safe_to_say.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {dir.claim_boundary.not_safe_to_say.length > 0 && (
                              <div className="text-amber-300/90">
                                <span className="text-[13px] uppercase font-bold text-amber-400/70 block">Belum Aman Dinyatakan:</span>
                                <ul className="list-disc pl-3.5 space-y-0.5">
                                  {dir.claim_boundary.not_safe_to_say.map((ns, idx) => (
                                    <li key={idx}>{ns}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata Details */}
                        <div className="space-y-1.5 border-t border-[#2E2748]/60 pt-3 text-[13px] text-[#A79FC4]">
                          <div>
                            <span className="font-semibold text-[#FBFAFF]">Kandidat Celah Penelitian: </span>
                            <span className="space-x-1.5">
                              {dir.gap_ids.map((gid) => {
                                const matchingGap = parsedPayloadV2.candidate_gaps.find((g) => g.id === gid);
                                const statusLabel = matchingGap?.gap_status
                                  ? getStudentStatus(matchingGap.gap_status).label
                                  : "Gap";
                                return (
                                  <span key={gid} className="inline-flex items-center gap-1 rounded bg-[#191430] px-1.5 py-0.5 text-[13px] text-[#FBFAFF]">
                                    <strong className="text-[#FFB84D]">{gid}</strong>
                                    {matchingGap?.gap_status && (
                                      <span className="text-[#A79FC4]">({statusLabel})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#FBFAFF]">Kebutuhan Data Minimum: </span>
                            <span>{dir.data_needs.join("; ")}</span>
                          </div>
                          {dir.why_worth_considering && (
                            <div>
                              <span className="font-semibold text-[#FBFAFF]">Alasan Layak Dipertimbangkan: </span>
                              <span>{dir.why_worth_considering}</span>
                            </div>
                          )}
                          {dir.unresolved_items && dir.unresolved_items.length > 0 && (
                            <div>
                              <span className="font-semibold text-amber-300">Hal yang Perlu Dipastikan: </span>
                              <span>{dir.unresolved_items.join("; ")}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Card: 3 separate labels (Kesesuaian, Beban, Risiko) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2E2748]/60 pt-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#A79FC4]">
                            <span>
                              Kesesuaian: <strong className="text-[#FBFAFF]">{formatConstraintFitLabel(dir.constraint_fit)}</strong>
                            </span>
                            <span className="text-[#2E2748]">|</span>
                            <span>
                              Beban: <strong className="text-[#FBFAFF]">{formatWorkloadLabel(dir.workload)}</strong>
                            </span>
                            <span className="text-[#2E2748]">|</span>
                            <span>
                              Risiko: <strong className="text-[#FBFAFF]">{deriveDirectionRiskLevel(dir.workload_risk, dir.workload)}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${
                              isSelected
                                ? "bg-[#FFB84D] text-[#0C0A1A]"
                                : "bg-[#6D5AE6]/20 text-[#6D5AE6] group-hover:bg-[#6D5AE6] group-hover:text-white"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Arah Terpilih</span>
                              </>
                            ) : (
                              <>
                                <span>Pilih Arah Ini</span>
                                <ArrowRight className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: DASAR BUKTI (EVIDENCE BASIS) */}
            {activeTab4A === "evidence_basis" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#FBFAFF]">
                    Dasar Bukti: Pemisahan Fakta, Literatur, dan Hal yang Belum Pasti
                  </h3>
                  <span className="text-xs text-[#A79FC4]">
                    Mencegah klaim spekulatif tanpa rujukan
                  </span>
                </div>

                {parsedPayloadV2.evidence_basis ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FFB84D]" />
                        <h4 className="text-xs font-bold text-[#FFB84D] uppercase tracking-wider">
                          Fenomena yang Terlihat
                        </h4>
                      </div>
                      <p className="text-[13px] text-[#A79FC4]">
                        Kondisi, pola, perubahan, peristiwa, atau perbedaan nyata yang diamati pada objek dan periode.
                      </p>
                      <ul className="space-y-2 text-xs text-[#FBFAFF]">
                        {parsedPayloadV2.evidence_basis.observed_phenomenon.map((item, idx) => (
                          <li key={idx} className="rounded bg-[#191430] p-2.5 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#6D5AE6]" />
                        <h4 className="text-xs font-bold text-[#6D5AE6] uppercase tracking-wider">
                          Temuan Penelitian Terdahulu
                        </h4>
                      </div>
                      <p className="text-[13px] text-[#A79FC4]">
                        Kesimpulan yang benar-benar dilaporkan oleh artikel/studi dalam Paket Bukti.
                      </p>
                      <ul className="space-y-2 text-xs text-[#FBFAFF]">
                        {parsedPayloadV2.evidence_basis.prior_study_findings.map((item, idx) => (
                          <li key={idx} className="rounded bg-[#191430] p-2.5 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Hal yang Belum Bisa Disimpulkan
                        </h4>
                      </div>
                      <p className="text-[13px] text-[#A79FC4]">
                        Klaim yang belum memiliki bukti cukup, belum dapat digeneralisasi, atau perlu dicek.
                      </p>
                      <ul className="space-y-2 text-xs text-[#FBFAFF]">
                        {parsedPayloadV2.evidence_basis.not_yet_established.map((item, idx) => (
                          <li key={idx} className="rounded bg-[#191430] p-2.5 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-amber-300">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span>Data Dasar Bukti Belum Tersedia di Output Ini</span>
                    </div>
                    <p className="mt-1 text-[#A79FC4]">
                      Output ini menggunakan format terdahulu. Silakan buat ulang output V2 jika memerlukan pemisahan tiga arah eksplisit antara fenomena nyata, temuan studi terdahulu, dan hal yang belum bisa disimpulkan.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KANDIDAT RESEARCH GAP */}
            {activeTab4A === "gaps" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#FBFAFF]">
                    Kandidat Celah Penelitian
                  </h3>
                  <span className="text-xs text-amber-300/90 font-medium">
                    Kandidat gap ini belum otomatis menjadi research gap final
                  </span>
                </div>

                {parsedPayloadV2.candidate_gaps.map((gap) => (
                  <div key={gap.id} className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#6D5AE6]/20 px-2 py-0.5 text-xs font-bold text-[#FFB84D]">
                          {gap.id}
                        </span>
                        <span className="text-xs font-semibold text-[#FBFAFF]">
                          {getGapTypeInfo(gap.gap_type).label}
                        </span>
                      </div>
                      {(() => {
                        const statusKey = gap.gap_status || gap.strength;
                        const strInfo = getStudentStatus(statusKey);
                        return (
                          <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${strInfo.badgeClass}`}>
                            {strInfo.label}
                          </span>
                        );
                      })()}
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[#FBFAFF]">{gap.statement}</p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-[#A79FC4]">
                      <div className="rounded-lg bg-[#191430] p-3">
                        <span className="font-semibold text-[#FFB84D]">Yang Sudah Diketahui:</span>
                        <ul className="mt-1 list-disc pl-4 space-y-0.5">
                          {gap.what_is_known.map((k, idx) => (
                            <li key={idx}>{k}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-[#191430] p-3">
                        <span className="font-semibold text-amber-400">Yang Belum Cukup Dijelaskan:</span>
                        <p className="mt-1">{gap.what_is_unexplained}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[#A79FC4]/80">
                      <span>Sumber: <strong className="text-[#FBFAFF]">{gap.source_ids.join(", ")}</strong></span>
                      <span>Dasar Komparabilitas: <strong className="text-[#FBFAFF]">{gap.comparability_basis}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: PETA PENGETAHUAN & KETERBANDINGAN */}
            {activeTab4A === "knowledge" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5">
                    <h4 className="text-xs font-bold text-[#FFB84D] uppercase">Pengetahuan yang Terbukti</h4>
                    <ul className="mt-3 space-y-2 text-xs text-[#A79FC4]">
                      {parsedPayloadV2.knowledge_map.established_knowledge.map((item, idx) => (
                        <li key={idx} className="rounded bg-[#191430] p-2.5">
                          <p className="font-medium text-[#FBFAFF]">{item.statement}</p>
                          <span className="mt-1 block text-[13px] text-[#6D5AE6]">Sumber: {item.source_ids.join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5">
                    <h4 className="text-xs font-bold text-amber-400 uppercase">Temuan yang Berbeda / Inkonsisten</h4>
                    <ul className="mt-3 space-y-2 text-xs text-[#A79FC4]">
                      {parsedPayloadV2.knowledge_map.differing_findings.map((item, idx) => (
                        <li key={idx} className="rounded bg-[#191430] p-2.5">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[#FBFAFF]">{item.statement}</p>
                            <span className="rounded bg-[#2E2748] px-2 py-0.5 text-[13px] font-bold text-amber-300">
                              {item.comparability}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-[#A79FC4]">{item.explanation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Comparability Groups */}
                {parsedPayloadV2.comparability_groups && parsedPayloadV2.comparability_groups.length > 0 && (
                  <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5">
                    <h4 className="text-xs font-bold text-[#FBFAFF] uppercase">Audit Keterbandingan Studi</h4>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs text-[#A79FC4]">
                        <thead className="border-b border-[#2E2748] text-[#FFB84D]">
                          <tr>
                            <th className="py-2 pr-4">ID</th>
                            <th className="py-2 pr-4">Sumber</th>
                            <th className="py-2 pr-4">Konstruk / Outcome</th>
                            <th className="py-2 pr-4">Keterbandingan</th>
                            <th className="py-2">Alasan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2E2748]/40">
                          {parsedPayloadV2.comparability_groups.map((cg) => (
                            <tr key={cg.id}>
                              <td className="py-2.5 pr-4 font-bold text-[#FBFAFF]">{cg.id}</td>
                              <td className="py-2.5 pr-4">{cg.source_ids.join(", ")}</td>
                              <td className="py-2.5 pr-4">{cg.construct_or_predictor} → {cg.outcome}</td>
                              <td className="py-2.5 pr-4">
                                <span className="rounded bg-[#2E2748] px-2 py-0.5 text-[13px] font-bold text-[#FFB84D]">
                                  {getStudentLabel(cg.comparability)}
                                </span>
                              </td>
                              <td className="py-2.5 text-[13px]">{cg.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FENOMENA & MASALAH */}
            {activeTab4A === "phenomenon" && (
              <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5 space-y-4 text-xs text-[#A79FC4]">
                <div>
                  <h4 className="font-bold text-[#FFB84D] uppercase">Fenomena yang Sudah Dicek</h4>
                  <p className="mt-1 text-sm text-[#FBFAFF]">{parsedPayloadV2.calibrated_phenomenon.summary}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-[#191430] p-3">
                    <span className="font-semibold text-amber-300">Masalah Empiris:</span>
                    <p className="mt-1">{parsedPayloadV2.calibrated_phenomenon.empirical_problem}</p>
                  </div>
                  <div className="rounded-lg bg-[#191430] p-3">
                    <span className="font-semibold text-[#6D5AE6]">Masalah Pengetahuan:</span>
                    <p className="mt-1">{parsedPayloadV2.calibrated_phenomenon.knowledge_problem}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AUDIT BAHAN */}
            {activeTab4A === "audit" && (
              <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A79FC4] uppercase">Status Kelayakan Input:</span>
                  {(() => {
                    const audInfo = getStudentStatus(parsedPayloadV2.input_audit.status);
                    return (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${audInfo.badgeClass}`}>
                        {audInfo.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                  <div className="rounded-lg bg-[#191430] p-3">
                    <span className="text-xs text-[#A79FC4]">Sumber Fenomena</span>
                    <p className="text-lg font-bold text-[#FBFAFF]">{parsedPayloadV2.input_audit.phenomenon_source_count}</p>
                  </div>
                  <div className="rounded-lg bg-[#191430] p-3">
                    <span className="text-xs text-[#A79FC4]">Sumber Inti</span>
                    <p className="text-lg font-bold text-[#FFB84D]">{parsedPayloadV2.input_audit.core_source_count}</p>
                  </div>
                  <div className="rounded-lg bg-[#191430] p-3">
                    <span className="text-xs text-[#A79FC4]">Sumber Pendukung</span>
                    <p className="text-lg font-bold text-[#FBFAFF]">{parsedPayloadV2.input_audit.supporting_source_count}</p>
                  </div>
                  <div className="rounded-lg bg-[#191430] p-3">
                    <span className="text-xs text-[#A79FC4]">Diabaikan</span>
                    <p className="text-lg font-bold text-rose-400">{parsedPayloadV2.input_audit.ignored_source_count}</p>
                  </div>
                </div>

                {/* Source Weights Classification (Section A.5) */}
                {parsedPayloadV2.source_weights && parsedPayloadV2.source_weights.length > 0 && (
                  <div className="space-y-2 border-t border-[#2E2748]/60 pt-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h5 className="text-xs font-bold text-[#FBFAFF]">Klasifikasi Bobot Kualitas Sumber:</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#A79FC4]">Klaim inti Bab 1 tidak boleh hanya bersandar pada sumber pendukung</span>
                        <TombolPeriksaSumber
                          jumlah={sumberUntukDiperiksa.length}
                          sedangProses={sedangVerifikasi}
                          onClick={() => periksaSumber(sumberUntukDiperiksa)}
                        />
                        <TombolUnduhBibtex
                          daftar={sumberUntukDiperiksa}
                          hasil={verifikasiSumber}
                          klasifikasi="Tool-4"
                        />
                      </div>
                    </div>

                    <RingkasanVerifikasi hasil={verifikasiSumber} catatan={verifikasiCatatan} />
                    <PanelRingkasanDanTerkait daftar={sumberUntukDiperiksa} />
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {parsedPayloadV2.source_weights.map((sw) => {
                        const swStatus = getStudentStatus(sw.weight);
                        return (
                          <div key={sw.source_id} className="rounded-lg bg-[#191430] p-3 text-xs space-y-1 border border-[#2E2748]/50">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#FBFAFF]">{sw.source_id}</span>
                              <span className="flex items-center gap-1">
                                <LencanaVerifikasi hasil={verifikasiSumber[sw.source_id]} />
                                <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${swStatus.badgeClass}`}>
                                  {swStatus.label}
                                </span>
                              </span>
                            </div>
                            <p className="text-[13px] text-[#A79FC4] leading-snug">{sw.reason || sw.note}</p>
                            {verifikasiSumber[sw.source_id]?.judulDitemukan && (
                              <p className="text-[12.5px] text-[#FFB84D]/90 leading-snug">
                                Terdaftar: {String(verifikasiSumber[sw.source_id].judulDitemukan ?? "").slice(0, 90)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: REKOMENDASI BERSYARAT */}
            {activeTab4A === "recommendation" && (
              <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FFB84D] uppercase">Rekomendasi Sementara (Bukan Pilihan Otomatis)</h4>
                  <span className="rounded bg-[#2E2748] px-2 py-0.5 text-[13px] text-[#A79FC4]">
                    Pilihan Akhir di Mahasiswa
                  </span>
                </div>
                <p className="text-xs text-[#FBFAFF] leading-relaxed">
                  {parsedPayloadV2.conditional_recommendation.reasoning}
                </p>
                {parsedPayloadV2.conditional_recommendation.conditions && (
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#A79FC4]">
                    {parsedPayloadV2.conditional_recommendation.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* HANDOFF: lanjut ke penulisan Bab 1 */}
      <SequentialNavigation
        previousStep={{ label: "Kembali ke Cari Literatur Awal", href: "/tools/cari-literatur-awal" }}
        nextStep={{
          eyebrow: "LANJUT KE PENULISAN",
          title: "Susun Bab 1",
          href: "/tools/susun-bab-1",
        }}
        isNextEnabled={!!selectedDirectionId}
        nextStatusLabel="Arah sudah dipilih — siap disusun"
        nextDisabledReason="Pilih satu arah dulu di Tahap 4"
        nextHelperText="Tool 4 selesai di sini: tugasnya membedah fenomena dan literatur. Penyusunan Bab 1 (peta narasi, kerangka, atau draf) ada di halaman berikutnya."
      />

      {/* MODAL: SESUAIKAN DATA */}
      {showAdjustDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#2E2748] bg-[#191430] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#FBFAFF]">Sesuaikan Konteks Mahasiswa</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-[#A79FC4]">Program Studi</label>
                <input
                  type="text"
                  value={modalProdi}
                  onChange={(e) => setModalProdi(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-2 text-[#FBFAFF]"
                />
              </div>
              <div>
                <label className="text-[#A79FC4]">Area Eksplorasi</label>
                <input
                  type="text"
                  value={modalArea}
                  onChange={(e) => setModalArea(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-2 text-[#FBFAFF]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdjustDataModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-[#A79FC4]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveAdjustDataModal}
                className="rounded-lg bg-[#6D5AE6] px-4 py-2 text-xs font-bold text-white"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET TOOL 4 */}
      {showResetModal && (
        <ResetConfirmModal
          isOpen={showResetModal}
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetModal(false)}
          toolName="Bedah Fenomena & Literatur"
          title="Reset Formulir & Hasil Tool 4?"
          description="Tindakan ini akan mengosongkan paket bukti literatur yang ditempel serta seluruh hasil analisis tahap bedah. Data dari Cari Ide, Cari Fenomena, dan Cari Literatur tidak akan terhapus."
          confirmButtonText="Ya, Reset Tool 4"
        />
      )}
    </div>
  );
};
