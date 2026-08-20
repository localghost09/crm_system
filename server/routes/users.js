const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Viewing the team roster: admins and managers
router.get('/', authorize('admin', 'manager'), userController.getUsers);
router.get('/:id', authorize('admin', 'manager'), userController.getUser);

// Managing users (create / update roles / delete): admins only
router.use(authorize('admin'));
router.post('/', userController.createUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;