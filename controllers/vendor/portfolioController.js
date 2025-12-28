const Portfolio = require("../../models/vendor/Portfolio");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");

const fs = require("fs");
const path = require("path");

// ------------------------------
// Helper: Delete file if exists
// ------------------------------
const deleteFileIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.log("Error deleting file:", err.message);
  }
};

// ------------------------------
// Helper: Parse tags
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
// Extract VIDEO LINK from iframe
// ------------------------------
const extractVideoLink = (input) => {
  if (!input) return null;

  // If iframe → extract src
  const iframeMatch = input.match(/src="([^"]+)"/);
  if (iframeMatch) return iframeMatch[1];

  // Convert normal Vimeo link → embed link
  const vimeoMatch = input.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return input;
};


exports.createPortfolio = async (req, res) => {
  try {
    const { providerId, workTitle, description, tags, module, videoLinks } =
      req.body;

    if (!providerId)
      return res
        .status(400)
        .json({ success: false, message: "Provider ID is required" });

    if (!module)
      return res
        .status(400)
        .json({ success: false, message: "Module is required" });

    // -------------------------------------------------
    // 🔐 SUBSCRIPTION CHECK (BLOCK FREE PLAN)
    // -------------------------------------------------
    const activeSubscription = await Subscription.findOne({
      userId: providerId,
      moduleId: module,
      status: "active",
    }).populate("planId");

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: "You need an active subscription to create portfolio",
      });
    }

    const plan = activeSubscription.planId;

    // If FREE plan → block
    if (!plan || plan.price === 0 || plan.planType === "free") {
      return res.status(403).json({
        success: false,
        message: "Upgrade your plan to add portfolio works",
      });
    }

    // -------------------------------------------------
    // CONTINUE NORMAL PORTFOLIO CREATION
    // -------------------------------------------------
    const parsedTags = parseTags(tags);
    const media = [];

    // IMAGES
    // if (req.files?.images) {
    //   const imgs = req.files.images.map(
    //     (f) => `uploads/portfolio/${f.filename}`
    //   );
    //   if (imgs.length > 0) {
    //     media.push({
    //       type: "image",
    //       images: imgs,
    //       isFeatured: false,
    //     });
    //   }
    // }
    // ================= IMAGES (THUMBNAIL + GALLERY) =================
if (req.files?.thumbnail || req.files?.images) {
  const thumbnail = req.files?.thumbnail
    ? `uploads/portfolio/${req.files.thumbnail[0].filename}`
    : null;

  const gallery = req.files?.images
    ? req.files.images.map(
        (f) => `uploads/portfolio/${f.filename}`
      )
    : [];

  media.push({
    type: "image",
    thumbnail,
    gallery,
    isFeatured: false
  });
}


    // VIDEOS
    if (req.files?.videos) {
      const vids = req.files.videos.map(
        (f) => `uploads/portfolio/${f.filename}`
      );
      if (vids.length > 0) {
        media.push({
          type: "video",
          videos: vids,
          isFeatured: false,
        });
      }
    }

    // VIDEO LINKS
    if (videoLinks) {
      let parsed = [];
      try {
        parsed = JSON.parse(videoLinks);
      } catch {
        parsed = [videoLinks];
      }

      const links = parsed.map((l) => extractVideoLink(l));

      if (links.length > 0) {
        media.push({
          type: "videoLink",
          videoLinks: links,
          isFeatured: false,
        });
      }
    }

    const newPortfolio = await Portfolio.create({
      provider: providerId,
      module,
      workTitle,
      description,
      tags: parsedTags,
      media,
    });

    return res.status(201).json({
      success: true,
      message: "Portfolio created successfully",
      data: newPortfolio,
    });
  } catch (err) {
    console.error("❌ Create Portfolio Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================================================
// ⭐ GET ALL PORTFOLIOS
// ========================================================
exports.getAllPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find()
      .sort({ createdAt: -1 })
      .populate("module", "title");

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
// ⭐ GET PORTFOLIO BY PROVIDER
// ========================================================
exports.getPortfolioByProvider = async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ provider: req.params.providerId })
      .sort({ createdAt: -1 })
      .populate("module", "title");

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
// ⭐ GET PORTFOLIO BY MODULE
// ========================================================
exports.getPortfolioByModule = async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ module: req.params.moduleId })
      .sort({ createdAt: -1 })
      .populate("module", "title");

    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Get Portfolio Module Error:", err);
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
    );

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
// ⭐ UPDATE PORTFOLIO
// ========================================================
exports.updatePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio)
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });

    const { workTitle, description, tags, videoLinks } = req.body;

    if (workTitle !== undefined) portfolio.workTitle = workTitle;
    if (description !== undefined) portfolio.description = description;
    if (tags) portfolio.tags = parseTags(tags);

    const media = [];

    // New images
   // ================= UPDATE IMAGES =================
if (req.files?.thumbnail || req.files?.images) {
  const thumbnail = req.files?.thumbnail
    ? `uploads/portfolio/${req.files.thumbnail[0].filename}`
    : portfolio.media.find(m => m.type === "image")?.thumbnail;

  const gallery = req.files?.images
    ? req.files.images.map(
        (f) => `uploads/portfolio/${f.filename}`
      )
    : portfolio.media.find(m => m.type === "image")?.gallery || [];

  media.push({
    type: "image",
    thumbnail,
    gallery,
    isFeatured: false
  });
}


    // New videos
    if (req.files?.videos) {
      const vids = req.files.videos.map(
        (f) => `uploads/portfolio/${f.filename}`
      );
      media.push({ type: "video", videos: vids, isFeatured: false });
    }

    // New video links
    if (videoLinks) {
      let parsed = [];
      try {
        parsed = JSON.parse(videoLinks);
      } catch {
        parsed = [videoLinks];
      }

      const links = parsed.map((link) => extractVideoLink(link));
      media.push({ type: "videoLink", videoLinks: links, isFeatured: false });
    }

    if (media.length > 0) {
      portfolio.media = media;
    }

    await portfolio.save();

    res.json({
      success: true,
      message: "Portfolio updated successfully",
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Update Portfolio Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================================================
// ⭐ DELETE PORTFOLIO
// ========================================================
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio)
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });

    // Delete all files associated
    portfolio.media.forEach(media => {
  if (media.thumbnail) {
    deleteFileIfExists(
      path.join(__dirname, "../../", media.thumbnail)
    );
  }

  if (media.gallery?.length) {
    media.gallery.forEach(img =>
      deleteFileIfExists(
        path.join(__dirname, "../../", img)
      )
    );
  }

  if (media.videos?.length) {
    media.videos.forEach(vid =>
      deleteFileIfExists(
        path.join(__dirname, "../../", vid)
      )
    );
  }
});


    await portfolio.deleteOne();

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

    const portfolio = await Portfolio.findById(workId);

    if (!portfolio)
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });

    const mediaItem = portfolio.media[mediaIndex];

    if (!mediaItem)
      return res
        .status(400)
        .json({ success: false, message: "Invalid media index" });

    mediaItem.isFeatured = !mediaItem.isFeatured;
    await portfolio.save();

    res.json({
      success: true,
      message: "Featured status toggled",
      data: portfolio,
    });
  } catch (err) {
    console.error("❌ Toggle Featured Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
