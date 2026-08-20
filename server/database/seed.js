const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { User, Lead, Customer, Opportunity, Task, FollowUp, Interaction, Notification } = require('../models');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Customer.deleteMany({}),
      Opportunity.deleteMany({}),
      Task.deleteMany({}),
      FollowUp.deleteMany({}),
      Interaction.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Cleared existing data');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Management',
      title: 'System Administrator',
    });

    const manager = await User.create({
      name: 'Sales Manager',
      email: 'manager@crm.com',
      password: 'Manager@123',
      role: 'manager',
      department: 'Sales',
      title: 'Sales Manager',
    });

    const exec1 = await User.create({
      name: 'John Sales',
      email: 'john@crm.com',
      password: 'John@123',
      role: 'executive',
      department: 'Sales',
      title: 'Senior Sales Executive',
    });

    const exec2 = await User.create({
      name: 'Jane Sales',
      email: 'jane@crm.com',
      password: 'Jane@123',
      role: 'executive',
      department: 'Sales',
      title: 'Sales Executive',
    });

    console.log('Users created');

    // Create leads
    const lead1 = await Lead.create({
      name: 'Acme Corporation',
      company: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+1-555-0101',
      source: 'Website',
      industry: 'Technology',
      status: 'New',
      priority: 'High',
      estimatedValue: 50000,
      assignedTo: exec1._id,
      createdBy: admin._id,
      tags: ['tech', 'enterprise'],
    });

    const lead2 = await Lead.create({
      name: 'GlobalTech Solutions',
      company: 'GlobalTech',
      email: 'info@globaltech.com',
      phone: '+1-555-0102',
      source: 'LinkedIn',
      industry: 'Software',
      status: 'Contacted',
      priority: 'Medium',
      estimatedValue: 25000,
      assignedTo: exec1._id,
      createdBy: manager._id,
      tags: ['software', 'saas'],
    });

    const lead3 = await Lead.create({
      name: 'Smith Enterprises',
      company: 'Smith Inc',
      email: 'smith@enterprise.com',
      phone: '+1-555-0103',
      source: 'Referral',
      industry: 'Finance',
      status: 'Qualified',
      priority: 'Critical',
      estimatedValue: 100000,
      assignedTo: exec2._id,
      createdBy: manager._id,
      tags: ['finance', 'enterprise', 'hot'],
    });

    await Lead.create({
      name: 'Digital Innovations',
      company: 'DigiInno',
      email: 'hello@digiinnovations.com',
      source: 'Google Ads',
      industry: 'Marketing',
      status: 'New',
      priority: 'Low',
      estimatedValue: 15000,
      assignedTo: exec2._id,
      createdBy: exec2._id,
      tags: ['marketing'],
    });

    console.log('Leads created');

    // Create customers
    const cust1 = await Customer.create({
      name: 'TechCorp International',
      company: 'TechCorp',
      email: 'info@techcorp.com',
      phone: '+1-555-0201',
      address: { street: '123 Tech Street', city: 'San Francisco', state: 'CA', zipCode: '94105', country: 'USA' },
      industry: 'Technology',
      status: 'VIP',
      assignedTo: exec1._id,
      totalPurchases: 150000,
      lastPurchase: new Date('2026-07-15'),
      createdBy: admin._id,
      tags: ['vip', 'tech', 'long-term'],
    });

    const cust2 = await Customer.create({
      name: 'BizConsult Group',
      company: 'BizConsult',
      email: 'contact@bizconsult.com',
      phone: '+1-555-0202',
      industry: 'Consulting',
      status: 'Active',
      assignedTo: exec2._id,
      totalPurchases: 45000,
      lastPurchase: new Date('2026-06-20'),
      createdBy: manager._id,
      tags: ['consulting'],
    });

    console.log('Customers created');

    // Create opportunities
    const opp1 = await Opportunity.create({
      title: 'Enterprise Software Deal - TechCorp',
      customer: cust1._id,
      assignedTo: exec1._id,
      stage: 'Negotiation',
      expectedValue: 75000,
      probability: 70,
      expectedClosingDate: new Date('2026-09-30'),
      createdBy: exec1._id,
    });

    await Opportunity.create({
      title: 'Consulting Package - BizConsult',
      customer: cust2._id,
      assignedTo: exec2._id,
      stage: 'Proposal Sent',
      expectedValue: 30000,
      probability: 60,
      expectedClosingDate: new Date('2026-10-15'),
      createdBy: exec2._id,
    });

    await Opportunity.create({
      title: 'New Lead Opportunity - Acme',
      lead: lead1._id,
      assignedTo: exec1._id,
      stage: 'New Lead',
      expectedValue: 50000,
      probability: 20,
      expectedClosingDate: new Date('2026-12-31'),
      createdBy: exec1._id,
    });

    console.log('Opportunities created');

    // Create tasks
    await Task.create([
      { title: 'Send proposal to TechCorp', description: 'Prepare and send the enterprise software proposal', assignedTo: exec1._id, priority: 'High', dueDate: new Date('2026-08-25'), relatedTo: cust1._id, relatedModel: 'Customer', status: 'In Progress', createdBy: manager._id },
      { title: 'Follow up with Smith Enterprises', description: 'Call John Smith regarding the finance software', assignedTo: exec2._id, priority: 'Critical', dueDate: new Date('2026-08-22'), relatedTo: lead3._id, relatedModel: 'Lead', status: 'Pending', createdBy: manager._id },
      { title: 'Prepare quarterly report', description: 'Compile Q3 sales data for management review', assignedTo: exec1._id, priority: 'Medium', dueDate: new Date('2026-09-01'), status: 'Pending', createdBy: admin._id },
    ]);

    console.log('Tasks created');

    // Create follow ups
    await FollowUp.create([
      { title: 'Follow up on Acme proposal', description: 'Discuss the proposed solution with Acme decision makers', assignedTo: exec1._id, lead: lead1._id, followUpDate: new Date('2026-08-22T10:00:00'), status: 'Pending', createdBy: exec1._id },
      { title: 'Check in with BizConsult', description: 'Regular client check-in meeting', assignedTo: exec2._id, customer: cust2._id, followUpDate: new Date('2026-08-23T14:00:00'), status: 'Pending', createdBy: exec2._id },
    ]);

    console.log('Follow-ups created');

    // Create communications
    await Interaction.create([
      { type: 'Phone Call', subject: 'Initial Contact', description: 'Spoke with John at Acme Corp about their software needs', lead: lead1._id, performedBy: exec1._id },
      { type: 'Meeting', subject: 'Demo Presentation', description: 'Demonstrated the platform it to GlobalTech team. Very positive feedback.', lead: lead2._id, performedBy: exec1._id },
      { type: 'Email', subject: 'Proposal Sent', description: 'Sent detailed proposal for enterprise software package', customer: cust1._id, opportunity: opp1._id, performedBy: exec1._id },
    ]);

    console.log('Interactions created');

    // Create notifications
    await Notification.create([
      { user: exec1._id, type: 'lead_assigned', title: 'New Lead Assigned', message: 'Lead "Acme Corporation" has been assigned to you.', relatedTo: lead1._id, relatedModel: 'Lead' },
      { user: exec2._id, type: 'follow_up_reminder', title: 'Follow-up Reminder', message: 'Follow-up "Check in with BizConsult" is due tomorrow.', relatedTo: lead3._id, relatedModel: 'Lead' },
    ]);


    console.log('Notifications created');
    console.log('\n--- Database seeded successfully! ---');
    console.log('\nLogin Credentials:');
    console.log('  Admin:     admin@crm.com / Admin@123');
    console.log('  Manager:   manager@crm.com / Manager@123');    console.log('  Executive: john@crm.com / John@123');    console.log('  Executive: jane@crm.com / Jane@123'); 

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
