/**
 * Tahap 11 — Peta Literatur Bab 2 (Addendum D §D.6).
 *
 * SELURUH berkas ini deterministik: tidak ada panggilan AI. Tabel penelitian
 * terdahulu dibangun dari Source Register Tool 3, jadi tidak ada satu sel pun
 * yang bisa dikarang model.
 */

import type { SumberPaketLiteratur } from "./bedahParser";
import { pisahPenulisTahun } from "./ekspor";
import type {
  Bab2BarisPenelitianTerdahulu,
  Bab2CakupanSumber,
  Bab2MapV1,
} from "@/types/bab2";

/**
 * Kolom tabel penelitian terdahulu.
 *
 * `catatan`: register Tool 3 memang tidak memuat kolom metode/hasil — itu
 * permintaan prompt B, bukan kelalaian parser. Karena itu kolom tersebut
 * ditandai TIDAK_TERCATAT dan mahasiswa melengkapinya dengan membaca sumbernya.
 */
const KOLOM_TABEL = ["authors_year", "title", "venue", "source_kind", "method", "results"] as const;

/**
 * Kolom yang register Tool 3 memang tidak memuatnya — SELALU ditandai
 * TIDAK_TERCATAT, tidak pernah diisi. Dua kolom ini yang paling sering diminta
 * dosen dan paling sering dikarang AI, jadi justru keduanya yang ditahan.
 */
export const KOLOM_WAJIB_MANUAL = ["method", "results"] as const;

/** Kata kunci jurnal/penerbitan: dipakai menandai jenis sumber tanpa menebak. */
const POLA_JURNAL = /jurnal|journal|vol\.?|no\.?|hlm|pp\.?|doi/i;

/**
 * Bangun satu baris tabel penelitian terdahulu dari satu sumber register.
 * Field yang kosong masuk `not_recorded_fields`, TIDAK diisi tebakan.
 */
export function barisDariSumber(s: SumberPaketLiteratur): Bab2BarisPenelitianTerdahulu {
  const { author, year } = pisahPenulisTahun(s.authorsYear);
  const nilai: Record<(typeof KOLOM_TABEL)[number], string> = {
    authors_year: (s.authorsYear || "").trim(),
    title: (s.title || "").trim(),
    venue: (s.publication || "").trim(),
    source_kind: (s.documentType || "").trim(),
    // Register tidak menyimpan metode & hasil penelitian: jangan dikira-kira.
    method: "",
    results: "",
  };

  const notRecorded = KOLOM_TABEL.filter((k) => !nilai[k]).map((k) => k);

  // "Jenis Publikasi" di register sering hanya berisi "Jurnal" — pakai
  // publication untuk memperjelas venue, tapi jangan mengarang nama jurnal.
  let venue = nilai.venue;
  if (!venue && POLA_JURNAL.test(s.publication || "")) venue = (s.publication || "").trim();

  return {
    source_id: (s.sourceId || "").replace(/[[\]]/g, "").trim(),
    authors_year: nilai.authors_year,
    author: author || "",
    year: year || "",
    title: nilai.title,
    venue,
    source_kind: nilai.source_kind,
    method: nilai.method,
    results: nilai.results,
    not_recorded_fields: notRecorded,
  };
}

/**
 * Bangun Peta Literatur (Tahap 11).
 *
 * `dipakaiDiBab1` = himpunan source_id yang sudah dirujuk paket fondasi Bab 1.
 * Dipakai HANYA untuk menandai cakupan, bukan untuk menyaring.
 */
export function bangunPetaBab2(
  register: SumberPaketLiteratur[],
  dipakaiDiBab1: Set<string> = new Set()
): Bab2MapV1 {
  const bersih = register.filter((s) => (s.sourceId || "").trim());
  const tabel = bersih.map(barisDariSumber);

  const coverage: Bab2CakupanSumber[] = tabel.map((b) => ({
    source_id: b.source_id,
    author: b.author,
    year: b.year,
    title: b.title,
    dipakai_di_bab1: dipakaiDiBab1.has(b.source_id) || dipakaiDiBab1.has(`S${b.source_id.replace(/\D/g, "")}`),
  }));

  // Berapa banyak sumber yang benar-benar bisa dipakai: minimal punya penulis
  // DAN tahun. Sumber tanpa keduanya tidak bisa disitasi sebagai teori.
  const siapSitasi = tabel.filter((b) => b.author && b.year).length;
  const tanpaPenulis = tabel
    .filter((b) => !b.author)
    .map((b) => b.source_id)
    .filter(Boolean);

  const catatan: string[] = [];
  let status: Bab2MapV1["map_status"] = "MAP_COMPLETE";
  let alasan = "";

  if (tabel.length === 0) {
    status = "MAP_BLOCKED";
    alasan = "Source Register Tool 3 tidak memuat sumber terbaca. Buka Tool 3 dan pastikan Source Register terisi.";
    catatan.push(alasan);
  } else if (siapSitasi === 0) {
    status = "MAP_BLOCKED";
    alasan = "Tidak ada sumber dengan penulis dan tahun. Bab 2 tidak bisa menyitasi teori tanpa keduanya.";
    catatan.push(alasan);
  } else if (siapSitasi < 3) {
    status = "MAP_PARTIAL";
    alasan = `Hanya ${siapSitasi} sumber siap disitasi. Bab 2 biasanya perlu minimal 3 sumber untuk menyusun landasan teori.`;
    catatan.push(alasan);
  } else {
    alasan = `${siapSitasi} dari ${tabel.length} sumber siap disitasi (punya penulis dan tahun).`;
  }

  if (tanpaPenulis.length > 0) {
    catatan.push(
      `Sumber tanpa penulis di register (tidak bisa jadi rujukan teori): ${tanpaPenulis.join(", ")}.`
    );
  }

  const kolomKosong = new Map<string, number>();
  tabel.forEach((b) =>
    b.not_recorded_fields.forEach((f) => kolomKosong.set(f, (kolomKosong.get(f) || 0) + 1))
  );
  const kolomKosongTeks = [...kolomKosong.entries()]
    .filter(([, n]) => n > 0)
    .map(([f, n]) => `${f} (${n} sumber)`)
    .join(", ");
  if (kolomKosongTeks) {
    catatan.push(
      `Kolom yang register tidak memuatnya: ${kolomKosongTeks}. Kolom ini ditandai TIDAK TERCATAT — lengkapi dengan membaca sumbernya, jangan dikira-kira.`
    );
  }

  return {
    schema_version: 1,
    map_status: status,
    status_reason: alasan,
    source_count: tabel.length,
    prior_research_table: tabel,
    source_coverage: coverage,
    // Sengaja kosong: register tidak memuat tema maupun arah temuan (D.4.1).
    theme_clusters: [],
    conflict_pairs: [],
    coverage_gaps: [],
    map_notes: catatan,
    not_recorded: [...kolomKosong.keys()],
  };
}

/** Ringkas peta jadi teks untuk ditempel ke prompt 6A. Deterministik. */
export function ringkasPetaUntukPrompt(peta: Bab2MapV1): string {
  const baris: string[] = [];
  baris.push(`Sumber terbaca: ${peta.source_count} (${peta.map_status})`);
  baris.push("");

  baris.push("TABEL PENELITIAN TERDAHULU (dari Source Register Tool 3, bukan karangan):");
  peta.prior_research_table.forEach((b, i) => {
    baris.push(
      `${i + 1}. [${b.source_id}] ${b.authors_year || "(penulis tidak tercatat)"} — ${
        b.title || "(judul tidak tercatat)"
      }${b.venue ? ` — ${b.venue}` : " — (venue tidak tercatat)"}`
    );
    if (b.not_recorded_fields.length > 0) {
      baris.push(`   TIDAK TERCATAT: ${b.not_recorded_fields.join(", ")}`);
    }
  });

  if (peta.coverage_gaps.length > 0) {
    baris.push("");
    baris.push(`CAKUPAN TIPIS: ${peta.coverage_gaps.join("; ")}`);
  }

  return baris.join("\n");
}
