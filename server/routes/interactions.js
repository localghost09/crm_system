const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect);

const interactionValidation = [
  body('type').notEmpty().withMessage('Interaction type is required'),
  body('subject').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
];

router.get('/', interactionController.getInteractions);
router.post('/', interactionValidation, validate, interactionController.createInteraction);

module.exports = router;
