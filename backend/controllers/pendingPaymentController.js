const PendingPayment = require('../models/pendingPaymentModel');

exports.getAllPendingPayments = async (req, res) => {
  try {
    const pendingPayments = await PendingPayment.getAllPendingPayments();
    res.status(200).json(pendingPayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPendingPayment = async (req, res) => {
  try {
    const pendingPayment = await PendingPayment.createPendingPayment(req.body);
    res.status(201).json(pendingPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingPaymentById = async (req, res) => {
  try {
    const pendingPayment = await PendingPayment.getPendingPaymentById(req.params.id);
    res.status(200).json(pendingPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePendingPayment = async (req, res) => {
  try {
    const pendingPayment = await PendingPayment.updatePendingPayment(req.params.id, req.body);
    res.status(200).json(pendingPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePendingPayment = async (req, res) => {
  try {
    const result = await PendingPayment.deletePendingPayment(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
