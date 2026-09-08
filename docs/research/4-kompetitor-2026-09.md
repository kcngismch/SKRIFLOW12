# Riset Kompetitor Skriflow (September 2026)

> Snapshot pasar: 8 September 2026. Metode: halaman kompetitor diambil langsung (curl/Wayback); sumber harga pihak ketiga ditandai. Klaim jumlah pengguna = angka marketing kompetitor (self-reported), bukan data independen.

---

## 1. Peta pasar: 3 kategori kompetitor

**Kategori A — AI all-in-one skripsi Indonesia (direct competitor):** Skripsita AI, Skripsweet AI.
**Kategori B — Jasa manusia (bimbingan/joki-adjacent):** Educativa, KonsultanEdu, Dosenik, Class Program.
**Kategori C — Global AI academic tools (indirect):** Jenni AI, SciSpace, Elicit/Consensus + substitutor gratis ChatGPT/Gemini/NotebookLM.

## 2. Profil kompetitor

### A1. Skripsita AI (skripsita.com)
- Posisi: "Copilot skripsi #1 Indonesia, bukan joki". Klaim 54.000+ naskah, 15.000+ mahasiswa.
- Fitur: **generate Bab 1–3 dari judul dalam 5 menit** (gratis 3x tanpa login), auto-format dokumen sesuai pedoman kampus, parafrase, citation, brainstorming judul, **simulasi sidang dengan "AI dosen"**.
- Harga: free trial 3x; **Rp 99.000/bulan premium** — dari tabel komparasi di halaman mereka sendiri (snapshot Wayback 2026-06-07; BELUM DIVERIFIKASI dari checkout langsung).
- Catatan etis: messaging campuran — ada blog "AI bukan jalan pintas", tapi funnel utamanya justru "masukkan judul → Bab 1–3 jadi". Ini generate-instan yang oleh red line Skriflow dilarang.

### A2. Skripsweet AI (skripsweet.com) — kompetitor TERDEKAT
- Posisi: "Pembimbing skripsi #1", guided process 6 langkah: topik → roadmap mingguan (BAB 1→SEMPRO) → bimbingan AI per bab (Thesis Memory) → referensi (200jt+ jurnal OpenAlex + sitasi otomatis) → review/audit naskah (AI checker, cek plagiasi, cek kejujuran data) → simulasi sidang SEMPRO/SEMHAS + Pressure Mode.
- Harga (sekali bayar, bukan langganan): Freemium gratis selamanya (generator judul, preview BAB I, cek kelayakan topik); Pass Express Rp 149.000/7 hari; Pass Sempro Rp 149.000/30 hari; Pass Lulus Rp 299.000/90 hari. (Harga reguler per 1 Sep 2026; pioneer 39k/59k/129k sudah berakhir 31 Agu 2026. Checkout = otoritas final.)
- Juga: blog SEO listicle "10 Aplikasi AI untuk Skripsi", demo interaktif tanpa login, framing "bukan joki, AI asisten".
- Catatan: positioning "proses terpandu" ≈ Skriflow, TAPI mereka tetap generate judul + naskah di dalam app; validator judul & data mereka berbasis AI, bukan gate deterministik.

### B. Jasa manusia
- **Educativa** (educativa.id): bimbingan skripsi/tesis mulai Rp 99.000/paket, konsultasi judul & metode mulai Rp 85.000/pertemuan, olah data Rp 50.000/variabel, jasa Turnitin/parafrase/translate (snapshot Wayback 2025-11-08; harga live BELUM DIVERIFIKASI).
- **KonsultanEdu, Dosenik, Class Program (BSO)**: bimbingan privat online oleh dosen/konsultan; harga per pertemuan/paket.
- Makna: budget "dibimbing orang" = Rp 85rb–beberapa juta. Anchor harga AI harus jauh di bawah ini.

### C. Global
- **Jenni AI**: editor academic writing (autocomplete, AI chat, 10.000+ citation styles, PDF library). Free 10 autocomplete/hari; Plus $12/bln; Pro $29/bln (jenni.ai/pricing, diambil 2026-09-08).
- **SciSpace**: literature review / chat-with-PDF / copilot. Premium $20/bln (≈$12/bln tahunan), ada free tier (sumber pihak ketiga aitoolsatlas/costbench Jun–Agu 2026; halaman pricing asli JS-rendered).
- **Substitutor gratis terbesar**: ChatGPT/Gemini/NotebookLM — Gemini Pro bahkan gratis 1 tahun untuk mahasiswa Indonesia (2026). Ini bukan kompetitor produk, tapi pertanyaan yang WAJIB dijawab Skriflow: kenapa bayar kalau AI-nya gratis?

## 3. Kekuatan Skriflow yang terverifikasi dari source (src/, docs/research/)

1. **Gate proses ilmiah yang deterministik, bukan disclaimer.** `phenomenonParser` hard-reject bukti tanpa URL valid, `data_provenance` enum, `academicGates` menolak judul/gap/novelty instan, output ditandai "PERLU CEK MANUAL". Tidak ada kompetitor lokal yang punya ini — mereka justru jual kebalikannya (generate instan).
2. **AI-agnostic + biaya AI nol.** Output = prompt untuk ChatGPT/Gemini/NotebookLM (tool-1..3 target ChatGPT/Gemini, tool-4 NotebookLM). Skriflow tidak bayar API LLM → struktur biaya paling ringan di kelasnya, margin & harga bisa di bawah Skripsita (99rb/bln) dan Skripsweet (149rb).
3. **Fondasi akademik terdokumentasi** (docs/research 0–3: 3 pedoman universitas, 4 skripsi terverifikasi, Permendiknas 17/2010, UI PR 16/2025, UNESCO 2023). Copywriting & rule produk bisa dikutip sumbernya — kompetitor tidak punya ini.
4. **Compliance sebagai fitur (peluang unik):** UI PR 16/2025 mewajibkan deklarasi & verifikasi pemakaian AI. Riwayat prompt → export "jejak proses" = satu-satunya jawaban di pasar untuk kebijakan kampus yang makin ketat. Belum ada yang jual ini.
5. **Chain tool = corong penelitian yang benar** (ide → fenomena terbukti → literatur → bedah → Bab 1–3), selaras definisi resmi skripsi KKNI level 6.

## 4. Jarak/kelemahan vs kompetitor (jujur)

1. **Friction "copy-paste prompt"**: Skriflow mengeluarkan prompt; Skripsweet/Skripsita all-in-one dalam app (editor, memori, simulasi, export DOCX). User harus paham kenapa harus keluar app.
2. **Belum ada fitur pasca-proposal**: simulasi sidang (dimiliki KEDUA kompetitor A), review draft, roadmap mingguan, export dokumen, OpenAlex search.
3. **Belum ada funnel & monetisasi**: kompetitor pakai "coba tanpa login, gratis 3x" + pass sekali bayar murah; prototype Skriflow belum punya payment & trial funnel.
4. **Marketing gap**: kompetitor klaim puluhan ribu pengguna + blog SEO; Skriflow belum terlihat publik.
5. **Ketergantungan UX tool tujuan**: hasil prompt di NotebookLM/ChatGPT di luar kontrol Skriflow (kuota, perubahan UI).

## 5. Implikasi strategis (rekomendasi)

1. **Jangan adu di kecepatan/generate** — kalah modal & melanggar red line. Adu di: "satu-satunya yang aman dibawa ke dosen" — proses terdeklarasi, sumber terverifikasi, jejak audit. Kompetitor rawan dicap joki-adjacent saat kampus makin ketat.
2. **Harga**: anchor kompetitor 149rb–299rb (pass sekali bayar) & 99rb/bln. Freemium tool 1–2 + pass sekali bayar Rp 25.000–49.000 masuk akal; biaya marginal ≈ 0 (tanpa API AI).
3. **Fitur murah bernilai tinggi yang bisa dijiplak secara etis**: simulasi sidang berbasis prompt (bukan AI dosen berbayar), "cek kelayakan topik/data" ala Skripsweet tapi pakai bukti-awal gate yang sudah ada, roadmap ringan.
4. **Funnel wajib**: 1 tool gratis tanpa login (seperti pola terbukti Skripsita/Skripsweet) sebelum minta akun.
5. **Jaga differentiator**: jangan kepancing tambah generate judul/naskah — itu membatalkan satu-satunya posisi yang tidak dimiliki kompetitor.

## Sumber
- skripsita.com (beranda, /pricing, /ai-untuk-skripsi; snapshot Wayback 2026-06-07) + ai.skripsita.com (live)
- skripsweet.com /cara-kerja /fitur /harga (live, 2026-09-08)
- educativa.id/pricing (snapshot Wayback 2025-11-08)
- jenni.ai/pricing (live, 2026-09-08)
- scispace.com/pricing + aitoolsatlas.ai + costbench.com (Jun–Agu 2026)
- konsultanedu.id, dosenik.com, classprogram.id (profil; harga BELUM DIVERIFIKASI)
- literarily-apps.id: Gemini Pro gratis 1 tahun mahasiswa Indonesia 2026

## 6. Lanskap Meta Ads (snapshot 2026-09-08, via Ad Library tanpa login)

Metode: facebook.com/ads/library, keyword "skripsi" + "skripsweet", negara ID, iklan aktif. 29 iklan unik terkumpul (261 entri ter-parse sebelum virtualisasi DOM). Keyword match longgar (ada iklan non-skripsi nyempil), jadi jumlah jangan dikutip mentah.

Temuan:
- Pasar terbukti & evergreen: median umur iklan 73 hari, 12/29 tayang ≥90 hari, tertua 314 hari (JagoPrompt, sejak 29 Okt 2025). Iklan yang jalan berbulan-bulan = mereka untung di CAC.
- Kategori dominan: **pendampingan manusia premium** — Belajarriset.id (6 iklan, "Platinum Graduate Class", private 1:1, simulasi sidang, monitoring progres buat ortu, framing "bukan joki"), KonsultanEdu (5), Educativa (1). Plus joki terang-terangan masih tayang ("Hi kamu yg malas ngerjain skripsi... dm admin" — Jasa Tugas Maha Siswa).
- **Skripsita Ai**: 1 iklan aktif — copy pain-point spesifik: "Yang bikin capek bukan revisinya. Tapi daftar isi yang geser tiap kali ngedit... 75.000+ mahasiswa sudah pakai. Mulai 99rb/bulan." CTA: "Coba gratis tanpa daftar". Pola: pain spesifik + social proof + harga + trial tanpa friksi.
- **Student Prompt**: model paling mirip Skriflow — jual PROMPT PACK via funnel IG: iklan "Komen 'PROMPT' kalau kamu mau panduannya... SELESAI SKRIPSI 3 BULAN" → link bio Instagram. Bukti prompt-as-product laku dipasarkan via Meta/IG.
- **Skripsweet: 0 iklan** di Meta (keyword "skripsweet" = no results) — growth mereka via SEO/organik. Lane iklan Meta buat posisi "AI guided proses, bukan joki" masih kosong.

Implikasi iklan buat Skriflow:
1. Angle iklan yang terbukti: pain-point spesifik (bukan "AI bikin skripsi"). Kandidat sesuai riset internal: "stuck di BAB 1 karena fenomena gak ketemu" / "takut ditanya dosen pas bimbingan" (kesalahan #1 = fenomena tidak terbukti, docs/research/3).
2. Funnel = "coba gratis tanpa login" (sudah jadi pola SAI; belum ada di prototype → prasyarat sebelum bakar budget).
3. Framing "bukan joki" sudah dipakai semua orang — Skriflow bisa naik satu level: satu-satunya yang kasih **jejak proses terdeklarasi buat dosen** (UI PR 16/2025).
4. Budget anchor kompetitor: jasa manusia jual paket 99rb+ dengan iklan jalan 3–10 bulan; produk digital murah + biaya AI nol = margin iklan lebih sehat.
