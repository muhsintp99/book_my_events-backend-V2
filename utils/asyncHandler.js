/**
 * @desc    Wrapper for async route handlers to eliminate try-catch blocks
 * @usage   const { asyncHandler } = require('../utils/asyncHandler');
 *          exports.myController = asyncHandler(async (req, res, next) => { ... });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
