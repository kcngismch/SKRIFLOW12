# QC Prompt via Browser (Gemini web asli, 2026-09-09)

Jalur: prompt dirakit assembler ASLI aplikasi -> ditempel ke gemini.google.com (anonim) via browser QA -> respons diekstrak -> diuji ke parser ASLI.

## Tool 1 (Cari Ide)
- Respons 18.365 char, blok transfer utuh.
- Parser: DITOLAK. errorDetails: Area A01/A02/A03 — 'phenomenon_search_directions' wajib minimal 2 arah; Gemini cuma kasih 1 per area.
- Kontrol: fixture T1 lama (live Gemini 2026-09-08) tetap VALID -> penolakan karena isi, bukan harness.
- Tindak lanjut: pertegas di prompt template Tool 1 bahwa WAJIB >= 2 phenomenon_search_directions per area.

## Tool 2 (Cari Fenomena)
- Respons 4.953 char, 1 kandidat (F01, pencatatan manual UMKM).
- Parser: DITERIMA, structuralStatus "Struktur lengkap", 0 warnings.
- Catatan: kandidat datang TANPA provenance/sumber (array kosong) dan parser tetap terima; enforcement sumber ada di gate UI (centang 2 sumber unik). Pertimbangkan hardening di parser bila mau.

## Tool 3 (NotebookLM stage A)
- GAGAL dijalankan: tab browser mati 3x di tengah streaming (output panjang; Gemini web berhenti sebelum END marker). Bukan bug Skriflow. Next: pakai tombol 'lanjutkan' Gemini atau naikkan inactivity_timeout browser Hermes.
