/**
 * Penerjemah galat validasi Tahap 4B ke bahasa mahasiswa + langkah perbaikan.
 *
 * Alasan modul ini ada: pesan galat 4B sebelumnya berbunyi "Data transfer Fondasi
 * Bab 1 tidak lolos validasi skema" — terdengar seperti masalah format, padahal
 * penyebab tersering adalah arah penelitian yang tidak cocok atau jumlah bagian
 * peta latar belakang yang meleset. Mahasiswa yang membaca pesan itu menekan
 * "Salin Prompt Perbaikan Format", mengirim ulang, dan gagal lagi karena formatnya
 * memang sudah benar — yang salah isinya.
 *
 * Fungsi murni supaya bisa diuji tanpa browser.
 */

export type KelasGalat4B = "format" | "struktur" | "arah" | "lain";

export interface GalatDijelaskan {
  asli: string;
  kelas: KelasGalat4B;
  artinya: string;
  langkah: string;
}

/** Cocokkan satu baris galat ke kelasnya. Urutan pola menentukan: yang khas dulu. */
function kelasDari(detail: string): KelasGalat4B {
  const d = detail.toLowerCase();

  // Arah: galat semantik, isi JSON-nya sudah sah.
  if (d.includes("berbeda dengan arah terpilih")) return "arah";
  if (d.includes("tidak ditemukan di evidence_ledger")) return "arah";
  if (d.includes("student_selected")) return "arah";

  // Format: JSON/marker/versi — yang bisa diperbaiki tanpa menyentuh isi.
  if (d.includes("schema_version")) return "format";
  if (d.includes("format")) return "format";

  if (
    d.includes("wajib memuat") ||
    d.includes("wajib diisi") ||
    d.includes("wajib berupa") ||
    d.includes("maksimal") ||
    d.includes("1-ke-1") ||
    d.includes("ditemukan:")
  ) {
    return "struktur";
  }

  return "lain";
}

/** Kalimat manusia untuk tiap galat + apa yang harus dilakukan. */
export function jelaskanGalat4B(detail: string): GalatDijelaskan {
  const kelas = kelasDari(detail);
  const d = detail.toLowerCase();

  if (d.includes("berbeda dengan arah terpilih")) {
    const cocok = detail.match(/\(([^)]+)\)/g) || [];
    return {
      asli: detail,
      kelas: "arah",
      artinya: `Kamu sudah memilih satu arah penelitian di Tool 4, tapi jawaban AI memakai arah lain${
        cocok.length >= 2 ? ` (jawaban memakai ${cocok[0]}, arahmu ${cocok[1]})` : ""
      }.`,
      langkah:
        "Kirim ulang jawaban itu ke chat yang sama dengan pesan: \"Ganti selected_direction.id menjadi arah yang saya pilih, dan sesuaikan isinya. Jangan mengubah field lain.\"",
    };
  }

  if (d.includes("tidak ditemukan di evidence_ledger")) {
    const m = detail.match(/Claim '([^']+)'/);
    return {
      asli: detail,
      kelas: "arah",
      artinya: `Klaim ${m ? m[1] : "tertentu"} dipakai di peta latar belakang, tapi tidak ada di daftar bukti (evidence_ledger). Artinya klaim itu tidak punya sumber.`,
      langkah:
        "Minta AI menambahkan klaim itu ke evidence_ledger beserta source_ids-nya, atau menghapusnya dari peta latar belakang.",
    };
  }

  if (d.includes("student_selected")) {
    return {
      asli: detail,
      kelas: "arah",
      artinya: "AI belum menandai bahwa arah penelitian ini yang kamu pilih sendiri (bukan pilihan otomatis).",
      langkah: "Minta AI mengubah selected_direction.student_selected menjadi true.",
    };
  }

  if (d.includes("background_map wajib memuat tepat 7")) {
    const m = detail.match(/(\d+)\s*\)/) || detail.match(/ditemukan:\s*(\d+)/);
    const jumlah = m ? m[1] : null;
    return {
      asli: detail,
      kelas: "struktur",
      artinya: `Peta latar belakang harus berisi 7–9 bagian paragraf, tapi yang diterima berjumlah ${jumlah ?? "di luar rentang itu"} — jadi strukturnya belum bisa dipakai.`,
      langkah:
        "Minta AI memperbaiki jumlah bagian menjadi 7–9 dengan fungsi paragraf yang lengkap (dari konteks spesifik sampai urgensi penelitian).",
    };
  }

  if (d.includes("1-ke-1")) {
    return {
      asli: detail,
      kelas: "struktur",
      artinya: "Jumlah rumusan masalah dan tujuan penelitian belum berpasangan satu-satu.",
      langkah: "Minta AI menyamakan jumlahnya, tiap rumusan masalah punya satu tujuan pasangannya.",
    };
  }

  if (d.includes("candidate_research_questions")) {
    return {
      asli: detail,
      kelas: "struktur",
      artinya: "Rumusan masalah harus ada 1–3. Yang diterima jumlahnya di luar rentang itu.",
      langkah: "Minta AI menyesuaikan jumlah rumusan masalah menjadi 1–3.",
    };
  }

  if (d.includes("working_title_previews")) {
    return {
      asli: detail,
      kelas: "struktur",
      artinya: "Gambaran bentuk judul harus ada 1–3. Ini POLA judul, bukan judul final.",
      langkah: "Minta AI menyesuaikan jumlah working_title_previews menjadi 1–3.",
    };
  }

  if (d.includes("research_logic_chain")) {
    return {
      asli: detail,
      kelas: "struktur",
      artinya: "Rantai logika penelitian (dari konteks sampai pertanyaan penelitian) belum lengkap.",
      langkah: "Minta AI melengkapi research_logic_chain tahap demi tahap.",
    };
  }

  if (d.includes("evidence_ledger")) {
    return {
      asli: detail,
      kelas: "struktur",
      artinya: "Daftar bukti (evidence_ledger) belum diisi atau ada baris yang tidak lengkap.",
      langkah: "Minta AI mengisi evidence_ledger lengkap dengan claim_id dan source_ids.",
    };
  }

  if (d.includes("schema_version")) {
    return {
      asli: detail,
      kelas: "format",
      artinya: "Versi skema di dalam blok JSON salah.",
      langkah: "Minta AI menulis ulang blok dengan schema_version bernilai 1.",
    };
  }

  return {
    asli: detail,
    kelas: "lain",
    artinya: detail,
    langkah: "Kirim ulang jawaban ke chat yang sama dan minta AI memperbaiki bagian ini saja.",
  };
}

/** Judul yang menyebut kelas masalahnya, bukan "validasi skema" generik. */
export function judulGalat4B(details: string[]): string {
  const kelas = new Set(details.map(kelasDari));
  const adaArah = kelas.has("arah");
  const adaStruktur = kelas.has("struktur");
  const adaFormat = kelas.has("format");

  if (adaArah && !adaStruktur && !adaFormat) return "Arah penelitian pada jawaban AI tidak cocok";
  if (adaArah) return `${details.length} hal perlu diperbaiki pada jawaban AI (termasuk arah penelitian)`;
  if (adaStruktur) return `${details.length} bagian jawaban AI belum lengkap`;
  if (adaFormat) return "Format jawaban AI belum bisa dibaca sistem";
  return `${details.length} hal perlu diperbaiki pada jawaban AI`;
}

/** Satu kalimat yang menjelaskan kenapa ini terjadi, supaya mahasiswa tidak menyalahkan diri. */
export function sebabGalat4B(details: string[]): string {
  const kelas = new Set(details.map(kelasDari));
  if (kelas.has("arah")) {
    return "Ini bukan salahmu dan bukan salah format. AI menjawab dengan isi yang tidak sejalan dengan pilihanmu di Tool 4, jadi sistem menolaknya supaya Bab 1 tidak dibangun di atas arah yang keliru.";
  }
  if (kelas.has("struktur")) {
    return "Bukan salahmu. AI melewati sebagian bagian yang diwajibkan, jadi paketnya belum bisa dipakai.";
  }
  return "Bukan salahmu. Bentuk jawaban AI belum sesuai sehingga sistem tidak bisa membacanya.";
}
