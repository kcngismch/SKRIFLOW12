/**
 * Outline Latar Belakang Bab 1 — jalur tanpa AI.
 *
 * Mahasiswa yang tidak mau memakai ChatGPT/Gemini tetap mendapat keluaran utuh:
 * kerangka tulisan + klaim yang boleh dipakai + sumbernya. Ini yang disalin ke
 * Word/Docs dan dikembangkan sendiri.
 *
 * Fungsi murni: tidak menyentuh DOM, tidak menyentuh storage.
 */

import type { Bab1FoundationV1 } from "@/types/tool";

const LABEL_FUNGSI: Record<string, string> = {
  SPECIFIC_CONTEXT: "Konteks Penelitian",
  OBJECT_AND_SCOPE: "Objek dan Ruang Lingkup",
  EMPIRICAL_PHENOMENON: "Fenomena Empiris",
  WHY_IT_IS_A_PROBLEM: "Mengapa Ini Menjadi Masalah",
  PRIOR_RESEARCH: "Penelitian Terdahulu",
  KNOWLEDGE_LIMIT_OR_GAP: "Batas Pengetahuan",
  URGENCY_AND_DIRECTION: "Urgensi dan Arah Penelitian",
};

const LABEL_STATUS: Record<string, string> = {
  READY_TO_DRAFT: "siap ditulis",
  NEEDS_VERIFICATION: "perlu diperiksa dulu",
  DO_NOT_USE: "JANGAN dipakai",
};

/**
 * Menyusun outline latar belakang dalam Markdown siap tempel.
 * `targetKata` diisi hanya bila mahasiswa ingin penjaga panjang ikut tercetak.
 */
export function susunOutlineLatarBelakang(
  foundation: Bab1FoundationV1,
  opsi?: { sertakanBatasPanjang?: boolean }
): string {
  const f = foundation;
  const sertakanPanjang = opsi?.sertakanBatasPanjang !== false;
  const total = f.target_words_total || 1150;
  const baris: string[] = [];

  baris.push("# Rencana Latar Belakang Bab 1");
  baris.push("");
  baris.push(`Status fondasi: ${f.foundation_status}`);
  baris.push(`Alasan: ${f.status_reason}`);
  baris.push("");
  baris.push("Catatan: ini KERANGKA, bukan tulisan jadi. Kalimat di bawah masih poin-poin");
  baris.push("yang harus kamu kembangkan sendiri. Semua klaim wajib memakai sumber yang");
  baris.push("tercantum pada bagian Catatan Bukti.");
  baris.push("");

  const judul = f.working_title_previews || [];
  if (judul.length > 0) {
    baris.push("## Gambaran Judul (masih tentatif)");
    judul.forEach((j, i) => {
      baris.push(`${i + 1}. ${j.title || ""}`);
      (j.assumptions || []).forEach((a) => baris.push(`   - Mengandaikan: ${a}`));
      (j.missing_decisions || []).forEach((m) => baris.push(`   - Belum diputuskan: ${m}`));
    });
    baris.push("");
  }

  const rm = f.candidate_research_questions || [];
  const tujuan = f.candidate_objectives || [];
  if (rm.length > 0 || tujuan.length > 0) {
    baris.push("## Rumusan Masalah dan Tujuan (tentatif — konfirmasi ke dosen)");
    rm.forEach((q, i) => baris.push(`RM${i + 1}. ${q.question}`));
    tujuan.forEach((o, i) => baris.push(`T${i + 1}. ${o.objective}`));
    baris.push("");
  }

  const peta = f.background_map || [];
  if (peta.length > 0) {
    baris.push("## Kerangka Paragraf");
    baris.push("");
    if (sertakanPanjang) {
      baris.push(`Total target: 1000-1300 kata (target kerja ${total} kata).`);
      baris.push("");
    }
    peta.forEach((p) => {
      const label = LABEL_FUNGSI[p.function] || p.function;
      baris.push(`### Paragraf ${p.order} - ${label}`);
      if (p.readiness === "BLOCKED") {
        baris.push("STATUS: BLOKIR. Jangan ditulis dulu. Selesaikan dasar fenomenanya.");
      }
      if (sertakanPanjang && p.target_word_range) {
        baris.push(`Panjang sasaran: ${p.target_word_range} kata`);
      }
      baris.push(`Pesan utama: ${p.key_message}`);
      const aman = p.safe_claims || [];
      if (aman.length > 0) {
        baris.push("Klaim yang boleh dipakai:");
        aman.forEach((c) => {
          const sumber = (c.source_ids || []).join(", ") || "tanpa sumber tercatat";
          const status = LABEL_STATUS[c.support_status || "READY_TO_DRAFT"] || "siap ditulis";
          baris.push(`  - [${c.claim_id}] (${status}) ${c.statement}`);
          baris.push(`    Sumber: ${sumber}`);
        });
      } else {
        baris.push("Klaim yang boleh dipakai: belum ada. Paragraf ini belum punya dasar.");
      }
      const larangan = p.prohibited_claims || [];
      if (larangan.length > 0) {
        baris.push("Jangan tulis di paragraf ini:");
        larangan.forEach((c) => baris.push(`  - ${c}`));
      }
      if (p.missing_information && p.missing_information.length > 0) {
        baris.push(`Informasi yang masih kosong: ${p.missing_information.join("; ")}`);
      }
      if (p.transition_to_next) baris.push(`Sambungan ke paragraf berikutnya: ${p.transition_to_next}`);
      baris.push("");
    });
  }

  const ledger = f.evidence_ledger || [];
  if (ledger.length > 0) {
    baris.push("## Catatan Bukti (hanya klaim di sini yang boleh masuk tulisan)");
    baris.push("");
    ledger.forEach((e) => {
      const status = LABEL_STATUS[e.support_status || "READY_TO_DRAFT"] || "siap ditulis";
      const sumber = (e.source_ids || (e.source_id ? [e.source_id] : [])).join(", ") || "tanpa sumber tercatat";
      baris.push(`- [${e.claim_id}] (${
        status
      }) ${e.claim}`);
      baris.push(`  Sumber: ${sumber}`);
      if (e.bab1_function) baris.push(`  Dipakai untuk: ${e.bab1_function}`);
      if (e.usage_limit) baris.push(`  Batas pakai: ${e.usage_limit}`);
    });
    baris.push("");
  }

  const laranganGlobal = f.prohibited_claims || [];
  if (laranganGlobal.length > 0) {
    baris.push("## Klaim yang Dilarang Muncul");
    baris.push("");
    laranganGlobal.forEach((c) => baris.push(`- ${c}`));
    baris.push("");
  }

  const belumFinal = f.unresolved_decisions || [];
  if (belumFinal.length > 0) {
    baris.push("## Keputusan yang Belum Final (jangan ditulis sebagai kepastian)");
    baris.push("");
    belumFinal.forEach((c) => baris.push(`- ${c}`));
    baris.push("");
  }

  const dosen = f.supervisor_questions || [];
  if (dosen.length > 0) {
    baris.push("## Bahan Konsultasi Dosen");
    baris.push("");
    dosen.forEach((q, i) => baris.push(`${i + 1}. ${q}`));
    baris.push("");
  }

  const kontribusi = f.provisional_contributions;
  if (kontribusi) {
    const kelompok: Array<[string, string[]]> = [
      ["Kontribusi empiris", kontribusi.empirical || []],
      ["Kontribusi praktis", kontribusi.practical || []],
      ["Kontribusi akademik", kontribusi.academic || []],
      ["Kontribusi metodologis", kontribusi.methodological || []],
    ];
    const ada = kelompok.filter(([, items]) => items.length > 0);
    if (ada.length > 0) {
      baris.push("## Bahan Sub-bab Manfaat Penelitian");
      baris.push("");
      ada.forEach(([label, items]) => {
        baris.push(`${label}:`);
        items.forEach((x) => baris.push(`- ${x}`));
      });
      baris.push("");
    }
  }

  return baris.join("\n");
}
