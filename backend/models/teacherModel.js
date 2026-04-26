const { db } = require('../config/firebaseConfig');

const COLLECTION = 'teachers';

async function getAllTeachers() {
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

async function createTeacher(data) {
  const newTeacher = {
    id: data.id || '',
    name: data.name || '',
    courses: data.courses || '',
    phone: data.phone || '',
    email: data.email || '',
    date: data.date || '',
    status: data.status !== undefined ? data.status : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection(COLLECTION).add(newTeacher);

  return {
    docId: docRef.id,
    ...newTeacher,
  };
}

async function getTeacherById(docId) {
  const doc = await db.collection(COLLECTION).doc(docId).get();

  if (!doc.exists) {
    throw new Error('Teacher not found');
  }

  return {
    docId: doc.id,
    ...doc.data(),
  };
}

async function updateTeacher(docId, data) {
  const updateData = {
    id: data.id || '',
    name: data.name || '',
    courses: data.courses || '',
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

async function deleteTeacher(docId) {
  await db.collection(COLLECTION).doc(docId).delete();
  return { success: true, message: 'Teacher deleted successfully' };
}

module.exports = {
  getAllTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};