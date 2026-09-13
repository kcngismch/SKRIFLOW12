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
  themeColor: "#0C0A1A",
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
      <body className="flex min-h-full flex-col bg-[#0C0A1A] text-[#FBFAFF] selection:bg-[#6D5AE6]/30 selection:text-[#FBFAFF]">
        {children}
      </body>
    </html>
  );
}
