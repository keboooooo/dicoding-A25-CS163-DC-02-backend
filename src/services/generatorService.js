// Centralized prompt builder for quiz generation

export const buildQuizPrompt = (effectivePrefs, materialText) => {
  const systemPrompt =
    'Anda adalah generator soal kuis. Kembalikan HANYA JSON valid sesuai skema tanpa teks tambahan.';

  const fixedCount = Number(effectivePrefs.correctCount);
  const fixedMode = Number.isFinite(fixedCount) && fixedCount >= 1;
  const isFixedSingle = fixedMode && fixedCount === 1;
  const isFixedMulti = fixedMode && fixedCount > 1;

  const schemaDescription = `Skema JSON:
{
  "questions": [
    {
      "id": number,
      "question": string,
      "options": string[],
      // Jika jumlah benar = 1, gunakan field "answer" (string)
      // Jika jumlah benar > 1, gunakan field "answers" (string[]) dan "instruction" (mis. "Pilih 2 jawaban")
      // Sertakan optional "correctCount": number per soal (1, 2, atau 3)
      "answer": string,
      "answers": string[],
      "instruction": string,
      "correctCount": number,
      "explanation": string
    }
  ],
  "metadata": {
    "difficulty": "easy|medium|hard",
    "count": number,
    "sourceTutorialId": string${
      fixedMode ? ',\n    "correctCount": number' : ''
    }
  }
}`;

  const userPrompt = `Buat ${effectivePrefs.questionCount} soal ${
    effectivePrefs.format
  } berbahasa ${
    effectivePrefs.language === 'id' ? 'Indonesia' : 'Inggris'
  } berdasarkan materi berikut. Tingkat kesulitan: ${effectivePrefs.difficulty}.

Persyaratan:
- Setiap soal memiliki 4 opsi jawaban.
- ${
    isFixedSingle
      ? `Pastikan HANYA 1 jawaban benar pada setiap soal.
- Kembalikan jawaban benar pada field "answer" (string) yang persis sesuai isi pada "options".
- Set juga "correctCount": 1 pada tiap soal.`
      : isFixedMulti
      ? `Pastikan tepat ${effectivePrefs.correctCount} jawaban yang benar pada setiap soal.
- Kembalikan daftar jawaban benar pada field "answers" (array of strings) yang persis sesuai isi pada "options".
- Tambahkan field "instruction" dengan teks "Pilih ${effectivePrefs.correctCount} jawaban".
- Set juga "correctCount": ${effectivePrefs.correctCount} pada tiap soal.`
      : `Randomisasikan jumlah jawaban benar per soal antara 1, 2, atau 3.
- Jika jumlah benar = 1, gunakan field "answer" (string) yang persis sesuai isi pada "options".
- Jika jumlah benar > 1, gunakan field "answers" (array of strings) yang persis sesuai isi pada "options" dan tambahkan "instruction" dengan teks "Pilih N jawaban" sesuai jumlah.
- Selalu sertakan field "correctCount" pada setiap soal (1, 2, atau 3).
- Wajib: Jika jumlah soal >= 3, minimal satu soal correctCount=1, satu soal correctCount=2, dan satu soal correctCount=3.
- Jangan menghasilkan semua soal dengan correctCount=1.`
  }
- Berikan penjelasan singkat pada tiap soal.
- Kembalikan output HANYA dalam format JSON sesuai skema.

Materi (teks polos):\n\n${materialText}\n\n${schemaDescription}`;

  const temperature = fixedMode ? 0.2 : 0.6;

  return { systemPrompt, userPrompt, temperature, fixedMode, fixedCount };
};
