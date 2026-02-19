const Pincode = require("../../models/vendor/Pincode");
const VendorProfile = require("../../models/vendor/vendorProfile");
const Cake = require("../../models/vendor/cakePackageModel");
const Zone = require("../../models/admin/zone");
const { calculateDistance } = require("../../utils/geoUtils");
const mongoose = require("mongoose");

// ➤ Get All Pincodes (Admin)
exports.getAllPincodes = async (req, res) => {
  try {
    const { zone_id, search } = req.query;
    let query = {};

    if (zone_id && mongoose.Types.ObjectId.isValid(zone_id)) {
      query.zone_id = zone_id;
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }

    const pincodes = await Pincode.find(query)
      .populate("zone_id", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pincodes.length,
      data: pincodes,
    });
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ➤ Get Pincodes In Radius
exports.getPincodesInRadius = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Latitude, longitude, and radius are required",
        });
    }

    const radiusInMeters = parseFloat(radius) * 1000;

    const pincodes = await Pincode.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    });

    res
      .status(200)
      .json({ success: true, count: pincodes.length, data: pincodes });
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ➤ Create Pincode (Admin)
exports.createPincode = async (req, res) => {
  try {
    let {
      code,
      city,
      state,
      country,
      lat,
      lng,
      zone_id,
      pincode,
      area_name,
      latitude,
      longitude,
    } = req.body;

    const finalCode = code || pincode;
    const finalCity = city || area_name;
    const finalLat = lat || latitude;
    const finalLng = lng || longitude;

    if (!finalCode || !finalLat || !finalLng) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Code, Latitude and Longitude are required",
        });
    }

    const pincodeDoc = await Pincode.create({
      code: finalCode,
      city: finalCity,
      state,
      country: country || "India",
      zone_id:
        zone_id && mongoose.Types.ObjectId.isValid(zone_id) ? zone_id : null,
      location: {
        type: "Point",
        coordinates: [parseFloat(finalLng), parseFloat(finalLat)],
      },
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Pincode created successfully",
        data: pincodeDoc,
      });
  } catch (error) {
    console.error("Error creating pincode:", error);
    if (error.code === 11000)
      return res
        .status(400)
        .json({ success: false, message: "Pincode already exists" });
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ➤ Update Pincode (Admin)
exports.updatePincode = async (req, res) => {
  try {
    let { code, city, state, country, lat, lng, zone_id } = req.body;
    const updateData = {
      code,
      city,
      state,
      country,
      zone_id:
        zone_id && mongoose.Types.ObjectId.isValid(zone_id) ? zone_id : null,
    };

    if (lat && lng) {
      updateData.location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }

    const pincode = await Pincode.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!pincode)
      return res
        .status(404)
        .json({ success: false, message: "Pincode not found" });
    res.status(200).json({ success: true, data: pincode });
  } catch (error) {
    console.error("Error updating pincode:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ➤ Delete Pincode (Admin)
exports.deletePincode = async (req, res) => {
  try {
    const pincode = await Pincode.findByIdAndDelete(req.params.id);
    if (!pincode)
      return res
        .status(404)
        .json({ success: false, message: "Pincode not found" });
    res.status(200).json({ success: true, message: "Pincode deleted" });
  } catch (error) {
    console.error("Error deleting pincode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ➤ Bulk Create Pincodes (Admin - CSV Upload)
exports.bulkCreatePincodes = async (req, res) => {
  try {
    const { pincodes } = req.body; // Array of objects {code, city, state, lat, lng, zone}

    if (!Array.isArray(pincodes)) {
      return res
        .status(400)
        .json({ success: false, message: "Pincodes must be an array" });
    }

    // Fetch all zones to map names to IDs
    const allZones = await Zone.find({});
    const zoneMap = {};
    allZones.forEach((z) => {
      zoneMap[z.name.toLowerCase()] = z._id;
    });

    const newPincodes = [];
    const errors = [];

    for (const p of pincodes) {
      if (!p.code || !p.lat || !p.lng) {
        errors.push({
          code: p.code || "unknown",
          message: "Missing required fields (code, lat, lng)",
        });
        continue;
      }

      const zoneId = p.zone ? zoneMap[p.zone.trim().toLowerCase()] : null;

      newPincodes.push({
        code: String(p.code).trim(),
        city: p.city ? p.city.trim() : null,
        state: p.state ? p.state.trim() : p.zone ? p.zone.trim() : null, // Default state to zone name if missing
        country: "India",
        zone_id: zoneId,
        location: {
          type: "Point",
          coordinates: [parseFloat(p.lng), parseFloat(p.lat)],
        },
        status: "Active",
      });
    }

    if (newPincodes.length > 0) {
      // ordered: false allows continuing on duplicates
      try {
        await Pincode.insertMany(newPincodes, { ordered: false });
        res.status(201).json({
          success: true,
          message: `Uploaded ${newPincodes.length} pincodes successfully`,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (bulkError) {
        // If duplicates exist, insertMany throws but still inserts non-duplicates with ordered: false
        // bulkError.insertedDocs contains successful inserts
        const inserted = bulkError.insertedDocs
          ? bulkError.insertedDocs.length
          : 0;
        res.status(200).json({
          success: true,
          message: `Uploaded ${inserted} pincodes. ${newPincodes.length - inserted} failed (likely duplicates).`,
          errors: bulkError.writeErrors,
        });
      }
    } else {
      res
        .status(400)
        .json({
          success: false,
          message: "No valid pincodes to upload",
          errors,
        });
    }
  } catch (error) {
    console.error("Error bulk uploading pincodes:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ➤ Check Delivery Availability (Customer)
exports.checkDeliveryAvailability = async (req, res) => {
  try {
    const { pincode: pincodeStr, providerId } = req.query;

    if (!pincodeStr || !providerId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Pincode and providerId are required",
        });
    }

    const pincodeDoc = await Pincode.findOne({
      code: pincodeStr,
      status: "Active",
    });
    if (!pincodeDoc)
      return res
        .status(404)
        .json({ success: false, message: "Pincode not serviceable" });

    const vendorProfile = await VendorProfile.findOne({ user: providerId });
    if (!vendorProfile || !vendorProfile.deliveryProfile)
      return res
        .status(404)
        .json({ success: false, message: "Vendor delivery profile not found" });

    const packages = await Cake.find({ provider: providerId, isActive: true });
    const deliverablePackages = [];
    const configsByMode = {};

    if (vendorProfile.deliveryProfile.deliveryConfigurations) {
      vendorProfile.deliveryProfile.deliveryConfigurations.forEach((config) => {
        if (config.status) configsByMode[config.mode] = config;
      });
    }

    for (const pkg of packages) {
      const mode = pkg.deliveryMode || "standard";
      const config = configsByMode[mode];
      if (!config) continue;

      let isPackageDeliverable = false;

      switch (config.coverageType) {
        case "entire_zone":
          // Priority 1: Match by Zone ID
          if (
            vendorProfile.zone &&
            pincodeDoc.zone_id &&
            pincodeDoc.zone_id.toString() === vendorProfile.zone.toString()
          ) {
            isPackageDeliverable = true;
          }
          // Priority 2: Match by State name (fallback)
          else if (
            pincodeDoc.state &&
            vendorProfile.zoneName && // assuming vendorProfile has zoneName
            pincodeDoc.state.toLowerCase() ===
              vendorProfile.zoneName.toLowerCase()
          ) {
            isPackageDeliverable = true;
          }
          break;

        case "radius_based":
          if (vendorProfile.latitude && vendorProfile.longitude) {
            const distance = calculateDistance(
              parseFloat(vendorProfile.latitude),
              parseFloat(vendorProfile.longitude),
              pincodeDoc.location.coordinates[1],
              pincodeDoc.location.coordinates[0],
            );
            if (distance <= config.radius) isPackageDeliverable = true;
          }
          break;

        case "selected_pincodes":
          if (config.selectedPincodes) {
            // Check if any tag contains the pincode string
            isPackageDeliverable = config.selectedPincodes.some((tag) =>
              tag.includes(pincodeStr),
            );
          }
          break;
      }

      if (isPackageDeliverable) {
        const pkgObj = pkg.toObject();
        pkgObj.calculatedShipping = {
          mode: config.mode,
          price: config.shippingPrice,
          coverageType: config.coverageType,
        };
        deliverablePackages.push(pkgObj);
      }
    }

    res.status(200).json({
      success: true,
      isDeliverable: deliverablePackages.length > 0,
      pincodeData: {
        pincode: pincodeDoc.code,
        district: pincodeDoc.city,
        state: pincodeDoc.state,
        lat: pincodeDoc.location.coordinates[1],
        lng: pincodeDoc.location.coordinates[0],
        zone: pincodeDoc.zone_id,
      },
      data: deliverablePackages,
    });
  } catch (error) {
    console.error("Error checking delivery availability:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
// 🔥 FIX WRONG BO/HO DATA
exports.fixWrongAreaNames = async (req, res) => {
  try {
    // Find all pincodes where city is just BO/HO/PO/SO
    const wrongRows = await Pincode.find({
      city: { $regex: /^(BO|HO|PO|SO)$/i }
    });

    if (wrongRows.length === 0) {
      return res.json({ success: true, message: 'No wrong records found' });
    }

    let updated = 0;

    for (const row of wrongRows) {
      // Set city to the pincode code as a fallback label until re-imported
      row.city = `Area ${row.code}`;
      await row.save();
      updated++;
    }

    res.json({
      success: true,
      message: `Updated ${updated} records. Please re-import CSV to get proper area names.`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
