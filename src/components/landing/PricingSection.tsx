import React from "react";
import Link from "next/link";
import { Check, ArrowRight, Tag } from "lucide-react";

const BENEFITS = [
  "Akses dashboard prototype",
  "Empat generator prompt",
  "Shortcut ke NotebookLM, ChatGPT, dan Gemini",
  "Input tersimpan secara lokal di perangkat",
  "Tanpa login",
  "Tanpa memasukkan kartu pembayaran",
];

export const PricingSection: React.FC = () => {
  return (
    <section id="harga" className="relative border-b border-[#2E2748] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
            <Tag className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
            <span>AKSES &amp; PENAWARAN</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
            Akses bebas untuk menguji empat tools awal.
          </h2>

          <p className="mt-3 text-sm text-[#A79FC4]">
            Tidak ada tagihan tersembunyi. Silakan validasi alur dan kecocokan prompt untuk skripsimu.
          </p>
        </div>

        {/* Single Offer Card */}
        <div className="mt-12 max-w-lg mx-auto">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#6D5AE6]/50 bg-[#191430] p-6 sm:p-8 shadow-2xl shadow-[#6D5AE6]/10">
            {/* Top Accent Pill */}
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#6D5AE6]/20 border border-[#6D5AE6]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFB84D]">
                AKSES PROTOTYPE
              </span>
              <span className="text-xs font-semibold text-[#A79FC4]">
                Eksplorasi Awal
              </span>
            </div>

            {/* Price Display */}
            <div className="mt-6 border-b border-[#2E2748] pb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#FBFAFF]">
                  Gratis
                </span>
                <span className="text-xs text-[#A79FC4]">/ selama masa uji coba</span>
              </div>
              <p className="mt-2 text-xs text-[#FFB84D]">
                Untuk pengujian empat tools pertama
              </p>
            </div>

            {/* Benefits Checklist */}
            <div className="mt-6 space-y-3.5">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 text-xs sm:text-sm text-[#FBFAFF]">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFB84D]/15 text-[#FFB84D]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <Link
                href="/tools"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#6D5AE6]/25 transition-all hover:bg-[#5A46D6] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
              >
                <span>Coba Tools</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Micro Note */}
            <p className="mt-4 text-center text-[11px] text-[#A79FC4]/70">
              Paket lengkap dan harga peluncuran akan diumumkan setelah prototype selesai diuji.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
