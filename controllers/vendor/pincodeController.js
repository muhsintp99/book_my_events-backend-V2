const Pincode = require('../../models/vendor/Pincode');

/* ======================================================
   GET PINCODES IN RADIUS (Optimized & Accurate)
====================================================== */
exports.getPincodesInRadius = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng || !radius) {
            return res.status(400).json({
                success: false,
                message: 'Latitude, longitude, and radius (in KM) are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusInKm = parseFloat(radius);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInKm)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid latitude, longitude, or radius'
            });
        }

        // Convert KM to meters (MongoDB uses meters for $near)
        const radiusInMeters = radiusInKm * 1000;

        const pincodes = await Pincode.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radiusInMeters
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
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


/* ======================================================
   CREATE PINCODE
====================================================== */
exports.createPincode = async (req, res) => {
    try {
        const { code, city, state, country, lat, lng } = req.body;

        if (!code || !lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Code, latitude, and longitude are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid latitude or longitude'
            });
        }

        const pincode = await Pincode.create({
            code,
            city,
            state,
            country: country || 'India',
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // GeoJSON: [lng, lat]
            }
        });

        res.status(201).json({
            success: true,
            message: 'Pincode created successfully',
            data: pincode
        });

    } catch (error) {
        console.error('Error creating pincode:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Pincode already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
