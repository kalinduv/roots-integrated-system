const { db } = require('../config/firebaseConfig');

const COLLECTION = 'staff';

async function getAllStaff() {
  const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  const items = [];

  snapshot.forEach((doc) => {
    items.push({
      docId: doc.id,
      ...doc.data(),
    });
  });

  return items;
}

async function createStaff(data) {
  const newStaff = {
    id: data.id || '',
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    date: data.date || '',
    status: data.status !== undefined ? data.status : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection(COLLECTION).add(newStaff);

  return {
    docId: docRef.id,
    ...newStaff,
  };
}

async function getStaffById(docId) {
  const doc = await db.collection(COLLECTION).doc(docId).get();

  if (!doc.exists) {
    throw new Error('Staff not found');
  }

  return {
    docId: doc.id,
    ...doc.data(),
  };
}

async function updateStaff(docId, data) {
  const updateData = {
    id: data.id || '',
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    date: data.date || '',
    status: data.status !== undefined ? data.status : true,
    updatedAt: new Date(),
  };

  await db.collection(COLLECTION).doc(docId).update(updateData);

  return {
    docId,
    ...updateData,
  };
}

async function deleteStaff(docId) {
  await db.collection(COLLECTION).doc(docId).delete();
  return { success: true, message: 'Staff deleted successfully' };
}

module.exports = {
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};