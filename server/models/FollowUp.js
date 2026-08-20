const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Follow-up title is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['Phone Call', 'Meeting', 'Email', 'Product Demo', 'Follow-up', 'Other'],
      default: 'Follow-up',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },
    followUpDate: {
      type: Date,
      required: [true, 'Follow-up date is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled', 'Overdue'],
      default: 'Pending',
    },
    completedAt: {
      type: Date,
    },
    notes: {
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
  }
);

followUpSchema.index({ assignedTo: 1 });
followUpSchema.index({ lead: 1 });
followUpSchema.index({ customer: 1 });
followUpSchema.index({ opportunity: 1 });
followUpSchema.index({ followUpDate: 1 });
followUpSchema.index({ status: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);