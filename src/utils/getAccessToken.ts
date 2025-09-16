import { prisma } from "../lib/db";
import { logger } from "../config/logger";

export const getAccessTokenByIgUserId = async (igUserId: bigint): Promise<string> => {
  if(!igUserId){
    throw new Error("igUserId is required");
  }
  logger.info({ igUserId: igUserId.toString() }, "Incoming igUserId");
  const user = await prisma.igUser.findUnique({
    where: { igUserId: BigInt(igUserId) },
    select: { accessToken: true },
  });

  logger.info(`User: ${user}`);
  if (!user) throw new Error("Access token not found for igUserId");
  return user.accessToken;
};