import { useEffect, useState } from 'react';

/**
 * Client-side mirror of the API validators (api/src/validators/auth.ts and account.ts).
 * A rejected payload only comes back as "Données invalides.", so the forms check first.
 * Each check returns the key of the message to show (see ./strings.ts), or null when valid.
 */
export type RuleError = 'errUsername' | 'errEmail' | 'errPassword' | 'errPasswordMismatch' | 'errCode';

export const CODE_LENGTH = 8;

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Codes are upper-case letters and digits; drop anything pasted around them. */
export const normalizeCode = (code: string) =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);

export const checkUsername = (username: string): RuleError | null =>
  USERNAME_RE.test(username.trim()) ? null : 'errUsername';

export const checkEmail = (email: string): RuleError | null =>
  EMAIL_RE.test(normalizeEmail(email)) ? null : 'errEmail';

export const checkPassword = (password: string): RuleError | null =>
  password.length >= 8 &&
  password.length <= 72 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[@$!%*?&]/.test(password)
    ? null
    : 'errPassword';

export const checkNewPassword = (password: string, confirmation: string): RuleError | null =>
  checkPassword(password) ?? (password === confirmation ? null : 'errPasswordMismatch');

export const checkCode = (code: string): RuleError | null =>
  normalizeCode(code).length === CODE_LENGTH ? null : 'errCode';

/**
 * Seconds left before a code can be requested again. The auth endpoints are rate limited
 * (10 requests / 15 min per IP): the cooldown keeps a user from burning them by tapping "resend".
 */
export const useCooldown = (seconds = 30) => {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return { left, start: () => setLeft(seconds) };
};
