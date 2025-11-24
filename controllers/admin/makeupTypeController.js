const MakeupType = require("../../models/admin/makeupTypeModel");

// Create Makeup Type
exports.createMakeupType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Type name is required" });
    }

    const existing = await MakeupType.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Makeup type already exists" });
    }

    const created = await MakeupType.create({ name });

    res.status(201).json({
      success: true,
      message: "Makeup type created successfully",
      data: created
    });

  } catch (err) {
    console.error("Create Makeup Type Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Types
exports.getMakeupTypes = async (req, res) => {
  try {
    const types = await MakeupType.find().sort({ createdAt: -1 });
    res.json({ success: true, count: types.length, data: types });
  } catch (err) {
    console.error("Get Types Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update
exports.updateMakeupType = async (req, res) => {
  try {
    const type = await MakeupType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: "Type not found" });

    type.name = req.body.name || type.name;
    if (req.body.isActive !== undefined) type.isActive = req.body.isActive;

    await type.save();

    res.json({ success: true, message: "Type updated", data: type });
  } catch (err) {
    console.error("Update Type Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete
exports.deleteMakeupType = async (req, res) => {
  try {
    const type = await MakeupType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: "Type not found" });

    await type.deleteOne();
    res.json({ success: true, message: "Type deleted" });

  } catch (err) {
    console.error("Delete Type Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
