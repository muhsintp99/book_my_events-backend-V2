const mongoose = require("mongoose");
const VendorProfile = require("../models/vendor/vendorProfile");

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

    // 2. Fetch VendorProfile linked to this user
    const vendorProfile = await VendorProfile.findOne({ user: providerId })
        .select("storeName logo coverImage zone storeAddress latitude longitude")
        .populate("zone", "name description icon")
        .lean();

    if (vendorProfile) {
        providerObj.storeName = vendorProfile.storeName || `${providerObj.firstName || ""} ${providerObj.lastName || ""}`.trim();
        providerObj.logo = vendorProfile.logo
            ? (vendorProfile.logo.startsWith("http") ? vendorProfile.logo : `${baseUrl}${vendorProfile.logo}`)
            : (providerObj.profilePhoto ? (providerObj.profilePhoto.startsWith("http") ? providerObj.profilePhoto : `${baseUrl}${providerObj.profilePhoto}`) : null);

        providerObj.coverImage = vendorProfile.coverImage
            ? (vendorProfile.coverImage.startsWith("http") ? vendorProfile.coverImage : `${baseUrl}${vendorProfile.coverImage}`)
            : null;

        providerObj.zone = vendorProfile.zone;
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

    return providerObj;
};

module.exports = { enhanceProviderDetails };
