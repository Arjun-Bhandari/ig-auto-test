
import { z } from "zod";


export const createRuleSchema = z.object({
  igUserId: z.string().transform((v) => BigInt(v)), // BigInt for DB
  mediaId: z.string().min(1),
  name: z.string().min(1),
  templateId: z.string().min(1),
  rule: z.object({
    trigger: z.object({
      type: z.literal("comment_created"),
      mediaId: z.string().min(1),
      match: z
        .object({
          // Support both formats for backward compatibility
          contains: z.array(z.string()).min(1).optional(),
          include: z.array(z.string()).min(1).optional(), // Client format
          regex: z.string().optional(),
          // exclude: z.array(z.string()).min(1).optional(), // Commented out as requested
        })
        .optional(),
    }),
    actions: z.array(
      z.union([
        z.object({
          type: z.literal("comment_reply"),
          text: z.string().min(1),
          // Support client-side fields
          responses: z.array(z.string()).optional(),
          randomize: z.boolean().optional(),
        }),
        z.object({
          type: z.literal("send_dm"),
          text: z.string().min(1),
          buttons: z
            .array(
              z.object({
                type: z.literal("url"),
                label: z.string().min(1),
                url: z.string().url(),
              })
            )
            .optional(),
        }),
      ])
    ),
  }),
});

export type CreateAutomationBody = z.infer<typeof createRuleSchema>;

export const listAutomationQuerySchema = z.object({
  igUserId:z.string().transform((v) => BigInt(v)),
});

export type ListAutomationQuery = z.infer<typeof listAutomationQuerySchema>;