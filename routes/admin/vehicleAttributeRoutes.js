const express = require("express");
const router = express.Router();

// ⬇ USE YOUR CUSTOM UPLOAD MIDDLEWARE
const createUpload = require("../../middlewares/upload");

const uploadIcon = createUpload("attributes"); // Auto-creates folder

const {
  createAttribute,
  addValues,
  toggleStatus,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute
} = require("../../controllers/admin/vehicleattributesController");


// Create Attribute (title + module + icon)
router.post("/", uploadIcon.single("icon"), createAttribute);

// Add values to an attribute
router.post("/values/:id", addValues);

// Toggle active/inactive
router.patch("/toggle/:id", toggleStatus);

// Get all attributes
router.get("/", getAllAttributes);

// Get single attribute
router.get("/:id", getAttributeById);

// Update attribute (with icon optional)
router.put("/:id", uploadIcon.single("icon"), updateAttribute);

// Delete attribute
router.delete("/:id", deleteAttribute);

module.exports = router;
