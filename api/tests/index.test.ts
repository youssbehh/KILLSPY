import request from 'supertest';
import express from 'express';
import rootRouter from '../src/routes/index';

jest.mock('../authRoutes', () => require('express').Router());
jest.mock('../clientsRoutes', () => require('express').Router());
jest.mock('../loanRoutes', () => require('express').Router());
jest.mock('../repaymentsRoutes', () => require('express').Router());
jest.mock('../settingsRoutes', () => require('express').Router());

describe('Root Router', () => {
    let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use('/', rootRouter);
  });

  it('should handle /auth route', async () => {
    const res = await request(app).get('/auth');
    expect(res.status).not.toBe(404); // Vérifie que la route existe
  });

  it('should handle /clients route', async () => {
    const res = await request(app).get('/clients');
    expect(res.status).not.toBe(404);
  });

  it('should handle /loans route', async () => {
    const res = await request(app).get('/loans');
    expect(res.status).not.toBe(404);
  });

  it('should handle /repayments route', async () => {
    const res = await request(app).get('/repayments');
    expect(res.status).not.toBe(404);
  });

  it('should handle /settings route', async () => {
    const res = await request(app).get('/settings');
    expect(res.status).not.toBe(404);
  });
});
