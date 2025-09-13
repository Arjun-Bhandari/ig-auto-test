import { exchangeCodeForIgTokens } from "../services/auth.services";
import { FastifyRequest, FastifyReply } from "fastify";
import{ CallbackBody} from "../schema/igauth";
export const igAuthCallback = async (
  request: FastifyRequest<{Body:CallbackBody}>,
  reply: FastifyReply
) => {
  const { code } = request.body;

  if (!code) {
    throw new Error("Code Not Received From Client");
  }
  try {
    const data = await exchangeCodeForIgTokens(code);
    reply.status(200).send({
      success:true,
      data
    });
  } catch (error) {
    throw new Error("Error: Failed to Exchange Code ");
  }
};
