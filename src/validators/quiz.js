import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

// Schema for LLM output
export const quizSchema = {
  type: "object",
  required: ["questions", "metadata"],
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "question", "options", "answer", "explanation"],
        properties: {
          id: { type: ["number", "string"] },
          question: { type: "string", minLength: 1 },
          options: {
            type: "array",
            minItems: 2,
            items: { type: "string" }
          },
          answer: { type: "string" },
          explanation: { type: "string" }
        },
        additionalProperties: true
      }
    },
    metadata: {
      type: "object",
      properties: {
        difficulty: { enum: ["easy", "medium", "hard"] },
        count: { type: "number" },
        sourceTutorialId: { type: "string" }
      },
      additionalProperties: true
    }
  },
  additionalProperties: true
};

const validate = ajv.compile(quizSchema);

export const validateQuizOrThrow = (payload) => {
  const ok = validate(payload);
  if (!ok) {
    const msg = ajv.errorsText(validate.errors, { separator: "; " });
    const err = new Error(`Invalid quiz JSON: ${msg}`);
    err.statusCode = 502;
    throw err;
  }
  return true;
};
