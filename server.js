import dotenv from "dotenv";
import Hapi from "@hapi/hapi";

dotenv.config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "localhost",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  // Centralized error handling
  server.ext("onPreResponse", onPreResponse);

  await server.start();
  console.log(`OpenMusic API v1 running on ${server.info.uri}`);
};

init();
