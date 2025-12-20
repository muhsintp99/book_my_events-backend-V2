const router = require("express").Router();
const controller = require("../../controllers/vendor/subscriptionRequest.controller");

router.post("/request", controller.createSubscriptionRequest);


module.exports = router;
