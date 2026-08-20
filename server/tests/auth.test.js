const request = require('supertest');
const app = require('../app');
const { User } = require('../models');

describe('Authentication API', () => {
  beforeEach(async () => {
    await User.create({
      name: 'Existing Admin',
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'admin',
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns JWT tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@test.com', password: 'Newuser@123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('new@test.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Dup', email: 'admin@test.com', password: 'Admin@123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Weak', email: 'weak@test.com', password: 'weak' });

      expect(res.status).toBe(400);
    });

    it('hashes password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Hash', email: 'hash@test.com', password: 'Hash@123' });

      const user = await User.findOne({ email: 'hash@test.com' }).select('+password');
      expect(user.password).not.toBe('Hash@123');
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'WrongPass1' });

      expect(res.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'Admin@123' });

      expect(res.status).toBe(401);
    });
  });

  describe('Protected routes', () => {
    it('GET /api/auth/me returns user with valid token', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('admin@test.com');
    });

    it('GET /api/auth/me rejects missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});
