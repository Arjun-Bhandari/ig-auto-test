import { z } from "zod";

// Verification query params from Meta (hub.*)
export const webhookVerifyQuerySchema = z.object({
  "hub.mode": z.string().optional(),
  "hub.verify_token": z.string().optional(),
  "hub.challenge": z.string().optional(),
});

export type WebhookVerifyQuery = z.infer<typeof webhookVerifyQuerySchema>;

// Minimal Instagram webhook envelope shape. Be permissive to avoid rejects.
export const igWebhookBodySchema = z.object({
  object: z.string(),
  entry: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform((v) => String(v)),
        time: z.number().optional(),
        changes: z
          .array(
            z.object({
              field: z.string().optional(),
              value: z.record(z.string(), z.unknown()).optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
}).passthrough();

export type IgWebhookBody = z.infer<typeof igWebhookBodySchema>;


export const goLiveSchema = z.object({
    igUserId: z.string().min(1),
    fields: z.array(z.enum(["comments","messages","live_comments","mentions"])).default(["comments"]),
  });
  
  export type GoLiveBody = z.infer<typeof goLiveSchema>;