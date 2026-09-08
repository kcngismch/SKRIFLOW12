import Link from "next/link";
import { ArrowLeft, FileQuestion, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#273352] bg-[#11182D] text-[#FF6F61]">
        <FileQuestion className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#FFF9EE] sm:text-3xl">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 text-sm text-[#AAB4D0]">
        Halaman atau tool yang kamu cari tidak tersedia atau belum dirilis pada prototype ini.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2959FF] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1E46D9] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          <span>Buka Dashboard Tools</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-[#273352] bg-[#11182D] px-4 py-2.5 text-xs font-semibold text-[#FFF9EE] transition-colors hover:bg-[#16213D] focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Halaman Utama</span>
        </Link>
      </div>
    </div>
  );
}
