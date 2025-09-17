import { Job } from "bullmq";
import { DmJobPayload } from "../queues";
import { prisma } from "../../lib/db";
import { logger } from "../../config/logger";

const GRAPH_BASE = "https://graph.instagram.com";
const API_VERSION = "v23.0";

const sendPrivateReply = async (appUsersIgId: string, accessToken: string, commentId: string, text: string) => {
  const url = `${GRAPH_BASE}/${API_VERSION}/${encodeURIComponent(appUsersIgId)}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Private reply failed: ${JSON.stringify(data)}`);
  }
  return data; // { recipient_id, message_id }
};

export const runDmProcessor = async (job: Job<DmJobPayload>) => {
  const { igUserId, text } = job.data;

  // Load IG user token and use igUserId as <APP_USERS_IG_ID>
  const user = await prisma.igUser.findUnique({
    where: { igUserId: BigInt(igUserId) },
    select: { accessToken: true },
  });
  if (!user?.accessToken) {
    throw new Error("Access token not found for igUserId");
  }

  // We need the current commentId to send a private reply. For now, pass it via job data:
  // Change DmJobPayload to include commentId.
  const commentId = (job.data as any).commentId as string | undefined;
  if (!commentId) {
    logger.warn({ igUserId }, "No commentId for private reply; skipping");
    return;
  }

  await sendPrivateReply(String(igUserId), user.accessToken, commentId, text);
  logger.info({ igUserId, commentId }, "Sent private reply");
};