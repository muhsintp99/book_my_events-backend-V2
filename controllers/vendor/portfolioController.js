const Portfolio = require("../../models/vendor/Portfolio");
const fs = require("fs");
const path = require("path");

// ------------------------------
// Helper: Parse Tags String / JSON / Array
// ------------------------------
const parseTags = (tags) => {
  if (!tags) return [];
  try {
    return Array.isArray(tags) ? tags : JSON.parse(tags);
  } catch {
    return [tags];
  }
};

// ------------------------------
// Extract Video Link From Iframe
// ------------------------------
const extractVideoLink = (input) => {
  if (!input) return null;

  // Check iframe src
  const match = input.match(/src="([^"]+)"/);
  return match ? match[1] : input;
};

// ========================================================
// ⭐ CREATE PORTFOLIO WORK (FINAL CLEAN VERSION)
// ========================================================
exports.createPortfolio = async (req, res) => {
  try {
    const { providerId, workTitle, description, tags, module, videoLinks } = req.body;

    if (!providerId) {
      return res.status(400).json({ success: false, message: "Provider ID is required" });
    }

    if (!module) {
      return res.status(400).json({ success: false, message: "Module is required" });
    }

    const parsedTags = parseTags(tags);
    const media = [];

    // ---------------------------
    // IMAGES
    // ---------------------------
    if (req.files?.images) {
      media.push({
        type: "image",
        images: req.files.images.map((f) => `uploads/portfolio/${f.filename}`),
        isFeatured: false
      });
    }

    // ---------------------------
    // UPLOADED VIDEOS
    // ---------------------------
    if (req.files?.videos) {
      media.push({
        type: "video",
        videos: req.files.videos.map((f) => `uploads/portfolio/${f.filename}`),
        isFeatured: false
      });
    }

    // ---------------------------
    // VIDEO LINKS (YOUTUBE / VIMEO)
    // ---------------------------
    if (videoLinks) {
      let parsedLinks = [];

      try {
        parsedLinks = JSON.parse(videoLinks);
      } catch {
        parsedLinks = [videoLinks];
      }

      const cleanedLinks = parsedLinks.map((item) => extractVideoLink(item));

      media.push({
        type: "videoLink",
        videoLinks: cleanedLinks,
        isFeatured: false
      });
    }

    // ---------------------------
    // SAVE PORTFOLIO
    // ---------------------------
    const newPortfolio = await Portfolio.create({
      provider: providerId,
      module: module,
      workTitle,
      description,
      tags: parsedTags,
      media
    });

    res.status(201).json({
      success: true,
      message: "Portfolio created",
      data: newPortfolio
    });

  } catch (err) {
    console.error("❌ Portfolio Creation Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ GET PORTFOLIO BY PROVIDER
// ========================================================
exports.getPortfolioByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    const portfolio = await Portfolio.find({ provider: providerId })
      .sort({ createdAt: -1 })
      .populate("module", "title"); // ⭐ Only title

    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Get Portfolio Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ GET PORTFOLIO BY PROVIDER + MODULE
// ========================================================
exports.getPortfolioByProviderAndModule = async (req, res) => {
  try {
    const { providerId, moduleId } = req.params;

    const portfolio = await Portfolio.find({
      provider: providerId,
      module: moduleId,
    })
      .sort({ createdAt: -1 })
      .populate("module", "title"); // ⭐ Only title

    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Get Portfolio By Provider & Module Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ GET PORTFOLIO BY MODULE (SEPARATE ROUTE)
// ========================================================
exports.getPortfolioByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const portfolio = await Portfolio.find({ module: moduleId })
      .sort({ createdAt: -1 })
      .populate("module", "title"); // ⭐ Only title

    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Get Portfolio By Module Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ GET SINGLE PORTFOLIO
// ========================================================
exports.getPortfolioById = async (req, res) => {
  try {
    const item = await Portfolio.findById(req.params.id).populate(
      "module",
      "title"
    ); // ⭐ Only title

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("❌ Get Portfolio Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ UPDATE PORTFOLIO WORK
// ========================================================
exports.updatePortfolio = async (req, res) => {
  try {
    const work = await Portfolio.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    const { workTitle, description, tags } = req.body;

    if (workTitle !== undefined) work.workTitle = workTitle;
    if (description !== undefined) work.description = description;
    if (tags) work.tags = parseTags(tags);

    // If new media uploaded → replace old media
    if (req.files && req.files.length > 0) {
      work.media.forEach((m) =>
        deleteFileIfExists(path.join(__dirname, "../../", m.url))
      );

      work.media = req.files.map((file) => ({
        url: `uploads/portfolio/${file.filename}`,
        type: file.mimetype.startsWith("video") ? "video" : "image",
        isFeatured: false,
      }));
    }

    await work.save();

    const updated = await Portfolio.findById(work._id).populate(
      "module",
      "title"
    ); // ⭐ Only title

    res.json({
      success: true,
      message: "Portfolio updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Update Portfolio Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ GET ALL PORTFOLIO WORKS
// ========================================================
exports.getAllPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find()
      .sort({ createdAt: -1 })
      .populate("module", "title"); // Only show module title

    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Get All Portfolio Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ DELETE PORTFOLIO
// ========================================================
exports.deletePortfolio = async (req, res) => {
  try {
    const work = await Portfolio.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    work.media.forEach((m) =>
      deleteFileIfExists(path.join(__dirname, "../../", m.url))
    );

    await work.deleteOne();

    res.json({
      success: true,
      message: "Portfolio deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete Portfolio Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ TOGGLE FEATURED MEDIA
// ========================================================
exports.toggleFeaturedMedia = async (req, res) => {
  try {
    const { workId, mediaIndex } = req.params;

    const work = await Portfolio.findById(workId).populate("module", "title");

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    if (!work.media[mediaIndex]) {
      return res.status(400).json({
        success: false,
        message: "Invalid media index",
      });
    }

    work.media[mediaIndex].isFeatured = !work.media[mediaIndex].isFeatured;

    await work.save();

    const updated = await Portfolio.findById(work._id).populate(
      "module",
      "title"
    );

    res.json({
      success: true,
      message: "Featured status toggled",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Toggle Featured Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
