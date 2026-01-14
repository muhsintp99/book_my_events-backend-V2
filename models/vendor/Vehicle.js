const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a vehicle name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
      validate: {
        validator: (v) => /^[a-zA-Z0-9\s\-\(\)]+$/.test(v),
        message:
          "Name can only contain letters, numbers, spaces, hyphens, and parentheses",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
    },
    latitude: { type: Number },
    longitude: { type: Number },
    model: { type: String, trim: true },
transmissionType: {
  type: String,
  enum: ["manual", "automatic", "semi-automatic"],
  required: false,
  lowercase: true,
  trim: true,
},

enginePower: {
  type: Number, // hp
  min: [0, "Engine power cannot be negative"],
},

    seatingCapacity: {
      type: Number,
      min: [1, "Seating capacity must be at least 1"],
    },
    airCondition: {
      type: Boolean,
      default: false,
    },
features: {
  driverIncluded: {
    type: Boolean,
    default: false,
  },
  sunroof: {
    type: Boolean,
    default: false,
  },
  decorationAvailable: {
    type: Boolean,
    default: false,
  },
},

    pricing: {
      hourly: { type: Number, default: 0, min: 0 },
      perDay: { type: Number, default: 0, min: 0 },
      distanceWise: { type: Number, default: 0, min: 0 },
    },
    advanceBookingAmount: {
      type: Number,
      default: 0,
      min: [0, "Advance booking amount cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    images: [{ type: String }],
    thumbnail: { type: String },
    searchTags: [{ type: String }],
    vinNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => !v || v.length === 17,
        message: "VIN must be 17 characters if provided",
      },
    },
    
    licensePlateNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => !v || /^[A-Z0-9-]{1,10}$/.test(v),
        message: "Invalid license plate number",
      },
    },
    documents: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Instance method to calculate distance from given coordinates
VehicleSchema.methods.calculateDistance = function (latitude, longitude) {
  if (!this.latitude || !this.longitude) return null;

  const R = 6371;
  const dLat = ((this.latitude - latitude) * Math.PI) / 180;
  const dLon = ((this.longitude - longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude * Math.PI) / 180) *
      Math.cos((this.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
};

// Static method to find vehicles within radius
VehicleSchema.statics.findWithinRadius = async function (
  latitude,
  longitude,
  radiusKm = 10
) {
  const vehicles = await this.find({
    latitude: { $exists: true, $ne: null },
    longitude: { $exists: true, $ne: null },
    isActive: true,
  }).lean();

  return vehicles
    .filter((vehicle) => {
      const distance = this.prototype.calculateDistance.call(
        vehicle,
        latitude,
        longitude
      );
      return distance !== null && distance <= radiusKm;
    })
    .map((vehicle) => ({
      ...vehicle,
      distance: this.prototype.calculateDistance.call(
        vehicle,
        latitude,
        longitude
      ),
      distanceUnit: "km",
    }))
    .sort((a, b) => a.distance - b.distance);
};

// Static method for advanced search
VehicleSchema.statics.advancedSearch = async function (filters) {
  const query = { isActive: true };

  if (filters.keyword) {
    const keywordRegex = new RegExp(filters.keyword, "i");
    query.$or = [
      { name: keywordRegex },
      { description: keywordRegex },
      { model: keywordRegex },
      { searchTags: { $in: [keywordRegex] } },
    ];
  }

  if (filters.brandId) {
    query.brand = { $in: filters.brandId };
  }

  if (filters.categoryId) {
    query.category = { $in: filters.categoryId };
  }

  // ❌ REMOVED: type filter completely removed

  


  if (filters.airCondition !== undefined) {
    query.airCondition = filters.airCondition;
  }

  if (filters.minCapacity) {
    query.seatingCapacity = { $gte: filters.minCapacity };
  }

  if (filters.latitude && filters.longitude) {
    query.latitude = { $exists: true, $ne: null };
    query.longitude = { $exists: true, $ne: null };
  }

  return this.find(query)
    .populate("brand")
    .populate({
      path: "category",
      model: "Category",
      select: "title image isActive subCategories",
    })
    .populate("provider")
    .populate("zone")
    .lean();
};

// Pre-save middleware to update searchTags
VehicleSchema.pre("save", function (next) {
  if (!this.searchTags) {
    this.searchTags = [];
  }

  if (this.isModified("searchTags") && this.searchTags.length > 0) {
    const parsedTags = [];
    this.searchTags.forEach((tag) => {
      if (typeof tag === "string") {
        try {
          const parsed = JSON.parse(tag);
          if (Array.isArray(parsed)) {
            parsedTags.push(...parsed.map((t) => t.trim().toLowerCase()));
          } else {
            parsedTags.push(tag.trim().toLowerCase());
          }
        } catch {
          parsedTags.push(tag.trim().toLowerCase());
        }
      }
    });
    this.searchTags = [...new Set(parsedTags.filter((tag) => tag))];
  }

  if (this.name && !this.searchTags.includes(this.name.toLowerCase())) {
    this.searchTags.push(this.name.toLowerCase());
  }

  if (this.model) {
    const modelParts = this.model
      .split(" ")
      .map((part) => part.trim().toLowerCase());
    modelParts.forEach((part) => {
      if (part && !this.searchTags.includes(part)) {
        this.searchTags.push(part);
      }
    });
  }

  next();
});

// Pre-update middleware
VehicleSchema.pre("findOneAndUpdate", function (next) {
  this.options.runValidators = true;
  this.options.new = true;

  const update = this.getUpdate();
  if (update.searchTags) {
    let parsedTags = [];
    if (typeof update.searchTags === "string") {
      try {
        parsedTags = JSON.parse(update.searchTags);
        if (!Array.isArray(parsedTags)) {
          parsedTags = [update.searchTags];
        }
      } catch {
        parsedTags = update.searchTags.split(",").map((tag) => tag.trim());
      }
    } else if (Array.isArray(update.searchTags)) {
      parsedTags = update.searchTags;
    }
    update.searchTags = [
      ...new Set(
        parsedTags
          .flat()
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag)
      ),
    ];
  }

  next();
});

// Post-save middleware for logging
VehicleSchema.post("save", function (doc) {
  console.log(`Vehicle ${doc.name} has been saved with ID: ${doc._id}`);
});

// Error handling middleware
VehicleSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("A vehicle with this information already exists"));
  } else {
    next(error);
  }
});

VehicleSchema.index({ provider: 1, isActive: 1 });
VehicleSchema.index({ brand: 1, category: 1 });
VehicleSchema.index({ zone: 1 });
VehicleSchema.index({ latitude: 1, longitude: 1 });
VehicleSchema.index({ airCondition: 1, isActive: 1 });
VehicleSchema.index({ rating: -1, isActive: 1 });
VehicleSchema.index({ totalTrips: -1, isActive: 1 });
VehicleSchema.index({ seatingCapacity: 1, isActive: 1 });
VehicleSchema.index({
  name: "text",
  description: "text",
  model: "text",
  searchTags: "text",
});


module.exports = mongoose.model("Vehicle", VehicleSchema);
