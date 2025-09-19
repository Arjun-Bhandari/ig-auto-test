import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../config/logger";
import { runCommentProcessor } from "./tasks/comment-processor";
import { runDmProcessor } from "./tasks/dm-processor";

export interface CommentJobPayload {
  igUserId: string;
  mediaId: string;
  commentId: string;
  text: string;
  fromUserId: string;
  timestamp: string;
}

export interface DmJobPayload {
  igUserId: string;
  toUserId: string;
  text: string;
  commentId?: string;
  buttons?: Array<{ type: "url"; label: string; url: string }>;
}

let connection: IORedis | null = null;
let commentQueue: Queue<CommentJobPayload> | null = null;
let dmQueue: Queue<DmJobPayload> | null = null;
let commentWorker: Worker<CommentJobPayload> | null = null;
let dmWorker: Worker<DmJobPayload> | null = null;

const ensureConnection = () => {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
};

const ensureQueues = () => {
  ensureConnection();
  if (!commentQueue) commentQueue = new Queue<CommentJobPayload>("comments", { connection: connection! });
  if (!dmQueue) dmQueue = new Queue<DmJobPayload>("dms", { connection: connection! });
};

export const enqueueCommentEvent = async (payload: CommentJobPayload, opts?: JobsOptions) => {
  logger.info({ payload }, "Enqueueing comment event");
  ensureQueues();
  const job = await commentQueue!.add("comment-event", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 500 },
    ...opts,
  });
  logger.info({ jobId: job.id }, "Comment event job enqueued");
  return job;
};

export const enqueueDm = async (payload: DmJobPayload, opts?: JobsOptions) => {
  ensureQueues();
  return dmQueue!.add("send-dm", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 500 },
    ...opts,
  });
};

export const startWorkers = () => {
  try {
    logger.info("Starting workers...");
    ensureQueues();
    if (!commentWorker) {
      logger.info("Creating comment worker...");
      commentWorker = new Worker<CommentJobPayload>("comments", runCommentProcessor, { connection: connection! });
      commentWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Comment Job Completed"));
      commentWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Comment Job Failed"));
      commentWorker.on("ready", () => logger.info("Comment worker is ready"));
      commentWorker.on("error", (err) => logger.error({ err }, "Comment worker error"));
      logger.info("Comment worker created successfully");
    }
    if (!dmWorker) {
      logger.info("Creating DM worker...");
      dmWorker = new Worker<DmJobPayload>("dms", runDmProcessor, { connection: connection! });
      dmWorker.on("completed", (job) => logger.info({ jobId: job.id }, "DM Job Completed"));
      dmWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "DM Job Failed"));
      dmWorker.on("ready", () => logger.info("DM worker is ready"));
      dmWorker.on("error", (err) => logger.error({ err }, "DM worker error"));
      logger.info("DM worker created successfully");
    }
    logger.info("Workers started successfully");
  } catch (error) {
    logger.error({ error }, "Failed to start workers");
    throw error;
  }
};

export const stopWorkers = async () => {
  await commentWorker?.close();
  await dmWorker?.close();
  await commentQueue?.close();
  await dmQueue?.close();
  await connection?.quit();
  commentWorker = null;
  dmWorker = null;
  commentQueue = null;
  dmQueue = null;
  connection = null;
};