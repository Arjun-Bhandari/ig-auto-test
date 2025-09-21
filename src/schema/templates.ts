
import { z } from "zod";

export const flowNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(["trigger", "comment_reply", "dm_message"]),
  label: z.string(),
  config: z.record(z.string(), z.unknown()),
});

export const flowEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const templateBodySchema = z.object({
  type: z.enum(["comment-reply", "comment-reply-dm"]),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["comment-reply", "comment-reply-dm"]),
  body: templateBodySchema,
});

export type CreateTemplateBody = z.infer<typeof createTemplateSchema>;

export const getTemplateParamsSchema = z.object({
  id:z.string().min(1),
})

export type GetTemplateParams = z.infer<typeof getTemplateParamsSchema>;