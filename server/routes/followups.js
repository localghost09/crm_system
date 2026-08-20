const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect);

const followUpValidation = [
  body('title').trim().notEmpty().withMessage('Follow-up title is required'),
  body('followUpDate').notEmpty().withMessage('Follow-up date is required').isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['Pending', 'Completed', 'Cancelled', 'Overdue']).withMessage('Invalid status'),
];

router.get('/', followUpController.getFollowUps);
router.get('/:id', followUpController.getFollowUp);
router.post('/', followUpValidation, validate, followUpController.createFollowUp);
router.patch('/:id', followUpController.updateFollowUp);
router.delete('/:id', followUpController.deleteFollowUp);

module.exports = router;