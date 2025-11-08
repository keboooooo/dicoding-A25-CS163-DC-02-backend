import Hapi from "@hapi/hapi";
import {
  PORT,
  HOST,
  EXTERNAL_BASE_URL,
  MATERIAL_MAX_CHARS,
} from "./src/config/env.js";
import { onPreResponse } from "./src/plugins/onPreResponse.js";
import {
  fetchTutorial,
  fetchUserPreferences,
} from "./src/services/tutorialService.js";
import {
  stripHtmlToText,
  extractMaterialHtml,
  fetchPageHtmlFallback,
} from "./src/utils/material.js";
import { callCerebras } from "./src/services/cerebrasService.js";

const init = async () => {
  const server = Hapi.server({
    port: PORT,
    host: HOST,
    routes: {
      cors: { origin: ["*"] },
    },
  });

  // Centralized error handling (plugin)
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
