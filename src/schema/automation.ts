

import { z } from "zod";

// Automation Status Enum
export const AutomationStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);

// Create Automation Rule Schema
export const createRuleSchema = z.object({
  igUserId: z.string().transform((v) => BigInt(v)),
  mediaId: z.string().min(1),
  name: z.string().min(1),
  campaignType:z.string().min(1),
  rule: z.object({
    trigger: z.object({
      type: z.literal("comment_created"),
      mediaId: z.string().min(1),
      match: z
        .object({
          contains: z.array(z.string()).min(1).optional(),
          include: z.array(z.string()).min(1).optional(), // Client format
          regex: z.string().optional(),
        })
        .optional(),
    }),
    actions: z.array(
      z.union([
        z.object({
          type: z.literal("comment_reply"),
          text: z.string().min(1).optional(),
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
  status: AutomationStatusSchema.default("DRAFT"),
  isActive: z.boolean().default(false),
});

export type CreateAutomationBody = z.infer<typeof createRuleSchema>;

// List Automation Query Schema
export const listAutomationQuerySchema = z.object({
  igUserId: z.string().transform((v) => BigInt(v)),
});

export type ListAutomationQuery = z.infer<typeof listAutomationQuerySchema>;

// Update Automation Status Schema
export const updateAutomationStatusSchema = z.object({
  status: AutomationStatusSchema,
  isActive: z.boolean().optional(),
});

export type UpdateAutomationStatusBody = z.infer<typeof updateAutomationStatusSchema>;

// Get Automation by ID Schema
export const getAutomationParamsSchema = z.object({
  id: z.string().min(1),
});

export type GetAutomationParams = z.infer<typeof getAutomationParamsSchema>;

// Automation Execution Tracking Schema
export const updateExecutionSchema = z.object({
  id: z.string().min(1),
  lastExecutedAt: z.date().optional(),
  executionCount: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).optional(),
  lastErrorAt: z.date().optional(),
  lastErrorMessage: z.string().optional(),
});

export type UpdateExecutionBody = z.infer<typeof updateExecutionSchema>;

export const updateAutomationSchema = z.object({
  name: z.string().min(1).optional(),
  campaignType: z.string().min(1).optional(),
  rule: z.object({
    trigger: z.object({
      type: z.literal("comment_created"),
      mediaId: z.string().min(1),
      match: z
        .object({
          contains: z.array(z.string()).min(1).optional(),
          include: z.array(z.string()).min(1).optional(), // Client format
          regex: z.string().optional(),
        })
        .optional(),
    }),
    actions: z.array(
      z.union([
        z.object({
          type: z.literal("comment_reply"),
          text: z.string().min(1).optional(),
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
  }).optional(),
  status: AutomationStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAutomationBody = z.infer<typeof updateAutomationSchema>;