const spec = {
  openapi: "3.0.1",
  info: {
    title: "LearnCheck Backend API",
    version: "1.0.0",
    description: "API untuk mengambil materi, generate soal via LLM, dan menampilkan hasil."
  },
  servers: [
    { url: "http://localhost:5000", description: "Local" }
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": { description: "Service OK" }
        }
      }
    },
    "/api/generate/{tutorialId}": {
      get: {
        summary: "Generate soal dari materi tutorial",
        parameters: [
          { name: "tutorialId", in: "path", required: true, schema: { type: "string" } },
          { name: "userId", in: "query", required: false, schema: { type: "string" } },
          { name: "count", in: "query", required: false, schema: { type: "integer" } },
          { name: "difficulty", in: "query", required: false, schema: { type: "string", enum: ["easy", "medium", "hard"] } }
        ],
        responses: {
          "200": { description: "Berhasil generate soal" },
          "404": { description: "Materi tidak ditemukan" },
          "502": { description: "Output LLM invalid" }
        }
      }
    },
    "/api/test": {
      get: {
        summary: "Generate cepat untuk tutorialId tetap (35363)",
        parameters: [
          { name: "userId", in: "query", required: false, schema: { type: "string" } },
          { name: "count", in: "query", required: false, schema: { type: "integer" } },
          { name: "difficulty", in: "query", required: false, schema: { type: "string", enum: ["easy", "medium", "hard"] } }
        ],
        responses: {
          "200": { description: "Berhasil generate soal" },
          "404": { description: "Materi tidak ditemukan" }
        }
      }
    },
    "/api/material/{tutorialId}": {
      get: {
        summary: "Ambil materi tutorial dalam format text atau html",
        parameters: [
          { name: "tutorialId", in: "path", required: true, schema: { type: "string" } },
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["text", "html"] } }
        ],
        responses: {
          "200": { description: "Berhasil ambil materi" },
          "404": { description: "Materi tidak ditemukan" }
        }
      }
    },
    "/api/test/material": {
      get: {
        summary: "Ambil materi test tutorialId tetap (35363)",
        parameters: [
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["text", "html"] } }
        ],
        responses: {
          "200": { description: "Berhasil ambil materi" }
        }
      }
    },
    "/api/material/raw/{tutorialId}": {
      get: {
        summary: "Ambil raw JSON tutorial dari sumber",
        parameters: [
          { name: "tutorialId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Berhasil" },
          "404": { description: "Tidak ditemukan" }
        }
      }
    }
  }
};

export default spec;
