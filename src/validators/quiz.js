import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

// Schema for LLM output
export const quizSchema = {
  type: 'object',
  required: ['questions', 'metadata'],
  properties: {
    questions: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'question', 'options', 'explanation'],
        properties: {
          id: { type: ['number', 'string'] },
          question: { type: 'string', minLength: 1 },
          options: {
            type: 'array',
            minItems: 2,
            items: { type: 'string' },
          },
          // Single-answer legacy support
          answer: { type: 'string' },
          // Multi-answer support: list of correct answers
          answers: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' },
          },
          // Optional per-question correct count (1, 2, or 3)
          correctCount: { type: 'number' },
          // Optional instruction, e.g., "Pilih 2 jawaban"
          instruction: { type: 'string' },
          explanation: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
    metadata: {
      type: 'object',
      properties: {
        difficulty: { enum: ['easy', 'medium', 'hard'] },
        count: { type: 'number' },
        sourceTutorialId: { type: 'string' },
        // When generating multi-answer questions, indicates how many answers are correct per question
        correctCount: { type: 'number' },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

const validate = ajv.compile(quizSchema);

export const validateQuizOrThrow = (payload) => {
  const ok = validate(payload);
  if (!ok) {
    const msg = ajv.errorsText(validate.errors, { separator: '; ' });
    const err = new Error(`Invalid quiz JSON: ${msg}`);
    err.statusCode = 502;
    throw err;
  }
  return true;
};
