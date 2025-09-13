import { igAuthCallback } from "../controllers/auth.controller";
import { FastifyInstance } from "fastify";
import { callbackBodySchema } from "../schema/igauth";
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
}
