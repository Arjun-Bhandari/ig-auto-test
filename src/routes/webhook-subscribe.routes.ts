import { FastifyInstance } from "fastify";
import { goLiveSchema } from "../schema/webhook";
import { webhookSubscribeController } from "../controllers/webhook-subscribe.controller";

export const webhookSubscribeRoute = async (app: FastifyInstance) => {
  app.post(
    "/webhooks/instagram/subscribe",
    { schema: { body: goLiveSchema } },
    webhookSubscribeController
  );
};