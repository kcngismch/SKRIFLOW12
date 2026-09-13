/**
 * Jalur masuk untuk mahasiswa yang SUDAH punya bahan.
 *
 * Alasan modul ini ada: jalur Tool 4 -> Tool 5 mengharuskan paket fondasi lengkap.
 * Mahasiswa yang sudah menulis sebagian Bab 1 (atau punya outline dari dosen)
 * mentok total — nol kolom isian. Modul ini membuka pintu itu TANPA melonggarkan
 * aturan inti: tiap kalimat tetap harus bisa ditelusuri ke register sumber.
 *
 * ponytail: pemecah paragraf deterministik (baris kosong), bukan AI. Cukup untuk
 * draf yang ditulis manusia. Ganti dengan pemecah berbasis model kalau ternyata
 * mahasiswa menempel draf satu blok tanpa baris kosong.
 */
import { hitungKata } from "./bedahParser";

export type StatusKalimat = "PUNYA_SITASI" | "TANPA_SITASI" | "SUMBER_TIDAK_DIKENAL";

export interface SumberRegister {
  sourceId: string;
  authorsYear: string;
}

export interface KalimatDiperiksa {
  paragraf: number;
  teks: string;
  sitasiDitemukan: string[];
  status: StatusKalimat;
  catatan: string;
}

export interface HasilPeriksaTempel {
  jumlahParagraf: number;
  jumlahKalimat: number;
  totalKata: number;
  kalimat: KalimatDiperiksa[];
  ringkas: {
    punyaSitasi: number;
    tanpaSitasi: number;
    sumberTidakDikenal: number;
    paragrafTanpaSitasi: number;
    daftarSitasiAsing: string[];
  };
  layakLanjut: boolean;
  pesanPenghadang: string[];
}

/** Bentuk sitasi yang dikenali: (Nama, 2023), (Nama 2023), (Nama & Lain, 2023). */
const POLA_SITASI = /\(([^()]{2,90}?)(\d{4}[a-z]?)\)/g;

function normalkan(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\s*\|\s*/g, " ")      // "Nama | 2023" dari tabel
    .replace(/[,;]\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&]/g, "")
    .trim();
}

/**
 * Pisahkan teks tempel-langsung menjadi paragraf lalu kalimat.
 * Baris kosong = batas paragraf; titik/tanya/seru = batas kalimat.
 */
export function pecahTeksTempel(teks: string): string[][] {
  const paragraf = (teks || "")
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter((p) => p.length > 0);
  return paragraf.map((p) =>
    (p.match(/[^.!?]+[.!?]*/g) || [p]).map((k) => k.trim()).filter((k) => k.length > 2)
  );
}

/**
 * Periksa draf/outline yang ditempel mahasiswa terhadap register sumber Tool 3.
 * Tidak menghapus apa pun dan tidak menyatakan draf "beres" — hanya menandai.
 */
export function periksaTempelan(
  teks: string,
  register: SumberRegister[]
): HasilPeriksaTempel {
  // Daftar nama-tahun yang sah. Register menulis "Nama (2023)"; draf menyitasi
  // "(Nama, 2023)". Bentuknya diseragamkan dulu supaya tidak jadi alarm palsu.
  const sah = new Set<string>();
  const sahKata = new Set<string>();
  register.forEach((s) => {
    const ay = (s.authorsYear || "").replace(/\s*\((\d{4}[a-z]?)\)\s*$/, ", $1").trim();
    if (!ay) return;
    sah.add(normalkan(ay));
    // nama keluarga pertama saja, untuk mencocokkan sitasi yang disingkat
    const kata = normalkan(ay).replace(/\b\d{4}[a-z]?\b/g, "").trim().split(" ").filter((k) => k.length > 3);
    if (kata[0]) sahKata.add(kata[0]);
  });

  const paragraf = pecahTeksTempel(teks);
  const kalimat: KalimatDiperiksa[] = [];
  let totalKata = 0;

  paragraf.forEach((kal, iPar) => {
    kal.forEach((k) => {
      totalKata += hitungKata(k);
      const sitasi: string[] = [];
      let m: RegExpExecArray | null;
      const re = new RegExp(POLA_SITASI.source, "g");
      while ((m = re.exec(k)) !== null) sitasi.push(m[0]);

      let status: StatusKalimat;
      let catatan: string;
      if (sitasi.length === 0) {
        status = "TANPA_SITASI";
        catatan =
          "Kalimat ini belum menunjuk sumber mana pun. Kalau isinya klaim dari studi lain, tambahkan sitasinya. Kalau ini kalimat penghubung atau kalimat kamu sendiri, tandai sebagai klaim penulis.";
      } else if (sitasi.some((s) => cocok(s, sah, sahKata))) {
        status = "PUNYA_SITASI";
        catatan = "Sitasi cocok dengan register sumber Tool 3.";
      } else {
        status = "SUMBER_TIDAK_DIKENAL";
        catatan =
          "Sitasi ini tidak ada di register Tool 3. Tambahkan sumbernya di Tool 3, atau perbaiki penulisan nama/tahunnya.";
      }
      kalimat.push({
        paragraf: iPar + 1,
        teks: k.length > 220 ? k.slice(0, 217) + "..." : k,
        sitasiDitemukan: sitasi,
        status,
        catatan,
      });
    });
  });

  // Hitungan sitasi asing dihitung PER SITASI, bukan per kalimat: satu kalimat
  // bisa memuat dua sitasi dan itu harus terbaca dua, bukan satu.
  const sitasiAsing: string[] = [];
  kalimat.forEach((k) => {
    if (k.status !== "SUMBER_TIDAK_DIKENAL") return;
    const re2 = new RegExp(POLA_SITASI.source, "g");
    let m2: RegExpExecArray | null;
    while ((m2 = re2.exec(k.teks)) !== null) {
      if (!cocok(m2[0], sah, sahKata)) sitasiAsing.push(m2[0]);
    }
  });

  const ringkas = {
    punyaSitasi: kalimat.filter((k) => k.status === "PUNYA_SITASI").length,
    tanpaSitasi: kalimat.filter((k) => k.status === "TANPA_SITASI").length,
    sumberTidakDikenal: sitasiAsing.length,
    paragrafTanpaSitasi: paragraf.filter((_, i) =>
      kalimat.filter((k) => k.paragraf === i + 1).every((k) => k.status !== "PUNYA_SITASI")
    ).length,
    daftarSitasiAsing: Array.from(new Set(sitasiAsing)),
  };

  // Draf dianggap bisa diteruskan bila tidak ada sitasi asing. Kalimat tanpa
  // sitasi TIDAK menghadang — itu bisa kalimat penghubung milik mahasiswa sendiri,
  // dan menghadangnya justru memaksa mahasiswa mengarang sitasi supaya lolos.
  const pesanPenghadang: string[] = [];
  if (register.length === 0) {
    pesanPenghadang.push(
      "Belum ada sumber di register Tool 3. Tanpa daftar sumber, tidak ada yang bisa dicocokkan — isi Tool 3 dulu, atau tambahkan sumbermu di sana."
    );
  }
  if (ringkas.sumberTidakDikenal > 0) {
    pesanPenghadang.push(
      `${ringkas.sumberTidakDikenal} sitasi tidak ada di register Tool 3: ${ringkas.daftarSitasiAsing.join(", ")}. Periksa daftar di bawah.`
    );
  }
  if (totalKata < 300) {
    pesanPenghadang.push(
      `Bahan yang ditempel baru ${totalKata} kata. Latar belakang biasanya 1000–1300 kata — tempel bagian yang sudah ada saja tidak masalah, sisanya bisa kamu tulis setelah ini.`
    );
  }

  return {
    jumlahParagraf: paragraf.length,
    jumlahKalimat: kalimat.length,
    totalKata,
    kalimat,
    ringkas,
    layakLanjut: register.length > 0 && ringkas.sumberTidakDikenal === 0,
    pesanPenghadang,
  };
}

function cocok(sitasi: string, sah: Set<string>, sahKata: Set<string>): boolean {
  const dalam = normalkan(sitasi.replace(/[()]/g, ""));
  if (!dalam) return false;
  for (const s of sah) {
    if (s && (dalam.includes(s) || s.includes(dalam))) return true;
  }
  // cocokkan nama keluarga + tahun secara terpisah
  const tahun = dalam.match(/\b(\d{4}[a-z]?)\b/);
  if (tahun) {
    const namaKalimat = dalam.replace(/\b\d{4}[a-z]?\b/g, "").trim();
    for (const k of sahKata) {
      if (namaKalimat.includes(k)) {
        for (const s of sah) {
          if (s.includes(tahun[1]) && s.includes(k)) return true;
        }
      }
    }
  }
  return false;
}
