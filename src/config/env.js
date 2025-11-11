// Centralized environment configuration
import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const HOST = process.env.HOST || "0.0.0.0";
export const EXTERNAL_BASE_URL =
  process.env.SOURCE_BASE_URL ||
  "https://learncheck-dicoding-mock-666748076441.europe-west1.run.app";

export const CEREBRAS_BASE_URL =
  process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai";
export const CEREBRAS_MODEL =
  process.env.CEREBRAS_MODEL || "llama3.1-8b-instruct";
export const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
export const MATERIAL_MAX_CHARS = Number(
  process.env.MATERIAL_MAX_CHARS || 10000
);
export const LLM_CHUNK_CHARS = MATERIAL_MAX_CHARS;

// Phase 0 configs
export const GENERATION_CACHE_TTL_MS = Number(
  process.env.GENERATION_CACHE_TTL_MS || 5 * 60 * 1000
);
export const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000
);
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);
