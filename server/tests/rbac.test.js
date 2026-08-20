const request = require('supertest');
const app = require('../app');
const { User, Lead, Customer, Opportunity } = require('../models');

describe('Role-Based Access Control', () => {
  let admin, exec, manager;
  let adminToken, execToken, managerToken;

  beforeEach(async () => {
    admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    exec = await User.create({ name: 'Exec', email: 'exec@test.com', password: 'Exec@123', role: 'executive' });
    manager = await User.create({ name: 'Mgr', email: 'mgr@test.com', password: 'Mgr@1234', role: 'manager' });

    adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@123' })).body.data.accessToken;
    execToken = (await request(app).post('/api/auth/login').send({ email: 'exec@test.com', password: 'Exec@123' })).body.data.accessToken;
    managerToken = (await request(app).post('/api/auth/login').send({ email: 'mgr@test.com', password: 'Mgr@1234' })).body.data.accessToken;
  });

  describe('Admin-only routes', () => {
    it('admin can access /api/users', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('manager can view team roster (GET /api/users)', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(200);
    });

    it('manager cannot create users (POST /api/users)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Hack', email: 'hack@test.com', password: 'Hack@123' });
      expect(res.status).toBe(403);
    });

    it('executive cannot access /api/users', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${execToken}`);
      expect(res.status).toBe(403);
    });

    it('admin can access /api/audit', async () => {
      const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('manager cannot access /api/audit', async () => {
      const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Manager routes', () => {
    it('manager can access reports', async () => {
      const res = await request(app).get('/api/dashboard/performance').set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(200);
    });

    it('executive can access dashboard', async () => {
      const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${execToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Executive data scoping', () => {
    it('executive only sees their own leads', async () => {
      const theirLead = await Lead.create({ name: 'Theirs', email: 'theirs@test.com', assignedTo: exec._id, createdBy: exec._id });
      await Lead.create({ name: 'Others', email: 'others@test.com', assignedTo: manager._id, createdBy: manager._id });

      const res = await request(app).get('/api/leads').set('Authorization', `Bearer ${execToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].name).toBe('Theirs');
    });

    it('executive cannot update a lead not assigned to them', async () => {
      const otherLead = await Lead.create({ name: 'Other', email: 'o@test.com', assignedTo: manager._id, createdBy: manager._id });

      const res = await request(app)
        .patch(`/api/leads/${otherLead._id}`)
        .set('Authorization', `Bearer ${execToken}`)
        .send({ status: 'Won' });

      expect(res.status).toBe(403);
    });

    it('executive can update their own assigned lead', async () => {
      const myLead = await Lead.create({ name: 'Mine', email: 'm@test.com', assignedTo: exec._id, createdBy: exec._id });

      const res = await request(app)
        .patch(`/api/leads/${myLead._id}`)
        .set('Authorization', `Bearer ${execToken}`)
        .send({ status: 'Contacted' });

      expect(res.status).toBe(200);
      expect(res.body.data.lead.status).toBe('Contacted');
    });
  });

  describe('Admin user management', () => {
    it('admin can create users with roles', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Hire', email: 'hire@test.com', password: 'Hire@123', role: 'executive' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('executive');
    });

    it('admin can change user roles', async () => {
      const res = await request(app)
        .patch(`/api/users/${exec._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'manager' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('manager');
    });
  });
});
