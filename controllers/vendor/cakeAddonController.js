const CakeAddon = require("../../models/vendor/cakeAddonModel");
const CakeAddonTemplate = require("../../models/vendor/cakeAddonTemplateModel");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");

// ========================

// ========================
// TEMPLATE CONTROLLERS
// ========================

exports.createTemplate = async (req, res) => {
    try {
        const { title, addonGroups, provider } = req.body;
        const vendorId = provider || req.user?._id;

        if (!vendorId) {
            return sendResponse(res, 400, false, "Provider is required");
        }

        const templateData = {
            title,
            addonGroups: Array.isArray(addonGroups) ? addonGroups : JSON.parse(addonGroups || "[]"),
            provider: vendorId,
            isDynamic: req.body.isDynamic === true || req.body.isDynamic === "true",
        };

        const template = await CakeAddonTemplate.create(templateData);
        sendResponse(res, 201, true, "Template created successfully", template);
    } catch (error) {
        console.error("CREATE TEMPLATE ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getTemplatesByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;
        const templates = await CakeAddonTemplate.find({ provider: providerId })
            .populate("addonGroups")
            .sort({ createdAt: -1 });

        // Logic for dynamic templates: automatically include ALL addons from the provider
        const formattedTemplates = await Promise.all(templates.map(async (temp) => {
            const t = temp.toObject();
            if (t.isDynamic) {
                const allAddons = await CakeAddon.find({ provider: providerId, isActive: true });
                t.addonGroups = allAddons.map(a => populateAddon(a, req));
            } else if (t.addonGroups) {
                t.addonGroups = t.addonGroups.map(a => populateAddon(a, req));
            }
            return t;
        }));

        sendResponse(res, 200, true, "Templates fetched successfully", formattedTemplates);
    } catch (error) {
        console.error("GET TEMPLATES ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const template = await CakeAddonTemplate.findById(req.params.id);
        if (!template) {
            return sendResponse(res, 404, false, "Template not found");
        }

        const { title, addonGroups, isActive, isDynamic } = req.body;
        if (title) template.title = title;
        if (addonGroups) template.addonGroups = Array.isArray(addonGroups) ? addonGroups : JSON.parse(addonGroups);
        if (isActive !== undefined) template.isActive = String(isActive) === "true";
        if (isDynamic !== undefined) template.isDynamic = String(isDynamic) === "true";

        await template.save();
        sendResponse(res, 200, true, "Template updated successfully", template);
    } catch (error) {
        console.error("UPDATE TEMPLATE ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        await CakeAddonTemplate.findByIdAndDelete(req.params.id);
        sendResponse(res, 200, true, "Template deleted successfully");
    } catch (error) {
        console.error("DELETE TEMPLATE ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

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
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const result = addon.toObject();

  result.image = result.image.startsWith("http")
    ? result.image
    : `${baseUrl}${normalizeUploadPath(result.image)}`;

  return result;
};


exports.createAddon = async (req, res) => {
  try {
    const { title, price, provider } = req.body;
    const vendorId = provider || req.user?._id;

    if (!vendorId) {
      return sendResponse(res, 400, false, "Provider is required");
    }

    if (!req.file) {
      return sendResponse(res, 400, false, "Addon image is required");
    }

    const addon = await CakeAddon.create({
      title,
      price,
      provider: vendorId,
      image: req.file.path,
    });

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

    const { title, price } = req.body;

    if (title) addon.title = title;
    if (price !== undefined) addon.price = price;

    if (req.file) {
      if (addon.image) await deleteFiles([addon.image]);
      addon.image = req.file.path;
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

if (addon.image) await deleteFiles([addon.image]);
        await addon.deleteOne();

        sendResponse(res, 200, true, "Addon deleted successfully");
    } catch (error) {
        console.error("DELETE ADDON ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};
