import Fastify from "fastify";
import { igAuthroute } from "./routes/igauth.routes";
import { igMediaRoute } from "./routes/igmedia.routes";
import { env } from "./config/env";
import { automationRoute } from "./routes/automation.routes";

import fastifyCors from '@fastify/cors'
import { webhookRoute } from "./routes/webhook.routes";
import { webhookSubscribeRoute } from "./routes/webhook-subscribe.routes";
import { startBullBoard,startWorkers, stopWorkers } from "./workers/queues";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { logger } from "./config/logger";
import { prisma } from "./lib/db";

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  }
}).withTypeProvider<ZodTypeProvider>();

const startServer = async()=>{
  try{

    fastify.register(fastifyCors,{
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    })
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
    fastify.register(igAuthroute, { prefix: "/api" });
    fastify.register(igMediaRoute, { prefix: "/api" });
    fastify.register(automationRoute, { prefix: "/api" });
    fastify.register(webhookRoute, { prefix: "/api" });
    fastify.register(webhookSubscribeRoute, { prefix: "/api" });
    // startBullBoard(fastify);
    
    
    fastify.get("/", (request, reply) => {
      reply.send("Welcome to Insta automation Tool");
    });
    
    fastify.get("/health", async () => {
      const { healthCheck } = await import("./workers/queues");
      const queueHealth = await healthCheck();
      
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        queues: queueHealth,
      };
    });
    
    // startWorkers();
    await fastify.listen({port:env.PORT || 5000, host:"0.0.0.0"})
    logger.info(`Server running on port ${env.PORT}`);
    logger.info(`Bull Dashboard available at http://localhost:${env.PORT}/queues`);
  }catch(error){
    logger.error(error);
    process.exit(1);
  }
}



const shutDownServer = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    await stopWorkers();
    await fastify.close();
    logger.info("Server shut down successfully");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutDownServer("SIGTERM"));
process.on("SIGINT", () => shutDownServer("SIGINT"));

startServer();
