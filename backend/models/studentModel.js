const fs = require('fs');
const path = require('path');
const { db, usingFirebase } = require('../config/firebaseConfig');

const STUDENTS_COLLECTION = 'students';
const studentsFile = path.join(__dirname, '../data/students.json');

const readJson = (filePath, fallback = []) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const getAllStudents = async () => {
  try {
    if (usingFirebase && db) {
      const snapshot = await db.collection(STUDENTS_COLLECTION).orderBy('createdAt', 'desc').get();
      const students = [];
      snapshot.forEach((doc) => {
        students.push({ docId: doc.id, ...doc.data() });
      });
      return students;
    }
  } catch (error) {
    console.error('Firebase error fetching students, falling back to JSON:', error.message);
  }

  const students = readJson(studentsFile);
  return students.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const createStudent = async (studentData) => {
  const newStudent = {
    ...studentData,
    status: studentData.status !== undefined ? studentData.status : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (usingFirebase && db) {
      const docRef = await db.collection(STUDENTS_COLLECTION).add({
        ...newStudent,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { docId: docRef.id, ...newStudent };
    }
  } catch (error) {
    console.error('Firebase error creating student, falling back to JSON:', error.message);
  }

  const students = readJson(studentsFile);
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const finalStudent = { docId, ...newStudent };
  students.push(finalStudent);
  writeJson(studentsFile, students);
  return finalStudent;
};

const getStudentById = async (studentDocId) => {
  try {
    if (usingFirebase && db) {
      const doc = await db.collection(STUDENTS_COLLECTION).doc(studentDocId).get();
      if (doc.exists) {
        return { docId: doc.id, ...doc.data() };
      }
    }
  } catch (error) {
    console.error('Firebase error fetching student by docId, falling back to JSON:', error.message);
  }

  const students = readJson(studentsFile);
  const student = students.find((s) => s.docId === studentDocId);
  if (!student) throw new Error('Student not found');
  return student;
};

const updateStudent = async (studentDocId, studentData) => {
  const updateData = {
    ...studentData,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (usingFirebase && db) {
      await db.collection(STUDENTS_COLLECTION).doc(studentDocId).update({
        ...updateData,
        updatedAt: new Date()
      });
      return { docId: studentDocId, ...updateData };
    }
  } catch (error) {
    console.error('Firebase error updating student, falling back to JSON:', error.message);
  }

  const students = readJson(studentsFile);
  const index = students.findIndex((s) => s.docId === studentDocId);
  if (index === -1) throw new Error('Student not found');

  students[index] = { ...students[index], ...updateData };
  writeJson(studentsFile, students);
  return students[index];
};

const deleteStudent = async (studentDocId) => {
  try {
    if (usingFirebase && db) {
      await db.collection(STUDENTS_COLLECTION).doc(studentDocId).delete();
      return { success: true, message: 'Student deleted successfully' };
    }
  } catch (error) {
    console.error('Firebase error deleting student, falling back to JSON:', error.message);
  }

  const students = readJson(studentsFile);
  const remaining = students.filter((s) => s.docId !== studentDocId);
  writeJson(studentsFile, remaining);
  return { success: true, message: 'Student deleted successfully' };
};

module.exports = {
  getAllStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
};