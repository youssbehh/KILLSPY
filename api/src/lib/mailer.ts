import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';

/**
 * Outgoing e-mail.
 *
 * Configured through SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM.
 * Without SMTP_HOST nothing is sent: the message is logged instead, which is what
 * local development and tests rely on.
 */

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

let transporter: Transporter | null = null;
if (SMTP_HOST) {
  const port = parseInt(SMTP_PORT ?? '587', 10);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export const isMailConfigured = (): boolean => transporter !== null;

export const sendMail = async (to: string, subject: string, text: string): Promise<void> => {
  if (!transporter) {
    // The body carries a one-time code: only print it outside production.
    if (process.env.NODE_ENV === 'production') {
      logger.warn({ to, subject }, 'mail not sent: SMTP is not configured');
    } else {
      logger.info({ to, subject, text }, 'mail (SMTP not configured, logged only)');
    }
    return;
  }
  await transporter.sendMail({ from: MAIL_FROM ?? 'KILLSPY <no-reply@killspy.local>', to, subject, text });
};
