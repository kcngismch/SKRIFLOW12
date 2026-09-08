import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080D1D",
};

export const metadata: Metadata = {
  title: "SKRIFLOW Prompt Tools — Mulai Skripsi Tanpa Bingung Nulis Prompt",
  description:
    "Generator prompt untuk membantu mahasiswa mencari ide skripsi, memetakan literatur di NotebookLM, dan membedah hasil bersama ChatGPT atau Gemini.",
  keywords: [
    "skripsi",
    "prompt tools",
    "notebooklm",
    "chatgpt",
    "gemini",
    "mahasiswa",
    "riset",
    "ide skripsi",
    "literatur review",
  ],
  authors: [{ name: "SKRIFLOW" }],
  openGraph: {
    title: "SKRIFLOW Prompt Tools — Mulai Skripsi Tanpa Bingung Nulis Prompt",
    description:
      "Generator prompt untuk membantu mahasiswa mencari ide skripsi, memetakan literatur di NotebookLM, dan membedah hasil bersama ChatGPT atau Gemini.",
    type: "website",
    locale: "id_ID",
    siteName: "SKRIFLOW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased dark scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-[#080D1D] text-[#FFF9EE] selection:bg-[#2959FF]/30 selection:text-[#FFF9EE]">
        {children}
      </body>
    </html>
  );
}
