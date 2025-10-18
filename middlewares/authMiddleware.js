// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// exports.protect = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer '))
//       return res.status(401).json({ message: 'Not authorized, token missing' });

//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ message: 'User not found or deleted' });

//     req.user = user;
//     next();
//   } catch (err) {
//     console.error('Auth error:', err.message);
//     return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
//   }
// };

// exports.authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user) return res.status(401).json({ message: 'Not authorized' });
//     if (!roles.includes(req.user.role))
//       return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
//     next();
//   };
// };



const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log('Authorization Header:', authHeader); // Log header for debugging

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token); // Log token for debugging

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decoded); // Log decoded payload
    } catch (err) {
      console.error('Token verification error:', err.message);
      return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    console.log('User found:', user ? user : 'No user'); // Log user result

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or deleted' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, no user found' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};