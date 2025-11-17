const healthRoutes = [
  {
    method: "GET",
    path: "/health",
    handler: () => {
      return {
        status: "success",
        message: "Service is running",
      };
    },
  },
];

export default healthRoutes;