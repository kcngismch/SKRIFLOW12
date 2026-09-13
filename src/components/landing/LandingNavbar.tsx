"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Masalah", href: "#masalah" },
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Preview", href: "#preview" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

export const LandingNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "border-b border-[#2E2748] bg-[#0C0A1A]/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "border-b border-[#2E2748]/50 bg-[#0C0A1A]/80 backdrop-blur-sm"
      }`}
      aria-label="Navigasi Utama"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-lg py-1 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6D5AE6]/15 border border-[#6D5AE6]/40 text-[#FFB84D] transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#FBFAFF]">
                SKRIFLOW
              </span>
              <span className="rounded bg-[#6D5AE6]/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#FFB84D] border border-[#6D5AE6]/30">
                PROTOTYPE
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#A79FC4]">
              Prompt Tools
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[#A79FC4] transition-colors hover:text-[#FBFAFF] hover:bg-[#191430] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA Button */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6D5AE6] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#6D5AE6]/20 transition-all hover:bg-[#5A46D6] hover:shadow-[#6D5AE6]/30 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
          >
            <span>Coba Tools</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 rounded-lg bg-[#6D5AE6] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <span>Coba Tools</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-lg border border-[#2E2748] bg-[#191430] p-2 text-[#A79FC4] hover:text-[#FBFAFF] hover:border-[#6D5AE6]/50 focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-[#2E2748] bg-[#0C0A1A] px-4 pt-2 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#A79FC4] transition-colors hover:bg-[#191430] hover:text-[#FBFAFF] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#2E2748] flex flex-col gap-2">
            <Link
              href="/tools"
              onClick={closeMenu}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D5AE6] py-2.5 text-xs font-semibold text-white"
            >
              <span>Coba Tools</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
