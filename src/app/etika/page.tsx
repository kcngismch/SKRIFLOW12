import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ScrollText,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Scale,
  Compass,
  Check,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deklarasi AI & Etika Penelitian — SKRIFLOW",
  description:
    "Posisi integritas akademik SKRIFLOW: AI sebagai asisten proses berpikir, bukan penulis. Kepatuhan regulasi UI PR 16/2025, larangan fabrikasi sumber, dan protokol verifikasi primer.",
  keywords: [
    "etika AI skripsi",
    "deklarasi AI tugas akhir",
    "UI PR 16/2025",
    "integritas akademik",
    "verifikasi sumber primer",
    "anti fabrikasi data",
    "skriflow etika",
  ],
  openGraph: {
    title: "Deklarasi AI & Etika Penelitian — SKRIFLOW",
    description:
      "Posisi resmi SKRIFLOW mengenai integritas akademik, penggunaan Generative AI yang etis untuk skripsi, verifikasi sumber primer, dan kepatuhan regulasi kampus.",
    type: "website",
    locale: "id_ID",
    siteName: "SKRIFLOW",
  },
};

const RED_LINES = [
  {
    title: "Tidak Menghasilkan Judul Final",
    desc: "Judul skripsi yang bermakna lahir dari kepekaan peneliti terhadap masalah riil di lapangan dan aksesibilitas data, bukan dari rekomendasi instan satu kali klik. SKRIFLOW membantu merumuskan pertanyaan riset yang spesifik, tetapi penetapan judul akhir sepenuhnya keputusan mahasiswa bersama dosen pembimbing.",
  },
  {
    title: "Tidak Mengarang Research Gap Otomatis",
    desc: "Kesenjangan penelitian (research gap) yang sah menuntut telaah kritis atas literatur yang saling bertentangan atau keterbatasan teoretis yang nyata. Mengganti lokasi atau objek penelitian tanpa argumen ilmiah bukanlah gap. SKRIFLOW menolak memalsukan gap yang tidak berdasar pada literatur riil.",
  },
  {
    title: "Tidak Merumuskan Novelty (Kebaruan) Fiktif",
    desc: "Kebaruan akademik adalah kontribusi intelektual mahasiswa setelah berdialog dengan penelitian-penelitian terdahulu. SKRIFLOW tidak pernah menyajikan klaim kebaruan sepihak dari AI tanpa pemetaan komprehensif atas artikel ilmiah primer yang relevan.",
  },
  {
    title: "Tidak Menulis Naskah, Draf Bab, atau Simpulan",
    desc: "SKRIFLOW adalah perakit instruksi (prompt), bukan pengarang naskah skripsi. Kami tidak menyediakan fitur penulisan draf Bab 1 sampai Bab 5. Seluruh narasi dan argumen harus ditulis, dipahami, dan dipertahankan sendiri oleh mahasiswa di hadapan dosen penguji.",
  },
];

const COMPARISON_ITEMS = [
  {
    notDone: "Membuatkan judul skripsi instan siap pakai tanpa pemahaman konteks.",
    supported: "Membantu merumuskan pertanyaan riset yang terukur dan spesifik dari rasa penasaran awal.",
  },
  {
    notDone: "Mengarang research gap fiktif atau sekadar menyarankan ganti objek/lokasi.",
    supported: "Memandu penelusuran kontradiksi temuan antar-jurnal untuk menemukan keterbatasan pengetahuan nyata.",
  },
  {
    notDone: "Menuliskan paragraf latar belakang, tinjauan pustaka, atau draf naskah bab.",
    supported: "Menyusun prompt terstruktur dengan batasan peran dan format agar mahasiswa memegang kendali penulisan.",
  },
  {
    notDone: "Menyajikan output AI generatif sebagai referensi atau bukti ilmiah valid.",
    supported: "Menandai sumber yang belum punya identitas lengkap (judul, penerbit, tahun, tautan/DOI) dan mengingatkanmu memeriksanya ke dokumen primer. Pemeriksaan akhir tetap milikmu, bukan otomatis.",
  },
  {
    notDone: "Memalsukan nomor DOI, nama jurnal, atau mengolah data statistik fiktif.",
    supported: "Menolak DOI berpola palsu dan domain contoh, lalu memandumu menelusuri sumber ke pangkalnya.",
  },
  {
    notDone: "Menjanjikan jalan pintas tidak realistis seperti 'skripsi kilat 3 hari jadi'.",
    supported: "Membantu mahasiswa menjalani corong riset ilmiah yang runtut dan dapat dipertanggungjawabkan ke dosen.",
  },
  {
    notDone: "Menggantikan peran dosen pembimbing atau diskusi akademik di kampus.",
    supported: "Menyiapkan bahan diskusi bimbingan yang terstruktur berbasis bukti data dan literatur asli.",
  },
];

export default function EtikaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0A1A] text-[#FBFAFF]">
      {/* Top Header Navigation */}
      <Header showBackToLanding={true} />

      <main className="flex-1 pb-20">
        {/* Breadcrumb Bar */}
        <div className="border-b border-[#2E2748]/60 bg-[#0C0A1A]/60">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-xs text-[#A79FC4] sm:px-6 lg:px-8">
            <Link
              href="/"
              className="hover:text-[#FBFAFF] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6D5AE6] rounded"
            >
              Beranda
            </Link>
            <span className="text-[#2E2748]">/</span>
            <span className="text-[#FBFAFF] font-medium">Deklarasi AI &amp; Etika</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[#2E2748] py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(41,89,255,0.12),transparent_60%)] pointer-events-none" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3.5 py-1.5 text-xs font-semibold text-[#FFB84D]">
                <ShieldCheck className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                <span>KOMITMEN INTEGRITAS AKADEMIK</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#FBFAFF] sm:text-4xl lg:text-5xl leading-tight">
                Deklarasi AI &amp; Prinsip Etika Penelitian
              </h1>

              <p className="mt-5 text-base text-[#A79FC4] sm:text-lg leading-relaxed">
                Posisi resmi SKRIFLOW tentang pemanfaatan Artificial Intelligence dalam penulisan skripsi:{" "}
                <span className="text-[#FBFAFF] font-medium">
                  AI adalah asisten proses berpikir, bukan penulis karya ilmiah.
                </span>{" "}
                Kami merancang alat bantu perakit prompt terstruktur agar proses riset mahasiswa tetap jujur,
                transparan, dan dapat dipertanggungjawabkan sepenuhnya di hadapan dewan penguji.
              </p>

              {/* Core Tenet Pills */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-1.5 text-xs font-medium text-[#FBFAFF]">
                  <Check className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                  100% Human-in-the-Loop
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-1.5 text-xs font-medium text-[#FBFAFF]">
                  <Check className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                  Anti-Fabrikasi Data
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-1.5 text-xs font-medium text-[#FBFAFF]">
                  <Check className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                  Patuh UI PR 16/2025
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2748] bg-[#191430] px-3 py-1.5 text-xs font-medium text-[#FBFAFF]">
                  <Check className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
                  Verifikasi Sumber Primer Wajib
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Posisi SKRIFLOW & Batasan Keras (Red Lines) */}
        <section className="border-b border-[#2E2748] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="sticky top-24 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-md border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3 py-1 text-xs font-semibold text-[#6D5AE6]">
                    <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>FILOSOFI PRODUK</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#FBFAFF] sm:text-3xl">
                    Skripsi Adalah Bukti Kemampuan Riset, Bukan Sekadar Naskah Jadi
                  </h2>
                  <p className="text-sm leading-relaxed text-[#A79FC4]">
                    Sesuai Kerangka Kualifikasi Nasional Indonesia (KKNI Level 6), fungsi primer skripsi bagi lulusan sarjana
                    adalah membuktikan kemampuan melakukan riset mandiri secara metodologis. Yang dinilai dosen pembimbing
                    dan dewan penguji bukan keindahan kalimat hasil generator, melainkan pertanggungjawaban ilmiah atas
                    setiap keputusan: mengapa fenomena ini penting, mengapa teori ini dipilih, dan bagaimana data diperoleh.
                  </p>
                  <p className="text-sm leading-relaxed text-[#A79FC4]">
                    Menyerahkan penulisan ke AI menghilangkan latihan intelektual terpenting. Karena itu, SKRIFLOW menetapkan{" "}
                    <strong className="text-[#FBFAFF]">empat batasan keras (red lines)</strong> yang tidak akan pernah dilanggar
                    oleh sistem kami.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF5C8A]">
                    Empat Batasan Keras (Red Lines) SKRIFLOW
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {RED_LINES.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#2E2748] bg-[#0D1527] p-5 transition-all hover:border-[#FF5C8A]/40"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF5C8A]/15 text-[#FF5C8A] border border-[#FF5C8A]/30">
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#FBFAFF]">
                              {idx + 1}. {item.title}
                            </h4>
                            <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Kenapa Output Harus Diverifikasi ke Sumber Primer */}
        <section className="border-b border-[#2E2748] bg-[#0C0A1A] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold text-[#F59E0B]">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                <span>BAHAYA HALUSINASI &amp; FABRIKASI</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#FBFAFF] sm:text-3xl">
                Kenapa Setiap Output AI Wajib Diverifikasi ke Sumber Primer?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#A79FC4] sm:text-base">
                Large Language Models (LLM) bekerja dengan memprediksi kelanjutan kata berdasarkan probabilitas statistik
                bahasa, bukan dengan memeriksa kebenaran faktual secara deterministik. Ketika ditanya literatur atau data angka,
                AI dapat memproduksi jawaban fiktif dengan gaya yang sangat meyakinkan (<em>hallucinatory confidence</em>).
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Card 1 */}
              <div className="rounded-xl border border-[#2E2748] bg-[#0D1527] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5C8A]/15 text-[#FF5C8A] border border-[#FF5C8A]/30 mb-4">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-[#FBFAFF]">Ilusi Referensi Valid</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
                  AI kerap mengarang nama penulis ternama, judul artikel yang sangat relevan, tahun penerbitan yang pas, hingga nomor
                  DOI palsu yang tidak pernah terdaftar di Crossref atau repositori resmi manapun. Mengutip referensi ini ke dalam skripsi
                  termasuk kategori pemalsuan ilmiah.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-[#2E2748] bg-[#0D1527] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 mb-4">
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-[#FBFAFF]">Bahaya Blind Reliance</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
                  Ketergantungan buta terjadi ketika mahasiswa merasa hasil AI &quot;terlihat cukup baik&quot; tanpa membaca naskah asli.
                  Sistem deteksi plagiasi seperti Turnitin tidak mendeteksi kutipan fiktif jika teks tersebut belum pernah ada di internet,
                  tetapi saat sidang dosen akan meminta Anda menunjukkan dokumen fisiknya.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-[#2E2748] bg-[#0D1527] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFB84D]/15 text-[#FFB84D] border border-[#FFB84D]/30 mb-4">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-[#FBFAFF]">Standar Verifikasi Primer</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#A79FC4]">
                  Setiap temuan harus memiliki bukti pelacakan (<em>data provenance</em>): tautan langsung ke artikel jurnal (SINTA,
                  Garuda, DOAJ, Scopus) atau data statistik resmi (BPS, IDX, BI). Hasil prompt SKRIFLOW selalu dilabeli sebagai kandidat
                  yang wajib dicek manual ke dokumen naskah penuh (<em>full-text</em>).
                </p>
              </div>
            </div>

            {/* Verification Checklist Box */}
            <div className="mt-8 rounded-xl border border-[#2E2748] bg-[#191430] p-6">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[#FBFAFF]">
                <FileText className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                Protokol Verifikasi 3 Langkah Sebelum Naskah Dibawa ke Dosen
              </h4>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-[#FFB84D]">1. Periksa Akses URL &amp; DOI</span>
                  <p className="text-[#A79FC4] leading-relaxed">
                    Pastikan tautan dapat dibuka langsung di portal jurnal resmi dan naskah PDF aslinya telah diunduh ke komputer Anda.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-[#FFB84D]">2. Cek Jenis Sumber &amp; Reputasi</span>
                  <p className="text-[#A79FC4] leading-relaxed">
                    Bedakan artikel empiris (temuan lapangan), artikel telaah (review), dan buku teks. Hindari jurnal predator tanpa proses peer-review.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-[#FFB84D]">3. Baca Konteks Asli Temuan</span>
                  <p className="text-[#A79FC4] leading-relaxed">
                    Baca langsung bagian metodologi dan kesimpulan artikel asli untuk memastikan Anda tidak salah mengutip kesimpulan penelitian orang lain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Regulasi & Kewajiban Deklarasi AI (UI PR 16/2025 & UNESCO) */}
        <section className="border-b border-[#2E2748] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-md border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3 py-1 text-xs font-semibold text-[#6D5AE6]">
                  <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>KEBIJAKAN KAMPUS &amp; REGULASI</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#FBFAFF] sm:text-3xl">
                  Kewajiban Deklarasi Penggunaan AI: Standar Peraturan Rektor UI No. 16/2025
                </h2>
                <p className="text-sm leading-relaxed text-[#A79FC4]">
                  Kebijakan penggunaan Generative AI di perguruan tinggi Indonesia bergerak ke arah kejelasan regulasi.
                  Salah satu rujukan paling konkret adalah{" "}
                  <strong className="text-[#FBFAFF]">
                    Peraturan Rektor Universitas Indonesia No. 16 Tahun 2025 tentang Generative AI dalam Penulisan Ilmiah
                  </strong>{" "}
                  (melengkapi Permendiknas No. 17 Tahun 2010 tentang Plagiat dan Kode Etik UI):
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 rounded-lg border border-[#2E2748] bg-[#0D1527] p-4 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6D5AE6]/20 text-[11px] font-bold text-[#FFB84D]">
                      §4
                    </span>
                    <div>
                      <strong className="text-[#FBFAFF]">Pasal 4 — Kewajiban Verifikasi Mandiri:</strong>
                      <p className="mt-1 text-[#A79FC4] leading-relaxed">
                        Penulis wajib melakukan verifikasi pada setiap tahapan penulisan ilmiah, mulai dari pembuktian fenomena,
                        pemilihan instrumen, pengolahan data, hingga pemeriksaan daftar referensi. Artikel hasil karangan AI
                        tidak lolos verifikasi referensi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-[#2E2748] bg-[#0D1527] p-4 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6D5AE6]/20 text-[11px] font-bold text-[#FFB84D]">
                      §5
                    </span>
                    <div>
                      <strong className="text-[#FBFAFF]">Pasal 5 — Larangan Kepengarangan (Authorship):</strong>
                      <p className="mt-1 text-[#A79FC4] leading-relaxed">
                        AI dilarang dicantumkan sebagai penulis karya ilmiah karena tidak dapat memikul tanggung jawab hukum dan etika.
                        Tanggung jawab intelektual atas keseluruhan karya berada sepenuhnya pada mahasiswa sebagai penulis.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-[#2E2748] bg-[#0D1527] p-4 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6D5AE6]/20 text-[11px] font-bold text-[#FFB84D]">
                      §6
                    </span>
                    <div>
                      <strong className="text-[#FBFAFF]">Transparansi &amp; Pengakuan Terbuka:</strong>
                      <p className="mt-1 text-[#A79FC4] leading-relaxed">
                        Penggunaan Generative AI dalam tahap brainstorming, perbaikan tatabahasa, atau penyusunan kerangka awal wajib
                        dideklarasikan secara tertulis di dalam lampiran atau pernyataan khusus karya ilmiah.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-md border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-1 text-xs font-semibold text-[#FFB84D]">
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>SOLUSI SKRIFLOW</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#FBFAFF] sm:text-3xl">
                  Bagaimana SKRIFLOW Membantu Kepatuhan Mahasiswa?
                </h2>
                <p className="text-sm leading-relaxed text-[#A79FC4]">
                  Alih-alih menyembunyikan penggunaan AI, SKRIFLOW membantu mahasiswa mematuhi prinsip kejujuran akademik
                  secara elegan dan bertanggung jawab melalui tiga mekanisme utama:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="rounded-lg border border-[#2E2748] bg-[#191430] p-4">
                    <h4 className="text-xs font-bold text-[#FBFAFF] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                      Jejak Proses &amp; Riwayat Prompt (Audit Trail)
                    </h4>
                    <p className="mt-1.5 text-xs text-[#A79FC4] leading-relaxed">
                      SKRIFLOW menyusun prompt secara modular dan transparan. Mahasiswa dapat memperlihatkan riwayat instruksi
                      dan catatan eksplorasi kepada dosen pembimbing sebagai bukti bahwa AI hanya dipakai sebagai alat bantu
                      proses berpikir, bukan penentu substansi.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#2E2748] bg-[#191430] p-4">
                    <h4 className="text-xs font-bold text-[#FBFAFF] flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                      Generator Draf Deklarasi AI Terintegrasi
                    </h4>
                    <p className="mt-1.5 text-xs text-[#A79FC4] leading-relaxed">
                      Di dalam fitur perakit kami (seperti pada Tool Bedah Hasil), SKRIFLOW secara otomatis menyusun draf
                      pernyataan deklarasi penggunaan AI berdasarkan tahapan yang benar-benar dikerjakan pengguna, sehingga
                      mahasiswa tinggal menyalin dan menyesuaikannya dengan format kampus masing-masing.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#2E2748] bg-[#191430] p-4">
                    <h4 className="text-xs font-bold text-[#FBFAFF] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#FFB84D]" aria-hidden="true" />
                      Privasi Lokal Tanpa Jejak Peladen (Client-Side Only)
                    </h4>
                    <p className="mt-1.5 text-xs text-[#A79FC4] leading-relaxed">
                      SKRIFLOW berjalan di peramban pengguna tanpa menyimpan draf ide atau teks penelitian ke peladen pusat.
                      Kerahasiaan data riset mahasiswa terlindungi sepenuhnya dan tidak dijadikan bahan pelatihan model kecerdasan buatan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Komparasi "Yang Kami TIDAK Lakukan" vs "Yang Kami Bantu" */}
        <section className="border-b border-[#2E2748] bg-[#0C0A1A] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#2E2748] bg-[#191430] px-3 py-1 text-xs font-semibold text-[#A79FC4]">
                <span>RINGKASAN TEGAS</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#FBFAFF] sm:text-3xl">
                Yang Kami TIDAK Lakukan vs Yang Kami Bantu
              </h2>
              <p className="mt-3 text-xs text-[#A79FC4] sm:text-sm leading-relaxed">
                Tabel batasan ini kami pasang di depan agar tidak ada kesalahpahaman antara mahasiswa, pengembang alat,
                dan dosen pembimbing mengenai posisi produk SKRIFLOW.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-xl border border-[#2E2748] bg-[#0D1527]">
              {/* Table Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#2E2748] bg-[#191430] text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2 p-4 text-[#FF5C8A] border-b md:border-b-0 md:border-r border-[#2E2748]">
                  <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Yang Kami TIDAK Lakukan (Red Lines)</span>
                </div>
                <div className="flex items-center gap-2 p-4 text-[#FFB84D]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Yang Kami Bantu (Fasilitasi Proses)</span>
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-[#2E2748]/70 text-xs">
                {COMPARISON_ITEMS.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 transition-colors hover:bg-[#191430]/50">
                    <div className="flex items-start gap-3 p-4 border-b md:border-b-0 md:border-r border-[#2E2748]/70 text-[#A79FC4]">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF5C8A]/10 text-[#FF5C8A] font-mono text-[11px]">
                        ✕
                      </span>
                      <span className="leading-relaxed">{item.notDone}</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 text-[#FBFAFF]">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFB84D]/10 text-[#FFB84D] font-mono text-[11px]">
                        ✓
                      </span>
                      <span className="leading-relaxed text-[#A79FC4]">{item.supported}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Template Draf Deklarasi Penggunaan AI */}
        <section className="border-b border-[#2E2748] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-1 text-xs font-semibold text-[#FFB84D]">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span>TEMPLATE RUJUKAN MAHASISWA</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#FBFAFF] sm:text-3xl">
                Contoh Format Deklarasi Penggunaan AI untuk Lampiran Skripsi
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#A79FC4]">
                Jika kampus Anda mewajibkan pernyataan deklarasi AI (seperti implementasi UI PR 16/2025), berikut adalah
                kerangka acuan yang dapat Anda salin dan sesuaikan dengan pedoman program studi:
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-[#2E2748] bg-[#0D1527] p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-[#2E2748] pb-4 mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FFB84D] flex items-center gap-2">
                  <ScrollText className="h-4 w-4" aria-hidden="true" />
                  Pernyataan Kejujuran Akademik &amp; Deklarasi Bantuan AI
                </span>
                <span className="rounded bg-[#6D5AE6]/20 px-2 py-0.5 text-[11px] font-semibold text-[#FFB84D] border border-[#6D5AE6]/30">
                  Draf Lampiran
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs leading-relaxed text-[#A79FC4] bg-[#0C0A1A] p-5 rounded-lg border border-[#2E2748]/80 select-all">
                <p className="text-[#FBFAFF]">
                  &quot;Dalam penyusunan kerangka awal dan penyempurnaan naskah penelitian ini, saya menggunakan bantuan Artificial
                  Intelligence (Generative AI) secara terbatas sebagai alat bantu proses, dengan rincian:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong className="text-[#FBFAFF]">Eksplorasi Ide &amp; Pemetaan Fenomena:</strong> Menggunakan bantuan AI
                    untuk memperluas kata kunci pencarian dan menyusun struktur pertanyaan. Seluruh bukti data awal diverifikasi ke
                    sumber resmi (BPS / IDX / pemberitaan terverifikasi) dan ditinjau secara mandiri.
                  </li>
                  <li>
                    <strong className="text-[#FBFAFF]">Penelusuran Literatur:</strong> Menggunakan NotebookLM dan alat bantu berbasis
                    dokumen untuk membandingkan keterbatasan studi. Semua sitasi yang dikutip telah dibaca naskah lengkapnya (full-text)
                    dari jurnal primer bereputasi dan dicek nomor DOI-nya.
                  </li>
                  <li>
                    <strong className="text-[#FBFAFF]">Penyempurnaan Bahasa &amp; Kohesi:</strong> AI dimanfaatkan sebatas pengecekan
                    tata bahasa dan kelancaran alur kalimat pada draf yang ditulis sendiri oleh penulis.
                  </li>
                </ol>
                <p className="pt-2 border-t border-[#2E2748]/70 text-[#FBFAFF]">
                  AI tidak digunakan untuk menentukan judul akhir, merumuskan novelty tanpa bukti literatur, mengarang kutipan fiktif,
                  maupun menulis isi penuh bab secara otomatis. Seluruh keputusan ilmiah dan naskah akhir ditulis serta
                  dipertanggungjawabkan sepenuhnya oleh saya sebagai penulis.&quot;
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2.5 text-xs text-[#A79FC4]/80">
                <Info className="h-4 w-4 shrink-0 text-[#6D5AE6] mt-0.5" aria-hidden="true" />
                <p>
                  <em>Catatan:</em> Pastikan untuk selalu mengonfirmasi pedoman format penulisan tugas akhir terkini di program studi
                  atau fakultas masing-masing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Panduan Etis Menghadapi Dosen Pembimbing */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-[#6D5AE6]/30 bg-gradient-to-b from-[#191430] to-[#0C0A1A] p-8 sm:p-12 relative overflow-hidden">
              <div className="max-w-3xl">
                <h3 className="text-xl font-extrabold text-[#FBFAFF] sm:text-2xl lg:text-3xl">
                  Siap Melangkah dengan Riset yang Jujur dan Percaya Diri?
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[#A79FC4] sm:text-base">
                  Dosen pembimbing tidak memusuhi teknologi; dosen menguji apakah Anda benar-benar mengerti apa yang Anda tulis.
                  Dengan menggunakan prompt terstruktur dan menjaga disiplin verifikasi sumber primer, Anda dapat melangkah ke ruang
                  bimbingan maupun ruang sidang munaqasyah dengan kepala tegak.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#6D5AE6] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#6D5AE6]/25 hover:bg-[#5A46D6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6]"
                  >
                    <span>Mulai dengan Tools SKRIFLOW</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#2E2748] bg-[#191430] px-5 py-2.5 text-xs font-semibold text-[#FBFAFF] hover:border-[#6D5AE6]/50 hover:bg-[#221A42] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5AE6]"
                  >
                    <ArrowLeft className="h-4 w-4 text-[#A79FC4]" aria-hidden="true" />
                    <span>Kembali ke Halaman Utama</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <LandingFooter />
    </div>
  );
}
