import { z } from "zod";

export const getAllMediaQuerySchema = z.object({
  igUserId: z.string().transform(val => BigInt(val)),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type GetAllMediaQuery = z.infer<typeof getAllMediaQuerySchema>;

export const igMediaChildSchema = z.object({
  id: z.string().optional(),
  media_url: z.string().url(),
});

export const igMediaItemSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  media_url: z.string().url(),
  media_type: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
  timestamp: z.string(),
  children: z
    .object({
      data: z.array(igMediaChildSchema),
    })
    .optional(),
});

export const igPagingSchema = z.object({
  cursors: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
    })
    .optional(),
  next: z.string().url().optional(),
  previous: z.string().url().optional(),
});

export const igMediaResponseSchema = z.object({
  data: z.array(igMediaItemSchema),
  paging: igPagingSchema.optional(),
});

export type IgMediaResponse = z.infer<typeof igMediaResponseSchema>;