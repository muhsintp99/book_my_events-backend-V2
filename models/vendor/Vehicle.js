const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    // Basic fields (KEEP - not replaced)
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // General Information (additional info)
    generalInformation: {
      type: String,
      trim: true,
      maxlength: [500, "General information cannot exceed 500 characters"],
    },

    // Featured Image
    featuredImage: {
      type: String,
    },

    // Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    // Subcategory - References Category model (admin can add dynamically)
    // For Car: SUV, Sedan, Jeep, etc.
    // For Bus: Mini Bus, Standard Bus, Luxury Bus, etc.
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    // Gallery
    galleryImages: [{
      type: String,
    }],

    // Basic Info (Brand/Model)
    basicInfo: {
      type: String,
      trim: true,
    },

    yearOfManufacture: {
      type: Number,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    model: {
      type: String,
      trim: true,
    },

    // Capacity & Comfort
    capacityAndComfort: {
      seatingCapacity: { type: Number, min: 0 },
      legroomType: { type: String, trim: true }, // Standard, Extra, etc.
      pushbackSeats: { type: Boolean, default: false },
      reclinerSeats: { type: Boolean, default: false },
      numberOfSeats: {
        value: { type: Number, min: 0, default: 0 },
        available: { type: Boolean, default: false },
      },
      numberOfDoors: {
        value: { type: Number, min: 0, default: 0 },
        available: { type: Boolean, default: false },
      },
    },

    // Engine & Drive
    engineCharacteristics: {
      transmissionType: {
        value: {
          type: String,
          enum: ["manual", "automatic", "semi-automatic"],
          lowercase: true,
        },
        available: { type: Boolean, default: false },
      },
      engineCapacityCC: { type: Number, min: 0 },
      powerBHP: { type: Number, min: 0 },
      torque: { type: String, trim: true },
      mileage: { type: String, trim: true },
      driveControl: {
        type: String,
        enum: ["FWD", "RWD", "AWD", "4WD"],
        uppercase: true,
      },
      fuelType: {
        type: String,
        enum: ["petrol", "diesel", "cng", "lpg", "electric", "hybrid"],
        lowercase: true,
      },
      coolingSystem: { type: String, trim: true },
      brakeType: { type: String, trim: true },
      airConditioning: { type: Boolean, default: false },
    },

    // Location
    location: {
      address: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
    },

    // Availability (Bus/Van specific)
    availability: {
      driverIncluded: { type: Boolean, default: false },
      sunroof: { type: Boolean, default: false },
      acAvailable: { type: Boolean, default: false },
    },

    // Features - Category-specific (flexible structure)
    // For Car: heatingAndAC, gpsSystem, entertainmentAndConnectivity, etc.
    // For Bus: heatingAndAC, gpsSystem, safetyCompliance, cameras, etc.
    // For Bike: Different set of features
    features: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Extra Addons (NO PRICING - just checkboxes)
    extraAddons: {
      wifi: { type: Boolean, default: false },
      chargingPorts: { type: Boolean, default: false },
      interiorLighting: { type: Boolean, default: false },
      powerLuggage: { type: Boolean, default: false },
      electricRecliner: { type: Boolean, default: false },
    },



    // Pricing Structure
    pricing: {
      // Basic Package
      basicPackage: {
        price: {
          type: Number,
          default: 0,
          min: [0, "Basic package price cannot be negative"],
        },
        includedKilometers: {
          type: Number,
          default: 0,
          min: [0, "Included kilometers cannot be negative"],
        },
        includedHours: {
          type: Number,
          default: 0,
          min: [0, "Included hours cannot be negative"],
        },
      },

      // Additional Pricing
      extraKmPrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      extraHourPrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      discount: {
        type: {
          type: String,
          enum: ["percentage", "flat_rate"],
          lowercase: true,
        },
        value: { type: Number, default: 0, min: 0 },
      },
      decoration: {
        available: { type: Boolean, default: false },
        price: { type: Number, default: 0, min: 0 },
      },
      grandTotal: {
        type: Number,
        default: 0,
        min: [0, "Grand total cannot be negative"],
      },
    },

    // Advance Booking Amount 
    advanceBookingAmount: {
      type: Number,
      default: 0,
      min: [0, "Advance booking amount cannot be negative"],
    },



    // Car-specific fields
    vehicleType: {
      type: String,
      enum: ["standard", "electric", "luxury", "vintage"],
      lowercase: true,
    },

    // Vehicle Documents
    vehicleDocuments: [{
      type: String,
    }],

    // Bike-specific fields
    bikeType: {
      type: String,
      enum: ["sports", "cruiser", "standard", "touring", "off-road"],
      lowercase: true,
    },
    engineCapacity: {
      type: Number,
      min: [0, "Engine capacity cannot be negative"],
    },
    numberOfGears: {
      type: Number,
      min: [1, "Number of gears must be at least 1"],
    },

    // Vehicle Identity (KEEP - license plate number)
    licensePlateNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },



    // Terms & Conditions
    termsAndConditions: [{
      heading: { type: String, trim: true },
      points: [{ type: String, trim: true }]
    }],

    generalConditions: {
      type: String,
      trim: true,
    },

    // System fields (KEEP - not in creation form but needed)
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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
  },
  { timestamps: true }
);

// Indexes for performance
VehicleSchema.index({ provider: 1, isActive: 1 });
VehicleSchema.index({ brand: 1, category: 1 });
VehicleSchema.index({ zone: 1 });
VehicleSchema.index({ "location.latitude": 1, "location.longitude": 1 });
VehicleSchema.index({ isActive: 1 });
VehicleSchema.index({ rating: -1, isActive: 1 });
VehicleSchema.index({ totalTrips: -1, isActive: 1 });

// ================= STATIC METHODS =================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} Distance in kilometers
 */
VehicleSchema.statics.calculateDistance = function (lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find vehicles within a specific radius
 * @param {Number} latitude - Center latitude
 * @param {Number} longitude - Center longitude
 * @param {Number} radiusInKm - Search radius in kilometers
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of vehicles within radius
 */
VehicleSchema.statics.findWithinRadius = async function (
  latitude,
  longitude,
  radiusInKm,
  filters = {}
) {
  const vehicles = await this.find({
    isActive: true,
    isAvailable: true,
    ...filters,
  }).lean();

  return vehicles
    .map((vehicle) => {
      if (vehicle.location?.latitude && vehicle.location?.longitude) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          vehicle.location.latitude,
          vehicle.location.longitude
        );
        return { ...vehicle, distance };
      }
      return null;
    })
    .filter((v) => v && v.distance <= radiusInKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Advanced search with multiple filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Search results with pagination
 */
VehicleSchema.statics.advancedSearch = async function (searchParams) {
  const {
    category,
    brand,
    zone,
    minPrice,
    maxPrice,
    latitude,
    longitude,
    radius,
    search,
    page = 1,
    limit = 10,
  } = searchParams;

  const query = { isActive: true };

  if (category) query.category = category;
  if (brand) query.brand = brand;
  if (zone) query.zone = zone;

  // Text search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
    ];
  }

  let vehicles = await this.find(query)
    .populate("brand")
    .populate("category")
    .populate("zone")
    .lean();

  // Distance filtering
  if (latitude && longitude && radius) {
    vehicles = vehicles
      .map((vehicle) => {
        if (vehicle.location?.latitude && vehicle.location?.longitude) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            vehicle.location.latitude,
            vehicle.location.longitude
          );
          return { ...vehicle, distance };
        }
        return null;
      })
      .filter((v) => v && v.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  // Pagination
  const total = vehicles.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedVehicles = vehicles.slice(startIndex, endIndex);

  return {
    vehicles: paginatedVehicles,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

// ================= INSTANCE METHODS =================

/**
 * Calculate distance from this vehicle to a given point
 * @param {Number} lat - Target latitude
 * @param {Number} lon - Target longitude
 * @returns {Number} Distance in kilometers
 */
VehicleSchema.methods.distanceTo = function (lat, lon) {
  if (!this.location?.latitude || !this.location?.longitude) {
    return null;
  }
  return this.constructor.calculateDistance(
    this.location.latitude,
    this.location.longitude,
    lat,
    lon
  );
};

module.exports = mongoose.model("Vehicle", VehicleSchema);
