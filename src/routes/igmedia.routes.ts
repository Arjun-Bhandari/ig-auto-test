import { FastifyInstance } from "fastify";
import { getAllMediaController } from "../controllers/media.controller";
import { getAllMediaQuerySchema } from "../schema/igmedia";

export const igMediaRoute = async (app: FastifyInstance) => {
    app.post("/igmedia", {
        schema: {
            body: getAllMediaQuerySchema,
        },      
    }, getAllMediaController);
}