const Pincode = require('../../models/vendor/Pincode');

/* ======================================================
   GET ALL PINCODES
====================================================== */
exports.getAllPincodes = async (req, res) => {
    try {
        const pincodes = await Pincode.find().sort({ createdAt: -1 });

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
   GET PINCODE BY ID
====================================================== */
exports.getPincodeById = async (req, res) => {
    try {
        const pincode = await Pincode.findById(req.params.id);

        if (!pincode) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found'
            });
        }

        res.status(200).json({
            success: true,
            data: pincode
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


/* ======================================================
   GET PINCODES IN RADIUS (Optimized & Accurate)
====================================================== */
exports.getPincodesInRadius = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng || !radius) {
            return res.status(400).json({
                success: false,
                message: 'Latitude, longitude, and radius (KM) are required'
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
                coordinates: [longitude, latitude] // GeoJSON format
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


/* ======================================================
   UPDATE PINCODE
====================================================== */
exports.updatePincode = async (req, res) => {
    try {
        const { code, city, state, country, lat, lng } = req.body;

        const updateData = {};

        if (code) updateData.code = code;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (country) updateData.country = country;

        if (lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid latitude or longitude'
                });
            }

            updateData.location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };
        }

        const updated = await Pincode.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pincode updated successfully',
            data: updated
        });

    } catch (error) {
        console.error('Error updating pincode:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


/* ======================================================
   DELETE PINCODE
====================================================== */
exports.deletePincode = async (req, res) => {
    try {
        const deleted = await Pincode.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pincode deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting pincode:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
