const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const auditLogger = require('../middleware/auditLogger');

router.use(protect);

const opportunityValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('stage').optional().isIn(['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']).withMessage('Invalid stage'),
  body('expectedValue').optional().isFloat({ min: 0 }).withMessage('Value must be positive'),
  body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be 0-100'),
];

router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunity);
router.post('/', opportunityValidation, validate, auditLogger('Opportunity created', 'Opportunity'), opportunityController.createOpportunity);
router.patch('/:id/stage', opportunityController.updateStage);
router.patch('/:id', auditLogger('Opportunity updated', 'Opportunity'), opportunityController.updateOpportunity);
router.delete('/:id', auditLogger('Opportunity deleted', 'Opportunity'), opportunityController.deleteOpportunity);

module.exports = router;