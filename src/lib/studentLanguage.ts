/**
 * SKRIFLOW Student Language System V1
 * Centralized presentation-layer dictionary, semantic mappings, and student-friendly formatters.
 * Strictly decoupled from internal schemas, enums, and parser logic.
 */

export interface StudentStatusInfo {
  label: string;
  description?: string;
  badgeClass: string;
  iconType?: "check" | "alert" | "x" | "info" | "clock";
  recommendedAction?: string;
}

export interface AcademicTermInfo {
  friendlyLabel: string;
  simpleMeaning: string;
  whyItMatters: string;
  technicalTerm?: string;
}

// =========================================================================
// 1. GLOBAL STATUS MAPPINGS
// =========================================================================

export const STUDENT_STATUS_MAP: Record<string, StudentStatusInfo> = {
  // General & Lifecycle Statuses
  READY: {
    label: "Siap Digunakan",
    description: "Kondisi dan bukti sudah memenuhi syarat untuk dilanjutkan.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  CONDITIONAL: {
    label: "Bisa Dilanjutkan, tetapi Masih Perlu Dicek",
    description: "Dapat digunakan sebagai dasar awal, namun ada hal penting yang harus diverifikasi.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Periksa catatan batasan atau konfirmasi kembali ketersediaan data.",
  },
  BLOCKED: {
    label: "Belum Aman Dilanjutkan",
    description: "Ada syarat penting atau data inti yang belum terpenuhi.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Lengkapi data yang kurang atau sesuaikan pilihan arah.",
  },

  // Qualitative Strengths
  STRONG: {
    label: "Dukungan Kuat",
    description: "Didukung oleh bukti atau sumber yang jelas dan terverifikasi.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  MEDIUM: {
    label: "Sedang",
    description: "Cukup untuk eksplorasi awal, namun masih membutuhkan penegasan.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  WEAK: {
    label: "Dukungan Lemah",
    description: "Bukti pendukung masih sangat terbatas atau belum terverifikasi mandiri.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },

  // Indonesian Equivalents for Qualitative Scores (KUAT, SEDANG, LEMAH)
  KUAT: {
    label: "Kuat",
    description: "Didukung oleh data empiris atau sumber akademik yang jelas.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  SEDANG: {
    label: "Sedang",
    description: "Cukup untuk tahap awal, namun perlu diperiksa lebih lanjut.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  LEMAH: {
    label: "Lemah",
    description: "Bukti masih minim atau belum terverifikasi secara memadai.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },

  // Tool 1: Constraint Fit & Comparison
  SELARAS_SEMENTARA: {
    label: "Sementara Cocok dengan Kondisimu",
    description: "Sesuai dengan preferensi, akses data, dan batasan waktu yang kamu tentukan.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  PERLU_DIPERIKSA: {
    label: "Bisa Dilanjutkan dengan Catatan",
    description: "Dapat digunakan sebagai dasar awal, namun ada catatan penting yang harus diverifikasi.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Cek apakah kamu benar-benar memiliki akses atau waktu untuk menyelesaikan prosedur ini.",
  },
  BERISIKO: {
    label: "Berisiko untuk Dikerjakan",
    description: "Membutuhkan data atau prosedur yang mungkin memberatkan kondisimu saat ini.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Pertimbangkan alternatif area lain yang lebih realistis untuk dikerjakan.",
  },
  SANGAT_DEKAT: {
    label: "Sangat Sesuai",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  DEKAT: {
    label: "Sesuai",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  CUKUP_DEKAT: {
    label: "Cukup Sesuai",
    badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    iconType: "info",
  },
  RENDAH_SEMENTARA: {
    label: "Beban Relatif Ringan",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  RENDAH: {
    label: "Rendah",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  TINGGI: {
    label: "Tinggi",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "alert",
  },

  // Tool 2 & Phenomenon Coherence Statuses
  SIAP_DIBAWA: {
    label: "Bisa Dilanjutkan",
    description: "Bukti empiris cukup jelas dan sumbernya dapat ditelusuri.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  JANGAN_DIGUNAKAN: {
    label: "Jangan Digunakan",
    description: "Klaim fenomena ini tidak didukung sumber kredibel atau terlalu spekulatif.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },
  BELUM_TERVERIFIKASI: {
    label: "Belum Dikonfirmasi",
    badgeClass: "bg-zinc-500/15 border border-zinc-500/30 text-zinc-400",
    iconType: "clock",
  },
  COHERENT_ENOUGH: {
    label: "Fenomena Terfokus",
    description: "Keluarga peristiwa dan ukuran respons sudah terdefinisi secara jelas.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  NEEDS_NARROWING: {
    label: "Fenomena Masih Terlalu Lebar",
    description: "Fenomenanya masih terlalu lebar. Kamu sebaiknya memilih dulu satu jenis peristiwa dan satu bentuk respons yang mau diamati.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Pilih satu jenis peristiwa dan satu bentuk respons pasar yang paling ingin kamu amati.",
  },
  INCOHERENT: {
    label: "Fenomena Belum Terfokus",
    description: "Fenomena mencampur beberapa peristiwa dan indikator respons yang tidak sejalan.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Fokuskan pada satu peristiwa nyata dan satu respons terukur.",
  },

  // Gate A: Source Identity Statuses
  VERIFIED: {
    label: "Identitas Terverifikasi",
    description: "Identitas naskah dan metadata resmi penerbit konsisten.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  INDICATED: {
    label: "Identitas Sebagian Terbaca",
    description: "Sebagian identitas tersedia tetapi belum seluruhnya dikonfirmasi.",
    badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    iconType: "info",
  },
  NEEDS_MANUAL_CHECK: {
    label: "Identitas Sumber Belum Konsisten",
    description: "Identitas sumber ini belum konsisten. Cek lagi judul, penulis, dan DOI sebelum dipakai.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Cek kembali judul, nama penulis, dan DOI pada naskah asli.",
  },
  INVALID: {
    label: "Sumber Tidak Valid",
    description: "Sumber tidak dapat ditelusuri, palsu, atau ditarik kembali secara resmi.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },

  // Gate C & Tool 3: Academic Role Statuses
  INTI_LANGSUNG: {
    label: "Sumber Inti Langsung",
    description: "Artikel empiris lengkap yang langsung menguji peristiwa dan respons yang sama.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  INTI_SEBAGIAN: {
    label: "Sumber Terkait Dekat",
    description: "Artikel yang membahas konsep serupa namun salah satu unsur inti hanya sebagian sesuai.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  PENDUKUNG_KONTEKS: {
    label: "Pendukung Konteks / Teori",
    description: "Memberikan latar belakang teori atau metode tanpa menguji fenomena aktif secara langsung.",
    badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    iconType: "info",
  },
  REVIEW_ONLY: {
    label: "Tinjauan Literatur / SLR",
    description: "Artikel review/SLR yang berguna untuk pemetaan tetapi bukan bukti empiris mandiri.",
    badgeClass: "bg-zinc-500/15 border border-zinc-500/30 text-zinc-400",
    iconType: "info",
  },
  DIABAIKAN: {
    label: "Diabaikan",
    description: "Bukan full-text, tidak relevan, laporan AI, atau memiliki masalah integritas.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },

  // Statement Classes & Claim Interpretation (Tool 4 Patch 2)
  EMPIRICAL_FACT: {
    label: "Fakta dari Sumber",
    description: "Fakta langsung dari sumber literatur yang memiliki rujukan halaman/tabel terverifikasi.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  CROSS_SOURCE_SYNTHESIS: {
    label: "Sintesis Beberapa Sumber",
    description: "Kesimpulan yang ditarik dari dua atau lebih studi yang sebanding.",
    badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    iconType: "info",
  },
  RESEARCHER_DECISION: {
    label: "Keputusan Sementara Mahasiswa",
    description: "Bagian ini merupakan keputusan sementara penelitian dan tidak membutuhkan sitasi seolah-olah berasal dari jurnal.",
    badgeClass: "bg-purple-500/15 border border-purple-500/30 text-purple-400",
    iconType: "info",
  },
  NEEDS_VERIFICATION: {
    label: "Perlu Diperiksa",
    description: "Klaim atau rujukan masih membutuhkan verifikasi sebelum dipakai.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Periksa kembali sumber atau naskah asli.",
  },
  READY_TO_DRAFT: {
    label: "Siap Tulis",
    description: "Klaim dan bukti sudah cukup kuat dan siap digunakan dalam penulisan Bab 1.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  DO_NOT_USE: {
    label: "Jangan Digunakan",
    description: "Klaim ini tidak didukung bukti yang memadai atau bermasalah.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },

  // Phenomenon Basis Statuses (Patch 5)
  VERIFIED_REAL_WORLD: {
    label: "Fenomena Dunia Nyata Terverifikasi",
    description: "Fenomena didukung oleh bukti konkret dunia nyata dari Tool 2.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  LITERATURE_INDICATED: {
    label: "Petunjuk Fenomena dari Literatur",
    description: "Petunjuk ini membantu menentukan arah pencarian, tetapi belum cukup disebut sebagai bukti fenomena dunia nyata.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Verifikasi keberadaan fenomena di dunia nyata sebelum finalisasi skripsi.",
  },
  MISSING: {
    label: "Dasar Fenomena Belum Ada",
    description: "Belum tersedia bukti fenomena dunia nyata yang dapat digunakan.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Cari fenomena nyata terlebih dahulu pada Tool 2.",
  },
  STATISTICAL_RED_FLAG: {
    label: "Perlu Verifikasi Angka Statistik",
    description: "Terdapat angka atau interpretasi statistik yang perlu dicocokkan kembali ke tabel naskah asli.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "alert",
    recommendedAction: "Buka tabel asli pada naskah untuk memastikan angka dan hasil uji.",
  },

  // Tool 4: Input Audit & Literature Package
  BUKTI_TIDAK_CUKUP: {
    label: "Buktinya Belum Cukup",
    description: "Buktinya belum cukup untuk menyusun gap. Cari sumber yang lebih langsung dulu.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Cari dulu artikel yang langsung membahas topik dan respons yang sama.",
  },
  CUKUP_UNTUK_EKSPLORASI: {
    label: "Cukup untuk Mencari Arah",
    description: "Tersedia bukti dasar yang cukup untuk memetakan alternatif arah penelitian.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  CUKUP_UNTUK_ARAH: {
    label: "Cukup untuk Memilih Arah",
    description: "Paket bukti jurnal lengkap dan memadai untuk memilih serta membedah arah penelitian.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },

  // Tool 4: Research Gap Strengths & Types
  DIDUKUNG_DALAM_PAKET: {
    label: "Cukup Didukung oleh Sumber yang Tersedia",
    description: "Jurnal dalam paket bukti menunjukkan adanya celah atau perbedaan temuan yang nyata.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  TERDUKUNG_SEMENTARA: {
    label: "Ada Dukungan Awal",
    description: "Terdapat indikasi celah penelitian, namun masih perlu diperkuat dengan rujukan sejenis.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  TERINDIKASI: {
    label: "Keterbatasan Mulai Terindikasi",
    description: "Pola keterbatasan baru terlihat dari sebagian sumber.",
    badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    iconType: "info",
  },
  PERLU_VERIFIKASI: {
    label: "Perlu Verifikasi Sumber Tambahan",
    description: "Kandidat gap masuk akal, tetapi membutuhkan pencarian atau pemeriksaan sumber tambahan.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Cari rujukan tambahan yang menguji konteks atau ukuran sebanding.",
  },
  CUKUP_DIDUKUNG: {
    label: "Cukup Didukung Sumber Tersedia",
    description: "Keterbatasan pengetahuan didukung beberapa sumber relevan dan dapat dibawa ke konsultasi dosen.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  UTAMA: {
    label: "Sumber Utama",
    description: "Artikel peer-reviewed full-text atau sumber primer/resmi yang dapat ditelusuri.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  PENDUKUNG: {
    label: "Sumber Pendukung",
    description: "Proceeding, working paper, tesis, review, atau laporan institusi yang masih relevan.",
    badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    iconType: "info",
  },
  PERLU_SUMBER_TAMBAHAN: {
    label: "Masih Membutuhkan Sumber Tambahan",
    description: "Bukti jurnal yang ada belum cukup kuat untuk memvalidasi celah ini.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Cari jurnal tambahan yang menguji hubungan atau objek serupa.",
  },
  TIDAK_DAPAT_DIBANDINGKAN: {
    label: "Penelitiannya Tidak Cukup Sejenis untuk Dibandingkan",
    description: "Studi-studi yang ada menggunakan konteks atau ukuran yang terlalu berbeda.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },
  TIDAK_DIDUKUNG: {
    label: "Belum Didukung oleh Sumber",
    description: "Tidak ditemukan bukti yang memadai dalam paket literatur saat ini.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },
  PACKAGE_COVERAGE_GAP: {
    label: "Perlu Pencarian Sumber Tambahan",
    description: "Ini baru menunjukkan sumber yang terkumpul belum lengkap, belum membuktikan adanya research gap.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Lengkapi dulu pencarian literatur internasional/sejenis sebelum menyimpulkan adanya celah penelitian.",
  },
  COMPARABILITY_LIMIT: {
    label: "Batasan Keterbandingan",
    description: "Hasil studi yang ada menggunakan ukuran atau konteks yang tidak dapat disatukan.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Cari rujukan tambahan yang menggunakan proksi atau metode sejenis.",
  },
  NOT_DIRECTLY_COMPARABLE: {
    label: "Belum Bisa Dibandingkan Langsung",
    description: "Hasil kedua studi ini belum bisa dibandingkan langsung karena ukuran atau konteksnya berbeda.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Bandingkan hanya studi yang menggunakan ukuran dan konteks setara.",
  },

  // Tool 4: Direction Readiness
  LAYAK_DIPERIKSA: {
    label: "Layak Diperiksa Lebih Lanjut",
    description: "Arah ini memiliki landasan bukti yang masuk akal dan relevan untuk diteliti.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  RISIKO_TINGGI: {
    label: "Risiko Pengerjaan Tinggi",
    description: "Arah ini membutuhkan data atau metodologi rumit yang berpotensi menghambat skripsi.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "alert",
  },
  JANGAN_DIBAWA: {
    label: "Jangan Dilanjutkan",
    description: "Arah ini tidak didukung bukti yang memadai atau tidak realistis untuk dikerjakan.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },

  // Tool 4: Feasibility & Data Readiness
  SUDAH_DIPASTIKAN: {
    label: "Sudah Dipastikan Tersedia",
    description: "Kamu sudah memastikan dapat mengakses atau memperoleh data ini.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  BELUM_DIPASTIKAN: {
    label: "Belum Dipastikan",
    description: "Data mungkin ada, tetapi kamu belum mengecek izin atau cara mengunduhnya.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  TIDAK_TERSEDIA: {
    label: "Tidak Tersedia / Tidak Bisa Diakses",
    description: "Data ini tidak dapat diperoleh dalam batasan waktu atau izin yang kamu miliki.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },
  ACCESS_INDICATED_NOT_TESTED: {
    label: "Akses Data Belum Diuji",
    description: "Sumber datanya sudah disebut, tetapi belum dicek apakah benar bisa diakses dan lengkap.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Pastikan kamu sudah membuka dan memeriksa kelengkapan data tersebut.",
  },
  PUBLICLY_ACCESSIBLE_CONFIRMED: {
    label: "Data Publik Terkonfirmasi",
    description: "Data terbuka dan aksesibilitasnya sudah terverifikasi.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },

  DATA_READY: {
    label: "Data Utama Sudah Dipastikan",
    description: "Seluruh kebutuhan data penting untuk arah ini siap diakses.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  DATA_CONDITIONAL: {
    label: "Sebagian Data Masih Perlu Dicek",
    description: "Ada data pendukung yang perlu kamu konfirmasi sebelum mulai menulis.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Pastikan akses ke data yang ditandai sebelum mengajukan proposal.",
  },
  DATA_BLOCKED: {
    label: "Data Penting Belum Tersedia",
    description: "Data inti untuk arah ini belum bisa dipastikan, sehingga berisiko macet di tengah jalan.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Pilih arah alternatif lain yang datanya benar-benar bisa kamu akses.",
  },

  // Tool 4: Bab 1 Foundation Statuses
  BAB1_READY: {
    label: "Siap Dilanjutkan ke Bab 1",
    description: "Fondasi masalah, bukti fenomena, rujukan literatur, dan kesiapan data sudah terkalibrasi.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  BAB1_CONDITIONAL: {
    label: "Bisa Dilanjutkan, tetapi Masih Ada yang Harus Dicek",
    description: "Fondasi sudah cukup baik, namun perlu konfirmasi catatan akses atau arahan dosen.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
    recommendedAction: "Konsultasikan catatan keterbatasan dan gambaran judul dengan dosen pembimbing.",
  },
  BAB1_BLOCKED: {
    label: "Belum Aman Dilanjutkan ke Bab 1",
    description: "Fondasi Bab 1 belum aman dibuat karena masih ada bagian penting yang perlu dibereskan.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
    recommendedAction: "Selesaikan pengecekan data atau kembali ke tahap bedah arah.",
  },

  // Comparability Ratings
  SEBANDING: {
    label: "Dapat Dibandingkan",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    iconType: "check",
  },
  SEBANDING_SEBAGIAN: {
    label: "Sebagian Dapat Dibandingkan",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
    iconType: "alert",
  },
  TIDAK_SEBANDING: {
    label: "Tidak Dapat Dibandingkan Langsung",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
    iconType: "x",
  },
};

// =========================================================================
// 2. DATA ORIGIN & PROVENANCE HELPERS
// =========================================================================

export const DATA_ORIGIN_MAP: Record<string, { label: string; description: string; badgeClass: string }> = {
  PUBLIC_SECONDARY: {
    label: "Data Publik yang Sudah Tersedia",
    description: "Laporan keuangan, data BPS, arsip regulasi, atau data publik yang tidak perlu kamu buat sendiri.",
    badgeClass: "bg-[#6D5AE6]/15 border border-[#6D5AE6]/30 text-[#6D5AE6]",
  },
  RESEARCHER_GENERATED: {
    label: "Dibuat Sendiri Saat Penelitian",
    description: "Data yang kamu hasilkan melalui prompt AI, coding manual, penilaian skor, atau simulasi.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
  },
  PRIMARY_RESPONDENT: {
    label: "Data Responden / Lapangan",
    description: "Diperoleh langsung dari wawancara, kuesioner, observasi, atau pencarian responden.",
    badgeClass: "bg-purple-500/15 border border-purple-500/30 text-purple-400",
  },
  INSTITUTIONAL_METADATA: {
    label: "Dokumen & Regulasi Resmi",
    description: "Peraturan perundang-undangan, standar profesi, atau laporan audit dari lembaga resmi.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
  },
};

export const DATA_ACCESS_STATUS_MAP: Record<string, { label: string; description: string; badgeClass: string }> = {
  INDICATED: {
    label: "Data Siap Diakses",
    description: "Sumber data terbuka dan bisa kamu peroleh langsung.",
    badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
  },
  NEEDS_CHECKING: {
    label: "Perlu Cek Akses & Izin",
    description: "Periksa kembali kelengkapan arsip, izin instansi, atau metode pengumpulannya.",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
  },
  NOT_CONFIRMED: {
    label: "Belum Dipastikan",
    description: "Belum ada kepastian apakah data ini benar-benar bisa kamu dapatkan.",
    badgeClass: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
  },
};

// =========================================================================
// 3. RESEARCH LOGIC CHAIN STAGES (TOOL 4)
// =========================================================================

export const RESEARCH_LOGIC_STAGE_MAP: Record<
  string,
  { order: number; label: string; description: string; question: string }
> = {
  CONTEXT: {
    order: 1,
    label: "Konteks Penelitian",
    description: "Latar tempat, sektor, atau lingkungan tempat masalah ini terjadi.",
    question: "Di mana atau pada bidang apa penelitian ini berlangsung?",
  },
  PHENOMENON: {
    order: 2,
    label: "Apa yang Terjadi (Fenomena Nyata)",
    description: "Kondisi nyata, perubahan aturan, atau tren teramati yang didukung bukti.",
    question: "Kondisi apa di dunia nyata yang menarik untuk diperiksa?",
  },
  EMPIRICAL_PROBLEM: {
    order: 3,
    label: "Masalah yang Terlihat dari Data",
    description: "Kesenjangan, ketidaksesuaian, atau dampak negatif dari kondisi nyata tersebut.",
    question: "Kenapa kondisi nyata tersebut menjadi masalah yang penting?",
  },
  PRIOR_KNOWLEDGE: {
    order: 4,
    label: "Apa yang Sudah Diketahui",
    description: "Temuan dan kesepakatan dari penelitian-penelitian terdahulu.",
    question: "Apa penjelasan atau kesimpulan yang sudah mapan dalam literatur?",
  },
  KNOWLEDGE_LIMIT: {
    order: 5,
    label: "Apa yang Belum Jelas (Research Gap)",
    description: "Hal yang masih menjadi perdebatan, berbeda hasil, atau belum cukup diuji.",
    question: "Bagian mana yang belum cukup dijelaskan oleh penelitian sebelumnya?",
  },
  RESEARCH_DIRECTION: {
    order: 6,
    label: "Fokus yang Akan Diperiksa",
    description: "Sudut pandang atau relasi spesifik yang dipilih untuk menjawab ketidakjelasan.",
    question: "Fokus apa yang kamu ambil untuk membantu menjawab hal yang belum jelas?",
  },
  RESEARCH_QUESTION: {
    order: 7,
    label: "Pertanyaan Utama Penelitian",
    description: "Rumusan masalah inti yang akan dijawab melalui pengumpulan dan analisis data skripsi.",
    question: "Pertanyaan apa yang harus dijawab oleh penelitian ini?",
  },
};

// =========================================================================
// 4. RESEARCH GAP TYPES (TOOL 4)
// =========================================================================

export const GAP_TYPE_MAP: Record<string, { label: string; meaning: string; studentTip: string }> = {
  EMPIRICAL_INCONSISTENCY: {
    label: "Temuan Penelitian yang Berbeda",
    meaning: "Penelitian-penelitian terdahulu menemukan hasil yang saling bertentangan pada topik yang sama.",
    studentTip: "Artinya: Kamu bisa memeriksa faktor apa yang menyebabkan hasil penelitian sebelumnya berbeda.",
  },
  MEASUREMENT: {
    label: "Perbedaan Cara Mengukur",
    meaning: "Cara mengukur atau indikator variabel yang digunakan penelitian terdahulu masih beragam.",
    studentTip: "Artinya: Kamu bisa membandingkan atau menguji indikator mana yang paling tepat untuk konteksmu.",
  },
  CONTEXTUAL_BOUNDARY: {
    label: "Batas Konteks Penelitian",
    meaning: "Temuan yang sudah terbukti di luar negeri atau sektor lain belum tentu berlaku di lingkungan barumu.",
    studentTip: "Artinya: Kamu menguji apakah pola yang sama tetap terjadi di objek atau wilayah yang kamu teliti.",
  },
  TEMPORAL_OR_REGULATORY: {
    label: "Perubahan Waktu atau Aturan Baru",
    meaning: "Adanya aturan baru, krisis, atau perubahan zaman membuat penelitian lama perlu diperbarui.",
    studentTip: "Artinya: Kamu memeriksa apakah kondisi setelah ada aturan baru mengubah pola yang selama ini diketahui.",
  },
  METHODOLOGICAL_LIMITATION: {
    label: "Keterbatasan Cara Penelitian Terdahulu",
    meaning: "Penelitian terdahulu mengakui memiliki keterbatasan sampel, data, atau teknik analisis.",
    studentTip: "Artinya: Kamu mencoba melengkapi keterbatasan yang diakui oleh peneliti sebelumnya.",
  },
  EVIDENCE_COVERAGE: {
    label: "Bukti yang Masih Kurang",
    meaning: "Belum banyak penelitian akademik yang mendalami sudut pandang spesifik ini.",
    studentTip: "Artinya: Kamu membantu menyajikan bukti awal yang terstruktur pada area yang masih jarang dibahas.",
  },
};

// =========================================================================
// 5. BACKGROUND MAP PARAGRAPH FUNCTIONS (TOOL 4)
// =========================================================================

export const BACKGROUND_FUNCTION_MAP: Record<
  string,
  { paragraphNumber: number; title: string; objective: string }
> = {
  SPECIFIC_CONTEXT: {
    paragraphNumber: 1,
    title: "Paragraf 1 — Bangun Konteks Penelitian",
    objective: "Mengenalkan sektor, perkembangan terkini, dan ruang lingkup umum yang melatarbelakangi topik.",
  },
  OBJECT_AND_SCOPE: {
    paragraphNumber: 2,
    title: "Paragraf 2 — Jelaskan Objek dan Batasnya",
    objective: "Menegaskan siapa atau apa yang menjadi subjek/objek penelitian dan batasan wilayah/periode.",
  },
  EMPIRICAL_PHENOMENON: {
    paragraphNumber: 3,
    title: "Paragraf 3 — Tunjukkan Fenomena Nyata",
    objective: "Menyajikan fakta, data terukur, atau peristiwa nyata yang didukung oleh sumber kredibel.",
  },
  WHY_IT_IS_A_PROBLEM: {
    paragraphNumber: 4,
    title: "Paragraf 4 — Jelaskan Kenapa Ini Menjadi Masalah",
    objective: "Menunjukkan dampak negatif, kerugian, atau urgensi penting kenapa fenomena ini perlu diselidiki.",
  },
  PRIOR_RESEARCH: {
    paragraphNumber: 5,
    title: "Paragraf 5 — Ringkas Apa yang Sudah Diteliti",
    objective: "Memetakan temuan-temuan kunci dari literatur jurnal akademik yang sudah ada sebelumnya.",
  },
  KNOWLEDGE_LIMIT_OR_GAP: {
    paragraphNumber: 6,
    title: "Paragraf 6 — Jelaskan Apa yang Belum Terjawab",
    objective: "Menunjukkan celah penelitian (research gap), perbedaan hasil, atau hal yang masih belum tuntas.",
  },
  URGENCY_AND_DIRECTION: {
    paragraphNumber: 7,
    title: "Paragraf 7 — Arahkan ke Penelitianmu",
    objective: "Menyimpulkan fokus penelitianmu sebagai upaya konkret untuk menjawab celah yang telah dijelaskan.",
  },
};

// =========================================================================
// 6. TECHNICAL TERMS & EXPLAINERS
// =========================================================================

export const ACADEMIC_TERMS_MAP: Record<string, AcademicTermInfo> = {
  dataProvenance: {
    friendlyLabel: "Asal Data",
    simpleMeaning: "Dari mana data penelitianmu berasal dan bagaimana cara kamu memperolehnya.",
    whyItMatters: "Menentukan apakah skripsimu realistis diselesaikan sesuai waktu dan kemampuan.",
    technicalTerm: "Data Provenance",
  },
  scopeBoundary: {
    friendlyLabel: "Batas Area",
    simpleMeaning: "Hal-hal yang masuk ke dalam penelitianmu (in-scope) dan yang sengaja tidak dibahas (out-of-scope).",
    whyItMatters: "Mencegah topik melebar ke mana-mana saat mencari jurnal dan menulis Bab 1.",
    technicalTerm: "Scope Boundary",
  },
  constraintFit: {
    friendlyLabel: "Cocok dengan Kondisimu",
    simpleMeaning: "Kesesuaian arah penelitian dengan preferensi metode, akses data, dan batasan waktu.",
    whyItMatters: "Memastikan kamu tidak memilih topik yang membutuhkan survei rumit jika kamu ingin data sekunder.",
    technicalTerm: "Constraint Fit",
  },
  literatureSearchSeeds: {
    friendlyLabel: "Bekal Kata Kunci untuk Cari Jurnal",
    simpleMeaning: "Daftar konsep dan istilah akademik untuk kamu ketikkan di Google Scholar atau NotebookLM.",
    whyItMatters: "Memudahkanmu menemukan artikel jurnal yang tepat sasaran tanpa bingung mencari kata kunci.",
    technicalTerm: "Literature Search Seeds",
  },
  triangulationNote: {
    friendlyLabel: "Cara Bukti Saling Menguatkan",
    simpleMeaning: "Pemeriksaan apakah klaim fenomena didukung oleh lebih dari satu sumber independen.",
    whyItMatters: "Membuat latar belakang skripsimu kokoh dan tidak mudah disanggah dosen penguji.",
    technicalTerm: "Triangulation Assessment",
  },
  whatIsNotProven: {
    friendlyLabel: "Hal yang Belum Bisa Disimpulkan",
    simpleMeaning: "Batasan fakta yang tidak boleh kamu klaim berlebihan sebelum penelitian selesai.",
    whyItMatters: "Mencegah overclaim atau membuat kesimpulan sebab-akibat prematur di Bab 1.",
    technicalTerm: "What Is Not Proven",
  },
  calibratedPhenomenon: {
    friendlyLabel: "Fenomena yang Sudah Dicek",
    simpleMeaning: "Kondisi nyata yang sudah dipastikan konteks, data pendukung, dan batas klaimnya.",
    whyItMatters: "Memastikan penelitianmu berangkat dari fakta terverifikasi dan bukan rumor.",
    technicalTerm: "Calibrated Phenomenon",
  },
  evidenceBasis: {
    friendlyLabel: "Dasar Bukti",
    simpleMeaning: "Pemisahan antara fakta lapangan yang terlihat, temuan penelitian terdahulu, dan hal yang belum bisa disimpulkan.",
    whyItMatters: "Mencegah pencampuradukan antara data fenomena nyata dengan simpulan artikel jurnal.",
    technicalTerm: "Evidence Basis",
  },
  priorKnowledge: {
    friendlyLabel: "Apa yang Sudah Diketahui",
    simpleMeaning: "Kesimpulan dan temuan yang sudah mapan dari penelitian-penelitian terdahulu.",
    whyItMatters: "Membantumu memahami posisi studi terdahulu sebelum mencari celah baru.",
    technicalTerm: "Prior Knowledge",
  },
  knowledgeLimit: {
    friendlyLabel: "Hal yang Masih Belum Jelas",
    simpleMeaning: "Keterbatasan pengetahuan, perdebatan hasil, atau konteks yang belum tuntas diuji oleh studi terdahulu.",
    whyItMatters: "Menjadi alasan kuat kenapa penelitianmu penting untuk dikerjakan.",
    technicalTerm: "Knowledge Limit",
  },
  comparability: {
    friendlyLabel: "Apakah Studi Ini Bisa Dibandingkan?",
    simpleMeaning: "Pemeriksaan apakah studi terdahulu memakai ukuran, proksi, dan konteks yang sebanding.",
    whyItMatters: "Mencegah pertentangan palsu akibat membandingkan dua ukuran yang sebenarnya berbeda (misal ERC vs harga saham).",
    technicalTerm: "Comparability",
  },
  candidateGap: {
    friendlyLabel: "Kandidat Celah Penelitian",
    simpleMeaning: "Dugaan awal keterbatasan pengetahuan dari literatur yang perlu dicek dan dikonfirmasi dengan dosen.",
    whyItMatters: "Bahan diskusi ilmiah dengan pembimbing tanpa mengklaim secara mutlak bahwa belum pernah ada penelitian.",
    technicalTerm: "Candidate Gap",
  },
  conditionalRecommendation: {
    friendlyLabel: "Rekomendasi Sementara",
    simpleMeaning: "Saran arah yang paling masuk akal berdasarkan bukti yang ada, namun keputusan akhir tetap di tangan mahasiswa.",
    whyItMatters: "Membantu mahasiswa membandingkan alternatif tanpa kehilangan kendali atas skripsinya.",
    technicalTerm: "Conditional Recommendation",
  },
  evidenceLedger: {
    friendlyLabel: "Catatan Bukti",
    simpleMeaning: "Daftar pernyataan yang aman kamu tulis beserta rujukan sumber, nomor halaman, dan batas penggunaannya.",
    whyItMatters: "Menjadi pegangan agar setiap kalimat penting di latar belakang Bab 1 memiliki rujukan pasti.",
    technicalTerm: "Evidence Ledger",
  },
  dataReadiness: {
    friendlyLabel: "Kesiapan Data",
    simpleMeaning: "Pemeriksaan apakah data yang dibutuhkan benar-benar bisa kamu peroleh dan akses.",
    whyItMatters: "Mencegah skripsi macet di tengah jalan akibat data primer/sekunder ternyata tidak tersedia.",
    technicalTerm: "Data Readiness",
  },
  claimBoundary: {
    friendlyLabel: "Batas Klaim",
    simpleMeaning: "Daftar apa yang aman kamu nyatakan di Bab 1 dan apa yang belum aman kamu klaim.",
    whyItMatters: "Menjaga skripsi agar tidak overclaim atau menyimpulkan sebab-akibat secara prematur.",
    technicalTerm: "Claim Boundary",
  },
  researchLogicChain: {
    friendlyLabel: "Alur Kenapa Penelitian Ini Perlu Dilakukan",
    simpleMeaning: "7 mata rantai logika dari fenomena nyata hingga pertanyaan penelitian.",
    whyItMatters: "Menjadi kerangka utama agar cerita Bab 1 mengalir runtut dan tidak melompat-lompat.",
    technicalTerm: "Research Logic Chain",
  },
};

// =========================================================================
// 7. PUBLIC CONVERSION & FORMATTING FUNCTIONS
// =========================================================================

/**
 * Safely converts an internal enum, status, or snake_case string to student-friendly Indonesian copy.
 */
export function getStudentLabel(value: string | undefined | null, domain?: string): string {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const dom = (domain || "").trim().toLowerCase();

  // 0. Domain-specific overrides (Workload & Methodological Uncertainty)
  if (
    dom === "workload" ||
    dom === "beban" ||
    dom === "collection_burden" ||
    dom === "collectionburden"
  ) {
    if (trimmed.toUpperCase() === "RENDAH" || trimmed.toUpperCase() === "LOW" || trimmed.toUpperCase() === "RENDAH_SEMENTARA") return "Beban Rendah";
    if (trimmed.toUpperCase() === "SEDANG" || trimmed.toUpperCase() === "MEDIUM") return "Beban Sedang";
    if (trimmed.toUpperCase() === "TINGGI" || trimmed.toUpperCase() === "HIGH") return "Beban Tinggi";
    if (trimmed.toUpperCase() === "PERLU_DIPERIKSA") return "Beban Perlu Diperiksa";
  }

  if (
    dom === "uncertainty" ||
    dom === "ketidakpastian" ||
    dom === "methodological_uncertainty" ||
    dom === "methodologicaluncertainty"
  ) {
    if (trimmed.toUpperCase() === "RENDAH" || trimmed.toUpperCase() === "LOW") return "Ketidakpastian Rendah";
    if (trimmed.toUpperCase() === "SEDANG" || trimmed.toUpperCase() === "MEDIUM") return "Ketidakpastian Sedang";
    if (trimmed.toUpperCase() === "TINGGI" || trimmed.toUpperCase() === "HIGH") return "Ketidakpastian Tinggi";
    if (trimmed.toUpperCase() === "PERLU_DIPERIKSA") return "Ketidakpastian Perlu Diperiksa";
  }

  // 1. Direct status map lookup
  if (STUDENT_STATUS_MAP[trimmed]) {
    return STUDENT_STATUS_MAP[trimmed].label;
  }

  // 2. Data origin lookup
  if (DATA_ORIGIN_MAP[trimmed]) {
    return DATA_ORIGIN_MAP[trimmed].label;
  }

  // 3. Data access status lookup
  if (DATA_ACCESS_STATUS_MAP[trimmed]) {
    return DATA_ACCESS_STATUS_MAP[trimmed].label;
  }

  // 4. Research logic chain stage lookup
  if (RESEARCH_LOGIC_STAGE_MAP[trimmed]) {
    return RESEARCH_LOGIC_STAGE_MAP[trimmed].label;
  }

  // 5. Gap type lookup
  if (GAP_TYPE_MAP[trimmed]) {
    return GAP_TYPE_MAP[trimmed].label;
  }

  // 6. Background function lookup
  if (BACKGROUND_FUNCTION_MAP[trimmed]) {
    return BACKGROUND_FUNCTION_MAP[trimmed].title;
  }

  // 7. Academic terms lookup
  if (ACADEMIC_TERMS_MAP[trimmed]) {
    return ACADEMIC_TERMS_MAP[trimmed].friendlyLabel;
  }

  // 8. Custom common overrides & raw enum translation
  switch (trimmed.toLowerCase()) {
    case "unknown":
      return "Belum ditentukan";
    case "quantitative":
      return "Kuantitatif";
    case "qualitative":
      return "Kualitatif";
    case "mixed":
      return "Campuran";
    case "secondary_public":
      return "Data sekunder atau publik";
    case "survey":
      return "Survei atau kuesioner";
    case "interview":
      return "Wawancara";
    case "observation_field":
      return "Observasi / turun lapangan";
    case "combined":
      return "Kombinasi beberapa sumber";
    case "public":
      return "Punya akses data publik";
    case "respondents":
      return "Punya calon responden";
    case "organization":
      return "Punya akses organisasi atau perusahaan";
    case "own_dataset":
      return "Punya dataset sendiri";
    case "fast":
      return "Ingin relatif cepat";
    case "flexible":
      return "Punya waktu cukup fleksibel";
    case "deadline":
      return "Sedang mengejar tenggat";
    case "working":
      return "Mengerjakan sambil bekerja atau magang";
    case "campuran":
      return "Campuran Indonesia & Internasional";
    case "indonesia":
      return "Prioritaskan sumber Indonesia";
    case "internasional":
      return "Prioritaskan sumber internasional";
    case "three_years":
      return "3 tahun terakhir";
    case "five_years":
      return "5 tahun terakhir";
    case "ten_years":
      return "10 tahun terakhir";
    case "unrestricted":
      return "Tidak dibatasi";
    case "uncertainty":
      return "Ketidakpastian";
    case "gambaran_bukan_judul_final":
      return "Gambaran Bentuk Judul (Bukan Judul Final)";
    case "recommended_single":
      return "Paling Sesuai dengan Kondisimu";
    case "recommended_tie":
      return "Dua Pilihan yang Seimbang";
    case "no_safe_recommendation":
      return "Perlu Pertimbangan Khusus";
    case "interest_mismatch":
      return "Kurang Cocok dengan Minat";
    case "study_program_mismatch":
      return "Kurang Relevan dengan Jurusan";
    case "data_discomfort":
      return "Jenis Data Kurang Nyaman";
    case "access_unclear":
      return "Akses Data Masih Belum Jelas";
    case "too_complex":
      return "Metode atau Analisis Terlalu Rumit";
    case "too_heavy":
      return "Beban Pengerjaan Terlalu Berat";
    case "respondent_or_fieldwork":
      return "Menghindari Survei / Turun Lapangan";
    case "lecturer_direction_mismatch":
      return "Kurang Sesuai Arahan Dosen";
    case "areas_too_similar":
      return "Pilihan Area Terlalu Mirip";
    case "other":
      return "Lainnya";
    default:
      break;
  }

  // Fallback: convert SNAKE_CASE, kebab-case, or camelCase to Clean Title Case
  let words: string[] = [];
  if (trimmed.includes("_")) {
    words = trimmed.split("_").filter(Boolean);
  } else if (trimmed.includes("-")) {
    words = trimmed.split("-").filter(Boolean);
  } else {
    words = trimmed.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(" ").filter(Boolean);
  }

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Returns complete student-friendly status info (label, description, badge styles, recommended action).
 */
export function getStudentStatus(status: string | undefined | null, domain?: string): StudentStatusInfo {
  if (!status || typeof status !== "string") {
    return {
      label: "Belum Ditentukan",
      badgeClass: "bg-zinc-500/15 border border-zinc-500/30 text-zinc-400",
      iconType: "clock",
    };
  }

  const trimmed = status.trim();
  if (STUDENT_STATUS_MAP[trimmed]) {
    return STUDENT_STATUS_MAP[trimmed];
  }

  // Fallback
  return {
    label: getStudentLabel(trimmed, domain),
    badgeClass: "bg-zinc-500/15 border border-zinc-500/30 text-zinc-400",
    iconType: "info",
  };
}

/**
 * Returns formatted data origin badge and description.
 */
export function getDataOriginInfo(origin: string) {
  if (DATA_ORIGIN_MAP[origin]) {
    return DATA_ORIGIN_MAP[origin];
  }
  return {
    label: getStudentLabel(origin),
    description: "Informasi asal data penelitian.",
    badgeClass: "bg-zinc-500/15 border border-zinc-500/30 text-zinc-300",
  };
}

/**
 * Returns formatted access status info.
 */
export function getDataAccessStatusInfo(status: string) {
  if (DATA_ACCESS_STATUS_MAP[status]) {
    return DATA_ACCESS_STATUS_MAP[status];
  }
  return {
    label: getStudentLabel(status),
    description: "Status pengecekan data.",
    badgeClass: "bg-zinc-500/15 border border-zinc-500/30 text-zinc-300",
  };
}

/**
 * Returns Research Logic Chain Stage information.
 * Adapts label based on phenomenonBasisStatus (Patch 3).
 */
export function getResearchLogicStageInfo(
  stage: string,
  fallbackOrder = 1,
  phenomenonBasisStatus?: import("@/types/tool").PhenomenonBasisStatus
) {
  const stageUpper = (stage || "").trim().toUpperCase();

  if (stageUpper === "PHENOMENON") {
    if (phenomenonBasisStatus === "LITERATURE_INDICATED") {
      return {
        order: 2,
        label: "Petunjuk Fenomena yang Perlu Dicek",
        description: "Petunjuk awal dari literatur yang memerlukan pengecekan dan batas bukti.",
        question: "Petunjuk apa dari literatur yang perlu diperiksa lebih lanjut?",
      };
    }
    if (phenomenonBasisStatus === "MISSING") {
      return {
        order: 2,
        label: "Dasar Fenomena Belum Tersedia",
        description: "Belum tersedia dasar fenomena dunia nyata yang dapat digunakan.",
        question: "Dasar fenomena belum tersedia.",
      };
    }
    return {
      order: 2,
      label: "Apa yang Terjadi (Fenomena Nyata)",
      description: "Kondisi nyata, perubahan aturan, atau tren teramati yang didukung bukti.",
      question: "Kondisi apa di dunia nyata yang menarik untuk diperiksa?",
    };
  }

  if (RESEARCH_LOGIC_STAGE_MAP[stage]) {
    return RESEARCH_LOGIC_STAGE_MAP[stage];
  }
  return {
    order: fallbackOrder,
    label: getStudentLabel(stage),
    description: "Tahap dalam alur logika penelitian.",
    question: "Bagaimana tahap ini menghubungkan masalah dengan penelitian?",
  };
}

/**
 * Returns Gap Type information with student tip.
 */
export function getGapTypeInfo(gapType: string) {
  if (GAP_TYPE_MAP[gapType]) {
    return GAP_TYPE_MAP[gapType];
  }
  return {
    label: getStudentLabel(gapType),
    meaning: "Celah dalam literatur akademik yang menjadi dasar penelitianmu.",
    studentTip: "Artinya: Area ini menjadi alasan mengapa penelitianmu perlu dilakukan.",
  };
}

/**
 * Returns Background Map function info.
 * Adapts title based on phenomenonBasisStatus (Patch 3).
 */
export function getBackgroundFunctionInfo(
  func: string,
  order = 1,
  phenomenonBasisStatus?: import("@/types/tool").PhenomenonBasisStatus
) {
  const funcUpper = (func || "").trim().toUpperCase();

  if (funcUpper === "EMPIRICAL_PHENOMENON") {
    const pNum = order || 3;
    if (phenomenonBasisStatus === "LITERATURE_INDICATED") {
      return {
        paragraphNumber: pNum,
        title: `Paragraf ${pNum} — Jelaskan Petunjuk Fenomena dan Batas Buktinya`,
        objective: "Menjelaskan petunjuk awal fenomena dari literatur serta menegaskan batasan buktinya sebelum diverifikasi di dunia nyata.",
      };
    }
    if (phenomenonBasisStatus === "MISSING") {
      return {
        paragraphNumber: pNum,
        title: `Paragraf ${pNum} — Dasar Fenomena Belum Tersedia`,
        objective: "Dasar fenomena belum tersedia. Silakan cari fenomena pada Tool 2.",
      };
    }
    return {
      paragraphNumber: pNum,
      title: `Paragraf ${pNum} — Tunjukkan Fenomena Nyata`,
      objective: "Menyajikan fakta, data terukur, atau peristiwa nyata yang didukung oleh sumber kredibel.",
    };
  }

  if (BACKGROUND_FUNCTION_MAP[func]) {
    return BACKGROUND_FUNCTION_MAP[func];
  }
  return {
    paragraphNumber: order,
    title: `Paragraf ${order} — ${getStudentLabel(func)}`,
    objective: "Membangun argumen latar belakang penelitian secara bertahap.",
  };
}

/**
 * Returns academic explainer info for complex concepts.
 */
export function getAcademicTermInfo(term: string): AcademicTermInfo {
  if (ACADEMIC_TERMS_MAP[term]) {
    return ACADEMIC_TERMS_MAP[term];
  }
  return {
    friendlyLabel: getStudentLabel(term),
    simpleMeaning: "Konsep akademik yang digunakan dalam perancangan penelitian.",
    whyItMatters: "Membantu menyusun skripsi yang terstruktur dan metodologis.",
  };
}

/**
 * Creates a structured dual-layer language presentation for UI guidance vs Academic Artifact text.
 * Strictly guarantees semantic alignment while adapting presentation tone.
 */
export function createDualLayerPresentation(params: {
  status?: string;
  problemText: string;
  whyItMatters?: string;
  nextAction?: string;
  formalAcademicText?: string;
}): import("@/types/tool").LanguagePresentation {
  const statusInfo = params.status ? getStudentStatus(params.status) : null;
  const friendlyPrefix = statusInfo?.label ? `${statusInfo.label}. ` : "";
  const whyPart = params.whyItMatters ? ` ${params.whyItMatters}` : "";

  const studentExplanation = `${friendlyPrefix}${params.problemText}${whyPart}`.trim();

  return {
    studentExplanation,
    academicArtifactText: params.formalAcademicText?.trim(),
    nextActionText: (params.nextAction || statusInfo?.recommendedAction || "").trim() || undefined,
  };
}

/**
 * Returns formatted source weight badge and display label for Tool 4 (Patch 1).
 * Labels: 'Sumber Utama', 'Sumber Pendukung', 'Perlu Diperiksa'.
 */
export function getSourceWeightInfo(weight: string | undefined | null): { label: string; badgeClass: string } {
  if (weight === "UTAMA") {
    return {
      label: "Sumber Utama",
      badgeClass: "bg-[#FFB84D]/15 border border-[#FFB84D]/30 text-[#FFB84D]",
    };
  }
  if (weight === "PENDUKUNG") {
    return {
      label: "Sumber Pendukung",
      badgeClass: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
    };
  }
  return {
    label: "Perlu Diperiksa",
    badgeClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
  };
}

export function deriveDirectionRiskLevel(
  directionOrRisk?:
    | {
        workload_risk?: string | null;
        workload?: string | null;
        readiness?: string;
        academic_risks?: string[];
        data_risks?: string[];
      }
    | string
    | null,
  workloadFallback?: string | null
): "RENDAH" | "SEDANG" | "TINGGI" {
  let riskStr = "";
  let fallbackStr = workloadFallback || "";

  if (typeof directionOrRisk === "object" && directionOrRisk !== null) {
    riskStr = directionOrRisk.workload_risk || "";
    fallbackStr = directionOrRisk.workload || fallbackStr;
  } else if (typeof directionOrRisk === "string") {
    riskStr = directionOrRisk;
  }

  if (riskStr) {
    const wr = riskStr.trim().toUpperCase();
    if (wr === "RENDAH" || wr.includes("RENDAH") || wr === "RINGAN") return "RENDAH";
    if (wr === "TINGGI" || wr.includes("TINGGI") || wr === "BERAT") return "TINGGI";
    if (wr === "SEDANG" || wr.includes("SEDANG")) return "SEDANG";
  }

  if (fallbackStr) {
    const fb = fallbackStr.trim().toUpperCase();
    if (fb === "RENDAH" || fb.includes("RENDAH") || fb === "RINGAN") return "RENDAH";
    if (fb === "TINGGI" || fb.includes("TINGGI") || fb === "BERAT") return "TINGGI";
    if (fb === "SEDANG" || fb.includes("SEDANG")) return "SEDANG";
  }

  return "SEDANG";
}

/**
 * Formats student-facing constraint fit label (Patch 6).
 */
export function formatConstraintFitLabel(fit?: string): string {
  if (!fit) return "SEDANG";
  const f = fit.trim().toUpperCase();
  if (f === "KUAT" || f === "STRONG") return "KUAT";
  if (f === "SEDANG" || f === "MEDIUM") return "SEDANG";
  if (f === "LEMAH" || f === "WEAK") return "LEMAH";
  return f;
}

/**
 * Formats student-facing workload label (Patch 6).
 */
export function formatWorkloadLabel(workload?: string): string {
  if (!workload) return "SEDANG";
  const w = workload.trim().toUpperCase();
  if (w === "RENDAH" || w === "RINGAN" || w === "LOW") return "RINGAN";
  if (w === "SEDANG" || w === "MEDIUM") return "SEDANG";
  if (w === "TINGGI" || w === "HIGH") return "TINGGI";
  return w;
}


