const Pincode = require('../../models/vendor/Pincode');
const VendorProfile = require('../../models/vendor/vendorProfile');
const Cake = require('../../models/vendor/cakePackageModel');
const Zone = require('../../models/admin/zone');
const { calculateDistance } = require('../../utils/geoUtils');
const mongoose = require('mongoose');

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
                { pincode: { $regex: search, $options: 'i' } },
                { area_name: { $regex: search, $options: 'i' } },
                { district_name: { $regex: search, $options: 'i' } }
            ];
        }

        const pincodes = await Pincode.find(query).populate('zone_id', 'name');
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

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusInKm = parseFloat(radius);

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

// ➤ Create Pincode (Admin)
exports.createPincode = async (req, res) => {
    try {
        let { pincode, area_name, district_name, zone_id, state, latitude, longitude, status,
            code, city, lat, lng } = req.body;

        // Fallback for older frontend field names
        if (!pincode && code) pincode = code;
        if (!area_name && city) area_name = city;
        if (!latitude && lat) latitude = lat;
        if (!longitude && lng) longitude = lng;

        // Handle zone lookup if only name is provided (common in older frontends)
        if ((!zone_id || !mongoose.Types.ObjectId.isValid(zone_id)) && state) {
            const zoneDoc = await Zone.findOne({ name: state });
            if (zoneDoc) {
                zone_id = zoneDoc._id;
                if (!district_name) district_name = zoneDoc.name;
            }
        }

        // Fallback for district_name
        if (!district_name && state) district_name = state;

        if (!pincode || !latitude || !longitude || !zone_id || !district_name) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing',
                received: { pincode, latitude, longitude, zone_id, district_name }
            });
        }

        const pincodeDoc = await Pincode.create({
            pincode,
            area_name,
            district_name,
            zone_id,
            state: state || 'Kerala, India',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            status: status !== undefined ? status : true,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });

        res.status(201).json({
            success: true,
            message: 'Pincode created successfully',
            data: pincodeDoc
        });
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
        let { latitude, longitude, lat, lng } = req.body;
        let updateData = { ...req.body };

        // Fallback for lat/lng
        if (!latitude && lat) latitude = lat;
        if (!longitude && lng) longitude = lng;

        if (latitude) updateData.latitude = parseFloat(latitude);
        if (longitude) updateData.longitude = parseFloat(longitude);

        if (latitude && longitude) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
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

        // 1. Fetch pincode coordinates
        const pincodeDoc = await Pincode.findOne({ pincode: pincodeStr, status: true });
        if (!pincodeDoc) {
            return res.status(404).json({ success: false, message: 'Pincode not serviceable or disabled by admin' });
        }

        // 2. Fetch vendor delivery profile
        const vendorProfile = await VendorProfile.findOne({ user: providerId });
        if (!vendorProfile || !vendorProfile.deliveryProfile) {
            return res.status(404).json({ success: false, message: 'Vendor delivery profile not found' });
        }

        // 3. Fetch all active packages for this vendor
        const packages = await Cake.find({ provider: providerId, isActive: true });

        const deliverablePackages = [];

        // 4. Map delivery configurations by mode for fast lookup
        const configsByMode = {};
        if (vendorProfile.deliveryProfile && vendorProfile.deliveryProfile.deliveryConfigurations) {
            vendorProfile.deliveryProfile.deliveryConfigurations.forEach(config => {
                if (config.status) {
                    configsByMode[config.mode] = config;
                }
            });
        }

        // 5. Apply coverage logic for each package
        for (const pkg of packages) {
            const mode = pkg.deliveryMode || 'standard';
            const config = configsByMode[mode];

            if (!config) continue; // This specific mode is not enabled/configured for the vendor

            let isPackageDeliverable = false;

            switch (config.coverageType) {
                case 'entire_zone':
                    // Zone match logic: compare pincode's zone with vendor's zone
                    if (vendorProfile.zone && pincodeDoc.zone_id &&
                        pincodeDoc.zone_id.toString() === vendorProfile.zone.toString()) {
                        isPackageDeliverable = true;
                    }
                    break;

                case 'radius_based':
                    // Radius distance check using Haversine formula
                    if (vendorProfile.latitude && vendorProfile.longitude) {
                        const distance = calculateDistance(
                            parseFloat(vendorProfile.latitude),
                            parseFloat(vendorProfile.longitude),
                            pincodeDoc.latitude,
                            pincodeDoc.longitude
                        );
                        if (distance <= config.radius) {
                            isPackageDeliverable = true;
                        }
                    }
                    break;

                case 'selected_pincodes':
                    // Selected pincode match logic
                    if (config.selectedPincodes && config.selectedPincodes.includes(pincodeStr)) {
                        isPackageDeliverable = true;
                    }
                    break;

                default:
                    // If no valid coverage type, assume not deliverable for this mode
                    break;
            }

            if (isPackageDeliverable) {
                // Add shipping detail to package object for the response
                const pkgObj = pkg.toObject();
                pkgObj.calculatedShipping = {
                    mode: config.mode,
                    price: config.shippingPrice,
                    coverageType: config.coverageType
                };
                deliverablePackages.push(pkgObj);
            }
        }

        res.status(200).json({
            success: true,
            isDeliverable: deliverablePackages.length > 0,
            pincodeData: {
                pincode: pincodeDoc.pincode,
                district: pincodeDoc.district_name,
                state: pincodeDoc.state,
                lat: pincodeDoc.latitude,
                lng: pincodeDoc.longitude,
                zone: pincodeDoc.zone_id
            },
            data: deliverablePackages
        });

    } catch (error) {
        console.error('Error checking delivery availability:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

