# PRD Skriflow — MVP v1

> Status: aktif · Dibuat 2026-09-08 · Horizon: Sep–Nov 2026
> Sumber: docs/research/0-SINTESIS (fondasi akademik), 4-kompetitor-2026-09 (pasar), src/data/tools.ts (state terkini)

## 1. Ringkasan produk

Skriflow memandu mahasiswa S1 Indonesia menjalani **corong penelitian yang benar** (ide → fenomena terbukti → literatur → fondasi arah penelitian) dengan AI sebagai **asisten proses**, bukan penulis. Output = prompt terstruktur untuk ChatGPT/Gemini/NotebookLM + gate akademik deterministik (verifikasi sumber, provenance, tanda "PERLU CEK MANUAL").

**Red line permanen:** tidak pernah menghasilkan judul, gap, novelty, atau naskah final. Ini satu-satunya posisi yang tidak dimiliki kompetitor — jangan dikorbankan demi fitur apa pun.

## 2. Masalah & target user

- Penyebab #1 skripsi ditunda di sempro: fenomena tidak terbukti (doc 3). Mahasiswa pakai AI asal-asalan → output tak terverifikasi → rawan ditolak dosen, apalagi kebijakan kampus makin ketat (deklarasi AI wajib, spt UI PR 16/2025).
- Target user: mahasiswa S1 tahap **pra-proposal** (pilot: ekonomi-akuntansi — akses data IDX/BPS jelas, sesuai latar Aul). Ekspansi prodi lain setelah bukti traksi.
- Budget mental user: anchor kompetitor Rp 99rb/bln (Skripsita) & Rp 149–299rb pass sekali bayar (Skripsweet); jasa bimbingan manusia Rp 85rb+. Harga kita harus jelas di bawah itu.

## 3. Posisi & differentiator

"Satu-satunya yang **aman dibawa ke dosen**": proses terdeklarasi, sumber bisa dicek balik, jejak proses bisa diekspor (compliance UI PR 16/2025). AI-agnostic (tanpa API LLM) → biaya marginal ≈ 0. Jangan adu kecepatan generate — itu kalah modal dan melanggar red line.

## 4. Scope MVP v1

**Sudah jadi (prototype, terverifikasi dari repo):**
- 4 tool berantai: Cari Ide → Cari & Validasi Fenomena → Cari Literatur (NotebookLM) → Bedah Fenomena & Literatur
- Landing page + FAQ (posisi etis sudah tertulis)
- Parser gate: hard-reject bukti tanpa URL valid, enum provenance
- Export/Import backup JSON (mitigasi data-loss localStorage)
- Fondasi akademik terdokumentasi (docs/research 0–3) + riset kompetitor (doc 4)

**Harus selesai sebelum launch (definisi "v1 selesai"):**
- [ ] Deploy ke Vercel + domain sendiri
- [ ] Funnel: tool 1 bisa dicoba gratis tanpa login (pola terbukti kompetitor)
- [ ] Paywall: pass sekali bayar **Rp 39.000** (finalisasi = keputusan Aul) via QRIS manual → kode akses.ponytail: tanpa payment gateway; upgrade ke Midtrans/LemonSqueezy saat >20 pembeli/bln.
- [ ] Halaman "Deklarasi AI & Etika" (isi dari 0-SINTESIS §5) — differentiator yang sekaligus jadi halaman marketing
- [ ] Beta test: 5 mahasiswa menyelesaikan chain tool 1→4 tanpa bantuan

## 5. Out of scope v1

- Generate judul/gap/naskah (red line, bukan cuma "nanti")
- Simulasi sidang, roadmap mingguan, review draft — kandidat v2
- Export DOCX, integrasi OpenAlex — v2
- Akun multi-device (Supabase) — v1.5, saat butuh paywall yang rapi
- Payment gateway — lihat ponytail di §4

## 6. Roadmap 3 bulan

- **Sep 2026:** minggu 1–2 polish UX + copy landing final; minggu 3–4 deploy Vercel + funnel + paywall → **v1 live**
- **Okt 2026:** 5–10 user uji → iterasi berdasarkan titik drop-off; rilis fitur "jejak proses" (export riwayat prompt sebagai bukti deklarasi AI)
- **Nov 2026:** 2–3 artikel SEO (pola listicle kompetitor, tapi framing proses) + keputusan v2: simulasi sidang berbasis prompt ATAU modul Bab 1–3 — pilih berdasarkan data user, bukan asumsi

## 7. Metrik (asumsi awal — revisi setelah 1 bulan live)

| Metrik | Target 3 bulan |
|---|---|
| Pengunjung unik | 300 |
| Generate ≥1 prompt | 50 |
| Selesai chain s/d tool 4 | 10 |
| Pembeli pass | 10 |

Metrik utama keputusan: **selesai chain** — kalau user berhenti di tool 2, masalahnya di friction, bukan marketing.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Friction copy-paste ke ChatGPT/NotebookLM | Onboarding menjelaskan kenapa keluar app (keamanan akademik = justru nilai jual) |
| Data localStorage hilang | Sudah ada export/import JSON; sarankan backup berkala di UI |
| UI/kuota tool tujuan berubah | Prompt tetap valid sebagai template manual |
| Ditangkap as "joki digital" | Halaman etika + red line permanen di semua copy |
