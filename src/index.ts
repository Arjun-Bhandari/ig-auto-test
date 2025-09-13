import Fastify from "fastify";
import { igAuthroute } from "./routes/igauth.routes";
import { env } from "./config/env";
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
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
fastify.register(igAuthroute, { prefix: "/api" });

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
