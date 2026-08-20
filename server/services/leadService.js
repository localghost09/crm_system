const { Lead } = require('../models');

class LeadService {
  async checkDuplicate({ email, phone, company, name }) {
    const conditions = [];
    if (email) conditions.push({ email: email.toLowerCase() });
    if (phone) conditions.push({ phone });
    if (company && name) conditions.push({ company, name });

    if (conditions.length === 0) return null;

    const existing = await Lead.findOne({
      isActive: true,
      $or: conditions,
    });

    return existing;
  }

  async getLeads(query, user, options = {}) {
    const { search, status, source, priority, assignedTo, page = 1, limit = 20, sort = '-createdAt' } = query;

    const filter = { isActive: true };

    if (options.role === 'executive') {
      filter.$or = [
        { assignedTo: user._id },
        { createdBy: user._id },
      ];
    }

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const total = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit, 10));

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10));

    return {
      leads,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages,
        hasNextPage: parseInt(page, 10) < totalPages,
        hasPrevPage: parseInt(page, 10) > 1,
      },
    };
  }

  async getLeadById(id) {
    return Lead.findById(id)
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('convertedToCustomer', 'name email company')
      .populate('convertedToOpportunity', 'title stage expectedValue');
  }

  async createLead(data, userId) {
    return Lead.create({ ...data, createdBy: userId });
  }

  async updateLead(id, data) {
    return Lead.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
  }

  async deleteLead(id) {
    return Lead.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async assignLead(id, userId) {
    return Lead.findByIdAndUpdate(id, { assignedTo: userId }, { new: true })
      .populate('assignedTo', 'name email');
  }
}

module.exports = new LeadService();