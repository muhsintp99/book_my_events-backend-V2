// const admin = require("firebase-admin");
// const serviceAccount = require("../config/serviceAccountKey.json"); 

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;

require("dotenv").config(); // Load .env

const requiredVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY"
];

const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error("❌ Missing Firebase environment variables:", missingVars);
  process.exit(1);
}

// Test if private key can be parsed correctly
try {
  const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

  console.log("✅ Firebase environment variables loaded successfully!");
  console.log("Project ID:", serviceAccount.projectId);
  console.log("Client Email:", serviceAccount.clientEmail);
  console.log("Private Key starts with:", serviceAccount.privateKey.slice(0, 30), "...");
} catch (err) {
  console.error("❌ Error parsing Firebase private key:", err);
}
