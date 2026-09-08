import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#273352] bg-[#080D1D] py-12 text-xs text-[#AAB4D0]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg py-1 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2959FF]/15 border border-[#2959FF]/40 text-[#70E1B6]">
                <Sparkles className="h-4 w-4 text-[#70E1B6]" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-[#FFF9EE]">SKRIFLOW</span>
              <span className="rounded bg-[#2959FF]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#70E1B6] border border-[#2959FF]/30">
                PROTOTYPE
              </span>
            </Link>

            <p className="mt-3 text-xs leading-relaxed text-[#AAB4D0] max-w-sm">
              Alat bantu penyusunan prompt terstruktur untuk membantu mahasiswa S1 merakit instruksi penelitian di NotebookLM, ChatGPT, dan Gemini.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-7 flex flex-wrap gap-x-10 gap-y-4 md:justify-end">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFF9EE]">
                Navigasi
              </span>
              <ul className="space-y-1.5">
                <li>
                  <a href="#masalah" className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1">
                    Masalah
                  </a>
                </li>
                <li>
                  <a href="#fitur" className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1">
                    Fitur
                  </a>
                </li>
                <li>
                  <a href="#cara-kerja" className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1">
                    Cara Kerja
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFF9EE]">
                Eksplorasi
              </span>
              <ul className="space-y-1.5">
                <li>
                  <a href="#preview" className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1">
                    Preview Tools
                  </a>
                </li>
                <li>
                  <a href="#harga" className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1">
                    Harga &amp; Akses
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#FFF9EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFF9EE]">
                Aplikasi
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/tools"
                    className="font-semibold text-[#70E1B6] hover:underline focus-visible:ring-2 focus-visible:ring-[#2959FF] rounded px-1"
                  >
                    Coba Tools →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Academic Disclaimer & Copyright */}
        <div className="mt-10 border-t border-[#273352]/70 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <p className="text-[#AAB4D0]/80 max-w-xl text-center md:text-left">
            <strong className="text-[#FFF9EE]">Disclaimer:</strong> SKRIFLOW adalah alat bantu penyusunan prompt, bukan pengganti dosen pembimbing atau verifikasi akademik.
          </p>

          <p className="text-[#AAB4D0]/60 shrink-0">
            © {currentYear} SKRIFLOW. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
