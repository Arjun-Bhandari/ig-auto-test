import { Job } from "bullmq";
import { DmJobPayload } from "../queues";
import { prisma } from "../../lib/db";
import { logger } from "../../config/logger";

const GRAPH_BASE = "https://graph.instagram.com";
const API_VERSION = "v23.0";

interface APIError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}
type DmButton = { type: "url"; label: string; url: string };
const isRetryableError = (error: APIError) => {
  const errorCode = error.error?.code;
  const errorSubcode = error.error?.error_subcode;
  const errorType = error.error?.type;

  const nonRetryableErrors = [
    10, //Instagram messaging window closed
    200, //Permisson Error
    190, //Accesstoken error
  ];
  const nonRetryableSubcodes = [
    2534022, //Message outside allowed window
  ];

  if (nonRetryableErrors.includes(errorCode!)) return false;
  if (nonRetryableSubcodes.includes(errorSubcode!)) return false;
  if (errorType === "OAuthExecption") return false;
  return true;
};
const sendPrivateReplyWithButtons = async (
  appUsersIgId: string,
  accessToken: string,
  commentId: string,
  text: string,
  buttons: DmButton[],
  commentOwnerUserId: string
) => {
  const url = `${GRAPH_BASE}/${API_VERSION}/${encodeURIComponent(
    appUsersIgId
  )}/messages`;
  const sanitizedButtons = buttons
    .slice(0, 3) // Max 3 buttons as mention in the docs 
    .filter((b) => b.url && /^https?:\/\//i.test(b.url))
    .map((b) => ({
      type: "web_url",
      url: b.url,
      title: (b.label || "Open").slice(0, 20), // Max 20 chars
    }));

  if (!sanitizedButtons.length) {
    throw new Error("No valid buttons provided");
  }
  const payload = {
    recipient: { comment_id: commentId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text.slice(0, 640),
          buttons: sanitizedButtons,
        },
      },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(`Button template failed: ${JSON.stringify(data)}`);
    error.name = "ButtonTemplateError";
    Object.assign(error, { apiResponse: data });
    throw error;
  }
  return data;
};
const sendPrivateReply = async (
  appUsersIgId: string,
  accessToken: string,
  commentId: string,
  text: string
) => {
  const url = `${GRAPH_BASE}/${API_VERSION}/${encodeURIComponent(
    appUsersIgId
  )}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(`Private reply failed: ${JSON.stringify(data)}`);
    error.name = "PrivateReplyError";
    Object.assign(error, { apiResponse: data });
    throw error;
  }
  return data;
};

export const runDmProcessor = async (job: Job<DmJobPayload>) => {
  const { igUserId, text, buttons, commentId, commentOwnerUserId } = job.data;
  logger.info(
    {
      jobId: job.id,
      igUserId,
      commentId,
      hasButtons: !!buttons?.length,
    },
    "Processing DM job"
  );

  try {
    if (!commentId) {
      throw new Error("No commentId provided for private reply");
    }

    if (!text) {
      throw new Error("No text provided for message");
    }
    const user = await prisma.igUser.findUnique({
      where: { igUserId: BigInt(igUserId) },
      select: { accessToken: true },
    });
    if (!user?.accessToken) {
      throw new Error(`Access token not found for igUserId: ${igUserId}`);
    }
    const useTemplates = process.env.USE_TEMPLATES === "true";
    if (useTemplates && buttons?.length) {
      try {
        await sendPrivateReplyWithButtons(
          String(igUserId),
          user.accessToken,
          commentId,
          text,
          buttons,
          commentOwnerUserId
        );

        logger.info(
          {
            jobId: job.id,
            igUserId,
            commentId,
            buttonCount: buttons.length,
          },
          "Successfully sent private reply with buttons"
        );
        return { success: true, method: "button_template" };
      } catch (error: any) {
        const apiError = error.apiResponse as APIError;

        logger.warn(
          {
            jobId: job.id,
            err: error.message,
            apiError: apiError?.error,
            igUserId,
            commentId,
          },
          "Button template failed, falling back to text"
        );

        // Don't retry if it's a non-retryable error
        if (!isRetryableError(apiError)) {
          return { success: false, error: error.message, retryable: false };
        } else {
          throw error; // Let BullMQ retry
        }
      }
    }
    const textWithUrls = buttons?.length
      ? `${text}\n\n${buttons
          .slice(0, 3)
          .map((b) => `${b.label || "Open"}: ${b.url}`)
          .join("\n")}`
      : text;
    await sendPrivateReply(igUserId, user.accessToken, commentId, textWithUrls);

    logger.info(
      {
        jobId: job.id,
        igUserId,
        commentId,
        hasUrls: !!buttons?.length,
      },
      "Successfully sent private reply with text"
    );

    return { success: true, method: "text_fallback" };
  } catch (error: any) {
    const apiError = error.apiResponse as APIError;

    logger.error(
      {
        jobId: job.id,
        err: error.message,
        apiError: apiError?.error,
        igUserId,
        commentId,
      },
      "Failed to process DM job"
    );

    // Check if we should retry
    if (apiError && !isRetryableError(apiError)) {
      logger.warn(
        {
          jobId: job.id,
          errorCode: apiError.error?.code,
          errorSubcode: apiError.error?.error_subcode,
        },
        "Non-retryable error, marking job as failed"
      );

      // Don't throw - this will mark the job as completed but log the failure
      return { success: false, error: error.message, retryable: false };
    }

    throw error; // Let BullMQ retry
  }
};
