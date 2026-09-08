export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "Apakah SKRIFLOW menulis skripsi secara otomatis?",
    answer:
      "Tidak. SKRIFLOW membantu merakit prompt sesuai kebutuhan. Jawaban tetap dihasilkan oleh platform AI yang lo gunakan dan tetap perlu diperiksa.",
  },
  {
    id: "faq-2",
    question: "Apakah harus punya akun NotebookLM, ChatGPT, atau Gemini?",
    answer:
      "Iya. SKRIFLOW tidak menjalankan AI di dalam website. Lo menyalin prompt lalu membukanya di platform pilihan.",
  },
  {
    id: "faq-3",
    question: "Apakah hasilnya dijamin benar?",
    answer:
      "Tidak. Prompt yang lebih terarah membantu memperjelas pekerjaan, tetapi hasil AI dan sumber akademik tetap harus diverifikasi.",
  },
  {
    id: "faq-4",
    question: "Apakah data skripsi disimpan?",
    answer:
      "Prototype tidak memakai backend atau database. Input hanya disimpan secara lokal di perangkat melalui browser tanpa dikirim ke server.",
  },
  {
    id: "faq-5",
    question: "Apakah tools ini sudah mencakup Bab 1 sampai Bab 3?",
    answer:
      "Belum. Prototype dimulai dari empat tools awal. Bagian berikutnya dikembangkan setelah alur dasar selesai diuji.",
  },
  {
    id: "faq-6",
    question: "Apakah SKRIFLOW berafiliasi dengan NotebookLM, ChatGPT, atau Gemini?",
    answer:
      "Tidak. Nama platform ditampilkan untuk menjelaskan tempat prompt dapat digunakan.",
  },
];
