const request = require('supertest');
const jwt = require('jsonwebtoken');
const generateToken = require('../server/utils/generateToken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret';

const app = require('../server/index');

describe('API health', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('OK');
  });

  test('unknown API route returns 404 json', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('auth token helper', () => {
  test('generateToken signs a verifiable JWT', () => {
    const userId = 'test-user-id';
    const token = generateToken(userId);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(userId);
  });
});
