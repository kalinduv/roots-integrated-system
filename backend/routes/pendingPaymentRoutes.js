const express = require('express');
const router = express.Router();
const pendingPaymentController = require('../controllers/pendingPaymentController');

router.get('/', pendingPaymentController.getAllPendingPayments);
router.post('/', pendingPaymentController.createPendingPayment);
router.get('/:id', pendingPaymentController.getPendingPaymentById);
router.put('/:id', pendingPaymentController.updatePendingPayment);
router.delete('/:id', pendingPaymentController.deletePendingPayment);

module.exports = router;
