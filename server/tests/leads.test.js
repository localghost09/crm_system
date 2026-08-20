const request = require('supertest');
const app = require('../app');
const { User, Lead } = require('../models');

describe('Leads API', () => {
  let adminToken, execToken, managerToken;
  let admin, exec, manager;

  beforeEach(async () => {
    admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    exec = await User.create({ name: 'Exec', email: 'exec@test.com', password: 'Exec@123', role: 'executive' });
    manager = await User.create({ name: 'Mgr', email: 'mgr@test.com', password: 'Mgr@1234', role: 'manager' });

    adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@123' })).body.data.accessToken;
    execToken = (await request(app).post('/api/auth/login').send({ email: 'exec@test.com', password: 'Exec@123' })).body.data.accessToken;
    managerToken = (await request(app).post('/api/auth/login').send({ email: 'mgr@test.com', password: 'Mgr@1234' })).body.data.accessToken;
  });

  describe('POST /api/leads', () => {
    it('creates a lead', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Lead',
          email: 'lead@test.com',
          source: 'Website',
          estimatedValue: 5000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.lead.name).toBe('Test Lead');
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'x@test.com' });

      expect(res.status).toBe(400);
    });

    it('detects duplicate leads by email', async () => {
      await Lead.create({ name: 'First', email: 'dup@test.com', createdBy: admin._id });

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Second', email: 'dup@test.com' });

      expect(res.status).toBe(409);
      expect(res.body.data.duplicate).toBe(true);
    });

    it('detects duplicate leads by phone', async () => {
      await Lead.create({ name: 'First', phone: '555-1234', createdBy: admin._id });

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Second', phone: '555-1234' });

      expect(res.status).toBe(409);
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/leads').send({ name: 'X' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/leads', () => {
    it('lists leads with pagination', async () => {
      await Lead.create([
        { name: 'Alpha', email: 'a@test.com', createdBy: admin._id },
        { name: 'Beta', email: 'b@test.com', createdBy: admin._id },
        { name: 'Charlie', email: 'c@test.com', createdBy: admin._id },
      ]);

      const res = await request(app)
        .get('/api/leads?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it('searches leads', async () => {
      await Lead.create({ name: 'Acme Corp', email: 'acme@test.com', createdBy: admin._id });

      const res = await request(app)
        .get('/api/leads?search=acme')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].name).toBe('Acme Corp');
    });

    it('filters by status', async () => {
      await Lead.create([
        { name: 'Qual', status: 'Qualified', createdBy: admin._id },
        { name: 'New', status: 'New', createdBy: admin._id },
      ]);

      const res = await request(app)
        .get('/api/leads?status=Qualified')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].name).toBe('Qual');
    });
  });

  describe('Lead conversion', () => {
    it('converts qualified lead to customer and opportunity', async () => {
      const lead = await Lead.create({
        name: 'Conv Lead', email: 'conv@test.com', status: 'Qualified',
        estimatedValue: 20000, createdBy: admin._id,
      });

      const res = await request(app)
        .post(`/api/leads/${lead._id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.opportunity).toBeDefined();

      const updated = await Lead.findById(lead._id);
      expect(updated.status).toBe('Won');
      expect(updated.convertedToCustomer).toBeTruthy();
    });

    it('rejects conversion of non-qualified lead', async () => {
      const lead = await Lead.create({
        name: 'New Lead', email: 'nl@test.com', status: 'New', createdBy: admin._id,
      });

      const res = await request(app)
        .post(`/api/leads/${lead._id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
