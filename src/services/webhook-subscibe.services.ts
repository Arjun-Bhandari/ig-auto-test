import { prisma } from "../lib/db";
const fieldsToSubscribe = "comments,messages";

export const manageWebhookSubscription = async (igUserId: string) => {
  const user = await prisma.igUser.findUnique({
    where: { igUserId: BigInt(igUserId) },
    include: {
      automations: {
        where: { status: "ACTIVE", isActive: true },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const hasActiveAutomations = user.automations.length > 0;
  const isCurrentlySubscribedtoWebhooks = user.isWebhookSubscribed;

  if (hasActiveAutomations && !isCurrentlySubscribedtoWebhooks) {
    await subscribeIgUserToWebhooks(igUserId, user.accessToken);
    await prisma.igUser.update({
      where: { igUserId: BigInt(igUserId) },
      data: { isWebhookSubscribed: true },
    });

    return {
      success: true,
      action: "Subscribed to webhooks",
      message: "Webhooks subscribed successfully",
    };
  }

  if (!hasActiveAutomations && isCurrentlySubscribedtoWebhooks) {
    await unsubscribedtoWebhooks(igUserId, user.accessToken);
    await prisma.igUser.update({
      where: { igUserId: BigInt(igUserId) },
      data: { isWebhookSubscribed: false },
    });
    return {
      success: true,
      action: "Unsubscribed from webhooks",
      message: "Webhooks unsubscribed successfully",
    };
  }
  return {
    success: true,
    action: "No action needed",
    message: "Webhooks are already Managed",
  };
};

export const subscribeIgUserToWebhooks = async (
  igUserId: string,
  accessToken: string
) => {
  if (!igUserId && !accessToken)
    throw new Error(
      "Either user_id or accessToken is missing So Subscribing to webhooks is not possible"
    );

  const url =
    `https://graph.instagram.com/v23.0/${encodeURIComponent(
      igUserId
    )}/subscribed_apps?` +
    `subscribed_fields=${fieldsToSubscribe}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Subscribe failed: ${JSON.stringify(data)}`);
  }
  return data;
};

const unsubscribedtoWebhooks = async (
  igUserId: string,
  accessToken: string
) => {
  if (!igUserId && !accessToken)
    throw new Error(
      "Either user_id or accessToken is missing So Unsubscribing to webhooks is not possible"
    );

  const url =
    `https://graph.instagram.com/v23.0/${encodeURIComponent(
      igUserId
    )}/subscribed_apps?` +
    `subscribed_fields=${fieldsToSubscribe}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Unsubscribe failed: ${JSON.stringify(data)}`);
  }
  return data;
};
