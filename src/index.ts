import Fastify from "fastify";
import { igAuthroute } from "./routes/igauth.routes";
import { igMediaRoute } from "./routes/igmedia.routes";
import { env } from "./config/env";
import { presetsRoute } from "./routes/presets.routes";
import { automationRoute } from "./routes/automation.routes";
import { templatesRoute } from "./routes/templates.routes";
import fastifyCors from '@fastify/cors'
import { webhookRoute } from "./routes/webhook.routes";
import { webhookSubscribeRoute } from "./routes/webhook-subscribe.routes";
import { startWorkers } from "./workers/queues";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { logger } from "./config/logger";

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

 fastify.register(fastifyCors,{
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
})
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
fastify.register(igAuthroute, { prefix: "/api" });
fastify.register(igMediaRoute, { prefix: "/api" });
fastify.register(presetsRoute, { prefix: "/api" });
fastify.register(automationRoute, { prefix: "/api" });
fastify.register(templatesRoute, { prefix: "/api" });
fastify.register(webhookRoute, { prefix: "/api" });
fastify.register(webhookSubscribeRoute, { prefix: "/api" });
startWorkers();

fastify.get("/", (request, reply) => {
  reply.send("Welcome to Insta automation Tool");
});

fastify.get("/health", (reqest, reply) => {
  reply.status(200).send("Healthy");
});
fastify.listen({ port: env.PORT || 5000 }, function (error, address) {
  if (error) {
    logger.error(error, "Sever Startup Failed");
    process.exit(1);
  }
  logger.info(`Server listening at ${address}`);
});
