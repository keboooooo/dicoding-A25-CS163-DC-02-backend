import {
  generateQuiz,
  generateQuizTest,
} from "../controllers/quizController.js";

export default [
  // Fallback klo takda tutorialId
  {
    method: "GET",
    path: "/api/generate",
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
    path: "/api/generate/{tutorialId}",
    handler: generateQuiz,
  },

  // Test tutorialId = 35363
  {
    method: "GET",
    path: "/api/test",
    handler: generateQuizTest,
  },
];
