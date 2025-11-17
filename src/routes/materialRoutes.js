import { getMaterial, getMaterialTest, getMaterialRaw } from "../controllers/materialController.js";

export default [
  // Fallback: takda tutorialId
  {
    method: "GET",
    path: "/api/material",
    handler: (request, h) => {
      return h
        .response({
          status: "fail",
          message: "tutorialId is required",
        })
        .code(400);
    },
  },

  {
    method: "GET",
    path: "/api/material/raw",
    handler: (request, h) => {
      return h
        .response({
          status: "fail",
          message: "tutorialId is required",
        })
        .code(400);
    },
  },

  // Main
  {
    method: "GET",
    path: "/api/material/{tutorialId}",
    handler: getMaterial,
  },

  // tutorialId=35363
  {
    method: "GET",
    path: "/api/test/material",
    handler: getMaterialTest,
  },

  // Raw tutorial JSON
  {
    method: "GET",
    path: "/api/material/raw/{tutorialId}",
    handler: getMaterialRaw,
  },
];
