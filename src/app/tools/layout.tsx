import React from "react";
import { Header } from "@/components/Header";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#080D1D]">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#273352]/70 bg-[#080D1D] py-8 text-center text-xs text-[#AAB4D0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#FFF9EE]">SKRIFLOW</span>
            <span>•</span>
            <span>Prompt Tools untuk Mahasiswa Skripsi</span>
          </div>
          <p className="text-[11px] text-[#AAB4D0]/70">
            Prototype Eksplorasi Awal • Berjalan di sisi peramban tanpa koneksi AI langsung
          </p>
        </div>
      </footer>
    </div>
  );
}
