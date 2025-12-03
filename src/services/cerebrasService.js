import axios from 'axios';
import {
  CEREBRAS_API_KEY,
  CEREBRAS_BASE_URL,
  CEREBRAS_MODEL,
  QUIZ_DEFAULT_DIFFICULTY,
  QUIZ_DEFAULT_QUESTION_COUNT,
  QUIZ_DEFAULT_LANGUAGE,
  QUIZ_DEFAULT_FORMAT,
} from '../config/env.js';
import { validateQuizOrThrow } from '../validators/quiz.js';
import { buildQuizPrompt } from './generatorPrompt.js';

export const callCerebras = async ({
  materialText,
  preferences,
  tutorialId,
}) => {
  if (!CEREBRAS_API_KEY) {
    throw new Error('CEREBRAS_API_KEY is not set');
  }

  const effectivePrefs = {
    difficulty: preferences?.difficulty || QUIZ_DEFAULT_DIFFICULTY,
    questionCount:
      typeof preferences?.questionCount === 'number' &&
      !Number.isNaN(preferences.questionCount)
        ? preferences.questionCount
        : QUIZ_DEFAULT_QUESTION_COUNT,
    language: preferences?.language || QUIZ_DEFAULT_LANGUAGE,
    format: preferences?.format || QUIZ_DEFAULT_FORMAT,
    // Optional: allow multiple correct answers per question when > 1; when 1 -> fixed single; when NaN -> mixed
    correctCount:
      typeof preferences?.correctCount === 'number' &&
      !Number.isNaN(preferences.correctCount)
        ? preferences.correctCount
        : Number(process.env.CORRECT_COUNT),
  };

  const { systemPrompt, userPrompt, temperature, fixedMode, fixedCount } =
    buildQuizPrompt(effectivePrefs, materialText);

  const url = `${CEREBRAS_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`;

  const body = {
    model: CEREBRAS_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  };

  const { data } = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const content = data?.choices?.[0]?.message?.content?.trim() || '';
  let jsonText = content;
  const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  if (fenceMatch) jsonText = fenceMatch[1];

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    jsonText = jsonText.replace(/^[^{\[]+/, '').replace(/[^}\]]+$/, '');
    parsed = JSON.parse(jsonText);
  }

  parsed.metadata = {
    ...(parsed.metadata || {}),
    difficulty: effectivePrefs.difficulty,
    count: Array.isArray(parsed.questions)
      ? parsed.questions.length
      : effectivePrefs.questionCount,
    sourceTutorialId: String(tutorialId),
    ...(fixedMode ? { correctCount: Number(fixedCount) } : {}),
  };

  // Validate JSON structure
  validateQuizOrThrow(parsed);

  return parsed;
};
