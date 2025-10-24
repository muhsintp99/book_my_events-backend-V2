// const Zone = require("../../models/admin/zone");
// const axios = require("axios");

// const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// // Helper: Validate coordinates and extract location info
// async function validateCoordinatesAndGetLocation(coordinates) {
//   try {
//     const firstPoint = coordinates[0];
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${firstPoint.lat},${firstPoint.lng}&key=${GOOGLE_API_KEY}`;
//     const { data } = await axios.get(url);

//     if (data.status !== "OK" || data.results.length === 0) {
//       return { valid: false, message: "Invalid first coordinate." };
//     }

//     // Extract city & country
//     let city = null;
//     let country = null;

//     const components = data.results[0].address_components;
//     components.forEach((comp) => {
//       if (comp.types.includes("locality")) city = comp.long_name;
//       if (comp.types.includes("administrative_area_level_2") && !city) city = comp.long_name;
//       if (comp.types.includes("country")) country = comp.long_name;
//     });

//     return { valid: true, city, country };
//   } catch (err) {
//     return { valid: false, message: "Google Geocoding API error." };
//   }
// }


// // Detect user's location and return lat, lng, district
// exports.reverseGeocode = async (req, res) => {
//   try {
//     const { lat, lng } = req.query;

//     if (!lat || !lng) {
//       return res.status(400).json({ message: "Latitude and longitude are required." });
//     }

//     const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
//     const { data } = await axios.get(url);

//     if (data.status !== "OK" || !data.results.length) {
//       return res.status(400).json({ message: "Unable to detect location." });
//     }

//     const result = data.results[0];

//     // Extract city and district
//     let city = null;
//     let district = null;

//     result.address_components.forEach((comp) => {
//       if (comp.types.includes("locality")) city = comp.long_name;
//       if (comp.types.includes("administrative_area_level_2")) district = comp.long_name;
//     });

//     // Match district with your Zone model if needed
//     const matchedZone = await Zone.findOne({
//       name: { $regex: new RegExp(district || city, "i") },
//     });

//     res.status(200).json({
//       success: true,
//       lat,
//       lng,
//       city: city || "Unknown",
//       district: matchedZone ? matchedZone.name : district || "Unknown",
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Error detecting location",
//       error: err.message,
//     });
//   }
// };
// // Create Zone
// exports.createZone = async (req, res) => {
//   try {
//     const { name, description, coordinates } = req.body;

//     if (!name || !coordinates || coordinates.length < 3) {
//       return res.status(400).json({ message: "Name and at least 3 coordinates are required." });
//     }

//     const validation = await validateCoordinatesAndGetLocation(coordinates);
//     if (!validation.valid) {
//       return res.status(400).json({ message: validation.message });
//     }

//     const zone = await Zone.create({
//       name,
//       description,
//       coordinates,
//       city: validation.city,
//       country: validation.country,
//     });

//     res.status(201).json({ message: "Zone created successfully", data: zone });
//   } catch (err) {
//     res.status(500).json({ message: "Error creating zone", error: err.message });
//   }
// };

// // Get All Zones
// exports.getZones = async (req, res) => {
//   try {
//     const zones = await Zone.find();
//     res.status(200).json({ data: zones });
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching zones", error: err.message });
//   }
// };

// // Get Zone by ID
// exports.getZoneById = async (req, res) => {
//   try {
//     const zone = await Zone.findById(req.params.id);
//     if (!zone) return res.status(404).json({ message: "Zone not found" });

//     res.status(200).json({ data: zone });
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching zone", error: err.message });
//   }
// };

// // Update Zone
// exports.updateZone = async (req, res) => {
//   try {
//     const { name, description, coordinates, isActive } = req.body;

//     let city, country;
//     if (coordinates && coordinates.length >= 3) {
//       const validation = await validateCoordinatesAndGetLocation(coordinates);
//       if (!validation.valid) {
//         return res.status(400).json({ message: validation.message });
//       }
//       city = validation.city;
//       country = validation.country;
//     }

//     const zone = await Zone.findByIdAndUpdate(
//       req.params.id,
//       { name, description, coordinates, city, country, isActive },
//       { new: true, runValidators: true }
//     );

//     if (!zone) return res.status(404).json({ message: "Zone not found" });

//     res.status(200).json({ message: "Zone updated successfully", data: zone });
//   } catch (err) {
//     res.status(500).json({ message: "Error updating zone", error: err.message });
//   }
// };

// // Delete Zone
// exports.deleteZone = async (req, res) => {
//   try {
//     const zone = await Zone.findByIdAndDelete(req.params.id);
//     if (!zone) return res.status(404).json({ message: "Zone not found" });

//     res.status(200).json({ message: "Zone deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Error deleting zone", error: err.message });
//   }
// };


const Zone = require("../../models/admin/zone");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Helper: Validate coordinates and extract location info
async function validateCoordinatesAndGetLocation(coordinates) {
  try {
    const firstPoint = coordinates[0];
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${firstPoint.lat},${firstPoint.lng}&key=${GOOGLE_API_KEY}`;
    const { data } = await axios.get(url);

    if (data.status !== "OK" || data.results.length === 0) {
      return { valid: false, message: "Invalid first coordinate." };
    }

    // Extract city & country
    let city = null;
    let country = null;

    const components = data.results[0].address_components;
    components.forEach((comp) => {
      if (comp.types.includes("locality")) city = comp.long_name;
      if (comp.types.includes("administrative_area_level_2") && !city) city = comp.long_name;
      if (comp.types.includes("country")) country = comp.long_name;
    });

    return { valid: true, city, country };
  } catch (err) {
    return { valid: false, message: "Google Geocoding API error." };
  }
}

// Helper: Delete old icon file
function deleteOldIcon(iconPath) {
  if (iconPath && fs.existsSync(iconPath)) {
    try {
      fs.unlinkSync(iconPath);
    } catch (err) {
      console.error("Error deleting old icon:", err);
    }
  }
}

// Detect user's location and return lat, lng, district
exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    const { data } = await axios.get(url);

    if (data.status !== "OK" || !data.results.length) {
      return res.status(400).json({ message: "Unable to detect location." });
    }

    const result = data.results[0];

    // Extract city and district
    let city = null;
    let district = null;

    result.address_components.forEach((comp) => {
      if (comp.types.includes("locality")) city = comp.long_name;
      if (comp.types.includes("administrative_area_level_2")) district = comp.long_name;
    });

    // Match district with your Zone model if needed
    const matchedZone = await Zone.findOne({
      name: { $regex: new RegExp(district || city, "i") },
    });

    res.status(200).json({
      success: true,
      lat,
      lng,
      city: city || "Unknown",
      district: matchedZone ? matchedZone.name : district || "Unknown",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error detecting location",
      error: err.message,
    });
  }
};

// Get Top Zones - Returns only zones marked as "isTopZone: true"
exports.getTopZones = async (req, res) => {
  try {
    const zones = await Zone.find({ isActive: true, isTopZone: true })
      .select('name coordinates city icon')
      .sort({ createdAt: -1 });

    // Get base URL for full icon paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Transform to simplified format
    const topZones = zones.map(zone => {
      // Calculate center point from coordinates (average of all points)
      const centerLat = zone.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / zone.coordinates.length;
      const centerLng = zone.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / zone.coordinates.length;

      return {
        icon: zone.icon ? `${baseUrl}${zone.icon}` : "📍",
        title: zone.name,
        latitude: parseFloat(centerLat.toFixed(6)),
        longitude: parseFloat(centerLng.toFixed(6))
      };
    });

    res.status(200).json({ 
      success: true,
      count: topZones.length,
      data: topZones 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching top zones", 
      error: err.message 
    });
  }
};

// Toggle Top Zone Status
exports.toggleTopZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ 
        success: false,
        message: "Zone not found" 
      });
    }

    // Toggle the isTopZone status
    zone.isTopZone = !zone.isTopZone;
    await zone.save();

    res.status(200).json({ 
      success: true,
      message: `Zone ${zone.isTopZone ? 'added to' : 'removed from'} top zones`,
      data: {
        id: zone._id,
        name: zone.name,
        isTopZone: zone.isTopZone
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error toggling top zone status", 
      error: err.message 
    });
  }
};

// Create Zone
exports.createZone = async (req, res) => {
  try {
    let { name, description, coordinates } = req.body;

    // Parse coordinates if sent as string
    if (typeof coordinates === "string") {
      try {
        coordinates = JSON.parse(coordinates);
      } catch (e) {
        return res.status(400).json({ message: "Invalid coordinates JSON format" });
      }
    }

    if (!name || !coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({ message: "Name and at least 3 coordinates are required." });
    }

    // Validate coordinates with Google API
    const validation = await validateCoordinatesAndGetLocation(coordinates);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Prepare zone data
    const zoneData = {
      name,
      description,
      coordinates,
      city: validation.city,
      country: validation.country,
    };

    // If icon file was uploaded, store its path
    if (req.file) {
      // Construct URL path to the uploaded file
      zoneData.icon = `/uploads/zone-icons/${req.file.filename}`;
    } else {
      zoneData.icon = "📍"; // fallback default icon
    }

    const zone = await Zone.create(zoneData);

    res.status(201).json({
      message: "Zone created successfully",
      data: zone
    });
  } catch (err) {
    console.error("Error creating zone:", err);
    res.status(500).json({ message: "Error creating zone", error: err.message });
  }
};


// Get All Zones
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    
    // Get base URL for full icon paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Add full URL to icons
    const zonesWithFullIconUrls = zones.map(zone => {
      const zoneObj = zone.toObject();
      if (zoneObj.icon) {
        zoneObj.iconUrl = `${baseUrl}${zoneObj.icon}`;
      }
      return zoneObj;
    });

    res.status(200).json({ 
      success: true,
      count: zones.length,
      data: zonesWithFullIconUrls 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching zones", 
      error: err.message 
    });
  }
};

// Get Zone by ID
exports.getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ 
        success: false,
        message: "Zone not found" 
      });
    }

    // Get base URL for full icon path
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const zoneObj = zone.toObject();
    if (zoneObj.icon) {
      zoneObj.iconUrl = `${baseUrl}${zoneObj.icon}`;
    }

    res.status(200).json({ 
      success: true,
      data: zoneObj 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching zone", 
      error: err.message 
    });
  }
};

// Update Zone
exports.updateZone = async (req, res) => {
  try {
    const { name, description, coordinates, isActive, isTopZone } = req.body;

    // Find existing zone first
    const existingZone = await Zone.findById(req.params.id);
    if (!existingZone) {
      if (req.file) {
        deleteOldIcon(req.file.path);
      }
      return res.status(404).json({ 
        success: false,
        message: "Zone not found" 
      });
    }

    // Parse coordinates if provided and is a string
    let parsedCoordinates = coordinates;
    if (coordinates) {
      if (typeof coordinates === 'string') {
        try {
          parsedCoordinates = JSON.parse(coordinates);
        } catch (err) {
          if (req.file) {
            deleteOldIcon(req.file.path);
          }
          return res.status(400).json({ 
            success: false,
            message: "Invalid coordinates format. Must be valid JSON array." 
          });
        }
      }

      // Validate coordinates format
      const isValidCoordinates = parsedCoordinates.every(
        coord => coord.lat !== undefined && coord.lng !== undefined
      );
      if (!isValidCoordinates) {
        if (req.file) {
          deleteOldIcon(req.file.path);
        }
        return res.status(400).json({ 
          success: false,
          message: "Each coordinate must have 'lat' and 'lng' properties." 
        });
      }
    }

    // Validate coordinates and get location if provided
    let city, country;
    if (parsedCoordinates && parsedCoordinates.length >= 3) {
      const validation = await validateCoordinatesAndGetLocation(parsedCoordinates);
      if (!validation.valid) {
        if (req.file) {
          deleteOldIcon(req.file.path);
        }
        return res.status(400).json({ 
          success: false,
          message: validation.message 
        });
      }
      city = validation.city;
      country = validation.country;
    }

    // Prepare update data - only include fields that were provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parsedCoordinates !== undefined) updateData.coordinates = parsedCoordinates;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (isTopZone !== undefined) updateData.isTopZone = isTopZone === 'true' || isTopZone === true;

    // Handle icon update
    if (req.file) {
      // Delete old icon if exists
      if (existingZone.icon) {
        const oldIconPath = path.join(__dirname, '../../', existingZone.icon);
        deleteOldIcon(oldIconPath);
      }
      updateData.icon = `/uploads/zone-icons/${req.file.filename}`;
    }

    // Update zone
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true,
      message: "Zone updated successfully", 
      data: zone 
    });
  } catch (err) {
    if (req.file) {
      deleteOldIcon(req.file.path);
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "A zone with this name already exists." 
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Error updating zone", 
      error: err.message 
    });
  }
};

// Delete Zone
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ 
        success: false,
        message: "Zone not found" 
      });
    }

    // Delete associated icon file if exists
    if (zone.icon) {
      const iconPath = path.join(__dirname, '../../', zone.icon);
      deleteOldIcon(iconPath);
    }

    res.status(200).json({ 
      success: true,
      message: "Zone deleted successfully",
      data: { id: zone._id, name: zone.name }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting zone", 
      error: err.message 
    });
  }
};