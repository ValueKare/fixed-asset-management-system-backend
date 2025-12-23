// backend/Config/swagger.js

import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hospital Asset Management API",
      version: "1.0.0",
      description: "API documentation for Hospital Asset Management System",
    },
    servers: [
      {
        url: "http://localhost:5001",
      },
    ],

     components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // Use absolute paths with forward slashes for glob patterns (swagger-jsdoc requires forward slashes)
  apis: [
    path.join(__dirname, "../routes/*.js").replace(/\\/g, "/"),
    path.join(__dirname, "../routes/**/*.js").replace(/\\/g, "/")
  ],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export { swaggerSpec, swaggerUi };


