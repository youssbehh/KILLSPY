import { z } from 'zod';

const idParam = z.coerce.number().int().positive();

export const guildIdParamSchema = z.object({ id: idParam });
export const userIdParamSchema = z.object({ userId: idParam });
export const missionIdParamSchema = z.object({ id: idParam });

export const guildSearchQuerySchema = z.object({
  search: z.string().trim().max(24).optional(),
});

export const createGuildSchema = z.object({
  name: z.string().trim().min(3, 'Le nom doit faire au moins 3 caractères.').max(24, 'Le nom doit faire au plus 24 caractères.'),
  tag: z.string().trim().min(2).max(5).regex(/^[a-zA-Z0-9]+$/, 'Tag : 2 à 5 caractères alphanumériques.'),
  description: z.string().trim().max(200).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message vide.').max(500, 'Message trop long (500 caractères max).'),
});
