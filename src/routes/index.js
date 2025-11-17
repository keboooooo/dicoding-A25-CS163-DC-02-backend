import healthRoutes from "./healthRoutes.js";
import quizRoutes from "./quizRoutes.js";
import materialRoutes from "./materialRoutes.js";

// Gabungkan semua route menjadi 1 array besar
export default [
  ...healthRoutes,
  ...quizRoutes,
  ...materialRoutes,
];
