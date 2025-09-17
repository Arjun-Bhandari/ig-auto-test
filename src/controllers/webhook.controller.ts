import { FastifyReply, FastifyRequest } from "fastify";
import { webhookVerifyQuerySchema, igWebhookBodySchema } from "../schema/webhook";
import { enqueueCommentEvent } from "../workers/queues";
import { logger } from "../config/logger";
import { verifyMetaSignature } from "../utils/signature";

export const verifyWebhookController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const query = webhookVerifyQuerySchema.parse(request.query);
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return reply.status(200).send(challenge ?? "");
  }
  return reply.status(403).send("Forbidden");
};

export const receiveWebhookController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Optional signature verification if raw body available
    const header = request.headers["x-hub-signature-256"] as string | undefined;
    const rawBody = (request as any).rawBody as string | undefined;
    if (process.env.IG_CLIENT_SECRET && header && rawBody) {
      const ok = verifyMetaSignature(process.env.IG_CLIENT_SECRET, rawBody, header);
      if (!ok) return reply.status(401).send("Invalid signature");
    }

    const body = igWebhookBodySchema.parse(request.body);
    if (body.object !== "instagram") {
      return reply.status(200).send({ received: true });
    }
logger.info({body}, "Webhook received");
    for (const entry of body.entry ?? []) {
      const igUserIdStr = String(entry.id);
      for (const change of entry.changes ?? []) {
        if (change.field === "comments") {
          const value: any = change.value ?? {};
          await enqueueCommentEvent({
            igUserId: igUserIdStr,
            mediaId: String(value.media?.id || value.media_id || ""),
            commentId: String(value.id || ""),
            text: String(value.text || ""),
            fromUserId: String(value.from?.id || ""),
            timestamp: value.created_time
              ? new Date(value.created_time * 1000).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    }
    return reply.status(200).send({ received: true });
  } catch (err) {
    logger.error(err, "Webhook processing failed");
    return reply.status(200).send({ received: true });
  }
};


