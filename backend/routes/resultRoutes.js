
const express = require('express');
const { db } = require('../config/firebaseConfig');
const { sendResultEmail } = require('../utils/emailService');
const router = express.Router();
const COLLECTION = 'results';

const calculateResult = (mcqMarks, essayMarks) => {
  const total = (Number(mcqMarks) * 0.5) + (Number(essayMarks) * 0.5);
  let grade = 'F';
  if (total >= 75) grade = 'A';
  else if (total >= 65) grade = 'B';
  else if (total >= 50) grade = 'C';
  else if (total >= 35) grade = 'S';
  return { total, grade };
};

router.get('/', async (req, res) => {
  try {
    const { course, studentId, grade, dateFrom, dateTo } = req.query;
    let query = db.collection(COLLECTION);

    // Apply Firestore where-filters when query params are provided
    if (course && course !== 'All Courses') {
      query = query.where('course', '==', course);
    }
    if (studentId) {
      query = query.where('studentId', '==', studentId);
    }
    if (grade) {
      query = query.where('grade', '==', grade);
    }

    const snapshot = await query.get();
    let results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Date range filtering (done in JS since Firestore requires composite index for multi-field)
    if (dateFrom) {
      const from = new Date(dateFrom);
      results = results.filter(r => new Date(r.createdAt || 0) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      results = results.filter(r => new Date(r.createdAt || 0) <= to);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, studentName, course, mcqMarks, essayMarks } = req.body;
    const { total, grade } = calculateResult(mcqMarks, essayMarks);
    const payload = { 
      studentId, 
      studentName, 
      course, 
      mcqMarks: Number(mcqMarks), 
      essayMarks: Number(essayMarks), 
      total, 
      grade, 
      createdAt: new Date().toISOString() 
    };
    const docRef = await db.collection(COLLECTION).add(payload);

    // Send result email asynchronously — look up student email by id or studentId field
    (async () => {
      try {
        const snapshot = await db.collection('students').get();
        console.log(`Looking for student with ID: "${studentId}" among ${snapshot.docs.length} students`);

        const student = snapshot.docs
          .map(d => ({ docId: d.id, ...d.data() }))
          .find(s => {
            const sid = (s.id || s.studentId || '').trim();
            return sid === studentId.trim();
          });

        if (student) {
          console.log(`Found student: ${student.name}, email: ${student.email}`);
          if (student.email) {
            await sendResultEmail(student.email, studentName, { course, mcqMarks, essayMarks, total, grade });
            console.log(`Result email sent successfully to ${student.email}`);
          } else {
            console.warn(`Student ${studentId} found but has no email address.`);
          }
        } else {
          console.warn(`No student found with id/studentId: "${studentId}"`);
        }
      } catch (emailErr) {
        console.error('Failed to send result email:', emailErr.message);
      }
    })();

    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { studentId, studentName, course, mcqMarks, essayMarks } = req.body;
    const { total, grade } = calculateResult(mcqMarks, essayMarks);
    const payload = { 
      studentId, 
      studentName, 
      course, 
      mcqMarks: Number(mcqMarks), 
      essayMarks: Number(essayMarks), 
      total, 
      grade, 
      updatedAt: new Date().toISOString() 
    };
    await db.collection(COLLECTION).doc(req.params.id).set(payload, { merge: true });

    // Send update email asynchronously
    (async () => {
      try {
        const snapshot = await db.collection('students').get();
        const student = snapshot.docs
          .map(d => ({ docId: d.id, ...d.data() }))
          .find(s => {
            const sid = (s.id || s.studentId || '').trim();
            return sid === studentId.trim();
          });

        if (student && student.email) {
          await sendResultEmail(student.email, studentName, { course, mcqMarks, essayMarks, total, grade }, true);
          console.log(`Update email sent successfully to ${student.email}`);
        } else if (student) {
          console.warn(`Student ${studentId} found but has no email.`);
        } else {
          console.warn(`No student found with id: "${studentId}"`);
        }
      } catch (emailErr) {
        console.error('Failed to send update email:', emailErr.message);
      }
    })();

    res.json({ id: req.params.id, ...payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.collection(COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
