const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect);

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Overdue']).withMessage('Invalid status'),
];

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskValidation, validate, taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;