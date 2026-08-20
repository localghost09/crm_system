const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const auditLogger = require('../middleware/auditLogger');

router.use(protect);

const customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('email').optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('status').optional().isIn(['Active', 'Inactive', 'Lead', 'Churned', 'VIP']).withMessage('Invalid status'),
];

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', customerValidation, validate, auditLogger('Customer created', 'Customer'), customerController.createCustomer);
router.patch('/:id', auditLogger('Customer updated', 'Customer'), customerController.updateCustomer);
router.delete('/:id', auditLogger('Customer deleted', 'Customer'), customerController.deleteCustomer);

module.exports = router;