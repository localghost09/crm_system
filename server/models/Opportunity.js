const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Opportunity title is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    stage: {
      type: String,
      enum: ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      default: 'New Lead',
    },
    expectedValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    expectedClosingDate: {
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
    lostReason: {
      type: String,
      trim: true,
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

opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ assignedTo: 1 });
opportunitySchema.index({ customer: 1 });
opportunitySchema.index({ lead: 1 });
opportunitySchema.index({ expectedClosingDate: 1 });
opportunitySchema.index({ createdAt: -1 });

opportunitySchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'relatedTo',
});

opportunitySchema.virtual('followups', {
  ref: 'FollowUp',
  localField: '_id',
  foreignField: 'opportunity',
});

module.exports = mongoose.model('Opportunity', opportunitySchema);