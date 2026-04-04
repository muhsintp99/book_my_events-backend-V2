const EventRequest = require("../../models/admin/eventRequestModel");
const asyncHandler = require("../../utils/asyncHandler");
const { successResponse, errorResponse, validationError } = require("../../utils/responseFormatter");

/**
 * @desc    Create a new Event Request (from website)
 * @route   POST /api/event-requests
 * @access  Public
 */
const createEventRequest = asyncHandler(async (req, res) => {
  const {
    eventType,
    eventDate,
    guestCount,
    eventLocation,
    minBudget,
    maxBudget,
    fullName,
    mobileNumber,
    email,
    notes,
  } = req.body;

  if (!eventType || !eventDate || !fullName || !mobileNumber) {
    return validationError(res, "Please provide all required fields (Event Type, Date, Name, Mobile Number)");
  }

  const newRequest = await EventRequest.create({
    eventType: Array.isArray(eventType) ? eventType : [eventType],
    eventDate,
    guestCount,
    eventLocation,
    minBudget,
    maxBudget,
    fullName,
    mobileNumber,
    email,
    notes,
  });

  return successResponse(res, newRequest, "Event request submitted successfully! We will contact you soon.", 201);
});

/**
 * @desc    Get all event requests (Admin)
 * @route   GET /api/event-requests
 * @access  Private (Admin)
 */
const getAllEventRequests = asyncHandler(async (req, res) => {
  const requests = await EventRequest.find().sort({ createdAt: -1 });
  return successResponse(res, requests);
});

/**
 * @desc    Update event request status
 * @route   PATCH /api/event-requests/:id
 * @access  Private (Admin)
 */
const updateEventRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await EventRequest.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!request) {
    return errorResponse(res, "Request not found", 404);
  }

  return successResponse(res, request, "Status updated successfully");
});

/**
 * @desc    Delete event request
 * @route   DELETE /api/event-requests/:id
 * @access  Private (Admin)
 */
const deleteEventRequest = asyncHandler(async (req, res) => {
  const request = await EventRequest.findByIdAndDelete(req.params.id);

  if (!request) {
    return errorResponse(res, "Request not found", 404);
  }

  return successResponse(res, null, "Request deleted successfully");
});

module.exports = {
  createEventRequest,
  getAllEventRequests,
  updateEventRequestStatus,
  deleteEventRequest,
};

