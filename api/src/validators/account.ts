import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from './auth';
import { REPORT_REASONS } from '../services/social.service';

const id = z.coerce.number().int().positive();
const code = z.string().trim().min(6).max(12);

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code,
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({ code });

export const upgradeGuestSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  passwordCrea: passwordSchema,
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Deux caractères minimum.').max(20),
});

export const idParamSchema = z.object({ id });
export const userIdParamSchema = z.object({ userId: id });

export const friendRequestSchema = z
  .object({ username: usernameSchema.optional(), Username: usernameSchema.optional() })
  .refine((b) => b.username ?? b.Username, { message: 'Pseudo requis.' });

export const reportSchema = z.object({
  targetId: z.number().int().positive(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500).optional(),
});

export const banSchema = z.object({ banned: z.boolean() });

export const reportsQuerySchema = z.object({
  status: z.enum(['open', 'resolved']).default('open'),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Guild management ────────────────────────────────────────────────────────

export const updateGuildSchema = z
  .object({
    name: z.string().trim().min(3).max(24).optional(),
    description: z.string().trim().max(200).nullable().optional(),
    isOpen: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Aucune modification.' });

export const guildRoleSchema = z.object({ role: z.enum(['OFFICER', 'MEMBER']) });

export const guildInviteSchema = z.object({ username: usernameSchema });

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message vide.').max(500, 'Message trop long (500 caractères max).'),
});

/** Cursor pagination for chats: `before` = id of the oldest message already loaded. */
export const cursorQuerySchema = z.object({
  before: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const guildListQuerySchema = z.object({
  search: z.string().trim().max(24).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
