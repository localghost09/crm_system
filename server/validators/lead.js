const { body } = require('express-validator');

const createLeadValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Lead name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('source')
    .optional()
    .isIn(['Website', 'Referral', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Cold Call', 'Email', 'Other'])
    .withMessage('Invalid lead source'),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'])
    .withMessage('Invalid lead status'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated value must be a positive number'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID'),
];

const updateLeadValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('source')
    .optional()
    .isIn(['Website', 'Referral', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Cold Call', 'Email', 'Other'])
    .withMessage('Invalid lead source'),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'])
    .withMessage('Invalid lead status'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
];

module.exports = { createLeadValidation, updateLeadValidation };