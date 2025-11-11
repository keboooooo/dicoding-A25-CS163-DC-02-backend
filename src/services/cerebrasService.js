import axios from "axios";
import {
  CEREBRAS_API_KEY,
  CEREBRAS_BASE_URL,
  CEREBRAS_MODEL,
} from "../config/env.js";
import { validateQuizOrThrow } from "../validators/quiz.js";

export const callCerebras = async ({ materialText, preferences, tutorialId }) => {
  if (!CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  const effectivePrefs = {
    difficulty: preferences?.difficulty || "medium",
    questionCount: preferences?.questionCount || 5,
    language: preferences?.language || "id",
    format: preferences?.format || "multiple-choice",
  };

  const systemPrompt =
    "Anda adalah generator soal kuis. Kembalikan HANYA JSON valid sesuai skema tanpa teks tambahan.";

  const schemaDescription = `Skema JSON:
{
  "questions": [
    {
      "id": number,
      "question": string,
      "options": string[],
      "answer": string,
      "explanation": string
    }
  ],
  "metadata": {
    "difficulty": "easy|medium|hard",
    "count": number,
    "sourceTutorialId": string
  }
}`;

  const userPrompt = `Buat ${effectivePrefs.questionCount} soal ${
    effectivePrefs.format
  } berbahasa ${
    effectivePrefs.language === "id" ? "Indonesia" : "Inggris"
  } berdasarkan materi berikut. Tingkat kesulitan: ${effectivePrefs.difficulty}.

Persyaratan:
- Setiap soal memiliki 4 opsi jawaban.
- Pastikan hanya SATU jawaban yang benar.
- Berikan penjelasan singkat pada tiap soal.
- Kembalikan output HANYA dalam format JSON sesuai skema.

Materi (teks polos):\n\n${materialText}\n\n${schemaDescription}`;

  const url = `${CEREBRAS_BASE_URL.replace(/\/$/, "")}/v1/chat/completions`;

  const body = {
    model: CEREBRAS_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  };

  const { data } = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  const content = data?.choices?.[0]?.message?.content?.trim() || "";
  let jsonText = content;
  const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  if (fenceMatch) jsonText = fenceMatch[1];

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    jsonText = jsonText.replace(/^[^{\[]+/, "").replace(/[^}\]]+$/, "");
    parsed = JSON.parse(jsonText);
  }

  parsed.metadata = {
    ...(parsed.metadata || {}),
    difficulty: effectivePrefs.difficulty,
    count: Array.isArray(parsed.questions)
      ? parsed.questions.length
      : effectivePrefs.questionCount,
    sourceTutorialId: String(tutorialId),
  };

  // Validate JSON structure
  validateQuizOrThrow(parsed);

  return parsed;
};
