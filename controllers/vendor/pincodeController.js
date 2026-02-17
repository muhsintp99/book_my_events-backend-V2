const Pincode = require('../../models/vendor/Pincode');

exports.getPincodesInRadius = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng || !radius) {
            return res.status(400).json({ success: false, message: 'Latitude, longitude, and radius are required' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusInKm = parseFloat(radius);

        // Radius of Earth in km is approx 6378.1
        // MongoDB expects radius in radians for $centerSphere
        const radiusInRadians = radiusInKm / 6378.1;

        const pincodes = await Pincode.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radiusInRadians]
                }
            }
        });

        res.status(200).json({
            success: true,
            count: pincodes.length,
            data: pincodes
        });
    } catch (error) {
        console.error('Error fetching pincodes:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create a new pincode (for testing/admin use)
exports.createPincode = async (req, res) => {
    try {
        const { code, city, state, country, lat, lng } = req.body;

        if (!code || !lat || !lng) {
            return res.status(400).json({ success: false, message: 'Code, lat, and lng are required' });
        }

        const pincode = await Pincode.create({
            code,
            city,
            state,
            country: country || 'India',
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)] // GeoJSON expects [longitude, latitude]
            }
        });

        res.status(201).json({
            success: true,
            message: 'Pincode created successfully',
            data: pincode
        });
    } catch (error) {
        console.error('Error creating pincode:', error);
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Pincode already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
