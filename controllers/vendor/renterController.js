const Renter = require("../../models/vendor/Renter");

exports.createRenter = async (req, res) => {
  try {
    const data = req.body;
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.vehicleImages) data.vehicleImages = req.files.vehicleImages.map(f => f.path);

    const renter = await Renter.create(data);
    res.status(201).json({ success: true, data: renter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRenters = async (req, res) => {
  try {
    const renters = await Renter.find().populate("provider");
    res.status(200).json({ success: true, data: renters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRenter = async (req, res) => {
  try {
    const renter = await Renter.findById(req.params.id).populate("provider");
    if (!renter) return res.status(404).json({ success: false, message: "Renter not found" });
    res.status(200).json({ success: true, data: renter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRenter = async (req, res) => {
  try {
    const data = req.body;
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.vehicleImages) data.vehicleImages = req.files.vehicleImages.map(f => f.path);

    const renter = await Renter.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!renter) return res.status(404).json({ success: false, message: "Renter not found" });

    res.status(200).json({ success: true, data: renter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRenter = async (req, res) => {
  try {
    await Renter.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Renter deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleRenterStatus = async (req, res) => {
  try {
    const renter = await Renter.findById(req.params.id);
    if (!renter) return res.status(404).json({ success: false, message: "Renter not found" });

    renter.isActive = !renter.isActive;
    await renter.save();

    res.status(200).json({ success: true, data: renter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRenterCounts = async (req, res) => {
  try {
    const total = await Renter.countDocuments();
    const active = await Renter.countDocuments({ isActive: true });
    const inactive = await Renter.countDocuments({ isActive: false });

    res.status(200).json({ success: true, total, active, inactive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
