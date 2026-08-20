const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');
const { createLeadValidation, updateLeadValidation } = require('../validators/lead');
const validate = require('../middleware/validate');
const auditLogger = require('../middleware/auditLogger');

router.use(protect);

router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLead);
router.post('/', createLeadValidation, validate, auditLogger('Lead created', 'Lead'), leadController.createLead);
router.patch('/:id', updateLeadValidation, validate, auditLogger('Lead updated', 'Lead'), leadController.updateLead);
router.delete('/:id', auditLogger('Lead deleted', 'Lead'), leadController.deleteLead);
router.post('/:id/convert', auditLogger('Lead converted', 'Lead'), leadController.convertLead);
router.post('/:id/notes', leadController.addNote);
router.patch('/:id/tags', leadController.updateTags);

module.exports = router;