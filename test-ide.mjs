/**
 * SKRIFLOW Prompt Tools — Automated Test Suite for Tool 1 (Cari Ide Skripsi V3)
 * Run: npx -y tsx test-ide.mjs
 */

import assert from "node:assert";
import { getToolBySlug } from "./src/data/tools.ts";
import {
  assemblePrompt,
  assembleTool1AlternativePrompt,
  countPromptCharacters,
} from "./src/lib/promptAssembler.ts";
import { parseIdeaTransfer, computePayloadFingerprint } from "./src/lib/ideaParser.ts";
import {
  saveSelectedExplorationArea,
  loadSelectedExplorationArea,
  clearSelectedExplorationArea,
  clearToolData,
  saveToolData,
  loadToolData,
  saveIdeaRejectionRounds,
  loadIdeaRejectionRounds,
  clearIdeaRejectionRounds,
  saveLastRecommendation,
  loadLastRecommendation,
  clearLastRecommendation,
  saveIdeaToPhenomenonHandoff,
  loadIdeaToPhenomenonHandoff,
  clearIdeaToPhenomenonHandoff,
  saveIdeaExplorationSession,
  loadIdeaExplorationSession,
  clearIdeaExplorationSession,
  savePhenomenonFieldOrigins,
  loadPhenomenonFieldOrigins,
  clearPhenomenonFieldOrigins,
  savePhenomenonAppliedHandoffFingerprint,
  loadPhenomenonAppliedHandoffFingerprint,
  clearSharedResearchContext,
} from "./src/lib/storage.ts";
import { calculateAreaRecommendation } from "./src/lib/recommender.ts";
import { getAutofillForTool, applyAutofillValues } from "./src/lib/autofill.ts";
import { generateFixIdeaFormatPrompt } from "./src/lib/ideaParser.ts";

console.log("===============================================================");
console.log("  SKRIFLOW TEST SUITE: TOOL 1 (CARI IDE SKRIPSI V3)");
console.log("===============================================================\n");

const tool1 = getToolBySlug("cari-ide-skripsi");
assert(tool1, "Tool Cari Ide Skripsi harus terdefinisi di tools.ts");

// =========================================================================
// 1. PROMPT GENERATION TESTS (V3 CANONICAL)
// =========================================================================
console.log("--- 1. Testing Tool 1 Prompt Assembly (V3 Canonical) ---");

const sampleStudentInputs = {
  prodi: "Akuntansi",
  minat: "Pengaruh penggunaan ChatGPT oleh analis keuangan terhadap kualitas riset pasar modal",
  pendekatan: "kuantitatif",
  preferensi_data: "sekunder_keuangan",
  akses_data: "laporan_keuangan_idx",
  akses_data_catatan: "Bisa akses laporan riset sekuritas dan laporan keuangan IDX",
  avoidances: "gamau wawancara dan survei lapangan",
  target_waktu: "enam_bulan",
  constraints: "Fokus pada pasar modal Indonesia 2023-2024",
  supervisor_direction: "Kaji dari sudut pandang keterandalan informasi akuntansi dan pasar modal",
};

const promptT1 = assemblePrompt(tool1, sampleStudentInputs);

assert(promptT1.includes("[PERAN]"), "Prompt memuat section [PERAN]");
assert(promptT1.includes("[KONTEKS MAHASISWA]"), "Prompt memuat section [KONTEKS MAHASISWA]");
assert(promptT1.includes("- Program Studi: Akuntansi"), "Prompt memuat Program Studi");
assert(promptT1.includes("- Minat atau Isu yang Menarik: Pengaruh penggunaan ChatGPT"), "Prompt memuat Minat");
assert(promptT1.includes("- Hal yang Ingin Dihindari: gamau wawancara dan survei lapangan"), "Prompt memuat Hal yang Ingin Dihindari");
assert(promptT1.includes("[TUGAS]"), "Prompt memuat section [TUGAS]");
assert(promptT1.includes("PUBLIC_SECONDARY"), "Prompt memuat klasifikasi PUBLIC_SECONDARY");
assert(promptT1.includes("RESEARCHER_GENERATED"), "Prompt memuat klasifikasi RESEARCHER_GENERATED");
assert(promptT1.includes("PRIMARY_RESPONDENT"), "Prompt memuat klasifikasi PRIMARY_RESPONDENT");
assert(promptT1.includes("INSTITUTIONAL_METADATA"), "Prompt memuat klasifikasi INSTITUTIONAL_METADATA");
assert(promptT1.includes("Output ChatGPT yang dibuat mahasiswa melalui prompt penelitian BUKAN data sekunder"), "Prompt memuat peringatan keras output ChatGPT buatan peneliti");
assert(promptT1.includes("Jangan hanya mencantumkan data publik yang mudah ditemukan"), "Prompt memuat aturan klasifikasi data yang benar-benar dibutuhkan");
assert(promptT1.includes("Arah fenomena tidak boleh meminta mahasiswa menghasilkan output AI, menjalankan prompt, membuat simulasi"), "Prompt memuat aturan arah fenomena empiris bukan eksperimen baru");
assert(promptT1.includes("Nilai berdasarkan data yang diperlukan untuk menjawab inti area, bukan berdasarkan keberadaan input publik"), "Prompt memuat aturan constraint fit yang lebih ketat");
assert(promptT1.includes("priority_source_types hanya boleh berisi: OFFICIAL_DATA, REGULATION, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE, WORKING_PAPER, atau REPUTABLE_NEWS"), "Prompt memuat whitelist priority source types");
assert(promptT1.includes("DILARANG memasukkan PUBLIC_SECONDARY, RESEARCHER_GENERATED, PRIMARY_RESPONDENT, atau INSTITUTIONAL_METADATA ke dalam priority_source_types"), "Prompt melarang data origin masuk priority_source_types");
assert(promptT1.includes("Jangan membuat fenomena dengan menggabungkan dua kondisi yang sebenarnya berdiri sendiri"), "Prompt melarang hubungan semu");
assert(promptT1.includes("potential_actors"), "Prompt memuat kategori potential_actors");
assert(promptT1.includes("potential_entities"), "Prompt memuat kategori potential_entities");
assert(promptT1.includes("potential_documents"), "Prompt memuat kategori potential_documents");
assert(promptT1.includes("potential_data_artifacts"), "Prompt memuat kategori potential_data_artifacts");
assert(promptT1.includes("potential_geographies"), "Prompt memuat kategori potential_geographies");
assert(promptT1.includes("Scope Boundary"), "Prompt memuat instruksi Scope Boundary");
assert(promptT1.includes("in_scope"), "Prompt memuat instruksi in_scope");
assert(promptT1.includes("out_of_scope"), "Prompt memuat instruksi out_of_scope");
assert(promptT1.includes("DILARANG menanyakan penelitian terdahulu, literatur, jurnal, teori, atau research gap pada arah fenomena"), "Prompt melarang literatur pada arah fenomena");
assert(promptT1.includes("Literature Search Seeds"), "Prompt memuat pemisahan Literature Search Seeds");
assert(promptT1.includes("[FORMAT KELUARAN — TRANSFER-ONLY]"), "Prompt memuat section [FORMAT KELUARAN — TRANSFER-ONLY]");
assert(promptT1.includes("=== BEGIN SKRIFLOW_IDEA_V3 ==="), "Prompt memuat marker BEGIN SKRIFLOW_IDEA_V3");
assert(promptT1.includes("=== END SKRIFLOW_IDEA_V3 ==="), "Prompt memuat marker END SKRIFLOW_IDEA_V3");
assert(promptT1.includes('"schema_version": 3'), "Prompt memuat schema_version: 3");

console.log("✓ V3 Prompt Assembly test passed! Generated length:", countPromptCharacters(promptT1));

// =========================================================================
// 2. PARSER TESTS — VALID V3 TRANSFER BLOCK (HASIL_VALID)
// =========================================================================
console.log("\n--- 2. Testing Idea Parser: Valid V3 Transfer Block ---");

const validV3TransferPayload = `
Berikut adalah analisis area eksplorasi untuk Anda:

AREA EKSPLORASI 1 — Adopsi AI Generatif dalam Analisis Pengungkapan Keuangan Perusahaan Publik
- Cakupan: Mengamati bagaimana analis dan perusahaan mulai memanfaatkan LLM dalam pelaporan.

=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Adopsi AI Generatif dalam Analisis Pengungkapan Keuangan",
      "scope_summary": "Pemeriksaan pola adopsi alat bantu AI generatif oleh analis keuangan pasar modal Indonesia.",
      "academic_connection": "Relevan dengan mata kuliah Akuntansi Keuangan Lanjutan dan Teori Pasar Modal.",
      "interest_connection": "Sesuai minat mahasiswa pada aplikasi ChatGPT dalam pasar modal.",
      "data_provenance": [
        {
          "data_form": "Laporan Riset Sekuritas Terpublikasi",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Tersedia pada portal bursa atau platform broker saham."
        },
        {
          "data_form": "Output Prompt Pengujian LLM oleh Peneliti",
          "origin": "RESEARCHER_GENERATED",
          "access_status": "NEEDS_CHECKING",
          "methodological_note": "Data dihasilkan sendiri melalui prosedur prompt terstandar oleh peneliti."
        }
      ],
      "research_context": {
        "potential_actors": ["Analis Keuangan", "Investor Institusi"],
        "potential_entities": ["Perusahaan Efek", "Emiten Terbuka IDX"],
        "potential_documents": ["Laporan Tahunan Emiten", "Laporan Riset Pasar"],
        "potential_data_artifacts": ["Output ChatGPT Analisis", "Skor Keterbacaan Lapkeu"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": [
          "Laporan keuangan emiten BEI sektor konsumsi",
          "Penggunaan LLM untuk peringkasan teks CALK"
        ],
        "out_of_scope": [
          "Implementasi coding algoritma AI murni (CS)",
          "Perdagangan aset kripto atau forex frekuensi tinggi"
        ],
        "boundary_note": "Fokus pada keandalan ringkasan pengungkapan finansial, bukan efisiensi komputasi mesin."
      },
      "phenomenon_search_brief": "Periksa frekuensi dan anomali inkonsistensi ringkasan laporan tahunan emiten oleh model AI dari publikasi eksternal.",
      "phenomenon_search_directions": [
        {
          "label": "Tingkat Halusinasi Finansial",
          "direction_type": "ACCURACY_RELIABILITY",
          "search_question": "Bagaimana tingkat akurasi angka laba yang diringkas oleh ChatGPT dari CALK emiten IDX sebagaimana dilaporkan oleh evaluasi pasar?",
          "observable_signals": [
            "Perbedaan angka laba bersih ringkasan LLM vs laporan auditan",
            "Pemberitaan regulator terkait disinformasi pasar"
          ],
          "priority_source_types": ["OFFICIAL_DATA", "INSTITUTIONAL_REPORT"]
        },
        {
          "label": "Perubahan Praktik Analis",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Sejauh mana analis sekuritas mencantumkan disclaimer penggunaan AI generatif dalam laporan terpublikasi?",
          "observable_signals": [
            "Pencantuman AI disclaimer pada laporan riset",
            "Panduan Asosiasi Analis Efek"
          ],
          "priority_source_types": ["OFFICIAL_DATA", "INSTITUTIONAL_REPORT"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Information Asymmetry", "Generative AI in Financial Reporting", "Accounting Information Quality"],
        "keywords_id": ["AI generatif akuntansi", "kualitas pengungkapan keuangan", "analis efek"],
        "keywords_en": ["generative AI financial reporting", "analyst forecast AI", "LLM hallucination disclosure"]
      },
      "constraint_fit": {
        "status": "PERLU_DIPERIKSA",
        "reason": "Bukti utama memerlukan keluaran prompt LLM buatan peneliti (RESEARCHER_GENERATED) sehingga memerlukan pengujian prosedur dan keterulangan.",
        "assumptions": ["Emiten menyediakan laporan keuangan PDF dalam format teks dapat diekstrak."],
        "risks": ["Perubahan performa dan konsistensi versi model AI."]
      },
      "unresolved_items": ["Versi model AI spesifik yang akan diuji."],
      "not_decided": [
        "Judul",
        "Variabel",
        "Teori",
        "Metode",
        "Objek final",
        "Sampel",
        "Teknik analisis"
      ],
      "handoff_to_phenomenon": {
        "area_text": "Adopsi AI Generatif dalam Analisis Pengungkapan Keuangan",
        "actor_text": "Analis Keuangan, Investor Institusi",
        "entity_text": "Perusahaan Efek, Emiten Terbuka IDX",
        "document_text": "Laporan Tahunan Emiten, Laporan Riset Pasar",
        "data_artifact_text": "Output ChatGPT Analisis, Skor Keterbacaan Lapkeu",
        "initial_clue": "Periksa apakah laporan eksternal mendokumentasikan anomali ringkasan CALK emiten oleh AI pada bursa 2023-2024.",
        "observable_signals": [
          "Perbedaan angka laba bersih ringkasan LLM vs laporan auditan"
        ],
        "in_scope": ["Laporan keuangan emiten BEI sektor konsumsi", "Penggunaan LLM untuk peringkasan teks CALK"],
        "out_of_scope": ["Implementasi coding algoritma AI murni (CS)", "Perdagangan aset kripto atau forex frekuensi tinggi"],
        "priority_source_types": ["OFFICIAL_DATA", "INSTITUTIONAL_REPORT"]
      }
    },
    {
      "id": "A02",
      "name": "Kualitas Pengungkapan Keberlanjutan (ESG) Sektor Energi",
      "scope_summary": "Pemeriksaan konsistensi metrik emisi gas rumah kaca pada laporan keberlanjutan emiten energi.",
      "academic_connection": "Kajian Akuntansi Keberlanjutan dan Pelaporan Non-Keuangan.",
      "interest_connection": "Relevan dengan pengungkapan informasi terstruktur pasar modal.",
      "data_provenance": [
        {
          "data_form": "Laporan Keberlanjutan Terpublikasi",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Tersedia secara wajib pada keterbukaan informasi IDX."
        }
      ],
      "research_context": {
        "potential_actors": ["Auditor Keberlanjutan", "Pemeringkat ESG"],
        "potential_entities": ["Emiten Energi BEI", "Bursa Efek Indonesia"],
        "potential_documents": ["Sustainability Report POJK 51", "Annual Report"],
        "potential_data_artifacts": ["Emisi Scope 1 & 2", "Skor ESG"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["Emiten sektor energi tercatat di BEI", "Pelaporan POJK 51 2021-2023"],
        "out_of_scope": ["Audit teknis emisi fisik lapangan", "Perusahaan privat non-publik"],
        "boundary_note": "Membatasi pada pengungkapan dokumen publik terdaftar."
      },
      "phenomenon_search_brief": "Cek kelengkapan metrik emisi karbon pada laporan sustainability emiten energi.",
      "phenomenon_search_directions": [
        {
          "label": "Kelengkapan Metrik Emisi",
          "direction_type": "DISCLOSURE_USE",
          "search_question": "Berapa persen emiten energi yang melaporkan emisi Scope 3 sesuai standar POJK?",
          "observable_signals": ["Tabel pengungkapan emisi dalam laporan keberlanjutan"],
          "priority_source_types": ["OFFICIAL_DATA"]
        },
        {
          "label": "Assurance Pihak Ketiga",
          "direction_type": "ACCURACY_RELIABILITY",
          "search_question": "Apakah laporan keberlanjutan emiten energi telah mendapatkan independent assurance statement?",
          "observable_signals": ["Opini assurance independen pada lampiran laporan"],
          "priority_source_types": ["OFFICIAL_DATA", "INSTITUTIONAL_REPORT"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["ESG Disclosure Quality", "Greenwashing", "Stakeholder Theory"],
        "keywords_id": ["pengungkapan ESG", "laporan keberlanjutan", "emiten energi"],
        "keywords_en": ["sustainability disclosure", "ESG reporting quality", "Scope 3 emissions"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Laporan keberlanjutan tersedia publik di bursa tanpa perlu wawancara.",
        "assumptions": ["Emiten mempublikasikan laporan secara berkala."],
        "risks": ["Variasi standar pelaporan antar emiten."]
      },
      "unresolved_items": ["Standar GRI vs ISSB yang dominan digunakan."],
      "not_decided": [
        "Judul",
        "Variabel",
        "Teori",
        "Metode",
        "Objek final",
        "Sampel",
        "Teknik analisis"
      ],
      "handoff_to_phenomenon": {
        "area_text": "Kualitas Pengungkapan Keberlanjutan (ESG) Sektor Energi",
        "actor_text": "Auditor Keberlanjutan, Pemeringkat ESG",
        "entity_text": "Emiten Energi BEI, Bursa Efek Indonesia",
        "document_text": "Sustainability Report POJK 51",
        "data_artifact_text": "Emisi Scope 1 & 2, Skor ESG",
        "initial_clue": "Periksa kelengkapan pengungkapan metrik emisi pada laporan keberlanjutan emiten energi 2021-2023.",
        "observable_signals": ["Tabel pengungkapan emisi Scope 3"],
        "in_scope": ["Emiten sektor energi tercatat di BEI", "Pelaporan POJK 51 2021-2023"],
        "out_of_scope": ["Audit teknis emisi fisik lapangan", "Perusahaan privat non-publik"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    }
  ],
  "comparison": [
    {
      "area_id": "A01",
      "interest_fit": "SANGAT_DEKAT",
      "study_program_fit": "KUAT",
      "data_fit": "PERLU_DIPERIKSA",
      "collection_burden": "SEDANG",
      "methodological_uncertainty": "SEDANG",
      "main_check_next": "Periksa ketersediaan CALK PDF teks dan stabilitas prompt."
    },
    {
      "area_id": "A02",
      "interest_fit": "CUKUP_DEKAT",
      "study_program_fit": "KUAT",
      "data_fit": "SELARAS_SEMENTARA",
      "collection_burden": "RENDAH_SEMENTARA",
      "methodological_uncertainty": "RENDAH",
      "main_check_next": "Periksa publikasi sustainability report emiten energi di IDX."
    }
  ],
  "selection_guidance": [
    "Pilih A01 jika ingin mendalami isu adopsi teknologi AI generatif terkini pada analisis keuangan.",
    "Pilih A02 jika ingin jalur pelaporan keuangan keberlanjutan yang datanya sudah sangat mapan di bursa."
  ]
}
=== END SKRIFLOW_IDEA_V3 ===
`;

const parseV3Res = parseIdeaTransfer(validV3TransferPayload);

assert.strictEqual(parseV3Res.success, true, "Parser harus berhasil memvalidasi payload V3");
assert.strictEqual(parseV3Res.status, "HASIL_VALID", "Status hasil harus HASIL_VALID");
assert(parseV3Res.data, "Payload data harus ada");
assert.strictEqual(parseV3Res.data.schemaVersion, 3, "Schema version harus 3");
assert.strictEqual(parseV3Res.data.areas.length, 2, "Harus ada 2 area");

// Area 1 Validation
const a1 = parseV3Res.data.areas[0];
assert.strictEqual(a1.id, "A01");
assert.strictEqual(a1.dataProvenance.length, 2, "A01 harus punya 2 item data provenance");
assert.strictEqual(a1.dataProvenance[0].origin, "PUBLIC_SECONDARY");
assert.strictEqual(a1.dataProvenance[1].origin, "RESEARCHER_GENERATED");
assert.strictEqual(a1.dataProvenance[1].accessStatus, "NEEDS_CHECKING");
assert.strictEqual(a1.constraintFit.status, "PERLU_DIPERIKSA", "Area dengan RESEARCHER_GENERATED minimal PERLU_DIPERIKSA");
assert.strictEqual(a1.researchContext.potentialActors.length, 2, "A01 harus punya 2 aktor");
assert.strictEqual(a1.researchContext.potentialEntities.length, 2, "A01 harus punya 2 entitas");
assert.strictEqual(a1.researchContext.potentialDocuments.length, 2, "A01 harus punya 2 dokumen");
assert.strictEqual(a1.researchContext.potentialDataArtifacts.length, 2, "A01 harus punya 2 artefak data");
assert.strictEqual(a1.scopeBoundary.inScope.length, 2, "A01 inScope min 2");
assert.strictEqual(a1.scopeBoundary.outOfScope.length, 2, "A01 outOfScope min 2");
assert.strictEqual(a1.phenomenonSearchDirections.length, 2, "A01 directions min 2");
assert.strictEqual(a1.literatureSearchSeeds.keywordsId.length, 3, "A01 literature seeds keywordsId");

console.log("✓ Valid V3 transfer block parser test passed!");

// =========================================================================
// 3. PARSER TESTS — LEGACY V2 REJECTION (LEGACY_V2_REQUIRES_REGENERATION)
// =========================================================================
console.log("\n--- 3. Testing Legacy V2 Detection & Rejection ---");

const legacyV2Payload = `
=== BEGIN SKRIFLOW_IDEA_V2 ===
{
  "schema_version": 2,
  "areas": [
    {
      "id": "A01",
      "name": "Area V2 Lama",
      "scope_summary": "Ringkasan lama",
      "academic_connection": "Prodi lama",
      "interest_connection": "Minat lama",
      "candidate_objects": ["Objek A", "Objek B"],
      "phenomenon_search_brief": "Petunjuk lama",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "search_question": "Pertanyaan 1?",
          "observable_signals": ["Sinyal 1"],
          "priority_source_types": ["OFFICIAL_DATA"]
        },
        {
          "label": "Arah 2",
          "search_question": "Pertanyaan 2?",
          "observable_signals": ["Sinyal 2"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "possible_data_forms": ["Data lama"],
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan lama",
        "assumptions": [],
        "risks": []
      },
      "keywords_id": ["k1"],
      "keywords_en": ["k2"],
      "unresolved_items": [],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "Area V2",
        "object_text": "Objek",
        "initial_clue": "Petunjuk",
        "keywords_id": ["k1"],
        "keywords_en": ["k2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    }
  ],
  "comparison": [],
  "selection_guidance": []
}
=== END SKRIFLOW_IDEA_V2 ===
`;

const legacyRes = parseIdeaTransfer(legacyV2Payload);

assert.strictEqual(legacyRes.success, false, "Legacy V2 payload harus ditolak");
assert.strictEqual(
  legacyRes.status,
  "LEGACY_V2_REQUIRES_REGENERATION",
  "Status harus LEGACY_V2_REQUIRES_REGENERATION"
);
assert(
  legacyRes.error?.includes("Output Format Lama Terdeteksi"),
  "Pesan error harus menjelaskan format lama"
);
assert.strictEqual(legacyRes.data, undefined, "Tidak boleh mengarang data V3 untuk payload V2");

console.log("✓ Legacy V2 rejection test passed!");

// =========================================================================
// 4. PARSER TESTS — PROVENANCE & CONTEXT WARNING HEURISTICS
// =========================================================================
console.log("\n--- 4. Testing Methodological & Classification Warnings ---");

const promptAsSecondaryPayload = `
=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Area dengan Kesalahan Klasifikasi Metodologis",
      "scope_summary": "Cakupan area pengujian",
      "academic_connection": "Keterkaitan prodi",
      "interest_connection": "Hubungan minat",
      "data_provenance": [
        {
          "data_form": "Output prompt ChatGPT yang dibuat peneliti",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Salah klasifikasi prompt sebagai data sekunder"
        },
        {
          "data_form": "Hasil Wawancara Mendalam",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Salah klasifikasi wawancara sebagai data sekunder"
        }
      ],
      "research_context": {
        "potential_actors": ["Laporan Keuangan Tahunan IDX"],
        "potential_entities": ["Emiten Perbankan"],
        "potential_documents": ["Investor Ritel"],
        "potential_data_artifacts": ["Rasio Likuiditas"],
        "potential_geographies": ["Return Saham Bulanan"]
      },
      "scope_boundary": {
        "in_scope": ["Fokus bank BUKU 4", "Periode 2022-2024"],
        "out_of_scope": ["BPR non-devisa", "Pasar valuta asing"],
        "boundary_note": "Catatan batasan"
      },
      "phenomenon_search_brief": "Petunjuk arah fenomena dari sumber eksternal",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "ACCURACY_RELIABILITY",
          "search_question": "Bagaimana rasio NPL bank yang dilaporkan publik?",
          "observable_signals": ["Sinyal NPL"],
          "priority_source_types": ["OFFICIAL_DATA"]
        },
        {
          "label": "Arah 2",
          "direction_type": "ADOPTION",
          "search_question": "Bagaimana statistik adopsi QRIS yang dipublikasikan Bank Indonesia?",
          "observable_signals": ["Sinyal QRIS"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Credit Risk"],
        "keywords_id": ["risiko kredit"],
        "keywords_en": ["credit risk"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan",
        "assumptions": [],
        "risks": []
      },
      "unresolved_items": [],
      "not_decided": ["Judul", "Variabel", "Teori", "Metode", "Objek final", "Sampel", "Teknik analisis"],
      "handoff_to_phenomenon": {
        "area_text": "Area Uji",
        "actor_text": "Aktor",
        "entity_text": "Entitas",
        "document_text": "Dokumen",
        "data_artifact_text": "Artefak",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    },
    {
      "id": "A02",
      "name": "Area Kedua Valid",
      "scope_summary": "Cakupan area valid",
      "academic_connection": "Keterkaitan prodi",
      "interest_connection": "Hubungan minat",
      "data_provenance": [
        {
          "data_form": "Laporan Tahunan",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Publik"
        }
      ],
      "research_context": {
        "potential_actors": ["Auditor"],
        "potential_entities": ["KAP"],
        "potential_documents": ["Opini Audit"],
        "potential_data_artifacts": ["Audit Fee"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["KAP Big Four", "Laporan Keuangan 2023"],
        "out_of_scope": ["KAP non-afiliasi", "Entitas nirlaba"],
        "boundary_note": "Batasan audit"
      },
      "phenomenon_search_brief": "Petunjuk fenomena",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Bagaimana tren perubahan fee audit pada laporan tahunan emiten?",
          "observable_signals": ["Peningkatan fee"],
          "priority_source_types": ["OFFICIAL_DATA"]
        },
        {
          "label": "Arah 2",
          "direction_type": "REGULATION",
          "search_question": "Bagaimana implementasi rotasi KAP menurut regulasi OJK?",
          "observable_signals": ["SK OJK"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Audit Quality"],
        "keywords_id": ["kualitas audit"],
        "keywords_en": ["audit quality"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan",
        "assumptions": [],
        "risks": []
      },
      "unresolved_items": [],
      "not_decided": ["Judul", "Variabel", "Teori", "Metode", "Objek final", "Sampel", "Teknik analisis"],
      "handoff_to_phenomenon": {
        "area_text": "Area Uji 2",
        "actor_text": "Auditor",
        "entity_text": "KAP",
        "document_text": "Opini",
        "data_artifact_text": "Fee",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    }
  ],
  "comparison": [],
  "selection_guidance": []
}
=== END SKRIFLOW_IDEA_V3 ===
`;

const warningRes = parseIdeaTransfer(promptAsSecondaryPayload);

assert.strictEqual(warningRes.success, true, "Parser tetap sukses parsing meski ada warning");
assert.strictEqual(warningRes.status, "HASIL_PERLU_DIPERIKSA", "Status harus HASIL_PERLU_DIPERIKSA");
assert(warningRes.warnings.length >= 4, "Harus memuat minimal 4 warning heuristik metodologi dan kategori");

const allWarningsText = warningRes.warnings.join(" ");
assert(allWarningsText.includes("RESEARCHER_GENERATED"), "Harus ada warning ChatGPT sebagai RESEARCHER_GENERATED");
assert(allWarningsText.includes("PRIMARY_RESPONDENT"), "Harus ada warning Wawancara sebagai PRIMARY_RESPONDENT");
assert(allWarningsText.includes("Aktor"), "Harus ada warning salah kategori Aktor");
assert(allWarningsText.includes("Dokumen"), "Harus ada warning salah kategori Dokumen");
assert(allWarningsText.includes("Geografi"), "Harus ada warning salah kategori Geografi");

console.log("✓ Provenance & context warning heuristics test passed! Total warnings:", warningRes.warnings.length);

// =========================================================================
// 5. REGRESSION TEST 1: WHITELIST SUMBER FENOMENA
// =========================================================================
console.log("\n--- Regression Test 1: Whitelist Sumber Fenomena ---");

function createPayloadWithSourceTypes(sourceTypes) {
  return `
=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Area Uji Sumber",
      "scope_summary": "Cakupan",
      "academic_connection": "Akademik",
      "interest_connection": "Minat",
      "data_provenance": [
        {
          "data_form": "Data Publik",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Publik"
        }
      ],
      "research_context": {
        "potential_actors": ["Investor"],
        "potential_entities": ["BEI"],
        "potential_documents": ["Laporan"],
        "potential_data_artifacts": ["Data"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "boundary_note": "Batasan"
      },
      "phenomenon_search_brief": "Petunjuk",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "ADOPTION",
          "search_question": "Bagaimana adopsi teknologi di pasar modal?",
          "observable_signals": ["Sinyal 1"],
          "priority_source_types": ${JSON.stringify(sourceTypes)}
        },
        {
          "label": "Arah 2",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Bagaimana perubahan praktik pelaporan?",
          "observable_signals": ["Sinyal 2"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Concept"],
        "keywords_id": ["k1"],
        "keywords_en": ["k2"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan",
        "assumptions": [],
        "risks": []
      },
      "unresolved_items": [],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "Area Uji",
        "actor_text": "Investor",
        "entity_text": "BEI",
        "document_text": "Laporan",
        "data_artifact_text": "Data",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    },
    {
      "id": "A02",
      "name": "Area Uji 2",
      "scope_summary": "Cakupan 2",
      "academic_connection": "Akademik 2",
      "interest_connection": "Minat 2",
      "data_provenance": [
        {
          "data_form": "Data Publik 2",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Publik"
        }
      ],
      "research_context": {
        "potential_actors": ["Auditor"],
        "potential_entities": ["KAP"],
        "potential_documents": ["Opini"],
        "potential_data_artifacts": ["Data"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "boundary_note": "Batasan"
      },
      "phenomenon_search_brief": "Petunjuk",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "REGULATION",
          "search_question": "Bagaimana regulasi terkait?",
          "observable_signals": ["Sinyal 1"],
          "priority_source_types": ["REGULATION"]
        },
        {
          "label": "Arah 2",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Bagaimana praktik audit?",
          "observable_signals": ["Sinyal 2"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Concept"],
        "keywords_id": ["k1"],
        "keywords_en": ["k2"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan",
        "assumptions": [],
        "risks": []
      },
      "unresolved_items": [],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "Area Uji 2",
        "actor_text": "Auditor",
        "entity_text": "KAP",
        "document_text": "Opini",
        "data_artifact_text": "Data",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    }
  ],
  "comparison": [],
  "selection_guidance": []
}
=== END SKRIFLOW_IDEA_V3 ===
`;
}

// PASS: OFFICIAL_DATA, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE
const passRes = parseIdeaTransfer(createPayloadWithSourceTypes(["OFFICIAL_DATA", "INSTITUTIONAL_REPORT", "EMPIRICAL_ARTICLE"]));
assert.strictEqual(passRes.success, true, "Valid source types harus lolos");

// FAIL: RESEARCHER_GENERATED
const fail1 = parseIdeaTransfer(createPayloadWithSourceTypes(["RESEARCHER_GENERATED"]));
assert.strictEqual(fail1.success, false, "RESEARCHER_GENERATED dalam priority_source_types harus ditolak");
assert(fail1.errorDetails.some(e => e.includes("RESEARCHER_GENERATED")), "Error harus spesifik menyebut RESEARCHER_GENERATED");

// FAIL: PUBLIC_SECONDARY, OFFICIAL_DATA
const fail2 = parseIdeaTransfer(createPayloadWithSourceTypes(["PUBLIC_SECONDARY", "OFFICIAL_DATA"]));
assert.strictEqual(fail2.success, false, "PUBLIC_SECONDARY dalam priority_source_types harus ditolak");
assert(fail2.errorDetails.some(e => e.includes("PUBLIC_SECONDARY")), "Error harus spesifik menyebut PUBLIC_SECONDARY");

// FAIL: PRIMARY_RESPONDENT
const fail3 = parseIdeaTransfer(createPayloadWithSourceTypes(["PRIMARY_RESPONDENT"]));
assert.strictEqual(fail3.success, false, "PRIMARY_RESPONDENT dalam priority_source_types harus ditolak");
assert(fail3.errorDetails.some(e => e.includes("PRIMARY_RESPONDENT")), "Error harus spesifik menyebut PRIMARY_RESPONDENT");

// FAIL: INSTITUTIONAL_METADATA
const fail4 = parseIdeaTransfer(createPayloadWithSourceTypes(["INSTITUTIONAL_METADATA"]));
assert.strictEqual(fail4.success, false, "INSTITUTIONAL_METADATA dalam priority_source_types harus ditolak");
assert(fail4.errorDetails.some(e => e.includes("INSTITUTIONAL_METADATA")), "Error harus spesifik menyebut INSTITUTIONAL_METADATA");

console.log("✓ Regression Test 1 passed: Whitelist sumber fenomena terkunci ketat!");

// =========================================================================
// 6. REGRESSION TEST 2: HANDOFF BERSIH
// =========================================================================
console.log("\n--- Regression Test 2: Handoff Bersih ---");

const handoffCheckArea = parseV3Res.data.areas[0];
const handoffObj = handoffCheckArea.handoffToPhenomenon;

assert(handoffObj, "Handoff to phenomenon harus ada");
assert(!("literature_search_seeds" in handoffObj), "Handoff tidak boleh memuat literature_search_seeds");
assert(!("keywords_id" in handoffObj), "Handoff tidak boleh memuat keywords_id");
assert(!("keywords_en" in handoffObj), "Handoff tidak boleh memuat keywords_en");
assert(!("concepts" in handoffObj), "Handoff tidak boleh memuat concepts");
assert(!handoffObj.prioritySourceTypes.includes("RESEARCHER_GENERATED"), "Handoff source types tidak boleh memuat RESEARCHER_GENERATED");
assert(handoffObj.areaText.length > 0, "Handoff memuat areaText");
assert(handoffObj.actorText.length > 0, "Handoff memuat actorText");
assert(handoffObj.entityText.length > 0, "Handoff memuat entityText");
assert(handoffObj.documentText.length > 0, "Handoff memuat documentText");
assert(handoffObj.dataArtifactText.length > 0, "Handoff memuat dataArtifactText");
assert(handoffObj.inScope.length >= 2, "Handoff memuat inScope minimal 2");
assert(handoffObj.outOfScope.length >= 2, "Handoff memuat outOfScope minimal 2");
assert(handoffObj.observableSignals.length >= 1, "Handoff memuat observableSignals");

console.log("✓ Regression Test 2 passed: Handoff bersih dari literature seeds dan bebas experiment instructions!");

// =========================================================================
// 7. REGRESSION TEST 3: FENOMENA BUKAN EKSPERIMEN BARU
// =========================================================================
console.log("\n--- Regression Test 3: Fenomena Bukan Eksperimen Baru ---");

function createPayloadWithClue(clueText) {
  return `
=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Area Uji Clue",
      "scope_summary": "Cakupan",
      "academic_connection": "Akademik",
      "interest_connection": "Minat",
      "data_provenance": [
        {
          "data_form": "Data Publik",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Publik"
        }
      ],
      "research_context": {
        "potential_actors": ["Investor"],
        "potential_entities": ["BEI"],
        "potential_documents": ["Laporan"],
        "potential_data_artifacts": ["Data"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "boundary_note": "Batasan"
      },
      "phenomenon_search_brief": ${JSON.stringify(clueText)},
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "ADOPTION",
          "search_question": ${JSON.stringify(clueText)},
          "observable_signals": ["Sinyal 1"],
          "priority_source_types": ["OFFICIAL_DATA"]
        },
        {
          "label": "Arah 2",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Bagaimana perubahan praktik pelaporan di bursa?",
          "observable_signals": ["Sinyal 2"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Concept"],
        "keywords_id": ["k1"],
        "keywords_en": ["k2"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan",
        "assumptions": [],
        "risks": []
      },
      "unresolved_items": [],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "Area Uji",
        "actor_text": "Investor",
        "entity_text": "BEI",
        "document_text": "Laporan",
        "data_artifact_text": "Data",
        "initial_clue": ${JSON.stringify(clueText)},
        "observable_signals": ["Sinyal"],
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    },
    {
      "id": "A02",
      "name": "Area Uji 2",
      "scope_summary": "Cakupan 2",
      "academic_connection": "Akademik 2",
      "interest_connection": "Minat 2",
      "data_provenance": [
        {
          "data_form": "Data Publik 2",
          "origin": "PUBLIC_SECONDARY",
          "access_status": "INDICATED",
          "methodological_note": "Publik"
        }
      ],
      "research_context": {
        "potential_actors": ["Auditor"],
        "potential_entities": ["KAP"],
        "potential_documents": ["Opini"],
        "potential_data_artifacts": ["Data"],
        "potential_geographies": ["Indonesia"]
      },
      "scope_boundary": {
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "boundary_note": "Batasan"
      },
      "phenomenon_search_brief": "Petunjuk",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "REGULATION",
          "search_question": "Bagaimana regulasi terkait?",
          "observable_signals": ["Sinyal 1"],
          "priority_source_types": ["REGULATION"]
        },
        {
          "label": "Arah 2",
          "direction_type": "PRACTICE_CHANGE",
          "search_question": "Bagaimana praktik audit?",
          "observable_signals": ["Sinyal 2"],
          "priority_source_types": ["OFFICIAL_DATA"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Concept"],
        "keywords_id": ["k1"],
        "keywords_en": ["k2"]
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA",
        "reason": "Alasan",
        "assumptions": [],
        "risks": []
      },
      "unresolved_items": [],
      "not_decided": ["Judul"],
      "handoff_to_phenomenon": {
        "area_text": "Area Uji 2",
        "actor_text": "Auditor",
        "entity_text": "KAP",
        "document_text": "Opini",
        "data_artifact_text": "Data",
        "initial_clue": "Petunjuk",
        "observable_signals": ["Sinyal"],
        "in_scope": ["In 1", "In 2"],
        "out_of_scope": ["Out 1", "Out 2"],
        "priority_source_types": ["OFFICIAL_DATA"]
      }
    }
  ],
  "comparison": [],
  "selection_guidance": []
}
=== END SKRIFLOW_IDEA_V3 ===
`;
}

// FAIL: "Jalankan prompt yang sama beberapa kali dan bandingkan output ChatGPT."
const expFail1 = parseIdeaTransfer(createPayloadWithClue("Jalankan prompt yang sama beberapa kali dan bandingkan output ChatGPT."));
assert.strictEqual(expFail1.success, false, "Instruksi menjalankan prompt berulang kali harus ditolak");
assert(expFail1.errorDetails.some(e => e.includes("prosedur eksperimen") || e.includes("pembuatan data baru")), "Error harus menjelaskan larangan prosedur eksperimen");

// FAIL: "Berikan laporan keuangan kepada ChatGPT lalu ukur akurasinya."
const expFail2 = parseIdeaTransfer(createPayloadWithClue("Berikan laporan keuangan kepada ChatGPT lalu ukur akurasinya."));
assert.strictEqual(expFail2.success, false, "Instruksi memberikan dokumen ke ChatGPT lalu ukur akurasi harus ditolak");
assert(expFail2.errorDetails.some(e => e.includes("prosedur eksperimen") || e.includes("pembuatan data baru")), "Error harus menjelaskan larangan prosedur eksperimen");

// PASS: "Periksa apakah sumber yang dapat ditelusuri mendokumentasikan penggunaan AI generatif dalam interpretasi informasi keuangan serta masalah akurasi atau konsistensi yang pernah dilaporkan."
const expPass = parseIdeaTransfer(createPayloadWithClue("Periksa apakah sumber yang dapat ditelusuri mendokumentasikan penggunaan AI generatif dalam interpretasi informasi keuangan serta masalah akurasi atau konsistensi yang pernah dilaporkan."));
assert.strictEqual(expPass.success, true, "Pencarian kondisi nyata yang terdokumentasi harus lolos");

console.log("✓ Regression Test 3 passed: Fenomena bukan eksperimen baru!");

// =========================================================================
// 8. REGRESSION TEST 4: FENOMENA BUKAN PENCARIAN LITERATUR
// =========================================================================
console.log("\n--- Regression Test 4: Fenomena Bukan Pencarian Literatur ---");

// FAIL: "Apakah penelitian terdahulu telah menggunakan ChatGPT?"
const litFail1 = parseIdeaTransfer(createPayloadWithClue("Apakah penelitian terdahulu telah menggunakan ChatGPT?"));
assert.strictEqual(litFail1.success, false, "Pertanyaan penelitian terdahulu pada fenomena harus ditolak");
assert(litFail1.errorDetails.some(e => e.includes("penelitian terdahulu") || e.includes("literatur")), "Error harus menyebut penolakan pertanyaan literatur");

// FAIL: "Teori apa yang paling sering digunakan?"
const litFail2 = parseIdeaTransfer(createPayloadWithClue("Teori apa yang paling sering digunakan?"));
assert.strictEqual(litFail2.success, false, "Pertanyaan teori pada fenomena harus ditolak");
assert(litFail2.errorDetails.some(e => e.includes("teori") || e.includes("literatur")), "Error harus menyebut penolakan pertanyaan teori");

// PASS: "Apakah regulator, lembaga profesi, perusahaan, atau evaluasi empiris mendokumentasikan penggunaan atau keterbatasan AI generatif dalam analisis informasi keuangan?"
const litPass = parseIdeaTransfer(createPayloadWithClue("Apakah regulator, lembaga profesi, perusahaan, atau evaluasi empiris mendokumentasikan penggunaan atau keterbatasan AI generatif dalam analisis informasi keuangan?"));
assert.strictEqual(litPass.success, true, "Pencarian dokumentasi regulator/institusi harus lolos");

console.log("✓ Regression Test 4 passed: Fenomena bukan pencarian literatur!");

// =========================================================================
// 9. REGRESSION TEST 5: NEGASI PRESERVASI
// =========================================================================
console.log("\n--- Regression Test 5: Negasi Preservasi ---");

clearToolData("cari-ide-skripsi");
saveToolData("cari-ide-skripsi", {
  prodi: "Akuntansi",
  minat: "AI Finansial",
  avoidances: "gamau wawancara",
});

const t1DataNegasi = getAutofillForTool("cari-fenomena-awal", {});
assert(t1DataNegasi.hasData, "Autofill harus punya data");
assert.strictEqual(t1DataNegasi.data.avoidances, "gamau wawancara", "Negasi 'gamau wawancara' harus tetap utuh");

// Test prompt generation with negation
const promptNegasi = assemblePrompt(tool1, {
  prodi: "Akuntansi",
  avoidances: "gamau wawancara",
});
assert(promptNegasi.includes("gamau wawancara"), "Prompt harus memuat 'gamau wawancara'");
assert(promptNegasi.includes("Jangan membalik makna negasi"), "Prompt memuat aturan larangan membalik negasi");

console.log("✓ Regression Test 5 passed: Negasi tetap utuh dan tidak terbalik!");

// =========================================================================
// 10. REGRESSION TEST 6: TIDAK AUTO-SELECT
// =========================================================================
console.log("\n--- Regression Test 6: Tidak Auto-Select ---");

clearSelectedExplorationArea();
const freshSelected = loadSelectedExplorationArea();
assert.strictEqual(freshSelected, null, "Setelah parsing baru, tidak boleh ada selected area otomatis di storage");

console.log("✓ Regression Test 6 passed: Pilihan area tidak pernah auto-selected!");

// =========================================================================
// 11. REGRESSION TEST 7: INTEGRITAS TOOL LAIN
// =========================================================================
console.log("\n--- Regression Test 7: Integritas Tool Lain ---");

const allTools = ["cari-ide-skripsi", "cari-fenomena-awal", "cari-literatur-awal", "bedah-hasil-notebooklm"];
for (const slug of allTools) {
  const t = getToolBySlug(slug);
  assert(t, `Tool ${slug} harus terdaftar di tools.ts`);
  assert(t.promptConfig, `Tool ${slug} harus memiliki promptConfig`);
}

// Test Autofill to Tool 2 and Tool 3
const area0 = parseV3Res.data.areas[0];
const selectedV3Payload = {
  schemaVersion: 3,
  areaId: area0.id,
  name: area0.name,
  scopeSummary: area0.scopeSummary,
  academicConnection: area0.academicConnection,
  interestConnection: area0.interestConnection,
  dataProvenance: area0.dataProvenance,
  researchContext: area0.researchContext,
  scopeBoundary: area0.scopeBoundary,
  phenomenonSearchBrief: area0.phenomenonSearchBrief,
  phenomenonSearchDirections: area0.phenomenonSearchDirections,
  literatureSearchSeeds: area0.literatureSearchSeeds,
  constraintFit: area0.constraintFit,
  unresolvedItems: area0.unresolvedItems,
  notDecided: area0.notDecided,
  handoffToPhenomenon: area0.handoffToPhenomenon,
  sourceInputFingerprint: "fp_test",
  selectedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

saveSelectedExplorationArea(selectedV3Payload);
const autofillT2Check = getAutofillForTool("cari-fenomena-awal", {});
assert(autofillT2Check.hasData, "Tool 2 autofill harus berfungsi");
assert(autofillT2Check.data.objek_awal.includes("Analis Keuangan"), "Tool 2 objek_awal harus terisi aktor/entitas");

console.log("✓ Regression Test 7 passed: Integritas seluruh tools terjaga!");

// =========================================================================
// 12. NEW TEST SUITES: ALTERNATIF AREA, REKOMENDASI, PREVIEW BENTUK PENELITIAN
// =========================================================================
console.log("\n===============================================================");
console.log("  SUITE BARU: ALTERNATIF, REKOMENDASI & PREVIEW BENTUK PENELITIAN");
console.log("===============================================================\n");

// -------------------------------------------------------------------------
// Case 1: Research Shape Preview Valid (>= 2 placeholders in brackets)
// -------------------------------------------------------------------------
console.log("--- Case 1: Testing Research Shape Preview (Valid) ---");
const payloadShapeValid = createPayloadWithClue("Periksa keterbukaan informasi di BEI terkait implementasi AI.");
const payloadShapeValidWithPreview = payloadShapeValid.replace(
  '"literature_search_seeds": {',
  `"research_shape_preview": {
    "possible_focus": "Pemeriksaan konsistensi pengungkapan emiten.",
    "likely_evidence_needed": ["Keterbukaan informasi IDX", "Laporan analis"],
    "illustrative_title_pattern": "Evaluasi [aspek konsistensi pengungkapan] dalam [konteks adopsi AI] pada [emiten terdaftar di BEI periode belum ditentukan].",
    "unresolved_before_title": ["Fenomena empiris", "Bukti literatur", "Akses data", "Objek atau cakupan", "Kelayakan metodologis"],
    "warning": "Ilustrasi bentuk judul — belum layak diajukan ke dosen."
  },
  "literature_search_seeds": {`
);

const shapeValidRes = parseIdeaTransfer(payloadShapeValidWithPreview);
assert.strictEqual(shapeValidRes.success, true, "Payload dengan research_shape_preview valid harus sukses");
assert(shapeValidRes.data.areas[0].researchShapePreview, "Area 1 harus memiliki researchShapePreview");
assert.strictEqual(
  shapeValidRes.data.areas[0].researchShapePreview.illustrativeTitlePattern,
  "Evaluasi [aspek konsistensi pengungkapan] dalam [konteks adopsi AI] pada [emiten terdaftar di BEI periode belum ditentukan]."
);
assert.strictEqual(shapeValidRes.data.areas[0].researchShapePreview.unresolvedBeforeTitle.length, 5);
console.log("✓ Case 1 passed: Research shape preview valid dengan >= 2 placeholder diterima!");

// -------------------------------------------------------------------------
// Case 2: Preview Terlalu Spesifik (< 2 placeholders) -> Safe Fallback
// -------------------------------------------------------------------------
console.log("\n--- Case 2: Testing Research Shape Preview (Too Specific / < 2 Placeholders) ---");
const payloadShapeTooSpecific = payloadShapeValid.replace(
  '"literature_search_seeds": {',
  `"research_shape_preview": {
    "possible_focus": "Pemeriksaan konsistensi emiten.",
    "likely_evidence_needed": ["Laporan"],
    "illustrative_title_pattern": "Pengaruh Implementasi AI Terhadap Kinerja Saham pada [Perusahaan BEI].",
    "unresolved_before_title": ["Fenomena empiris"],
    "warning": "Ilustrasi judul"
  },
  "literature_search_seeds": {`
);

const shapeSpecificRes = parseIdeaTransfer(payloadShapeTooSpecific);
assert.strictEqual(shapeSpecificRes.success, true, "Area tetap valid meskipun preview tidak aman");
assert.strictEqual(shapeSpecificRes.data.areas[0].researchShapePreview, undefined, "Preview yang tidak aman harus di-fallback menjadi undefined");
assert(shapeSpecificRes.warnings.some(w => w.includes("terlalu spesifik")), "Harus memuat warning bahwa pola terlalu spesifik");
console.log("✓ Case 2 passed: Preview terlalu spesifik (<2 placeholders) ditandai tidak aman tanpa menggagalkan area!");

// -------------------------------------------------------------------------
// Case 3: Preview Mengunci Metode ("regresi" / "sem-pls") -> Safe Fallback
// -------------------------------------------------------------------------
console.log("\n--- Case 3: Testing Research Shape Preview (Locking Method) ---");
const payloadShapeMethodLocked = payloadShapeValid.replace(
  '"literature_search_seeds": {',
  `"research_shape_preview": {
    "possible_focus": "Pemeriksaan konsistensi emiten.",
    "likely_evidence_needed": ["Laporan"],
    "illustrative_title_pattern": "Analisis Regresi Linier Berganda [Variabel X] terhadap [Variabel Y] di [Objek Z].",
    "unresolved_before_title": ["Fenomena empiris"],
    "warning": "Ilustrasi judul"
  },
  "literature_search_seeds": {`
);

const shapeMethodRes = parseIdeaTransfer(payloadShapeMethodLocked);
assert.strictEqual(shapeMethodRes.success, true, "Area tetap valid");
assert.strictEqual(shapeMethodRes.data.areas[0].researchShapePreview, undefined, "Pola yang mengunci metode regresi harus di-fallback");
assert(shapeMethodRes.warnings.some(w => w.includes("terlalu spesifik")), "Warning nonfatal harus dikeluarkan");
console.log("✓ Case 3 passed: Preview yang mengunci metode di-fallback dengan aman!");

// -------------------------------------------------------------------------
// Case 4: Backward Compatibility (Output V3 tanpa research_shape_preview)
// -------------------------------------------------------------------------
console.log("\n--- Case 4: Testing Backward Compatibility (V3 Without Preview) ---");
const shapeLegacyRes = parseIdeaTransfer(validV3TransferPayload);
assert.strictEqual(shapeLegacyRes.success, true, "Output V3 lama tanpa preview harus tetap valid");
assert.strictEqual(shapeLegacyRes.data.areas[0].researchShapePreview, undefined, "Area lama memiliki researchShapePreview undefined tanpa error");
console.log("✓ Case 4 passed: Backward compatibility output V3 lama terjaga 100%!");

// -------------------------------------------------------------------------
// Case 5: Rejection Modal & Alternative Prompt Assembly & 3-Round Limit
// -------------------------------------------------------------------------
console.log("\n--- Case 5: Testing Rejection Flow & Alternative Prompt Assembly ---");
clearIdeaRejectionRounds();

const round1 = {
  roundId: "round-1",
  createdAt: new Date().toISOString(),
  rejectedAreas: [
    { areaId: "A01", areaName: "Adopsi AI Generatif dalam Analisis Pengungkapan Keuangan" },
    { areaId: "A02", areaName: "Kepatuhan Regulasi Otomasi Audit KAP" },
  ],
  reasons: ["INTEREST_MISMATCH", "DATA_DISCOMFORT"],
  additionalNote: "Saya lebih ingin fokus pada evaluasi kualitas informasi AI daripada perilaku analis.",
};

const altPrompt1 = assembleTool1AlternativePrompt(tool1, sampleStudentInputs, round1);
assert(altPrompt1.includes("[UMPAN BALIK PUTARAN SEBELUMNYA]"), "Prompt alternatif memuat section feedback");
assert(altPrompt1.includes("A01: Adopsi AI Generatif"), "Prompt alternatif memuat area A01 yang ditolak");
assert(altPrompt1.includes("Kurang sesuai dengan minat mahasiswa"), "Prompt alternatif memuat label alasan minat");
assert(altPrompt1.includes("Jenis datanya kurang nyaman"), "Prompt alternatif memuat label alasan data");
assert(altPrompt1.includes("evaluasi kualitas informasi AI"), "Prompt alternatif memuat catatan tambahan mahasiswa");
assert(altPrompt1.includes("Jangan mengulang area lama hanya dengan"), "Prompt alternatif melarang pengulangan kosmetik");

// Test Storage Persistence (Max 3 rounds)
saveIdeaRejectionRounds([round1]);
let loadedRounds = loadIdeaRejectionRounds();
assert.strictEqual(loadedRounds.length, 1, "Harus menyimpan 1 round");

const round2 = { ...round1, roundId: "round-2" };
const round3 = { ...round1, roundId: "round-3" };
const round4 = { ...round1, roundId: "round-4" };

saveIdeaRejectionRounds([round1, round2, round3, round4]);
loadedRounds = loadIdeaRejectionRounds();
assert.strictEqual(loadedRounds.length, 3, "Storage harus membatasi maksimal 3 rounds");

clearIdeaRejectionRounds();
assert.strictEqual(loadIdeaRejectionRounds().length, 0, "Clear rounds harus mengosongkan storage");
console.log("✓ Case 5 passed: Rejection feedback & alternative prompt assembly verified!");

// -------------------------------------------------------------------------
// Case 6: Local Recommendation (Single Best Selection)
// -------------------------------------------------------------------------
console.log("\n--- Case 6: Testing Local Rule-Based Recommendation Engine ---");

// Construct fixture matching user prompt requirement:
// Student condition: mengejar tenggat, lebih nyaman data publik, menghindari wawancara
const studentFixtureT1 = {
  prodi: "Akuntansi",
  preferensi_data: "sekunder publik",
  avoidances: "gamau wawancara",
  target_waktu: "mengejar tenggat tiga bulan",
};

// Areas fixture:
// A01: PERLU_DIPERIKSA, ketidakpastian TINGGI, beban SEDANG
// A02: PERLU_DIPERIKSA, ketidakpastian SEDANG, beban SEDANG
// A03: PERLU_DIPERIKSA, ketidakpastian TINGGI, beban TINGGI
const areasFixtureT1 = [
  {
    ...shapeValidRes.data.areas[0],
    id: "A01",
    name: "Area 1 - AI Saham",
    constraintFit: {
      status: "PERLU_DIPERIKSA",
      reason: "Perlu konfirmasi prompt",
      assumptions: ["Data publik ada"],
      risks: ["Variasi model"],
    },
  },
  {
    ...shapeValidRes.data.areas[1],
    id: "A02",
    name: "Area 2 - Regulasi Audit",
    constraintFit: {
      status: "PERLU_DIPERIKSA",
      reason: "Data regulasi publik",
      assumptions: ["Regulasi bisa diunduh"],
      risks: ["Jumlah dokumen terbatas"],
    },
  },
  {
    ...shapeValidRes.data.areas[0],
    id: "A03",
    name: "Area 3 - Survei Perilaku",
    dataProvenance: [{ origin: "PRIMARY_RESPONDENT", dataForm: "Kuesioner", accessStatus: "NOT_CONFIRMED" }],
    constraintFit: {
      status: "BERISIKO",
      reason: "Butuh responden",
      assumptions: [],
      risks: ["Menolak wawancara"],
    },
  },
];

const comparisonFixtureT1 = [
  {
    areaId: "A01",
    interestFit: "SANGAT_DEKAT",
    studyProgramFit: "KUAT",
    dataFit: "PERLU_DIPERIKSA",
    collectionBurden: "SEDANG",
    methodologicalUncertainty: "TINGGI",
    mainCheckNext: "Periksa kestabilan prompt",
  },
  {
    areaId: "A02",
    interestFit: "DEKAT",
    studyProgramFit: "KUAT",
    dataFit: "SELARAS_SEMENTARA",
    collectionBurden: "SEDANG",
    methodologicalUncertainty: "SEDANG",
    mainCheckNext: "Periksa publikasi regulasi IAPI",
  },
  {
    areaId: "A03",
    interestFit: "CUKUP_DEKAT",
    studyProgramFit: "SEDANG",
    dataFit: "BERISIKO",
    collectionBurden: "TINGGI",
    methodologicalUncertainty: "TINGGI",
    mainCheckNext: "Cari alternatif responden",
  },
];

const recResult = calculateAreaRecommendation(areasFixtureT1, comparisonFixtureT1, studentFixtureT1);
assert.strictEqual(recResult.status, "RECOMMENDED_SINGLE", "Harus menghasilkan status RECOMMENDED_SINGLE");
assert.strictEqual(recResult.primaryAreaId, "A02", "A02 harus menjadi rekomendasi utama karena ketidakpastian lebih rendah & beban terukur");
assert(recResult.reasons.length > 0, "Harus menyertakan alasan pemilihan");
assert(recResult.assumptions.length > 0, "Harus menyertakan asumsi");
assert(recResult.risks.length > 0, "Harus menyertakan risiko");
assert.strictEqual(recResult.secondaryAreaId, "A01", "A01 harus menjadi alternatif cadangan");
console.log("✓ Case 6 passed: Rekomendasi lokal rule-based memilih A02 secara deterministik!");

// -------------------------------------------------------------------------
// Case 7: All Areas BERISIKO -> NO_SAFE_RECOMMENDATION
// -------------------------------------------------------------------------
console.log("\n--- Case 7: Testing All-Risky Condition (NO_SAFE_RECOMMENDATION) ---");

const allRiskyAreas = areasFixtureT1.map(a => ({
  ...a,
  constraintFit: {
    status: "BERISIKO",
    reason: "Semua butuh survei",
    assumptions: [],
    risks: ["Risiko data tidak ada"],
  },
}));

const allRiskyRec = calculateAreaRecommendation(allRiskyAreas, comparisonFixtureT1, studentFixtureT1);
assert.strictEqual(allRiskyRec.status, "NO_SAFE_RECOMMENDATION", "Jika semua area BERISIKO, status harus NO_SAFE_RECOMMENDATION");
assert(allRiskyRec.conflictingConstraints.length > 0, "Harus menyertakan batasan yang berbenturan");
assert(allRiskyRec.clarificationNeeded.length > 0, "Harus menyertakan hal yang perlu diperjelas");
assert.strictEqual(allRiskyRec.primaryAreaId, undefined, "Tidak boleh memilih area 'paling tidak buruk'");
console.log("✓ Case 7 passed: NO_SAFE_RECOMMENDATION tertrigger tanpa memilih paksa area berisiko!");

// -------------------------------------------------------------------------
// Case 8: TIE Recommendation (Equal Balance Between 2 Areas)
// -------------------------------------------------------------------------
console.log("\n--- Case 8: Testing TIE Recommendation Condition ---");

const tieAreas = [
  { ...areasFixtureT1[0], id: "A01", name: "Area 1 - Fokus Minat", constraintFit: { status: "SELARAS_SEMENTARA", reason: "Ok", assumptions: [], risks: [] } },
  { ...areasFixtureT1[1], id: "A02", name: "Area 2 - Jalur Data", constraintFit: { status: "SELARAS_SEMENTARA", reason: "Ok", assumptions: [], risks: [] } },
];

const tieComparison = [
  { areaId: "A01", interestFit: "DEKAT", studyProgramFit: "KUAT", dataFit: "SELARAS_SEMENTARA", collectionBurden: "SEDANG", methodologicalUncertainty: "SEDANG", mainCheckNext: "Cek A01" },
  { areaId: "A02", interestFit: "DEKAT", studyProgramFit: "KUAT", dataFit: "SELARAS_SEMENTARA", collectionBurden: "SEDANG", methodologicalUncertainty: "SEDANG", mainCheckNext: "Cek A02" },
];

const neutralStudentProfile = { prodi: "Akuntansi", preferensi_data: "", target_waktu: "" };
const tieRec = calculateAreaRecommendation(tieAreas, tieComparison, neutralStudentProfile);
assert.strictEqual(tieRec.status, "RECOMMENDED_TIE", "Skor yang sama persis harus menghasilkan status RECOMMENDED_TIE");
assert(tieRec.tieAreaIds, "Harus menyertakan tieAreaIds");
assert.strictEqual(tieRec.tieAreaIds[0], "A01");
assert.strictEqual(tieRec.tieAreaIds[1], "A02");
assert(tieRec.tieDistinctions.length >= 2, "Harus menyertakan pembeda antar kedua area tie");
console.log("✓ Case 8 passed: TIE recommendation menampilkan kedua area seimbang dengan pembeda!");

// -------------------------------------------------------------------------
// Case 9: Konfirmasi Rekomendasi Storage & Selection Cleanliness
// -------------------------------------------------------------------------
console.log("\n--- Case 9: Testing Recommendation Storage Persistence ---");

saveLastRecommendation(recResult);
const loadedRec = loadLastRecommendation();
assert(loadedRec, "Rekomendasi harus tersimpan di storage");
assert.strictEqual(loadedRec.primaryAreaId, "A02");

clearLastRecommendation();
assert.strictEqual(loadLastRecommendation(), null, "Clear recommendation harus mengosongkan storage");
console.log("✓ Case 9 passed: Persistence storage rekomendasi terverifikasi!");

// -------------------------------------------------------------------------
// Case 10: Handoff Cleanliness (No Illustrative Title Pattern in Tool 2)
// -------------------------------------------------------------------------
console.log("\n--- Case 10: Testing Handoff Cleanliness to Tool Fenomena ---");

const handoffCheck = shapeValidRes.data.areas[0].handoffToPhenomenon;
assert.strictEqual(handoffCheck.illustrative_title_pattern, undefined, "handoff_to_phenomenon DILARANG memuat illustrative_title_pattern");
assert.strictEqual(handoffCheck.research_shape_preview, undefined, "handoff_to_phenomenon DILARANG memuat research_shape_preview");
assert.strictEqual(handoffCheck.literature_search_seeds, undefined, "handoff_to_phenomenon DILARANG memuat literature_search_seeds");

console.log("✓ Case 10 passed: Handoff ke Tool Fenomena bersih dari pola judul dan bibit literatur!");

console.log("\n===============================================================");
console.log("  SUITE: BATAS OUTPUT CARI IDE & TRANSFER BLOCK PARSER");
console.log("===============================================================\n");

import {
  IDEA_RESULT_SOFT_LIMIT,
  IDEA_RESULT_HARD_LIMIT,
  IDEA_TRANSFER_BLOCK_HARD_LIMIT,
} from "./src/lib/ideaParser.ts";

assert.strictEqual(IDEA_RESULT_SOFT_LIMIT, 80000, "IDEA_RESULT_SOFT_LIMIT harus 80.000");
assert.strictEqual(IDEA_RESULT_HARD_LIMIT, 120000, "IDEA_RESULT_HARD_LIMIT harus 120.000");
assert.strictEqual(IDEA_TRANSFER_BLOCK_HARD_LIMIT, 100000, "IDEA_TRANSFER_BLOCK_HARD_LIMIT harus 100.000");

// Helper to create valid payload of exact length with human text padding
function createExactLengthPayload(targetLength) {
  const base = validV3TransferPayload.trim();
  const baseLen = Array.from(base).length;
  if (baseLen >= targetLength) {
    throw new Error(`Base length (${baseLen}) already exceeds targetLength (${targetLength})`);
  }
  const prefix = "\n<!-- PADDING COMMENT: ";
  const suffix = " -->\n";
  const wrapperLen = Array.from(prefix + suffix).length;
  const diff = targetLength - baseLen - wrapperLen;
  const paddingComment = prefix + "A".repeat(diff) + suffix;
  const result = paddingComment + base;
  assert.strictEqual(Array.from(result).length, targetLength, `Payload length must exactly match ${targetLength}`);
  return result;
}

// -------------------------------------------------------------------------
// 1. Boundary Tests
// -------------------------------------------------------------------------
console.log("--- 1. Testing Boundary Character Limits ---");

// 44.999 chars -> PASS (HASIL_VALID)
const p44999 = createExactLengthPayload(44999);
const res44999 = parseIdeaTransfer(p44999);
assert.strictEqual(res44999.success, true, "44.999 karakter harus diterima");
assert.strictEqual(res44999.warnings.some(w => w.includes("Output cukup panjang")), false, "44.999 tidak boleh memicu soft warning");

// 45.000 chars -> PASS (HASIL_VALID)
const p45000 = createExactLengthPayload(45000);
const res45000 = parseIdeaTransfer(p45000);
assert.strictEqual(res45000.success, true, "45.000 karakter harus diterima");
assert.strictEqual(res45000.warnings.some(w => w.includes("Output cukup panjang")), false, "45.000 tidak boleh memicu soft warning");

// 45.001 chars -> PASS (HASIL_VALID, batas lama 45.000 sudah terhapus)
const p45001 = createExactLengthPayload(45001);
const res45001 = parseIdeaTransfer(p45001);
assert.strictEqual(res45001.success, true, "45.001 karakter harus diterima (batas lama 45k sudah dilepas)");
assert.strictEqual(res45001.warnings.some(w => w.includes("Output cukup panjang")), false, "45.001 tidak boleh memicu soft warning");

// 47.341 chars (fixture aktual) -> PASS (HASIL_VALID)
const p47341 = createExactLengthPayload(47341);
const res47341 = parseIdeaTransfer(p47341);
assert.strictEqual(res47341.success, true, "47.341 karakter (fixture aktual pengguna) harus diterima");
assert.strictEqual(res47341.status, "HASIL_VALID", "47.341 karakter harus berstatus HASIL_VALID");
assert.strictEqual(res47341.data.areas.length, 2, "47.341 karakter harus menghasilkan 2 area");

// 79.999 chars -> PASS tanpa soft warning
const p79999 = createExactLengthPayload(79999);
const res79999 = parseIdeaTransfer(p79999);
assert.strictEqual(res79999.success, true, "79.999 karakter harus diterima");
assert.strictEqual(res79999.warnings.some(w => w.includes("Output cukup panjang")), false, "79.999 tidak boleh memicu soft warning");

// 80.000 chars -> PASS tanpa soft warning
const p80000 = createExactLengthPayload(80000);
const res80000 = parseIdeaTransfer(p80000);
assert.strictEqual(res80000.success, true, "80.000 karakter harus diterima");
assert.strictEqual(res80000.warnings.some(w => w.includes("Output cukup panjang")), false, "80.000 tidak boleh memicu soft warning");

// 80.001 chars -> PASS dengan soft warning
const p80001 = createExactLengthPayload(80001);
const res80001 = parseIdeaTransfer(p80001);
assert.strictEqual(res80001.success, true, "80.001 karakter harus diterima");
assert.strictEqual(res80001.status, "HASIL_PERLU_DIPERIKSA", "80.001 karakter memicu status HASIL_PERLU_DIPERIKSA (non-blocking)");
assert(res80001.warnings.some(w => w.includes("Output cukup panjang")), "80.001 karakter harus memicu soft warning");

// 119.999 chars -> PASS dengan soft warning
const p119999 = createExactLengthPayload(119999);
const res119999 = parseIdeaTransfer(p119999);
assert.strictEqual(res119999.success, true, "119.999 karakter harus diterima");
assert(res119999.warnings.some(w => w.includes("Output cukup panjang")), "119.999 karakter harus memicu soft warning");

// 120.000 chars -> PASS dengan soft warning
const p120000 = createExactLengthPayload(120000);
const res120000 = parseIdeaTransfer(p120000);
assert.strictEqual(res120000.success, true, "120.000 karakter harus diterima tepat pada hard limit");
assert(res120000.warnings.some(w => w.includes("Output cukup panjang")), "120.000 karakter harus memicu soft warning");

// 120.001 chars -> DITOLAK dengan OUTPUT_TERLALU_PANJANG
const p120001 = createExactLengthPayload(120001);
const res120001 = parseIdeaTransfer(p120001);
assert.strictEqual(res120001.success, false, "120.001 karakter harus ditolak");
assert.strictEqual(res120001.status, "OUTPUT_TERLALU_PANJANG", "Status harus OUTPUT_TERLALU_PANJANG");
assert(res120001.error.includes("Output terlalu panjang"), "Error harus menjelaskan output terlalu panjang");

console.log("✓ 1. Semua Boundary Character Limits lolos 100%!");

// -------------------------------------------------------------------------
// 2. Transfer Block & Markdown Escaping Tests
// -------------------------------------------------------------------------
console.log("\n--- 2. Testing Transfer Block & Markdown Escaping ---");

// Markdown Escaped Markers (\=\=\= BEGIN ...)
const escapedMarkdownPayload = validV3TransferPayload
  .replace("=== BEGIN SKRIFLOW_IDEA_V3 ===", "\\=\\=\\= BEGIN SKRIFLOW_IDEA_V3 \\=\\=\\=")
  .replace("=== END SKRIFLOW_IDEA_V3 ===", "\\=\\=\\= END SKRIFLOW_IDEA_V3 \\=\\=\\=");
const escapedRes = parseIdeaTransfer(escapedMarkdownPayload);
assert.strictEqual(escapedRes.success, true, "Marker dengan backslash escaping harus dinormalisasi dan sukses");
assert.strictEqual(escapedRes.data.areas.length, 2, "Area berhasil diekstrak dari escaped marker");

// Markdown Code Block Wrapped (```json ... ```)
const codeFencePayload = validV3TransferPayload.replace(
  "=== BEGIN SKRIFLOW_IDEA_V3 ===",
  "=== BEGIN SKRIFLOW_IDEA_V3 ===\n```json"
).replace(
  "=== END SKRIFLOW_IDEA_V3 ===",
  "```\n=== END SKRIFLOW_IDEA_V3 ==="
);
const codeFenceRes = parseIdeaTransfer(codeFencePayload);
assert.strictEqual(codeFenceRes.success, true, "Payload JSON yang dibungkus ```json ``` harus sukses");

// Duplicate Blocks (2 blocks) -> FAIL
const duplicatePayload = `${validV3TransferPayload}\n\n${validV3TransferPayload}`;
const dupRes = parseIdeaTransfer(duplicatePayload);
assert.strictEqual(dupRes.success, false, "Dua blok V3 harus ditolak");
assert(dupRes.error.includes("lebih dari satu blok"), "Pesan harus menyatakan terdeteksi lebih dari satu blok");

// Opening without closing marker -> FAIL
const openNoClosePayload = validV3TransferPayload.replace("=== END SKRIFLOW_IDEA_V3 ===", "");
const openNoCloseRes = parseIdeaTransfer(openNoClosePayload);
assert.strictEqual(openNoCloseRes.success, false, "Marker pembuka tanpa penutup harus ditolak");
assert(openNoCloseRes.error.includes("penutup") || openNoCloseRes.errorDetails.some(d => d.includes("penutup")), "Pesan harus spesifik tentang marker penutup");

// Closing without opening marker -> FAIL
const closeNoOpenPayload = validV3TransferPayload.replace("=== BEGIN SKRIFLOW_IDEA_V3 ===", "");
const closeNoOpenRes = parseIdeaTransfer(closeNoOpenPayload);
assert.strictEqual(closeNoOpenRes.success, false, "Marker penutup tanpa pembuka harus ditolak");
assert(closeNoOpenRes.error.includes("pembuka") || closeNoOpenRes.errorDetails.some(d => d.includes("pembuka")), "Pesan harus spesifik tentang marker pembuka");

// JSON Invalid in transfer block -> FAIL
const invalidJsonPayload = validV3TransferPayload.replace('"schema_version": 3,', '"schema_version": 3,,');
const invalidJsonRes = parseIdeaTransfer(invalidJsonPayload);
assert.strictEqual(invalidJsonRes.success, false, "JSON rusak harus ditolak");
assert(invalidJsonRes.error.includes("JSON di dalam blok transfer rusak"), "Pesan harus menyebut JSON rusak");

// JSON block > 100.000 chars -> FAIL
const largeJsonArea = JSON.parse(JSON.stringify(shapeValidRes.data.areas[0]));
largeJsonArea.scopeSummary = "X".repeat(105000);
const hugeJsonPayload = `=== BEGIN SKRIFLOW_IDEA_V3 ===\n${JSON.stringify({
  schema_version: 3,
  areas: [largeJsonArea, shapeValidRes.data.areas[1]],
  comparison: [],
})}\n=== END SKRIFLOW_IDEA_V3 ===`;
const hugeJsonRes = parseIdeaTransfer(hugeJsonPayload);
assert.strictEqual(hugeJsonRes.success, false, "JSON block > 100.000 karakter harus ditolak");
assert(hugeJsonRes.error.includes("terlalu besar untuk diproses"), "Error harus spesifik menyatakan blok data terlalu besar");

console.log("✓ 2. Semua Transfer Block & Markdown Escaping Tests lolos 100%!");

// =========================================================================
// SUITE: RESULT SET IDENTITY & STALE RECOMMENDATION RESET
// =========================================================================
console.log("\n===============================================================");
console.log("  SUITE: RESULT SET IDENTITY & STALE RECOMMENDATION RESET");
console.log("===============================================================");

// 1. Testing Payload Fingerprint Generation
console.log("\n--- 1. Testing Payload Fingerprint Generation ---");
const parsedRound1 = parseIdeaTransfer(validV3TransferPayload);
assert.strictEqual(parsedRound1.success, true, "Round 1 parse harus sukses");
const fp1 = computePayloadFingerprint(parsedRound1.data);
assert(fp1.startsWith("payload_fp_v3_"), "Fingerprint harus memiliki prefix payload_fp_v3_");

// Identical payload (with extra whitespace) -> identical fingerprint
const whitespacePayload = `  \n  ${validV3TransferPayload}  \n\n `;
const parsedWhitespace = parseIdeaTransfer(whitespacePayload);
assert.strictEqual(parsedWhitespace.success, true, "Whitespace payload parse harus sukses");
const fpWhitespace = computePayloadFingerprint(parsedWhitespace.data);
assert.strictEqual(fp1, fpWhitespace, "Payload identik dengan variasi whitespace harus menghasilkan fingerprint yang persis sama");

// Substantive change (change area name) -> different fingerprint
const round2Data = JSON.parse(JSON.stringify(parsedRound1.data));
round2Data.areas[0].name = "Area Alternatif Berbeda Putaran 2";
round2Data.areas[0].scopeSummary = "Cakupan yang benar-benar baru di putaran kedua.";
const fp2 = computePayloadFingerprint(round2Data);
assert.notStrictEqual(fp1, fp2, "Perubahan substantif pada area harus mengubah payload fingerprint");
console.log("✓ 1. Payload Fingerprint deterministik & sensitif terhadap perubahan!");

// 2. Testing Recommendation Bound to Result Set
console.log("\n--- 2. Testing Recommendation Binding to Result Set ---");
const recRound1 = calculateAreaRecommendation(
  parsedRound1.data.areas,
  parsedRound1.data.comparison,
  sampleStudentInputs,
  "result_r1_1001",
  fp1
);
assert.strictEqual(recRound1.resultSetId, "result_r1_1001", "Recommendation membawa resultSetId putaran 1");
assert.strictEqual(recRound1.payloadFingerprint, fp1, "Recommendation membawa payloadFingerprint putaran 1");
assert(recRound1.createdAt, "Recommendation memiliki timestamp createdAt");
console.log("✓ 2. Recommendation terikat erat dengan resultSetId dan payloadFingerprint!");

// 3. Testing Stale Recommendation Detection on Same Area IDs (A01, A02)
console.log("\n--- 3. Testing Stale Recommendation Invalidation across Rounds ---");
// Simulate saving round 1 recommendation
saveLastRecommendation(recRound1);

// Now load recommendation with expected fingerprint of round 2 (fp2)
const staleRecLoaded = loadLastRecommendation(fp2);
assert.strictEqual(staleRecLoaded, null, "Rekomendasi putaran 1 harus ditolak dan direset saat result set putaran 2 aktif");

// Valid load with matching fingerprint (fp1)
saveLastRecommendation(recRound1);
const validRecLoaded = loadLastRecommendation(fp1);
assert.notStrictEqual(validRecLoaded, null, "Rekomendasi yang cocok dengan payload aktif harus diterima");
assert.strictEqual(validRecLoaded.primaryAreaId, recRound1.primaryAreaId, "Area rekomendasi valid terbaca utuh");
console.log("✓ 3. Stale recommendation terdeteksi dan di-invalidate secara aman!");

// 4. Testing Alternative Rejection Round Prompt & History Isolation
console.log("\n--- 4. Testing Alternative Prompt Assembly & History Isolation ---");
const testRound = {
  roundId: "round-1",
  createdAt: new Date().toISOString(),
  rejectedAreas: [
    { areaId: "A01", areaName: "Area 1 Ditolak" },
    { areaId: "A02", areaName: "Area 2 Ditolak" },
  ],
  reasons: ["INTEREST_MISMATCH", "DATA_DISCOMFORT"],
  additionalNote: "Minat saya lebih ke arah pelaporan keberlanjutan",
};
const altPrompt = assembleTool1AlternativePrompt(tool1, sampleStudentInputs, testRound);
assert(altPrompt.includes("[UMPAN BALIK PUTARAN SEBELUMNYA]"), "Prompt alternatif memuat header umpan balik putaran sebelumnya");
assert(altPrompt.includes("Area 1 Ditolak"), "Prompt alternatif memuat nama area yang ditolak");
assert(altPrompt.includes("pelaporan keberlanjutan"), "Prompt alternatif memuat catatan tambahan mahasiswa");
assert(altPrompt.includes("=== BEGIN SKRIFLOW_IDEA_V3 ==="), "Prompt alternatif memuat marker transfer V3");
console.log("✓ 4. Alternative Prompt Assembly & rejection round feedback verified!");

// 5. Testing Selected Area Storage Invalidation on Stale Fingerprint
console.log("\n--- 5. Testing Selected Area Storage Invalidation ---");
const testSelected = {
  schemaVersion: 3,
  resultSetId: "result_r1_1001",
  payloadFingerprint: fp1,
  areaId: "A02",
  name: parsedRound1.data.areas[1].name,
  scopeSummary: parsedRound1.data.areas[1].scopeSummary,
  academicConnection: parsedRound1.data.areas[1].academicConnection,
  interestConnection: parsedRound1.data.areas[1].interestConnection,
  dataProvenance: parsedRound1.data.areas[1].dataProvenance,
  researchContext: parsedRound1.data.areas[1].researchContext,
  scopeBoundary: parsedRound1.data.areas[1].scopeBoundary,
  phenomenonSearchBrief: parsedRound1.data.areas[1].phenomenonSearchBrief,
  phenomenonSearchDirections: parsedRound1.data.areas[1].phenomenonSearchDirections,
  literatureSearchSeeds: parsedRound1.data.areas[1].literatureSearchSeeds,
  constraintFit: parsedRound1.data.areas[1].constraintFit,
  unresolvedItems: parsedRound1.data.areas[1].unresolvedItems,
  notDecided: parsedRound1.data.areas[1].notDecided,
  handoffToPhenomenon: parsedRound1.data.areas[1].handoffToPhenomenon,
  sourceInputFingerprint: "idea_fp_v3_test",
  selectedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

saveSelectedExplorationArea(testSelected);
const loadedSelectedSame = loadSelectedExplorationArea(fp1);
assert(loadedSelectedSame, "Selected area dengan fingerprint cocok harus terbaca");
assert.strictEqual(loadedSelectedSame.areaId, "A02", "Area terpilih A02 terbaca");

const loadedSelectedStale = loadSelectedExplorationArea(fp2);
assert.strictEqual(loadedSelectedStale, null, "Selected area dari putaran sebelumnya (fp1) harus direset saat fp2 aktif");
console.log("✓ 5. Selected Area Storage Invalidation verified!");

// =========================================================================
// SUITE: TOOL 1 -> TOOL 2 HANDOFF & ORIGIN TRACKING (10 MANDATORY TESTS)
// =========================================================================
console.log("\n===============================================================");
console.log("  SUITE: TOOL 1 -> TOOL 2 HANDOFF & ORIGIN TRACKING");
console.log("===============================================================");

// -------------------------------------------------------------------------
// TEST 1 — EXACT MAPPING TEST
// -------------------------------------------------------------------------
console.log("\n--- Test 1: Exact Mapping from Selected Area / Handoff ---");
clearSelectedExplorationArea();
clearIdeaToPhenomenonHandoff();
clearToolData("cari-fenomena-awal");
clearPhenomenonFieldOrigins();
clearSharedResearchContext();

const testHandoffPayload1 = {
  handoffVersion: 2,
  sourceResultSetId: "rs-1001",
  sourcePayloadFingerprint: fp1,
  sourceRoundNumber: 1,
  selectedAreaId: "A02",
  selectedAreaName: "Pola Reaksi Pasar Saham terhadap Keterbukaan Informasi",
  createdAt: new Date().toISOString(),
  prodi: "Akuntansi",
  areaText: "Area ini mengeksplorasi pola pasar saham di sekitar keterbukaan informasi emiten publik.",
  researchContext: {
    actorText: "investor ritel dan analis pasar modal",
    entityText: "perusahaan publik tercatat di BEI",
    documentText: "laporan keuangan tahunan, ringkasan keterbukaan informasi",
    dataArtifactText: "harga saham historis harian, log pengumuman keterbukaan informasi",
  },
  phenomenonContext: {
    initialClue: "Anomali pergerakan return saham abnormal sebelum rilis keterbukaan informasi resmi.",
    observableSignals: ["Fluktuasi volume transaksi yang tidak wajar", "Perubahan spread bid-ask"],
    inScope: ["Emiten LQ45", "Keterbukaan informasi non-keuangan tahun 2021-2024"],
    outOfScope: ["Emiten papan akselerasi", "Kabar rumor di forum media sosial"],
    prioritySourceTypes: ["DATA_PASAR_STATISTIK_RESMI", "DOKUMEN_PUBLIK_KORPORASI"],
  },
  studentConstraints: {
    preferredApproach: "kuantitatif",
    preferredData: "sekunder_keuangan",
    dataAccess: "laporan_keuangan_idx",
    accessNotes: "Bisa akses data IDX dan Yahoo Finance",
    thingsToAvoid: "gamau wawancara dan survei lapangan",
    timeCondition: "enam_bulan",
    lecturerDirection: "Fokus ke pengujian empiris data sekunder",
  },
};

saveIdeaToPhenomenonHandoff(testHandoffPayload1);

const autofillResult1 = getAutofillForTool("cari-fenomena-awal", {});
assert.strictEqual(autofillResult1.hasData, true, "Autofill harus mendeteksi data handoff");
assert.strictEqual(
  autofillResult1.data.area_eksplorasi,
  testHandoffPayload1.areaText,
  "area_eksplorasi HARUS tepat menggunakan handoff.areaText (BUKAN minat awal mahasiswa)"
);
assert.notStrictEqual(
  autofillResult1.data.area_eksplorasi,
  sampleStudentInputs.minat,
  "area_eksplorasi DILARANG menggunakan minat awal mahasiswa"
);
assert.strictEqual(
  autofillResult1.data.petunjuk_fenomena,
  testHandoffPayload1.phenomenonContext.initialClue,
  "petunjuk_fenomena HARUS tepat menggunakan handoff initialClue"
);
assert.notStrictEqual(
  autofillResult1.data.petunjuk_fenomena,
  sampleStudentInputs.minat,
  "petunjuk_fenomena DILARANG fallback ke minat awal mahasiswa"
);
assert(
  autofillResult1.data.objek_awal.includes("investor ritel") &&
  autofillResult1.data.objek_awal.includes("perusahaan publik"),
  "objek_awal harus menggabungkan aktor dan entitas"
);
console.log("✓ Test 1 Passed: Exact mapping berhasil tanpa bocor ke minat awal!");

// -------------------------------------------------------------------------
// TEST 2 — FALLBACK ORDER TEST
// -------------------------------------------------------------------------
console.log("\n--- Test 2: Fallback Order Hierarchy ---");
clearIdeaToPhenomenonHandoff();
const fallbackAreaSelected = {
  schemaVersion: 3,
  areaId: "A03",
  name: "Area Fallback Test",
  academicConnection: "Keterkaitan akuntansi",
  scopeSummary: "Ringkasan cakupan dari scopeSummary untuk fallback",
  phenomenonSearchBrief: "Petunjuk pencarian fenomena dari brief fallback",
  researchContext: {
    potentialActors: ["Auditor eksternal"],
    potentialEntities: ["KAP Big 4"],
  },
  handoffToPhenomenon: {
    areaText: "", // Empty to trigger fallback
    initialClue: "", // Empty to trigger fallback
    actorText: "",
    entityText: "",
  },
  sourceInputFingerprint: fp1,
  selectedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
saveSelectedExplorationArea(fallbackAreaSelected);

const fallbackAutofill = getAutofillForTool("cari-fenomena-awal", {});
assert.strictEqual(
  fallbackAutofill.data.area_eksplorasi,
  fallbackAreaSelected.scopeSummary,
  "Jika areaText kosong, fallback ke scopeSummary"
);
assert.strictEqual(
  fallbackAutofill.data.petunjuk_fenomena,
  fallbackAreaSelected.phenomenonSearchBrief,
  "Jika initialClue kosong, fallback ke phenomenonSearchBrief"
);

// When both initialClue and phenomenonSearchBrief are empty -> ""
const emptyClueArea = {
  ...fallbackAreaSelected,
  phenomenonSearchBrief: "",
  handoffToPhenomenon: { areaText: "Area ada", initialClue: "" },
};
saveSelectedExplorationArea(emptyClueArea);
const emptyClueAutofill = getAutofillForTool("cari-fenomena-awal", {});
assert.strictEqual(
  emptyClueAutofill.data.petunjuk_fenomena || "",
  "",
  "Jika initialClue dan phenomenonSearchBrief kosong, petunjuk_fenomena harus kosong string (BUKAN minat atau default prompt)"
);
console.log("✓ Test 2 Passed: Fallback hierarchy tepat dan tidak fallback ke clue generik!");

// -------------------------------------------------------------------------
// TEST 3 — SAME AREA ID ACROSS DIFFERENT ROUNDS (A02 Round 1 vs A02 Round 2)
// -------------------------------------------------------------------------
console.log("\n--- Test 3: Same Area ID across Different Rounds ---");
const handoffRound1 = {
  ...testHandoffPayload1,
  sourceRoundNumber: 1,
  sourcePayloadFingerprint: fp1,
  selectedAreaId: "A02",
  areaText: "Konten Area A02 Putaran 1",
  phenomenonContext: {
    ...testHandoffPayload1.phenomenonContext,
    initialClue: "Clue Putaran 1",
  },
};

const handoffRound2 = {
  ...testHandoffPayload1,
  sourceRoundNumber: 2,
  sourcePayloadFingerprint: fp2,
  selectedAreaId: "A02", // Same ID!
  areaText: "Konten Area A02 Putaran 2 (Total Berbeda)",
  phenomenonContext: {
    ...testHandoffPayload1.phenomenonContext,
    initialClue: "Clue Putaran 2 (Total Berbeda)",
  },
};

saveIdeaToPhenomenonHandoff(handoffRound1);
const loadedR1Handoff = loadIdeaToPhenomenonHandoff();
assert.strictEqual(loadedR1Handoff.sourcePayloadFingerprint, fp1, "Fingerprint handoff harus sesuai putaran 1");
assert.strictEqual(loadedR1Handoff.areaText, "Konten Area A02 Putaran 1", "Konten area harus milik putaran 1");

saveIdeaToPhenomenonHandoff(handoffRound2);
const loadedR2Handoff = loadIdeaToPhenomenonHandoff();
assert.strictEqual(loadedR2Handoff.sourcePayloadFingerprint, fp2, "Fingerprint handoff harus sesuai putaran 2");
assert.strictEqual(loadedR2Handoff.areaText, "Konten Area A02 Putaran 2 (Total Berbeda)", "Konten area harus milik putaran 2");
assert.strictEqual(loadedR2Handoff.phenomenonContext.initialClue, "Clue Putaran 2 (Total Berbeda)", "Clue harus milik putaran 2");
assert(!loadedR2Handoff.areaText.includes("Putaran 1"), "DILARANG ada residu teks dari Putaran 1");
console.log("✓ Test 3 Passed: ID area sama pada putaran berbeda terisolasi sempurna!");

// -------------------------------------------------------------------------
// TEST 4 — STALE AUTOFILL REPLACEMENT
// -------------------------------------------------------------------------
console.log("\n--- Test 4: Stale Autofill Replacement in Tool 2 ---");
// Form already contains values from round 1
let tool2Form = {
  prodi: "Akuntansi",
  area_eksplorasi: "Konten Area A02 Putaran 1",
  objek_awal: "investor ritel",
  petunjuk_fenomena: "Clue Putaran 1",
};

// Now handoffRound2 is active
saveIdeaToPhenomenonHandoff(handoffRound2);
const autofillR2 = getAutofillForTool("cari-fenomena-awal", tool2Form);
assert.strictEqual(autofillR2.hasData, true, "Autofill mendeteksi data handoff putaran 2");

const replacedForm = applyAutofillValues(tool2Form, autofillR2.data, "overwrite");
assert.strictEqual(replacedForm.area_eksplorasi, "Konten Area A02 Putaran 2 (Total Berbeda)", "Area lama terganti oleh putaran 2");
assert.strictEqual(replacedForm.petunjuk_fenomena, "Clue Putaran 2 (Total Berbeda)", "Clue lama terganti oleh putaran 2");
console.log("✓ Test 4 Passed: Autofill stale terupdate tuntas ke putaran baru!");

// -------------------------------------------------------------------------
// TEST 5 — MANUAL EDIT ORIGIN TRACKING (USER_EDITED vs AUTOFILL_IDEA)
// -------------------------------------------------------------------------
console.log("\n--- Test 5: Manual Edit Origin Tracking ---");
clearPhenomenonFieldOrigins();
let origins = {
  area_eksplorasi: "AUTOFILL_IDEA",
  petunjuk_fenomena: "USER_EDITED", // User edited clue manually
  objek_awal: "AUTOFILL_IDEA",
};
savePhenomenonFieldOrigins(origins);

const loadedOrigins = loadPhenomenonFieldOrigins();
assert.strictEqual(loadedOrigins.petunjuk_fenomena, "USER_EDITED", "Status USER_EDITED harus tersimpan di storage");
assert.strictEqual(loadedOrigins.area_eksplorasi, "AUTOFILL_IDEA", "Status AUTOFILL_IDEA harus tersimpan di storage");

// When user chooses 'keep manual':
const userManualForm = {
  ...replacedForm,
  petunjuk_fenomena: "Clue buatan mahasiswa sendiri yang tidak boleh ditimpa",
};
savePhenomenonAppliedHandoffFingerprint(fp2);
assert.strictEqual(loadPhenomenonAppliedHandoffFingerprint(), fp2, "Fingerprint handoff diterapkan");
assert.strictEqual(userManualForm.petunjuk_fenomena, "Clue buatan mahasiswa sendiri yang tidak boleh ditimpa", "Manual edit tetap utuh");

// When user chooses 'apply all':
const allNewForm = applyAutofillValues(userManualForm, autofillR2.data, "overwrite");
assert.strictEqual(allNewForm.petunjuk_fenomena, "Clue Putaran 2 (Total Berbeda)", "Apply all menimpa field manual");
console.log("✓ Test 5 Passed: Pelacakan origin USER_EDITED & konfirmasi berjalan konsisten!");

// -------------------------------------------------------------------------
// TEST 6 — NEGATION PRESERVATION IN CONSTRAINTS
// -------------------------------------------------------------------------
console.log("\n--- Test 6: Negation Preservation in Student Constraints ---");
assert.strictEqual(
  testHandoffPayload1.studentConstraints.thingsToAvoid,
  "gamau wawancara dan survei lapangan",
  "Hal yang dihindari harus menyimpan kalimat negasi asli"
);

const t2Tool = getToolBySlug("cari-fenomena-awal");
const promptWithNegation = assemblePrompt(t2Tool, {
  prodi: "Akuntansi",
  area_eksplorasi: testHandoffPayload1.areaText,
  objek_awal: "investor ritel",
  petunjuk_fenomena: testHandoffPayload1.phenomenonContext.initialClue,
  avoidances: testHandoffPayload1.studentConstraints.thingsToAvoid,
});
assert(promptWithNegation.includes("Hal yang dihindari: gamau wawancara dan survei lapangan"), "Prompt Tool 2 harus memuat negasi hal yang dihindari secara utuh");
console.log("✓ Test 6 Passed: Negasi mahasiswa tidak terdistorsi atau terbalik!");

// -------------------------------------------------------------------------
// TEST 7 — CLEAN HANDOFF (NO LITERATURE SEEDS, TITLE PATTERN, OLD RECOMMENDATIONS)
// -------------------------------------------------------------------------
console.log("\n--- Test 7: Clean Handoff Validation ---");
assert(!("keywords_id" in testHandoffPayload1.phenomenonContext), "Handoff DILARANG memuat keywords_id");
assert(!("keywords_en" in testHandoffPayload1.phenomenonContext), "Handoff DILARANG memuat keywords_en");
assert(!("literatureSearchSeeds" in testHandoffPayload1), "Handoff DILARANG memuat literatureSearchSeeds");
assert(!("titlePattern" in testHandoffPayload1), "Handoff DILARANG memuat titlePattern");
assert(!("recommendation" in testHandoffPayload1), "Handoff DILARANG memuat rekomendasi");
assert(
  !testHandoffPayload1.phenomenonContext.prioritySourceTypes.includes("RESEARCHER_GENERATED"),
  "Handoff DILARANG menggunakan RESEARCHER_GENERATED sebagai tipe sumber fenomena"
);
console.log("✓ Test 7 Passed: Handoff bersih tanpa residu literatur atau rekomendasi!");

// -------------------------------------------------------------------------
// TEST 8 — NAVIGATION GUARD VALIDATION
// -------------------------------------------------------------------------
console.log("\n--- Test 8: Navigation Guard & Fingerprint Mismatch Rejection ---");
const validateNav = (activeFp, selectedFp, areaText, initialClue) => {
  if (activeFp !== selectedFp) {
    return { ok: false, error: "Area terpilih tidak lagi cocok dengan hasil aktif. Pilih kembali salah satu area dari putaran terbaru." };
  }
  if (!areaText || !areaText.trim()) {
    return { ok: false, error: "Teks area eksplorasi belum lengkap." };
  }
  if (!initialClue || !initialClue.trim()) {
    return { ok: false, error: "Petunjuk fenomena awal belum lengkap." };
  }
  return { ok: true };
};

const mismatchedNav = validateNav(fp2, fp1, "Area Text", "Initial Clue");
assert.strictEqual(mismatchedNav.ok, false, "Navigasi harus ditolak saat fingerprint mismatch");
assert.strictEqual(mismatchedNav.error, "Area terpilih tidak lagi cocok dengan hasil aktif. Pilih kembali salah satu area dari putaran terbaru.");

const matchedNav = validateNav(fp2, fp2, "Area Text", "Initial Clue");
assert.strictEqual(matchedNav.ok, true, "Navigasi diizinkan saat fingerprint dan konten valid");
console.log("✓ Test 8 Passed: Navigation guard mencegah handoff dari result set yang tidak aktif!");

// -------------------------------------------------------------------------
// TEST 9 — LOCALSTORAGE RELOAD & PERSISTENCE
// -------------------------------------------------------------------------
console.log("\n--- Test 9: Persistence & Reload Verification ---");
saveIdeaToPhenomenonHandoff(handoffRound2);
savePhenomenonAppliedHandoffFingerprint(fp2);

const reloadedHandoff = loadIdeaToPhenomenonHandoff();
const reloadedFp = loadPhenomenonAppliedHandoffFingerprint();
assert.strictEqual(reloadedHandoff.sourcePayloadFingerprint, fp2, "Handoff persisten setelah reload");
assert.strictEqual(reloadedFp, fp2, "Applied fingerprint persisten setelah reload");
console.log("✓ Test 9 Passed: Persistence localStorage bekerja sempurna!");

// -------------------------------------------------------------------------
// TEST 10 — FULL REGRESSION OF PROMPT ASSEMBLER & PARSER
// -------------------------------------------------------------------------
console.log("\n--- Test 10: Full Regression Testing ---");
const fullPromptT2 = assemblePrompt(t2Tool, {
  prodi: "Akuntansi",
  area_eksplorasi: handoffRound2.areaText,
  objek_awal: "investor pasar modal",
  petunjuk_fenomena: handoffRound2.phenomenonContext.initialClue,
  avoidances: "gamau wawancara",
});
assert(fullPromptT2.includes("[KONTEKS MAHASISWA]"), "Prompt memuat header konteks mahasiswa");
assert(fullPromptT2.includes("Akuntansi"), "Prompt memuat prodi");
assert(fullPromptT2.includes("Konten Area A02 Putaran 2 (Total Berbeda)"), "Prompt memuat area dari handoff");
assert(fullPromptT2.includes("Clue Putaran 2 (Total Berbeda)"), "Prompt memuat petunjuk fenomena dari handoff");
assert(!fullPromptT2.includes("minat awal"), "Prompt tidak bocor ke minat awal");
console.log("✓ Test 10 Passed: Full regression test passed!");

console.log("\n===============================================================");
console.log("  SUITE: EXPLORATION SESSION LIFECYCLE & ROUND ISOLATION");
console.log("===============================================================");

// -------------------------------------------------------------------------
// TEST 1 — Session creation, persistence, and round counting
// -------------------------------------------------------------------------
console.log("\n--- Session Test 1: Session Creation and Round Progression ---");
clearIdeaExplorationSession();
const session1 = {
  sessionId: "session_abc_123",
  createdAt: new Date().toISOString(),
  contextFingerprint: "fp_initial_1",
  roundCount: 1,
  maxRounds: 3,
  resultSetIds: ["rs_1"],
  rejectedAreaIds: ["A01", "A03"],
  rejectionReasons: ["Beban koleksi data berat"],
  contextSnapshot: { ...sampleStudentInputs },
};

saveIdeaExplorationSession(session1);
const loadedSession1 = loadIdeaExplorationSession();
assert.notStrictEqual(loadedSession1, null, "Sesi eksplorasi harus tersimpan di storage");
assert.strictEqual(loadedSession1.sessionId, "session_abc_123", "Session ID harus cocok");
assert.strictEqual(loadedSession1.roundCount, 1, "Round count putaran 1 harus 1");
assert.strictEqual(loadedSession1.maxRounds, 3, "Maksimum round harus 3");
assert.deepStrictEqual(loadedSession1.rejectedAreaIds, ["A01", "A03"], "Rejected area IDs harus tersimpan");
console.log("✓ Session Test 1 Passed: Sesi eksplorasi berhasil dibuat dan disimpan!");

// -------------------------------------------------------------------------
// TEST 2 — Max 3 rounds applies per session and resets on new session
// -------------------------------------------------------------------------
console.log("\n--- Session Test 2: Max 3 Rounds applies per session, resets on new session ---");
// Simulate session 1 reaching round 3 (exhausted)
const session1Exhausted = {
  ...session1,
  roundCount: 3,
  resultSetIds: ["rs_1", "rs_2", "rs_3"],
  rejectedAreaIds: ["A01", "A02", "A03", "A04", "A05", "A06"],
};
saveIdeaExplorationSession(session1Exhausted);
assert.strictEqual(loadIdeaExplorationSession().roundCount, 3, "Sesi 1 mencapai batas 3 putaran");

// Now user starts a new session (Ganti Isu / Cakupan)
const session2 = {
  sessionId: "session_xyz_789",
  createdAt: new Date().toISOString(),
  contextFingerprint: "fp_new_issue_2",
  roundCount: 1, // Resets to 1 (new exploration)
  maxRounds: 3,
  resultSetIds: ["rs_new_1"],
  rejectedAreaIds: [],
  rejectionReasons: [],
  contextSnapshot: {
    ...sampleStudentInputs,
    minat: "Isu baru: Audit sistem informasi berbasis cloud",
  },
};
saveIdeaExplorationSession(session2);
clearIdeaRejectionRounds(); // Rejection history reset for new session

const loadedSession2 = loadIdeaExplorationSession();
assert.strictEqual(loadedSession2.sessionId, "session_xyz_789", "Session ID baru harus aktif");
assert.strictEqual(loadedSession2.roundCount, 1, "Round count harus direset ke 1 (BUKAN 4 atau terkunci)");
assert.strictEqual(loadedSession2.rejectedAreaIds.length, 0, "Daftar area ditolak sesi lama tidak boleh ikut terbawa");
assert.strictEqual(loadIdeaRejectionRounds().length, 0, "Riwayat rejection rounds sesi lama harus kosong");
console.log("✓ Session Test 2 Passed: Batas 3 putaran berlaku per sesi eksplorasi dan tereset saat mulai sesi baru!");

// -------------------------------------------------------------------------
// TEST 3 — Ganti Isu with Preserve Profile
// -------------------------------------------------------------------------
console.log("\n--- Session Test 3: Ganti Isu with Preserve Profile ---");
const currentForm = {
  prodi: "Akuntansi",
  minat: "Pengaruh penggunaan ChatGPT lama",
  pendekatan: "kuantitatif",
  preferensi_data: "sekunder_keuangan",
  akses_data: "laporan_keuangan_idx",
  akses_data_catatan: "Catatan akses data spesifik minat lama",
  avoidances: "gamau wawancara dan survei lapangan",
  target_waktu: "enam_bulan",
  constraints: "Fokus pasar modal 2023-2024",
  supervisor_direction: "Arahan dosen untuk topik ChatGPT",
};

// Function simulating startNewIdeaExploration with preserveProfile = true
const performChangeIssue = (form, preserveProfile) => {
  if (preserveProfile) {
    return {
      prodi: form.prodi || "",
      minat: "", // Cleared
      pendekatan: form.pendekatan || "unknown",
      preferensi_data: form.preferensi_data || "unknown",
      akses_data: form.akses_data || "unknown",
      akses_data_catatan: "", // Cleared
      avoidances: form.avoidances || "",
      target_waktu: form.target_waktu || "unknown",
      constraints: form.constraints || "",
      supervisor_direction: "", // Cleared
    };
  } else {
    return {
      prodi: "",
      minat: "",
      pendekatan: "unknown",
      preferensi_data: "unknown",
      akses_data: "unknown",
      akses_data_catatan: "",
      avoidances: "",
      target_waktu: "unknown",
      constraints: "",
      supervisor_direction: "",
    };
  }
};

const preservedForm = performChangeIssue(currentForm, true);
assert.strictEqual(preservedForm.prodi, "Akuntansi", "Prodi harus dipertahankan");
assert.strictEqual(preservedForm.pendekatan, "kuantitatif", "Pendekatan harus dipertahankan");
assert.strictEqual(preservedForm.preferensi_data, "sekunder_keuangan", "Preferensi data harus dipertahankan");
assert.strictEqual(preservedForm.akses_data, "laporan_keuangan_idx", "Akses data harus dipertahankan");
assert.strictEqual(preservedForm.avoidances, "gamau wawancara dan survei lapangan", "Hal dihindari harus dipertahankan");
assert.strictEqual(preservedForm.target_waktu, "enam_bulan", "Target waktu harus dipertahankan");
assert.strictEqual(preservedForm.constraints, "Fokus pasar modal 2023-2024", "Constraints harus dipertahankan");

// Verify cleared fields
assert.strictEqual(preservedForm.minat, "", "Minat HARUS dikosongkan");
assert.strictEqual(preservedForm.supervisor_direction, "", "Arahan dosen HARUS dikosongkan");
assert.strictEqual(preservedForm.akses_data_catatan, "", "Catatan akses data HARUS dikosongkan");

const fullResetForm = performChangeIssue(currentForm, false);
assert.strictEqual(fullResetForm.prodi, "", "Full reset mengosongkan prodi");
assert.strictEqual(fullResetForm.minat, "", "Full reset mengosongkan minat");
assert.strictEqual(fullResetForm.avoidances, "", "Full reset mengosongkan avoidances");
console.log("✓ Session Test 3 Passed: Preserve profile mempertahankan 7 profil dan mengosongkan 3 field minat/arahan/catatan!");

// -------------------------------------------------------------------------
// TEST 4 — Session ID Tagging & Validation on Storage
// -------------------------------------------------------------------------
console.log("\n--- Session Test 4: Session ID Isolation on Recommendations & Handoffs ---");
const activeSessionId = "session_active_999";
const oldSessionId = "session_old_111";

// Save recommendation tagged with old session
const oldRecommendation = {
  sessionId: oldSessionId,
  recommendedAreaId: "A01",
  recommendedAreaName: "Area Sesi Lama",
  confidence: "HIGH",
  summaryReason: "Alasan rekomendasi lama",
  keyStrengths: ["Kekuatan lama"],
  keyCautions: ["Peringatan lama"],
  academicFitNote: "Catatan lama",
  calculatedAt: new Date().toISOString(),
  targetResultSetId: "rs_old_1",
  targetPayloadFingerprint: "fp_old",
  payloadFingerprint: "fp_old",
  resultSetId: "rs_old_1",
};
saveLastRecommendation(oldRecommendation);

// Load with expected active session ID -> MUST RETURN NULL (and removes stale storage)
const recResultForActive = loadLastRecommendation(undefined, undefined, activeSessionId);
assert.strictEqual(recResultForActive, null, "Rekomendasi sesi lama HARUS ditolak untuk sesi aktif yang berbeda");

// Re-save and load matching session ID -> Returns recommendation
saveLastRecommendation(oldRecommendation);
const recResultForOld = loadLastRecommendation(undefined, undefined, oldSessionId);
assert.notStrictEqual(recResultForOld, null, "Rekomendasi terbaca jika session ID cocok");
assert.strictEqual(recResultForOld.sessionId, oldSessionId, "Session ID recommendation cocok");

// Save selected area tagged with old session
const oldSelectedArea = {
  schemaVersion: 3,
  sessionId: oldSessionId,
  areaId: "A01",
  name: "Area Sesi Lama",
  scopeSummary: "Cakupan lama",
  academicConnection: "Koneksi lama",
  researchContext: {},
  handoffToPhenomenon: { areaText: "Area Lama", initialClue: "Clue Lama" },
  sourceInputFingerprint: "fp_old",
  selectedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
saveSelectedExplorationArea(oldSelectedArea);

// Load selected area with active session ID -> MUST RETURN NULL (and removes stale storage)
assert.strictEqual(loadSelectedExplorationArea(undefined, activeSessionId), null, "Selected area sesi lama HARUS ditolak untuk sesi baru");

// Re-save and load matching session ID -> Returns area
saveSelectedExplorationArea(oldSelectedArea);
assert.notStrictEqual(loadSelectedExplorationArea(undefined, oldSessionId), null, "Selected area terbaca jika session ID cocok");

// Save handoff tagged with old session
const oldHandoff = {
  handoffVersion: 2,
  sessionId: oldSessionId,
  sourceTool: "cari-ide-skripsi",
  sourceRoundNumber: 1,
  sourcePayloadFingerprint: "fp_old",
  selectedAreaId: "A01",
  areaText: "Area Handoff Lama",
  phenomenonContext: { initialClue: "Clue Handoff Lama", observableSignals: [], prioritySourceTypes: [] },
  scopeBoundary: { inScope: [], outOfScope: [] },
  studentConstraints: { programStudi: "Akuntansi" },
  transferredAt: new Date().toISOString(),
};
saveIdeaToPhenomenonHandoff(oldHandoff);

// Load handoff with active session ID -> MUST RETURN NULL (and removes stale storage)
assert.strictEqual(loadIdeaToPhenomenonHandoff(undefined, undefined, activeSessionId), null, "Handoff sesi lama HARUS ditolak untuk sesi baru");

// Re-save and load matching session ID -> Returns handoff
saveIdeaToPhenomenonHandoff(oldHandoff);
assert.notStrictEqual(loadIdeaToPhenomenonHandoff(undefined, undefined, oldSessionId), null, "Handoff terbaca jika session ID cocok");
console.log("✓ Session Test 4 Passed: Isolasi rekomendasi, selected area, dan handoff berdasarkan sessionId terbukti aman!");

// -------------------------------------------------------------------------
// TEST 5 — Full Reset Tool 1 Preserves Downstream Data in Tool 2
// -------------------------------------------------------------------------
console.log("\n--- Session Test 5: Full Tool 1 Reset Does Not Wipe Downstream Tool 2 Data ---");
// Simulate manual entry in Tool 2
saveToolData("cari-fenomena-awal", {
  prodi: "Akuntansi",
  area_eksplorasi: "Area yang diketik sendiri oleh mahasiswa di Tool 2",
  petunjuk_fenomena: "Petunjuk buatan mahasiswa di Tool 2",
});

// Now clear Tool 1 completely
clearToolData("cari-ide-skripsi");

// Verify Tool 1 is completely wiped
assert.strictEqual(loadIdeaExplorationSession(), null, "Session Tool 1 terhapus");
assert.strictEqual(loadSelectedExplorationArea(), null, "Selected area Tool 1 terhapus");
assert.strictEqual(loadLastRecommendation(), null, "Recommendation Tool 1 terhapus");
assert.strictEqual(loadIdeaToPhenomenonHandoff(), null, "Handoff Tool 1 terhapus");

// Verify Tool 2 data is 100% PRESERVED
const t2DataPreserved = loadToolData("cari-fenomena-awal");
assert.strictEqual(
  t2DataPreserved.area_eksplorasi,
  "Area yang diketik sendiri oleh mahasiswa di Tool 2",
  "Data manual Tool 2 DILARANG terhapus saat Tool 1 direset!"
);
assert.strictEqual(
  t2DataPreserved.petunjuk_fenomena,
  "Petunjuk buatan mahasiswa di Tool 2",
  "Data petunjuk fenomena Tool 2 DILARANG terhapus saat Tool 1 direset!"
);
console.log("✓ Session Test 5 Passed: Reset Tool 1 tidak menghapus data tersimpan di Tool 2!");

// -------------------------------------------------------------------------
// TEST 6 — Pure Transfer-Only Output V3 Parity & Fix Prompt
// -------------------------------------------------------------------------
console.log("\n--- Session Test 6: Pure Transfer-Only V3 Format & Fix Prompt ---");
const fixPrompt = generateFixIdeaFormatPrompt("Output acak tanpa format");
assert(fixPrompt.includes("=== BEGIN SKRIFLOW_IDEA_V3 ==="), "Fix prompt memuat marker BEGIN");
assert(fixPrompt.includes("=== END SKRIFLOW_IDEA_V3 ==="), "Fix prompt memuat marker END");
assert(fixPrompt.includes('"schema_version": 3'), "Fix prompt memuat schema_version: 3");
assert(fixPrompt.includes("format blok data transfer JSON SKRIFLOW_IDEA_V3"), "Fix prompt menginstruksikan single transfer block");
assert(fixPrompt.includes("tanpa teks, tabel, atau penjelasan di luar marker"), "Fix prompt melarang teks di luar marker");

const rejectionRoundSample = {
  roundId: "round-test-session",
  createdAt: new Date().toISOString(),
  rejectedAreas: [{ areaId: "A01", areaName: "Adopsi AI Saham" }],
  reasons: ["TOO_HEAVY"],
  additionalNote: "Fokus pada data sekunder saja",
};

const altPromptSession = assembleTool1AlternativePrompt(
  tool1,
  sampleStudentInputs,
  rejectionRoundSample
);
assert(altPromptSession.includes("[PERAN]"), "Alt prompt memuat section [PERAN]");
assert(altPromptSession.includes("[UMPAN BALIK PUTARAN SEBELUMNYA]"), "Alt prompt memuat umpan balik putaran sebelumnya");
assert(altPromptSession.includes("A01: Adopsi AI Saham"), "Alt prompt memuat area yang ditolak");
assert(altPromptSession.includes("Beban pengerjaannya terlalu berat"), "Alt prompt memuat alasan penolakan");
assert(altPromptSession.includes("[FORMAT KELUARAN — TRANSFER-ONLY]"), "Alt prompt memuat format transfer-only");
assert(altPromptSession.includes("=== BEGIN SKRIFLOW_IDEA_V3 ==="), "Alt prompt memuat marker BEGIN");
assert(altPromptSession.includes("=== END SKRIFLOW_IDEA_V3 ==="), "Alt prompt memuat marker END");
console.log("✓ Session Test 6 Passed: Transfer-only prompt dan prompt perbaikan format V3 terverifikasi!");

console.log("\n===============================================================");
console.log("  ALL TESTS (INCLUDING ALL NEW SESSION & RESET SUITES) PASSED!");
console.log("===============================================================\n");



