const ChatMessage = require("../../models/chat/ChatMessage");

exports.sendMessage = async (req, res) => {
  const message = await ChatMessage.create(req.body);
  res.json({ success: true, data: message });
};

exports.getMessagesByEnquiry = async (req, res) => {
  const messages = await ChatMessage.find({
    enquiryId: req.params.enquiryId
  }).sort({ createdAt: 1 });

  res.json({ success: true, data: messages });
};
