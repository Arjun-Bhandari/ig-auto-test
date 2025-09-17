
import { z } from "zod";


export const createRuleSchema = z.object({
  igUserId: z.string().transform((v) => BigInt(v)), // BigInt for DB
  mediaId: z.string().min(1),
  templateId: z.string().min(1),
  rule: z.object({
    trigger: z.object({
      type: z.literal("comment_created"),
      mediaId: z.string().min(1),
      match: z
        .object({
          contains: z.array(z.string()).min(1).optional(),
          regex: z.string().optional(),
        })
        .optional(),
    }),
    actions: z.array(
      z.union([
        z.object({
          type: z.literal("comment_reply"),
          text: z.string().min(1),
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