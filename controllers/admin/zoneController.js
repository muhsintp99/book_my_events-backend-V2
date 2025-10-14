const Zone = require("../../models/admin/zone");
const axios = require("axios");

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
// Create Zone
exports.createZone = async (req, res) => {
  try {
    const { name, description, coordinates } = req.body;

    if (!name || !coordinates || coordinates.length < 3) {
      return res.status(400).json({ message: "Name and at least 3 coordinates are required." });
    }

    const validation = await validateCoordinatesAndGetLocation(coordinates);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const zone = await Zone.create({
      name,
      description,
      coordinates,
      city: validation.city,
      country: validation.country,
    });

    res.status(201).json({ message: "Zone created successfully", data: zone });
  } catch (err) {
    res.status(500).json({ message: "Error creating zone", error: err.message });
  }
};

// Get All Zones
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find();
    res.status(200).json({ data: zones });
  } catch (err) {
    res.status(500).json({ message: "Error fetching zones", error: err.message });
  }
};

// Get Zone by ID
exports.getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    res.status(200).json({ data: zone });
  } catch (err) {
    res.status(500).json({ message: "Error fetching zone", error: err.message });
  }
};

// Update Zone
exports.updateZone = async (req, res) => {
  try {
    const { name, description, coordinates, isActive } = req.body;

    let city, country;
    if (coordinates && coordinates.length >= 3) {
      const validation = await validateCoordinatesAndGetLocation(coordinates);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
      city = validation.city;
      country = validation.country;
    }

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { name, description, coordinates, city, country, isActive },
      { new: true, runValidators: true }
    );

    if (!zone) return res.status(404).json({ message: "Zone not found" });

    res.status(200).json({ message: "Zone updated successfully", data: zone });
  } catch (err) {
    res.status(500).json({ message: "Error updating zone", error: err.message });
  }
};

// Delete Zone
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    res.status(200).json({ message: "Zone deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting zone", error: err.message });
  }
};