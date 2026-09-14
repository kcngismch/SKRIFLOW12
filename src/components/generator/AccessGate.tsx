"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  isPassActiveSync,
  subscribeToPass,
  activatePass,
} from "@/lib/accessGate";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MessageCircle,
  KeyRound,
  Loader2,
  Sparkles,
} from "lucide-react";

const emptySubscribe = () => () => {};

interface AccessGateProps {
  children: React.ReactNode;
}

export const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isPassActive = useSyncExternalStore(
    subscribeToPass,
    isPassActiveSync,
    () => false
  );

  const [accessCode, setAccessCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrisImageFailed, setQrisImageFailed] = useState(false);

  // Jika belum mount di client, tampilkan skeleton container netral untuk cegah hydration mismatch
  if (!isMounted) {
    return (
      <div className="mt-8 rounded-xl border border-[#2E2748] bg-[#191430] p-8 text-center min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-[#A79FC4]">
          <Loader2 className="h-4 w-4 animate-spin text-[#6D5AE6]" />
          <span>Memeriksa akses...</span>
        </div>
      </div>
    );
  }

  // Jika pass sudah aktif, langsung render konten tool
  if (isPassActive) {
    return <>{children}</>;
  }

  // Paywall screen
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setErrorMsg("Masukkan kode akses terlebih dahulu ya.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const success = await activatePass(trimmed);
      if (!success) {
        setErrorMsg(
          "Kode akses salah atau tidak terdaftar. Periksa kembali ketikanmu (format: SKRIFLOW-XXXX-XXXX) atau chat admin di WhatsApp kalau butuh bantuan."
        );
      }
    } catch {
      setErrorMsg("Terjadi kendala saat memeriksa kode. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Banner / Header Paywall */}
      <div className="overflow-hidden rounded-2xl border border-[#2E2748] bg-[#191430] p-6 sm:p-8 relative">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#6D5AE6]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3 py-1 text-xs font-semibold text-[#FFB84D] mb-4">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>SKRIFLOW PASS</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FBFAFF]">
            Buka Akses Penuh: Tool 2, 3, dan 4
          </h2>

          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#A79FC4]">
            Eksplorasi ide di Tool 1 gratis untuk semua mahasiswa. Untuk merakit
            fenomena empiris, sintesis literatur NotebookLM, dan fondasi arah skripsi
            lengkap, aktifkan Skriflow Pass sekali bayar.
          </p>

          {/* Pricing Highlight Card */}
          <div className="mt-6 inline-flex flex-wrap items-baseline gap-3 rounded-xl border border-[#2E2748] bg-[#0C0A1A] px-5 py-3.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FBFAFF] tracking-tight">
              Rp 39.000
            </span>
            <span className="text-xs font-medium text-[#FFB84D]">
              • Sekali bayar, akses terbuka selamanya di browsermu
            </span>
          </div>

          {/* Manfaat Singkat */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#2E2748]/70 pt-6">
            <div className="rounded-lg border border-[#2E2748]/70 bg-[#0E1526] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FBFAFF]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB84D] shrink-0" />
                <span>Tool 2: Cari Fenomena</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#A79FC4]">
                Eksplorasi kondisi riil, uji keterlacakan bukti, dan pastikan isu bukan asumsi kosong.
              </p>
            </div>

            <div className="rounded-lg border border-[#2E2748]/70 bg-[#0E1526] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FBFAFF]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB84D] shrink-0" />
                <span>Tool 3: Cari Literatur</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#A79FC4]">
                Prompt terstruktur NotebookLM untuk mencari & memetakan jurnal acuan relevan.
              </p>
            </div>

            <div className="rounded-lg border border-[#2E2748]/70 bg-[#0E1526] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FBFAFF]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB84D] shrink-0" />
                <span>Tool 4: Bedah & Paket Fondasi</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#A79FC4]">
                Rekonsiliasi fenomena dan literatur menjadi fondasi arah penelitian siap bimbingan + gratis update ke depan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Pembayaran QRIS & Form Masukkan Kode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kiri: QRIS & WhatsApp */}
        <div className="rounded-2xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#FFB84D]">
              LANGKAH 1
            </span>
            <h3 className="text-sm sm:text-base font-semibold text-[#FBFAFF]">
              Transfer QRIS & Konfirmasi WhatsApp
            </h3>
            <p className="text-xs text-[#A79FC4]">
              Scan QRIS senilai Rp 39.000 via BCA, Mandiri, GoPay, OVO, Dana, atau m-banking lainnya.
            </p>
          </div>

          {/* QRIS Box */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 text-center">
            {!qrisImageFailed ? (
              <img
                src="/qris.png"
                alt="QRIS Pembayaran Skriflow Pass Rp 39.000"
                className="max-h-56 max-w-full rounded-lg object-contain"
                onError={() => setQrisImageFailed(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-6 px-4 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2E2748] bg-[#191430]">
                  <QrCode className="h-6 w-6 text-[#A79FC4]" />
                </div>
                <p className="text-xs font-medium text-[#FBFAFF]">
                  QRIS sedang disiapkan
                </p>
                <p className="text-[12px] max-w-xs text-[#A79FC4]">
                  Gambar QRIS belum dimuat. Silakan chat admin WhatsApp untuk meminta QRIS atau nomor rekening transfer.
                </p>
              </div>
            )}
            <span className="mt-2 text-[11px] text-[#A79FC4]/70">
              Total transfer: Rp 39.000 (tanpa biaya admin tersembunyi)
            </span>
          </div>

          {/* WhatsApp Instructions */}
          <div className="rounded-xl border border-[#2E2748] bg-[#0C0A1A] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FBFAFF]">
              <MessageCircle className="h-4 w-4 text-[#FFB84D]" />
              <span>Instruksi Konfirmasi WhatsApp</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[12px] leading-relaxed text-[#A79FC4]">
              <li>Lakukan pembayaran Rp 39.000 via QRIS.</li>
              <li>
                Kirim bukti transfer ke WhatsApp admin:{" "}
                <span className="font-semibold text-[#FFB84D] bg-[#191430] px-1.5 py-0.5 rounded border border-[#2E2748]">
                  08xx — ganti nanti
                </span>
              </li>
              <li>
                Sertakan pesan singkat: <em>&ldquo;Halo min, mau aktivasi Skriflow Pass&rdquo;</em>.
              </li>
              <li>Admin akan mengirimkan kode akses (contoh: <code className="text-[#FBFAFF]">SKRIFLOW-XXXX-XXXX</code>).</li>
            </ol>
          </div>
        </div>

        {/* Kolom Kanan: Form Masukkan Kode Akses */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#6D5AE6]">
                LANGKAH 2
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-[#FBFAFF]">
                Punya Kode Akses? Masukkan di Sini
              </h3>
              <p className="text-xs text-[#A79FC4]">
                Ketik atau tempel kode akses yang lo terima dari WhatsApp admin.
              </p>
            </div>

            <form onSubmit={handleActivate} className="space-y-3.5">
              <div>
                <label
                  htmlFor="pass-code-input"
                  className="block text-xs font-medium text-[#FBFAFF] mb-1.5"
                >
                  Kode Akses
                </label>
                <div className="relative">
                  <input
                    id="pass-code-input"
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Contoh: SKRIFLOW-XXXX-XXXX"
                    className={`w-full rounded-lg border bg-[#0C0A1A] px-3.5 py-2.5 text-xs sm:text-sm font-mono tracking-wider text-[#FBFAFF] placeholder-[#A79FC4]/40 transition-colors focus:bg-[#191430] focus:outline-none focus:ring-2 ${
                      errorMsg
                        ? "border-[#FF5C8A] focus:ring-[#FF5C8A]"
                        : "border-[#2E2748] focus:border-[#6D5AE6] focus:ring-[#6D5AE6]"
                    }`}
                  />
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-[#FF5C8A]/40 bg-[#FF5C8A]/10 p-3 text-xs text-[#FF5C8A]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#6D5AE6]/25 hover:bg-[#5A46D6] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi kode...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Aktifkan Pass</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-[#2E2748]/60 bg-[#0C0A1A]/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FBFAFF]">
              <Sparkles className="h-3.5 w-3.5 text-[#FF5C8A]" />
              <span>Info Penyimpanan</span>
            </div>
            <p className="text-[12px] leading-relaxed text-[#A79FC4]">
              Setelah aktif, status pass kamu tersimpan otomatis di browser ini (localStorage). Jika ganti perangkat atau membersihkan cache browser, kamu cukup masukkan kembali kode akses yang sama tanpa harus bayar lagi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
