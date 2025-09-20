const Venue = require("../../models/vendor/Venue");

exports.createVenue = async (req, res) => {
  try {
    const data = req.body;

    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.create(data);
    res.status(201).json({ success: true, data: venue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVenues = async (req, res) => {
  try {
    const venues = await Venue.find()
      .populate("provider") // ✅ Populates full User details
      .lean();

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate("provider")
      .lean();

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: venue,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const data = req.body;
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    await Venue.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Venue deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleVenueStatus = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

    venue.isActive = !venue.isActive;
    await venue.save();

    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVenueCounts = async (req, res) => {
  try {
    const total = await Venue.countDocuments();
    const active = await Venue.countDocuments({ isActive: true });
    const inactive = await Venue.countDocuments({ isActive: false });

    res.status(200).json({ success: true, total, active, inactive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
