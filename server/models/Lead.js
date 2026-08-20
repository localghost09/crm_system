const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    company: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Cold Call', 'Email', 'Other'],
      default: 'Website',
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estimatedValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastContacted: {
      type: Date,
    },
    nextFollowUp: {
      type: Date,
    },
    notes: [
      {
        text: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    convertedToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    convertedToOpportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ company: 1, name: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ source: 1 });
leadSchema.index({ priority: 1 });

leadSchema.virtual('interactions', {
  ref: 'Interaction',
  localField: '_id',
  foreignField: 'lead',
});

leadSchema.virtual('followups', {
  ref: 'FollowUp',
  localField: '_id',
  foreignField: 'lead',
});

module.exports = mongoose.model('Lead', leadSchema);