import { Job } from "bullmq";
import { CommentJobPayload, enqueueDm } from "../queues";
import { prisma } from "../../lib/db";
import { logger } from "../../config/logger";

const GRAPH_BASE = "https://graph.instagram.com";
const API_VERSION = "v23.0";

const matchText = (
  text: string,
  contains?: string[],
  regex?: string
): boolean => {
  if (!text) return false;
  const normalizedText = text.toLowerCase().trim();
  if (contains?.length) {
    const hasMatch = contains.some((keyword) => {
      if (!keyword) return false;
      return normalizedText.includes(keyword.toLowerCase().trim());
    });
    if (hasMatch) return true;
  }

  // Check regex pattern
  if (regex) {
    try {
      const pattern = new RegExp(regex, "i");
      if (pattern.test(text)) return true;
    } catch (err: any) {
      logger.warn({ regex, err: err.message }, "Invalid regex pattern");
    }
  }

  return false;

  // if (contains && contains.some(k => k && text.toLowerCase().includes(k.toLowerCase()))) return true;
  // if (regex) {
  //   try { if (new RegExp(regex, "i").test(text)) return true; } catch {}
  // }
  // return false;
};

const replyToComment = async (
  accessToken: string,
  commentId: string,
  message: string
) => {
  const url = `${GRAPH_BASE}/${API_VERSION}/${encodeURIComponent(
    commentId
  )}/replies`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });
  const data = (await res.json()) as any;

  if (!res.ok) {
    // Handleing specific Instagram API errors
    const error = new Error(`Comment reply failed: ${JSON.stringify(data)}`);
    error.name = data.error?.type || "InstagramAPIError";
    throw error;
  }
  return data;
};
// Update automation execution tracking
const updateAutomationExecution = async (
  automationId: string,
  success: boolean,
  errorMessage?: string
) => {
  try {
    await prisma.automation.update({
      where: { id: automationId },
      data: {
        lastExecutedAt: new Date(),
        executionCount: { increment: 1 },
        ...(success
          ? {}
          : {
              errorCount: { increment: 1 },
              lastErrorAt: new Date(),
              lastErrorMessage: errorMessage,
            }),
      },
    });
  } catch (error) {
    logger.error(
      { error, automationId },
      "Error updating automation execution"
    );
  }
};

export const runCommentProcessor = async (job: Job<CommentJobPayload>) => {
  const { igUserId, mediaId, text, fromUserId, commentId, timestamp } =
    job.data;
  logger.info(
    {
      jobId: job.id,
      igUserId,
      mediaId,
      commentId,
      timestamp,
    },
    "Processing comment job"
  );
  try {
    const rules = await prisma.automation.findMany({
      where: {
        igUserId: BigInt(igUserId),
        mediaId,
        status: "ACTIVE", // Only active automations
        isActive: true, // Additional active check
      },
    });
    logger.info(
      {
        rulesCount: rules.length,
        igUserId,
        mediaId,
      },
      "Found active automation rules"
    );

    if (!rules.length) {
      logger.info({ igUserId, mediaId }, "No active automation rules found");
      return { processed: 0, skipped: 0, errors: 0 };
    }

    // Load token once
    const igUser = await prisma.igUser.findUnique({
      where: { igUserId: BigInt(igUserId) },
      select: { accessToken: true },
    });
    if (!igUser?.accessToken) {
      logger.warn({ igUserId }, "No access token found for user");
      return { processed: 0, skipped: rules.length, errors: 0 };
    }

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    for (const automation of rules) {
      try {
        const rule = automation.rule as any;
        const trigger = rule?.trigger ?? {};
        const actions = Array.isArray(rule?.actions) ? rule.actions : [];
        logger.info(
          {
            automationId: automation.id,
            triggerType: trigger.type,
          },
          "Processing automation rule"
        );
        if (trigger.type !== "comment_created") {
          logger.info(
            {
              automationId: automation.id,
              triggerType: trigger.type,
            },
            "Skipping - wrong trigger type"
          );
          skipped++;
          continue;
        }
        if (trigger.mediaId && trigger.mediaId !== mediaId) {
          logger.info(
            {
              automationId: automation.id,
              triggerMediaId: trigger.mediaId,
              commentMediaId: mediaId,
            },
            "Skipping - mediaId mismatch"
          );
          skipped++;
          continue;
        }
        const contains = trigger.match?.contains as string[] | undefined;
        const include = trigger.match?.include as string[] | undefined;
        const regex = trigger.match?.regex as string | undefined;

        const keywordsToMatch = include || contains;
        const textMatches = matchText(text || "", keywordsToMatch, regex);
        logger.info(
          {
            automationId: automation.id,
            text: text?.substring(0, 50) + "...",
            keywordsToMatch,
            regex,
            textMatches,
          },
          "Text match evaluation"
        );
        if (!textMatches) {
          logger.info(
            { automationId: automation.id },
            "Skipping - text doesn't match"
          );
          skipped++;
          continue;
        }

        for (const action of actions) {
          if (action.type === "comment_reply") {
            const replyText =
              action.randomize &&
              Array.isArray(action.responses) &&
              action.responses.length
                ? action.responses[
                    Math.floor(Math.random() * action.responses.length)
                  ]
                : action.text;

            if (!replyText) {
              logger.warn(
                { automationId: automation.id },
                "No reply text available"
              );
              continue;
            }

            try {
              await replyToComment(igUser.accessToken, commentId, replyText);
              logger.info(
                {
                  automationId: automation.id,
                  commentId,
                  replyText: replyText.substring(0, 50) + "...",
                },
                "Successfully replied to comment"
              );

              await updateAutomationExecution(automation.id, true);
            } catch (err: any) {
              logger.error(
                {
                  err: err.message,
                  automationId: automation.id,
                  commentId,
                },
                "Failed to reply to comment"
              );

              await updateAutomationExecution(
                automation.id,
                false,
                err.message
              );
              errors++;
            }
          } else if (action.type === "send_dm" && textMatches) {
            try {
              await enqueueDm({
                igUserId,
                commentId: commentId,
                commentOwnerUserId: fromUserId, // not used for private reply by comment id, but keep for future
                text: action.text,
                buttons: action.buttons,
                webhookId: job.data.webhookId,
              });
              logger.info(
                {
                  automationId: automation.id,
                  commentId,
                },
                "Successfully enqueued DM"
              );
              await updateAutomationExecution(automation.id, true);
            } catch (err: any) {
              logger.error(
                {
                  err: err.message,
                  automationId: automation.id,
                },
                "Failed to enqueue DM"
              );

              await updateAutomationExecution(
                automation.id,
                false,
                err.message
              );
              errors++;
            }
          }
        }
        processed++;
      } catch (err: any) {
        logger.error(
          {
            err: err.message,
            automationId: automation.id,
          },
          "Error processing automation rule"
        );

        await updateAutomationExecution(automation.id, false, err.message);
        errors++;
      }
    }
    const result = { processed, skipped, errors };
    logger.info({ ...result, jobId: job.id }, "Comment processing completed");
    return result;
  } catch (err: any) {
    logger.error(
      {
        err: err.message,
        jobId: job.id,
        igUserId,
        mediaId,
      },
      "Failed to process comment job"
    );
    throw err;
  }
};
