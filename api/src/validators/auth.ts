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

export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  passwordCrea: passwordSchema,
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
