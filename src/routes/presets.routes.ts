import { FastifyInstance } from "fastify";
import { listAutomationPresetsController } from "../controllers/presets.controller";

export const presetsRoute = async (app: FastifyInstance) => {
  app.get("/automation-presets", {}, listAutomationPresetsController);
};


