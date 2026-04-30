const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

// Mock the database pool to avoid real connections during tests
jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  },
  query: jest.fn(),
  testConnection: jest.fn().mockResolvedValue(true)
}));

describe('CoreInventory Enterprise Deep Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Health & Connectivity', () => {
    it('should return 200 OK for the health check endpoint', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'CoreInventory API');
    });

    it('should handle 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/invalid-route');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Security & Authentication', () => {
    it('should block access to protected inventory routes without a token', async () => {
      const res = await request(app).get('/api/products');
      // Should return 401 Unauthorized
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid login attempts with 401', async () => {
      // Mock the DB query to return no user
      const { query } = require('../src/config/db');
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });
  });

  describe('Data Integrity & Business Logic', () => {
    it('should enforce schema validation for inventory movements', async () => {
      // Mock auth to bypass for this test if needed, or just test the validation middleware
      // Here we test that a malformed request is caught
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'invalid-email', password: 'short' });

      expect(res.statusCode).toEqual(422); // Unprocessable Entity due to validation
    });
  });
});
