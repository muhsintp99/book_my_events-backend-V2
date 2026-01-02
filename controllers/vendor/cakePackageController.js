const Cake = require("../../models/vendor/cakePackageModel");

/* ================= CREATE CAKE ================= */
exports.createCake = async (req, res) => {
  try {
    const body = req.body;

    const cake = await Cake.create({
      name: body.name,
      shortDescription: body.shortDescription,
      category: body.category,

      itemType: body.itemType,
      isHalal: body.isHalal === "true",
      isActive: body.isActive === "true",
      isTopPick: body.isTopPick === "true",

      nutrition: body.nutrition ? JSON.parse(body.nutrition) : [],
      allergenIngredients: body.allergenIngredients
        ? JSON.parse(body.allergenIngredients)
        : [],

      variations: body.variations ? JSON.parse(body.variations) : [],
      searchTags: body.searchTags ? JSON.parse(body.searchTags) : [],
      subCategories: body.subCategories ? JSON.parse(body.subCategories) : [],

      timeSchedule: body.timeSchedule
        ? JSON.parse(body.timeSchedule)
        : {},

      priceInfo: body.priceInfo
        ? JSON.parse(body.priceInfo)
        : {},

      thumbnail: req.files?.thumbnail?.[0]?.path,
      images: req.files?.images?.map(f => f.path) || []
    });

    return res.status(201).json({
      success: true,
      message: "Cake package created successfully",
      data: cake
    });
  } catch (error) {
    console.error("CREATE CAKE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/* ================= GET ALL CAKES ================= */
exports.getAllCakes = async (req, res) => {
  try {
    const cakes = await Cake.find()
      .populate("store category subCategories provider")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cakes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= GET SINGLE CAKE ================= */
exports.getCakeById = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id)
      .populate("store category subCategories provider");

    if (!cake) {
      return res.status(404).json({
        success: false,
        message: "Cake not found"
      });
    }

    res.json({
      success: true,
      data: cake
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= UPDATE CAKE ================= */
exports.updateCake = async (req, res) => {
  try {
    const cake = await Cake.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!cake) {
      return res.status(404).json({
        success: false,
        message: "Cake not found"
      });
    }

    res.json({
      success: true,
      message: "Cake updated successfully",
      data: cake
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= DELETE CAKE ================= */
exports.deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);

    if (!cake) {
      return res.status(404).json({
        success: false,
        message: "Cake not found"
      });
    }

    res.json({
      success: true,
      message: "Cake deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
