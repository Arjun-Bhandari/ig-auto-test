// src/controllers/templates.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { CreateTemplateBody } from "../schema/templates";
import { createTemplate, getTemplateById } from "../services/templates.services";

export const createTemplateController = async (
  request: FastifyRequest<{ Body: CreateTemplateBody }>,
  reply: FastifyReply
) => {
  const created = await createTemplate(request.body);
  return reply.status(201).send({ success: true, data: created });
};

export const getTemplateController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const tpl = await getTemplateById(request.params.id);
  if (!tpl) return reply.status(404).send({ success: false, error: "Template not found" });
  return reply.send({ success: true, data: tpl });
};