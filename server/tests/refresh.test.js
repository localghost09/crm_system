const request = require('supertest');
const app = require('../app');
const { User } = require('../models');

describe('Refresh Token Rotation', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Refresh User', email: 'refresh@test.com', password: 'Refresh@123', role: 'executive' });
  });

  it('issues new tokens on refresh', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@test.com', password: 'Refresh@123' });

    const refreshToken = login.body.data.refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.accessToken).not.toBe(login.body.data.accessToken);
  });

  it('rejects an unknown refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'fake-refresh-token' });

    expect(res.status).toBe(401);
  });

  it('rejects refresh without a token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('refresh tokens rotate: old token becomes invalid after use', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@test.com', password: 'Refresh@123' });

    const oldRefresh = login.body.data.refreshToken;

    // First refresh succeeds
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh });
    expect(first.status).toBe(200);
    const newRefresh = first.body.data.refreshToken;

    // Reusing the OLD refresh token must now fail (rotation)
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh });
    expect(reuse.status).toBe(401);

    // The NEW one still works
    const second = await request(app).post('/api/auth/refresh').send({ refreshToken: newRefresh });
    expect(second.status).toBe(200);
  });

  it('a rotated access token works on protected routes', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@test.com', password: 'Refresh@123' });

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refresh.body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('refresh@test.com');
  });
});
