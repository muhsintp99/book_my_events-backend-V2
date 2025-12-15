const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/subscriptionController");

// PLAN ROUTES
router.get("/plan/module/:moduleId", controller.getPlansByModule);
// routes/subscription.js
router.post("/upgrade", controller.upgradePlan);
router.post("/plan", controller.createPlan);
router.get("/plan", controller.getPlans);
router.delete("/plan/:id", controller.deletePlan);
router.get("/plan/:id", controller.getSinglePlan);   
router.put("/plan/:id", controller.updatePlan);      
// USER SUBSCRIPTION ROUTES
router.post("/subscribe", controller.subscribeUser);
router.get("/status/:userId", controller.getUserSubscription);
router.put("/cancel/:subscriptionId", controller.cancelSubscription);

// ADMIN
router.get("/all", controller.getAllSubscriptions);
router.put("/update/:subscriptionId", controller.updateSubscription);

module.exports = router;
