const PendingPayment = require('../models/pendingPaymentModel');
const { sendPendingPaymentEmail } = require('../utils/emailService');

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

exports.sendPendingPaymentEmail = async (req, res) => {
  console.log(`Manual pending payment email request received for payment docId: ${req.params.id}`);
  try {
    const pendingPayment = await PendingPayment.getPendingPaymentById(req.params.id);
    if (!pendingPayment) {
      console.log('Pending payment not found for manual trigger');
      return res.status(404).json({ error: 'Pending payment not found' });
    }

    // Find the student by studentId
    const { db } = require('../config/firebaseConfig');
    const snapshot = await db.collection('students').get();
    const student = snapshot.docs
      .map(d => ({ docId: d.id, ...d.data() }))
      .find(s => {
        const sid = (s.id || s.studentId || '').trim();
        return sid === pendingPayment.studentId.trim();
      });

    if (!student || !student.email) {
      console.log('Student or email not found for pending payment email trigger');
      return res.status(404).json({ error: 'Student or email not found' });
    }

    console.log(`Attempting to send pending payment email to: ${student.email}`);
    const result = await sendPendingPaymentEmail(student.email, student.name, {
      courseNames: pendingPayment.courseNames,
      dueAmount: pendingPayment.dueAmount,
      dueDate: pendingPayment.dueDate || pendingPayment.dueMonth
    });

    if (result.success) {
      console.log('Pending payment email sent successfully');
      res.status(200).json({ message: 'Pending payment reminder email sent successfully' });
    } else {
      console.log(`Failed to send pending payment email: ${result.error}`);
      res.status(500).json({ error: result.error || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Crash in sendPendingPaymentEmail:', error);
    res.status(500).json({ error: error.message });
  }
};
