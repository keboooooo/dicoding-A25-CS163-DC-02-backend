import {
  fetchTutorial,
  fetchUserPreferences,
} from "../services/tutorialService.js";

import {
  extractMaterialHtml,
  stripHtmlToText,
  fetchPageHtmlFallback,
} from "../utils/material.js";

import { chunkMaterial } from "../utils/chunk.js";
import { getCache, setCache } from "../utils/cache.js";
import { GENERATION_CACHE_TTL_MS, MATERIAL_MAX_CHARS } from "../config/env.js";
import { callCerebras } from "../services/cerebrasService.js";

export const generateQuiz = async (request, h) => {
  try {
    const { tutorialId } = request.params;
    const { userId } = request.query;

    // Optional overrides
    const overrideCount = request.query.count
      ? Number(request.query.count)
      : undefined;
    const overrideDifficulty = request.query.difficulty || undefined;

    const [tutorial, prefsRaw] = await Promise.all([
      fetchTutorial(tutorialId),
      fetchUserPreferences(userId).catch(() => null),
    ]);

    // Material HTML
    let materialHtml = extractMaterialHtml(tutorial);
    let sourceType = "api";

    // Fallback to HTML scraping
    if (!materialHtml || !materialHtml.trim()) {
      const { html, url } = await fetchPageHtmlFallback(tutorialId);
      if (html && html.trim()) {
        materialHtml = html;
        sourceType = url || "page";
      }
    }

    // Convert to text
    let materialText = stripHtmlToText(materialHtml);

    // Chunk if too long
    if (materialText.length > MATERIAL_MAX_CHARS) {
      const chunks = chunkMaterial(materialText, MATERIAL_MAX_CHARS);
      materialText = chunks[0];
    }

    // Merge preferences
    const preferences = {
      ...(prefsRaw || {}),
      ...(overrideCount ? { questionCount: overrideCount } : {}),
      ...(overrideDifficulty ? { difficulty: overrideDifficulty } : {}),
    };

    // Cache key
    const cacheKey = `gen:${tutorialId}:${JSON.stringify(preferences)}`;
    const cached = getCache(cacheKey);

    if (cached) {
      return h
        .response({ status: "success", data: cached, cached: true })
        .code(200);
    }

    // Generate quiz
    const result = await callCerebras({
      materialText,
      preferences,
      tutorialId,
      sourceType,
    });

    setCache(cacheKey, result, GENERATION_CACHE_TTL_MS);

    return h.response({ status: "success", data: result }).code(200);
  } catch (err) {
    console.error("generateQuiz error:", err?.response?.data || err.message);

    return h
      .response({
        status: "error",
        message: err.message || "Failed to generate questions",
      })
      .code(err.response?.status || 500);
  }
};

// Test (tutorialId = 35363)
export const generateQuizTest = async (request, h) => {
  request.params.tutorialId = "35363";
  return generateQuiz(request, h);
};
