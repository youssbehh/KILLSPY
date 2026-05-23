import { z } from 'zod';
import { usernameSchema } from './auth';

export const updateUsernameSchema = z.object({
  newUsername: usernameSchema,
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
