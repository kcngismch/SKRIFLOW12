import React from "react";
import { Header } from "@/components/Header";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0A1A]">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#2E2748]/70 bg-[#0C0A1A] py-8 text-center text-xs text-[#A79FC4]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#FBFAFF]">SKRIFLOW</span>
            <span>•</span>
            <span>Prompt Tools untuk Mahasiswa Skripsi</span>
          </div>
          <p className="text-[11px] text-[#A79FC4]/70">
            Prototype Eksplorasi Awal • Berjalan di sisi peramban tanpa koneksi AI langsung
          </p>
        </div>
      </footer>
    </div>
  );
}
