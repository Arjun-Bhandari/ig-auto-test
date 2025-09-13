import { prisma } from "../lib/db";
import { env } from "../config/env";
import {
  IgAuthError,
  IgShortLivedSuccessResponse,
  IgLongLivedTokenResponse,
  IgSixtyDaysTokenResponse,
  UnifiedIgAuthResponse,
} from "../types/igauth";
let IGCLIENTID = env.IG_CLIENT_ID;
let IGCLIENTSECRET = env.IG_CLIENT_SECRET;
let SERVERURL = env.SERVER_URL;

export const getShortLivedIgAccesstoken = async (
  code: string
): Promise<IgShortLivedSuccessResponse> => {
  if (!code) {
    throw Error("Code is Required");
  }

  const formData = new URLSearchParams();
  formData.append("client_id", IGCLIENTID);
  formData.append("client_secret", IGCLIENTSECRET);
  formData.append("redirect_uri", `${SERVERURL}/api/igauth/callback`);
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
export const exchangeCodeForIgTokens = async (
  code: string
): Promise<UnifiedIgAuthResponse> => {
  if (!code) {
    throw new Error("Authorization code is required");
  }
  try {
    const shortLivedToken = await getShortLivedIgAccesstoken(code);
    const longLivedToken = await getLongLivedIgAccessToken(
      shortLivedToken.data[0].access_token
    );
    const tokenCreatedAt = new Date();
    const tokenExpireAt = new Date(
      tokenCreatedAt.getTime() + longLivedToken.expires_in * 1000
    );
    const permissionsArray = shortLivedToken.data[0].permissions
    ? shortLivedToken.data[0].permissions.split(",")
    : [];
    // Db insert Here 
    const dbUsers = await prisma.igUser.upsert({
      where: { igUserId: shortLivedToken.data[0].user_id },
      update: {
        accessToken: longLivedToken.access_token,
        tokenExpireDay:tokenExpireAt,
        tokenExpireIn : longLivedToken.expires_in,
        tokenCreatedAt,
        permissions: permissionsArray,
      },
      create: {
        igUserId: shortLivedToken.data[0].user_id,
        username: "", // need IG Graph call
        accessToken: longLivedToken.access_token,
        tokenExpireDay:tokenExpireAt,
        tokenCreatedAt,
        tokenExpireIn:longLivedToken.expires_in,
        permissions: permissionsArray,
      },
    });
    //Todo : Need to Remove logs 
    console.log(dbUsers);
    return ({
      igUserId: shortLivedToken.data[0].user_id,
        username: "", // need IG Graph call
        accessToken: longLivedToken.access_token,
        tokenExpireDay:tokenExpireAt,
        tokenCreatedAt,
        tokenExpireIn:longLivedToken.expires_in,
        permissions: permissionsArray,
    });
  } catch (error) {
    throw new Error(
      `Instagram authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getSixtyDaysLivedIgAccessToken = async (
  longLivedAccesstoken: string, igUserId:string
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
    tokenExpireDay:tokenExpireAt,
    tokenExpireIn:successData.expires_in
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
