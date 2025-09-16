import { FastifyRequest, FastifyReply } from "fastify";
import { getAllMedia } from "../services/media.services";
import { GetAllMediaParams } from "../types/igMedia";

export const getAllMediaController = async (request: FastifyRequest<{Body:GetAllMediaParams}>, reply: FastifyReply) => {
    const { igUserId,limit } = request.body;
    if(!igUserId){
        throw new Error("igUserId is required");
    }
    const media = await getAllMedia(igUserId, limit);
    reply.send(media);
};