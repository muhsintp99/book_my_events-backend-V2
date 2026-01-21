const CakeAddon = require("../../models/vendor/cakeAddonModel");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");

const normalizeUploadPath = (filePath) => {
    if (!filePath) return filePath;
    const normalized = filePath.replace(/\\/g, "/");
    const index = normalized.toLowerCase().indexOf("/uploads");
    return index !== -1 ? normalized.substring(index) : normalized;
};

const sendResponse = (res, status, success, message, data = null) => {
    const response = { success, message };
    if (data) response.data = data;
    return res.status(status).json(response);
};

const deleteFiles = async (files = []) => {
    if (!files.length) return;
    await Promise.all(
        files.map(async (file) => {
            try {
                await fs.unlink(path.resolve(file));
            } catch (err) {
                if (err.code !== "ENOENT") console.error("Delete error:", err);
            }
        })
    );
};

const populateAddon = (addon, req) => {
    const baseUrl = req ? `${req.protocol}://${req.get("host")}` : "";
    const result = addon.toObject ? addon.toObject() : addon;

    if (result.icon) {
        result.icon = result.icon.startsWith("http")
            ? result.icon
            : `${baseUrl}${normalizeUploadPath(result.icon)}`;
    }
    return result;
};

exports.createAddon = async (req, res) => {
    try {
        const { title, description, priceList, provider } = req.body;
        const vendorId = provider || req.user?._id;

        if (!vendorId) {
            return sendResponse(res, 400, false, "Provider is required");
        }

        const parsedPriceList = typeof priceList === "string" ? JSON.parse(priceList) : priceList;

        const addonData = {
            title,
            description,
            priceList: parsedPriceList || [],
            provider: vendorId,
        };

        if (req.file) {
            addonData.icon = req.file.path;
        }

        const addon = await CakeAddon.create(addonData);
        sendResponse(res, 201, true, "Addon created successfully", populateAddon(addon, req));
    } catch (error) {
        if (req.file) await deleteFiles([req.file.path]);
        console.error("CREATE ADDON ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getAddonsByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return sendResponse(res, 400, false, "Invalid provider ID");
        }

        const addons = await CakeAddon.find({ provider: providerId }).sort({ createdAt: -1 });
        const formatted = addons.map((a) => populateAddon(a, req));

        sendResponse(res, 200, true, "Addons fetched successfully", formatted);
    } catch (error) {
        console.error("GET ADDONS ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.updateAddon = async (req, res) => {
    try {
        const addon = await CakeAddon.findById(req.params.id);
        if (!addon) {
            return sendResponse(res, 404, false, "Addon not found");
        }

        if (req.user?.role === "vendor" && addon.provider.toString() !== req.user._id.toString()) {
            return sendResponse(res, 403, false, "Unauthorized");
        }

        const { title, description, priceList } = req.body;
        if (title) addon.title = title;
        if (description) addon.description = description;
        if (priceList) addon.priceList = typeof priceList === "string" ? JSON.parse(priceList) : priceList;

        if (req.file) {
            if (addon.icon) await deleteFiles([addon.icon]);
            addon.icon = req.file.path;
        }

        await addon.save();
        sendResponse(res, 200, true, "Addon updated successfully", populateAddon(addon, req));
    } catch (error) {
        console.error("UPDATE ADDON ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.deleteAddon = async (req, res) => {
    try {
        const addon = await CakeAddon.findById(req.params.id);
        if (!addon) {
            return sendResponse(res, 404, false, "Addon not found");
        }

        if (req.user?.role === "vendor" && addon.provider.toString() !== req.user._id.toString()) {
            return sendResponse(res, 403, false, "Unauthorized");
        }

        if (addon.icon) await deleteFiles([addon.icon]);
        await addon.deleteOne();

        sendResponse(res, 200, true, "Addon deleted successfully");
    } catch (error) {
        console.error("DELETE ADDON ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};
