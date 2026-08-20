const request = require('supertest');
const app = require('../app');
const { User, Lead, Customer, Opportunity, Task, FollowUp } = require('../models');

describe('Critical Business Workflows', () => {
  let token;
  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Sales Rep', email: 'rep@test.com', password: 'Rep@1234', role: 'executive' });
    token = (await request(app).post('/api/auth/login').send({ email: 'rep@test.com', password: 'Rep@1234' })).body.data.accessToken;
  });

  it('Workflow: Register → Login → Create Lead → Convert → Win → Revenue', async () => {
    // Create lead
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Enterprise Corp',
        email: 'enterprise@test.com',
        source: 'LinkedIn',
        status: 'Qualified',
        estimatedValue: 75000,
        assignedTo: user._id,
      });

    expect(leadRes.status).toBe(201);
    const leadId = leadRes.body.data.lead._id;

    // Convert lead
    const convertRes = await request(app)
      .post(`/api/leads/${leadId}/convert`)
      .set('Authorization', `Bearer ${token}`);

    expect(convertRes.status).toBe(201);
    const oppId = convertRes.body.data.opportunity._id;
    const custId = convertRes.body.data.customer._id;

    // Move through pipeline stages
    for (const stage of ['Contacted', 'Qualified', 'Proposal Sent', 'Negotiation']) {
      const res = await request(app)
        .patch(`/api/opportunities/${oppId}/stage`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stage });
      expect(res.status).toBe(200);
      expect(res.body.data.opportunity.stage).toBe(stage);
    }

    // Mark as Won
    const winRes = await request(app)
      .patch(`/api/opportunities/${oppId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stage: 'Won' });

    expect(winRes.status).toBe(200);
    expect(winRes.body.data.opportunity.stage).toBe('Won');
    expect(winRes.body.data.opportunity.probability).toBe(100);

    // Dashboard revenue reflects the win
    const dashRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(dashRes.body.data.kpi.revenue).toBe(75000);
    expect(dashRes.body.data.kpi.wonOpportunities).toBe(1);

    // Customer was created with proper linkage
    const cust = await Customer.findById(custId);
    expect(cust.name).toBe('Enterprise Corp');
    expect(cust.status).toBe('Active');
  });

  it('Workflow: Lead → Follow-up → Complete follow-up', async () => {
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Follow Co', email: 'f@test.com', assignedTo: user._id });

    const leadId = leadRes.body.data.lead._id;

    // Create follow-up
    const fuRes = await request(app)
      .post('/api/followups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Call back',
        lead: leadId,
        assignedTo: user._id,
        followUpDate: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(fuRes.status).toBe(201);
    const fuId = fuRes.body.data.followup._id;

    // Complete the follow-up
    const completeRes = await request(app)
      .patch(`/api/followups/${fuId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Completed' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.followup.status).toBe('Completed');
    expect(completeRes.body.data.followup.completedAt).toBeDefined();
  });

  it('Workflow: Task assigned → Completed with timestamp', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Send proposal',
        priority: 'High',
        assignedTo: user._id,
      });

    const taskId = taskRes.body.data.task._id;

    const completeRes = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Completed' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.task.status).toBe('Completed');
    expect(completeRes.body.data.task.completedAt).toBeDefined();
  });

  it('Workflow: Lost deal records revenue of 0 and retains metadata', async () => {
    const opp = await Opportunity.create({
      title: 'Lost Deal',
      expectedValue: 50000,
      stage: 'Negotiation',
      createdBy: user._id,
      assignedTo: user._id,
    });

    const res = await request(app)
      .patch(`/api/opportunities/${opp._id}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stage: 'Lost', lostReason: 'Budget constraints' });

    expect(res.status).toBe(200);
    expect(res.body.data.opportunity.stage).toBe('Lost');
    expect(res.body.data.opportunity.probability).toBe(0);

    const dash = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`);
    expect(dash.body.data.kpi.lostOpportunities).toBe(1);
    expect(dash.body.data.kpi.revenue).toBe(0);
  });
});
