const Pincode = require('../../models/vendor/Pincode');
const VendorProfile = require('../../models/vendor/vendorProfile');
const Cake = require('../../models/vendor/cakePackageModel');
const Zone = require('../../models/admin/zone');
const { calculateDistance } = require('../../utils/geoUtils');
const mongoose = require('mongoose');

// ➤ Get All Pincodes (Admin)
exports.getAllPincodes = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } }
            ];
        }

        const pincodes = await Pincode.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: pincodes.length, data: pincodes });
    } catch (error) {
        console.error('Error fetching pincodes:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ➤ Get Pincodes In Radius
exports.getPincodesInRadius = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng || !radius) {
            return res.status(400).json({ success: false, message: 'Latitude, longitude, and radius are required' });
        }

        const radiusInMeters = parseFloat(radius) * 1000;

        const pincodes = await Pincode.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radiusInMeters
                }
            }
        });

        res.status(200).json({ success: true, count: pincodes.length, data: pincodes });
    } catch (error) {
        console.error('Error fetching pincodes:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ➤ Create Pincode (Admin)
exports.createPincode = async (req, res) => {
    try {
        const { code, city, state, country, lat, lng, pincode, area_name, latitude, longitude } = req.body;

        // Handle both field name sets for compatibility
        const finalCode = code || pincode;
        const finalCity = city || area_name;
        const finalLat = lat || latitude;
        const finalLng = lng || longitude;

        if (!finalCode || !finalLat || !finalLng) {
            return res.status(400).json({ success: false, message: 'Code, Latitude and Longitude are required' });
        }

        const pincodeDoc = await Pincode.create({
            code: finalCode,
            city: finalCity,
            state,
            country: country || 'India',
            location: {
                type: 'Point',
                coordinates: [parseFloat(finalLng), parseFloat(finalLat)]
            }
        });

        res.status(201).json({ success: true, message: 'Pincode created successfully', data: pincodeDoc });
    } catch (error) {
        console.error('Error creating pincode:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Pincode already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ➤ Update Pincode (Admin)
exports.updatePincode = async (req, res) => {
    try {
        const { code, city, state, country, lat, lng } = req.body;
        const updateData = { code, city, state, country };

        if (lat && lng) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
        }

        const pincode = await Pincode.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        if (!pincode) {
            return res.status(404).json({ success: false, message: 'Pincode not found' });
        }

        res.status(200).json({ success: true, data: pincode });
    } catch (error) {
        console.error('Error updating pincode:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ➤ Delete Pincode (Admin)
exports.deletePincode = async (req, res) => {
    try {
        const pincode = await Pincode.findByIdAndDelete(req.params.id);
        if (!pincode) {
            return res.status(404).json({ success: false, message: 'Pincode not found' });
        }
        res.status(200).json({ success: true, message: 'Pincode deleted' });
    } catch (error) {
        console.error('Error deleting pincode:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ➤ Check Delivery Availability (Customer)
exports.checkDeliveryAvailability = async (req, res) => {
    try {
        const { pincode: pincodeStr, providerId } = req.query;

        if (!pincodeStr || !providerId) {
            return res.status(400).json({ success: false, message: 'Pincode and providerId are required' });
        }

        const pincodeDoc = await Pincode.findOne({ code: pincodeStr, status: 'Active' });
        if (!pincodeDoc) {
            return res.status(404).json({ success: false, message: 'Pincode not serviceable' });
        }

        const vendorProfile = await VendorProfile.findOne({ user: providerId });
        if (!vendorProfile || !vendorProfile.deliveryProfile) {
            return res.status(404).json({ success: false, message: 'Vendor delivery profile not found' });
        }

        const packages = await Cake.find({ provider: providerId, isActive: true });
        const deliverablePackages = [];

        const configsByMode = {};
        if (vendorProfile.deliveryProfile.deliveryConfigurations) {
            vendorProfile.deliveryProfile.deliveryConfigurations.forEach(config => {
                if (config.status) configsByMode[config.mode] = config;
            });
        }

        for (const pkg of packages) {
            const mode = pkg.deliveryMode || 'standard';
            const config = configsByMode[mode];
            if (!config) continue;

            let isPackageDeliverable = false;

            switch (config.coverageType) {
                case 'entire_zone':
                    // Map-based zone matching or state/city matching as a fallback
                    if (vendorProfile.zone && (pincodeDoc.state === vendorProfile.zone || pincodeDoc.city === vendorProfile.zone)) {
                        isPackageDeliverable = true;
                    }
                    break;

                case 'radius_based':
                    if (vendorProfile.latitude && vendorProfile.longitude) {
                        const distance = calculateDistance(
                            parseFloat(vendorProfile.latitude),
                            parseFloat(vendorProfile.longitude),
                            pincodeDoc.location.coordinates[1],
                            pincodeDoc.location.coordinates[0]
                        );
                        if (distance <= config.radius) isPackageDeliverable = true;
                    }
                    break;

                case 'selected_pincodes':
                    if (config.selectedPincodes && config.selectedPincodes.includes(pincodeStr)) {
                        isPackageDeliverable = true;
                    }
                    break;
            }

            if (isPackageDeliverable) {
                const pkgObj = pkg.toObject();
                pkgObj.calculatedShipping = { mode: config.mode, price: config.shippingPrice, coverageType: config.coverageType };
                deliverablePackages.push(pkgObj);
            }
        }

        res.status(200).json({
            success: true,
            isDeliverable: deliverablePackages.length > 0,
            pincodeData: {
                pincode: pincodeDoc.code,
                district: pincodeDoc.state,
                state: pincodeDoc.state,
                lat: pincodeDoc.location.coordinates[1],
                lng: pincodeDoc.location.coordinates[0]
            },
            data: deliverablePackages
        });
    } catch (error) {
        console.error('Error checking delivery availability:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
