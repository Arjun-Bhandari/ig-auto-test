// src/routes/automation.routes.ts
import { FastifyInstance } from "fastify";
import { createAutomationController, listAutomationByUserController } from "../controllers/automation.contoller";
import { createRuleSchema,listAutomationQuerySchema } from "../schema/automation";

export const automationRoute = async (app: FastifyInstance) => {
  app.post(
    "/automation-rules",
    {
      schema: { body: createRuleSchema },
    },
    createAutomationController
  );

  app.get(
    "/automation-rules",
    {
      schema: {
        querystring: listAutomationQuerySchema
      },
    },
    listAutomationByUserController
  );
};