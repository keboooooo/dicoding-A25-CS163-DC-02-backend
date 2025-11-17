const docsRoutes = [
  {
    method: "GET",
    path: "/docs",
    handler: () =>
      `<!doctype html>
      <html>
      <head>
        <title>API Docs</title>
        <link rel="stylesheet" 
          href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger"></div>

        <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
        <script>
          window.ui = SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger'
          });
        </script>
      </body>
      </html>`,
  },
];

export default docsRoutes;
