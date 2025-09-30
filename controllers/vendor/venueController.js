// const Venue = require("../../models/vendor/Venue");

// exports.createVenue = async (req, res) => {
//   try {
//     const data = req.body;

//     if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
//     if (req.files?.images) data.images = req.files.images.map(f => f.path);

//     const venue = await Venue.create(data);
//     res.status(201).json({ success: true, data: venue });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // exports.createVenue = async (req, res) => {
// //   try {
// //     const data = req.body;

// //     data.provider = req.user._id; // assuming `req.user` is populated by your auth middleware

// //     if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
// //     if (req.files?.images) data.images = req.files.images.map(f => f.path);

// //     const venue = await Venue.create(data);
// //     res.status(201).json({ success: true, data: venue });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// exports.getVenues = async (req, res) => {
//   try {
//     const venues = await Venue.find()
//       .populate("provider") // ✅ Populates full User details
//       .lean();

//     res.status(200).json({
//       success: true,
//       count: venues.length,
//       data: venues,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // exports.getVenues = async (req, res) => {
// //   try {
// //     const venues = await Venue.find({ provider: req.user._id }) // ✅ Filter by logged-in user
// //       .populate("provider")
// //       .lean();

// //     res.status(200).json({
// //       success: true,
// //       count: venues.length,
// //       data: venues,
// //     });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// exports.getVenue = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id)
//       .populate("provider")
//       .lean();

//     if (!venue) {
//       return res.status(404).json({
//         success: false,
//         message: "Venue not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: venue,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



// // Admin/vendor creates venue for a specific provider by ID
// exports.createVenueForProvider = async (req, res) => {
//   try {
//     const data = req.body;
//     data.provider = req.params.providerId;

//     if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
//     if (req.files?.images) data.images = req.files.images.map(f => f.path);

//     const venue = await Venue.create(data);
//     await venue.populate("provider");

//     res.status(201).json({ success: true, data: venue });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// exports.updateVenue = async (req, res) => {
//   try {
//     const data = req.body;
//     if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
//     if (req.files?.images) data.images = req.files.images.map(f => f.path);

//     const venue = await Venue.findByIdAndUpdate(req.params.id, data, {
//       new: true,
//       runValidators: true,
//     });
//     if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// exports.deleteVenue = async (req, res) => {
//   try {
//     await Venue.findByIdAndDelete(req.params.id);
//     res.status(200).json({ success: true, message: "Venue deleted" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.toggleVenueStatus = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id);
//     if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

//     venue.isActive = !venue.isActive;
//     await venue.save();

//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getVenueCounts = async (req, res) => {
//   try {
//     const total = await Venue.countDocuments();
//     const active = await Venue.countDocuments({ isActive: true });
//     const inactive = await Venue.countDocuments({ isActive: false });

//     res.status(200).json({ success: true, total, active, inactive });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
const Venue = require("../../models/vendor/Venue");

// ================= CREATE =================
exports.createVenue = async (req, res) => {
  try {
    const data = req.body;

    // Require provider from authenticated user
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    data.provider = req.user._id; // Set provider from authenticated user

    // Handle uploaded files
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.create(data);
    await venue.populate("provider");

    res.status(201).json({ success: true, data: venue });
  } catch (err) {
    console.error(`Error creating venue: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin creates venue for a specific provider by ID
exports.createVenueForProvider = async (req, res) => {
  try {
    const data = req.body;
    data.provider = req.params.providerId;

    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.create(data);
    await venue.populate("provider");

    res.status(201).json({ success: true, data: venue });
  } catch (err) {
    console.error(`Error creating venue for provider: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= READ =================
exports.getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().populate("provider").lean();
    res.status(200).json({ success: true, count: venues.length, data: venues });
  } catch (err) {
    console.error(`Error fetching venues: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVenuesByProvider = async (req, res) => {
  try {
    const venues = await Venue.find({ provider: req.params.providerId })
      .populate("provider")
      .lean();
    res.status(200).json({ success: true, count: venues.length, data: venues });
  } catch (err) {
    console.error(`Error fetching venues by provider: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVenuesByProviderInternal = async (providerId) => {
  const venues = await Venue.find({ provider: providerId }).populate("provider").lean();
  return venues;
};

exports.getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate("provider")
      .lean();

    if (!venue)
      return res.status(404).json({ success: false, message: "Venue not found" });

    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    console.error(`Error fetching venue: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= UPDATE =================
exports.updateVenue = async (req, res) => {
  try {
    const data = req.body;
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).populate("provider");

    if (!venue)
      return res.status(404).json({ success: false, message: "Venue not found" });

    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    console.error(`Error updating venue: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= DELETE =================
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

    res.status(200).json({ success: true, message: "Venue deleted" });
  } catch (err) {
    console.error(`Error deleting venue: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleVenueStatus = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

    venue.isActive = !venue.isActive;
    await venue.save();

    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    console.error(`Error toggling venue status: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= COUNTS =================
exports.getVenueCounts = async (req, res) => {
  try {
    const total = await Venue.countDocuments();
    const active = await Venue.countDocuments({ isActive: true });
    const inactive = await Venue.countDocuments({ isActive: false });

    res.status(200).json({ success: true, total, active, inactive });
  } catch (err) {
    console.error(`Error fetching venue counts: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};