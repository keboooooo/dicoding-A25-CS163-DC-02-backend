import openapiSpec from "../../docs/openapi.js";

const openapiRoutes = [
  {
    method: "GET",
    path: "/openapi.json",
    handler: () => openapiSpec,
  },
];

export default openapiRoutes;
