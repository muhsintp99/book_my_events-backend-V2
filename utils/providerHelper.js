const VendorProfile = require("../models/vendor/vendorProfile");
const Pincode = require("../models/vendor/Pincode");
const Subscription = require("../models/admin/Subscription");
const mongoose = require("mongoose");

/**
 * Standardizes provider data with full store and location details.
 * @param {Object} providerObj - The populated User object.
 * @param {Object} req - Request object for baseUrl.
 * @returns {Promise<Object>} - The enhanced provider object.
 */
const enhanceProviderDetails = async (providerInput, req = null) => {
    const baseUrl = req
        ? `${req.protocol}://${req.get("host")}`
        : "https://api.bookmyevent.ae";

    let providerObj = providerInput;
    let providerId = null;

    // 1. Identify Provider ID
    if (!providerInput) return null;

    if (typeof providerInput === 'string' || providerInput instanceof mongoose.Types.ObjectId) {
        providerId = providerInput.toString();
        // Fetch the user object if only ID was provided
        const User = mongoose.model("User");
        providerObj = await User.findById(providerId).select("firstName lastName email phone profilePhoto").lean();
        if (!providerObj) return null;
    } else {
        providerId = providerInput._id?.toString();
        providerObj = providerInput.toObject ? providerInput.toObject() : providerInput;
    }

    if (!providerId) return providerObj;

    // 2. Fetch ANY approved VendorProfile linked to this user
    // We fetch all approved ones and prioritize the one that has zones populated
    const vendorProfiles = await VendorProfile.find({
        user: providerId,
        status: { $ne: "rejected" },
        isActive: true
    })
        .sort({ status: 1 }) // "approved" comes before "pending" alphabetically (wait, no)
        .select("storeName logo coverImage zones storeAddress latitude longitude status")
        .populate("zones", "name description icon")
        .lean();

    // Prioritize "approved" status, then prioritize profile with zones
    let vendorProfile = vendorProfiles.find(p => p.status === "approved" && p.zones && p.zones.length > 0)
        || vendorProfiles.find(p => p.status === "approved")
        || vendorProfiles.find(p => p.zones && p.zones.length > 0)
        || vendorProfiles[0];

    // ✅ GEOGRAPHIC & ADDRESS FALLBACK: If NO profiles have zones, try nearest district by coordinates or address text
    if ((!vendorProfile || !vendorProfile.zones || vendorProfile.zones.length === 0)) {
        try {
            const Zone = mongoose.model("Zone");
            const allZones = await Zone.find({ isActive: true }).select("name").lean();
            let guessedZone = null;

            // A. Geography matching (Priority)
            if (providerObj.latitude && providerObj.longitude) {
                const nearestPincode = await Pincode.findOne({
                    location: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: [parseFloat(providerObj.longitude), parseFloat(providerObj.latitude)],
                            },
                            $maxDistance: 50000,
                        },
                    },
                })
                    .populate("zone_id", "name")
                    .lean();

                if (nearestPincode) {
                    if (nearestPincode.zone_id) {
                        guessedZone = nearestPincode.zone_id;
                    } else {
                        const possibleName = nearestPincode.city || nearestPincode.state;
                        guessedZone = allZones.find(z => z.name.toLowerCase() === possibleName?.toLowerCase());
                        if (!guessedZone && possibleName) guessedZone = { _id: null, name: possibleName };
                    }
                    if (!vendorProfile) vendorProfile = { storeAddress: { city: nearestPincode.city } };
                }
            }

            // B. Address text matching (Fallback if Geography failed or missing)
            if (!guessedZone) {
                const addressText = `${vendorProfile?.storeAddress?.fullAddress || ""} ${vendorProfile?.storeAddress?.city || ""} ${providerObj.storeAddress?.fullAddress || ""}`.toLowerCase();
                let searchStr = addressText;
                if (searchStr.includes("calicut")) searchStr += " kozhikode";
                if (searchStr.includes("kochi") || searchStr.includes("cochin")) searchStr += " ernakulam";
                if (searchStr.includes("trivandrum")) searchStr += " thiruvananthapuram";

                guessedZone = allZones.find(z => searchStr.includes(z.name.toLowerCase()));
            }

            if (guessedZone) {
                if (!vendorProfile) vendorProfile = { zones: [] };
                vendorProfile.zones = [guessedZone];
            }
        } catch (e) {
            console.error("Advanced fallback error in helper:", e.message);
        }
    }

    if (vendorProfile) {
        providerObj.storeName = vendorProfile.storeName || `${providerObj.firstName || ""} ${providerObj.lastName || ""}`.trim();
        providerObj.logo = vendorProfile.logo
            ? (vendorProfile.logo.startsWith("http") ? vendorProfile.logo : `${baseUrl}${vendorProfile.logo}`)
            : (providerObj.profilePhoto ? (providerObj.profilePhoto.startsWith("http") ? providerObj.profilePhoto : `${baseUrl}${providerObj.profilePhoto}`) : null);

        providerObj.coverImage = vendorProfile.coverImage
            ? (vendorProfile.coverImage.startsWith("http") ? vendorProfile.coverImage : `${baseUrl}${vendorProfile.coverImage}`)
            : null;

        providerObj.zone = vendorProfile.zones?.[0] || null;
        providerObj.zones = vendorProfile.zones || [];
        providerObj.storeAddress = vendorProfile.storeAddress;
        providerObj.latitude = vendorProfile.latitude;
        providerObj.longitude = vendorProfile.longitude;
        providerObj.hasVendorProfile = true;
    } else {
        providerObj.storeName = `${providerObj.firstName || ""} ${providerObj.lastName || ""}`.trim() || providerObj.email || "Vendor";
        providerObj.logo = providerObj.profilePhoto
            ? (providerObj.profilePhoto.startsWith("http") ? providerObj.profilePhoto : `${baseUrl}${providerObj.profilePhoto}`)
            : null;
        providerObj.hasVendorProfile = false;
    }

    // 4. Fetch CURRENT Subscription details
    const sub = await Subscription.findOne({
        userId: providerId,
        isCurrent: true,
    })
        .populate("planId")
        .populate("moduleId", "title icon")
        .lean();

    const now = new Date();
    const isExpired = sub ? sub.endDate < now : true;
    const daysLeft = sub
        ? Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24)))
        : 0;

    providerObj.subscription = sub
        ? {
            isSubscribed: sub.status === "active",
            status: sub.status,
            plan: sub.planId,
            module: sub.moduleId,
            billing: {
                startDate: sub.startDate,
                endDate: sub.endDate,
                paymentId: sub.paymentId,
                autoRenew: sub.autoRenew
            },
            access: {
                canAccess: sub.status === "active" && !isExpired,
                isExpired,
                daysLeft
            }
        }
        : {
            isSubscribed: false,
            status: "none",
            plan: null,
            module: null,
            billing: null,
            access: {
                canAccess: false,
                isExpired: true,
                daysLeft: 0
            }
        };

    return providerObj;
};

module.exports = { enhanceProviderDetails };
