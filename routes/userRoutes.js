// const express = require('express');
// const router = express.Router();
// const {
//   getMe,
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
//   blockUser,
//   reactivateUser
// } = require('../controllers/userController');

// const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// router.get('/me', protect, getMe);

// router.get('/', protect, authorizeRoles('superadmin', 'admin'), getAllUsers);
// router.get('/:id', protect, authorizeRoles('superadmin', 'admin'), getUserById);
// router.put('/:id', protect, authorizeRoles('superadmin', 'admin'), updateUser);
// router.delete('/:id', protect, authorizeRoles('superadmin', 'admin'), deleteUser);
// router.patch('/:id/block', protect, authorizeRoles('superadmin', 'admin'), blockUser);
// router.patch('/:id/reactivate', protect, authorizeRoles('superadmin', 'admin'), reactivateUser);

// module.exports = router;

// ===============================================================================================
// NOTE: The above code is the old version with authentication and role-based access control.
// =================================================================================================


const express = require('express');
const router = express.Router();
const {
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  reactivateUser
} = require('../controllers/userController');

// ----------------------
// User routes (no auth)
// ----------------------
router.get('/me', getMe);
router.get('/', getAllUsers);                // Get all users
router.get('/:id', getUserById);             // Get user by ID
router.put('/:id', updateUser);              // Update user
router.delete('/:id', deleteUser);           // Delete user
router.patch('/:id/block', blockUser);       // Block user
router.patch('/:id/reactivate', reactivateUser); // Reactivate user

module.exports = router;
