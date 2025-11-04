import dotenv from "dotenv";
import Hapi from "@hapi/hapi";
import axios from "axios";
import { htmlToText } from "html-to-text";

dotenv.config();

// ---- Config ----
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const EXTERNAL_BASE_URL =
  process.env.SOURCE_BASE_URL ||
  "https://learncheck-dicoding-mock-666748076441.europe-west1.run.app";

const CEREBRAS_BASE_URL =
  process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai";
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || "llama3.1-8b-instruct";
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const MATERIAL_MAX_CHARS = Number(process.env.MATERIAL_MAX_CHARS || 10000);

// ---- Utilities ----
const onPreResponse = (request, h) => {
  const response = request.response;
  if (!response.isBoom) return h.continue;

  const statusCode = response.output?.statusCode || 500;
  const message = response.message || "Internal Server Error";
  const payload = {
    status: "error",
    statusCode,
    message,
  };
  return h.response(payload).code(statusCode);
};

const fetchTutorial = async (tutorialId) => {
  const url = `${EXTERNAL_BASE_URL}/api/tutorials/${encodeURIComponent(
    tutorialId
  )}`;
  const { data } = await axios.get(url, { timeout: 15000 });
  return data; // assume it contains fields like { id, title, content(HTML) }
};

const fetchUserPreferences = async (userId) => {
  if (!userId) return null;
  const url = `${EXTERNAL_BASE_URL}/api/users/${encodeURIComponent(
    userId
  )}/preferences`;
  const { data } = await axios.get(url, { timeout: 10000 });
  return data; // e.g., { difficulty, questionCount, language, ... }
};

const stripHtmlToText = (html) => {
  if (typeof html !== "string") return "";
  try {
    return htmlToText(html, {
      wordwrap: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
        // Removed custom 'code' selector options to avoid format errors
      ],
    }).trim();
  } catch (e) {
    // Fallback: naive strip of HTML tags if html-to-text throws
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

// Try to extract material HTML/text from various common fields
const extractMaterialHtml = (tutorial) => {
  if (!tutorial || typeof tutorial !== "object") return "";
  const candidates = [];
  const possibleFields = [
    "content",
    "html",
    "body",
    "material",
    "description_html",
    "descriptionHtml",
    "description",
    "article",
    "markdown",
    "text",
  ];
  for (const key of possibleFields) {
    const v = tutorial[key];
    if (typeof v === "string" && v.trim()) candidates.push(v);
  }
  if (tutorial.data) {
    const dv =
      tutorial.data.content || tutorial.data.html || tutorial.data.body;
    if (typeof dv === "string" && dv.trim()) candidates.push(dv);
  }
  const arrFields = ["sections", "parts", "items"];
  for (const k of arrFields) {
    const arr = tutorial[k];
    if (Array.isArray(arr) && arr.length) {
      const joined = arr
        .map((it) =>
          typeof it === "string"
            ? it
            : typeof it?.html === "string"
            ? it.html
            : typeof it?.content === "string"
            ? it.content
            : typeof it?.text === "string"
            ? it.text
            : ""
        )
        .filter(Boolean)
        .join("\n\n");
      if (joined.trim()) candidates.push(joined);
    }
  }
  return candidates.find((c) => c && c.trim()) || "";
};

// Fallback: try to fetch an HTML page version and extract text
const fetchPageHtmlFallback = async (tutorialId) => {
  const possiblePaths = [
    `/tutorials/${encodeURIComponent(tutorialId)}`,
    `/tutorial/${encodeURIComponent(tutorialId)}`,
  ];
  for (const p of possiblePaths) {
    const url = `${EXTERNAL_BASE_URL.replace(/\/$/, "")}${p}`;
    try {
      const { data, headers } = await axios.get(url, { timeout: 15000 });
      const ct = headers["content-type"] || "";
      if (typeof data === "string" && /text\/html/i.test(ct)) {
        return { html: data, url };
      }
      if (typeof data === "string" && data.includes("</html>")) {
        return { html: data, url };
      }
    } catch (e) {
      // continue
    }
  }
  return { html: "", url: null };
};

const callCerebras = async ({ materialText, preferences, tutorialId }) => {
  if (!CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  // Determine effective preferences with defaults
  const effectivePrefs = {
    difficulty: preferences?.difficulty || "medium",
    questionCount: preferences?.questionCount || 5,
    language: preferences?.language || "id",
    format: preferences?.format || "multiple-choice",
  };

  // System and user prompts to enforce JSON output
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
    // Many OpenAI-compatible APIs support this; if not, prompt still enforces JSON
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

  // Attempt to extract pure JSON (handle code fences if any)
  let jsonText = content;
  const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  if (fenceMatch) jsonText = fenceMatch[1];

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    // As a fallback, try to sanitize
    jsonText = jsonText.replace(/^[^{\[]+/, "").replace(/[^}\]]+$/, "");
    parsed = JSON.parse(jsonText);
  }

  // Add/ensure metadata
  parsed.metadata = {
    ...(parsed.metadata || {}),
    difficulty: effectivePrefs.difficulty,
    count: Array.isArray(parsed.questions)
      ? parsed.questions.length
      : effectivePrefs.questionCount,
    sourceTutorialId: String(tutorialId),
  };

  return parsed;
};

const init = async () => {
  const server = Hapi.server({
    port: PORT,
    host: HOST,
    routes: {
      cors: { origin: ["*"] },
    },
  });

  // Centralized error handling
  server.ext("onPreResponse", onPreResponse);

  // Health route
  server.route({
    method: "GET",
    path: "/health",
    handler: () => ({ status: "ok" }),
  });

  // Main generation route
  server.route({
    method: "GET",
    path: "/api/generate/{tutorialId}",
    handler: async (request, h) => {
      const { tutorialId } = request.params;
      const { userId } = request.query;

      // Optional overrides
      const overrideCount = request.query.count
        ? Number(request.query.count)
        : undefined;
      const overrideDifficulty = request.query.difficulty || undefined;

      try {
        const [tutorial, prefsRaw] = await Promise.all([
          fetchTutorial(tutorialId),
          fetchUserPreferences(userId).catch(() => null),
        ]);

        let materialHtml = extractMaterialHtml(tutorial);
        let sourceType = "api";

        if (!materialHtml || !materialHtml.trim()) {
          const { html, url } = await fetchPageHtmlFallback(tutorialId);
          if (html && html.trim()) {
            materialHtml = html;
            sourceType = url || "page";
          }
        }
        let materialText = stripHtmlToText(materialHtml);
        if (materialText.length > MATERIAL_MAX_CHARS) {
          materialText = materialText.slice(0, MATERIAL_MAX_CHARS);
        }

        const preferences = {
          ...(prefsRaw || {}),
          ...(overrideCount ? { questionCount: overrideCount } : {}),
          ...(overrideDifficulty ? { difficulty: overrideDifficulty } : {}),
        };

        const result = await callCerebras({
          materialText,
          preferences,
          tutorialId,
        });

        return h.response({ status: "success", data: result }).code(200);
      } catch (err) {
        console.error(
          "/api/generate error:",
          err?.response?.data || err.message
        );
        const statusCode = err.response?.status || 500;
        return h
          .response({
            status: "error",
            message: err.message || "Failed to generate questions",
          })
          .code(statusCode);
      }
    },
  });

  // Test route with fixed tutorialId=35363
  server.route({
    method: "GET",
    path: "/api/test",
    handler: async (request, h) => {
      const tutorialId = "35363";
      const { userId } = request.query;

      const overrideCount = request.query.count
        ? Number(request.query.count)
        : undefined;
      const overrideDifficulty = request.query.difficulty || undefined;

      try {
        const [tutorial, prefsRaw] = await Promise.all([
          fetchTutorial(tutorialId).catch((e) =>
            e?.response?.status === 404 ? null : Promise.reject(e)
          ),
          fetchUserPreferences(userId).catch(() => null),
        ]);

        let materialHtml = tutorial ? extractMaterialHtml(tutorial) : "";
        if (!materialHtml || !materialHtml.trim()) {
          const { html } = await fetchPageHtmlFallback(tutorialId);
          if (html && html.trim()) {
            materialHtml = html;
          }
        }

        if (!materialHtml || !materialHtml.trim()) {
          return h
            .response({
              status: "error",
              message: "Material not found for tutorialId 35363",
            })
            .code(404);
        }

        let materialText = stripHtmlToText(materialHtml);
        if (materialText.length > MATERIAL_MAX_CHARS) {
          materialText = materialText.slice(0, MATERIAL_MAX_CHARS);
        }

        const preferences = {
          ...(prefsRaw || {}),
          ...(overrideCount ? { questionCount: overrideCount } : {}),
          ...(overrideDifficulty ? { difficulty: overrideDifficulty } : {}),
        };

        const result = await callCerebras({
          materialText,
          preferences,
          tutorialId,
        });

        return h.response({ status: "success", data: result }).code(200);
      } catch (err) {
        console.error("/api/test error:", err?.response?.data || err.message);
        const statusCode = err.response?.status || 500;
        return h
          .response({
            status: "error",
            message: err.message || "Failed to generate questions",
          })
          .code(statusCode);
      }
    },
  });

  // Material viewer route (text by default, or html via query)
  server.route({
    method: "GET",
    path: "/api/material/{tutorialId}",
    handler: async (request, h) => {
      const { tutorialId } = request.params;
      const format = (request.query.format || "text").toString(); // 'text' | 'html'
      try {
        const tutorial = await fetchTutorial(tutorialId).catch((e) =>
          e?.response?.status === 404 ? null : Promise.reject(e)
        );
        let materialHtml = tutorial ? extractMaterialHtml(tutorial) : "";
        let sourceType = "api";
        if (!materialHtml || !materialHtml.trim()) {
          const { html, url } = await fetchPageHtmlFallback(tutorialId);
          if (html && html.trim()) {
            materialHtml = html;
            sourceType = url || "page";
          }
        }
        let materialText = stripHtmlToText(materialHtml);
        if (materialText.length > MATERIAL_MAX_CHARS) {
          materialText = materialText.slice(0, MATERIAL_MAX_CHARS);
        }
        const payload = {
          tutorialId: String(tutorialId),
          title: tutorial?.title ?? null,
          source: EXTERNAL_BASE_URL,
          material: format === "html" ? materialHtml : materialText,
          materialSource: sourceType,
          format,
        };
        return h.response({ status: "success", data: payload }).code(200);
      } catch (err) {
        console.error(
          "/api/material error:",
          err?.response?.data || err.message
        );
        const statusCode = err.response?.status || 500;
        return h
          .response({
            status: "error",
            message: err.message || "Failed to fetch material",
          })
          .code(statusCode);
      }
    },
  });

  // Test material route with fixed tutorialId=35363
  server.route({
    method: "GET",
    path: "/api/test/material",
    handler: async (request, h) => {
      const tutorialId = "35363";
      const format = (request.query.format || "text").toString();
      try {
        const tutorial = await fetchTutorial(tutorialId);
        let materialHtml = extractMaterialHtml(tutorial);
        let sourceType = "api";
        if (!materialHtml || !materialHtml.trim()) {
          const { html, url } = await fetchPageHtmlFallback(tutorialId);
          if (html && html.trim()) {
            materialHtml = html;
            sourceType = url || "page";
          }
        }
        let materialText = stripHtmlToText(materialHtml);
        if (materialText.length > MATERIAL_MAX_CHARS) {
          materialText = materialText.slice(0, MATERIAL_MAX_CHARS);
        }
        const payload = {
          tutorialId: String(tutorialId),
          title: tutorial?.title ?? null,
          source: EXTERNAL_BASE_URL,
          material: format === "html" ? materialHtml : materialText,
          materialSource: sourceType,
          format,
        };
        return h.response({ status: "success", data: payload }).code(200);
      } catch (err) {
        console.error(
          "/api/test/material error:",
          err?.response?.data || err.message
        );
        const statusCode = err.response?.status || 500;
        return h
          .response({
            status: "error",
            message: err.message || "Failed to fetch material",
          })
          .code(statusCode);
      }
    },
  });

  // Debug: return raw tutorial JSON from API
  server.route({
    method: "GET",
    path: "/api/material/raw/{tutorialId}",
    handler: async (request, h) => {
      const { tutorialId } = request.params;
      try {
        const tutorial = await fetchTutorial(tutorialId);
        return h.response({ status: "success", data: tutorial }).code(200);
      } catch (err) {
        const statusCode = err.response?.status || 500;
        return h
          .response({
            status: "error",
            message: err.message || "Failed to fetch raw tutorial",
          })
          .code(statusCode);
      }
    },
  });

  await server.start();
  console.log(`API running on ${server.info.uri}`);
};

init();
