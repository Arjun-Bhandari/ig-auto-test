import { prisma } from "../lib/db";
import { env } from "../config/env";
import { logger } from "../config/logger";
import {
  IgAuthError,
  IgShortLivedSuccessResponse,
  IgLongLivedTokenResponse,
  IgSixtyDaysTokenResponse,
  UnifiedIgAuthResponse,
  IgUserInfoResponse,
} from "../types/igauth";
let IGCLIENTID = env.IG_CLIENT_ID;
let IGCLIENTSECRET = env.IG_CLIENT_SECRET;
let FRONTENDURL = env.FRONTEND_URL;

export const getShortLivedIgAccesstoken = async (
  code: string
): Promise<IgShortLivedSuccessResponse> => {
  if (!code) {
    throw Error("Code is Required");
  }

  const formData = new URLSearchParams();
  formData.append("client_id", IGCLIENTID);
  formData.append("client_secret", IGCLIENTSECRET);
  formData.append("grant_type", "authorization_code");
  formData.append("redirect_uri", `${FRONTENDURL}/auth/instagram/callback`);
  formData.append("code", code);

  try {
    const response: Response = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (!response.ok) {
      const errorData = data as IgAuthError;
      throw new Error(
        `ERROR : Getting Short Lived Token IG Response error :${errorData.error_message}`
      );
    }
    const successData = data as IgShortLivedSuccessResponse;
    logger.info(`DATA Log on getShortLivedIGAccesstoken ${successData}`);
    return successData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Get Short Lived Service Failed :${error.message}`);
    }
    throw error;
  }
};

export const getLongLivedIgAccessToken = async (
  shortLivedAccesstoken: string
): Promise<IgLongLivedTokenResponse> => {
  if (!shortLivedAccesstoken) {
    throw new Error("Short Lived Access Token is Required");
  }

  try {
    const response: Response = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IGCLIENTSECRET}&access_token=${shortLivedAccesstoken}`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    if (!response.ok) {
      const errorData = data as IgAuthError;
      throw new Error(
        `ERROR : Getting Long Lived Access Token  ig response Failed ${errorData}`
      );
    }
    const successData = data as IgLongLivedTokenResponse;
    return successData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Get Short Lived Service Failed :${error.message}`);
    }
    throw error;
  }
};
export const fetchIgUserInfo = async (
  accessToken: string
): Promise<IgUserInfoResponse> => {
  if (!accessToken) {
    throw new Error("Access Token Required to Fetched User Data");
  }
  const response = await fetch(
    `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,account_type,user_id&access_token=${accessToken}`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  if (!response.ok) {
    const errorData = data as IgAuthError;
    throw new Error(
      `ERROR : Getting IG User Info  ig response Failed ${errorData}`
    );
  }
  const userData = data as IgUserInfoResponse;
  return userData;
};
export const exchangeCodeForIgTokens = async (
  code: string
): Promise<UnifiedIgAuthResponse> => {
  if (!code) {
    throw new Error("Authorization code is required");
  }
  try {
    const shortLivedToken = await getShortLivedIgAccesstoken(code);
    logger.info(
      `Data Reached Exchange Code Block: shortLivedToken: ${shortLivedToken}`
    );
    const longLivedToken = await getLongLivedIgAccessToken(
      shortLivedToken.access_token
    );
    const userData = await fetchIgUserInfo(longLivedToken.access_token);
    logger.info(`User Data ${userData}`)
    const tokenCreatedAt = new Date();
    const tokenExpireAt = new Date(
      tokenCreatedAt.getTime() + longLivedToken.expires_in * 1000
    );
    // Db insert Here
    const dbUsers = await prisma.igUser.upsert({
      where: { igUserId: BigInt(userData.user_id) },
      update: {
        accessToken: longLivedToken.access_token,
        tokenExpireDay: tokenExpireAt,
        tokenExpireIn: longLivedToken.expires_in,
        tokenCreatedAt,
        permissions: shortLivedToken.permissions || [],
      },
      create: {
        igUserId: BigInt(userData.user_id),
        username: userData.username || null,
        name: userData.name || null,
        profilePictureUrl: userData.profile_picture_url || null,
        accountType: userData.account_type || null,
        accessToken: longLivedToken.access_token,
        tokenExpireDay: tokenExpireAt,
        tokenCreatedAt,
        tokenExpireIn: longLivedToken.expires_in,
        permissions: shortLivedToken.permissions || [],
      },
    });
    //Todo : Need to Remove logs
    logger.info(dbUsers, "Data Received after inserting into Db");
    return {
      igUserId: String(userData.user_id),
      username: userData.username || "",
      name: userData.name || "",
      profilePictureUrl: userData.profile_picture_url || "",
      accountType: userData.account_type,
      accessToken: longLivedToken.access_token,
      tokenExpireDay: tokenExpireAt,
      tokenCreatedAt,
      tokenExpireIn: longLivedToken.expires_in,
      permissions: shortLivedToken.permissions || [],
    };
  } catch (error) {
    logger.error(error, "Error form exchange code Fro Ig Tokens");
    throw new Error(
      `Instagram authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const refreshLongLivedIgAccessToken = async (
  longLivedAccesstoken: string,
  igUserId: number
): Promise<IgSixtyDaysTokenResponse> => {
  if (!longLivedAccesstoken) {
    throw new Error(
      "Long Lived Access Token is Required to Request 60 days lived Access Token"
    );
  }
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedAccesstoken}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const errorData = data as IgAuthError;
      throw new Error(
        `ERROR : Getting 60 days Lived Access Token  ig response Failed ${errorData}`
      );
    }

    const successData = data as IgSixtyDaysTokenResponse;
    const tokenCreatedAt = new Date();
    const tokenExpireAt = new Date(
      tokenCreatedAt.getTime() + successData.expires_in * 1000
    );

    // update only token-related fields
    await prisma.igUser.update({
      where: { igUserId },
      data: {
        accessToken: successData.access_token,
        tokenCreatedAt,
        tokenExpireDay: tokenExpireAt,
        tokenExpireIn: successData.expires_in,
      },
    });
    return successData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Refresh Long Lived Service Failed :${error.message}`);
    }
    throw error;
  }
};

export const getIgUserService = async(igUserId:bigint)=>{
if(!igUserId){
  throw new Error("User id is required to fetch instagram users data")
}
  try{
const user = await prisma.igUser.findUnique({
  where:{igUserId:igUserId},
  select:{
id:true,
igUserId:true,
username:true,
name:true,
profilePictureUrl:true,
accountType:true,
permissions:true,
tokenExpireDay:true,
tokenExpireIn:true,
  }
})
if(!user){
  throw new Error("User not found")
}
return user;
  }catch(error){
throw new Error(`Error fetching instagram users data: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

}
