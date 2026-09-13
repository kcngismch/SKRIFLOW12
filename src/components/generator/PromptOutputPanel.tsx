"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tool, PlatformTarget } from "@/types/tool";
import {
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Search,
  Layers,
  CheckSquare,
  FileCheck2,
  X,
} from "lucide-react";
import {
  copyToClipboard,
  copyPromptAndOpenPlatform,
  PLATFORM_URLS,
} from "@/lib/clipboard";
import {
  assemblePromptA,
  assemblePromptB,
  analyzePromptA,
  analyzePromptB,
  countPromptCharacters,
} from "@/lib/promptAssembler";
import { NOTEBOOKLM_LIMITS } from "@/config/promptLimits";
import { getPromptManifest } from "@/config/promptRegistry";
import { NotebookLMPromptBudgetIndicator } from "./NotebookLMPromptBudgetIndicator";
import { PromptExample } from "./PromptExample";
import { ClipboardFallbackModal } from "./ClipboardFallbackModal";

interface PromptOutputPanelProps {
  prompt: string | null;
  platform: PlatformTarget;
  tool?: Tool;
  formValues?: Record<string, string>;
}

export const PromptOutputPanel: React.FC<PromptOutputPanelProps> = ({
  prompt,
  platform,
  tool,
  formValues = {},
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"promptA" | "promptB">("promptA");
  const [fallbackModal, setFallbackModal] = useState<{
    isOpen: boolean;
    url: string;
    platformName: string;
  }>({
    isOpen: false,
    url: "",
    platformName: "",
  });

  const isNotebookLM = platform === "NotebookLM" || tool?.slug === "cari-literatur-awal";

  // Auto dismiss toast after 5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Manifest Lookups from Prompt Registry
  const manifestA = useMemo(() => getPromptManifest("literature-source-search-a"), []);
  const manifestB = useMemo(() => getPromptManifest("literature-synthesis-b"), []);

  // Dynamic Prompt A & Prompt B Generation for Tool 3
  const promptA = useMemo(() => {
    if (!isNotebookLM || !tool) return null;
    return assemblePromptA(tool, formValues);
  }, [isNotebookLM, tool, formValues]);

  const promptB = useMemo(() => {
    if (!isNotebookLM || !tool) return null;
    return assemblePromptB(tool, formValues);
  }, [isNotebookLM, tool, formValues]);

  const promptAAnalysis = useMemo(() => {
    if (!isNotebookLM || !tool) return null;
    return analyzePromptA(tool, formValues);
  }, [isNotebookLM, tool, formValues]);

  const promptBAnalysis = useMemo(() => {
    if (!isNotebookLM || !tool) return null;
    return analyzePromptB(tool, formValues);
  }, [isNotebookLM, tool, formValues]);

  // Accurate Character Counts via Array.from
  const promptALength = countPromptCharacters(promptA);
  const promptBLength = countPromptCharacters(promptB);

  // Global Budget Guards
  const isPromptABlocked =
    promptALength > NOTEBOOKLM_LIMITS.hardLimit ||
    promptAAnalysis?.status === "TEMPLATE_OVERFLOW" ||
    promptAAnalysis?.status === "ESSENTIAL_CONTEXT_OVERFLOW" ||
    !manifestA;

  const isPromptBBlocked =
    promptBLength > NOTEBOOKLM_LIMITS.hardLimit ||
    promptBAnalysis?.status === "TEMPLATE_OVERFLOW" ||
    promptBAnalysis?.status === "ESSENTIAL_CONTEXT_OVERFLOW" ||
    !manifestB;

  // Copy Handler for specific text
  const handleCopyText = async (text: string, keyName: string, label: string) => {
    if (!text) return;

    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(keyName);
      setToastMessage(`${label} berhasil disalin.`);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      setFallbackModal({
        isOpen: true,
        url: "",
        platformName: "Clipboard",
      });
    }
  };

  // Platform Auto-Copy & Open Handler
  const handleOpenPlatform = async (text: string, url: string, platformName: string) => {
    if (!text) return;

    const { success } = await copyPromptAndOpenPlatform(text, url);
    if (success) {
      setToastMessage(
        `Prompt sudah disalin. Tempel dengan Ctrl+V di tab ${platformName} yang baru dibuka.`
      );
    } else {
      setFallbackModal({
        isOpen: true,
        url,
        platformName,
      });
    }
  };

  // Single Prompt Metrics (Tool 1, Tool 2, Tool 4)
  const singleCharCount = prompt ? countPromptCharacters(prompt) : 0;
  const singleWordCount = prompt ? prompt.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="relative flex h-full flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-lg border border-[#FFB84D]/40 bg-[#0C0A1A] p-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FFB84D]">
            <Check className="h-4 w-4 shrink-0 text-[#FFB84D]" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded p-1 text-[#A79FC4] hover:text-[#FBFAFF] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2748] pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#FBFAFF]">
              {isNotebookLM ? "Alur 2 Tahap NotebookLM" : "Hasil Prompt"}
            </h2>
          </div>
          {isNotebookLM ? (
            <span className="flex items-center gap-1 rounded bg-[#6D5AE6]/15 border border-[#6D5AE6]/30 px-2 py-0.5 text-[10px] font-semibold text-[#FFB84D]">
              <Layers className="h-3 w-3" aria-hidden="true" />
              Cari & Petakan Sumber
            </span>
          ) : (
            <span className="text-[11px] text-[#A79FC4]">
              {prompt ? `${singleCharCount.toLocaleString()} karakter • ${singleWordCount.toLocaleString()} kata` : "Menunggu Input"}
            </span>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* RENDER NOTEBOOKLM 2-STAGE WORKFLOW (TOOL 3) */}
        {/* ---------------------------------------------------- */}
        {isNotebookLM ? (
          prompt ? (
            <div className="space-y-5">
              {/* Tab Navigation for 2 Stages */}
              <div className="flex rounded-lg border border-[#2E2748] bg-[#0C0A1A] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("promptA")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "promptA"
                      ? "bg-[#6D5AE6] text-white shadow"
                      : "text-[#A79FC4] hover:text-[#FBFAFF] hover:bg-[#191430]"
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Langkah 1 — Kumpulkan Literatur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("promptB")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "promptB"
                      ? "bg-[#6D5AE6] text-white shadow"
                      : "text-[#A79FC4] hover:text-[#FBFAFF] hover:bg-[#191430]"
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-[#FFB84D]" />
                  <span>Langkah 2 — Buat Paket Bukti</span>
                </button>
              </div>

              {/* ==================================================== */}
              {/* TAB 1: PROMPT A — KUMPULKAN LITERATUR */}
              {/* ==================================================== */}
              {activeTab === "promptA" && (
                <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-4 animate-in fade-in duration-150">
                  {/* Prompt A Header & Reusable Budget Indicator */}
                  <div className="space-y-2 border-b border-[#2E2748]/70 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-[#FBFAFF] flex items-center gap-1.5">
                          <Search className="h-4 w-4 text-[#FFB84D]" />
                          <span>Langkah 1 — Kumpulkan Literatur</span>
                        </h3>
                        <p className="text-[10px] text-[#A79FC4]">
                          Jalankan Prompt A di fitur Telusuri Web / Deep Research NotebookLM. NotebookLM akan mencari kandidat sumber. Pilih hanya artikel jurnal individual yang naskahnya terbuka penuh (full-text).
                        </p>
                      </div>
                    </div>

                    {/* Global Budget Indicator */}
                    <NotebookLMPromptBudgetIndicator
                      finalLength={promptALength}
                      staticLength={promptAAnalysis?.staticTemplateLength}
                      essentialLength={promptAAnalysis?.essentialContextLength}
                      optionalLength={promptAAnalysis?.optionalContextLength}
                      remainingLength={promptAAnalysis?.remainingLength}
                      phenomenonLength={promptAAnalysis?.phenomenonLength}
                      maxPhenomenonLength={promptAAnalysis?.maxPhenomenonLength}
                      isOptionalCompacted={promptAAnalysis?.isOptionalCompacted}
                      compactedFields={promptAAnalysis?.breakdown?.compactedFields}
                      statusOverride={promptAAnalysis?.status}
                      breakdown={promptAAnalysis?.breakdown}
                      hardLimit={manifestA?.hardLimit || NOTEBOOKLM_LIMITS.hardLimit}
                      safeTarget={manifestA?.safeTarget || NOTEBOOKLM_LIMITS.safeTarget}
                      isUnregistered={!manifestA}
                      promptLabel="Langkah 1"
                    />
                  </div>

                  {/* Action Buttons for Prompt A */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[10px] text-[#A79FC4]">
                      Deep Research: NotebookLM mencari artikel individual. Pilih hanya naskah lengkap (full-text).
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isPromptABlocked}
                        onClick={() => handleCopyText(promptA || "", "promptA", "Prompt Langkah 1")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none ${
                          isPromptABlocked
                            ? "border border-[#2E2748] bg-[#191430] text-[#A79FC4]/40 cursor-not-allowed"
                            : copiedKey === "promptA"
                            ? "bg-[#FFB84D] text-[#0C0A1A] font-bold cursor-pointer"
                            : "border border-[#2E2748] bg-[#221A42] text-[#FBFAFF] hover:bg-[#202E52] cursor-pointer"
                        }`}
                      >
                        {copiedKey === "promptA" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "promptA" ? "Langkah 1 Tersalin!" : "Copy Prompt Langkah 1"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPromptABlocked}
                        onClick={() => handleOpenPlatform(promptA || "", PLATFORM_URLS.notebooklm, "NotebookLM")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none ${
                          isPromptABlocked
                            ? "bg-[#6D5AE6]/40 text-white/50 cursor-not-allowed"
                            : "bg-[#6D5AE6] text-white hover:bg-[#5A46D6] shadow-[#6D5AE6]/20 hover:shadow-[#6D5AE6]/35 cursor-pointer"
                        }`}
                      >
                        <span>Buka di NotebookLM</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Panel Petunjuk: CHECKLIST LANGKAH 1 */}
                  <div className="rounded-lg border border-[#2E2748]/80 bg-[#191430]/70 p-3 text-[11px] text-[#A79FC4] space-y-1.5">
                    <div className="font-bold text-[#FBFAFF] flex items-center gap-1.5 text-xs">
                      <CheckSquare className="h-3.5 w-3.5 text-[#FFB84D]" />
                      <span>CHECKLIST PENTING LANGKAH 1</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[10.5px] leading-relaxed text-[#A79FC4]">
                      <li><strong className="text-amber-300">Penting:</strong> Jangan pilih &quot;Research Report&quot; atau &quot;Laporan Riset&quot; buatan AI. Pilih hanya naskah artikel jurnal individual.</li>
                      <li>Pastikan naskah lengkap (full-text). Halaman abstrak, DOI, atau metadata ringkas belum cukup untuk dibedah.</li>
                      <li><strong className="text-[#FFB84D]">Tips Terbaik:</strong> Jika kamu punya file PDF artikel langsung dari kampus/perpus, unggah file PDF langsung ke NotebookLM. Itu cara paling aman agar isi artikel terbaca penuh.</li>
                      <li>Halaman error, login tertutup, Cloudflare, dan &quot;Just a moment...&quot; bukan naskah yang siap dipakai.</li>
                      <li>Sebagian artikel yang gagal diakses wajar terjadi; lanjutkan dengan artikel yang berhasil masuk utuh.</li>
                      <li>Setelah minimal 8 naskah masuk ke notebook, buka tab <strong>Langkah 2</strong> di atas dan jalankan Prompt B.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 2: PROMPT B — BUAT PAKET BUKTI */}
              {/* ==================================================== */}
              {activeTab === "promptB" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* PROMPT B SECTION */}
                  <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-3">
                    <div className="space-y-2 border-b border-[#2E2748]/70 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-[#FBFAFF] flex items-center gap-1.5">
                            <FileCheck2 className="h-4 w-4 text-[#6D5AE6]" />
                            <span>Langkah 2 — Buat Paket Bukti</span>
                          </h3>
                          <p className="text-[10px] text-[#A79FC4]">
                            Prompt B akan membaca seluruh artikel yang sudah masuk ke notebook dan menyusun Matriks Bukti terstruktur untuk dibawa ke tahap berikutnya.
                          </p>
                        </div>
                      </div>

                      <NotebookLMPromptBudgetIndicator
                        finalLength={promptBLength}
                        staticLength={promptBAnalysis?.staticTemplateLength}
                        essentialLength={promptBAnalysis?.essentialContextLength}
                        optionalLength={promptBAnalysis?.optionalContextLength}
                        remainingLength={promptBAnalysis?.remainingLength}
                        phenomenonLength={promptBAnalysis?.phenomenonLength}
                        maxPhenomenonLength={promptBAnalysis?.maxPhenomenonLength}
                        isOptionalCompacted={promptBAnalysis?.isOptionalCompacted}
                        compactedFields={promptBAnalysis?.breakdown?.compactedFields}
                        statusOverride={promptBAnalysis?.status}
                        breakdown={promptBAnalysis?.breakdown}
                        hardLimit={manifestB?.hardLimit || NOTEBOOKLM_LIMITS.hardLimit}
                        safeTarget={manifestB?.safeTarget || NOTEBOOKLM_LIMITS.safeTarget}
                        isUnregistered={!manifestB}
                        promptLabel="Langkah 2"
                      />
                    </div>

                    <div className="space-y-3 animate-in fade-in duration-200">
                      {/* Callout Petunjuk Penggunaan Paket Bukti */}
                      <div className="rounded-lg border border-[#FFB84D]/30 bg-[#FFB84D]/10 p-3 text-[11px] text-[#FBFAFF] space-y-1.5">
                        <p className="font-semibold text-[#FFB84D] flex items-center gap-1.5 text-xs">
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>Ketentuan Ekstraksi Paket Bukti</span>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-[10.5px] leading-relaxed text-[#A79FC4]">
                          <li><strong className="text-[#FBFAFF]">INTI (Prioritas Utama)</strong> dan <strong className="text-[#FBFAFF]">PENDUKUNG (Konteks)</strong> sama-sama wajib naskah lengkap (full-text).</li>
                          <li><strong className="text-[#FBFAFF]">TERBACA TAK DIPILIH</strong> adalah sumber valid yang belum masuk kuota (tetap aman, tidak perlu dihapus).</li>
                          <li><strong className="text-[#FBFAFF]">DIABAIKAN</strong> (sumber error/abstrak/laporan AI) otomatis tidak dimasukkan ke dalam Matriks Bukti.</li>
                          <li>Jika naskah INTI kurang dari 8, kembali ke Langkah 1 untuk mencari tambahan naskah full-text.</li>
                        </ul>
                      </div>

                      {/* Action Buttons for Prompt B */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-[10px] text-[#A79FC4]">
                          Ekstraksi Bukti: Salin seluruh output Matriks Bukti ke Tool Bedah Fenomena & Literatur.
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isPromptBBlocked}
                            onClick={() => handleCopyText(promptB || "", "promptB", "Prompt Langkah 2")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none ${
                              isPromptBBlocked
                                ? "border border-[#2E2748] bg-[#191430] text-[#A79FC4]/40 cursor-not-allowed"
                                : copiedKey === "promptB"
                                ? "bg-[#FFB84D] text-[#0C0A1A] font-bold cursor-pointer"
                                : "border border-[#2E2748] bg-[#221A42] text-[#FBFAFF] hover:bg-[#202E52] cursor-pointer"
                            }`}
                          >
                            {copiedKey === "promptB" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedKey === "promptB" ? "Langkah 2 Tersalin!" : "Copy Prompt Langkah 2"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPromptBBlocked}
                            onClick={() => handleOpenPlatform(promptB || "", PLATFORM_URLS.notebooklm, "NotebookLM")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none ${
                              isPromptBBlocked
                                ? "bg-[#6D5AE6]/40 text-white/50 cursor-not-allowed"
                                : "bg-[#6D5AE6] text-white hover:bg-[#5A46D6] shadow-[#6D5AE6]/20 hover:shadow-[#6D5AE6]/35 cursor-pointer"
                            }`}
                          >
                            <span>Buka di NotebookLM</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[#2E2748] p-6 text-center text-xs text-[#A79FC4]">
              <Search className="mb-2 h-8 w-8 text-[#A79FC4]/40" />
              <p className="font-semibold text-[#FBFAFF]">Belum Ada Prompt yang Dibuat</p>
              <p className="mt-1 text-[11px]">
                Lengkapi formulir di samping untuk merakit Langkah 1 (Kumpulkan Literatur) dan Langkah 2 (Buat Paket Bukti).
              </p>
              <PromptExample variant="notebooklm" />
            </div>
          )
        ) : (
          /* ---------------------------------------------------- */
          /* RENDER SINGLE PROMPT TOOLS (TOOL 1, TOOL 2, TOOL 4) */
          /* ---------------------------------------------------- */
          prompt ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A79FC4]">
                  {singleCharCount.toLocaleString()} karakter • {singleWordCount.toLocaleString()} kata
                </span>
              </div>

              {/* Action Buttons for Single Prompt */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(prompt, "single", "Prompt")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none ${
                    copiedKey === "single"
                      ? "bg-[#FFB84D] text-[#0C0A1A] font-bold cursor-pointer"
                      : "border border-[#2E2748] bg-[#221A42] text-[#FBFAFF] hover:bg-[#202E52] cursor-pointer"
                  }`}
                >
                  {copiedKey === "single" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedKey === "single" ? "Tersalin!" : "Salin Prompt"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenPlatform(
                      prompt,
                      platform === "ChatGPT / Gemini"
                        ? PLATFORM_URLS.chatgpt
                        : PLATFORM_URLS.notebooklm,
                      platform
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#6D5AE6]/20 hover:bg-[#5A46D6] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
                >
                  <span>Buka {platform}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[#2E2748] p-6 text-center text-xs text-[#A79FC4]">
              <Terminal className="mb-2 h-8 w-8 text-[#A79FC4]/40" />
              <p className="font-semibold text-[#FBFAFF]">Belum Ada Prompt yang Dibuat</p>
              <p className="mt-1 text-[11px]">
                Lengkapi formulir di samping dan klik &quot;Buat Prompt&quot; untuk melihat prompt akademik siap pakai.
              </p>
              <PromptExample variant="single" />
            </div>
          )
        )}
      </div>

      {/* Fallback Clipboard Modal */}
      <ClipboardFallbackModal
        isOpen={fallbackModal.isOpen}
        onClose={() => setFallbackModal({ isOpen: false, url: "", platformName: "" })}
        prompt={prompt || ""}
        targetUrl={fallbackModal.url}
        platformName={fallbackModal.platformName}
        onSuccess={(msg) => setToastMessage(msg)}
      />
    </div>
  );
};
