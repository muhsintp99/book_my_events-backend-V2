const VehicleAttribute = require("../../models/admin/VehicleAttribute");

// =============================
//  CREATE ATTRIBUTE
// =============================
exports.createAttribute = async (req, res) => {
  try {
    const { title, module } = req.body;

    if (!title || !module) {
      return res.status(400).json({
        success: false,
        message: "Title and Module are required"
      });
    }

    const icon = req.file ? req.file.filename : null;

    const newAttribute = await VehicleAttribute.create({
      title,
      module,
      icon,
      values: []
    });

    res.status(201).json({
      success: true,
      message: "Attribute created successfully",
      data: newAttribute
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// =============================
//  ADD VALUES (diesel, hybrid, electric)
// =============================
exports.addValues = async (req, res) => {
  try {
    const { id } = req.params;
    const { values } = req.body; // Array: ["diesel","hybrid","electric"]

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({
        success: false,
        message: "Values must be an array"
      });
    }

    const attribute = await VehicleAttribute.findById(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    // Avoid duplicate values
    const uniqueValues = values.filter((v) => !attribute.values.includes(v));

    attribute.values.push(...uniqueValues);
    await attribute.save();

    res.status(200).json({
      success: true,
      message: "Values added successfully",
      data: attribute
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// =============================
//  GET ALL ATTRIBUTES
// =============================
exports.getAllAttributes = async (req, res) => {
  try {
    const data = await VehicleAttribute.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// =============================
//  GET SINGLE ATTRIBUTE
// =============================
exports.getAttributeById = async (req, res) => {
  try {
    const data = await VehicleAttribute.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// =============================
//  UPDATE ATTRIBUTE
// =============================
exports.updateAttribute = async (req, res) => {
  try {
    const { title, module } = req.body;

    const updatedData = { title, module };

    if (req.file) {
      updatedData.icon = req.file.filename;
    }

    const updated = await VehicleAttribute.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.status(200).json({
      success: true,
      message: "Attribute updated successfully",
      data: updated
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// =============================
//  DELETE ATTRIBUTE
// =============================
exports.deleteAttribute = async (req, res) => {
  try {
    const deleted = await VehicleAttribute.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attribute deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// =============================
//  TOGGLE ACTIVE / INACTIVE
// =============================
exports.toggleStatus = async (req, res) => {
  try {
    const attribute = await VehicleAttribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    attribute.status = !attribute.status;
    await attribute.save();

    res.json({
      success: true,
      message: `Attribute is now ${attribute.status ? "Active" : "Inactive"}`,
      status: attribute.status,
      data: attribute
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
