const { db } = require('../config/firebaseConfig');

const PENDING_PAYMENTS_COLLECTION = 'pendingPayments';

const normalizePendingPayment = (pendingData) => ({
  studentId: pendingData.studentId || '',
  studentName: pendingData.studentName || '',
  courseNames: Array.isArray(pendingData.courseNames)
    ? pendingData.courseNames
    : pendingData.courseName
    ? [pendingData.courseName]
    : [],
  dueAmount: Number(pendingData.dueAmount || 0),
  dueMonth: pendingData.dueMonth || '',
  status: pendingData.status || 'Pending',
});

const getAllPendingPayments = async () => {
  const snapshot = await db
    .collection(PENDING_PAYMENTS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();

  const pendingPayments = [];
  snapshot.forEach((doc) => {
    pendingPayments.push({ id: doc.id, ...doc.data() });
  });

  return pendingPayments;
};

const createPendingPayment = async (pendingData) => {
  const newPendingPayment = {
    ...normalizePendingPayment(pendingData),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection(PENDING_PAYMENTS_COLLECTION).add(newPendingPayment);
  return { id: docRef.id, ...newPendingPayment };
};

const getPendingPaymentById = async (pendingId) => {
  const doc = await db.collection(PENDING_PAYMENTS_COLLECTION).doc(pendingId).get();
  if (!doc.exists) throw new Error('Pending payment not found');
  return { id: doc.id, ...doc.data() };
};

const updatePendingPayment = async (pendingId, pendingData) => {
  const updateData = {
    ...normalizePendingPayment(pendingData),
    updatedAt: new Date(),
  };

  await db.collection(PENDING_PAYMENTS_COLLECTION).doc(pendingId).update(updateData);
  return { id: pendingId, ...updateData };
};

const deletePendingPayment = async (pendingId) => {
  await db.collection(PENDING_PAYMENTS_COLLECTION).doc(pendingId).delete();
  return { success: true, message: 'Pending payment deleted successfully' };
};

module.exports = {
  getAllPendingPayments,
  createPendingPayment,
  getPendingPaymentById,
  updatePendingPayment,
  deletePendingPayment,
};