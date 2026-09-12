/**
 * Pola Judul Skripsi — gambaran BENTUK judul, bukan judul final.
 *
 * Tool 4 tidak boleh menetapkan judul final (mahasiswa dan dosen pembimbing yang
 * menentukan). Yang boleh diberikan: POLA ber-placeholder — kerangka kalimat judul
 * dengan slot yang diisi mahasiswa sendiri.
 *
 * Dirakit dari komponen arah yang sudah ada, jadi tidak butuh field AI baru dan
 * tetap muncul walau output 4A belum memuat apa pun soal judul.
 *
 * Fungsi murni: tanpa DOM, tanpa storage, tanpa panggilan jaringan.
 */

export interface TitleSlot {
  /** Nama slot sesuai pola, mis. "aspek" dari "[aspek]". */
  slot: string;
  /** Isian yang tersedia dari data arah, belum final. */
  nilai: string;
}

export interface TitlePattern {
  /** Kerangka kalimat judul dengan placeholder. */
  pola: string;
  /** Pola yang slotnya sudah diisi data yang ada — gambaran judul, masih tentatif. */
  contoh_terisi: string;
  /** Isian tiap placeholder dari data yang tersedia. */
  slot_terisi: TitleSlot[];
  /** Hal yang belum bisa diisi otomatis; harus diputuskan mahasiswa/dosen. */
  slot_belum_diputuskan: string[];
  /** Pengingat batas, selalu ikut tampil. */
  batas: string;
}

export interface TitlePatternScope {
  objectOrPopulation?: string;
  referencePeriod?: string;
}

export const BATAS_POLA =
  "Ini POLA judul, bukan judul final. Judul asli ditentukan bersama dosen pembimbing setelah data dan sampelnya pasti.";

const BELUM_DIPUTUSKAN_DASAR = [
  "Jumlah dan nama perusahaan yang jadi sampel",
  "Sumber data resmi yang sudah kamu verifikasi sendiri",
  "Ukuran/variabel yang benar-benar bisa dihitung dari data itu",
  "Bentuk final kalimatnya (satu baris, atau judul dan subjudul)",
];

/** Huruf pertama saja yang dihuruf-kecilkan; singkatan seperti PSAK/ROE tetap utuh. */
function hurufKecilAwal(teks: string): string {
  const t = (teks || "").trim();
  if (!t) return "";
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * Memilih pola dari KELUARGA DESAIN PERTAMA saja.
 *
 * Memakai gabungan semua keluarga membuat dua arah berbeda jatuh ke pola yang
 * sama (mis. D01 "Perbandingan lintas perusahaan" dan D03 "Perbandingan
 * kelompok" -> identik, padahal desain intinya beda).
 */
function pilihPola(designFamilies: string[]): string {
  const utama = (designFamilies[0] || "").toLowerCase();
  if (/sebelum dan sesudah|perubahan|before|after/.test(utama)) {
    return "Perubahan [outcome] pada [objek] setelah [peristiwa] (periode [tahun])";
  }
  if (/komparatif|antarjenis|perbandingan kelompok|perbandingan lintas|perbandingan antar/.test(utama)) {
    return "Perbandingan [aspek] antara [objek] pada periode [tahun]";
  }
  if (/analisis isi|dokumenter|deskriptif|kuantitatif/.test(utama)) {
    return "Analisis [aspek] pada [objek] periode [tahun]";
  }
  return "[aspek] pada [objek]: tinjauan [pendekatan] periode [tahun]";
}

/** "setelah penerapan PSAK 117" -> "penerapan PSAK 117". Diambil dari nama arah, bukan karangan. */
function ambilPeristiwa(namaArah: string | undefined): string | null {
  const m = /\bsetelah\s+(.+)$/i.exec((namaArah || "").trim());
  return m ? m[1].trim() : null;
}

/** Buang kata dobel di persimpangan: "Perubahan" + "perubahan ekuitas" -> "perubahan ekuitas". */
function rapikanPersimpangan(kalimat: string): string {
  const kata = kalimat.split(" ");
  const hasil: string[] = [];
  for (const k of kata) {
    const sebelumnya = hasil[hasil.length - 1];
    if (sebelumnya && sebelumnya.toLowerCase() === k.toLowerCase()) continue;
    hasil.push(k);
  }
  return hasil.join(" ");
}

/**
 * Merakit pola judul dari komponen arah penelitian yang sudah tersedia.
 * `scope` diambil dari fenomena terpilih (objek/populasi + periode acuan).
 */
export function susunPolaJudul(
  dir: {
    name?: string;
    potential_constructs?: string[];
    potential_objects?: string[];
    candidate_outcomes?: string[];
    possible_design_families?: string[];
    measurement_focus?: { primary_outcome?: string } | null;
  },
  scope?: TitlePatternScope
): TitlePattern {
  const aspek =
    dir.potential_constructs?.[0] ||
    dir.measurement_focus?.primary_outcome ||
    dir.candidate_outcomes?.[0] ||
    dir.name ||
    "aspek yang datanya tersedia";

  const objek =
    dir.potential_objects?.[0] || scope?.objectOrPopulation || "objek yang datanya tersedia";

  // Pola sudah memuat kata "periode", jadi fallback ditulis tanpa kata itu
  // supaya tidak menjadi "periode periode yang datanya tersedia".
  const tahun = scope?.referencePeriod?.trim() || "yang datanya tersedia";
  const outcome = dir.measurement_focus?.primary_outcome || dir.candidate_outcomes?.[0] || aspek;
  const pendekatan = dir.possible_design_families?.[0] || "pendekatan yang datanya tersedia";

  const pola = pilihPola(dir.possible_design_families || []);
  const peristiwa = ambilPeristiwa(dir.name);
  const nilai: Record<string, string> = {
    aspek: hurufKecilAwal(aspek),
    objek: hurufKecilAwal(objek),
    tahun,
    outcome: hurufKecilAwal(outcome),
    pendekatan: hurufKecilAwal(pendekatan),
  };
  if (peristiwa) nilai.peristiwa = hurufKecilAwal(peristiwa);

  const namaSlot = Array.from(new Set(Array.from(pola.matchAll(/\[([a-zA-Z]+)\]/g)).map((m) => m[1])));
  const slot_terisi: TitleSlot[] = namaSlot.map((slot) => ({
    slot,
    nilai: nilai[slot] || "belum ada datanya",
  }));

  // Isi placeholder dengan nilai yang tersedia -> gambaran judul utuh.
  // Slot yang tidak punya padanan tetap ditandai, supaya mahasiswa tahu bagian mana yang masih kosong.
  const contoh_terisi = rapikanPersimpangan(
    pola.replace(/\[([a-zA-Z]+)\]/g, (_m, slot: string) => nilai[slot] || `[${slot}: belum ada datanya]`)
  );

  return {
    pola,
    contoh_terisi,
    slot_terisi,
    slot_belum_diputuskan: BELUM_DIPUTUSKAN_DASAR,
    batas: BATAS_POLA,
  };
}
