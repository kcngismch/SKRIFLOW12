// Rekomendasi "fenomena mana yang sebaiknya diperiksa lebih dulu" untuk Tool 2.
//
// BATAS PERAN: ini BUKAN penentu judul/gap/novelty/teori/metode. Yang dipilih di sini
// hanya URUTAN PEMERIKSAAN — kandidat mana yang buktinya paling siap ditelusuri dulu.
// Mahasiswa tetap yang memutuskan. Alasan selalu menyebut data yang jadi dasarnya.
//
// ponytail: pemberian skor sederhana (bobot tetap, jumlah bukti/sumber/status/kualitas).
// Kalau nanti terbukti banyak keputusan yang aneh, ganti tabel bobot ini, jangan tambah modul baru.

import type { RawPhenomenonCandidate, PhenomenonStatus } from "@/types/tool";
import { getUniqueSourceCount } from "@/lib/phenomenonParser";

const BOBOT_STATUS: Record<PhenomenonStatus, number> = {
  SIAP_DIBAWA: 40,
  PERLU_DIPERIKSA: 15,
  JANGAN_DIGUNAKAN: 0,
};

const BOBOT_KUALITAS: Record<string, number> = {
  KUAT: 10,
  SEDANG: 5,
  LEMAH: 1,
};

export interface PeringkatFenomena {
  id: string;
  nama: string;
  skor: number;
  status: PhenomenonStatus;
  jumlahBukti: number;
  sumberUnik: number;
  alasan: string[];
  catatan: string[];
}

export interface RekomendasiFenomena {
  utamaId: string | null;
  utamaNama: string | null;
  peringkat: PeringkatFenomena[];
  /** Kalimat pembuka yang menyatakan ini soal urutan pemeriksaan, bukan penentuan judul. */
  pengantar: string;
  /** Langkah konkret setelah kandidat dipilih. */
  langkahBerikut: string[];
  /** Semua kandidat sama-sama tidak layak — tidak ada yang bisa direkomendasikan. */
  semuaTidakLayak: boolean;
}

function hitungSkor(c: RawPhenomenonCandidate) {
  const status = (c.effective_status || c.status) as PhenomenonStatus;
  const sumberUnik = getUniqueSourceCount(c.evidence);
  const jumlahBukti = c.evidence.length;

  let skor = BOBOT_STATUS[status] ?? 0;
  skor += (BOBOT_KUALITAS[c.quality?.relevance] ?? 0);
  skor += (BOBOT_KUALITAS[c.quality?.traceability] ?? 0);
  skor += (BOBOT_KUALITAS[c.quality?.source_independence] ?? 0);

  // Kekuatan bukti: sumber unik lebih berharga daripada tumpukan tautan dari satu situs.
  skor += Math.min(sumberUnik, 4) * 6;
  skor += Math.min(jumlahBukti, 6) * 2;

  // Jejak penelusuran lanjutan (kata kunci) menandakan kandidat siap digarap.
  if ((c.keywords_id?.length ?? 0) > 0) skor += 4;
  if ((c.keywords_en?.length ?? 0) > 0) skor += 2;

  // Urusan yang belum selesai menahan pemeriksaan berikutnya.
  skor -= Math.min(c.unresolved_items?.length ?? 0, 5) * 5;

  if (status === "JANGAN_DIGUNAKAN") skor = Math.min(skor, 0);

  return { skor, status, sumberUnik, jumlahBukti };
}

function susunAlasan(c: RawPhenomenonCandidate, status: PhenomenonStatus, sumberUnik: number, jumlahBukti: number): string[] {
  const alasan: string[] = [];

  if (status === "SIAP_DIBAWA") {
    alasan.push("Statusnya siap dibawa, artinya bukti pendukungnya sudah lengkap menurut mesin pemeriksa.");
  } else if (status === "PERLU_DIPERIKSA") {
    alasan.push("Statusnya masih perlu diperiksa, jadi ada bagian bukti yang belum tuntas.");
  } else {
    alasan.push("Statusnya jangan digunakan, jadi sebaiknya tidak dipakai untuk melanjutkan tahap berikutnya.");
  }

  if (sumberUnik >= 3) {
    alasan.push(`Buktinya datang dari ${sumberUnik} sumber berbeda, bukan satu situs yang sama.`);
  } else if (sumberUnik === 2) {
    alasan.push("Buktinya datang dari 2 sumber berbeda.");
  } else if (sumberUnik === 1) {
    alasan.push("Semua buktinya baru dari 1 sumber, jadi masih rawan.");
  } else {
    alasan.push("Belum ada bukti yang bisa ditelusuri.");
  }

  if (jumlahBukti >= 4) {
    alasan.push(`Jumlah bukti yang terkumpul banyak (${jumlahBukti} butir).`);
  }

  if (c.quality?.traceability === "LEMAH") {
    alasan.push("Keterlacakan sumbernya lemah — tautannya perlu dicek ulang dulu.");
  }

  if ((c.unresolved_items?.length ?? 0) > 0) {
    alasan.push(`Masih ada ${c.unresolved_items!.length} hal yang belum tuntas di kandidat ini.`);
  }

  return alasan;
}

export function rekomendasiFenomena(candidates: RawPhenomenonCandidate[]): RekomendasiFenomena {
  const peringkat: PeringkatFenomena[] = candidates
    .map((c) => {
      const { skor, status, sumberUnik, jumlahBukti } = hitungSkor(c);
      return {
        id: c.id,
        nama: c.name,
        skor,
        status,
        sumberUnik,
        jumlahBukti,
        alasan: susunAlasan(c, status, sumberUnik, jumlahBukti),
        catatan: [
          ...((c.unresolved_items ?? []).map((u) => `Belum tuntas: ${u}`)),
          ...(c.what_is_not_proven ? [`Yang belum terbukti: ${c.what_is_not_proven}`] : []),
        ],
      };
    })
    .sort((a, b) => b.skor - a.skor || a.id.localeCompare(b.id));

  const semuaTidakLayak = peringkat.length > 0 && peringkat.every((p) => p.status === "JANGAN_DIGUNAKAN" || p.skor <= 0);

  return {
    utamaId: peringkat[0]?.id ?? null,
    utamaNama: peringkat[0]?.nama ?? null,
    peringkat,
    pengantar:
      "Ini urutan pemeriksaan, bukan penentuan judul atau topik. Skriflow hanya menilai kesiapan buktinya; keputusan akhir tetap milikmu dan pembimbingmu.",
    langkahBerikut: [
      "Pilih kandidat teratas, lalu telusuri sendiri 1–2 tautan buktinya untuk memastikan isinya benar-benar mendukung.",
      "Catat bagian yang belum tuntas (kalau ada) sebelum lanjut ke pencarian literatur.",
      "Kalau ada 2 kandidat yang skornya berdekatan, bandingkan cakupan wilayah dan periodenya, bukan hanya jumlah bukti.",
    ],
    semuaTidakLayak,
  };
}
