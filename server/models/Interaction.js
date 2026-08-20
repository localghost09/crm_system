const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Phone Call', 'Email', 'Meeting', 'Note', 'Status Change', 'Deal Change', 'Assignment', 'Follow-up', 'Task', 'Conversion', 'Other'],
      required: [true, 'Interaction type is required'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
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
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

interactionSchema.index({ lead: 1 });
interactionSchema.index({ customer: 1 });
interactionSchema.index({ opportunity: 1 });
interactionSchema.index({ performedBy: 1 });
interactionSchema.index({ type: 1 });
interactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);