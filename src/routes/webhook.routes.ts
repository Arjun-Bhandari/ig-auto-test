import { FastifyInstance } from "fastify";
import { verifyWebhookController, receiveWebhookController } from "../controllers/webhook.controller";
import { webhookVerifyQuerySchema, igWebhookBodySchema } from "../schema/webhook";

export const webhookRoute = async (app: FastifyInstance) => {
  app.get(
    "/webhooks/instagram",
    { schema: { querystring: webhookVerifyQuerySchema } },
    verifyWebhookController
  );

  app.post(
    "/webhooks/instagram",
    { schema: { body: igWebhookBodySchema } },
    receiveWebhookController
  );
};


