const mongoose = require("mongoose");

const vehicleBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Vehicle banner title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  image: {
    type: String,
    required: [true, "Vehicle banner image is required"],
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Zone",
    required: [true, "Zone is required"],
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  vehicleCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleCategory",
  },
  bannerType: {
    type: String,
    enum: {
      values: ["top_deal", "cash_back", "zone_wise"],
      message:
        "{VALUE} is not a valid banner type. Valid types are: top_deal, cash_back, zone_wise",
    },
    required: [true, "Banner type is required"],
  },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  clickCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true,
});

// Normalize bannerType
vehicleBannerSchema.pre("validate", function (next) {
  if (this.bannerType && typeof this.bannerType === "string") {
    this.bannerType = this.bannerType.toLowerCase().trim();
  }
  next();
});

vehicleBannerSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.bannerType) update.bannerType = update.bannerType.toLowerCase().trim();
  if (update.$set && update.$set.bannerType)
    update.$set.bannerType = update.$set.bannerType.toLowerCase().trim();
  next();
});

// Indexes
vehicleBannerSchema.index({ zone: 1, isActive: 1 });
vehicleBannerSchema.index({ bannerType: 1 });
vehicleBannerSchema.index({ isFeatured: 1, isActive: 1 });
vehicleBannerSchema.index({ displayOrder: 1 });
vehicleBannerSchema.index({ startDate: 1, endDate: 1 });
vehicleBannerSchema.index({ vendor: 1, isActive: 1 });

module.exports = mongoose.model("VehicleBanner", vehicleBannerSchema);
