import { igAuthCallback,getIgUser } from "../controllers/auth.controller";
import { FastifyInstance } from "fastify";
import { callbackBodySchema,getIgUserParamsSchema } from "../schema/igauth";
export const igAuthroute = async (app: FastifyInstance) => {
  app.post(
    "/igauth/callback",
    {
      schema: {
        body: callbackBodySchema,
      },
    },
    igAuthCallback
  );

  app.post(
    "/igauth/user",
    {
      schema: {
        body: getIgUserParamsSchema,
      },
    },
    getIgUser
  );
}
