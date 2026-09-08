# SINTESIS: Fondasi Ilmu Skripsi → Keputusan Desain Skriflow

> Dokumen jembatan antara 3 dokumen riset (1-struktur, 2-metodologi, 3-proses-kesalahan-etika) dan desain produk Skriflow. Sumber lengkap + URL ada di masing-masing dokumen riset. Ditulis setelah membaca: 3 panduan resmi universitas (FIKES UDS 2024, FPsi UI 2018, UIN Raden Mas Said 2021), 4 skripsi asli (UNAIR ×2, UHAMKA, UNY — struktur diverifikasi dari PDF repositori), literatur metodologi (Sugiyono, Creswell, PMC), dan regulasi etika (Permendiknas 17/2010, UI PR 16/2025, UNESCO 2023).

---

## 1. PELAJARAN INTI (satu paragraf per dokumen)

**Struktur (doc 1):** Skripsi = **bukti kemampuan riset perorangan** (fungsi primer, level 6 KKNI) + latihan menjadi sarjana + kontribusi kecil ke ilmu. Karena itu yang dinilai dosen bukan teksnya, tapi **proses ilmiah yang bisa dipertanggungjawabkan**. Struktur bab I–V punya fungsi logis yang tetap di balik variasi label: Bab I = argumen kebutuhan (piramida terbalik, data bukan opini), Bab II = landasan & posisi (sumber primer, dialog dengan peneliti lain), Bab III = resep yang bisa diulang, Bab IV = hasil (WHAT) terpisah dari pembahasan (WHY/HOW), Bab V = jawaban tuntas atas rumusan masalah. Benang merah: **argumen kebutuhan → landasan & posisi → cara yang dapat diverifikasi → temuan + makna → jawaban tuntas**.

**Metodologi (doc 2):** **Pertanyaan riset menentukan metode, bukan sebaliknya.** Kuantitatif (positivisme: hubungan/pengaruh antar variabel, data numerik, uji validitas-reliabilitas instrumen, hindari sampel <30, korelasi ≠ kausalitas) vs Kualitatif (interpretivisme: makna/proses/pengalaman, data naratif, trustworthiness 4 pilar) vs Mixed (pragmatisme, triangulasi). Data primer vs sekunder (BPS/IDX/BI = pilihan wajar untuk ekonomi-akuntansi). Kesalahan metodologis klasik S1: metode tidak menjawab pertanyaan, instrumen tidak diuji, sampel tidak representatif, p-hacking, kesimpulan melampaui data.

**Proses & etika (doc 3):** Penelitian = corong 6 tahap (curiosity/observasi → pertanyaan → literatur → gap → metode → data & kesimpulan); **kesalahan di tahap awal merambat ke semua tahap berikutnya**. Kesalahan #1 yang bikin skripsi ditunda di seminar proposal: **fenomena tidak terbukti** (klaim tanpa data awal). Research gap punya standar: VALID = temuan bertentangan, konteks dengan justifikasi teoretis, metode baru yang membuka pertanyaan baru, mediasi/moderasi yang belum diuji; SALAH = ganti lokasi/objek tanpa alasan teoretis, "sedang tren", "saya belum menemukan literaturnya". Output AI **bukan sumber akademik** (tanpa peer review, bisa halusinasi, tanpa authorship, tak stabil, tidak lolos verifikasi referensi) — tapi penggunaannya WAJAR untuk brainstorming, kata kunci, outline, penyempurnaan bahasa, memahami konsep, asal diverifikasi + dideklarasikan (UI PR 16/2025 mewajibkan deklarasi & verifikasi tiap tahap termasuk referensi).

---

## 2. VALIDASI DESAIN EKSISTING SKRIFLOW

Riset ini **menguatkan** keputusan yang sudah diambil di prototype:

| Desain existing | Validasi dari riset |
|---|---|
| Posisi "gap proses ilmiah, bukan instan" | Fungsi primer skripsi = bukti proses ilmiah; yang dinilai dosen adalah pertanggungjawaban, bukan teks jadi (doc 1 §1.2) |
| Chain tool: ide → fenomena → literatur → bukti (NotebookLM) → bedah | Persis corong 6 tahap penelitian yang baik (doc 3 §2) |
| "Dilarang membuat gap otomatis" + gap harus dijustifikasi | Definisi gap VALID vs SALAH (doc 3 §4.2) — gap lokasi/objek baru memang bukan gap |
| Anti-fabrikasi: dilarang mengarang sumber, `data_provenance` enum, "PERLU CEK MANUAL" | Halusinasi AI = risiko etika terbesar; output AI wajib diverifikasi ke sumber primer (doc 3 §7.3, UI PR 16/2025 Ps. 4) |
| Hasil tool = area eksplorasi, BUKAN draft | Penggunaan AI wajar = brainstorm/eksplorasi; dilarang = isi penuh tanpa kontrol manusia (doc 3 §7.2) |
| Budget karakter NotebookLM (hard 3.900 / safe 3.500) | Konsistensi dengan prinsip transparansi: input ke AI harus terkendali & terdokumentasi |

## 3. IMPLIKASI KONKRET PER TOOL (apa yang harus diperkuat/ditambah)

1. **Cari Ide (ide → pertanyaan):** Output ideal mengikuti cetak biru latar belakang FPsi UI: gejala → bukti data (bukan opini) → keterjangkauan ilmiah → variabel → gap → **pertanyaan riset dalam bentuk PERTANYAAN** (bukan pernyataan), spesifik, terukur, semua wajib terjawab nanti (rumusan masalah = kontrak). Tambahkan contoh rumusan baik vs buruk (doc 3 §3.2).
2. **Cari & Validasi Fenomena:** Ini tool paling strategis — kesalahan #1 penyebab skripsi ditunda adalah fenomena tidak terbukti. Rule produk: **setiap fenomena wajib punya "bukti awal"** (statistik BPS/OMPOL, berita, observasi awal) terlampir; klaim tanpa bukti awal harus ditandai "BELUM TERBUKTI — jangan dibawa ke dosen".
3. **Cari Literatur Awal:** Prompt harus mengarahkan AI hanya memetakan (bukan memvonis) kredibilitas: hasil AI = kandidat sumber, wajib diverifikasi ke SINTA/Garuda/DOAJ/Scopus + cek DOI. Konten jurnal predator (ciri-ciri doc 3 §5.1) layak jadi kartu edukasi di tool ini. Sumber primer > sekunder; keseimbangan artikel empiris vs review.
4. **Bedah Hasil NotebookLM / blok transfer:** Struktur output ideal mengikuti fungsi logis bab: peta fenomena→pertanyaan→gap→metode→bukti. Tambahkan mapping **pertanyaan → desain metode** (pengaruh = kuant/survei/regresi; makna/pengalaman = kual; rancang bangun = rekayasa, tanpa hipotesis) agar mahasiswa tidak salah jalan sejak awal (doc 2 §1–2).
5. **Etika sebagai fitur (bukan disclaimer):** UI PR 16/2025 mewajibkan deklarasi penggunaan AI. Skriflow bisa jadi satu-satunya tools yang **memudahkan kepatuhan**: simpan riwayat prompt + hasil, export sebagai "jejak proses" mahasiswa (sekaligus jawaban atas risiko kehilangan data localStorage). Jejak audit prompt/draft adalah strategi pencegahan yang direkomendasikan literatur (doc 3 §7.3).
6. **Variasi kampus:** Jangan paksa satu template bab. Tampilkan kerangka fungsi logis + disclaimer eksplisit: "urutan subbab, judul bab, dan format (5 bab vs artikel) berbeda antar kampus — cek pedoman prodimu" (doc 1 §5).

## 4. YANG HARUS TETAP TIDAK DILAKUKAN (red lines produk)

- Tidak menghasilkan judul/gap/novelty/kesimpulan final — itu ruang intelektual mahasiswa.
- Tidak menyajikan output AI sebagai sumber/bukti — hanya peta eksplorasi + kandidat.
- Tidak melewati verifikasi: setiap sumber harus mampu dicek balik (URL + jenis + provenance).
- Tidak menjanjikan "skripsi cepat jadi" — janji yang benar: "proses ilmiah yang jelas dan bisa kamu pertanggungjawabkan ke dosen".

## 5. RINGKASAN UNTUK COPYWRITING

Fondasi yang benar (untuk halaman depan/komunikasi): Skriflow membantu mahasiswa menjalani **corong penelitian yang benar** — dari rasa penasaran → fenomena yang terbukti → pertanyaan yang tajam → posisi di literatur → metode yang menjawab pertanyaan → bukti yang bisa diverifikasi — dengan AI sebagai **asisten proses** yang transparan dan terdeklarasi, bukan penulis bayaran. Ini sejalan dengan fungsi resmi skripsi (KKNI level 6), kriteria penilaian dosen (substansi, metodologi, penulisan, konsistensi argumen), dan kebijakan AI kampus (deklarasi + verifikasi).
