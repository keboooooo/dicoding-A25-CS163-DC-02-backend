import Hapi from "@hapi/hapi";
import { PORT, HOST } from "./src/config/env.js";
import { onPreResponse } from "./src/plugins/onPreResponse.js";
import { rateLimit } from "./src/plugins/rateLimit.js";
import healthRoutes from "./src/routes/healthRoutes.js";
import quizRoutes from "./src/routes/quizRoutes.js";
import materialRoutes from "./src/routes/materialRoutes.js";
import openapiRoutes from "./src/routes/openapiRoutes.js";
import docsRoutes from "./src/routes/docsRoutes.js";

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
  // Basic rate limit
  server.ext("onRequest", rateLimit);

  // Health route
  server.route(healthRoutes);

  // Main quiz generation route
  server.route(quizRoutes);

  // Material viewer route (text by default, or html via query)
  server.route(materialRoutes);

  // OpenAPI spec route
  server.route(openapiRoutes);

  // Minimal Swagger UI using CDN
  server.route(docsRoutes);

  await server.start();
  console.log(`API running on ${server.info.uri}`);
};

init();
