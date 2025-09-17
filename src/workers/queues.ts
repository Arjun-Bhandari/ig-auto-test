import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../config/logger";
import { runCommentProcessor } from "./tasks/comment-processor";
import { runDmProcessor } from "./tasks/dm-processor";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379",{
  maxRetriesPerRequest: null,
});

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
  commentId: string;
  buttons?: Array<{ type: "url"; label: string; url: string }>;
}

export const commentQueue = new Queue<CommentJobPayload>("comments", { connection });
export const dmQueue = new Queue<DmJobPayload>("dms", { connection });

export const enqueueCommentEvent = async (payload: CommentJobPayload, opts?: JobsOptions) =>
  commentQueue.add("comment-event", payload, { attempts: 3, backoff: { type: "exponential", delay: 500 }, ...opts });

export const enqueueDm = async (payload: DmJobPayload, opts?: JobsOptions) =>
  dmQueue.add("send-dm", payload, { attempts: 3, backoff: { type: "exponential", delay: 500 }, ...opts });

// Workers (start with the API process; or run in a separate worker process)
export const startWorkers = () => {
  const commentWorker = new Worker<CommentJobPayload>("comments", runCommentProcessor, { connection });
  const dmWorker = new Worker<DmJobPayload>("dms", runDmProcessor, { connection });

  commentWorker.on("completed", (job) => runCommentProcessor(job));
  commentWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "comment job failed"));
  dmWorker.on("completed", (job) => logger.info(runDmProcessor(job)));
  dmWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "dm job failed"));
};