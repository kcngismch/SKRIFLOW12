/**
 * Mahasiswa yang sudah menulis Bab 2 sendiri (atau punya tinjauan pustaka dari
 * penelitian lain) bisa masuk lewat sini.
 *
 * Kenapa modul ini ada: Bab 2 sebelumnya menuntut fondasi Bab 1 lengkap + peta
 * dari Tool 4. Mahasiswa semester akhir yang sudah menulis tinjauan pustaka
 * terkunci total — dan kalau tombol tempel tidak menyimpan apa pun, jalan itu
 * cuma tampak ada. Modul ini menyusun draf berstruktur dari tulisan mahasiswa
 * sendiri TANPA menyentuh kalimatnya: hanya memecah paragraf, menghitung, dan
 * menandai sitasi. Klaim tetap kosong karena Skriflow tidak boleh menyatakan
 * tulisan mahasiswa sudah terverifikasi.
 *
 * ponytail: pemecah paragraf deterministik (baris kosong). Kalau ternyata
 * mahasiswa menempel satu blok tanpa baris kosong, ganti dengan pemecah
 * berbasis model — bukan dengan menambah heuristik di sini.
 */
import { BAB2_TARGET_WORDS } from "./bab2Parser";
import { hitungKata } from "./bedahParser";
import type { Bab2DraftV1 } from "@/types/bab2";
import type { SumberRegister } from "./tempelBahan";

/** Satu paragraf tempelan -> satu sub-bab bernomor. Judul turunan, isi apa adanya. */
function judulTurunan(i: number): string {
  return `Tinjauan Pustaka (${i})`;
}

export function susunDrafBab2DariTempelan(
  teks: string,
  register: SumberRegister[],
  opsi?: { fondasiBab1Ada?: boolean }
): Bab2DraftV1 | null {
  const paragraf = (teks || "")
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter((p) => p.length > 0);

  if (paragraf.length === 0) return null;

  const background = paragraf.map((p, i) => ({
    order: i + 1,
    sub_bab: judulTurunan(i + 1),
    function: "tu_tinjauan_pustaka_mahasiswa",
    paragraph_text: p,
    // Kosong dengan sengaja: klaim milik tulisan mahasiswa belum diperiksa
    // Skriflow. Mengisinya di sini berarti mengklaim verifikasi yang tidak ada.
    claim_ids: [] as string[],
  }));

  const totalKata = background.reduce((n, p) => n + hitungKata(p.paragraph_text), 0);
  const sumberDipakai = Array.from(new Set(register.map((s) => s.sourceId).filter(Boolean)));

  return {
    schema_version: 1,
    // DRAFT_PARTIAL, bukan DRAFT_COMPLETE: bukti Mahasiswa yang sudah menulis
    // sendiri belum lewat pemeriksaan berjenjang Skriflow, jadi statusnya tidak
    // boleh lebih tinggi daripada jalur normal.
    draft_status: "DRAFT_PARTIAL",
    foundation_status_ref: opsi?.fondasiBab1Ada ? "BAB1_FONDASI_ADA" : "BAB1_TANPA_FONDASI",
    word_count_total: totalKata,
    target_words_total: BAB2_TARGET_WORDS,
    background,
    skipped_sections: [],
    used_claim_ids: [],
    used_source_ids: sumberDipakai,
    avoided_claims: [],
    new_sources_introduced: [],
    consistency_notes: [
      "Draf ini berasal dari tulisan mahasiswa sendiri yang ditempel langsung, bukan hasil Prompt 6B.",
      "Paragraf dipecah otomatis pada baris kosong. Susunan asli tulisan tidak diubah.",
    ],
    unresolved_notes: [
      "Skriflow belum memetakan klaim per paragraf untuk draf ini. Klaim yang dipakai dan tidak dipakai masih perlu kamu tandai sendiri.",
      totalKata < 1800
        ? `Baru ${totalKata} kata; tinjauan pustaka biasanya 1800–3000 kata. Sisanya bisa kamu tulis setelah ini.`
        : "",
    ].filter(Boolean),
  };
}
