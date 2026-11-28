import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Le pseudo doit faire au moins 3 caractères.')
  .max(20, 'Le pseudo doit faire au plus 20 caractères.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et _ uniquement.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email invalide.');

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit faire au moins 8 caractères.')
  .max(72, 'Le mot de passe doit faire au plus 72 caractères.')
  .regex(/[a-z]/, 'Au moins une minuscule.')
  .regex(/[A-Z]/, 'Au moins une majuscule.')
  .regex(/\d/, 'Au moins un chiffre.')
  .regex(/[@$!%*?&]/, 'Au moins un caractère spécial (@$!%*?&).');

/** Version of the privacy notice shown in the app. Bump it when the text changes. */
export const TERMS_VERSION = '2026-11';

/** RGPD: an account is only created after an explicit "I accept". */
export const acceptTermsSchema = z.literal(true, { message: 'Tu dois accepter la politique de confidentialité.' });

export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  passwordCrea: passwordSchema,
  acceptTerms: acceptTermsSchema,
});

export const guestSchema = z.object({
  acceptTerms: acceptTermsSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifiant requis.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

export const logoutParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
});
