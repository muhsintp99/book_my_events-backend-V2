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
  const regex = new RegExp('^' + prefix + year);
  const count = await User.countDocuments({ userId: { $regex: regex } });
  const serial = String(count + 1).padStart(4, '0');
  return `${prefix}${year}${serial}`;
}

module.exports = { generateUserId };
