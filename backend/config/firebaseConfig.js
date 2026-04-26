const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
});

// Get Firestore database reference
const db = admin.firestore();

const usingFirebase = true;
module.exports = { admin, db, usingFirebase };
