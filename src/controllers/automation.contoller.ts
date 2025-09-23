
// import { FastifyReply, FastifyRequest } from "fastify";
// import { CreateAutomationBody } from "../schema/automation";
// import { createAutomationRule, listAutomationRulesByUser } from "../services/automation.services";

// export const createAutomationController = async (
//   request: FastifyRequest<{ Body: CreateAutomationBody }>,
//   reply: FastifyReply
// ) => {
//   const { igUserId, mediaId, templateId, rule, name } = request.body;
  
//   const created = await createAutomationRule({
//     igUserId,
//     mediaId,
//     name,
//     templateId,
//     rule,
//   });
//   return reply.status(201).send({ success: true, data: created });
// };

// export const listAutomationByUserController = async (
//   request: FastifyRequest<{ Querystring: { igUserId: string } }>,
//   reply: FastifyReply
// ) => {
//   const { igUserId } = request.query;
//   const rows = await listAutomationRulesByUser(BigInt(igUserId));
//   return reply.send({ success: true, data: rows });
// };



import { FastifyReply, FastifyRequest } from "fastify";
import { 
  CreateAutomationBody, 
  ListAutomationQuery, 
  UpdateAutomationStatusBody,
  GetAutomationParams,
  UpdateExecutionBody
} from "../schema/automation";
import { 
  createAutomationRule, 
  listAutomationRulesByUser,
  updateAutomationStatus,
  getAutomationById,
  updateAutomationExecution,
  deleteAutomation
} from "../services/automation.services";

export const createAutomationController = async (
  request: FastifyRequest<{ Body: CreateAutomationBody }>,
  reply: FastifyReply
) => {
  const { igUserId, mediaId, rule, name, status, isActive } = request.body;
  
  const created = await createAutomationRule({
    igUserId: igUserId.toString(),
    mediaId,
    name,
    rule,
    status,
    isActive,
  });
  return reply.status(201).send({ success: true, data: created });
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
    return reply.status(404).send({ success: false, error: "Automation not found" });
  }
  
  return reply.send({ success: true, data: automation });
};

export const updateAutomationStatusController = async (
  request: FastifyRequest<{ Body: UpdateAutomationStatusBody, Params: GetAutomationParams }>,
  reply: FastifyReply
) => {
  const {  status, isActive } = request.body;
  const { id } = request.params;
  
  const updated = await updateAutomationStatus(id, { status, isActive });
  
  if (!updated) {
    return reply.status(404).send({ success: false, error: "Automation not found" });
  }
  
  return reply.send({ success: true, data: updated });
};

export const updateAutomationExecutionController = async (
  request: FastifyRequest<{ Body: UpdateExecutionBody }>,
  reply: FastifyReply
) => {
  const { id, lastExecutedAt, executionCount, errorCount, lastErrorAt, lastErrorMessage } = request.body;
  
  const updated = await updateAutomationExecution(id, {
    id,
    lastExecutedAt,
    executionCount,
    errorCount,
    lastErrorAt,
    lastErrorMessage,
  });
  
  if (!updated) {
    return reply.status(404).send({ success: false, error: "Automation not found" });
  }
  
  return reply.send({ success: true, data: updated });
};

export const deleteAutomationController = async (
  request: FastifyRequest<{ Params: GetAutomationParams }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  
  const deleted = await deleteAutomation(id);
  
  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Automation not found" });
  }
  
  return reply.send({ success: true, message: "Automation deleted successfully" });
};