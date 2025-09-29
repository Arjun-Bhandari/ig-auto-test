import { exchangeCodeForIgTokens, getIgUserService } from "../services/auth.services";
import { FastifyRequest, FastifyReply } from "fastify";
import{ CallbackBody, GetIgUserParams } from "../schema/igauth";

export const igAuthCallback = async (
  request: FastifyRequest<{Body:CallbackBody}>,
  reply: FastifyReply
) => {
  const { code } = request.body;

  if (!code) {
    throw new Error("Code Not Received From Client");
  }
  try {
    const data = await exchangeCodeForIgTokens(code);
    reply.status(200).send({
      success:true,
      data
    });
  } catch (error) {
    throw new Error("Error: Failed to Exchange Code ");
  }
};


export  const getIgUser = async(request:FastifyRequest<{Body:GetIgUserParams}>, reply: FastifyReply)=>{
  const {igUserId} = request.body;
  if(!igUserId){
    throw new Error("User id is required to fetch instagram users data")
  }
  const user = await getIgUserService(BigInt(igUserId));
  reply.status(200).send({
    success:true,
    data:{
      igUserId:String(user.igUserId),
      username:user.username,
      name:user.name,
      profilePictureUrl:user.profilePictureUrl,
      accountType:user.accountType,
      permissions:user.permissions,
      tokenExpireDay:user.tokenExpireDay,
      tokenExpireIn:user.tokenExpireIn,
      
    }
  })
}