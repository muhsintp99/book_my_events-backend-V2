// const admin = require("firebase-admin");
// const serviceAccount = require("../config/serviceAccountKey.json"); 

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;

const admin = require("firebase-admin");

// Ensure dotenv is loaded (in case not loaded in server.js yet)
require("dotenv").config();

// Validate all required Firebase environment variables
const requiredVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
};

// Check for missing variables
const missingVars = Object.keys(requiredVars).filter(key => !requiredVars[key]);

if (missingVars.length > 0) {
  console.error("❌ Missing Firebase environment variables:", missingVars);
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(", ")}`);
}

// Configure service account
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  throw error;
}

module.exports = admin;