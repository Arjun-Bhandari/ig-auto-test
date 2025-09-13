import {z} from 'zod';

export const callbackBodySchema = z.object({
  code: z.string().min(1, "Instagram Code is Required")
});

export type CallbackBody = z.infer<typeof callbackBodySchema>;