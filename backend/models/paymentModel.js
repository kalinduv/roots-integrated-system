const { db } = require('../config/firebaseConfig');

const PAYMENTS_COLLECTION = 'payments';

const normalizePayment = (paymentData) => ({
  receiptNo: paymentData.receiptNo || '',
  studentId: paymentData.studentId || '',
  studentName: paymentData.studentName || '',
  courseNames: Array.isArray(paymentData.courseNames)
    ? paymentData.courseNames
    : paymentData.courseName
    ? [paymentData.courseName]
    : [],
  amountPaid: Number(paymentData.amountPaid || paymentData.amount || 0),
  date: paymentData.date || new Date().toISOString().split('T')[0],
  status: paymentData.status || 'Completed',
});

const getAllPayments = async () => {
  const snapshot = await db.collection(PAYMENTS_COLLECTION).orderBy('createdAt', 'desc').get();
  const payments = [];
  snapshot.forEach((doc) => {
    payments.push({ id: doc.id, ...doc.data() });
  });
  return payments;
};

const createPayment = async (paymentData) => {
  const newPayment = {
    ...normalizePayment(paymentData),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection(PAYMENTS_COLLECTION).add(newPayment);
  return { id: docRef.id, ...newPayment };
};

const getPaymentById = async (paymentId) => {
  const doc = await db.collection(PAYMENTS_COLLECTION).doc(paymentId).get();
  if (!doc.exists) throw new Error('Payment not found');
  return { id: doc.id, ...doc.data() };
};

const updatePayment = async (paymentId, paymentData) => {
  const updateData = {
    ...normalizePayment(paymentData),
    updatedAt: new Date(),
  };

  await db.collection(PAYMENTS_COLLECTION).doc(paymentId).update(updateData);
  return { id: paymentId, ...updateData };
};

const deletePayment = async (paymentId) => {
  await db.collection(PAYMENTS_COLLECTION).doc(paymentId).delete();
  return { success: true, message: 'Payment deleted successfully' };
};

module.exports = {
  getAllPayments,
  createPayment,
  getPaymentById,
  updatePayment,
  deletePayment,
};