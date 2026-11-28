import rateLimit from 'express-rate-limit';

// Automated test runs hammer the same routes from one address: limits are off there.
const skip = () => process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip,
  message: { message: 'Trop de tentatives. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Session renewal: a device refreshes about every 15 minutes, players may share an IP. */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip,
  message: { message: 'Trop de tentatives. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
