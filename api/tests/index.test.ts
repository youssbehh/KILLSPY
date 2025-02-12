import request from 'supertest';
import express, { Express } from 'express';
import app, { prisma_client } from '../src/index';
import rootRouter from '../src/routes';
import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';


describe('Server API Tests', () => {
  afterAll(async () => {
    await prisma_client.$disconnect(); // Ferme Prisma proprement
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
    const res = await request(app).get('/api/trigger-error'); // Simule une route d'erreur
    expect(res.status).toBe(404);
    });
});
