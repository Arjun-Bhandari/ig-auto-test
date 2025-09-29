import { Queue, Worker, JobsOptions, Job } from "bullmq";
import { FastifyInstance } from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
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
  webhookId?: string;
}

export interface DmJobPayload {
  igUserId: string;
  commentOwnerUserId: string;
  text: string;
  commentId?: string;
  buttons?: Array<{ type: "url"; label: string; url: string }>;
  webhookId?: string;
}

let connection: IORedis | null = null;
let commentQueue: Queue<CommentJobPayload> | null = null;
let dmQueue: Queue<DmJobPayload> | null = null;
let commentWorker: Worker<CommentJobPayload> | null = null;
let dmWorker: Worker<DmJobPayload> | null = null;
let serverAdapter: FastifyAdapter | null = null;
const ensureConnection = () => {
  if (!connection) {
    connection = new IORedis(
      process.env.REDIS_URL || "redis://localhost:6379",
      {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        reconnectOnError: (err) => {
          const targetError = "READONLY";
          return err.message.includes(targetError);
        },
      }
    );

    connection.on("error", (err) => {
      logger.error({ err }, "Redis connection error");
    });
    connection.on("connect", () => {
      logger.info("Redis connected");
    });

    connection.on("ready", () => {
      logger.info("Redis ready");
    });
    connection.on("close", () => {
      logger.info("Redis closed");
    });

    return connection;
  }
};

const ensureQueues = () => {
  const connection = ensureConnection();
  if (!commentQueue) {
    commentQueue = new Queue<CommentJobPayload>("comments", {
      connection: connection!,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });
  }

  if (!dmQueue) {
    dmQueue = new Queue<DmJobPayload>("dms", {
      connection: connection!,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });
  }
};
// Using Idempotent job enqueuiening to ensure no duplicate jobs are enqueued

export const enqueueCommentEvent = async (
  payload: CommentJobPayload,
  opts?: JobsOptions
) => {
  logger.info({ payload }, "Enqueueing comment event");
  ensureQueues();
  const jobId =
    payload.webhookId || `comment-${payload.commentId}-${Date.now()}`;
  try {
    const job = await commentQueue!.add("comment-event", payload, {
      jobId,
      ...opts,
    });
    logger.info({ jobId: job.id }, "Comment event job enqueued");
    return job;
  } catch (error: any) {
    if (
      error.message?.includes("Job with id") &&
      error.message?.includes("already exists")
    ) {
      logger.info({ jobId }, "Comment job already exists, skipping");
      return null;
    }
    throw error;
  }
};

export const enqueueDm = async (payload: DmJobPayload, opts?: JobsOptions) => {
  ensureQueues();
  const jobId = payload.webhookId || `dm-${payload.commentId}-${Date.now()}`;
  try {
    const job = await dmQueue!.add("send-dm", payload, {
      jobId,
      ...opts,
    });
    logger.info({ jobId: job.id }, "DM job enqueued");
    return job;
  } catch (error: any) {
    if (
      error.message?.includes("Job with id") &&
      error.message?.includes("already exists")
    ) {
      logger.info({ jobId }, "DM job already exists, skipping");
      return null;
    }
    throw error;
  }
};


export const startWorkers = () => {
  try {
    logger.info("Starting workers...");
    ensureQueues();

    if (!commentWorker) {
      logger.info("Creating comment worker...");
      commentWorker = new Worker<CommentJobPayload>(
        "comments",
        runCommentProcessor,
        {
          connection: connection!,
          concurrency: 5, // Process up to 5 jobs concurrently
        }
      );

      // Event handlers
      commentWorker.on("completed", (job: Job) => {
        const duration =
          typeof job.finishedOn === "number" && typeof job.processedOn === "number"
            ? job.finishedOn - job.processedOn
            : undefined;

        logger.info(
          {
            jobId: job.id,
            ...(duration !== undefined ? { duration } : {}),
          },
          "Comment job completed"
        );
      });

      commentWorker.on("failed", (job: Job | undefined, err: Error) => {
        logger.error(
          {
            jobId: job?.id,
            attempts: job?.attemptsMade,
            err: err.message,
          },
          "Comment job failed"
        );
      });

      commentWorker.on("stalled", (jobId: string) => {
        logger.warn({ jobId }, "Comment job stalled");
      });

      commentWorker.on("ready", () => {
        logger.info("Comment worker ready");
      });

      commentWorker.on("error", (err: Error) => {
        logger.error({ err: err.message }, "Comment worker error");
      });
    }

    if (!dmWorker) {
      logger.info("Creating DM worker...");
      dmWorker = new Worker<DmJobPayload>("dms", runDmProcessor, {
        connection: connection!,
        concurrency: 3, // More conservative for API rate limits
      });

      // Event handlers
      dmWorker.on("completed", (job: Job) => {
        const duration =
          typeof job.finishedOn === "number" && typeof job.processedOn === "number"
            ? job.finishedOn - job.processedOn
            : undefined;

        logger.info(
          {
            jobId: job.id,
            ...(duration !== undefined ? { duration } : {}),
          },
          "DM job completed"
        );
      });

      dmWorker.on("failed", (job: Job | undefined, err: Error) => {
        logger.error(
          {
            jobId: job?.id,
            attempts: job?.attemptsMade,
            err: err.message,
          },
          "DM job failed"
        );
      });

      dmWorker.on("stalled", (jobId: string) => {
        logger.warn({ jobId }, "DM job stalled");
      });

      dmWorker.on("ready", () => {
        logger.info("DM worker ready");
      });

      dmWorker.on("error", (err: Error) => {
        logger.error({ err: err.message }, "DM worker error");
      });
    }

    logger.info("Workers started successfully");
  } catch (error) {
    logger.error({ error }, "Failed to start workers");
    throw error;
  }
};

export const startBullBoard = (app: FastifyInstance) => {
  ensureQueues();
  serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(commentQueue!), new BullMQAdapter(dmQueue!)],
    serverAdapter,
  });

  serverAdapter.setBasePath("/queues")
  app.register(serverAdapter.registerPlugin(),{
    prefix:"/queues"
  })
  logger.info("Bull Dashboard Setup at /queues")
};

// export const stopWorkers = async () => {
//   await commentWorker?.close();
//   await dmWorker?.close();
//   await commentQueue?.close();
//   await dmQueue?.close();
//   await connection?.quit();
//   commentWorker = null;
//   dmWorker = null;
//   commentQueue = null;
//   dmQueue = null;
//   connection = null;
// };

export const stopWorkers = async () => {
  logger.info("Stopping workers...");
  
  try {
    // Stop workers first
    if (commentWorker) {
      await commentWorker.close();
      commentWorker = null;
    }
    
    if (dmWorker) {
      await dmWorker.close();
      dmWorker = null;
    }

    // Close queues
    if (commentQueue) {
      await commentQueue.close();
      commentQueue = null;
    }
    
    if (dmQueue) {
      await dmQueue.close();
      dmQueue = null;
    }
// Redis Connection Closed
    if (connection) {
      await connection.quit();
      connection = null;
    }

    logger.info("Workers stopped successfully");
  } catch (error) {
    logger.error({ error }, "Error stopping workers");
    throw error;
  }
};


// Health Check for queues 

export const healthCheck = async ()=>{
  ensureQueues();
  const [commentStats, dmStats] = await Promise.all([

    commentQueue!.getJobCounts(),
    dmQueue!.getJobCounts()
  ])
return {
  comment:commentStats,
  dm: dmStats,
  redis:connection?.status || "disconnected"
}
}