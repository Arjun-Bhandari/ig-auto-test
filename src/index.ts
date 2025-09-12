import Fastify from "fastify";
import { env } from "./config/env";
const fastify = Fastify({
    logger:true
})


fastify.get('/',(request,reply)=>{
reply.send("Welcome to Insta automation Tool")
})

fastify.get('/health',(reqest,reply)=>{
    reply.status(200).send("Healthy")
})
fastify.listen({port:env.PORT||5000},function (error,address){
    if(error){
        fastify.log.error(error);
        process.exit(1);
    }
    fastify.log.info(`Sever Listing at PORT ${env.PORT}`)
})