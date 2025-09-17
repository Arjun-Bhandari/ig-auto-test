import { FastifyReply, FastifyRequest } from "fastify";
import { AUTOMATION_PRESETS } from "../static/automation-presets";

export const listAutomationPresetsController = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  return reply.send({ presets: AUTOMATION_PRESETS });
};


