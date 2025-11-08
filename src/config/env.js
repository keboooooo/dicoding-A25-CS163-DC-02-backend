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
