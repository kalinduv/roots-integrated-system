const { db, usingFirebase } = require('./config/firebaseConfig');

async function testFirebase() {
  console.log('Using Firebase:', usingFirebase);
  console.log('DB initialized:', !!db);
  
  if (!usingFirebase || !db) {
    console.log('Firebase is disabled or not initialized.');
    return;
  }

  try {
    const testDoc = {
      test: true,
      timestamp: new Date()
    };
    console.log('Attempting to write test document to "test_connection" collection...');
    const docRef = await db.collection('test_connection').add(testDoc);
    console.log('SUCCESS! Document written with ID:', docRef.id);
    
    console.log('Attempting to read back...');
    const doc = await docRef.get();
    console.log('Read data:', doc.data());
    
    console.log('Attempting to delete test document...');
    await docRef.delete();
    console.log('Test complete.');
  } catch (error) {
    console.error('FIREBASE ERROR:', error);
    if (error.code === 'PERMISSION_DENIED') {
        console.log('HINT: Check your Firestore Security Rules if using Firebase in non-Admin mode (unlikely here) or check if the Project ID in .env matches the key.');
    }
  }
}

testFirebase();
