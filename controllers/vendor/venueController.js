// const Venue = require("../../models/vendor/Venue");

// // ================= CREATE =================
// exports.createVenue = async (req, res) => {
//   try {
//     const data = req.body;

//     // Require provider from authenticated user
//     if (!req.user?._id) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required",
//       });
//     }
//     data.provider = req.user._id;

//     // Convert file paths to relative URLs
//     if (req.files?.thumbnail) {
//       const relativePath = req.files.thumbnail[0].path.replace(/\\/g, '/').split('Uploads/')[1];
//       data.thumbnail = `/uploads/${relativePath}`;
//     }
//     if (req.files?.images) {
//       data.images = req.files.images.map(f => {
//         const relativePath = f.path.replace(/\\/g, '/').split('Uploads/')[1];
//         return `/uploads/${relativePath}`;
//       });
//     }

//     const venue = await Venue.create(data);
//     await venue.populate("provider");

//     res.status(201).json({ success: true, data: venue });
//   } catch (err) {
//     console.error(`Error creating venue: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Admin creates venue for a specific provider by ID
// exports.createVenueForProvider = async (req, res) => {
//   try {
//     const data = req.body;
//     data.provider = req.params.providerId;

//     // Convert file paths to relative URLs
//     if (req.files?.thumbnail) {
//       const relativePath = req.files.thumbnail[0].path.replace(/\\/g, '/').split('Uploads/')[1];
//       data.thumbnail = `/uploads/${relativePath}`;
//     }
//     if (req.files?.images) {
//       data.images = req.files.images.map(f => {
//         const relativePath = f.path.replace(/\\/g, '/').split('Uploads/')[1];
//         return `/uploads/${relativePath}`;
//       });
//     }

//     const venue = await Venue.create(data);
//     await venue.populate("provider");

//     res.status(201).json({ success: true, data: venue });
//   } catch (err) {
//     console.error(`Error creating venue for provider: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ================= READ =================
// exports.getVenues = async (req, res) => {
//   try {
//     const venues = await Venue.find().populate("provider").lean();
//     res.status(200).json({ success: true, count: venues.length, data: venues });
//   } catch (err) {
//     console.error(`Error fetching venues: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // --- Get venues by provider ID ---
// exports.getVenuesByProvider = async (req, res) => {
//   try {
//     const providerId = req.params.providerId;
//     if (!providerId) {
//       return res.status(400).json({ success: false, message: "Provider ID is required" });
//     }

//     const venues = await Venue.find({ provider: providerId }).populate("provider").lean();
//     res.status(200).json({ success: true, count: venues.length, data: venues });
//   } catch (err) {
//     console.error(`Error fetching venues by provider: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Internal function to get venues by provider (used in other services)
// exports.getVenuesByProviderInternal = async (providerId) => {
//   const venues = await Venue.find({ provider: providerId }).populate("provider").lean();
//   return venues;
// };

// // Get single venue by ID
// exports.getVenue = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id).populate("provider").lean();

//     if (!venue)
//       return res.status(404).json({ success: false, message: "Venue not found" });

//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     console.error(`Error fetching venue: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ================= UPDATE =================
// exports.updateVenue = async (req, res) => {
//   try {
//     const data = req.body;

//     if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
//     if (req.files?.images) data.images = req.files.images.map(f => f.path);

//     const venue = await Venue.findByIdAndUpdate(req.params.id, data, {
//       new: true,
//       runValidators: true,
//     }).populate("provider");

//     if (!venue)
//       return res.status(404).json({ success: false, message: "Venue not found" });

//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     console.error(`Error updating venue: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ================= DELETE =================
// exports.deleteVenue = async (req, res) => {
//   try {
//     const venue = await Venue.findByIdAndDelete(req.params.id);
//     if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

//     res.status(200).json({ success: true, message: "Venue deleted" });
//   } catch (err) {
//     console.error(`Error deleting venue: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ================= TOGGLE STATUS =================
// exports.toggleVenueStatus = async (req, res) => {
//   try {
//     const venue = await Venue.findById(req.params.id);
//     if (!venue) return res.status(404).json({ success: false, message: "Venue not found" });

//     venue.isActive = !venue.isActive;
//     await venue.save();

//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     console.error(`Error toggling venue status: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ================= COUNTS =================
// exports.getVenueCounts = async (req, res) => {
//   try {
//     const total = await Venue.countDocuments();
//     const active = await Venue.countDocuments({ isActive: true });
//     const inactive = await Venue.countDocuments({ isActive: false });

//     res.status(200).json({ success: true, total, active, inactive });
//   } catch (err) {
//     console.error(`Error fetching venue counts: ${err.message}`);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
// const mongoose = require('mongoose');
// const Venue = require('../../models/vendor/Venue');

// exports.createVenue = async (req, res) => {
//   try {
//     const data = req.body;
//     // Ensure searchTags is an array
//     if (data.searchTags && !Array.isArray(data.searchTags)) {
//       data.searchTags = [data.searchTags];
//     }
//     // Handle provider
//     if (!data.provider) {
//       data.provider = null; // Set to null for optional provider
//     }
//     // Handle file uploads
//     if (req.files?.thumbnail) {
//       data.thumbnail = req.files.thumbnail[0].path;
//     }
//     if (req.files?.images) {
//       data.images = req.files.images.map(f => f.path);
//     }
//     const venue = await Venue.create(data);
//     res.status(201).json({ success: true, data: venue });
//   } catch (err) {
//     console.error('Error in createVenue:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to create venue' });
//   }
// };

// exports.getVenues = async (req, res) => {
//   try {
//     const venues = await Venue.find()
//       .populate('provider')
//       .lean();
//     res.status(200).json({
//       success: true,
//       count: venues.length,
//       data: venues,
//     });
//   } catch (err) {
//     console.error('Error in getVenues:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to fetch venues' });
//   }
// };

// exports.getVenue = async (req, res) => {
//   try {
//     const venueId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(venueId)) {
//       return res.status(400).json({ success: false, message: 'Invalid venue ID' });
//     }
//     const venue = await Venue.findById(venueId)
//       .populate('provider')
//       .lean();
//     if (!venue) {
//       return res.status(404).json({ success: false, message: 'Venue not found' });
//     }
//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     console.error('Error in getVenue:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to fetch venue' });
//   }
// };

// exports.updateVenue = async (req, res) => {
//   try {
//     const venueId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(venueId)) {
//       return res.status(400).json({ success: false, message: 'Invalid venue ID' });
//     }
//     const data = req.body;
//     if (data.searchTags && !Array.isArray(data.searchTags)) {
//       data.searchTags = [data.searchTags];
//     }
//     if (req.files?.thumbnail) {
//       data.thumbnail = req.files.thumbnail[0].path;
//     }
//     if (req.files?.images) {
//       data.images = req.files.images.map(f => f.path);
//     }
//     const venue = await Venue.findByIdAndUpdate(venueId, data, {
//       new: true,
//       runValidators: true,
//     });
//     if (!venue) {
//       return res.status(404).json({ success: false, message: 'Venue not found' });
//     }
//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     console.error('Error in updateVenue:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to update venue' });
//   }
// };

// exports.deleteVenue = async (req, res) => {
//   try {
//     const venueId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(venueId)) {
//       return res.status(400).json({ success: false, message: 'Invalid venue ID' });
//     }
//     const venue = await Venue.findByIdAndDelete(venueId);
//     if (!venue) {
//       return res.status(404).json({ success: false, message: 'Venue not found' });
//     }
//     res.status(200).json({ success: true, message: 'Venue deleted successfully' });
//   } catch (err) {
//     console.error('Error in deleteVenue:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to delete venue' });
//   }
// };

// exports.toggleVenueStatus = async (req, res) => {
//   try {
//     const venueId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(venueId)) {
//       return res.status(400).json({ success: false, message: 'Invalid venue ID' });
//     }
//     const venue = await Venue.findById(venueId);
//     if (!venue) {
//       return res.status(404).json({ success: false, message: 'Venue not found' });
//     }
//     venue.isActive = !venue.isActive;
//     await venue.save();
//     res.status(200).json({ success: true, data: venue });
//   } catch (err) {
//     console.error('Error in toggleVenueStatus:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to toggle venue status' });
//   }
// };

// exports.getVenueCounts = async (req, res) => {
//   try {
//     const total = await Venue.countDocuments();
//     const active = await Venue.countDocuments({ isActive: true });
//     const inactive = await Venue.countDocuments({ isActive: false });
//     res.status(200).json({ success: true, total, active, inactive });
//   } catch (err) {
//     console.error('Error in getVenueCounts:', err.message);
//     res.status(500).json({ success: false, message: 'Failed to fetch venue counts' });
//   }
// };


const mongoose = require('mongoose');
const Venue = require('../../models/vendor/Venue');

// Create Venue
exports.createVenue = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    if (data.pricingSchedule) data.pricingSchedule = JSON.parse(data.pricingSchedule);

    if (data.searchTags) {
      let tags = data.searchTags;
      if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          tags = Array.isArray(parsed) ? parsed.flat() : [tags];
        } catch {
          tags = [tags];
        }
      }
      data.searchTags = Array.isArray(tags)
        ? tags.flat().filter(t => t && typeof t === 'string').map(t => t.trim())
        : [];
    } else {
      data.searchTags = [];
    }

    if (!data.user) data.user = null;

    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Please log in to create a venue',
      });
    }

    const venue = await Venue.create({
      ...data,
      createdBy: req.user._id, // use the real logged-in user
    });

    res.status(201).json({
      success: true,
      data: venue,
    });
  } catch (err) {
    console.error('Error in createVenue:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create venue',
    });
  }
};

exports.getVenues = async (req, res) => {
  try {
    const venues = await Venue.find()
      .populate({
        path: 'createdBy',
        select: 'name email phone', // optional: include only what you need
      })
      .lean();

    if (!venues || venues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No venues found',
      });
    }

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venues',
      error: error.message,
    });
  }
};

// Get single venue
exports.getVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId))
      return res.status(400).json({ success: false, message: 'Invalid venue ID' });

    let venue = await Venue.findById(venueId).populate('provider').lean();
    if (!venue)
      return res.status(404).json({ success: false, message: 'Venue not found' });

    // Fallbacks for legacy data
    if (!venue.venueType && venue.venueType) {
      venue.venueType =
        venue.venueType === 'hourly'
          ? 'per_hour'
          : venue.venueType === 'daily'
            ? 'per_function'
            : 'per_person';
    }
    if (!venue.pricingSchedule && venue.hourlyPrice) {
      venue.pricingSchedule = [
        {
          day: 'Monday',
          slotType: 'morning',
          startTime: '08:00',
          startAmpm: 'AM',
          endTime: '12:00',
          endAmpm: 'PM',
          price: venue.hourlyPrice,
        },
      ];
    }
    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    console.error('Error in getVenue:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch venue' });
  }
};

// Update venue
exports.updateVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId))
      return res.status(400).json({ success: false, message: 'Invalid venue ID' });

    const data = req.body;
    if (data.pricingSchedule && typeof data.pricingSchedule === 'string') {
      data.pricingSchedule = JSON.parse(data.pricingSchedule);
    }
    if (data.searchTags) {
      let tags = data.searchTags;
      if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          tags = Array.isArray(parsed) ? parsed.flat() : [tags];
        } catch {
          tags = [tags];
        }
      }
      data.searchTags = Array.isArray(tags)
        ? tags.flat().filter(t => t && typeof t === 'string').map(t => t.trim())
        : [];
    } else {
      data.searchTags = [];
    }

    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.findByIdAndUpdate(venueId, data, {
      new: true,
      runValidators: true,
    });

    if (!venue)
      return res.status(404).json({ success: false, message: 'Venue not found' });

    // Fallbacks
    if (!venue.venueType && venue.venueType) {
      venue.venueType =
        venue.venueType === 'hourly'
          ? 'per_hour'
          : venue.venueType === 'daily'
            ? 'per_function'
            : 'per_person';
    }
    if (!venue.pricingSchedule && venue.hourlyPrice) {
      venue.pricingSchedule = [
        {
          day: 'Monday',
          slotType: 'morning',
          startTime: '08:00',
          startAmpm: 'AM',
          endTime: '12:00',
          endAmpm: 'PM',
          price: venue.hourlyPrice,
        },
      ];
    }

    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    console.error('Error in updateVenue:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update venue' });
  }
};

// Update Pricing
exports.updatePricing = async (req, res) => {
  try {
    const venueId = req.params.id;
    const { venueType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ success: false, message: 'Invalid venue ID' });
    }

    const pricingSchedule = req.body.pricingSchedule
      ? JSON.parse(req.body.pricingSchedule)
      : null;

    if (!venueType || !pricingSchedule || !Array.isArray(pricingSchedule)) {
      return res.status(400).json({
        success: false,
        message: 'venueType and pricingSchedule are required',
      });
    }

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { venueType, pricingSchedule },
      { new: true, runValidators: true }
    );

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueType: venue.venueType,
        pricingSchedule: venue.pricingSchedule,
      },
    });
  } catch (err) {
    console.error('Error in updatePricing:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update venue pricing' });
  }
};


// Get Pricing
exports.getPricing = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ success: false, message: 'Invalid venue ID' });
    }

    const venue = await Venue.findById(venueId)
      .select('venueName venueType pricingSchedule')
      .lean();

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        venueType: venue.venueType || 'per_hour',
        pricingSchedule: venue.pricingSchedule || [],
      },
    });
  } catch (err) {
    console.error('Error in getPricing:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch venue pricing' });
  }
};


// Delete Venue
exports.deleteVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId))
      return res.status(400).json({ success: false, message: 'Invalid venue ID' });

    const venue = await Venue.findByIdAndDelete(venueId);
    if (!venue)
      return res.status(404).json({ success: false, message: 'Venue not found' });

    res.status(200).json({ success: true, message: 'Venue deleted successfully' });
  } catch (err) {
    console.error('Error in deleteVenue:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete venue' });
  }
};

// Toggle Active
exports.toggleVenueStatus = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId))
      return res.status(400).json({ success: false, message: 'Invalid venue ID' });

    const venue = await Venue.findById(venueId);
    if (!venue)
      return res.status(404).json({ success: false, message: 'Venue not found' });

    venue.isActive = !venue.isActive;
    await venue.save();
    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    console.error('Error in toggleVenueStatus:', err.message);
    res.status(500).json({ success: false, message: 'Failed to toggle venue status' });
  }
};

// Venue Counts
exports.getVenueCounts = async (req, res) => {
  try {
    const total = await Venue.countDocuments();
    const active = await Venue.countDocuments({ isActive: true });
    const inactive = await Venue.countDocuments({ isActive: false });
    res.status(200).json({ success: true, total, active, inactive });
  } catch (err) {
    console.error('Error in getVenueCounts:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch venue counts' });
  }
};