const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryById,          // ✅ ADD THIS
  getEnquiriesByModule,
  getEnquiriesByProvider,
  getEnquiriesByUser,      // ✅ ADD THIS
  getAllEnquiries,
  getEnquiryMessages,
} = require("../../controllers/vendor/enquiryController");

// ...
router.get("/:enquiryId/messages", getEnquiryMessages);


// CREATE

router.get("/", getAllEnquiries);

router.post("/", createEnquiry);

// UPDATE
router.put("/:enquiryId", updateEnquiry);

// DELETE
router.delete("/:enquiryId", deleteEnquiry);

// GET BY MODULE
router.get("/module/:moduleId", getEnquiriesByModule);

// GET BY PROVIDER
router.get("/provider/:providerId", getEnquiriesByProvider);

// GET BY USER
router.get("/user/:userId", getEnquiriesByUser);

// GET SINGLE ENQUIRY (KEEP THIS LAST)
router.get("/:id", getEnquiryById);

module.exports = router;
