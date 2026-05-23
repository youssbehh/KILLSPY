import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isTest ? 'silent' : isDev ? 'debug' : 'info'),
  ...(isDev && !isTest && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
  redact: ['req.headers.authorization', 'password', 'Password', 'passwordCrea', '*.password', '*.Password'],
});
