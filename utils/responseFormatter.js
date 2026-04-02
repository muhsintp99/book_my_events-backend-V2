// utils/responseFormatter.js

/**
 * Standard success response
 * @param {Response} res 
 * @param {any} data 
 * @param {string} message 
 * @param {number} statusCode 
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standard error response
 * @param {Response} res 
 * @param {string} message 
 * @param {number} statusCode 
 * @param {any} errors 
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard paginated response
 * @param {Response} res 
 * @param {any} data 
 * @param {object} pagination 
 * @param {string} message 
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
};

/**
 * Handle validation errors (common across "Requests")
 * @param {Response} res 
 * @param {any} errors 
 */
const validationError = (res, errors) => {
  return errorResponse(res, 'Validation Failed', 400, errors);
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationError
};

