
const express = require('express');
const { db } = require('../config/firebaseConfig');
const router = express.Router();
const COLLECTION = 'courses';

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    const courses = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses/by-names?names=CourseName1,CourseName2
// Returns only courses matching the provided names (for enrolled-course lookup)
router.get('/by-names', async (req, res) => {
  try {
    const namesParam = req.query.names || '';
    if (!namesParam.trim()) return res.json([]);
    const nameList = namesParam.split(',').map(n => n.trim()).filter(Boolean);
    if (nameList.length === 0) return res.json([]);

    // Firestore 'in' supports up to 30 items; split into batches if needed
    const BATCH_SIZE = 30;
    let results = [];
    for (let i = 0; i < nameList.length; i += BATCH_SIZE) {
      const batch = nameList.slice(i, i + BATCH_SIZE);
      const snap = await db.collection(COLLECTION).where('name', 'in', batch).get();
      snap.docs.forEach(doc => results.push({ docId: doc.id, ...doc.data() }));
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const docRef = await db.collection(COLLECTION).add(payload);
    res.status(201).json({ docId: docRef.id, ...payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body, updatedAt: new Date().toISOString() };
    await db.collection(COLLECTION).doc(req.params.id).set(payload, { merge: true });
    res.json({ docId: req.params.id, ...payload });
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
