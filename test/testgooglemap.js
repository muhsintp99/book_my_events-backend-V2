require("dotenv").config();
const axios = require("axios");

// Sample coordinates (New York City)
const LAT = process.argv[2] || 40.712776;
const LNG = process.argv[3] || -74.005974;

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function testGoogleMaps() {
  if (!GOOGLE_API_KEY) {
    console.error("❌ GOOGLE_MAPS_API_KEY is missing in .env");
    process.exit(1);
  }

  console.log("🔎 Testing Google Maps Geocoding API...");
  console.log(`📍 Coordinates: LAT=${LAT}, LNG=${LNG}`);

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${LAT},${LNG}&key=${GOOGLE_API_KEY}`;
    const { data } = await axios.get(url);

    if (data.status === "OK") {
      const formattedAddress = data.results[0].formatted_address;
      console.log(`✅ Google API Connected | Address: ${formattedAddress}`);

      let city = null;
      let country = null;
      const components = data.results[0].address_components;
      components.forEach((comp) => {
        if (comp.types.includes("locality")) city = comp.long_name;
        if (comp.types.includes("administrative_area_level_2") && !city) city = comp.long_name;
        if (comp.types.includes("country")) country = comp.long_name;
      });

      console.log(`🏙 City: ${city || "N/A"}`);
      console.log(`🌎 Country: ${country || "N/A"}`);
    } else {
      console.error(`❌ Google API Error: ${data.status}`);
      if (data.error_message) console.error(`ℹ️ Message: ${data.error_message}`);
    }
  } catch (err) {
    console.error("❌ Could not connect to Google Maps API:", err.message);
  }
}

testGoogleMaps();

// ================================================================================ //
// Check the other files for recent edits.
// node test/testgooglemap.js