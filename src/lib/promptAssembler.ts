import {
  Tool,
  SelectedPhenomenon,
  ResearchBedahInput,
  PhenomenonEvidence,
  HandoffToPhenomenonV3,
} from "@/types/tool";
import {
  resolveOptionLabel,
  resolvePrioritasSumberPrompt,
} from "@/data/researchOptions";
import {
  NOTEBOOKLM_LIMITS,
  BEDAH_LIMITS,
  PromptBudgetStatus,
  PromptBudgetBreakdown,
  getPromptBudgetStatus,
  getBedahPromptBudgetStatus,
} from "@/config/promptLimits";
import {
  loadToolData,
  loadSharedResearchContext,
  loadSelectedExplorationArea,
  loadIdeaToPhenomenonHandoff,
} from "./storage";

/**
 * Returns formatted local date YYYY-MM-DD.
 */
function getLocalCurrentDate(customDate?: string): string {
  if (customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate.trim())) {
    return customDate.trim();
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Counts characters accurately using Array.from to handle surrogate pairs/emojis.
 */
export function countPromptCharacters(text: string | null | undefined): number {
  if (!text) return 0;
  return Array.from(text).length;
}

export interface DynamicFieldBreakdown {
  id: string;
  label: string;
  value: string;
  length: number;
}

export interface PromptAnalysis {
  promptId: string;
  staticTemplateLength: number;
  dynamicContextLength: number;
  essentialContextLength: number;
  optionalContextLength: number;
  separatorsAndLabelsLength: number;
  safetyBuffer: number;
  remainingLength: number;
  finalLength: number;
  safeTarget: number;
  hardLimit: number;
  status: PromptBudgetStatus;
  isOptionalCompacted: boolean;
  phenomenonLength: number;
  maxPhenomenonLength: number;
  breakdown: PromptBudgetBreakdown;
  longestField: DynamicFieldBreakdown | null;
  fields: DynamicFieldBreakdown[];
}

/**
 * Helper to compact optional context (P1: focusAspect, openIssues) deterministically
 * at sentence, bullet, or word boundaries when available budget is limited.
 * Note: P0 (Program Studi, Area Eksplorasi, Fenomena Awal) is NEVER compacted or modified.
 */
export interface FitOptionalContextParams {
  limit?: number;
  safetyBuffer?: number;
  staticTemplateLength: number;
  essentialContextLength: number;
  focusAspect?: string;
  openIssues?: string;
}

export interface FitOptionalContextResult {
  compactedFocusAspect?: string;
  compactedOpenIssues?: string;
  isCompacted: boolean;
  availableForOptional: number;
  usedOptional: number;
}

function truncateAtWordBoundary(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  if (maxLen <= 0) return "";

  const slice = trimmed.slice(0, maxLen);
  // Prefer clause or sentence boundaries (. , ; !)
  const lastClause = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("; "), slice.lastIndexOf(", "));
  if (lastClause > maxLen * 0.4) {
    return slice.slice(0, lastClause + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > 0) {
    return slice.slice(0, lastSpace).trim();
  }
  return slice.trim();
}

export function fitOptionalContextToBudget(params: FitOptionalContextParams): FitOptionalContextResult {
  const limit = params.limit ?? NOTEBOOKLM_LIMITS.hardLimit;
  const safetyBuffer = params.safetyBuffer ?? NOTEBOOKLM_LIMITS.safetyBuffer;
  const rawFocus = (params.focusAspect || "").trim();
  const rawOpen = (params.openIssues || "").trim();

  const focusLabelLen = rawFocus.length > 0 ? "Fokus Aspek: \n".length : 0;
  const openLabelLen = rawOpen.length > 0 ? "Hal Terbuka: \n".length : 0;

  const baseLength = params.staticTemplateLength + params.essentialContextLength;
  const maxAvailable = Math.max(0, limit - safetyBuffer - baseLength);

  const neededTotal = (rawFocus ? rawFocus.length + focusLabelLen : 0) + (rawOpen ? rawOpen.length + openLabelLen : 0);

  if (neededTotal <= maxAvailable) {
    return {
      compactedFocusAspect: rawFocus || undefined,
      compactedOpenIssues: rawOpen || undefined,
      isCompacted: false,
      availableForOptional: maxAvailable,
      usedOptional: neededTotal,
    };
  }

  // Need compaction: prioritize focusAspect first, then openIssues
  let compactedFocus = rawFocus;
  let compactedOpen = rawOpen;

  const availableForContent = Math.max(0, maxAvailable - (rawFocus ? focusLabelLen : 0) - (rawOpen ? openLabelLen : 0));

  if (rawFocus && rawOpen) {
    const focusBudget = Math.floor(availableForContent * 0.6);
    compactedFocus = truncateAtWordBoundary(rawFocus, focusBudget);
    const remainingForOpen = Math.max(0, availableForContent - compactedFocus.length);
    compactedOpen = truncateAtWordBoundary(rawOpen, remainingForOpen);
  } else if (rawFocus) {
    compactedFocus = truncateAtWordBoundary(rawFocus, availableForContent);
  } else if (rawOpen) {
    compactedOpen = truncateAtWordBoundary(rawOpen, availableForContent);
  }

  const finalFocusLen = compactedFocus ? compactedFocus.length + focusLabelLen : 0;
  const finalOpenLen = compactedOpen ? compactedOpen.length + openLabelLen : 0;

  return {
    compactedFocusAspect: compactedFocus || undefined,
    compactedOpenIssues: compactedOpen || undefined,
    isCompacted: true,
    availableForOptional: maxAvailable,
    usedOptional: finalFocusLen + finalOpenLen,
  };
}

/**
 * Reusable deterministic compiler to render constraint fields compactly.
 */
export function compileCompactConstraints(values: Record<string, string>): string {
  const parts: string[] = [];

  if (values.pendekatan && values.pendekatan !== "unknown" && values.pendekatan !== "Belum tahu") {
    const lbl = resolveOptionLabel("pendekatan", values.pendekatan);
    if (lbl && lbl !== "Belum tahu") {
      parts.push(lbl.toLowerCase());
    }
  }

  if (values.preferensi_data && values.preferensi_data !== "unknown" && values.preferensi_data !== "Belum tahu") {
    const lbl = resolveOptionLabel("preferensi_data", values.preferensi_data);
    if (lbl && lbl !== "Belum tahu") {
      parts.push(lbl.toLowerCase());
    }
  }

  const catatanAkses = (values.akses_data_catatan || "").trim();
  if (catatanAkses.length > 0) {
    parts.push(`akses ${catatanAkses}`);
  } else if (values.akses_data && values.akses_data !== "unknown" && values.akses_data !== "Belum punya akses yang jelas") {
    const lbl = resolveOptionLabel("akses_data", values.akses_data);
    if (lbl && lbl !== "Belum punya akses yang jelas") {
      parts.push(`akses ${lbl.toLowerCase()}`);
    }
  }

  const avoidances = (values.avoidances || "").trim();
  if (avoidances.length > 0) {
    parts.push(`hindari ${avoidances}`);
  }

  if (values.target_waktu && values.target_waktu !== "unknown" && values.target_waktu !== "Belum tahu") {
    const lbl = resolveOptionLabel("target_waktu", values.target_waktu);
    if (lbl && lbl !== "Belum tahu") {
      parts.push(lbl.toLowerCase());
    }
  }

  return parts.join("; ");
}

/**
 * Assembles Canonical Prompt for Tool 1 (Cari Ide Skripsi - ChatGPT / Gemini).
 * Manifest ID: cari-ide-skripsi-v3
 */
export function assembleIdeaPrompt(
  tool: Tool,
  values: Record<string, string>
): string {
  const prodi = (values.prodi || values.programStudi || "").trim() || "Belum diketahui";
  const initialInterest = (values.minat || values.minatTopik || values.initial_interest || "").trim() || "Belum diketahui";

  let preferredApproach = "Belum diketahui";
  if (values.pendekatan && values.pendekatan !== "unknown" && values.pendekatan !== "Belum tahu") {
    const lbl = resolveOptionLabel("pendekatan", values.pendekatan);
    if (lbl && lbl !== "Belum tahu" && lbl !== "unknown") preferredApproach = lbl;
  }

  let preferredData = "Belum diketahui";
  const rawPreferensiData = values.preferensi_data || values.jenisData;
  if (rawPreferensiData && rawPreferensiData !== "unknown" && rawPreferensiData !== "Belum tahu") {
    const lbl = resolveOptionLabel("preferensi_data", rawPreferensiData);
    if (lbl && lbl !== "Belum tahu" && lbl !== "unknown") {
      preferredData = lbl;
    } else if (typeof rawPreferensiData === "string" && rawPreferensiData.trim().length > 0) {
      preferredData = rawPreferensiData.trim();
    }
  }

  let existingDataAccess = "Belum diketahui";
  if (values.akses_data && values.akses_data !== "unknown" && values.akses_data !== "Belum punya akses yang jelas") {
    const lbl = resolveOptionLabel("akses_data", values.akses_data);
    if (lbl && lbl !== "Belum punya akses yang jelas" && lbl !== "unknown") existingDataAccess = lbl;
  }

  const dataAccessNotes = (values.akses_data_catatan || "").trim() || "Belum diketahui";
  const avoidedActivities = (values.avoidances || values.kondisiBatasan || "").trim() || "Belum diketahui";

  let timeCondition = "Belum diketahui";
  if (values.target_waktu && values.target_waktu !== "unknown" && values.target_waktu !== "Belum tahu") {
    const lbl = resolveOptionLabel("target_waktu", values.target_waktu);
    if (lbl && lbl !== "Belum tahu" && lbl !== "unknown") timeCondition = lbl;
  }

  const otherConstraints = (values.constraints || "").trim() || "Belum diketahui";
  const supervisorDirection = (values.supervisor_direction || values.arahan_dosen || "").trim() || "Belum diketahui";

  const roleSection = `[PERAN]

Kamu adalah partner brainstorming akademik untuk mahasiswa S1.

Tugasmu membantu mahasiswa memahami beberapa area yang layak dieksplorasi berdasarkan konteksnya secara metodologis. Kamu tidak mengambil keputusan penelitian secara prematur.`;

  const contextSection = `[KONTEKS MAHASISWA]

- Program Studi: ${prodi}
- Minat atau Isu yang Menarik: ${initialInterest}
- Pendekatan yang Lebih Disukai: ${preferredApproach}
- Data yang Lebih Nyaman Digunakan: ${preferredData}
- Akses Data yang Sudah Dimiliki: ${existingDataAccess}
- Catatan Akses Data: ${dataAccessNotes}
- Hal yang Ingin Dihindari: ${avoidedActivities}
- Kondisi Waktu Pengerjaan: ${timeCondition}
- Batasan atau Kondisi Lain: ${otherConstraints}
- Arahan Dosen: ${supervisorDirection}`;

  const taskSection = `[TUGAS]

Buat tepat 3 AREA EKSPLORASI yang relevan dengan konteks mahasiswa dan masih cukup luas untuk diperiksa melalui pencarian fenomena empiris dan literatur akademik.

Tiga area harus memiliki fungsi pembanding yang nyata:
1. Satu paling dekat dengan minat awal (area_role: "CLOSEST_TO_ORIGINAL_INTEREST");
2. Satu berdekatan tetapi lebih realistis atau fisibel (area_role: "ADJACENT_MORE_FEASIBLE");
3. Satu alternatif paling aman terhadap batasan/constraint (area_role: "CONSTRAINT_SAFE_ALTERNATIVE").
Dilarang membuat tiga parafrasa dari rumpun yang sama.

Area eksplorasi bukan judul skripsi, bukan fenomena yang sudah terbukti, bukan research gap, bukan model penelitian final, dan bukan keputusan variabel.

Jika mahasiswa menyebut kandidat isu, gunakan sebagai petunjuk minat. Kandidat isu tersebut belum dianggap layak sebelum fenomena empiris, literatur, objek, akses data, dan ruang lingkup diperiksa.

Untuk setiap area:

1. Jelaskan cakupan area secara ringkas (scope_summary: maksimal 700 karakter).
2. Tentukan peran pembanding area (area_role): CLOSEST_TO_ORIGINAL_INTEREST | ADJACENT_MORE_FEASIBLE | CONSTRAINT_SAFE_ALTERNATIVE.
3. Analisis kesinambungan fokus terhadap minat awal (focus_continuity):
   * original_interest_elements: unsur minat awal mahasiswa;
   * retained_elements: unsur minat awal yang dipertahankan;
   * shifted_elements: unsur yang digeser atau diubah;
   * shift_status: SAME_CORE | ADJACENT_SHIFT | MAJOR_SHIFT;
   * explanation: jika area bergeser dari isu awal (misal dari trading/ChatGPT menuju kualitas laporan keuangan/respons pasar), tulis secara eksplisit bahwa fokus bergeser, bagian apa yang dipertahankan, bagian apa yang ditinggalkan, dan trade-off-nya.
4. Jelaskan hubungannya dengan minat mahasiswa (interest_connection: maksimal 500 karakter).
5. Jelaskan keterkaitannya dengan program studi (academic_connection: maksimal 500 karakter).
6. Klasifikasikan asal setiap bentuk data secara metodologis (setiap methodological_note maksimal 350 karakter):
   * PUBLIC_SECONDARY (data yang sudah tersedia publik sebelum riset, misal: laporan keuangan, annual report, harga saham, statistik resmi);
   * RESEARCHER_GENERATED (data yang dibuat atau dikumpulkan mahasiswa melalui prosedur penelitian, misal: output ChatGPT hasil prompt peneliti, hasil scoring/coding peneliti, simulasi);
   * PRIMARY_RESPONDENT (data dari manusia sebagai responden, misal: kuesioner, wawancara, focus group);
   * INSTITUTIONAL_METADATA (informasi institusional tentang penggunaan, kebijakan, atau regulasi).
   Catatan Keras: Output ChatGPT yang dibuat mahasiswa melalui prompt penelitian BUKAN data sekunder, melainkan RESEARCHER_GENERATED. Data researcher-generated tidak boleh dinilai selaras dengan preferensi 'data sekunder' tanpa catatan konflik. Jangan hanya mencantumkan data publik yang mudah ditemukan. Cantumkan pula data yang benar-benar dibutuhkan oleh inti area. Nilai berdasarkan data yang diperlukan untuk menjawab inti area, bukan berdasarkan keberadaan input publik.
7. Pisahkan konteks yang mungkin diamati ke dalam kategori (maksimal 6 item per daftar):
   * potential_actors: pihak atau subjek (misal: investor, analis, auditor, pengguna);
   * potential_entities: organisasi atau unit analisis (misal: perusahaan publik, KAP, bank, sektor industri);
   * potential_documents: sumber tekstual/kebijakan (misal: laporan tahunan, pengungkapan, surat edaran);
   * potential_data_artifacts: variabel/data terukur (misal: return saham, rasio keuangan, skor kepatuhan, output ChatGPT);
   * potential_geographies: wilayah atau negara (misal: Indonesia; jika belum ditentukan gunakan array kosong atau ['Belum ditentukan']).
8. Tentukan batas ruang lingkup (Scope Boundary):
   * in_scope: 2–6 hal yang masuk batasan;
   * out_of_scope: 2–6 hal yang berada di luar batasan;
   * boundary_note: catatan batas yang jelas.
9. Buat 2–4 arah pencarian fenomena empiris (phenomenon_search_directions) yang mencari kondisi dunia nyata dari sumber eksternal yang sudah tersedia. Arah fenomena tidak boleh meminta mahasiswa menghasilkan output AI, menjalankan prompt, membuat simulasi, melakukan scoring/coding, menyurvei responden, atau membandingkan data yang baru akan dibuat. DILARANG menanyakan penelitian terdahulu, literatur, jurnal, teori, atau research gap pada arah fenomena.
10. Pisahkan bibit pencarian literatur (Literature Search Seeds) untuk tahap berikutnya:
    * concepts: maksimal 8 konsep teoretis/akademis;
    * keywords_id: maksimal 10 kata kunci bahasa Indonesia;
    * keywords_en: maksimal 10 kata kunci bahasa Inggris.
11. Nilai kesesuaian terperinci terhadap batasan mahasiswa (constraint_fit & constraint_fit_assessment):
    * data_origin_fit: ALIGNED | NEEDS_CHECKING | CONFLICT (Area yang membutuhkan data buatan peneliti saat mahasiswa memilih data sekunder wajib dinilai CONFLICT atau NEEDS_CHECKING);
    * fieldwork_fit: ALIGNED | NEEDS_CHECKING | CONFLICT;
    * time_fit: ALIGNED | NEEDS_CHECKING | CONFLICT;
    * overall: SELARAS_SEMENTARA | PERLU_DIPERIKSA | BERISIKO;
    * reasons: alasan rinci penilaian kesesuaian.
12. Tuliskan hal yang belum pasti (unresolved_items: maksimal 6 item) dan hal yang belum boleh diputuskan (not_decided).`;

  const rulesSection = `[ATURAN AKADEMIK & LARANGAN EKSPLISIT]

1. Gunakan konteks yang sudah diberikan tanpa meminta mahasiswa mengulangnya.
2. Tampilkan tepat 3 area eksplorasi yang memiliki fungsi pembanding yang berbeda nyata (CLOSEST_TO_ORIGINAL_INTEREST, ADJACENT_MORE_FEASIBLE, CONSTRAINT_SAFE_ALTERNATIVE), bukan tiga parafrasa dari topik yang sama.
3. Dilarang membuat judul final, termasuk judul sementara atau tentatif. Gambaran calon judul pada research_shape_preview tetap hanya preview bentuk (menggunakan minimal dua placeholder dalam kurung siku), bukan judul final, dan harus mengikuti area tanpa menambah konstruk/metode.
4. Dilarang membuat research gap atau novelty.
5. Dilarang menulis latar belakang penelitian atau draft Bab 1.
6. Dilarang mengunci variabel, teori, hipotesis, metode, objek final, sampel, atau teknik analisis.
7. Preferensi pendekatan hanya constraint mahasiswa, bukan metode yang sudah tervalidasi.
8. Keinginan cepat selesai harus dipertimbangkan, tetapi jangan mengklaim area pasti cepat atau mudah.
9. Jangan mengklaim data pasti tersedia.
10. Jangan mengatakan topik belum pernah atau masih jarang diteliti.
11. Jangan mengarang sumber, jurnal, fakta, angka, atau fenomena empiris.
12. Petunjuk fenomena harus ditulis sebagai pertanyaan pemeriksaan empiris (kondisi nyata teramati).
13. Jangan membalik makna negasi (misal: 'gamau wawancara' tidak boleh menjadi 'wawancara').
14. Jangan memilih satu area secara otomatis untuk mahasiswa. Mahasiswa tetap bebas memilih sendiri atau meminta rekomendasi.
15. Jangan menghasilkan prompt untuk tahap selanjutnya.
16. Jangan menggunakan output ini sebagai bukti empiris.
17. Arah fenomena tidak boleh menanyakan literatur atau studi terdahulu; pisahkan pencarian literatur ke literature_search_seeds.
18. Output ChatGPT oleh mahasiswa harus diklasifikasikan sebagai RESEARCHER_GENERATED.
19. priority_source_types hanya boleh berisi: OFFICIAL_DATA, REGULATION, INSTITUTIONAL_REPORT, EMPIRICAL_ARTICLE, WORKING_PAPER, atau REPUTABLE_NEWS.
20. DILARANG memasukkan PUBLIC_SECONDARY, RESEARCHER_GENERATED, PRIMARY_RESPONDENT, atau INSTITUTIONAL_METADATA ke dalam priority_source_types.
21. Jangan membuat fenomena dengan menggabungkan dua kondisi yang sebenarnya berdiri sendiri.
22. Untuk data RESEARCHER_GENERATED, gunakan access_status: NEEDS_CHECKING.
23. Jangan memasukkan literature_search_seeds ke dalam objek handoff_to_phenomenon.
24. Field handoff_to_phenomenon.area_text (area handoff summary) maksimal 350 karakter, ringkas, mandiri, dan tetap menjelaskan batas area eksplorasi untuk form langkah berikutnya.
25. [GAYA BAHASA UNTUK MAHASISWA] Gunakan bahasa Indonesia yang dapat dipahami mahasiswa S1. Tetap akurat secara akademik, tetapi jelaskan istilah teknis saat pertama digunakan. Gunakan satu gagasan utama per kalimat. Hindari jargon jika ada padanan yang lebih sederhana. Jangan memakai nama enum atau field schema sebagai heading. Jika hasil analisis bersifat teknis, tambahkan implikasi singkat dengan pola "Artinya bagi penelitian ini: ...". Pertahankan source ID, status bukti, ketidakpastian, batas penggunaan, dan klaim terlarang. Jangan mengubah hasil sementara menjadi kepastian.`;

  const formatDataTransferSection = `[FORMAT KELUARAN — TRANSFER-ONLY]

Keluarkan tepat satu blok transfer JSON berikut secara utuh tanpa teks atau penjelasan naratif apa pun di luar marker:

=== BEGIN SKRIFLOW_IDEA_V3 ===
{
  "schema_version": 3,
  "areas": [
    {
      "id": "A01",
      "name": "Nama Area Eksplorasi 1 (bukan judul skripsi, maks 120 karakter)",
      "scope_summary": "Cakupan area eksplorasi secara ringkas (maks 700 karakter)",
      "area_role": "CLOSEST_TO_ORIGINAL_INTEREST|ADJACENT_MORE_FEASIBLE|CONSTRAINT_SAFE_ALTERNATIVE",
      "focus_continuity": {
        "original_interest_elements": ["Unsur minat awal"],
        "retained_elements": ["Unsur yang dipertahankan"],
        "shifted_elements": ["Unsur yang digeser"],
        "shift_status": "SAME_CORE|ADJACENT_SHIFT|MAJOR_SHIFT",
        "explanation": "Penjelasan kesinambungan atau pergeseran fokus dan trade-off-nya"
      },
      "academic_connection": "Keterkaitan area dengan program studi mahasiswa (maks 500 karakter)",
      "interest_connection": "Hubungan area dengan minat mahasiswa (maks 500 karakter)",
      "data_provenance": [
        {
          "data_form": "Nama bentuk data",
          "origin": "PUBLIC_SECONDARY|RESEARCHER_GENERATED|PRIMARY_RESPONDENT|INSTITUTIONAL_METADATA",
          "access_status": "INDICATED|NEEDS_CHECKING|NOT_CONFIRMED",
          "methodological_note": "Catatan metodologis ketersediaan dan sifat data (maks 350 karakter)"
        }
      ],
      "research_context": {
        "potential_actors": ["Maksimal 6 aktor relevan"],
        "potential_entities": ["Maksimal 6 entitas relevan"],
        "potential_documents": ["Maksimal 6 dokumen relevan"],
        "potential_data_artifacts": ["Maksimal 6 artefak data relevan"],
        "potential_geographies": ["Maksimal 6 wilayah atau ['Belum ditentukan']"]
      },
      "scope_boundary": {
        "in_scope": ["2–6 hal yang masuk batasan"],
        "out_of_scope": ["2–6 hal yang berada di luar batasan"],
        "boundary_note": "Catatan batas yang jelas"
      },
      "phenomenon_search_brief": "Petunjuk arah pemeriksaan fenomena empiris awal dari sumber eksternal",
      "phenomenon_search_directions": [
        {
          "label": "Arah 1",
          "direction_type": "ADOPTION|PRACTICE_CHANGE|OUTPUT_BEHAVIOR|ACCURACY_RELIABILITY|REGULATION|MARKET_PATTERN|DISCLOSURE_USE|DISCREPANCY|OTHER_OBSERVABLE",
          "search_question": "Pertanyaan pemeriksaan empiris nyata (bukan literatur/teori/eksperimen baru)",
          "observable_signals": ["Sinyal atau indikasi empiris teramati"],
          "priority_source_types": ["OFFICIAL_DATA|REGULATION|INSTITUTIONAL_REPORT|EMPIRICAL_ARTICLE|WORKING_PAPER|REPUTABLE_NEWS"]
        }
      ],
      "literature_search_seeds": {
        "concepts": ["Maksimal 8 konsep teoretis/akademis"],
        "keywords_id": ["Maksimal 10 kata kunci bahasa Indonesia"],
        "keywords_en": ["Maksimal 10 kata kunci bahasa Inggris"]
      },
      "research_shape_preview": {
        "possible_focus": "Kemungkinan fokus penelitian tanpa mengunci variabel atau metode",
        "likely_evidence_needed": ["2–5 jenis bukti yang kemungkinan harus tersedia"],
        "illustrative_title_pattern": "Evaluasi [aspek ...] dalam [konteks ...] pada [objek dan periode yang belum ditentukan].",
        "unresolved_before_title": [
          "Fenomena empiris",
          "Bukti literatur",
          "Akses data",
          "Objek atau cakupan",
          "Kelayakan metodologis"
        ],
        "warning": "Ilustrasi bentuk judul — belum layak diajukan ke dosen."
      },
      "constraint_fit": {
        "status": "SELARAS_SEMENTARA|PERLU_DIPERIKSA|BERISIKO",
        "reason": "Alasan penilaian kesesuaian",
        "assumptions": ["Maksimal 6 asumsi"],
        "risks": ["Maksimal 6 risiko"]
      },
      "constraint_fit_assessment": {
        "data_origin_fit": "ALIGNED|NEEDS_CHECKING|CONFLICT",
        "fieldwork_fit": "ALIGNED|NEEDS_CHECKING|CONFLICT",
        "time_fit": "ALIGNED|NEEDS_CHECKING|CONFLICT",
        "overall": "SELARAS_SEMENTARA|PERLU_DIPERIKSA|BERISIKO",
        "reasons": ["Alasan detail kesesuaian"]
      },
      "unresolved_items": ["Maksimal 6 hal yang belum pasti"],
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
        "area_text": "Ringkasan area mandiri dan jelas untuk langkah berikutnya (maks 350 karakter)",
        "actor_text": "Aktor teramati",
        "entity_text": "Entitas / objek teramati",
        "document_text": "Dokumen pendukung",
        "data_artifact_text": "Artefak data teramati",
        "initial_clue": "Petunjuk arah pemeriksaan fenomena awal",
        "observable_signals": ["Sinyal teramati"],
        "in_scope": ["Batas masuk"],
        "out_of_scope": ["Batas luar"],
        "priority_source_types": ["OFFICIAL_DATA|REGULATION|INSTITUTIONAL_REPORT|EMPIRICAL_ARTICLE|WORKING_PAPER|REPUTABLE_NEWS"]
      }
    }
  ],
  "comparison": [
    {
      "area_id": "A01",
      "interest_fit": "SANGAT_DEKAT|DEKAT|CUKUP_DEKAT|PERLU_DIPERIKSA",
      "study_program_fit": "KUAT|SEDANG|LEMAH|PERLU_DIPERIKSA",
      "data_fit": "SELARAS_SEMENTARA|PERLU_DIPERIKSA|BERISIKO",
      "collection_burden": "RENDAH_SEMENTARA|SEDANG|TINGGI|PERLU_DIPERIKSA",
      "methodological_uncertainty": "RENDAH|SEDANG|TINGGI|PERLU_DIPERIKSA",
      "main_check_next": "Pemeriksaan utama yang harus dilakukan berikutnya"
    }
  ],
  "selection_guidance": [
    "Panduan pemilihan ringkas untuk membantu mahasiswa mempertimbangkan area"
  ]
}
=== END SKRIFLOW_IDEA_V3 ===

Instruksi format dan batas ketat:
- Tidak boleh menulis uraian sebelum marker === BEGIN SKRIFLOW_IDEA_V3 ===.
- Tidak boleh menulis uraian setelah marker === END SKRIFLOW_IDEA_V3 ===.
- Tidak boleh memakai Markdown code fence (\`\`\`json ... \`\`\`).
- Tidak boleh mengulang hasil dalam format naratif atau tabel Markdown.
- Tidak boleh meng-escape underscore marker (tulis persis === BEGIN SKRIFLOW_IDEA_V3 ===).
- Tidak boleh mengganti versi marker.
- Tidak boleh memotong JSON.
- Pastikan JSON valid (double quote, tanpa komentar, tanpa trailing comma).
- Keluarkan tepat satu blok transfer. Seluruh penjelasan untuk mahasiswa akan dirender oleh aplikasi dari JSON. Jangan menulis versi naratif atau tabel Markdown.`;

  return [
    roleSection,
    contextSection,
    taskSection,
    rulesSection,
    formatDataTransferSection,
  ]
    .join("\n\n")
    .replace(/\bundefined\b/g, "Belum diketahui")
    .replace(/\bnull\b/g, "Belum diketahui")
    .replace(/\[object Object\]/g, "");
}

/**
 * Assembles Revision Alternative Prompt for Tool 1 (Cari Ide Skripsi V3) based on student rejection feedback.
 */
export function assembleTool1AlternativePrompt(
  tool: Tool,
  values: Record<string, string>,
  rejectionRound: import("@/types/tool").RejectedAreaRound
): string {
  const reasonLabels: Record<string, string> = {
    INTEREST_MISMATCH: "Kurang sesuai dengan minat mahasiswa",
    STUDY_PROGRAM_MISMATCH: "Terlalu jauh dari program studi",
    DATA_DISCOMFORT: "Jenis datanya kurang nyaman",
    ACCESS_UNCLEAR: "Akses datanya tidak jelas",
    TOO_COMPLEX: "Kelihatannya terlalu rumit",
    TOO_HEAVY: "Beban pengerjaannya terlalu berat",
    RESPONDENT_OR_FIELDWORK: "Terlalu membutuhkan responden atau lapangan",
    LECTURER_DIRECTION_MISMATCH: "Kurang sesuai dengan arahan dosen",
    AREAS_TOO_SIMILAR: "Area-area sebelumnya terlalu mirip satu sama lain",
    OTHER: "Alasan lain",
  };

  const rejectedAreasText =
    rejectionRound.rejectedAreas.length > 0
      ? rejectionRound.rejectedAreas.map((a) => `- ${a.areaId}: ${a.areaName}`).join("\n")
      : "- Seluruh area pada putaran sebelumnya";

  const reasonsText =
    rejectionRound.reasons.length > 0
      ? rejectionRound.reasons.map((r) => `- ${reasonLabels[r] || r}`).join("\n")
      : "- Mahasiswa menginginkan arah eksplorasi alternatif yang berbeda";

  const noteText = rejectionRound.additionalNote.trim()
    ? `- ${rejectionRound.additionalNote.trim()}`
    : "- Tidak ada catatan tambahan";

  const feedbackSection = `[UMPAN BALIK PUTARAN SEBELUMNYA]

Mahasiswa belum memilih area dari hasil sebelumnya.

Area yang ditolak:
${rejectedAreasText}

Alasan:
${reasonsText}

Catatan tambahan:
${noteText}

Buat tepat 3 area alternatif yang secara substantif menanggapi umpan balik tersebut.

Jangan mengulang area lama hanya dengan:
- mengganti sinonim;
- memperpendek nama;
- menukar urutan kata;
- mengubah nama variabel tanpa mengubah fokus;
- memperluas atau mempersempit area secara kosmetik.

Jika constraints mahasiswa saling bertentangan sehingga alternatif yang wajar tidak dapat dibuat, jangan mengarang. Jelaskan kondisi mana yang perlu diperjelas.`;

  const basePrompt = assembleIdeaPrompt(tool, values);
  const taskIndex = basePrompt.indexOf("[TUGAS]");
  if (taskIndex !== -1) {
    return (
      basePrompt.slice(0, taskIndex) +
      feedbackSection +
      "\n\n" +
      basePrompt.slice(taskIndex)
    );
  }

  return `${basePrompt}\n\n${feedbackSection}`;
}

export type PromptProjectionField =
  | "prioritas_sumber"
  | "rentang_publikasi"
  | "kata_kunci"
  | "fokus_literatur"
  | "hal_belum_ditentukan";

export interface ProjectedPromptValue {
  original: string;
  projected: string;
  originalLength: number;
  projectedLength: number;
  wasCompacted: boolean;
}

export interface LiteraturePromptInput {
  prodi?: string;
  area?: string;
  area_eksplorasi?: string;
  fenomena?: string;
  fenomena_awal?: string;
  prioritas_sumber?: string;
  rentang_publikasi?: string;
  rentang_tahun?: string;
  kata_kunci?: string;
  fokus_literatur?: string;
  fokus_aspek?: string;
  hal_belum_ditentukan?: string;
  hal_terbuka?: string;
}

export interface PromptAssemblyResult {
  prompt: string;
  totalLength: number;
  limit: 3900;
  remaining: number;
  isValid: boolean;
  phenomenonLength: number;
  phenomenonPreserved: boolean;
  compactedFields: PromptProjectionField[];
  breakdown: {
    staticText: number;
    essentialContext: number;
    optionalContext: number;
  };
}

/**
 * Normalizes all line endings to LF (\n).
 */
export function normalizePromptLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

/**
 * Helper to compact optional context (P1) deterministically at sentence or word boundaries.
 * Invariants:
 * 1. Form and storage values are NEVER mutated.
 * 2. Essential context (Prodi, Area, Fenomena) is NEVER passed to this helper.
 * 3. Does not slice in the middle of a word unless a single word exceeds maxLength.
 */
export function projectOptionalText(
  value: string | undefined | null,
  maxLength: number
): ProjectedPromptValue {
  if (!value) {
    return {
      original: "",
      projected: "",
      originalLength: 0,
      projectedLength: 0,
      wasCompacted: false,
    };
  }

  const original = value.trim();
  const originalLength = countPromptCharacters(original);

  if (originalLength <= maxLength) {
    return {
      original,
      projected: original,
      originalLength,
      projectedLength: originalLength,
      wasCompacted: false,
    };
  }

  // Need compaction to fit in maxLength (including '...')
  const targetSliceLen = Math.max(0, maxLength - 3);
  const slice = original.slice(0, targetSliceLen);

  // Look for sentence/clause boundary (. , ; !)
  const lastClause = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("; "),
    slice.lastIndexOf(", ")
  );
  let compacted = "";
  if (lastClause > targetSliceLen * 0.4) {
    compacted = slice.slice(0, lastClause + 1).trim() + "...";
  } else {
    const lastSpace = slice.lastIndexOf(" ");
    if (lastSpace > targetSliceLen * 0.4) {
      compacted = slice.slice(0, lastSpace).trim() + "...";
    } else {
      compacted = slice.trim() + "...";
    }
  }

  // Ensure projected length <= maxLength
  if (countPromptCharacters(compacted) > maxLength) {
    compacted = Array.from(compacted).slice(0, maxLength).join("");
  }

  return {
    original,
    projected: compacted,
    originalLength,
    projectedLength: countPromptCharacters(compacted),
    wasCompacted: true,
  };
}

/**
 * Assembles Canonical Prompt A for Tool 3 (NotebookLM Source Discovery & Import).
 * Manifest ID: literature-source-search-a
 */
export function assembleLiteraturePromptA(
  input: LiteraturePromptInput
): PromptAssemblyResult {
  const prodi = (input.prodi || "").trim();
  const area = (input.area || input.area_eksplorasi || "").trim();
  const fenomena = (input.fenomena || input.fenomena_awal || "").trim();

  const rawPrioritas = input.prioritas_sumber
    ? resolvePrioritasSumberPrompt(input.prioritas_sumber)
    : "";
  const rawRentang = (input.rentang_publikasi || input.rentang_tahun || "").trim();
  const rawKataKunci = (input.kata_kunci || "").trim();
  const rawFokus = (input.fokus_literatur || input.fokus_aspek || "").trim();
  const rawLainnya = (input.hal_belum_ditentukan || input.hal_terbuka || "").trim();

  const contextLines: string[] = [
    `Prodi: ${prodi}`,
    `Area: ${area}`,
    `Fenomena: ${fenomena}`,
  ];

  if (rawPrioritas.length > 0) {
    contextLines.push(`Prioritas: ${rawPrioritas}`);
  }
  if (rawRentang.length > 0) {
    contextLines.push(`Rentang: ${rawRentang}`);
  }
  if (rawKataKunci.length > 0) {
    contextLines.push(`Kata Kunci: ${rawKataKunci}`);
  }
  if (rawFokus.length > 0) {
    contextLines.push(`Fokus: ${rawFokus}`);
  }
  if (rawLainnya.length > 0) {
    contextLines.push(`Belum Ditentukan: ${rawLainnya}`);
  }

  const contextBlock = contextLines.join("\n");

  const template = `Cari 15-25 artikel akademik individual via Deep Research (jangan paksa kuota):
${contextBlock}

Sensor:
1. Tolak Research Report AI/dokumen gabungan. Utamakan peer-reviewed; labeli review/SLR, preprint, working paper, tesis.
2. Full-text wajib: empiris ada metode & hasil; review/SLR ada metode & sintesis. Hanya PDF/HTML berbadan artikel. Tolak abstrak/metadata/landing page.
3. Tolak error/login/paywall/CAPTCHA/Cloudflare/naskah parsial.
4. Jangan karang identitas (judul/penulis/tahun/jurnal/DOI/URL). Cocokkan ke metadata resmi.
5. Pilih hanya sumber cocok pada fenomena/fokus. Beda event/outcome bukan inti.
6. Deduplikasi; pakai versi terbaik (PDF legal penerbit/repositori/manuscript/arXiv).
7. Semua metode artikel boleh masuk jika relevan & full-text.
8. Tolak withdrawn/retracted resmi.

Larangan:
- Dilarang membuat sintesis, gap, novelty, judul, variabel final, atau draft Bab 1.

Output:
- Source Import Cards native hanya kandidat; jangan ganti teks lain.
- Jangan auto-import. Tinjau tautan; pilih PDF/HTML utuh; jangan pilih Research Report.
- Tampilkan seluruh kartu valid (1-2: awal kerangka; 3-5: kerangka sementara; 6-8: draft sehat). Jangan STOP sebelum hasil ditampilkan.
- Tulis statistik singkat (jumlah valid & catatan aspek yang kurang), lalu STOP.`;

  const finalPrompt = normalizePromptLineEndings(template.trim())
    .replace(/\bundefined\b/g, "")
    .replace(/\bnull\b/g, "")
    .replace(/\[object Object\]/g, "");

  const totalLength = countPromptCharacters(finalPrompt);

  // Static text measurement (empty values with all 8 lines)
  const staticTemplate = `Cari 15-25 artikel akademik individual via Deep Research (jangan paksa kuota):
Prodi: 
Area: 
Fenomena: 
Prioritas: 
Rentang: 
Kata Kunci: 
Fokus: 
Belum Ditentukan: 

Sensor:
1. Tolak Research Report AI/dokumen gabungan. Utamakan peer-reviewed; labeli review/SLR, preprint, working paper, tesis.
2. Full-text wajib: empiris ada metode & hasil; review/SLR ada metode & sintesis. Hanya PDF/HTML berbadan artikel. Tolak abstrak/metadata/landing page.
3. Tolak error/login/paywall/CAPTCHA/Cloudflare/naskah parsial.
4. Jangan karang identitas (judul/penulis/tahun/jurnal/DOI/URL). Cocokkan ke metadata resmi.
5. Pilih hanya sumber cocok pada fenomena/fokus. Beda event/outcome bukan inti.
6. Deduplikasi; pakai versi terbaik (PDF legal penerbit/repositori/manuscript/arXiv).
7. Semua metode artikel boleh masuk jika relevan & full-text.
8. Tolak withdrawn/retracted resmi.

Larangan:
- Dilarang membuat sintesis, gap, novelty, judul, variabel final, atau draft Bab 1.

Output:
- Source Import Cards native hanya kandidat; jangan ganti teks lain.
- Jangan auto-import. Tinjau tautan; pilih PDF/HTML utuh; jangan pilih Research Report.
- Tampilkan seluruh kartu valid (1-2: awal kerangka; 3-5: kerangka sementara; 6-8: draft sehat). Jangan STOP sebelum hasil ditampilkan.
- Tulis statistik singkat (jumlah valid & catatan aspek yang kurang), lalu STOP.`;

  const staticText = countPromptCharacters(normalizePromptLineEndings(staticTemplate.trim()));
  const essentialContext = countPromptCharacters(prodi) + countPromptCharacters(area) + countPromptCharacters(fenomena);
  const optionalContext =
    countPromptCharacters(rawPrioritas) +
    countPromptCharacters(rawRentang) +
    countPromptCharacters(rawKataKunci) +
    countPromptCharacters(rawFokus) +
    countPromptCharacters(rawLainnya);

  const phenomenonLength = countPromptCharacters(fenomena);
  const phenomenonPreserved = fenomena.length === 0 || finalPrompt.includes(fenomena);
  const isValid = totalLength <= NOTEBOOKLM_LIMITS.hardLimit;

  return {
    prompt: finalPrompt,
    totalLength,
    limit: 3900,
    remaining: Math.max(0, 3900 - totalLength),
    isValid,
    phenomenonLength,
    phenomenonPreserved,
    compactedFields: [],
    breakdown: {
      staticText,
      essentialContext,
      optionalContext,
    },
  };
}

/**
 * Assembles Canonical Prompt B for Tool 3 (NotebookLM Evidence Extraction).
 * Manifest ID: literature-synthesis-b
 */
export function assembleLiteraturePromptB(
  input: LiteraturePromptInput
): PromptAssemblyResult {
  const prodi = (input.prodi || "").trim();
  const area = (input.area || input.area_eksplorasi || "").trim();
  const fenomena = (input.fenomena || input.fenomena_awal || "").trim();

  const rawFokus = (input.fokus_literatur || input.fokus_aspek || "").trim();
  const rawLainnya = (input.hal_belum_ditentukan || input.hal_terbuka || "").trim();

  const compactedFields: PromptProjectionField[] = [];

  // Project optional fields with projection limits: 500, 250
  const projFokus = projectOptionalText(rawFokus, 500);
  if (projFokus.wasCompacted) compactedFields.push("fokus_literatur");

  const projLainnya = projectOptionalText(rawLainnya, 250);
  if (projLainnya.wasCompacted) compactedFields.push("hal_belum_ditentukan");

  const contextLines: string[] = [
    `Prodi: ${prodi || "Belum diketahui"} | Area: ${area || "Belum diketahui"}`,
    `Fenomena: ${fenomena || "Belum diketahui"}`,
  ];

  if (projFokus.projected.length > 0) {
    contextLines.push(`Fokus: ${projFokus.projected}`);
  }
  if (projLainnya.projected.length > 0) {
    contextLines.push(`Lainnya: ${projLainnya.projected}`);
  }

  const contextBlock = contextLines.join("\n");

  const template = `Audit sumber individual notebook dan susun Paket Bukti.
${contextBlock}

KELAYAKAN & PRINSIP:
- Artikel empiris cukup jika metode/konteks data & hasil utamanya terbaca untuk dikutip; review/SLR cukup jika metode tinjauan & sintesisnya terkenali.
- Kategori sumber:
  * INTI: relevan langsung, metode/hasil terbaca.
  * PENDUKUNG (maks. 5): tak langsung / konteks teori / metode.
  * PERLU CEK MANUAL: metadata/akses butuh konfirmasi.
  * ABAIKAN: Research Report AI, duplikat, retracted, atau tanpa badan artikel.
- Jika INTI <8: tetap susun Paket Bukti sementara dari sumber valid; jelaskan yang kurang, jangan STOP.

LARANGAN KERAS:
- Dilarang mengarang sumber atau klaim tanpa sitasi.
- Dilarang membuat gap otomatis, kesimpulan final, judul, novelty, variabel final, atau klaim kausal di luar sumber.
- Dilarang menggunakan Research Report AI sebagai artikel akademik.
- Jangan kata "membuktikan". Pakai: "penelitian melaporkan", "hasil analisis menunjukkan", atau batasi ke sampel/periode.

OUTPUT:
1. REKONSILIASI
INTI + PENDUKUNG + PERLU CEK MANUAL + ABAIKAN = TOTAL NOTEBOOK. Cantumkan jumlah, ID, dan alasannya.

2. SOURCE REGISTER
ID | Kategori | Judul | Penulis-tahun | Jenis | Publikasi | Metode/sampel | Bukti keterbacaan.
Review/SLR bukan bukti empiris independen; labeli preprint/working paper/tesis.

3. MATRIKS BUKTI (maks. 16)
ID | Fungsi | Klaim netral (tanpa kata "membuktikan") | ID sumber + sitasi native NotebookLM | Lokasi (ragu: TIDAK DAPAT DIPASTIKAN) | Konteks | Batas penggunaan.
Satu klaim-satu sumber; tanpa sitasi dilarang.

4. PERBANDINGAN
Bandingkan hanya jika setara; jika tidak, tulis "tidak dapat dibandingkan langsung".

5. PENUTUP
"Paket bukti sementara disusun; keputusan penelitian belum ditetapkan. STOP."`;

  const finalPrompt = normalizePromptLineEndings(template.trim())
    .replace(/\bundefined\b/g, "Belum diketahui")
    .replace(/\bnull\b/g, "Belum diketahui")
    .replace(/\[object Object\]/g, "");

  const totalLength = countPromptCharacters(finalPrompt);

  const staticTemplate = `Audit sumber individual notebook dan susun Paket Bukti.
Prodi:  | Area: 
Fenomena: 

KELAYAKAN & PRINSIP:
- Artikel empiris cukup jika metode/konteks data & hasil utamanya terbaca untuk dikutip; review/SLR cukup jika metode tinjauan & sintesisnya terkenali.
- Kategori sumber:
  * INTI: relevan langsung, metode/hasil terbaca.
  * PENDUKUNG (maks. 5): tak langsung / konteks teori / metode.
  * PERLU CEK MANUAL: metadata/akses butuh konfirmasi.
  * ABAIKAN: Research Report AI, duplikat, retracted, atau tanpa badan artikel.
- Jika INTI <8: tetap susun Paket Bukti sementara dari sumber valid; jelaskan yang kurang, jangan STOP.

LARANGAN KERAS:
- Dilarang mengarang sumber atau klaim tanpa sitasi.
- Dilarang membuat gap otomatis, kesimpulan final, judul, novelty, variabel final, atau klaim kausal di luar sumber.
- Dilarang menggunakan Research Report AI sebagai artikel akademik.
- Jangan kata "membuktikan". Pakai: "penelitian melaporkan", "hasil analisis menunjukkan", atau batasi ke sampel/periode.

OUTPUT:
1. REKONSILIASI
INTI + PENDUKUNG + PERLU CEK MANUAL + ABAIKAN = TOTAL NOTEBOOK. Cantumkan jumlah, ID, dan alasannya.

2. SOURCE REGISTER
ID | Kategori | Judul | Penulis-tahun | Jenis | Publikasi | Metode/sampel | Bukti keterbacaan.
Review/SLR bukan bukti empiris independen; labeli preprint/working paper/tesis.

3. MATRIKS BUKTI (maks. 16)
ID | Fungsi | Klaim netral (tanpa kata "membuktikan") | ID sumber + sitasi native NotebookLM | Lokasi (ragu: TIDAK DAPAT DIPASTIKAN) | Konteks | Batas penggunaan.
Satu klaim-satu sumber; tanpa sitasi dilarang.

4. PERBANDINGAN
Bandingkan hanya jika setara; jika tidak, tulis "tidak dapat dibandingkan langsung".

5. PENUTUP
"Paket bukti sementara disusun; keputusan penelitian belum ditetapkan. STOP."`;

  const staticText = countPromptCharacters(normalizePromptLineEndings(staticTemplate.trim()));
  const essentialContext = countPromptCharacters(prodi) + countPromptCharacters(area) + countPromptCharacters(fenomena);
  const optionalContext = projFokus.projectedLength + projLainnya.projectedLength;

  const phenomenonLength = countPromptCharacters(fenomena);
  const phenomenonPreserved = fenomena.length === 0 || finalPrompt.includes(fenomena);
  const isValid = totalLength <= NOTEBOOKLM_LIMITS.hardLimit;

  return {
    prompt: finalPrompt,
    totalLength,
    limit: 3900,
    remaining: Math.max(0, 3900 - totalLength),
    isValid,
    phenomenonLength,
    phenomenonPreserved,
    compactedFields,
    breakdown: {
      staticText,
      essentialContext,
      optionalContext,
    },
  };
}

/**
 * Backwards compatible assemblePromptA
 */
export function assemblePromptA(tool: Tool, values: Record<string, string>): string {
  return assembleLiteraturePromptA(values).prompt;
}

/**
 * Backwards compatible assemblePromptB
 */
export function assemblePromptB(
  tool: Tool,
  values: Record<string, string>
): string {
  return assembleLiteraturePromptB(values).prompt;
}

/**
 * Analyzes Prompt A metrics, dynamic context breakdown, and longest fields.
 */
export function analyzePromptA(
  tool: Tool,
  values: Record<string, string>
): PromptAnalysis {
  const result = assembleLiteraturePromptA(values);
  const finalLength = result.totalLength;
  const staticTemplateLength = result.breakdown.staticText;
  const essentialContextLength = result.breakdown.essentialContext;
  const optionalContextLength = result.breakdown.optionalContext;
  const dynamicContextLength = Math.max(0, finalLength - staticTemplateLength);
  const remainingLength = Math.max(0, NOTEBOOKLM_LIMITS.hardLimit - finalLength);
  const safetyBuffer = NOTEBOOKLM_LIMITS.safetyBufferA;

  let status: PromptBudgetStatus = getPromptBudgetStatus(finalLength);
  if (staticTemplateLength > NOTEBOOKLM_LIMITS.maxStaticTemplateA) {
    status = "TEMPLATE_OVERFLOW";
  } else if (staticTemplateLength + essentialContextLength > NOTEBOOKLM_LIMITS.hardLimit) {
    status = "ESSENTIAL_CONTEXT_OVERFLOW";
  } else if (finalLength > NOTEBOOKLM_LIMITS.hardLimit) {
    status = "BLOCKED";
  } else if (result.compactedFields.length > 0) {
    status = "READY_WITH_OPTIONAL_COMPACTION";
  }

  const breakdown: PromptBudgetBreakdown = {
    limit: NOTEBOOKLM_LIMITS.hardLimit,
    staticTemplate: staticTemplateLength,
    essentialContext: essentialContextLength,
    optionalContext: optionalContextLength,
    separatorsAndLabels: 0,
    safetyBuffer,
    total: finalLength,
    remaining: remainingLength,
    status,
    isOptionalCompacted: result.compactedFields.length > 0,
    compactedFields: result.compactedFields,
    phenomenonLength: result.phenomenonLength,
    maxPhenomenonLength: NOTEBOOKLM_LIMITS.maxPhenomenonLength,
  };

  const fieldList: DynamicFieldBreakdown[] = [];
  if (tool.fields) {
    for (const field of tool.fields) {
      const val = (values[field.id] || "").trim();
      if (val.length > 0) {
        fieldList.push({
          id: field.id,
          label: field.label,
          value: val,
          length: countPromptCharacters(val),
        });
      }
    }
  }

  fieldList.sort((a, b) => b.length - a.length);
  const longestField = fieldList.length > 0 ? fieldList[0] : null;

  return {
    promptId: "literature-source-search-a",
    staticTemplateLength,
    dynamicContextLength,
    essentialContextLength,
    optionalContextLength,
    separatorsAndLabelsLength: 0,
    safetyBuffer,
    remainingLength,
    finalLength,
    safeTarget: NOTEBOOKLM_LIMITS.safeTarget,
    hardLimit: NOTEBOOKLM_LIMITS.hardLimit,
    status,
    isOptionalCompacted: result.compactedFields.length > 0,
    phenomenonLength: result.phenomenonLength,
    maxPhenomenonLength: NOTEBOOKLM_LIMITS.maxPhenomenonLength,
    breakdown,
    longestField,
    fields: fieldList,
  };
}

/**
 * Analyzes Prompt B metrics, dynamic context breakdown, and longest fields.
 */
export function analyzePromptB(
  tool: Tool,
  values: Record<string, string>
): PromptAnalysis {
  const result = assembleLiteraturePromptB(values);
  const finalLength = result.totalLength;
  const staticTemplateLength = result.breakdown.staticText;
  const essentialContextLength = result.breakdown.essentialContext;
  const optionalContextLength = result.breakdown.optionalContext;
  const dynamicContextLength = Math.max(0, finalLength - staticTemplateLength);
  const remainingLength = Math.max(0, NOTEBOOKLM_LIMITS.hardLimit - finalLength);
  const safetyBuffer = NOTEBOOKLM_LIMITS.safetyBufferB;

  let status: PromptBudgetStatus = getPromptBudgetStatus(finalLength);
  if (staticTemplateLength > NOTEBOOKLM_LIMITS.maxStaticTemplateB) {
    status = "TEMPLATE_OVERFLOW";
  } else if (staticTemplateLength + essentialContextLength > NOTEBOOKLM_LIMITS.hardLimit) {
    status = "ESSENTIAL_CONTEXT_OVERFLOW";
  } else if (finalLength > NOTEBOOKLM_LIMITS.hardLimit) {
    status = "BLOCKED";
  } else if (result.compactedFields.length > 0) {
    status = "READY_WITH_OPTIONAL_COMPACTION";
  }

  const breakdown: PromptBudgetBreakdown = {
    limit: NOTEBOOKLM_LIMITS.hardLimit,
    staticTemplate: staticTemplateLength,
    essentialContext: essentialContextLength,
    optionalContext: optionalContextLength,
    separatorsAndLabels: 0,
    safetyBuffer,
    total: finalLength,
    remaining: remainingLength,
    status,
    isOptionalCompacted: result.compactedFields.length > 0,
    compactedFields: result.compactedFields,
    phenomenonLength: result.phenomenonLength,
    maxPhenomenonLength: NOTEBOOKLM_LIMITS.maxPhenomenonLength,
  };

  const fieldList: DynamicFieldBreakdown[] = [];
  const prodi = (values.prodi || "").trim();
  const area = (values.area_eksplorasi || "").trim();
  const fenomena = (values.fenomena_awal || "").trim();
  const rawFocus = (values.fokus_aspek || "").trim();
  const rawOpen = (values.hal_terbuka || "").trim();

  if (prodi) fieldList.push({ id: "prodi", label: "Program Studi", value: prodi, length: countPromptCharacters(prodi) });
  if (area) fieldList.push({ id: "area_eksplorasi", label: "Area Eksplorasi", value: area, length: countPromptCharacters(area) });
  if (fenomena) fieldList.push({ id: "fenomena_awal", label: "Fenomena Awal", value: fenomena, length: countPromptCharacters(fenomena) });
  if (rawFocus) fieldList.push({ id: "fokus_aspek", label: "Fokus Aspek", value: rawFocus, length: countPromptCharacters(rawFocus) });
  if (rawOpen) fieldList.push({ id: "hal_terbuka", label: "Hal Belum Ditentukan", value: rawOpen, length: countPromptCharacters(rawOpen) });

  fieldList.sort((a, b) => b.length - a.length);
  const longestField = fieldList.length > 0 ? fieldList[0] : null;

  return {
    promptId: "literature-synthesis-b",
    staticTemplateLength,
    dynamicContextLength,
    essentialContextLength,
    optionalContextLength,
    separatorsAndLabelsLength: 0,
    safetyBuffer,
    remainingLength,
    finalLength,
    safeTarget: NOTEBOOKLM_LIMITS.safeTarget,
    hardLimit: NOTEBOOKLM_LIMITS.hardLimit,
    status,
    isOptionalCompacted: result.compactedFields.length > 0,
    phenomenonLength: result.phenomenonLength,
    maxPhenomenonLength: NOTEBOOKLM_LIMITS.maxPhenomenonLength,
    breakdown,
    longestField,
    fields: fieldList,
  };
}

/**
 * Returns both Prompt A and Prompt B for Tool 3.
 */
export function assembleTool2Prompts(
  tool: Tool,
  values: Record<string, string>
): { promptA: string; promptB: string } {
  return {
    promptA: assemblePromptA(tool, values),
    promptB: assemblePromptB(tool, values),
  };
}

/**
 * Deterministically assembles a structured academic prompt from tool configuration and user inputs.
 */
export function assemblePrompt(
  tool: Tool,
  values: Record<string, string>,
  options?: { stage?: "A" | "B" }
): string {
  // Tool 1 (Cari Ide Skripsi) uses structured V2 idea prompt
  if (tool.slug === "cari-ide-skripsi") {
    return assembleIdeaPrompt(tool, values);
  }

  // Tool 3 (Cari Literatur Awal) uses two-stage NotebookLM generation
  if (tool.slug === "cari-literatur-awal" || tool.targetPlatform === "NotebookLM") {
    if (options?.stage === "B") {
      return assemblePromptB(tool, values);
    }
    return assemblePromptA(tool, values);
  }

  // Tool 2 (Cari & Validasi Fenomena)
  if (tool.slug === "cari-fenomena-awal" || tool.slug === "cari-validasi-fenomena") {
    const sharedCtx: Record<string, string> = {};
    let t1Ctx: Record<string, string> = {};
    try {
      const rawShared = loadSharedResearchContext();
      if (rawShared && typeof rawShared === "object") {
        Object.entries(rawShared).forEach(([k, v]) => {
          if (typeof v === "string") sharedCtx[k] = v;
        });
      }
      const rawT1 = loadToolData("cari-ide-skripsi");
      if (rawT1 && typeof rawT1 === "object") {
        t1Ctx = rawT1;
      }
    } catch {
      // ignore
    }

    const prodi = (values.prodi || sharedCtx.prodi || t1Ctx.prodi || t1Ctx.programStudi || "").trim() || "Belum diketahui";
    const area = (values.area_eksplorasi || sharedCtx.area_eksplorasi || sharedCtx.selectedArea || "").trim() || "Belum ditentukan";
    const cakupan = resolveOptionLabel("cakupan_fenomena", values.cakupan_fenomena || "unknown") || "Belum tahu";
    const objekAwal = (values.objek_awal || "").trim() || "Belum diketahui";
    const petunjukFenomena = (values.petunjuk_fenomena || "").trim() || "Belum diketahui";
    const rentang = resolveOptionLabel("rentang_fenomena", values.rentang_fenomena || "five_years") || "Utamakan 5 tahun terakhir";
    const currentDate = getLocalCurrentDate(values.current_date || values.tanggal_pencarian);

    const preferensiParts: string[] = [];

    // 1. Pendekatan
    const rawPendekatan = values.pendekatan || sharedCtx.pendekatan || t1Ctx.pendekatan;
    if (rawPendekatan && rawPendekatan !== "unknown" && rawPendekatan !== "Belum tahu") {
      const lbl = resolveOptionLabel("pendekatan", rawPendekatan);
      if (lbl && lbl !== "Belum tahu" && lbl !== "unknown") {
        preferensiParts.push(`Pendekatan: ${lbl}`);
      }
    }

    // 2. Data yang nyaman
    const rawPreferensiData = values.preferensi_data || sharedCtx.preferensi_data || t1Ctx.preferensi_data || t1Ctx.jenisData;
    if (rawPreferensiData && rawPreferensiData !== "unknown" && rawPreferensiData !== "Belum tahu") {
      const lbl = resolveOptionLabel("preferensi_data", rawPreferensiData);
      if (lbl && lbl !== "Belum tahu" && lbl !== "unknown") {
        preferensiParts.push(`Data yang nyaman: ${lbl}`);
      } else if (typeof rawPreferensiData === "string" && rawPreferensiData.trim().length > 0) {
        preferensiParts.push(`Data yang nyaman: ${rawPreferensiData.trim()}`);
      }
    }

    // 3. Akses data
    const rawAksesData = values.akses_data || sharedCtx.akses_data || t1Ctx.akses_data;
    if (rawAksesData && rawAksesData !== "unknown" && rawAksesData !== "Belum punya akses yang jelas") {
      const lbl = resolveOptionLabel("akses_data", rawAksesData);
      if (lbl && lbl !== "Belum punya akses yang jelas" && lbl !== "unknown") {
        preferensiParts.push(`Akses data: ${lbl}`);
      }
    }

    // 4. Catatan akses data
    const rawCatatanAkses = values.akses_data_catatan || sharedCtx.akses_data_catatan || t1Ctx.akses_data_catatan;
    if (typeof rawCatatanAkses === "string" && rawCatatanAkses.trim().length > 0 && rawCatatanAkses.trim() !== "unknown") {
      preferensiParts.push(`Catatan akses: ${rawCatatanAkses.trim()}`);
    }

    // 5. Hal yang dihindari (Avoidances / kondisiBatasan) - Preserves exact negation
    const rawAvoidances = values.avoidances || sharedCtx.avoidances || t1Ctx.avoidances || t1Ctx.kondisiBatasan;
    if (typeof rawAvoidances === "string" && rawAvoidances.trim().length > 0 && rawAvoidances.trim() !== "unknown") {
      preferensiParts.push(`Hal yang dihindari: ${rawAvoidances.trim()}`);
    }

    // 6. Kondisi waktu pengerjaan
    const rawTargetWaktu = values.target_waktu || sharedCtx.target_waktu || t1Ctx.target_waktu;
    if (rawTargetWaktu && rawTargetWaktu !== "unknown" && rawTargetWaktu !== "Belum tahu") {
      const lbl = resolveOptionLabel("target_waktu", rawTargetWaktu);
      if (lbl && lbl !== "Belum tahu" && lbl !== "unknown") {
        preferensiParts.push(`Kondisi waktu: ${lbl}`);
      }
    }

    const preferensiContext = preferensiParts.length > 0 ? preferensiParts.join("; ") : "Belum diketahui";
    const arahanDosen = (values.arahan_dosen || values.supervisor_direction || sharedCtx.supervisor_direction || t1Ctx.supervisor_direction || t1Ctx.arahan_dosen || "").trim() || "Belum diketahui";

    // Optional additional structured context from Tool 1 handoff / selected exploration area
    let petunjukTambahanContext = "";
    try {
      const ideaHandoff = loadIdeaToPhenomenonHandoff();
      const selectedExplorationArea = loadSelectedExplorationArea();

      if (ideaHandoff) {
        const extraLines: string[] = [];
        if (ideaHandoff.researchContext.actorText) {
          extraLines.push(`* Potensi Aktor: ${ideaHandoff.researchContext.actorText}`);
        }
        if (ideaHandoff.researchContext.entityText) {
          extraLines.push(`* Potensi Entitas: ${ideaHandoff.researchContext.entityText}`);
        }
        if (ideaHandoff.researchContext.documentText) {
          extraLines.push(`* Dokumen Terkait: ${ideaHandoff.researchContext.documentText}`);
        }
        if (ideaHandoff.researchContext.dataArtifactText) {
          extraLines.push(`* Artefak Data Terkait: ${ideaHandoff.researchContext.dataArtifactText}`);
        }
        if (ideaHandoff.phenomenonContext.inScope && ideaHandoff.phenomenonContext.inScope.length > 0) {
          extraLines.push(`* Batas Masuk (In-Scope): ${ideaHandoff.phenomenonContext.inScope.join(", ")}`);
        }
        if (ideaHandoff.phenomenonContext.outOfScope && ideaHandoff.phenomenonContext.outOfScope.length > 0) {
          extraLines.push(`* Batas Luar (Out-of-Scope): ${ideaHandoff.phenomenonContext.outOfScope.join(", ")}`);
        }
        if (ideaHandoff.phenomenonContext.observableSignals && ideaHandoff.phenomenonContext.observableSignals.length > 0) {
          extraLines.push(`* Sinyal Empiris yang Dicari: ${ideaHandoff.phenomenonContext.observableSignals.join("; ")}`);
        }
        if (ideaHandoff.phenomenonContext.prioritySourceTypes && ideaHandoff.phenomenonContext.prioritySourceTypes.length > 0) {
          extraLines.push(`* Prioritas Tipe Sumber: ${ideaHandoff.phenomenonContext.prioritySourceTypes.join(", ")}`);
        }
        extraLines.push(
          `* Catatan Penting: Data dari Cari Ide adalah petunjuk pencarian, bukan bukti. Jangan menggunakan seed literatur sebagai fenomena. Aktor, entitas, dokumen, artefak data, dan geografi belum merupakan keputusan final.`
        );
        if (extraLines.length > 0) {
          petunjukTambahanContext = "\n" + extraLines.join("\n");
        }
      } else if (selectedExplorationArea && selectedExplorationArea.name) {
        const extraLines: string[] = [];
        if (selectedExplorationArea.academicConnection) {
          extraLines.push(`* Keterkaitan Program Studi: ${selectedExplorationArea.academicConnection}`);
        }

        // V3 Specific Structured Research Context
        if ("researchContext" in selectedExplorationArea && selectedExplorationArea.researchContext) {
          const rc = selectedExplorationArea.researchContext;
          if (rc.potentialActors && rc.potentialActors.length > 0) {
            extraLines.push(`* Potensi Aktor: ${rc.potentialActors.join(", ")}`);
          }
          if (rc.potentialEntities && rc.potentialEntities.length > 0) {
            extraLines.push(`* Potensi Entitas: ${rc.potentialEntities.join(", ")}`);
          }
          if (rc.potentialDocuments && rc.potentialDocuments.length > 0) {
            extraLines.push(`* Dokumen Terkait: ${rc.potentialDocuments.join(", ")}`);
          }
          if (rc.potentialDataArtifacts && rc.potentialDataArtifacts.length > 0) {
            extraLines.push(`* Artefak Data Terkait: ${rc.potentialDataArtifacts.join(", ")}`);
          }
          if (rc.potentialGeographies && rc.potentialGeographies.length > 0 && rc.potentialGeographies[0] !== "Belum ditentukan") {
            extraLines.push(`* Geografi: ${rc.potentialGeographies.join(", ")}`);
          }
        } else if ("candidateObjects" in selectedExplorationArea && selectedExplorationArea.candidateObjects && selectedExplorationArea.candidateObjects.length > 0) {
          extraLines.push(`* Kandidat Objek Awal: ${selectedExplorationArea.candidateObjects.join(", ")}`);
        }

        // V3 Scope Boundary
        if ("scopeBoundary" in selectedExplorationArea && selectedExplorationArea.scopeBoundary) {
          const sb = selectedExplorationArea.scopeBoundary;
          if (sb.inScope && sb.inScope.length > 0) {
            extraLines.push(`* Batas Masuk (In-Scope): ${sb.inScope.join(", ")}`);
          }
          if (sb.outOfScope && sb.outOfScope.length > 0) {
            extraLines.push(`* Batas Luar (Out-of-Scope): ${sb.outOfScope.join(", ")}`);
          }
          if (sb.boundaryNote) {
            extraLines.push(`* Catatan Batasan: ${sb.boundaryNote}`);
          }
        }

        if (selectedExplorationArea.phenomenonSearchBrief) {
          extraLines.push(`* Petunjuk Arah Pemeriksaan Fenomena: ${selectedExplorationArea.phenomenonSearchBrief}`);
        }

        // V3 Handoff Observable Signals
        if (
          selectedExplorationArea.schemaVersion === 3 &&
          "handoffToPhenomenon" in selectedExplorationArea &&
          selectedExplorationArea.handoffToPhenomenon
        ) {
          const v3Handoff = selectedExplorationArea.handoffToPhenomenon as HandoffToPhenomenonV3;
          if (v3Handoff.observableSignals && v3Handoff.observableSignals.length > 0) {
            extraLines.push(`* Sinyal Empiris yang Dicari: ${v3Handoff.observableSignals.join("; ")}`);
          }
        }

        if (selectedExplorationArea.unresolvedItems && selectedExplorationArea.unresolvedItems.length > 0) {
          extraLines.push(`* Hal yang Perlu Diperiksa: ${selectedExplorationArea.unresolvedItems.join("; ")}`);
        }

        // Explicit Academic Safeguards:
        extraLines.push(
          `* Catatan Penting: Data dari Cari Ide adalah petunjuk pencarian, bukan bukti. Jangan menggunakan seed literatur sebagai fenomena. Aktor, entitas, dokumen, artefak data, dan geografi belum merupakan keputusan final.`
        );

        if (extraLines.length > 0) {
          petunjukTambahanContext = "\n" + extraLines.join("\n");
        }
      }
    } catch {
      // ignore
    }

    const roleSection = `[PERAN]

Kamu adalah asisten penelusuran bukti empiris untuk mahasiswa S1. Tugasmu mencari dan memeriksa kandidat fenomena nyata yang berkaitan dengan area skripsi mahasiswa.

Kamu bukan pembuat judul, research gap, novelty, teori, variabel, atau metode penelitian.`;

    const contextSection = `[KONTEKS MAHASISWA]

* Program Studi: ${prodi}
* Area Eksplorasi: ${area}
* Cakupan yang Diinginkan: ${cakupan}
* Objek/Kelompok Awal: ${objekAwal}
* Petunjuk Fenomena Awal: ${petunjukFenomena}
* Rentang Waktu: ${rentang}
* Tanggal Pencarian: ${currentDate}
* Preferensi Pengerjaan: ${preferensiContext}
* Arahan Dosen: ${arahanDosen}${petunjukTambahanContext}`;

    const tujuanSection = `[TUJUAN]

Cari 2–4 kandidat fenomena empiris yang berkaitan dengan area eksplorasi mahasiswa.

Fenomena harus berupa kondisi, tren, perubahan, peristiwa, pola, anomali, atau perbedaan yang dapat diamati pada objek, cakupan, dan periode tertentu.

Setiap kandidat harus didukung sumber yang dapat ditelusuri.`;

    const definisiSection = `[DEFINISI FENOMENA]

Fenomena penelitian adalah kondisi, tren, perubahan, peristiwa, pola, anomali, atau perbedaan yang dapat diamati pada objek, tempat, dan periode tertentu serta didukung oleh sumber yang dapat ditelusuri.`;

    const prioritasSumberSection = `[PRIORITAS SUMBER]

Prioritaskan:
1. sumber primer atau resmi seperti badan statistik, regulator, kementerian/lembaga, bursa, laporan institusi, laporan tahunan, dataset resmi, atau dokumen kebijakan;
2. artikel empiris atau working paper resmi dengan metode yang dijelaskan;
3. media kredibel hanya sebagai sumber konteks dan, jika memungkinkan, telusuri angka atau klaim ke sumber aslinya.

Ketentuan tipe sumber:
* INSTITUTIONAL_REPORT hanya untuk laporan resmi dari lembaga yang dapat diidentifikasi dan mempunyai metode, metadata, atau dasar data yang jelas;
* WORKING_PAPER harus diberi label working paper dan tidak boleh diperlakukan sebagai artikel peer-reviewed;
* Research Report atau laporan riset buatan AI atau dokumen gabungan NotebookLM tetap wajib dikeluarkan dan dilarang digunakan.

Jangan menggunakan:
* Research Report atau laporan riset gabungan buatan AI;
* dokumen hasil olahan AI tanpa verifikasi sumber primer;
* blog tanpa sumber;
* konten promosi;
* opini pribadi;
* media sosial;
* halaman login;
* CAPTCHA;
* Cloudflare;
* halaman error;
* dokumen withdrawn/retracted;
* sumber yang tidak dapat ditelusuri;
* sumber palsu.`;

    const gateKualitasSection = `[GATE KUALITAS]

Untuk setiap kandidat:
* jelaskan apa yang teramati;
* sebutkan objek, lokasi/cakupan, dan periode;
* berikan 2–4 bukti yang relevan;
* utamakan sedikitnya dua sumber yang cukup independen;
* jangan menghitung berita yang menyalin sumber sama sebagai dua bukti independen;
* pertahankan angka, unit, periode, dan cakupan sesuai sumber;
* jelaskan asal data atau metode jika tersedia;
* sertakan URL;
* jelaskan keterbatasan penggunaan bukti;
* jangan mengubah hubungan waktu atau korelasi menjadi hubungan sebab-akibat.

Gunakan status:
* SIAP_DIBAWA: bukti cukup jelas, dapat ditelusuri, relevan, dan batas penggunaannya dijelaskan;
* PERLU_DIPERIKSA: bukti belum lengkap, metadata lemah, cakupan kurang cocok, atau hanya ada satu sumber kuat;
* JANGAN_DIGUNAKAN: klaim tidak terlacak, sumber rusak, hanya opini, palsu, ditarik kembali, atau tidak mendukung fenomena.

Jika tidak menemukan minimal satu kandidat yang dapat dipertanggungjawabkan, jangan mengarang. Kembalikan insufficient_evidence: true dan jelaskan apa yang perlu diubah dari cakupan pencarian.`;

    const aturanSection = `[ATURAN]

1. Gunakan konteks yang sudah diberikan tanpa meminta mahasiswa mengulangnya.
2. Tafsirkan 'tahun terakhir' berdasarkan Tanggal Pencarian. Bedakan tanggal publikasi sumber dari periode data yang dibahas.
3. Jangan membuat judul penelitian.
4. Jangan membuat research gap.
5. Jangan membuat novelty.
6. Jangan membuat latar belakang skripsi.
7. Jangan menentukan variabel, teori, metode, sampel, atau teknik analisis.
8. Jangan otomatis memilih satu kandidat.
9. Jangan mengklaim fenomena pasti mudah atau pasti cepat diteliti.
10. Jangan mengklaim data penelitian final pasti tersedia.
11. Bedakan bukti fenomena dunia nyata dari artikel literatur akademik.
12. Petunjuk fenomena mahasiswa hanya hipotesis pencarian, bukan fakta.
13. Petunjuk dari Cari Ide Skripsi bukan fakta empiris. Jangan menggunakannya sebagai bukti dan jangan menyalinnya sebagai fenomena tanpa verifikasi sumber.
14. Jangan membuat hubungan sebab-akibat dari data deskriptif.
15. Jangan mengarang nomor halaman atau lokasi bukti. Jika lokasi bukti tidak dapat dipastikan, output harus menulis: Tidak dapat dipastikan.
16. phenomenon_summary setiap kandidat maksimal 600 karakter.
17. Kata kunci hanya saran pencarian dan belum menjadi keputusan variabel.
18. Keluarkan hasil hanya dalam format transfer yang ditentukan.
19. [GAYA BAHASA UNTUK MAHASISWA] Gunakan bahasa Indonesia yang dapat dipahami mahasiswa S1. Tetap akurat secara akademik, tetapi jelaskan istilah teknis saat pertama digunakan. Gunakan satu gagasan utama per kalimat. Hindari jargon jika ada padanan yang lebih sederhana. Jangan memakai nama enum atau field schema sebagai heading. Jika hasil analisis bersifat teknis, tambahkan implikasi singkat dengan pola "Artinya bagi penelitian ini: ...". Pertahankan source ID, status bukti, ketidakpastian, batas penggunaan, dan klaim terlarang. Jangan mengubah hasil sementara menjadi kepastian.`;

    const aturanFormatUrlSection = `[ATURAN FORMAT URL]

1. Field "url" wajib berisi tepat satu URL mentah dengan protokol https://.
2. Tulis URL langsung sebagai nilai string JSON.
3. Jangan menggunakan Markdown link.
4. Jangan menambahkan judul sumber, label, tanda kurung siku, atau tanda kurung biasa ke field "url".
5. Jangan menulis lebih dari satu URL dalam satu field.
6. Jangan menulis DOI mentah tanpa protokol. Jika menggunakan DOI, tulis sebagai URL lengkap https://doi.org/...
7. Jangan menambahkan titik, koma, atau keterangan setelah URL.
8. Jika URL tidak dapat dipastikan, jangan mengarang. Gunakan string kosong dan jelaskan masalahnya pada "access_note"; kandidat tersebut tidak boleh diberi status SIAP_DIBAWA.

FORMAT BENAR:
"url": "https://www.example.org/article/123"

FORMAT BENAR UNTUK DOI:
"url": "https://doi.org/10.1234/example"

FORMAT SALAH:
"url": "[https://www.example.org/article/123](https://www.example.org/article/123)"

FORMAT SALAH:
"url": "[Baca artikel](https://www.example.org/article/123)"

FORMAT SALAH:
"url": "Sumber: https://www.example.org/article/123"

FORMAT SALAH:
"url": "https://www.example.org/article/123, diakses 31 Agustus 2026"

Sebelum mengeluarkan hasil, periksa setiap evidence[].url:
- merupakan satu string;
- diawali tepat dengan https://;
- bukan Markdown link;
- tidak memiliki teks tambahan;
- dapat diparse sebagai URL;
- tidak menggunakan javascript:, data:, file:, atau protokol selain https://.`;

    const formatDataTransferSection = `[FORMAT DATA TRANSFER]

Keluarkan tepat satu blok di antara marker berikut.

Jangan menulis penjelasan di luar marker.

=== BEGIN SKRIFLOW_FENOMENA_V1 ===
{
  "schema_version": 1,
  "insufficient_evidence": false,
  "context": {
    "prodi": "...",
    "area": "...",
    "scope_preference": "...",
    "time_preference": "..."
  },
  "candidates": [
    {
      "id": "F01",
      "name": "...",
      "phenomenon_type": "TREND|CHANGE|EVENT|PATTERN|ANOMALY|DISCREPANCY|REGULATION",
      "phenomenon_summary": "Maksimal 600 karakter.",
      "observed_condition": "...",
      "scope": {
        "object_or_population": "...",
        "geography": "...",
        "reference_period": "..."
      },
      "relation_to_area": "...",
      "evidence": [
        {
          "claim": "...",
          "observed_data_or_event": "...",
          "source_title": "...",
          "publisher_or_institution": "...",
          "source_type": "OFFICIAL_DATA|REGULATION|INSTITUTIONAL_REPORT|EMPIRICAL_ARTICLE|WORKING_PAPER|REPUTABLE_NEWS",
          "publication_date": "...",
          "reference_period": "...",
          "url": "https://www.example.org/path-to-source",
          "evidence_location": "Halaman, tabel, bagian, paragraf, atau lokasi informasi dalam sumber. Jika tidak tersedia, tulis Tidak dapat dipastikan.",
          "access_note": "Keterangan apakah halaman/PDF dapat dibuka langsung dan bagian relevan dapat ditemukan.",
          "method_or_metadata": "...",
          "limitations": "..."
        }
      ],
      "triangulation_note": "...",
      "what_is_not_proven": "...",
      "quality": {
        "relevance": "KUAT|SEDANG|LEMAH",
        "scope_clarity": "KUAT|SEDANG|LEMAH",
        "traceability": "KUAT|SEDANG|LEMAH",
        "metadata_quality": "KUAT|SEDANG|LEMAH",
        "timeliness": "KUAT|SEDANG|LEMAH",
        "comparability": "KUAT|SEDANG|LEMAH",
        "source_independence": "KUAT|SEDANG|LEMAH"
      },
      "phenomenon_definition": {
        "event_or_condition": "Deskripsi peristiwa nyata teramati",
        "event_family": "audited_announcement|earnings_release|annual_report|interim_report|corporate_disclosure|other",
        "primary_outcome": "Outcome terukur utama",
        "secondary_outcome": "Outcome sekunder yang masih sekeluarga (opsional)",
        "object_or_population": "Objek/populasi teramati",
        "geography": "Wilayah/konteks",
        "reference_period": "Periode observasi data"
      },
      "phenomenon_coherence_audit": {
        "status": "COHERENT_ENOUGH|NEEDS_NARROWING|INCOHERENT",
        "mixed_events": ["Daftar event jika bercampur"],
        "mixed_outcomes": ["Daftar outcome jika bercampur"],
        "notes": ["Catatan koherensi"]
      },
      "source_independence_audit": {
        "article_count": 2,
        "independent_author_team_count": 2,
        "repeated_author_clusters": [],
        "strength": "STRONG|MODERATE|WEAK"
      },
      "status": "SIAP_DIBAWA|PERLU_DIPERIKSA|JANGAN_DIGUNAKAN",
      "keywords_id": ["..."],
      "keywords_en": ["..."],
      "unresolved_items": ["..."]
    }
  ],
  "search_notes": ["..."]
}
=== END SKRIFLOW_FENOMENA_V1 ===

Gunakan JSON valid:
* double quote;
* tanpa trailing comma;
* tanpa komentar;
* tanpa Markdown code fence;
* tanpa teks sebelum atau sesudah marker.

Khusus field evidence[].url:
* isi hanya URL mentah;
* tepat satu URL;
* wajib https://;
* tanpa format [teks](url);
* tanpa label "Sumber:";
* tanpa catatan akses;
* tanpa tanda baca setelah URL;
* keterangan akses hanya ditulis pada access_note.`;

    const fullPrompt = [
      roleSection,
      contextSection,
      tujuanSection,
      definisiSection,
      prioritasSumberSection,
      gateKualitasSection,
      aturanSection,
      aturanFormatUrlSection,
      formatDataTransferSection,
    ].join("\n\n");

    return fullPrompt
      .replace(/\bundefined\b/g, "Belum diketahui")
      .replace(/\bnull\b/g, "Belum diketahui")
      .replace(/\[object Object\]/g, "");
  }

  // Standard Assembly for Tool 1 (Cari Ide Skripsi) & Tool 4 (Bedah Fenomena & Literatur)
  const { promptConfig, fields } = tool;
  const roleSection = `[PERAN]\n${promptConfig.role}`;
  const contextLines: string[] = [];

  for (const field of fields) {
    const rawVal = values[field.id];
    const trimmedVal = typeof rawVal === "string" ? rawVal.trim() : "";
    const label = (field.promptLabel || field.label).replace(/\?+$/, "").trim();

    if (field.type === "select" || field.options) {
      const valToResolve = trimmedVal || field.defaultValue || "unknown";
      if (valToResolve === "unknown") {
        contextLines.push(`- ${label}: Belum diketahui`);
      } else {
        const humanLabel = resolveOptionLabel(field.id, valToResolve);
        if (humanLabel === "Belum tahu" || humanLabel === "unknown") {
          contextLines.push(`- ${label}: Belum diketahui`);
        } else {
          contextLines.push(`- ${label}: ${humanLabel}`);
        }
      }
      continue;
    }

    if (trimmedVal.length > 0) {
      contextLines.push(`- ${label}: ${trimmedVal}`);
    } else if (field.defaultValue) {
      contextLines.push(`- ${label}: ${field.defaultValue}`);
    } else {
      contextLines.push(`- ${label}: Belum diketahui`);
    }
  }

  const contextSection = `[KONTEKS]\n${contextLines.join("\n")}`;
  const taskSection = `[TUGAS]\n${promptConfig.task}`;
  const rulesList = promptConfig.rules.map((rule, idx) => `${idx + 1}. ${rule}`).join("\n");
  const rulesSection = `[ATURAN]\n${rulesList}`;
  const outputList = promptConfig.outputFormat.map((item) => `${item}`).join("\n");
  const outputSection = `[FORMAT OUTPUT]\n${outputList}`;

  return [roleSection, contextSection, taskSection, rulesSection, outputSection]
    .join("\n\n")
    .replace(/\bundefined\b/g, "Belum diketahui")
    .replace(/\bnull\b/g, "Belum diketahui")
    .replace(/\[object Object\]/g, "");
}

/**
 * Serializes SelectedPhenomenon into complete structured evidence package for Tool 4 Bedah.
 */
export function serializePhenomenonPackage(phenomenon: SelectedPhenomenon | null | undefined): string {
  if (!phenomenon) {
    return "Belum ada paket bukti fenomena yang dipilih.";
  }

  const lines: string[] = [
    `Nama Fenomena: ${phenomenon.name || "Belum diketahui"}`,
    `Status: ${phenomenon.status || "Belum diketahui"}`,
    `Jenis Fenomena: ${phenomenon.phenomenonType || "Belum diketahui"}`,
    `Ringkasan Fenomena: ${phenomenon.phenomenonSummary || "Belum diketahui"}`,
    `Kondisi Teramati: ${phenomenon.observedCondition || "Belum diketahui"}`,
    `Hubungan dengan Area: ${phenomenon.relationToArea || "Belum diketahui"}`,
    `Cakupan Objek/Populasi: ${phenomenon.scope?.objectOrPopulation || "Belum diketahui"}`,
    `Cakupan Wilayah: ${phenomenon.scope?.geography || "Belum diketahui"}`,
    `Periode Acuan: ${phenomenon.scope?.referencePeriod || "Belum diketahui"}`,
    `Catatan Triangulasi: ${phenomenon.triangulationNote || "Belum diketahui"}`,
    `Apa yang Belum Terbukti: ${phenomenon.whatIsNotProven || "Belum diketahui"}`,
  ];

  if (phenomenon.unresolvedItems && phenomenon.unresolvedItems.length > 0) {
    lines.push(`Hal yang Perlu Diperiksa: ${phenomenon.unresolvedItems.join("; ")}`);
  }

  if (phenomenon.evidence && phenomenon.evidence.length > 0) {
    lines.push("\nDaftar Bukti Fenomena Lengkap:");
    phenomenon.evidence.forEach((ev: PhenomenonEvidence, idx: number) => {
      const srcTitle = ev.sourceTitle || "Judul tidak tersedia";
      const srcPub = ev.publisherOrInstitution || "Penerbit tidak tersedia";
      const srcDate = ev.publicationDate || "Tahun tidak tersedia";
      const srcType = ev.sourceType || "Tipe tidak tersedia";
      const srcUrl = ev.url || "URL tidak tersedia";
      const srcLoc = ev.evidenceLocation || "Lokasi tidak tersedia";
      const srcAcc = ev.accessNote || "Tidak dapat dipastikan";

      lines.push(
        `- Bukti ${idx + 1}: ${ev.claim || "Klaim tidak tersedia"} | Sumber: ${srcTitle} (${srcPub}, ${srcDate}) | Tipe: ${srcType} | URL: ${srcUrl} | Lokasi Bukti: ${srcLoc} | Aksesibilitas: ${srcAcc}`
      );
    });
  }

  return lines.join("\n");
}

/**
 * Assembles Canonical Prompt for Tool 4 Tahap 4A (Bedah Bukti & Eksplorasi Arah V2).
 * Manifest ID: bedah-fenomena-literatur-v2
 */
export function assembleBedahPrompt(input: ResearchBedahInput): string {
  const prodi = (input.prodi || "").trim() || "Belum diketahui";
  const area = (input.areaEksplorasi || "").trim() || "Belum diketahui";
  const preferredApproach = (input.studentConstraints?.preferredApproach || "").trim() || "Belum diketahui";
  const preferredData = (input.studentConstraints?.preferredData || "").trim() || "Belum diketahui";
  const dataAccess = (input.studentConstraints?.existingDataAccess || "").trim() || "Belum diketahui";
  const dataAccessNotes = (input.studentConstraints?.dataAccessNotes || "").trim() || "Belum diketahui";
  const avoidedActivities = (input.studentConstraints?.avoidedActivities || "").trim() || "Belum diketahui";
  const timeCondition = (input.studentConstraints?.timeCondition || "").trim() || "Belum diketahui";
  const additionalNotes = (input.additionalNotes || input.studentConstraints?.additionalNotes || "").trim() || "Belum diketahui";
  const supervisorDirection = (input.supervisorDirection || "").trim() || "Belum diketahui";

  const selectedPhenomenonPackage = serializePhenomenonPackage(input.selectedPhenomenon);
  const literatureEvidencePackage = (input.literatureEvidencePackage || "").trim() || "Belum ada paket bukti literatur.";

  const promptText = `[PERAN]

Kamu adalah partner analisis akademik S1 yang membantu mahasiswa merekonsiliasi fenomena empiris dengan bukti literatur pada Tahap 4A SKRIFLOW.

Tugasmu melakukan audit komparabilitas bukti, kalibrasi fenomena, merumuskan kandidat research gap, dan menyusun 2–4 alternatif arah penelitian. Kamu bukan pembuat keputusan final dan tidak boleh mengarang bukti atau memilihkan arah otomatis.

[KONTEKS MAHASISWA]

- Program Studi: ${prodi}
- Area Eksplorasi: ${area}
- Pendekatan yang Disukai: ${preferredApproach}
- Data yang Nyaman Digunakan: ${preferredData}
- Akses Data: ${dataAccess}
- Catatan Akses Data: ${dataAccessNotes}
- Hal yang Ingin Dihindari: ${avoidedActivities}
- Kondisi Waktu: ${timeCondition}
- Catatan Tambahan: ${additionalNotes}
- Arahan Dosen: ${supervisorDirection}

[FENOMENA TERPILIH]

${selectedPhenomenonPackage}

[PAKET BUKTI LITERATUR DARI NOTEBOOKLM]

${literatureEvidencePackage}

[DEFINISI AKADEMIK YANG WAJIB DIGUNAKAN & PEMISAHAN TIGA JENIS INFORMASI]

Wajib memisahkan tiga jenis informasi secara tegas:
1. Fenomena yang Terlihat (observed_phenomenon): Kondisi, tren, pola, perubahan, peristiwa, atau perbedaan yang dapat diamati pada objek, cakupan, dan periode tertentu.
2. Temuan Penelitian Terdahulu (prior_study_findings): Kesimpulan empiris yang benar-benar dilaporkan oleh artikel/studi dalam Paket Bukti.
3. Hal yang Belum Bisa Disimpulkan (not_yet_established): Klaim yang belum memiliki bukti cukup, belum dapat dibandingkan, belum dapat digeneralisasi, atau masih memerlukan pemeriksaan lapangan.
Dilarang memperlakukan ringkasan penelitian terdahulu sebagai fenomena dunia nyata tanpa sumber fenomena empiris yang sesuai.

Empat lapisan ini harus selalu dipisahkan secara eksplisit:
(1) Fenomena empiris, (2) Masalah empiris, (3) Masalah pengetahuan, dan (4) Kandidat research gap.

[GATE KELAYAKAN INPUT]

Tetapkan status kelayakan input:
- BUKTI_TIDAK_CUKUP: Fenomena tanpa bukti yang dapat ditelusuri, sumber inti terlalu sedikit, sebagian besar abstract-only, atau source ID tidak dapat direkonsiliasi.
- CUKUP_UNTUK_EKSPLORASI: Fenomena dapat dibedah, literatur dapat dipetakan, namun kandidat gap masih butuh sumber tambahan sebelum dibawa ke Bab 1.
- CUKUP_UNTUK_ARAH: Fenomena didukung bukti, literatur inti cukup, sumber dapat ditelusuri, minimal satu gap relevan dan arah realistis dapat dibentuk.

Ketentuan Dokumen Gabungan/Research Report:
- Research Report / Laporan Riset AI / dokumen gabungan selalu masuk DIABAIKAN.
- Tidak dihitung sebagai sumber fenomena atau sumber INTI/PENDUKUNG.
- Tidak boleh menjadi anchor source, tidak boleh mendukung gap, dan tidak boleh masuk evidence ledger.

[ATURAN KOMPARABILITAS STUDI & PEMISAHAN UKURAN]

Dua atau lebih temuan hanya boleh disebut konsisten atau kontradiktif jika cukup sebanding dalam: konstruk/prediktor, outcome, proksi, objek, sampel, periode, dan desain. Dilarang menggunakan status TERBUKTI atau DIDUKUNG_SECARA_UNIVERSAL; gunakan SEBANDING, DIDUKUNG_SEBAGIAN, atau TIDAK_SEBANDING.
Dilarang keras menggabungkan ukuran berikut seolah-olah identik:
- Earnings Response Coefficient (ERC);
- abnormal return;
- return saham biasa;
- harga saham;
- Trading Volume Activity (TVA);
- bid-ask spread;
- likuiditas;
- value relevance;
- nilai perusahaan.

Untuk setiap arah penelitian, tentukan measurement_focus:
- primary_outcome: tepat satu outcome utama;
- supporting_outcome: maksimal satu outcome pendukung (atau null jika tidak ada);
- outcome pendukung tidak boleh disebut sebagai pengganti outcome utama;
- non_equivalence_note: jika penelitian terdahulu memakai ukuran berbeda, wajib jelaskan bahwa hasilnya tidak dapat dibandingkan secara langsung.

[STATUS KANDIDAT RESEARCH GAP (BUKAN GAP FINAL)]

Jangan menampilkan kandidat gap sebagai gap final. Gunakan status (gap_status):
- TERINDIKASI: pola keterbatasan baru terlihat dari sebagian sumber;
- PERLU_VERIFIKASI: kandidat gap masuk akal, tetapi membutuhkan pencarian atau pemeriksaan sumber tambahan;
- CUKUP_DIDUKUNG: keterbatasan pengetahuan didukung beberapa sumber relevan dan dapat dibawa ke konsultasi dosen, tetapi tetap bukan klaim absolut.

Dilarang menghasilkan klaim absolut seperti:
- "belum pernah diteliti"
- "tidak ada penelitian"
- "penelitian pertama"
- "pasti novel"
Default gunakan bahasa hati-hati yang berakar pada bukti paket.

[BATAS KLAIM (CLAIM BOUNDARY)]

Setiap arah penelitian wajib memiliki batas klaim (claim_boundary):
- safe_to_say: klaim yang aman diutarakan pada naskah Bab 1 (contoh: "Beberapa studi melaporkan respons pasar yang berbeda pada konteks, periode, dan ukuran yang tidak selalu sama.").
- not_safe_to_say: klaim yang belum aman dinyatakan (contoh: "Belum aman menyatakan publikasi laporan keuangan menyebabkan perubahan harga saham.", "Belum aman menyatakan belum ada penelitian serupa di Indonesia.").

[BOBOT KUALITAS SUMBER]

Klasifikasikan fungsi sumber (source_weights):
- UTAMA: artikel peer-reviewed full-text atau sumber primer/resmi yang dapat ditelusuri;
- PENDUKUNG: proceeding, working paper, tesis, review, atau laporan institusi yang masih relevan;
- PERLU_DIPERIKSA: identitas, akses, full-text, atau status akademiknya belum pasti.

Klaim inti untuk Bab 1 tidak boleh hanya bergantung pada sumber PENDUKUNG atau PERLU_DIPERIKSA. Jangan otomatis membuang seluruh Paket Bukti jika ada beberapa sumber lemah; turunkan bobot klaimnya dan beri catatan pemeriksaan.

[DIFERENSIASI ARAH PENELITIAN & BADGE]

Rumuskan 2–4 alternatif arah penelitian yang benar-benar berbeda berdasarkan: fokus masalah, outcome utama, objek/konteks, kebutuhan data minimum, hubungan fenomena, dan risiko pengerjaan.
Badge rekomendasi bersyarat yang diperbolehkan (conditional_badge):
- "Paling Dekat dengan Fenomena"
- "Lebih Aman untuk Tenggat"
- "Data Perlu Dicek"
- "Perlu Fokus Lebih Sempit"
- "Bukti Literatur Masih Terbatas"
Badge hanya membantu mahasiswa membandingkan. Dilarang auto-select arah apa pun.

[TUGAS DAN BATASAN]

1. Hanya gunakan data yang diberikan. Jangan melakukan pencarian web atau mengarang source ID.
2. Pertahankan periode, objek, angka, unit, metode, dan batas sumber secara presisi.
3. Rumuskan 2–4 kandidat gap (atau 0 kandidat jika bukti tidak mencukupi / zero forced gap).
4. Rumuskan 2–4 alternatif arah penelitian beserta pertanyaan verifikasi data (data_verification_questions).
5. Jangan auto-select arah; mahasiswa memilih secara manual.
6. Jangan menetapkan judul final, variabel final, hipotesis final, sampel final, atau metode final.
7. Jangan menulis draft Bab 1.
8. [GAYA BAHASA UNTUK MAHASISWA] Gunakan bahasa Indonesia yang santai, jelas, dan mahasiswa-friendly. Istilah akademik tetap digunakan tetapi wajib dijelaskan secara sederhana. Gunakan satu gagasan utama per kalimat. Jangan memakai nama enum atau field schema sebagai heading utama.
9. Keluarkan tepat satu blok JSON transfer SKRIFLOW_DIRECTION_V2 di antara penanda.

[FORMAT DATA TRANSFER]

Keluarkan tepat satu blok transfer berikut tanpa Markdown code fence:

=== BEGIN SKRIFLOW_DIRECTION_V2 ===
{
  "schema_version": 2,
  "automatic_selection": false,
  "input_audit": {
    "status": "BUKTI_TIDAK_CUKUP|CUKUP_UNTUK_EKSPLORASI|CUKUP_UNTUK_ARAH",
    "phenomenon_source_count": 0,
    "core_source_count": 0,
    "supporting_source_count": 0,
    "ignored_source_count": 0,
    "source_integrity_notes": ["..."],
    "main_limitations": ["..."],
    "recovery_actions": ["..."]
  },
  "evidence_basis": {
    "observed_phenomenon": ["..."],
    "prior_study_findings": ["..."],
    "not_yet_established": ["..."]
  },
  "calibrated_phenomenon": {
    "summary": "...",
    "empirical_problem": "...",
    "knowledge_problem": "...",
    "scope": {
      "object_or_population": "...",
      "geography": "...",
      "reference_period": "...",
      "event_or_context": "..."
    },
    "evidence": [
      {
        "source_id": "...",
        "source_title": "...",
        "claim": "...",
        "evidence_location": "...",
        "context": "...",
        "limitations": "..."
      }
    ],
    "why_it_matters": [
      {
        "statement": "...",
        "source_ids": ["..."],
        "limitations": "..."
      }
    ],
    "what_is_not_proven": ["..."],
    "prohibited_claims": ["..."]
  },
  "knowledge_map": {
    "established_knowledge": [
      {
        "statement": "...",
        "source_ids": ["..."],
        "scope_limit": "..."
      }
    ],
    "relatively_consistent_findings": [
      {
        "statement": "...",
        "source_ids": ["..."],
        "comparability_note": "..."
      }
    ],
    "differing_findings": [
      {
        "statement": "...",
        "source_ids": ["..."],
        "comparability": "SEBANDING|SEBANDING_SEBAGIAN|TIDAK_SEBANDING",
        "explanation": "..."
      }
    ],
    "measurement_limits": ["..."],
    "context_limits": ["..."],
    "data_limits": ["..."],
    "methodological_limits": ["..."],
    "conclusions_not_allowed": ["..."]
  },
  "comparability_groups": [
    {
      "id": "CG01",
      "source_ids": ["..."],
      "construct_or_predictor": "...",
      "outcome": "...",
      "proxies": ["..."],
      "objects_and_periods": ["..."],
      "relationship_type": "...",
      "comparability": "SEBANDING|SEBANDING_SEBAGIAN|TIDAK_SEBANDING",
      "reason": "..."
    }
  ],
  "candidate_gaps": [
    {
      "id": "G01",
      "gap_type": "EMPIRICAL_INCONSISTENCY|MEASUREMENT|CONTEXTUAL_BOUNDARY|TEMPORAL_OR_REGULATORY|METHODOLOGICAL_LIMITATION|EVIDENCE_COVERAGE",
      "gap_status": "TERINDIKASI|PERLU_VERIFIKASI|CUKUP_DIDUKUNG",
      "statement": "...",
      "what_is_known": ["..."],
      "what_is_unexplained": "...",
      "phenomenon_link": "...",
      "source_ids": ["..."],
      "comparability_basis": "...",
      "strength": "DIDUKUNG_DALAM_PAKET|TERDUKUNG_SEMENTARA|PERLU_SUMBER_TAMBAHAN|TIDAK_DAPAT_DIBANDINGKAN|TIDAK_DIDUKUNG",
      "scope_limits": ["..."],
      "verification_needed": ["..."],
      "prohibited_claims": ["..."],
      "assessment": {
        "phenomenon_relevance": "KUAT|SEDANG|LEMAH",
        "traceability": "KUAT|SEDANG|LEMAH",
        "comparability": "KUAT|SEDANG|LEMAH",
        "evidence_strength": "KUAT|SEDANG|LEMAH",
        "feasibility": "KUAT|SEDANG|LEMAH",
        "overclaim_risk": "TINGGI|SEDANG|RENDAH"
      }
    }
  ],
  "directions": [
    {
      "id": "D01",
      "name": "...",
      "problem_focus": "...",
      "phenomenon_link": "...",
      "gap_ids": ["G01"],
      "anchor_source_ids": ["..."],
      "potential_unit_of_analysis": ["..."],
      "potential_objects": ["..."],
      "potential_constructs": ["..."],
      "candidate_outcomes": ["..."],
      "measurement_focus": {
        "primary_outcome": "...",
        "supporting_outcome": "...",
        "non_equivalence_note": "..."
      },
      "claim_boundary": {
        "safe_to_say": ["..."],
        "not_safe_to_say": ["..."]
      },
      "conditional_badge": "Paling Dekat dengan Fenomena|Lebih Aman untuk Tenggat|Data Perlu Dicek|Perlu Fokus Lebih Sempit|Bukti Literatur Masih Terbatas",
      "previously_used_proxies": ["..."],
      "data_needs": ["..."],
      "data_sources_to_check": ["..."],
      "possible_design_families": ["..."],
      "constraint_fit": "KUAT|SEDANG|LEMAH",
      "workload": "RENDAH|SEDANG|TINGGI",
      "main_work": ["..."],
      "academic_risks": ["..."],
      "data_risks": ["..."],
      "scope_boundaries": {
        "in_scope": ["..."],
        "out_of_scope": ["..."]
      },
      "unresolved_items": ["..."],
      "data_verification_questions": [
        {
          "id": "Q01",
          "question": "...",
          "critical": true,
          "related_data_need": "..."
        }
      ],
      "readiness": "LAYAK_DIPERIKSA|PERLU_SUMBER_TAMBAHAN|RISIKO_TINGGI|JANGAN_DIBAWA"
    }
  ],
  "comparison_summary": "...",
  "conditional_recommendation": {
    "recommended_direction_ids": ["D01"],
    "reasoning": "...",
    "conditions": ["..."],
    "not_a_selection": true
  },
  "source_weights": [
    {
      "source_id": "ID-09",
      "document_type": "Systematic Literature Review (SLR)",
      "weight": "PENDUKUNG",
      "note": "..."
    }
  ],
  "guidance_points": ["..."],
  "recovery_actions": ["..."]
}
=== END SKRIFLOW_DIRECTION_V2 ===

Gunakan JSON murni valid tanpa code fence, double quote, dan tanpa trailing comma.`;

  return promptText
    .replace(/\bundefined\b/g, "Belum diketahui")
    .replace(/\bnull\b/g, "Belum diketahui")
    .replace(/\[object Object\]/g, "");
}

export interface ResearchBedahInput4B {
  prodi: string;
  areaEksplorasi: string;
  studentConstraints?: Record<string, string>;
  supervisorDirection?: string;
  calibratedPhenomenon: import("@/types/tool").CalibratedPhenomenonV2;
  selectedDirection: import("@/types/tool").ResearchDirectionV2;
  associatedGaps: import("@/types/tool").CandidateGapV2[];
  relevantLiteratureEvidence: string;
  literatureEvidencePackage?: string;
  feasibilityState: import("@/types/tool").DirectionFeasibilityState;
  sourceWeights?: import("@/types/tool").SourceWeightItem[];
  phenomenonBasisStatus?: import("@/types/tool").PhenomenonBasisStatus;
}

/**
 * Extracts document_type for a specific source_id from Source Register text (Patch 4).
 * Returns null if not found. Never guesses based on weight.
 */
export function extractDocumentTypeFromSourceRegister(
  sourceId: string,
  text: string
): string | null {
  if (!text || !sourceId) return null;
  const sid = sourceId.replace(/[\[\]]/g, "").trim().toUpperCase();
  const lines = text.split("\n");

  // 1. Check table with header
  let idColIdx = -1;
  let typeColIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.includes("|") && (rawLine.toLowerCase().includes("id") || rawLine.toLowerCase().includes("sumber") || rawLine.toLowerCase().includes("kategori"))) {
      const cells = rawLine
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || (!rawLine.startsWith("|") && idx === 0));

      const foundId = cells.findIndex((c) => /^(id|id\s*sumber|source\s*id)$/i.test(c));
      const foundType = cells.findIndex((c) => /^(jenis|jenis\s*dokumen|tipe|tipe\s*dokumen|document\s*type|type)$/i.test(c));
      if (foundId !== -1 && foundType !== -1) {
        idColIdx = foundId;
        typeColIdx = foundType;
        continue;
      }
    }

    if (idColIdx !== -1 && typeColIdx !== -1 && rawLine.includes("|") && !rawLine.includes("---")) {
      const cells = rawLine
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || (!rawLine.startsWith("|") && idx === 0));

      const cellId = cells[idColIdx]?.replace(/[\[\]]/g, "").trim().toUpperCase();
      if (cellId === sid) {
        const val = cells[typeColIdx]?.trim();
        if (val && !val.startsWith("---") && val.length > 1) {
          return val;
        }
      }
    }
  }

  // 2. Scan any table row containing sid: e.g. | ID-09 | PENDUKUNG | ... | Systematic Literature Review (SLR) | ... |
  for (const line of lines) {
    if (line.includes("|")) {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0 && !c.startsWith("---"));

      const hasSid = cells.some((c) => c.replace(/[\[\]]/g, "").trim().toUpperCase() === sid);
      if (hasSid) {
        // Search cell with known document type keywords
        for (const cell of cells) {
          if (/systematic\s*literature\s*review|slr|literature\s*review|scoping\s*review|meta-analisis|meta-analysis|artikel\s*empiris|empirical\s*article|journal\s*article|prosiding|proceedings|working\s*paper|tesis|thesis|disertasi|laporan\s*institusi|buku|book/i.test(cell) && cell.replace(/[\[\]]/g, "").trim().toUpperCase() !== sid) {
            return cell;
          }
        }
        // Fallback to column 4 (0-indexed) if standard 8-column layout
        if (cells.length >= 5 && cells[0].replace(/[\[\]]/g, "").trim().toUpperCase() === sid) {
          const candidate = cells[4];
          if (candidate && candidate.length > 1 && !candidate.startsWith("---")) {
            return candidate;
          }
        }
      }
    }
  }

  // 3. List or free text patterns:
  // e.g. [ID-09] ... Jenis: Systematic Literature Review (SLR)
  // or [ID-09] PENDUKUNG - Judul - Penulis - Systematic Literature Review (SLR)
  for (const line of lines) {
    const cleanLineSid = line.replace(/[\[\]]/g, " ").toUpperCase();
    if (cleanLineSid.includes(` ${sid} `) || cleanLineSid.startsWith(`${sid} `) || line.includes(`[${sid}]`) || line.includes(`${sid}:`)) {
      const jenisMatch = line.match(/(?:jenis|tipe|document\s*type)\s*[:=\-]\s*([^,\n\|\]]+)/i);
      if (jenisMatch && jenisMatch[1]) {
        return jenisMatch[1].trim();
      }
      const parts = line.split(/[-–|;:]/).map((p) => p.trim());
      for (const p of parts) {
        if (/systematic\s*literature\s*review|slr|literature\s*review|scoping\s*review|artikel\s*empiris|empirical|prosiding|working\s*paper|tesis|laporan|buku/i.test(p) && !p.toUpperCase().includes(sid)) {
          return p;
        }
      }
    }
  }

  return null;
}

/**
 * Assembles Focused Prompt for Tool 4 Tahap 4B (Susun Fondasi Bab 1).
 * Manifest ID: bedah-bab1-foundation-v1
 */
export function assembleBedahPrompt4B(input: ResearchBedahInput4B): string {
  const prodi = (input.prodi || "").trim() || "Belum diketahui";
  const area = (input.areaEksplorasi || "").trim() || "Belum diketahui";
  const supervisorDirection = (input.supervisorDirection || "").trim() || "Belum diketahui";

  const dir = input.selectedDirection;
  const gaps = input.associatedGaps || [];
  const phen = input.calibratedPhenomenon;
  const feas = input.feasibilityState;

  const gapsSection = gaps
    .map(
      (g) =>
        `- Gap [${g.id}] (${g.gap_type}) [Status Gap: ${g.gap_status || "TERINDIKASI"}, Kekuatan: ${g.strength}]: ${g.statement}\n  Yang sudah diketahui: ${g.what_is_known.join("; ")}\n  Yang belum terjawab: ${g.what_is_unexplained}\n  Sumber: ${g.source_ids.join(", ")}`
    )
    .join("\n\n");

  const feasibilityAnswersText = dir.data_verification_questions
    .map((q) => {
      const ans = feas.answers[q.id] || "BELUM_DIPASTIKAN";
      return `- Pertanyaan: ${q.question} (Kritis: ${q.critical ? "YA" : "TIDAK"}) -> Status: ${ans} [Kebutuhan: ${q.related_data_need}]`;
    })
    .join("\n");

  const primaryOutcome = dir.measurement_focus?.primary_outcome || dir.candidate_outcomes?.[0] || "Belum ditentukan";
  const supportingOutcome = dir.measurement_focus?.supporting_outcome || "Tidak ada";
  const nonEquivalenceNote = dir.measurement_focus?.non_equivalence_note || "Ukuran outcome berbeda tidak boleh diperlakukan setara.";

  const safeClaimsText = dir.claim_boundary?.safe_to_say?.length
    ? dir.claim_boundary.safe_to_say.map((c) => `- Aman dinyatakan: ${c}`).join("\n")
    : "- Aman dinyatakan: Klaim berhati-hati sesuai temuan empiris sumber.";
  const notSafeClaimsText = dir.claim_boundary?.not_safe_to_say?.length
    ? dir.claim_boundary.not_safe_to_say.map((c) => `- Belum aman dinyatakan: ${c}`).join("\n")
    : "- Belum aman dinyatakan: Hubungan sebab-akibat mutlak atau klaim belum pernah ada penelitian.";

  // Construct [KLASIFIKASI BOBOT SUMBER] (Patch 1 & Patch 4)
  const fullEvidenceText = `${input.relevantLiteratureEvidence || ""}\n${input.literatureEvidencePackage || ""}`;

  const sourceWeightMap = new Map<
    string,
    { weight: import("@/types/tool").SourceWeight; document_type: string; note: string }
  >();

  if (Array.isArray(input.sourceWeights)) {
    input.sourceWeights.forEach((sw) => {
      const sid = (sw.source_id || "").trim();
      if (sid) {
        const docTypeFromPkg = extractDocumentTypeFromSourceRegister(sid, fullEvidenceText);
        const explicit4ADocType = sw.document_type && sw.document_type.trim().length > 0 && sw.document_type !== "Jenis dokumen belum teridentifikasi" ? sw.document_type.trim() : null;
        const docType = explicit4ADocType || docTypeFromPkg || "Jenis dokumen belum teridentifikasi";
        sourceWeightMap.set(sid, {
          weight: sw.weight || "PERLU_DIPERIKSA",
          document_type: docType,
          note: sw.note || sw.reason || (docType === "Jenis dokumen belum teridentifikasi" ? "Jenis dokumen belum teridentifikasi, tandai NEEDS_VERIFICATION." : "Kategori bobot dari Tahap 4A."),
        });
      }
    });
  }

  // Ensure anchor and gap sources are preserved in exact casing/format and default to PERLU_DIPERIKSA if missing
  const allRelatedSourceIds = new Set<string>([
    ...dir.anchor_source_ids,
    ...gaps.flatMap((g) => g.source_ids),
  ]);

  allRelatedSourceIds.forEach((sid) => {
    const trimmed = (sid || "").trim();
    if (trimmed && !sourceWeightMap.has(trimmed)) {
      const docType = extractDocumentTypeFromSourceRegister(trimmed, fullEvidenceText) || "Jenis dokumen belum teridentifikasi";
      sourceWeightMap.set(trimmed, {
        weight: "PERLU_DIPERIKSA",
        document_type: docType,
        note: docType === "Jenis dokumen belum teridentifikasi"
          ? "Sumber belum memiliki bobot eksplisit dan jenis dokumen belum teridentifikasi, tandai NEEDS_VERIFICATION."
          : "Sumber terdaftar belum memiliki bobot eksplisit dari Tahap 4A, perlakukan sebagai PERLU_DIPERIKSA.",
      });
    }
  });

  const sourceWeightsJsonList = Array.from(sourceWeightMap.entries()).map(([sid, info]) => ({
    source_id: sid,
    document_type: info.document_type,
    weight: info.weight,
    note: info.note,
  }));

  const sourceWeightsEntries = Array.from(sourceWeightMap.entries()).map(([sid, info]) => {
    return `- [${sid}] — [${info.weight}]\n  Jenis dokumen: ${info.document_type}\n  Catatan: ${info.note}`;
  });

  const sourceWeightsText = sourceWeightsEntries.length > 0
    ? `${sourceWeightsEntries.join("\n")}\n\nFormat Terstruktur:\n${JSON.stringify(sourceWeightsJsonList, null, 2)}`
    : `- [S01] — [UTAMA]\n  Jenis dokumen: Jenis dokumen belum teridentifikasi\n  Catatan: Sumber utama terkonfirmasi`;

  // Construct [STATUS DASAR FENOMENA] (Patch 4)
  const phenStatus = input.phenomenonBasisStatus || "VERIFIED_REAL_WORLD";
  const phenStatusLabel =
    phenStatus === "VERIFIED_REAL_WORLD"
      ? "Fenomena yang Sudah Dicek"
      : phenStatus === "LITERATURE_INDICATED"
      ? "Petunjuk Fenomena dari Literatur"
      : "Bukti Fenomena Belum Tersedia";

  const phenStatusNote =
    phenStatus === "VERIFIED_REAL_WORLD"
      ? "Bukti empiris dan konteks fenomena terstruktur dari penelusuran Tool 2 tersedia lengkap."
      : phenStatus === "LITERATURE_INDICATED"
      ? "Petunjuk ini membantu menentukan arah pencarian, tetapi belum cukup disebut sebagai bukti fenomena dunia nyata. PENTING: Dilarang menuliskan fenomena sebagai fakta dunia nyata terkonfirmasi. Paragraf EMPIRICAL_PHENOMENON wajib berstatus NEEDS_VERIFICATION dan status fondasi maksimal BAB1_CONDITIONAL."
      : "Bukti fenomena belum tersedia. Paragraf EMPIRICAL_PHENOMENON wajib berstatus NEEDS_VERIFICATION dan status fondasi maksimal BAB1_CONDITIONAL.";

  const promptText = `[PERAN]

Kamu adalah partner akademik senior S1 yang membantu mahasiswa menyusun Paket Fondasi Bab 1 V2 pada Tahap 4B SKRIFLOW.

Tugasmu memformulasikan fondasi logis yang terstruktur dan terverifikasi untuk SATU arah penelitian yang telah dipilih mahasiswa. Jangan mengganti arah, jangan mengarang gap, jangan mengarang hubungan sebab-akibat, dan jangan menaikkan status data secara tidak berdasar.

[KONTEKS DAN ARAH TERPILIH]

- Program Studi: ${prodi}
- Area Eksplorasi: ${area}
- Arahan Dosen: ${supervisorDirection}
- Arah Terpilih Mahasiswa: [${dir.id}] ${dir.name}
- Fokus Masalah: ${dir.problem_focus}
- Hubungan Fenomena: ${dir.phenomenon_link || dir.phenomenon_connection || "Keterkaitan langsung dengan fenomena terpilih"}
- Sumber Jangkar Arah: ${(dir.anchor_source_ids || []).join(", ")}
- Fokus Pengukuran (Measurement Focus):
  * Ukuran/Hasil Utama: ${primaryOutcome}
  * Ukuran/Hasil Pendukung: ${supportingOutcome}
  * Catatan Non-Ekuivalensi: ${nonEquivalenceNote}
- Batas Klaim Aman (Claim Boundary):
${safeClaimsText}
${notSafeClaimsText}
- Kebutuhan Data: ${(dir.data_needs || []).join("; ")}
- Desain yang Dipertimbangkan: ${(dir.possible_design_families || []).join("; ") || "Desain kuantitatif / empiris"}
- Hambatan/Risiko: ${(dir.academic_risks || []).join("; ") || "Risiko beban dan batas waktu"}

[HASIL UJI KELAYAKAN AKSES DATA MAHASISWA]

${feasibilityAnswersText}
- Catatan Akses Data Mahasiswa: ${feas.accessNotes || "Belum ada catatan detail"}
- Status Kesiapan Data: ${feas.computedReadiness}
${
  feas.computedReadiness === "DATA_CONDITIONAL"
    ? "- PERINGATAN KONDISI DATA: Status data masih BERSYARAT. Fondasi Bab 1 wajib disusun sebagai rancangan sementara dan mencantumkan data yang belum dipastikan sebagai batasan penelitian."
    : feas.computedReadiness === "DATA_BLOCKED"
    ? "- PERINGATAN BLOCKED: Ada data kritis yang TIDAK TERSEDIA. Fondasi Bab 1 tidak aman dilanjutkan untuk arah ini."
    : "- KONDISI DATA: Data utama sudah dipastikan tersedia."
}

[STATUS DASAR FENOMENA]

- Status Dasar: ${phenStatus} (${phenStatusLabel})
- Catatan: ${phenStatusNote}

[FENOMENA TERKALIBRASI & MASALAH]

- Ringkasan Fenomena: ${phen.summary || "-"}
- Masalah Empiris Teramati: ${phen.empirical_problem || "-"}
- Masalah Pengetahuan: ${phen.knowledge_problem || "-"}
- Cakupan: Objek: ${phen.scope?.object_or_population || "-"}, Wilayah: ${phen.scope?.geography || "-"}, Periode: ${phen.scope?.reference_period || "-"}, Konteks: ${phen.scope?.event_or_context || "-"}
- Bukti Fenomena: ${(phen.evidence || []).map((e) => `[${e.source_id}] ${e.claim} (${e.evidence_location})`).join("; ") || "-"}
- Hal yang Belum Terbukti: ${(phen.what_is_not_proven || []).join("; ") || "-"}
- Klaim yang Dilarang: ${(phen.prohibited_claims || []).join("; ") || "-"}

[KLASIFIKASI BOBOT SUMBER]

${sourceWeightsText}

Aturan Klasifikasi Bobot Sumber:
1. Klaim utama Bab 1 harus ditopang minimal satu sumber UTAMA.
2. Sumber PENDUKUNG boleh digunakan untuk konteks atau penguat, tetapi tidak menjadi satu-satunya dasar klaim utama.
3. Sumber PERLU_DIPERIKSA tidak boleh digunakan untuk klaim siap tulis (status pada evidence_ledger tidak boleh READY_TO_DRAFT).
4. Jika source ID digunakan tetapi tidak memiliki klasifikasi pada source_weights, perlakukan sebagai PERLU_DIPERIKSA.
5. Pertahankan ID sumber persis seperti input. Jangan mengubah ID-01 menjadi S01 atau sebaliknya.
6. Jenis dokumen dan bobot sumber adalah dua hal berbeda. Keduanya harus tetap dapat ditelusuri.
7. Jangan otomatis menganggap semua sumber yang diberi label INTI oleh NotebookLM sebagai UTAMA.

[KANDIDAT RESEARCH GAP TERKAIT]

${gapsSection}

[BUKTI LITERATUR RELEVAN TERKAIT ARAH]

${input.relevantLiteratureEvidence || "Paket bukti terlampir pada konteks arah."}

[TUGAS DAN ATURAN AKADEMIK FINALISASI BAB 1]

1. Bangun Rantai Logika Penelitian (research_logic_chain) 7 tahap: CONTEXT -> PHENOMENON -> EMPIRICAL_PROBLEM -> PRIOR_KNOWLEDGE -> KNOWLEDGE_LIMIT -> RESEARCH_DIRECTION -> RESEARCH_QUESTION.
2. Rumuskan 1–3 kandidat rumusan masalah dan 1-ke-1 tujuan penelitian yang berpasangan.
3. Petakan kontribusi sementara (empiris, praktis, akademik, metodologis) dan klaim kontribusi yang dilarang.
4. Buat maksimal 3 gambaran bentuk judul (bukan judul final) dengan asumsi dan keputusan yang masih belum ditentukan.
5. Susun Peta Narasi Latar Belakang tepat 7–9 bagian (background_map) dengan fungsi paragraf jelas, pesan utama, safe_claims yang merujuk source_ids, transisi logis, dan prohibited_claims.
   - Bedakan claim_type pada safe_claims:
     * EMPIRICAL_FACT: fakta langsung dari sumber (source_ids wajib minimal 1, claim_id wajib ada di evidence_ledger).
     * CROSS_SOURCE_SYNTHESIS: sintesis antar-sumber (source_ids wajib minimal 2 unik, claim_id wajib ada di evidence_ledger).
     * RESEARCHER_DECISION: pilihan/keputusan sementara mahasiswa (source_ids boleh [], wajib ada decision_basis, JANGAN dibuatkan sitasi palsu seolah-olah temuan jurnal).
6. Buat Catatan Bukti (Evidence Ledger) lengkap yang mendaftarkan seluruh claim_id, klaim netral, claim_type, source_ids (bisa lebih dari satu sumber), source_weights, lokasi bukti, fungsi Bab 1, status dukungan (READY_TO_DRAFT | NEEDS_VERIFICATION | DO_NOT_USE), dan batas penggunaan.
   - Klaim yang hanya didukung sumber PERLU_DIPERIKSA tidak boleh berstatus READY_TO_DRAFT.
   - RESEARCHER_DECISION boleh memiliki source_ids: [] dan wajib membawa decision_basis.
7. Patuhi Aturan Akademik Ketat:
   - DILARANG mengubah keputusan mahasiswa menjadi temuan literatur.
   - DILARANG memberikan sitasi pada keputusan mahasiswa seolah-olah keputusan itu berasal dari artikel.
   - DILARANG mengubah korelasi atau urutan waktu menjadi hubungan sebab-akibat mutlak.
   - DILARANG menggabungkan outcome yang tidak setara (ERC, abnormal return, harga saham, TVA, dll.).
   - DILARANG menyatakan kandidat gap sebagai fakta final.
   - DILARANG mengarang data, sumber, kutipan, DOI, halaman, teori, variabel, metode, populasi, atau periode.
   - DILARANG menulis fenomena sebagai fakta dunia nyata jika status dasar fenomena bukan VERIFIED_REAL_WORLD.
   - DILARANG menaikkan BAB1_CONDITIONAL menjadi BAB1_READY jika bukti fenomena atau data kritis belum dipastikan.
   - Gunakan sumber utama untuk klaim utama; jangan memaksakan seluruh sumber masuk ke narasi jika tidak relevan langsung.
   - Jika kesiapan data berstatus CONDITIONAL atau fenomena berstatus LITERATURE_INDICATED, tulis fondasi sebagai rancangan sementara dan teruskan ketidakpastian data/fenomena sebagai batasan.
   - Jika kesiapan data DATA_BLOCKED, status fondasi wajib BAB1_BLOCKED dan jangan membuat fondasi yang menyesatkan.
8. Rumuskan hal yang harus dikonsultasikan kepada dosen pembimbing (maksimal 3 pertanyaan paling menentukan).
9. [GAYA BAHASA AKADEMIK] Gunakan bahasa ilmiah mahasiswa S1 yang jelas, natural, runtut, dan baku. Hindari bahasa terlalu kaku, jargon yang tidak dijelaskan, kalimat hiperbolis, serta kalimat yang terdengar seperti keluaran AI. Pertahankan ketidakpastian, konteks sumber, dan batas klaim.
10. Keluarkan tepat satu blok transfer SKRIFLOW_BAB1_FOUNDATION_V1 di antara penanda.

[FORMAT DATA TRANSFER]

Keluarkan tepat satu blok transfer berikut tanpa Markdown code fence:

=== BEGIN SKRIFLOW_BAB1_FOUNDATION_V1 ===
{
  "schema_version": 1,
  "foundation_status": "BAB1_READY|BAB1_CONDITIONAL|BAB1_BLOCKED",
  "phenomenon_basis_status": "${phenStatus}",
  "status_reason": "...",
  "blocking_items": ["..."],
  "selected_direction": {
    "id": "${dir.id.replace(/"/g, '\\"')}",
    "name": "${dir.name.replace(/"/g, '\\"')}",
    "student_selected": true,
    "selection_reason": "...",
    "direction_readiness": "${dir.readiness}",
    "data_readiness": "${feas.computedReadiness}"
  },
  "problem_structure": {
    "empirical_phenomenon": "...",
    "empirical_problem": "...",
    "knowledge_problem": "...",
    "candidate_gap_statement": "...",
    "gap_ids": ${JSON.stringify(gaps.length > 0 ? gaps.map((g) => g.id) : ["GAP01"])},
    "gap_strengths": ${JSON.stringify(gaps.length > 0 ? gaps.map((g) => g.strength) : ["KUAT"])},
    "provisional_research_problem": "..."
  },
  "research_logic_chain": [
    {
      "order": 1,
      "stage": "CONTEXT",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    },
    {
      "order": 2,
      "stage": "PHENOMENON",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    },
    {
      "order": 3,
      "stage": "EMPIRICAL_PROBLEM",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    },
    {
      "order": 4,
      "stage": "PRIOR_KNOWLEDGE",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    },
    {
      "order": 5,
      "stage": "KNOWLEDGE_LIMIT",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    },
    {
      "order": 6,
      "stage": "RESEARCH_DIRECTION",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    },
    {
      "order": 7,
      "stage": "RESEARCH_QUESTION",
      "statement": "...",
      "evidence_source_ids": ["..."],
      "limitations": "..."
    }
  ],
  "candidate_research_questions": [
    {
      "id": "RQ01",
      "question": "...",
      "linked_gap_ids": ["..."],
      "linked_source_ids": ["..."],
      "assumptions": ["..."],
      "unresolved_terms": ["..."]
    }
  ],
  "candidate_objectives": [
    {
      "id": "OBJ01",
      "linked_question_id": "RQ01",
      "objective": "..."
    }
  ],
  "provisional_contributions": {
    "empirical": ["..."],
    "practical": ["..."],
    "academic": ["..."],
    "methodological": ["..."],
    "prohibited_contribution_claims": ["..."]
  },
  "tentative_scope": {
    "unit_of_analysis": "...",
    "object_or_population": "...",
    "geography": "...",
    "event_or_context": "...",
    "potential_period": "...",
    "potential_data_sources": ["..."],
    "in_scope": ["..."],
    "out_of_scope": ["..."],
    "unresolved_items": ["..."]
  },
  "working_title_previews": [
    {
      "id": "T01",
      "title": "...",
      "label": "GAMBARAN_BUKAN_JUDUL_FINAL",
      "assumptions": ["..."],
      "missing_decisions": ["..."]
    }
  ],
  "background_map": [
    {
      "order": 1,
      "function": "SPECIFIC_CONTEXT",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM01",
          "statement": "...",
          "claim_type": "EMPIRICAL_FACT",
          "source_ids": ["..."],
          "decision_basis": null
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    },
    {
      "order": 2,
      "function": "OBJECT_AND_SCOPE",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM02",
          "statement": "...",
          "claim_type": "EMPIRICAL_FACT",
          "source_ids": ["..."],
          "decision_basis": null
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    },
    {
      "order": 3,
      "function": "EMPIRICAL_PHENOMENON",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM03",
          "statement": "...",
          "claim_type": "EMPIRICAL_FACT",
          "source_ids": ["..."],
          "decision_basis": null
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    },
    {
      "order": 4,
      "function": "WHY_IT_IS_A_PROBLEM",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM04",
          "statement": "...",
          "claim_type": "EMPIRICAL_FACT",
          "source_ids": ["..."],
          "decision_basis": null
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    },
    {
      "order": 5,
      "function": "PRIOR_RESEARCH",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM05",
          "statement": "...",
          "claim_type": "CROSS_SOURCE_SYNTHESIS",
          "source_ids": ["...", "..."],
          "decision_basis": null
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    },
    {
      "order": 6,
      "function": "KNOWLEDGE_LIMIT_OR_GAP",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM06",
          "statement": "...",
          "claim_type": "CROSS_SOURCE_SYNTHESIS",
          "source_ids": ["...", "..."],
          "decision_basis": null
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    },
    {
      "order": 7,
      "function": "URGENCY_AND_DIRECTION",
      "key_message": "...",
      "safe_claims": [
        {
          "claim_id": "CLM07",
          "statement": "...",
          "claim_type": "RESEARCHER_DECISION",
          "source_ids": [],
          "decision_basis": "Alasan konkret keputusan sementara mahasiswa"
        }
      ],
      "prohibited_claims": ["..."],
      "transition_to_next": "...",
      "missing_information": ["..."],
      "readiness": "READY"
    }
  ],
  "evidence_ledger": [
    {
      "claim_id": "CLM01",
      "claim": "...",
      "claim_type": "EMPIRICAL_FACT",
      "source_ids": ["..."],
      "source_weights": [
        {
          "source_id": "...",
          "weight": "UTAMA"
        }
      ],
      "evidence_location": "...",
      "original_context": "...",
      "bab1_function": "Latar belakang konteks",
      "usage_limit": "Hanya untuk konteks",
      "support_status": "READY_TO_DRAFT",
      "decision_basis": null
    }
  ],
  "paragraph_claims": [
    {
      "function": "EMPIRICAL_PHENOMENON",
      "claimType": "EMPIRICAL_FACT|CROSS_SOURCE_SYNTHESIS|RESEARCHER_DECISION",
      "proposedClaim": "Pernyataan klaim terkalibrasi",
      "sourceIds": ["S01"],
      "sourceReferences": [
        {
          "authorsYear": "Nama & Tahun",
          "title": "Judul Artikel",
          "doiOrUrl": "https://doi.org/...",
          "locator": "Halaman/Tabel spesifik"
        }
      ],
      "sampleContext": "Konteks sampel",
      "usageLimit": "Batas penggunaan klaim",
      "readiness": "READY_TO_DRAFT|NEEDS_VERIFICATION|DO_NOT_USE"
    }
  ],
  "academic_audit": {
    "directCoreSourceCount": 0,
    "partialCoreSourceCount": 0,
    "independentAuthorTeamCount": 0,
    "metadataConflictCount": 0,
    "exactLocatorCount": 0,
    "phenomenonCoherence": "COHERENT_ENOUGH|NEEDS_NARROWING|INCOHERENT",
    "status": "ENOUGH_FOR_GAP_ANALYSIS|ENOUGH_FOR_EXPLORATION_ONLY|INSUFFICIENT",
    "blockers": ["..."]
  },
  "feasibility_summary": {
    "confirmed_data": ["..."],
    "unconfirmed_data": ["..."],
    "unavailable_data": ["..."],
    "implications": ["..."]
  },
  "supervisor_questions": ["..."],
  "unresolved_decisions": ["..."],
  "prohibited_claims": ["..."],
  "recovery_actions": ["..."]
}
=== END SKRIFLOW_BAB1_FOUNDATION_V1 ===

Gunakan JSON murni valid tanpa code fence, double quote, dan tanpa trailing comma.`;

  return promptText
    .replace(/\bundefined\b/g, "Belum diketahui")
    .replace(/\[object Object\]/g, "");
}

/**
 * Analyzes Tool 4 Bedah Prompt 4A metrics, dynamic context breakdown, and limits.
 */
export function analyzeBedahPrompt(input: ResearchBedahInput) {
  const finalPrompt = assembleBedahPrompt(input);
  const finalLength = countPromptCharacters(finalPrompt);

  const emptyPrompt = assembleBedahPrompt({
    prodi: "",
    areaEksplorasi: "",
    literatureEvidencePackage: "",
  });
  const staticTemplateLength = countPromptCharacters(emptyPrompt);
  const dynamicContextLength = Math.max(0, finalLength - staticTemplateLength);

  return {
    promptId: "bedah-fenomena-literatur",
    staticTemplateLength,
    dynamicContextLength,
    finalLength,
    safeTarget: BEDAH_LIMITS.safeTarget,
    hardLimit: BEDAH_LIMITS.hardLimit,
    status: getBedahPromptBudgetStatus(finalLength),
  };
}

/**
 * Analyzes Tool 4 Bedah Prompt 4B metrics, dynamic context breakdown, and limits.
 */
export function analyzeBedahPrompt4B(input: ResearchBedahInput4B) {
  const finalPrompt = assembleBedahPrompt4B(input);
  const finalLength = countPromptCharacters(finalPrompt);

  return {
    promptId: "bedah-bab1-foundation-4b",
    finalLength,
    safeTarget: BEDAH_LIMITS.safeTarget,
    hardLimit: BEDAH_LIMITS.hardLimit,
    status: getBedahPromptBudgetStatus(finalLength),
  };
}
