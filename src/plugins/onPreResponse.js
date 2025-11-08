// Hapi onPreResponse extension for unified error payload
export const onPreResponse = (request, h) => {
  const response = request.response;
  if (!response.isBoom) return h.continue;

  const statusCode = response.output?.statusCode || 500;
  const message = response.message || "Internal Server Error";
  const payload = {
    status: "error",
    statusCode,
    message,
  };
  return h.response(payload).code(statusCode);
};
