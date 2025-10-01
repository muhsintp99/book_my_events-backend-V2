// const admin = require("firebase-admin");
// const serviceAccount = require("../config/serviceAccountKey.json"); 

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;

const admin = require("firebase-admin");
require("dotenv").config(); // Load .env variables

// ✅ Validate required Firebase environment variables
const requiredVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY"
];

const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error("❌ Missing Firebase environment variables:", missingVars);
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(", ")}`);
}

// ✅ Prepare Firebase service account
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Replace escaped \n with real newlines
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

// ✅ Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    throw error;
  }
}

module.exports = admin;
