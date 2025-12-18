const router = require("express").Router();
const {
  sendMessage,
  getMessagesByEnquiry
} = require("../../controllers/chatController");

router.post("/", sendMessage);
router.get("/:enquiryId", getMessagesByEnquiry);

module.exports = router;
