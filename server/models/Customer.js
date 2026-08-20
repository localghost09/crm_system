const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
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
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Lead', 'Churned', 'VIP'],
      default: 'Active',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchase: {
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
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Cold Call', 'Email', 'Other', 'Lead Conversion'],
      default: 'Lead Conversion',
    },
    leadSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
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

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ company: 1, name: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ createdAt: -1 });

customerSchema.virtual('opportunities', {
  ref: 'Opportunity',
  localField: '_id',
  foreignField: 'customer',
});

customerSchema.virtual('interactions', {
  ref: 'Interaction',
  localField: '_id',
  foreignField: 'customer',
});

customerSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'relatedTo',
});

customerSchema.virtual('followups', {
  ref: 'FollowUp',
  localField: '_id',
  foreignField: 'customer',
});

module.exports = mongoose.model('Customer', customerSchema);