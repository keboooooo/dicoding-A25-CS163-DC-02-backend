# Capstone Project Dicoding BACKEND

- ID Team: A25-CS163
- Use Case: DC-02

Anggota Kelompok:

- R284D5Y0938 - Kamilus Aditya Catur Putra Widianto - React & Back-End with AI - **Aktif**
- R284D5Y0718 - Hafizh Dakota Alexander - React & Back-End with AI - **Aktif**
- R284D5Y0686 - Ghani Al Aziz Hamadi - React & Back-End with AI - **Aktif**
- R284D5Y0664 - Gabriel Michael Tanu Wijaya - React & Back-End with AI - **Aktif**
- R284D5Y1479 - Nauval Labib Salim - React & Back-End with AI - **Aktif**

## DAFTAR DOKUMEN

- [Project Plan](https://docs.google.com/document/d/1BGbQYG6ioEZIRV2rm5U5EU865k6I0QA7XLjxZRyoBRI/edit?tab=t.0)
- [Master Worksheet Capstone](https://docs.google.com/spreadsheets/d/1bPjkTd41Lzs4e5u_LjLxHY1nCq4vNVo8FG4zfOZMchw/edit?gid=0#gid=0)
- [Repo Frontend](https://github.com/keboooooo/dicoding-A25-CS163-DC-02)

## Menjalankan Backend (Generator Soal)

Layanan ini akan:

- Mengambil materi dari sumber: `https://learncheck-dicoding-mock-666748076441.europe-west1.run.app/`.
- Menghapus seluruh tag HTML dan menyisakan teks polos dari materi tersebut.
- Mengirim materi ke LLM via API Cerebras AI dan meminta output dalam bentuk JSON.
- Menyajikan hasil (soal) melalui REST API.

### Persiapan

1. Duplikasi file `.env.example` menjadi `.env` dan isi nilai kunci berikut:

   - `CEREBRAS_API_KEY` (wajib): API key dari Cerebras.
   - Opsi lain dapat dibiarkan default.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Jalankan server:

   ```bash
   npm run dev
   ```

Server berjalan pada `http://localhost:5000` (default).

### Endpoint

- `GET /health` — cek status service.

- `GET /api/generate/{tutorialId}` — hasilkan soal dari materi `tutorialId`.

  - Query opsional:
    - `userId` — mengambil preferensi pengguna dari sumber.
    - `count` — override jumlah soal (angka).
    - `difficulty` — override tingkat kesulitan (`easy|medium|hard`).

- `GET /api/test` — endpoint pengujian cepat menggunakan `tutorialId=35363`.

  - Query opsional sama dengan `/api/generate` (`userId`, `count`, `difficulty`).

- `GET /api/material/{tutorialId}` — melihat materi yang diambil dari sumber.

  - Query opsional: `format=text|html` (default `text`).

- `GET /api/test/material` — versi cepat dengan `tutorialId=35363`.

  - Query opsional: `format=text|html` (default `text`).

Contoh:

```bash
curl "http://localhost:5000/api/generate/123?userId=42&count=5&difficulty=medium"
```

Contoh cepat (test):

```bash
curl "http://localhost:5000/api/test?userId=42&count=5&difficulty=medium"
```

Lihat materi (text default):

```bash
curl "http://localhost:5000/api/material/123"
```

Lihat materi (html mentah):

```bash
curl "http://localhost:5000/api/material/123?format=html"
```

Versi cepat (test) untuk materi:

```bash
curl "http://localhost:5000/api/test/material?format=text"
```

Respon sukses:

```json
{
  "status": "success",
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "answer": "B",
        "explanation": "..."
      }
    ],
    "metadata": {
      "difficulty": "medium",
      "count": 5,
      "sourceTutorialId": "123"
    }
  }
}
```

### Environment Variables

Lihat `.env.example` untuk daftar lengkap. Nilai penting:

- `SOURCE_BASE_URL` — URL sumber materi (default: mock Dicoding).
- `CEREBRAS_BASE_URL`, `CEREBRAS_MODEL`, `CEREBRAS_API_KEY` — konfigurasi Cerebras.

### Catatan

- API Cerebras menggunakan interface mirip OpenAI Chat Completions. Jika parameter `response_format` tidak didukung, prompt telah diarahkan agar tetap mengembalikan JSON valid.
- Jika struktur data sumber berubah, sesuaikan mapping di `server.js` bagian `fetchTutorial` dan `fetchUserPreferences`.

### Strukur (masih wip)
- src/ — application source
  - src/routes/ — route definitions per resource (e.g., generate, material, health)
  - src/controllers/ — request handlers that orchestrate services
  - src/services/ — domain logic (tutorial fetching, preferences, LLM, material processing)
  - src/clients/ — external clients (e.g., Axios instances for Dicoding mock, Cerebras)
  - src/utils/ — helpers (HTML/text utils, parsing, error helpers)
  - src/plugins/ — Hapi plugins and server extensions (e.g., onPreResponse, CORS)
  - src/config/ — configuration loaders, constants from env
  - src/validators/ — Joi or similar schemas for params/query/body
  - src/constants/ — app constants and enums
- tests/
  - tests/unit/
  - tests/integration/
- scripts/ — local tooling or dev scripts
- docs/ — project docs, API notes, diagrams
- logs/ — runtime logs (git-kept only)
- mocks/ — sample payloads for local testing
- .env.example — template for environment variables

## Log Perubahan (08/11)

Ringkasan perubahan yang dilakukan pada tanggal 08/11 (dd/mm):

1. Modularisasi kode `server.js` tanpa mengubah perilaku:
  - Memindahkan konfigurasi environment ke `src/config/env.js`.
  - Memindahkan handler error global ke `src/plugins/onPreResponse.js`.
  - Memecah utilitas materi (fungsi `stripHtmlToText`, `extractMaterialHtml`, `fetchPageHtmlFallback`) ke `src/utils/material.js`.
  - Memindahkan fungsi akses API sumber (`fetchTutorial`, `fetchUserPreferences`) ke `src/services/tutorialService.js`.
  - Memindahkan fungsi pemanggilan LLM (`callCerebras`) ke `src/services/cerebrasService.js`.
2. Menambahkan struktur direktori kosong dengan `.gitkeep` agar siap diisi (routes, controllers, services, clients, utils, plugins, config, validators, constants, tests/unit, tests/integration, scripts, docs, logs, mocks).
3. Menambahkan file `.env.example` sebagai template variabel environment.
4. Menyesuaikan `server.js` agar menggunakan import dari modul-modul baru tersebut.

Tidak ada perubahan logika bisnis atau format response API—hanya pemisahan file agar lebih mudah dikembangkan selanjutnya.
