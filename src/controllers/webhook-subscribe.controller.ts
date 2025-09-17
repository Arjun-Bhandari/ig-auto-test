import { FastifyReply, FastifyRequest } from "fastify";
import { goLiveSchema, GoLiveBody } from "../schema/webhook";
import { subscribeIgUserToWebhooks } from "../services/webhook-subscibe.services";

export const webhookSubscribeController = async (
  request: FastifyRequest<{ Body: GoLiveBody }>,
  reply: FastifyReply
) => {
  const { igUserId, fields } = goLiveSchema.parse(request.body);
  const result = await subscribeIgUserToWebhooks(igUserId, fields);
  return reply.send({ success: true, data: result });
};