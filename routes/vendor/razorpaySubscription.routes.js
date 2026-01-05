const express = require("express");
const router = express.Router();

const {
  createSubscription,
  verifySubscription,
} = require("../../controllers/vendor/razorpaySubscription.controller");


router.post("/create", createSubscription);


router.post("/verify", verifySubscription);

module.exports = router;
