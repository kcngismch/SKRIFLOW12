/**
 * Prompt Bab 2 (Addendum D) — 6A fondasi, 6B draf, 6C poles bahasa.
 *
 * Alur alat mengikuti yang terbukti dipakai mahasiswa (lihat Addendum C/D):
 *   6A -> ChatGPT      (menyusun PETA: struktur, teori, ledger klaim)
 *   6B -> NotebookLM   (menulis PROSA dari sumber yang sudah ia miliki)
 *   6C -> ChatGPT      (memperbaiki bahasa)
 *
 * Yang menulis prosa adalah NotebookLM karena ia yang memegang sumbernya
 * (alasan sama dengan 4C). 6C wajib, bukan opsional — bahasa NotebookLM kaku.
 */

import { countPromptCharacters } from "./promptAssembler";
import { BEDAH_LIMITS, NOTEBOOKLM_LIMITS, getPromptBudgetStatus } from "@/config/promptLimits";
import type { SumberPaketLiteratur } from "./bedahParser";
import {
  BAB2_DRAFT_BEGIN,
  BAB2_DRAFT_END,
  BAB2_FOUNDATION_BEGIN,
  BAB2_FOUNDATION_END,
  BAB2_POLISH_BEGIN,
  BAB2_POLISH_END,
  BAB2_TARGET_WORDS,
  BAB2_WORD_RANGE,
  strukturBakuBab2,
} from "./bab2Parser";
import type { Bab2MapV1, Bab2Pendekatan } from "@/types/bab2";
import type { Bab1FoundationV1 } from "@/types/tool";

export interface Bab2PromptInput {
  prodi: string;
  areaEksplorasi: string;
  /** Pendekatan dari Tool 1. WAJIB — jangan ditebak. */
  pendekatan: Bab2Pendekatan;
  peta: Bab2MapV1;
  register: SumberPaketLiteratur[];
  foundation?: Bab1FoundationV1 | null;
  /** Arah penelitian yang sudah dipilih di Tool 4. */
  arahPenelitian?: string;
  rumusanMasalah?: string[];
  styleNote?: string;
}

/** Nama pendekatan versi manusia. */
export function labelPendekatan(p: Bab2Pendekatan): string {
  switch (p) {
    case "VERIFIKATIF":
      return "Kuantitatif / verifikatif (menguji hipotesis)";
    case "DESKRIPTIF":
      return "Kualitatif / deskriptif / eksploratif (tanpa hipotesis)";
    case "KAJIAN_LITERATUR":
      return "Kajian literatur / normatif (kerangka analisis, tanpa hipotesis)";
    default:
      return "Belum dipilih";
  }
}

/** Daftar sumber untuk prompt, termasuk nama penulis dari register. */
function daftarSumber(peta: Bab2MapV1): string {
  return peta.prior_research_table
    .map((b) => {
      const bagian = [
        `[${b.source_id}]`,
        b.authors_year || "(penulis tidak tercatat)",
        b.title || "(judul tidak tercatat)",
        b.venue ? `— ${b.venue}` : "",
      ].filter(Boolean);
      const catatan = b.not_recorded_fields.length
        ? `\n     TIDAK TERCATAT DI REGISTER: ${b.not_recorded_fields.join(", ")}`
        : "";
      return `- ${bagian.join(" ")}${catatan}`;
    })
    .join("\n");
}

// =========================================================================
// 6A — FONDASI BAB 2 (ChatGPT/Gemini)
// =========================================================================

export function assembleBab2FoundationPrompt(input: Bab2PromptInput): string {
  const prodi = (input.prodi || "").trim() || "Belum diketahui";
  const area = (input.areaEksplorasi || "").trim() || "Belum diketahui";
  const struktur = strukturBakuBab2(input.pendekatan);
  const target = BAB2_TARGET_WORDS;

  return `# PERAN

Kamu membantu mahasiswa S1 menyusun FONDASI BAB 2 (Tinjauan Pustaka) dari sumber yang SUDAH ia miliki.
Fondasi ini berupa PETA, bukan prosa. Kamu TIDAK menulis teks Bab 2 di sini.

# KONTEKS MAHASISWA

Program Studi: ${prodi}
Area eksplorasi: ${area}
Pendekatan penelitian: ${labelPendekatan(input.pendekatan)}
${input.arahPenelitian ? `Arah penelitian terpilih: ${input.arahPenelitian}` : ""}
${input.rumusanMasalah?.length ? `Rumusan masalah:\n${input.rumusanMasalah.map((r) => `- ${r}`).join("\n")}` : ""}

# SUMBER YANG BOLEH DIPAKAI

Ini SATU-SATUNYA daftar sumber yang sah. Sumber di luar daftar ini DILARANG dipakai.

${daftarSumber(input.peta)}

# LARANGAN MUTLAK

1. DILARANG memakai sumber di luar daftar di atas. Bila kamu merasa butuh sumber lain, taruh di
   "candidate_new_sources" — JANGAN pakai untuk menyusun teori.
2. DILARANG menulis atribusi tanpa nama: "menurut para ahli", "sebuah penelitian menunjukkan",
   "penelitian terdahulu membuktikan". Selalu sebut nama penulis dan tahun dari daftar.
3. DILARANG menulis gap sintetis: "belum ada penelitian tentang ...", "masih sedikit penelitian".
   Klaim ketiadaan bukti bukan bukti ketiadaan.
4. DILARANG menyatakan hasil penelitian sebagai kesimpulan penelitian mahasiswa sendiri.
   Bab 2 menyiapkan alat, bukan menyimpulkan. Itu pekerjaan Bab 4.
5. DILARANG menyalin kalimat sumber apa adanya. Semua definisi dan teori wajib diparafrase,
   dan tetap menyebut sumbernya.
6. DILARANG mengisi kolom yang bertanda "TIDAK TERCATAT DI REGISTER" dengan tebakan.
   Biarkan kosong — mahasiswa yang melengkapinya dengan membaca sumbernya.
${struktur.includes("Hipotesis") ? "" : `7. DILARANG membuat hipotesis. Pendekatan ${labelPendekatan(input.pendekatan)} tidak menguji hipotesis.`}

# YANG HARUS KAMU KERJAKAN

1. Kelompokkan sumber di atas menjadi TEMA (2–4 tema). Satu tema = kumpulan sumber yang
   membahas hal serupa. Kalau kamu tidak yakin satu sumber masuk tema mana, tulis alasannya.
2. Susun "structure_blueprint": daftar sub-bab Bab 2 sesuai pendekatan mahasiswa.
   Sub-bab yang WAJIB ada untuk pendekatan ini: ${struktur.length ? struktur.join(" → ") : "(belum ditentukan)"}
   Total target ${target} kata, dibagi ke seluruh sub-bab.
3. Susun "theory_map": setiap konsep/teori yang akan dipakai, definisi RINGKAS dengan kata-katamu
   sendiri, dan source_ids yang menopangnya.
4. Susun "claim_ledger": setiap pernyataan yang akan masuk Bab 2, dengan claim_id, tipe klaim,
   sumber, dan status. Tipe yang diizinkan: THEORY_CLAIM, PRIOR_FINDING_CLAIM, COMPARISON_CLAIM,
   CONTEXT_CLAIM, DERIVED_CLAIM.
5. Catat hasil penelitian yang BERTENTANGAN antar-sumber ke COMPARISON_CLAIM. Perbedaan hasil
   wajib ditampilkan, bukan dihaluskan.
6. Isi "prohibited_claims" dan "not_safe_to_say": hal yang tidak boleh dinyatakan dari bukti ini.
7. Isi "conceptual_framework" sebagai KANDIDAT (status CANDIDATE_ONLY, researcher_decision "pending").
${struktur.includes("Hipotesis") ? `8. Isi "hypothesis_candidates" sebagai KANDIDAT (status CANDIDATE_ONLY, researcher_decision "pending").` : `8. "hypothesis_candidates" WAJIB berisi array kosong [].`}

# FORMAT KELUARAN

Balas HANYA satu blok JSON di antara penanda berikut, tanpa teks lain di luar penanda:

${BAB2_FOUNDATION_BEGIN}
{
  "schema_version": 1,
  "foundation_status": "BAB2_READY",
  "status_reason": "alasan singkat status ini",
  "pendekatan": "${input.pendekatan}",
  "pendekatan_sumber": "dari mana pendekatan ini diketahui",
  "structure_blueprint": [
    {
      "order": 1,
      "sub_bab": "${struktur[0] || "Landasan Teori"}",
      "function": "fungsi sub-bab ini dalam argumen Bab 2",
      "target_word_range": [400, 600],
      "source_ids": ["S1", "S2"],
      "claim_ids": ["CLM-B2-01"]
    }
  ],
  "theory_map": [
    {
      "konstruk": "nama konsep",
      "definisi_ringkas": "definisi dengan kata-katamu sendiri, bukan salinan",
      "source_ids": ["S1"],
      "status_klaim": "READY_TO_DRAFT"
    }
  ],
  "claim_ledger": [
    {
      "claim_id": "CLM-B2-01",
      "claim_text": "pernyataan yang akan ditulis di Bab 2",
      "claim_type": "THEORY_CLAIM",
      "source_ids": ["S1"],
      "status": "READY_TO_DRAFT"
    }
  ],
  "prohibited_claims": ["klaim yang dilarang muncul dalam bentuk apa pun"],
  "not_safe_to_say": ["kalimat yang tidak boleh disimpulkan dari bukti ini"],
  "unresolved_notes": ["keterbatasan yang wajib disebut di naskah"],
  "candidate_new_sources": [],
  "conceptual_framework": {
    "konstruk": ["variabel/konsep yang dihubungkan"],
    "hubungan": "bagaimana konstruk ini berhubungan menurut literatur",
    "status": "CANDIDATE_ONLY",
    "researcher_decision": "pending"
  },
  "hypothesis_candidates": ${struktur.includes("Hipotesis") ? `[{ "pernyataan": "...", "arah": "...", "status": "CANDIDATE_ONLY", "researcher_decision": "pending" }]` : "[]"},
  "target_words_total": ${target}
}
${BAB2_FOUNDATION_END}

Status yang diizinkan: READY_TO_DRAFT (siap ditulis), NEEDS_VERIFICATION (perlu dicek dulu),
DO_NOT_USE (jangan dipakai). Kalau sumbernya tidak cukup untuk satu bagian, tandai
NEEDS_VERIFICATION dan tulis alasannya di status_reason — JANGAN diisi dengan tebakan.

Untuk "foundation_status", pilih salah satu:
  BAB2_READY            — seluruh sub-bab bisa disusun dari sumber yang ada
  BAB2_NEEDS_VERIFICATION — sebagian sub-bab sumbernya minim, tetapi masih bisa ditulis
                          dengan pembingkaian hati-hati
  BAB2_BLOCKED          — ada sub-bab yang sama sekali tidak bisa disusun dari sumber yang
                          ada (tidak ada sumber berpenulis+tahun untuk konsep intinya).
                          Pakai ini HANYA bila draf Bab 2 tidak layak ditulis; tulis di
                          status_reason sub-bab mana dan sumber seperti apa yang kurang.`;
}

// =========================================================================
// 6B — DRAF BAB 2 (NotebookLM: berkas sumber + perintah pendek)
// =========================================================================

/**
 * Berkas sumber untuk diunggah ke NotebookLM.
 *
 * Sama seperti 4C: SELURUH aturan jadi berkas, kolom chat hanya perintah pendek,
 * karena batas chat box NotebookLM ~3.900 karakter.
 */
export function assembleBab2DraftSourceFile(input: Bab2PromptInput): string {
  const prodi = (input.prodi || "").trim() || "Belum diketahui";
  const jumlah = (input.peta.prior_research_table || []).length;

  return `# Berkas Sumber Skriflow — Tahap 6B: Menulis Draf Bab 2 (Tinjauan Pustaka)

Program Studi: ${prodi}
Jumlah sumber yang boleh dipakai: ${jumlah}

PENTING — cara membaca berkas ini:
Berkas ini adalah ATURAN PENULISAN, bukan sumber penelitian dan bukan bahan bacaan.
Sumber penelitian (artikel jurnal, data) adalah dokumen LAIN yang sudah ada di notebook ini.
Pakai berkas ini sebagai aturan kerja saat menulis draf.

==============================================================================
ISI INSTRUKSI LENGKAP
==============================================================================

${assembleBab2DraftFullPrompt(input, { ringkasSumber: true })}
`;
}

/** Instruksi lengkap 6B (dipakai di dalam berkas sumber). */
function assembleBab2DraftFullPrompt(input: Bab2PromptInput, opts: { ringkasSumber: boolean }): string {
  const prodi = (input.prodi || "").trim() || "Belum diketahui";
  const peta = input.peta;
  const struktur = strukturBakuBab2(input.pendekatan);
  const target = BAB2_TARGET_WORDS;
  const bolehHipotesis = struktur.includes("Hipotesis");

  return `# PERAN

Kamu menulis LATAR/TINJAUAN PUSTAKA BAB 2 untuk skripsi mahasiswa S1 ${prodi}.

CAMBAH: Kamu BUKAN peneliti dan BUKAN penulis bebas. Kamu hanya merangkai pernyataan
tentang literatur yang SUDAH ada di daftar sumber di bawah. Kamu tidak menambah temuan,
tidak menambah sumber, dan tidak menyimpulkan hasil penelitian siapa pun.

# SUMBER YANG BOLEH DIPAKAI

Ini SATU-SATUNYA sumber yang sah. Kamu sudah memilikinya di notebook ini.

${daftarSumber(peta)}

Tanda "TIDAK TERCATAT DI REGISTER" berarti informasi itu memang tidak ada. Kalau kamu butuh
info tersebut, tulis "TIDAK TERCATAT" di naskah — JANGAN dikira-kira, JANGAN dicari dari ingatanmu.

# ATURAN MENULIS — WAJIB DIPATUHI

1. SETIAP pernyataan faktual wajib bersumber pada salah satu sumber di daftar. Sebutkan
   nama penulis dan tahun: "(Mishra, 2017)" atau "Menurut Mishra (2017)".
   DILARANG menulis "menurut para ahli", "sebuah penelitian menunjukkan", "penelitian terdahulu membuktikan".
2. DILARANG memakai sumber di luar daftar. Kalau kamu merasa perlu sumber lain, JANGAN pakai —
   catat di "new_sources_introduced" supaya mahasiswa bisa memverifikasinya lebih dulu.
3. DILARANG menyalin kalimat sumber apa adanya. Tulis ulang dengan kata-katamu sendiri,
   dan tetap sebut sumbernya.
4. DILARANG menulis gap sintetis: "belum ada penelitian tentang ...", "masih sedikit penelitian
   yang membahas ...", "tidak ada penelitian yang meneliti ...". Kamu tidak punya dasar untuk
   menyatakan itu.
5. DILARANG menyimpulkan hasil penelitian mahasiswa. Bab 2 menyiapkan alat analisis.
   Kalimat "dapat disimpulkan", "hasil penelitian ini menunjukkan", "hipotesis terbukti" TIDAK BOLEH ada.
6. Hasil penelitian yang BERTENTANGAN antar-sumber WAJIB ditampilkan. Jangan menghaluskan
   dengan "semua penelitian sepakat". Tulis siapa menemukan apa, dan sebutkan kalau desain
   atau konteks penelitiannya berbeda.
7. DILARANG memakai kata absolut: "membuktikan bahwa", "selalu", "pasti", "seluruh penelitian",
   "satu-satunya faktor".
8. Klaim sebab-akibat hanya sah bila sumbermu memang menguji sebab-akibat. Untuk hubungan
   asosiatif, tulis "berhubungan dengan", bukan "menyebabkan".
9. Kerangka pemikiran adalah USULAN mahasiswa, bukan temuan. Tulis sebagai "kerangka yang
   diajukan dalam penelitian ini", JANGAN sebagai hal yang sudah terbukti.
${bolehHipotesis ? "" : `10. DILARANG menulis hipotesis. Pendekatan penelitian ini ${labelPendekatan(input.pendekatan)} — tidak memakai hipotesis.`}

# PENDEKATAN PENELITIAN

${labelPendekatan(input.pendekatan)}

Sub-bab yang harus ada (jangan mengubah urutan):
${struktur.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${bolehHipotesis ? "" : "\nTidak ada sub-bab Hipotesis. Jangan menambahkannya."}

# PANJANG

Total ${BAB2_WORD_RANGE[0]}–${BAB2_WORD_RANGE[1]} kata (target kerja ${target} kata).
Bahasa Indonesia akademik tingkat mahasiswa S1: jelas, tidak berbelit, tidak terlalu kaku.

# FORMAT KELUARAN

Balas HANYA satu blok JSON di antara penanda berikut, tanpa teks lain di luar penanda:

${BAB2_DRAFT_BEGIN}
{
  "schema_version": 1,
  "draft_status": "DRAFT_COMPLETE",
  "foundation_status_ref": "${input.foundation?.foundation_status || "BAB2_READY"}",
  "word_count_total": 0,
  "target_words_total": ${target},
  "background": [
    {
      "order": 1,
      "sub_bab": "${struktur[0] || "Landasan Teori"}",
      "function": "fungsi sub-bab ini",
      "paragraph_text": "teks jadi sub-bab ini, multi-paragraf dipisah baris kosong",
      "claim_ids": ["CLM-B2-01"]
    }
  ],
  "skipped_sections": [],
  "used_claim_ids": ["CLM-B2-01"],
  "used_source_ids": ["S1"],
  "avoided_claims": [],
  "new_sources_introduced": [],
  "consistency_notes": [],
  "unresolved_notes": []
}
${BAB2_DRAFT_END}

"new_sources_introduced" WAJIB array kosong []. Kalau tidak kosong, draf dianggap melanggar
batas bukti dan harus diulang.`;
}

/** Perintah pendek untuk kolom chat NotebookLM. */
export function assembleBab2DraftShortCommand(input: Bab2PromptInput): string {
  const struktur = strukturBakuBab2(input.pendekatan);
  const jumlah = struktur.length || (input.peta.prior_research_table || []).length;

  return `Kerjakan Tahap 6B memakai BERKAS SUMBER berjudul "Berkas Sumber Skriflow — Tahap 6B" yang sudah kuunggah di notebook ini.

Tulis DRAF BAB 2 (Tinjauan Pustaka) dengan mengikuti SELURUH aturan di berkas sumber itu: peran, daftar sumber, aturan menulis, pendekatan penelitian, dan format keluaran.

Wajib dipatuhi:
1. Setiap pernyataan faktual wajib menyebut nama penulis dan tahun dari daftar sumber. Dilarang "menurut para ahli" atau "sebuah penelitian menunjukkan".
2. Dilarang memakai sumber di luar daftar. Kalau perlu sumber lain, catat di new_sources_introduced, jangan dipakai.
3. Dilarang menyalin kalimat sumber apa adanya.
4. Dilarang menulis "belum ada penelitian", "masih sedikit penelitian", "dapat disimpulkan", atau "hasil penelitian ini menunjukkan".
5. Tampilkan hasil yang bertentangan antar-sumber, jangan dihaluskan.
6. Susun ${jumlah} sub-bab sesuai urutan di berkas sumber, total ${BAB2_WORD_RANGE[0]}–${BAB2_WORD_RANGE[1]} kata (target ${BAB2_TARGET_WORDS}).
7. Balas HANYA satu blok JSON di antara penanda ${BAB2_DRAFT_BEGIN} dan ${BAB2_DRAFT_END}, dengan struktur field persis seperti di berkas sumber.`;
}

/** Metrik perintah pendek 6B untuk panel anggaran karakter. */
export function analyzeBab2DraftShortCommand(input: Bab2PromptInput) {
  const perintah = assembleBab2DraftShortCommand(input);
  const finalLength = countPromptCharacters(perintah);
  return {
    promptId: "bab2-draft-short-command-6b",
    finalLength,
    safeTarget: NOTEBOOKLM_LIMITS.safeTarget,
    hardLimit: NOTEBOOKLM_LIMITS.hardLimit,
    status: getPromptBudgetStatus(finalLength),
  };
}

/** Metrik prompt 6A. */
export function analyzeBab2FoundationPrompt(input: Bab2PromptInput) {
  const finalLength = countPromptCharacters(assembleBab2FoundationPrompt(input));
  return {
    promptId: "bab2-foundation-6a",
    finalLength,
    safeTarget: BEDAH_LIMITS.safeTarget,
    hardLimit: BEDAH_LIMITS.hardLimit,
    status: finalLength <= BEDAH_LIMITS.safeTarget ? "SAFE" : finalLength <= BEDAH_LIMITS.hardLimit ? "WARNING" : "BLOCKED",
  };
}

// =========================================================================
// 6C — POLES BAHASA (ChatGPT)
// =========================================================================

export interface Bab2PolishInput {
  prodi: string;
  areaEksplorasi: string;
  draft: import("@/types/bab2").Bab2DraftV1;
  foundation: import("@/types/bab2").Bab2FoundationV1;
  styleNote?: string;
}

/**
 * Prompt 6C memakai aturan Addendum C: HANYA bahasa yang boleh berubah.
 * Klaim, angka, sitasi, claim_ids, urutan/fungsi/jumlah sub-bab dikunci.
 */
export function assembleBab2PolishPrompt(input: Bab2PolishInput): string {
  const d = input.draft;
  const target = d.target_words_total || BAB2_TARGET_WORDS;

  const subBab = (d.background || [])
    .map((p, i) => {
      const ids = (p.claim_ids || []).join(", ");
      return `### Sub-bab ${p.order}: ${p.sub_bab}${i === 0 ? " (contoh gaya yang diinginkan)" : ""}
[claim_ids terkunci: ${ids || "tidak ada"}]
${p.paragraph_text}`;
    })
    .join("\n\n");

  return `# PERAN

Kamu editor bahasa. Tugasmu HANYA memperbaiki bahasa draf Bab 2 (Tinjauan Pustaka) agar enak
dibaca mahasiswa S1 tanpa kehilangan sifat akademiknya.

Kamu BUKAN penulis ulang. Kamu TIDAK menambah, mengurangi, atau mengubah isi.

# YANG BOLEH KAMU UBAH

- Kalimat yang berbelit jadi lebih langsung.
- Kata yang terlalu kaku jadi bahasa akademik mahasiswa S1 yang wajar.
- Paragraf yang terlalu panjang dipecah supaya enak dibaca.
- Perbaiki ejaan, tanda baca, dan kalimat tidak efektif.

# YANG DILARANG KAMU UBAH — INI MENGIKAT

1. DILARANG menambah klaim, angka, data, atau fakta baru dalam bentuk apa pun.
2. DILARANG menghapus klaim yang sudah ada.
3. DILARANG mengubah atau menambah sitasi. Nama penulis dan tahun harus PERSIS sama.
4. DILARANG mengubah "claim_ids" pada setiap sub-bab.
5. DILARANG mengubah nama sub-bab, urutan, fungsi, atau jumlah sub-bab.
6. DILARANG menambah hipotesis.
7. DILARANG memakai kata absolut ("membuktikan bahwa", "selalu", "pasti") atau frasa kausal
   ("menyebabkan", "berdampak terhadap") yang tidak ada di draf asli.
8. DILARANG menghaluskan perbedaan hasil antar-penelitian yang sudah ditulis di draf.

# KONTEKS

Program Studi: ${input.prodi || "Belum diketahui"}
Area eksplorasi: ${input.areaEksplorasi || "Belum diketahui"}
${input.styleNote ? `Catatan gaya dari mahasiswa: ${input.styleNote}` : ""}

# DRAF BAB 2 YANG HARUS DIPOLES

${subBab}

# PANJANG

Jaga total ${BAB2_WORD_RANGE[0]}–${BAB2_WORD_RANGE[1]} kata (target ${target}). Jangan memangkas
isi sampai di bawah batas; kalau perlu, rapikan tanpa mengurangi jumlah klaim.

# FORMAT KELUARAN

Balas HANYA satu blok JSON di antara penanda berikut:

${BAB2_POLISH_BEGIN}
{
  "schema_version": 1,
  "polish_status": "POLISH_COMPLETE",
  "word_count_total": 0,
  "background": [
    {
      "order": 1,
      "sub_bab": "${d.background?.[0]?.sub_bab || "Landasan Teori"}",
      "function": "${d.background?.[0]?.function || ""}",
      "paragraph_text": "teks hasil poles",
      "claim_ids": ${JSON.stringify(d.background?.[0]?.claim_ids || [])}
    }
  ],
  "claim_ids_unchanged": true,
  "language_notes": ["perubahan bahasa yang kamu lakukan, satu per baris"],
  "changed_sections": ["nama sub-bab yang bahasanya kamu ubah"],
  "unresolved_notes": []
}
${BAB2_POLISH_END}

"claim_ids_unchanged" wajib bernilai true. Kalau menurutmu ada klaim yang harus berubah,
JANGAN ubah — tulis di "language_notes" supaya mahasiswa memutuskannya sendiri.`;
}

/** Metrik prompt 6C. */
export function analyzeBab2PolishPrompt(input: Bab2PolishInput) {
  const finalLength = countPromptCharacters(assembleBab2PolishPrompt(input));
  return {
    promptId: "bab2-polish-6c",
    finalLength,
    safeTarget: BEDAH_LIMITS.safeTarget,
    hardLimit: BEDAH_LIMITS.hardLimit,
    status: finalLength <= BEDAH_LIMITS.safeTarget ? "SAFE" : finalLength <= BEDAH_LIMITS.hardLimit ? "WARNING" : "BLOCKED",
  };
}
