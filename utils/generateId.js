const User = require('../models/User');

const rolePrefixMap = {
  superadmin: 'ADM',
  admin: 'ADM',
  vendor: 'VEN',
  user: 'USE'
};

async function generateUserId(role) {
  const prefix = rolePrefixMap[role.toLowerCase()];
  if (!prefix) throw new Error(`Invalid role: ${role}`);

  const year = new Date().getFullYear();
  const maxAttempts = 10; // Increased retry limit

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a 6-digit random number for broader range
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const userId = `${prefix}${year}${randomNum}`;

    // Check if userId exists
    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      return userId;
    }

    // Exponential backoff to avoid rapid retries
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 50));
  }

  throw new Error('Failed to generate unique userId after multiple attempts');
}

module.exports = { generateUserId };