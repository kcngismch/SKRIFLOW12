# Studi Kasus E2E — Output AI Asli (Gemini via agy), 2026-09-08

Skenario: mahasiswa Akuntansi, minat UMKM, kualitatif/wawancara, punya akses responden UMKM kuliner sekitar kampus.

Rantai yang diuji (semua dengan output AI ASLI, bukan fixture):

| Stage | Tool | Input | Parser | Hasil |
|---|---|---|---|---|
| 1 | Tool 1 Cari Ide | prompt asli 15.725 char dari `assembleIdeaPrompt` | `parseIdeaTransfer` ✓ | 3 area eksplorasi lengkap (handoff, phenomenon directions, not_decided=7); 1 warning klasifikasi provenance (by design) |
| 2 | Tool 2 Cari & Validasi Fenomena | prompt asli 10.575 char (auto-fill dari handoff A01) | `parsePhenomenonTransfer` ✓ | 3 kandidat fenomena, evidence OJK (SP-93/2024)/BPS/DOI nyata, lokasi tidak pasti = "Tidak dapat dipastikan" (integritas OK), what_is_not_proven terisi |
| 3 | Tool 4A Bedah | prompt asli 17.383 char (fenomena F01 + paket literatur stand-in NotebookLM) | `parseBedahTransfer` ✓ | status CUKUP_UNTUK_ARAH, 3 gap (status bervariasi: CUKUP_DIDUKUNG/TERINDIKASI/PERLU_VERIFIKASI), 3 arah readiness LAYAK_DIPERIKSA, automatic_selection=false, 0 klaim absolut, claim_boundary lengkap per arah |
| 4 | Tool 4B Paket Fondasi Bab 1 | prompt asli 21.346 char (arah D01 + feasibility answers mahasiswa) | `parseBab1FoundationTransfer` ✓ | foundation_status=BAB1_CONDITIONAL (jujur: butuh verifikasi naskah), logic_chain 7 tahap, 2 RQ ↔ 2 tujuan 1:1, **background_map 7 paragraf sesuai blueprint FPsi UI** (§1–7: SPECIFIC_CONTEXT→…→URGENCY_AND_DIRECTION), evidence ledger 7 klaim |

Tool 3 (NotebookLM) TIDAK dijalankan via API: alurnya human-in-the-loop (import sumber manual + Deep Research native). Paket literatur pada stage 3–4 = fixture format stand-in. Bukti Tool 3 nyata menunggu akses NotebookLM.

Validasi akademik pada output asli:
- Tidak ada klaim absolut ("belum pernah diteliti"/"penelitian pertama") ✓
- Gap sintetis tidak muncul; G02 TERINDIKASI berisi keterbatasan substansi + verification_needed ✓
- Red line: tidak ada draft Bab 1, tidak ada judul final (working title previews tetap berlabel "belum layak diajukan") ✓
- Status kondisional (BAB1_CONDITIONAL) menunjukkan gate kejujuran bekerja, bukan overclaim ✓

Artefak: t1-output.txt, t2-output.txt, t4a-output.txt, t4b-output.txt (output mentah AI).
Skrip driver: /tmp/e2e-stage*.mts (sesi; tidak di-commit, pola pemanggilan terdokumentasi di tabel).
