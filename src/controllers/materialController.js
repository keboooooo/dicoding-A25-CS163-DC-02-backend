import {
  fetchTutorial,
  fetchUserPreferences,
} from "../services/tutorialService.js";
import {
  stripHtmlToText,
  extractMaterialHtml,
  fetchPageHtmlFallback,
} from "../utils/material.js";
import { chunkMaterial } from "../utils/chunk.js";
import { MATERIAL_MAX_CHARS, EXTERNAL_BASE_URL } from "../config/env.js";

export const getMaterial = async (request, h) => {
  const { tutorialId } = request.params;
  const format = (request.query.format || "text").toString(); // text | html

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
      const chunks = chunkMaterial(materialText, MATERIAL_MAX_CHARS);
      materialText = chunks[0];
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
    console.error("/api/material error:", err?.response?.data || err.message);
    const statusCode = err.response?.status || 500;
    return h
      .response({
        status: "error",
        message: err.message || "Failed to fetch material",
      })
      .code(statusCode);
  }
};

export const getMaterialTest = async (request, h) => {
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
      const chunks = chunkMaterial(materialText, MATERIAL_MAX_CHARS);
      materialText = chunks[0];
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
};

export const getMaterialRaw = async (request, h) => {
  const { tutorialId } = request.params;

  try {
    const tutorial = await fetchTutorial(tutorialId);

    return h
      .response({
        status: "success",
        data: tutorial,
      })
      .code(200);

  } catch (err) {
    const statusCode = err.response?.status || 500;

    return h
      .response({
        status: "error",
        message: err.message || "Failed to fetch raw tutorial",
      })
      .code(statusCode);
  }
};
