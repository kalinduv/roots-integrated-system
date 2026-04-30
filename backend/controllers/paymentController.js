const Payment = require('../models/paymentModel');
const { sendPaymentEmail } = require('../utils/emailService');

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.getAllPayments();
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const payment = await Payment.createPayment(req.body);

    // Send payment email asynchronously — look up student email by studentId
    (async () => {
      try {
        const { db } = require('../config/firebaseConfig');
        const snapshot = await db.collection('students').get();
        console.log(`Looking for student with ID: "${req.body.studentId}" among ${snapshot.docs.length} students`);

        const student = snapshot.docs
          .map(d => ({ docId: d.id, ...d.data() }))
          .find(s => {
            const sid = (s.id || s.studentId || '').trim();
            return sid === req.body.studentId.trim();
          });

        if (student) {
          console.log(`Found student: ${student.name}, email: ${student.email}`);
          if (student.email) {
            await sendPaymentEmail(student.email, req.body.studentName, {
              courseNames: req.body.courseNames,
              amountPaid: req.body.amountPaid,
              receiptNo: req.body.receiptNo,
              date: req.body.date
            });
            console.log(`Payment email sent successfully to ${student.email}`);
          } else {
            console.warn(`Student ${req.body.studentId} found but has no email address.`);
          }
        } else {
          console.warn(`No student found with id/studentId: "${req.body.studentId}"`);
        }
      } catch (emailErr) {
        console.error('Failed to send payment email:', emailErr.message);
      }
    })();

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendPaymentEmail = async (req, res) => {
  console.log(`Manual payment email request received for payment docId: ${req.params.id}`);
  try {
    const payment = await Payment.getPaymentById(req.params.id);
    if (!payment) {
      console.log('Payment not found for manual trigger');
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Find the student by studentId
    const { db } = require('../config/firebaseConfig');
    const snapshot = await db.collection('students').get();
    const student = snapshot.docs
      .map(d => ({ docId: d.id, ...d.data() }))
      .find(s => {
        const sid = (s.id || s.studentId || '').trim();
        return sid === payment.studentId.trim();
      });

    if (!student || !student.email) {
      console.log('Student or email not found for payment email trigger');
      return res.status(404).json({ error: 'Student or email not found' });
    }

    console.log(`Attempting to send payment email to: ${student.email}`);
    const result = await sendPaymentEmail(student.email, student.name, {
      courseNames: payment.courseNames,
      amountPaid: payment.amountPaid,
      receiptNo: payment.receiptNo,
      date: payment.date
    });

    if (result.success) {
      console.log('Payment email sent successfully');
      res.status(200).json({ message: 'Payment confirmation email sent successfully' });
    } else {
      console.log(`Failed to send payment email: ${result.error}`);
      res.status(500).json({ error: result.error || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Crash in sendPaymentEmail:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.getPaymentById(req.params.id);
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.updatePayment(req.params.id, req.body);
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const result = await Payment.deletePayment(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
