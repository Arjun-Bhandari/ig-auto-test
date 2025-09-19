import { Job } from "bullmq";
import { CommentJobPayload, enqueueDm } from "../queues";
import { prisma } from "../../lib/db";
import { logger } from "../../config/logger";

const GRAPH_BASE = "https://graph.instagram.com";
const API_VERSION = "v23.0";

const matchText = (text: string, contains?: string[], regex?: string) => {
  if (contains && contains.some(k => k && text.toLowerCase().includes(k.toLowerCase()))) return true;
  if (regex) {
    try { if (new RegExp(regex, "i").test(text)) return true; } catch {}
  }
  return false;
};

const replyToComment = async (accessToken: string, commentId: string, message: string) => {
  const url = `${GRAPH_BASE}/${API_VERSION}/${encodeURIComponent(commentId)}/replies`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Comment reply failed: ${JSON.stringify(data)}`);
  }
  return data; // { id: "<reply_comment_id>" }
};

export const runCommentProcessor = async (job: Job<CommentJobPayload>) => {
  const { igUserId, mediaId, text, fromUserId, commentId } = job.data;
  logger.info({ jobData: job.data }, "Processing comment job");
  
  const rules = await prisma.automationRule.findMany({
    where: { igUserId: BigInt(igUserId), mediaId },
  });
  logger.info({ rulesCount: rules.length }, "Found automation rules");
  if (!rules.length) {
    logger.info({ igUserId, mediaId }, "No automation rules found for this media");
    return;
  }

  // Load token once
  const igUser = await prisma.igUser.findUnique({
    where: { igUserId: BigInt(igUserId) },
    select: { accessToken: true },
  });
  if (!igUser?.accessToken) {
    logger.warn({ igUserId }, "No access token for IG user; skipping actions");
    return;
  }

  for (const r of rules) {
    const rule = r.rule as any;
    const trigger = rule?.trigger ?? {};
    const actions = Array.isArray(rule?.actions) ? rule.actions : [];

    logger.info({ rule, trigger, actions }, "Processing automation rule");

    if (trigger.type !== "comment_created") {
      logger.info({ triggerType: trigger.type }, "Skipping rule - wrong trigger type");
      continue;
    }
    if (trigger.mediaId && trigger.mediaId !== mediaId) {
      logger.info({ triggerMediaId: trigger.mediaId, commentMediaId: mediaId }, "Skipping rule - mediaId mismatch");
      continue;
    }

    const contains = trigger.match?.contains as string[] | undefined;
    const regex = trigger.match?.regex as string | undefined;
    const include = trigger.match?.include as string[] | undefined;
    // const exclude = trigger.match?.exclude as string[] | undefined; // Commented out as requested
    
    // Use include format if available, fallback to contains format
    const keywordsToMatch = include || contains;
    
    logger.info({ text, keywordsToMatch, regex }, "Evaluating text match");
    const textMatches = matchText(text || "", keywordsToMatch, regex);
    logger.info({ textMatches }, "Text match result");
    
    if (!textMatches) {
      logger.info("Skipping rule - text doesn't match keywords");
      continue;
    }
    logger.info({ actions }, "actions");
    for (const action of actions) {
      if (action.type === "comment_reply") {
        const replyText =
          action.randomize && Array.isArray(action.responses) && action.responses.length
            ? action.responses[Math.floor(Math.random() * action.responses.length)]
            : action.text;
        logger.info({ replyText }, "replyText");
        if (!replyText) continue;
        try {
          await replyToComment(igUser.accessToken, commentId, replyText);
          logger.info({ igUserId, commentId }, "Replied to comment");
        } catch (err) {
          logger.error({ err, commentId }, "Reply to comment failed");
        }
      } else if (action.type === "send_dm") {
        // hand off to DM queue; will use private reply
        await enqueueDm({
          igUserId,
          commentId,
          toUserId: fromUserId, // not used for private reply by comment id, but keep for future
          text: action.text,
          buttons: action.buttons,
        });
      }
    }
  }
};