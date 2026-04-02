const EventRequest = require("../../models/admin/eventRequestModel");

/**
 * @desc    Create a new Event Request (from website)
 * @route   POST /api/event-requests
 * @access  Public
 */
const createEventRequest = async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (Event Type, Date, Name, Mobile Number)",
      });
    }

    const newRequest = await EventRequest.create({
      eventType: Array.isArray(eventType) ? eventType : [eventType], // Handle both single and multiple selections
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

    res.status(201).json({
      success: true,
      message: "Event request submitted successfully! We will contact you soon.",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error creating event request:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting your request.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all event requests (Admin)
 * @route   GET /api/event-requests
 * @access  Private (Admin)
 */
const getAllEventRequests = async (req, res) => {
  try {
    const requests = await EventRequest.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching event requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Update event request status
 * @route   PATCH /api/event-requests/:id
 * @access  Private (Admin)
 */
const updateEventRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await EventRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Delete event request
 * @route   DELETE /api/event-requests/:id
 * @access  Private (Admin)
 */
const deleteEventRequest = async (req, res) => {
  try {
    const request = await EventRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createEventRequest,
  getAllEventRequests,
  updateEventRequestStatus,
  deleteEventRequest,
};
