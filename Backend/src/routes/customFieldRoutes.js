const express = require('express');
const router = express.Router();
const customFieldController = require('../controllers/customFieldController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', customFieldController.createCustomField);
router.get('/:module', customFieldController.getCustomFields);
router.put('/:id', customFieldController.updateCustomField);
router.delete('/:id', customFieldController.deleteCustomField);

module.exports = router;
