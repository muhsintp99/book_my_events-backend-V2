const express = require("express");
const router = express.Router();

const cakeController = require("../../controllers/vendor/cakePackageController");

/* ================= CAKE PACKAGE ROUTES ================= */

// Create cake
router.post("/", cakeController.createCake);

// Get all cakes
router.get("/", cakeController.getAllCakes);

// Get single cake
router.get("/:id", cakeController.getCakeById);

// Update cake
router.put("/:id", cakeController.updateCake);

// Delete cake
router.delete("/:id", cakeController.deleteCake);

module.exports = router;
