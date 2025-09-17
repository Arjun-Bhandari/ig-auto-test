import { prisma } from "../lib/db";



export const subscribeIgUserToWebhooks = async (igUserId: string, fields: string[]) => {
  // load IG user token
  const user = await prisma.igUser.findUnique({
    where: { igUserId: BigInt(igUserId) },
    select: { accessToken: true },
  });
  if (!user?.accessToken) throw new Error("Access token not found");

  const url = `https://graph.instagram.com/v23.0/${encodeURIComponent(igUserId)}/subscribed_apps?` +
              `subscribed_fields=comments,messages` +
              `&access_token=${encodeURIComponent(user.accessToken)}`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
    if (!res.ok) {
    throw new Error(`Subscribe failed: ${JSON.stringify(data)}`);
  }
  return data; 
};