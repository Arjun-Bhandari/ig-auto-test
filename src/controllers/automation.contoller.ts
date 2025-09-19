
import { FastifyReply, FastifyRequest } from "fastify";
import { CreateAutomationBody } from "../schema/automation";
import { createAutomationRule, listAutomationRulesByUser } from "../services/automation.services";

export const createAutomationController = async (
  request: FastifyRequest<{ Body: CreateAutomationBody }>,
  reply: FastifyReply
) => {
  const { igUserId, mediaId, templateId, rule } = request.body;
  
  const created = await createAutomationRule({
    igUserId,
    mediaId,
    templateId,
    rule,
  });
  return reply.status(201).send({ success: true, data: created });
};

export const listAutomationByUserController = async (
  request: FastifyRequest<{ Querystring: { igUserId: string } }>,
  reply: FastifyReply
) => {
  const { igUserId } = request.query;
  const rows = await listAutomationRulesByUser(BigInt(igUserId));
  return reply.send({ success: true, data: rows });
};