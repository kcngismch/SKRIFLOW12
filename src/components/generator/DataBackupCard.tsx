"use client";

import React, { useSyncExternalStore, useRef, useState } from "react";
import { Download, Upload, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { exportAllData, importAllData, clearAllData } from "@/lib/storage";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Kartu backup data: Export semua progres ke file JSON, Import balik, dan hapus semua.
 * Alasan eksis: data ada di localStorage — clear cache/browser = hilang. Ini jalur evakuasi murah.
 */
export const DataBackupCard: React.FC = () => {
  const isMounted = useIsMounted();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const handleExport = () => {
    try {
      const json = exportAllData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `skriflow-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice({ kind: "ok", text: "Backup terunduh. Simpan filenya di tempat aman." });
    } catch {
      setNotice({ kind: "err", text: "Gagal membuat file backup." });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setNotice({ kind: "err", text: "File tidak bisa dibaca." });
      return;
    }
    // Validasi dulu (tanpa menulis) supaya konfirmasi menampilkan info yang benar.
    const preview = importAllDataDry(text);
    if (preview.error) {
      setNotice({ kind: "err", text: preview.error });
      return;
    }
    const ok = window.confirm(
      `Pulihkan ${preview.count} item data dari backup ini?\n\nData Skriflow yang ada sekarang akan ditimpa.`
    );
    if (!ok) return;
    const res = importAllData(text);
    if (res.error) {
      setNotice({ kind: "err", text: res.error });
    } else {
      setNotice({ kind: "ok", text: `${res.restored} item data dipulihkan. Muat ulang halaman untuk melihat semuanya.` });
    }
  };

  const handleClearAll = () => {
    const ok = window.confirm(
      "Hapus SEMUA data Skriflow di browser ini (isi form, hasil, dan progres semua tool)?\n\nTindakan ini tidak bisa dibatalkan. Pastikan kamu sudah Export dulu."
    );
    if (!ok) return;
    const n = clearAllData();
    setNotice({ kind: "ok", text: `${n} item data dihapus.` });
  };

  return (
    <div className="rounded-xl border border-[#273352] bg-[#11182D] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#FFF9EE]">
            <CheckCircle2 className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
            Data & Backup
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#AAB4D0]">
            Progresmu tersimpan di browser ini. Unduh backup JSON secara berkala supaya aman
            kalau cache terhapus atau kamu pindah laptop/HP.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2959FF] px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#2959FF]/20 transition-all hover:bg-[#1E46D9] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export Backup
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#0E1526] px-3.5 py-2 text-xs font-semibold text-[#AAB4D0] transition-colors hover:border-[#2959FF]/50 hover:text-[#FFF9EE] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Import Backup
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF6F61]/30 bg-[#FF6F61]/10 px-3.5 py-2 text-xs font-semibold text-[#FF6F61] transition-colors hover:bg-[#FF6F61]/20 focus-visible:ring-2 focus-visible:ring-[#FF6F61] focus-visible:outline-none"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus Semua
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>

      {isMounted && notice && (
        <div
          role="status"
          className={`mt-4 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
            notice.kind === "ok"
              ? "border-[#70E1B6]/30 bg-[#70E1B6]/10 text-[#70E1B6]"
              : "border-[#FF6F61]/30 bg-[#FF6F61]/10 text-[#FF6F61]"
          }`}
        >
          {notice.kind === "ok" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hitung isi backup tanpa menulis apa pun (untuk teks konfirmasi import).
 */
function importAllDataDry(json: string): { count: number; error?: string } {
  try {
    const parsed = JSON.parse(json) as { app?: string; data?: Record<string, unknown> };
    if (!parsed || typeof parsed !== "object" || parsed.app !== "skriflow" || !parsed.data || typeof parsed.data !== "object") {
      return { count: 0, error: "Struktur file bukan backup Skriflow yang dikenali." };
    }
    const count = Object.keys(parsed.data).filter(
      (k) => k.startsWith("skriflow_") && typeof (parsed.data as Record<string, unknown>)[k] === "string"
    ).length;
    return { count };
  } catch {
    return { count: 0, error: "File bukan JSON yang valid." };
  }
}
