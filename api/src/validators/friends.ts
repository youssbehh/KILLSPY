import { z } from 'zod';
import { usernameSchema } from './auth';

export const addFriendSchema = z.object({
  Username: usernameSchema,
});
