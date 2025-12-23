import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options = {
  definition: { openapi: "3.0.0", info: { title: "Test", version: "1.0.0" } },
  apis: [path.join(process.cwd(), "routes", "*.js"), path.join(process.cwd(), "routes", "**", "*.js")],
};

const spec = swaggerJsdoc(options);

console.log("Found paths:", Object.keys(spec.paths));
