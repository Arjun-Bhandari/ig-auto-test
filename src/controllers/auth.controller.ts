import { exchangeCodeForIgTokens } from "../services/auth.services";
import { FastifyRequest, FastifyReply } from "fastify";
interface IgAuthCallbackRequest {
  Body: {
    code: string;
  };
}
export const igAuthCallback = async (
  request: FastifyRequest<IgAuthCallbackRequest>,
  reply: FastifyReply
) => {
  const { code } = request.body;

  if (!code) {
    throw new Error("Code Not Received From Client");
  }
  try {
    const data = await exchangeCodeForIgTokens(code);
    return data;
  } catch (error) {
    throw new Error("Error: Failed to Exchange Code ");
  }
};
