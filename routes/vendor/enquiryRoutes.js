const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryById,          // ✅ ADD THIS
  getEnquiriesByModule,
  getEnquiriesByProvider,
    getAllEnquiries,

} = require("../../controllers/vendor/enquiryController");

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

// GET SINGLE ENQUIRY (KEEP THIS LAST)
router.get("/:id", getEnquiryById);

module.exports = router;
