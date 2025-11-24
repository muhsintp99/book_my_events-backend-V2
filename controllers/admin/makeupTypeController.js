const MakeupType = require("../../models/admin/makeupTypeModel");

// Create Makeup Type
exports.createMakeupType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Type name is required"
      });
    }

    const existing = await MakeupType.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Makeup type already exists"
      });
    }

    const image = req.file ? req.file.filename : null;

    const created = await MakeupType.create({
      name: name.trim(),
      image
    });

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

    res.json({
      success: true,
      count: types.length,
      data: types
    });

  } catch (err) {
    console.error("Get Types Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Makeup Type
exports.updateMakeupType = async (req, res) => {
  try {
    const type = await MakeupType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: "Type not found"
      });
    }

    if (req.body.name) type.name = req.body.name.trim();
    if (req.body.isActive !== undefined) type.isActive = req.body.isActive;
    if (req.file) type.image = req.file.filename;

    await type.save();

    res.json({
      success: true,
      message: "Makeup type updated",
      data: type
    });

  } catch (err) {
    console.error("Update Type Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Makeup Type
exports.deleteMakeupType = async (req, res) => {
  try {
    const type = await MakeupType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: "Type not found"
      });
    }

    await type.deleteOne();

    res.json({
      success: true,
      message: "Makeup type deleted"
    });

  } catch (err) {
    console.error("Delete Type Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
