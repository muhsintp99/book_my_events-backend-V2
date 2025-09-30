const admin = require("./config/firebase"); // your firebase-admin instance
const fetch = require("node-fetch"); // if not using Node 18+, install: npm install node-fetch

async function generateIdToken() {
  const uid = "test-user-123"; // dummy UID for testing

  try {
    // Generate a custom token
    const customToken = await admin.auth().createCustomToken(uid);
    console.log("Custom Token:", customToken);

    // Exchange custom token for ID token via Firebase REST API
    const apiKey = "AIzaSyBmD2QG47g3R1m0ry1OcE3y2XPXux2FPHo";
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    if (!res.ok) throw new Error(`Failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    console.log("✅ Use this ID Token in Postman:", data.idToken);
  } catch (err) {
    console.error("Error generating ID token:", err.message);
  }
}

generateIdToken();
