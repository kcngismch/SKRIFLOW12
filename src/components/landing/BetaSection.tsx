import React from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";

// Testimonial display toggle flag (no fake testimonials)
const SHOW_TESTIMONIALS = false;

export const BetaSection: React.FC = () => {
  if (SHOW_TESTIMONIALS) {
    return null; // Will render verified testimonials in future releases
  }

  return (
    <section className="relative border-b border-[#2E2748] py-16 sm:py-20 bg-[#120E24]/50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          <span>MASIH PROTOTYPE</span>
        </div>

        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
          Tools ini sedang diuji sebelum dibuat makin besar.
        </h2>

        <p className="mt-4 text-sm text-[#A79FC4] sm:text-base leading-relaxed max-w-2xl mx-auto">
          Kami mulai dari tiga pekerjaan paling awal supaya setiap prompt benar-benar mudah dipakai, bukan sekadar terlihat lengkap.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-lg bg-[#6D5AE6] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#6D5AE6]/20 hover:bg-[#5A46D6] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
          >
            <span>Coba Tools</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-[#A79FC4]/70">
          Testimoni pengguna akan ditampilkan setelah pengujian nyata.
        </p>
      </div>
    </section>
  );
};
