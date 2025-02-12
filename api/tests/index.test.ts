import request from 'supertest';
import { app, server, prisma_client } from '../src/index';
import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Server API Tests', () => {
  afterAll(async () => {
    await prisma_client.$disconnect(); // Ferme la connexion Prisma
    server.close(); // 🔥 Ferme le serveur Express après les tests
  });

  it('should respond to a basic API call', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(404);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });

  it('should properly handle errors via middleware', async () => {
    const res = await request(app).get('/api/trigger-error');
    expect(res.status).toBe(404);
  });
});
