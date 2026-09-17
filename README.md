# RIMBARA AI V2.3 — Demo Gratis + Voice Lokal

Versi ini memakai audio British-English yang dibundel di folder `assets/audio`, sehingga demo tutor tetap berbicara tanpa OpenAI API atau saldo API.

- Raka dan Rara tetap memakai 5 ekspresi.
- Tombol **Hear Tutor** memutar audio lokal.
- Balasan demo juga diputar otomatis setelah siswa mengirim jawaban.
- Jika audio lokal gagal diputar, aplikasi mencoba `SpeechSynthesis` browser sebagai fallback.
- Voice input tetap bersifat opsional; browser tanpa SpeechRecognition menggunakan kolom ketik.
