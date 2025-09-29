import {z} from 'zod';

export const callbackBodySchema = z.object({
  code: z.string().min(1, "Instagram Code is Required")
});

export type CallbackBody = z.infer<typeof callbackBodySchema>;

export const getIgUserParamsSchema = z.object({
  igUserId: z.string().min(1, "Instagram User Id is Required")
});

export type GetIgUserParams = z.infer<typeof getIgUserParamsSchema>;