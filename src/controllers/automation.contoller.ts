import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateAutomationBody,
  ListAutomationQuery,
  UpdateAutomationStatusBody,
  GetAutomationParams,
  UpdateExecutionBody,
  UpdateAutomationBody,
} from "../schema/automation";
import {
  createAutomationRule,
  listAutomationRulesByUser,
  updateAutomationStatus,
  getAutomationById,
  updateAutomationExecution,
  deleteAutomation,
  updateAutomation,
} from "../services/automation.services";
import { logger } from "../config/logger";
import { manageWebhookSubscription } from "../services/webhook-subscibe.services";

export const createAutomationController = async (
  request: FastifyRequest<{ Body: CreateAutomationBody }>,
  reply: FastifyReply
) => {
  const { igUserId, mediaId, rule, name, status, isActive, campaignType } =
    request.body;

  const automation = await createAutomationRule({
    igUserId: igUserId.toString(),
    mediaId,
    name,
    campaignType,
    rule,
    status,
    isActive,
  });

  if(automation.status === "ACTIVE"){
    try{
      await manageWebhookSubscription(automation.igUserId.toString());
    }catch(error){
      logger.error(`Error managing webhook subscription for automation ${automation.id}: ${error}`);
    }
    
  }
  return reply.status(201).send({ success: true, data: automation });
};

export const listAutomationByUserController = async (
  request: FastifyRequest<{ Querystring: ListAutomationQuery }>,
  reply: FastifyReply
) => {
  const { igUserId } = request.query;
  const rows = await listAutomationRulesByUser(BigInt(igUserId));
  return reply.send({ success: true, data: rows });
};

export const getAutomationController = async (
  request: FastifyRequest<{ Params: GetAutomationParams }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const automation = await getAutomationById(id);

  if (!automation) {
    return reply
      .status(404)
      .send({ success: false, error: "Automation not found" });
  }

  return reply.send({ success: true, data: automation });
};

export const updateAutomationStatusController = async (
  request: FastifyRequest<{
    Body: UpdateAutomationStatusBody;
    Params: GetAutomationParams;
  }>,
  reply: FastifyReply
) => {
  const { status, isActive } = request.body;
  const { id } = request.params;

  const updated = await updateAutomationStatus(id, { status, isActive });
  logger.info(`Updating automation status to Data ${updated}`);
  if (!updated) {
    return reply
      .status(404)
      .send({ success: false, error: "Automation not found" });
  }

  try {
    const webhookResult = await manageWebhookSubscription(updated.igUserId.toString());
    logger.info(`Webhook management result: ${webhookResult}`);
    console.log('Webhook management result:', webhookResult);
  } catch (error) {
  logger.error(`Error managing webhook subscription for automation while updating status: ${updated.id}: ${error}`);
  }
 
  return reply.send({ success: true, data: updated });
};

export const updateAutomationExecutionController = async (
  request: FastifyRequest<{ Body: UpdateExecutionBody }>,
  reply: FastifyReply
) => {
  const {
    id,
    lastExecutedAt,
    executionCount,
    errorCount,
    lastErrorAt,
    lastErrorMessage,
  } = request.body;

  const updated = await updateAutomationExecution(id, {
    id,
    lastExecutedAt,
    executionCount,
    errorCount,
    lastErrorAt,
    lastErrorMessage,
  });

  if (!updated) {
    return reply
      .status(404)
      .send({ success: false, error: "Automation not found" });
  }

  return reply.send({ success: true, data: updated });
};

export const updateAutomationController = async (
  request: FastifyRequest<{
    Body: UpdateAutomationBody;
    Params: GetAutomationParams;
  }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { name, rule, status, isActive, campaignType } = request.body;
  logger.info(`Updating automation ${id} with data: ${JSON.stringify({ name, rule, status, isActive, campaignType })}`);
  const updated = await updateAutomation(id, {
    name,
    rule,
    status,
    isActive,
    campaignType,
  });
  if (!updated) {
    return reply
      .status(404)
      .send({ success: false, error: "Automation not found" });
  }
  if(updated.status === "ACTIVE"){
    try{
      await manageWebhookSubscription(updated.igUserId.toString());
    }catch(error){
      logger.error(`Error managing webhook subscription for automation while updating: ${updated.id}: ${error}`);
    }
  }
  return reply.send({ success: true, data: updated });
};

export const deleteAutomationController = async (
  request: FastifyRequest<{ Params: GetAutomationParams }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const deleted = await deleteAutomation(id);
const automation = await getAutomationById(id);
  if (!deleted) {
    return reply
      .status(404)
      .send({ success: false, error: "Automation not found" });
  }
  if(automation){
  try {
    const webhookResult = await manageWebhookSubscription(automation.igUserId.toString());
    logger.info(`Webhook management result: ${webhookResult}`);
  } catch (error) {
    logger.error(`Error managing webhook subscription for automation while deleting: ${automation.id}: ${error}`);
  }
}
  return reply.send({
    success: true,
    message: "Automation deleted successfully",
  });
};
