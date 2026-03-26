const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/admin/dashboardController");

router.get("/module-stats", dashboardController.getModuleStats);
router.get("/overall-stats", dashboardController.getOverallStats);

module.exports = router;
