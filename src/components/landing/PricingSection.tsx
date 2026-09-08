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
    <section id="harga" className="relative border-b border-[#273352] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2959FF]/30 bg-[#2959FF]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#70E1B6]">
            <Tag className="h-3.5 w-3.5 text-[#70E1B6]" aria-hidden="true" />
            <span>AKSES &amp; PENAWARAN</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FFF9EE] sm:text-3xl lg:text-4xl leading-tight">
            Akses bebas untuk menguji empat tools awal.
          </h2>

          <p className="mt-3 text-sm text-[#AAB4D0]">
            Tidak ada tagihan tersembunyi. Silakan validasi alur dan kecocokan prompt untuk skripsimu.
          </p>
        </div>

        {/* Single Offer Card */}
        <div className="mt-12 max-w-lg mx-auto">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#2959FF]/50 bg-[#11182D] p-6 sm:p-8 shadow-2xl shadow-[#2959FF]/10">
            {/* Top Accent Pill */}
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#2959FF]/20 border border-[#2959FF]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#70E1B6]">
                AKSES PROTOTYPE
              </span>
              <span className="text-xs font-semibold text-[#AAB4D0]">
                Eksplorasi Awal
              </span>
            </div>

            {/* Price Display */}
            <div className="mt-6 border-b border-[#273352] pb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#FFF9EE]">
                  Gratis
                </span>
                <span className="text-xs text-[#AAB4D0]">/ selama masa uji coba</span>
              </div>
              <p className="mt-2 text-xs text-[#70E1B6]">
                Untuk pengujian empat tools pertama
              </p>
            </div>

            {/* Benefits Checklist */}
            <div className="mt-6 space-y-3.5">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 text-xs sm:text-sm text-[#FFF9EE]">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#70E1B6]/15 text-[#70E1B6]">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2959FF] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#2959FF]/25 transition-all hover:bg-[#1E46D9] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
              >
                <span>Coba Tools</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Micro Note */}
            <p className="mt-4 text-center text-[11px] text-[#AAB4D0]/70">
              Paket lengkap dan harga peluncuran akan diumumkan setelah prototype selesai diuji.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
