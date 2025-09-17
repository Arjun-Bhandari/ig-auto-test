// src/routes/templates.routes.ts
import { FastifyInstance } from "fastify";
import { createTemplateController, getTemplateController } from "../controllers/templates.controller";
import { createTemplateSchema,getTemplateParamsSchema } from "../schema/templates";

export const templatesRoute = async (app: FastifyInstance) => {
  app.post(
    "/templates",
    {
      schema: { body: createTemplateSchema },
    },
    createTemplateController
  );

  app.get(
    "/templates/:id",
    {
      schema: {
        params: getTemplateParamsSchema
      }
    },
    getTemplateController
  );
};