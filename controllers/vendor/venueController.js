const mongoose = require("mongoose");
const Venue = require("../../models/vendor/Venue");
const Category = require("../../models/admin/category");
const { enhanceProviderDetails } = require("../../utils/providerHelper");

// Helper function to convert old format to new format
const convertLegacyPricing = (oldPricing) => {
  const newPricing = {
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {},
    saturday: {},
    sunday: {},
  };

  if (Array.isArray(oldPricing)) {
    oldPricing.forEach((slot) => {
      const day = slot.day.toLowerCase();
      const slotType = slot.slotType.toLowerCase();

      if (newPricing[day]) {
        newPricing[day][slotType] = {
          startTime: slot.startTime,
          startAmpm: slot.startAmpm,
          endTime: slot.endTime,
          endAmpm: slot.endAmpm,
          perDay: Number(slot.price) || 0,
          perHour: 0,
          perPerson: 0,
        };
      }
    });
  }

  return newPricing;
};

// Helper function to normalize form data
const normalizeFormData = (data) => {
  const normalized = { ...data };

  // Boolean fields
  const booleanFields = [
    "watermarkProtection",
    "parkingAvailability",
    "wheelchairAccessibility",
    "securityArrangements",
    "foodCateringAvailability",
    "wifiAvailability",
    "stageLightingAudio",
    "multipleHalls",
    "dynamicPricing",
    "isActive",
    "acAvailable",
    "nonAcAvailable",
  ];

  // Number fields
  const numberFields = [
    "latitude",
    "longitude",
    "advanceDeposit",
    "maxGuestsSeated",
    "maxGuestsStanding",
    "rating",
    "reviewCount",
  ];

  // Normalize boolean fields
  booleanFields.forEach((field) => {
    if (normalized[field] !== undefined) {
      if (Array.isArray(normalized[field])) {
        normalized[field] = normalized[field][0];
      }
      if (typeof normalized[field] === "string") {
        normalized[field] = normalized[field].toLowerCase() === "true";
      }
    }
  });

  // Normalize number fields
  numberFields.forEach((field) => {
    if (normalized[field] !== undefined) {
      if (Array.isArray(normalized[field])) {
        normalized[field] = normalized[field][0];
      }
      if (typeof normalized[field] === "string") {
        const num = parseFloat(normalized[field]);
        normalized[field] = isNaN(num) ? 0 : num;
      }
    }
  });

  if (normalized.discount) {
    let discountData = normalized.discount;

    // If discount is a string, try to parse it
    if (typeof discountData === "string") {
      try {
        discountData = JSON.parse(discountData);
      } catch (e) {
        // If it's just a number string, treat it as old format (general discount)
        const num = parseFloat(discountData);
        if (!isNaN(num)) {
          discountData = {
            packageDiscount: num,
            nonAc: 0,
          };
        } else {
          discountData = {
            packageDiscount: 0,
            nonAc: 0,
          };
        }
      }
    }
    if (typeof discountData === "object" && discountData !== null) {
      const packageDiscount = parseFloat(discountData.packageDiscount) || 0;
      const nonAc = parseFloat(discountData.nonAc) || 0;

      // Validate discount values
      // packageDiscount must be between 0-100 (percentage)
      // nonAc can be any positive number (could be a flat amount, not percentage)
      if (packageDiscount < 0 || packageDiscount > 100) {
        throw new Error("Package discount must be between 0 and 100");
      }
      if (nonAc < 0) {
        throw new Error("Non-AC discount must be a positive number");
      }

      normalized.discount = {
        packageDiscount: packageDiscount,
        nonAc: nonAc,
      };
    } else {
      normalized.discount = {
        packageDiscount: 0,
        nonAc: 0,
      };
    }
  }

  // Normalize string fields
  const stringFields = [
    "venueName",
    "shortDescription",
    "venueAddress",
    "language",
    "contactPhone",
    "contactEmail",
    "contactWebsite",
    "ownerManagerName",
    "ownerManagerPhone",
    "ownerManagerEmail",
    "openingHours",
    "closingHours",
    "holidaySchedule",
    "parkingCapacity",
    "washroomsInfo",
    "dressingRooms",
    "customPackages",
    "cancellationPolicy",
    "extraCharges",
    "seatingArrangement",
    "nearbyTransport",
    "accessibilityInfo",
    "module",
    "acType",
  ];

  exports.updateDiscount = async (req, res) => {
    try {
      const venueId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(venueId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid venue ID",
        });
      }

      const { packageDiscount, nonAc } = req.body;

      // Validate discount values
      const discountData = {
        packageDiscount: parseFloat(packageDiscount) || 0,
        nonAc: parseFloat(nonAc) || 0
      };

      // packageDiscount is a percentage (0-100)
      if (discountData.packageDiscount < 0 || discountData.packageDiscount > 100) {
        return res.status(400).json({
          success: false,
          message: "Package discount must be between 0 and 100",
        });
      }

      // nonAc can be any positive number (no upper limit)
      if (discountData.nonAc < 0) {
        return res.status(400).json({
          success: false,
          message: "Non-AC discount must be a positive number",
        });
      }

      const venue = await Venue.findByIdAndUpdate(
        venueId,
        { discount: discountData },
        { new: true, runValidators: true }
      )
        .populate('categories', 'title image categoryId module isActive')
        .populate('module', 'title moduleId icon isActive')
        .populate('packages')
        .populate('createdBy', 'name email phone')
        .populate({
          path: 'provider',
          select: 'userId firstName lastName email phone',
          populate: {
            path: 'profile',
            select: 'mobileNumber socialLinks profilePhoto'
          }
        });

      if (!venue) {
        return res.status(404).json({
          success: false,
          message: "Venue not found",
        });
      }

      res.status(200).json({
        success: true,
        data: venue,
        message: "Discount updated successfully",
      });
    } catch (err) {
      console.error("Error in updateDiscount:", err.message);
      res.status(500).json({
        success: false,
        message: "Failed to update discount",
        error: err.message,
      });
    }
  };
  stringFields.forEach((field) => {
    if (Array.isArray(normalized[field])) {
      normalized[field] = normalized[field][0];
    }
  });

  // Validate acType enum
  if (normalized.acType) {
    const validAcTypes = [
      "Central AC",
      "Split AC",
      "Window AC",
      "Coolers",
      "Not Specified",
    ];
    if (!validAcTypes.includes(normalized.acType)) {
      normalized.acType = "Not Specified";
    }
  }

  return normalized;
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Helper function to get day of week from date
const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
};

// Helper function to get maximum price from pricing schedule
const getMaxPrice = (pricingSchedule) => {
  let maxPrice = 0;
  if (pricingSchedule) {
    Object.values(pricingSchedule).forEach((day) => {
      if (day.morning && day.morning.perDay > maxPrice)
        maxPrice = day.morning.perDay;
      if (day.evening && day.evening.perDay > maxPrice)
        maxPrice = day.evening.perDay;
    });
  }
  return maxPrice;
};
const normalizePricingSchedule = (schedule) => {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const newSchedule = {};

  days.forEach(day => {
    const d = schedule[day] || {};

    newSchedule[day] = {
      morning: d.morning ? {
        ...d.morning,
        perDay: Number(d.morning.perDay || d.morning.price || 0),
      } : null,

      evening: d.evening ? {
        ...d.evening,
        perDay: Number(d.evening.perDay || d.evening.price || 0),
      } : null
    };
  });

  return newSchedule;
};


// Create Venue
exports.createVenue = async (req, res) => {
  try {
    let data = normalizeFormData(req.body);

    // Parse pricing schedule
    if (data.pricingSchedule) {
      const parsed =
        typeof data.pricingSchedule === "string"
          ? JSON.parse(data.pricingSchedule)
          : data.pricingSchedule;

      data.pricingSchedule = Array.isArray(parsed)
        ? convertLegacyPricing(parsed)
        : parsed;
    }

    // Parse categories
    if (data.categories) {
      let categories = data.categories;

      if (typeof categories === "string") {
        try {
          categories = JSON.parse(categories);
        } catch {
          categories = categories
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
        }
      }

      if (Array.isArray(categories)) {
        data.categories = categories
          .flat()
          .filter((c) => c && mongoose.Types.ObjectId.isValid(c))
          .map((c) => new mongoose.Types.ObjectId(c));
      } else {
        data.categories = [];
      }
    } else {
      data.categories = [];
    }

    // Parse packages (support multiple package IDs)
    if (data.packages) {
      let packages = data.packages;

      if (typeof packages === "string") {
        try {
          packages = JSON.parse(packages);
        } catch {
          packages = packages
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p);
        }
      }

      if (Array.isArray(packages)) {
        data.packages = packages
          .flat()
          .filter((p) => p && mongoose.Types.ObjectId.isValid(p))
          .map((p) => new mongoose.Types.ObjectId(p));
      } else {
        data.packages = [];
      }
    } else {
      data.packages = [];
    }

    // Parse module
    if (data.module && mongoose.Types.ObjectId.isValid(data.module)) {
      data.module = new mongoose.Types.ObjectId(data.module);
    } else {
      data.module = null;
    }

    // Parse search tags
    if (data.searchTags) {
      let tags = data.searchTags;
      if (typeof tags === "string") {
        try {
          let parsed = JSON.parse(tags);
          if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
          }
          tags = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          tags = tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      }
      data.searchTags = Array.isArray(tags)
        ? tags
          .flat()
          .filter((t) => t && typeof t === "string" && t.trim())
          .map((t) => t.trim())
        : [];
    } else {
      data.searchTags = [];
    }

    // Parse FAQs
    if (data.faqs) {
      let faqs = data.faqs;

      if (Array.isArray(faqs)) {
        faqs = faqs[0];
      }

      if (typeof faqs === "string") {
        try {
          faqs = JSON.parse(faqs);
        } catch (err) {
          console.error("Error parsing FAQs:", err);
          faqs = [];
        }
      }

      if (Array.isArray(faqs)) {
        data.faqs = faqs
          .filter(
            (faq) =>
              faq &&
              typeof faq === "object" &&
              faq.question &&
              faq.answer &&
              typeof faq.question === "string" &&
              typeof faq.answer === "string"
          )
          .map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          }));
      } else {
        data.faqs = [];
      }
    } else {
      data.faqs = [];
    }

    if (!data.user) data.user = null;

    // Handle file uploads
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map((f) => f.path);

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in to create a venue",
      });
    }

    // Set provider field
    if (data.provider && mongoose.Types.ObjectId.isValid(data.provider)) {
      data.provider = data.provider;
    } else {
      data.provider = req.user._id;
    }

    const venue = await Venue.create({
      ...data,
      createdBy: req.user._id,
    });

    // Populate categories, module, and packages (no select restriction for packages)
    await venue.populate([
      { path: "categories", select: "title image categoryId module isActive" },
      { path: "module", select: "title moduleId icon isActive" },
      { path: "packages" }, // Removed select to include all package fields
      { path: "createdBy", select: "name email phone" },
      {
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      },
    ]);

    res.status(201).json({
      success: true,
      data: venue,
      message: "Venue created successfully",
    });
  } catch (err) {
    console.error("Error in createVenue:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create venue",
    });
  }
};

// Advanced Filter Venues API
exports.filterVenues = async (req, res) => {
  try {
    const {
      // Location filters
      latitude,
      longitude,
      radius = 10,

      // Category, Module, and Package
      categoryId,
      moduleId,
      packageId,

      // Capacity filters
      capacityRange,
      minCapacity,
      maxCapacity,

      // Price range
      minPrice,
      maxPrice,

      // Rating filter
      minRating,
      maxRating,

      // Amenities (boolean filters)
      parkingAvailability,
      wheelchairAccessibility,
      securityArrangements,
      foodCateringAvailability,
      wifiAvailability,
      stageLightingAudio,
      acAvailable,
      nonAcAvailable,

      // AC Type
      acType,

      // Text filters
      parkingCapacity,
      washroomsInfo,
      dressingRooms,

      // Pagination
      page = 1,
      limit = 50,

      // Sorting
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate and parse capacityRange
    let capacityFilter = null;
    if (
      capacityRange &&
      minCapacity === undefined &&
      maxCapacity === undefined
    ) {
      const decodedCapacityRange = decodeURIComponent(capacityRange);
      console.log(`Received capacityRange: ${decodedCapacityRange}`);

      let min, max;
      if (decodedCapacityRange.endsWith("+")) {
        min = parseInt(decodedCapacityRange.replace("+", ""));
        if (isNaN(min) || min < 0) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid capacityRange. Must be in format "min-max" or "min+" with valid non-negative numbers',
          });
        }
      } else if (decodedCapacityRange.includes("-")) {
        [min, max] = decodedCapacityRange
          .split("-")
          .map((num) => parseInt(num));
        if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid capacityRange. Must be in format "min-max" with valid non-negative numbers where min <= max',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message:
            'Invalid capacityRange. Must be in format "min-max" or "min+"',
        });
      }

      capacityFilter = { min, max };
      console.log(`Parsed capacity filter: ${JSON.stringify(capacityFilter)}`);
    }

    // Build base query
    const query = { isActive: true };

    // Apply capacity range filter
    if (capacityFilter) {
      query.$expr = query.$expr || {};
      query.$expr.$and = query.$expr.$and || [];
      query.$expr.$and.push({
        $gte: [
          {
            $add: [
              { $ifNull: ["$maxGuestsSeated", 0] },
              { $ifNull: ["$maxGuestsStanding", 0] },
            ],
          },
          capacityFilter.min,
        ],
      });
      if (capacityFilter.max !== undefined) {
        query.$expr.$and.push({
          $lte: [
            {
              $add: [
                { $ifNull: ["$maxGuestsSeated", 0] },
                { $ifNull: ["$maxGuestsStanding", 0] },
              ],
            },
            capacityFilter.max,
          ],
        });
      }
      console.log(
        `Applying capacity filter: ${JSON.stringify(capacityFilter)}`
      );
    }

    // Manual capacity filters (only if capacityRange is not provided)
    if (minCapacity !== undefined && !capacityRange) {
      const min = parseInt(minCapacity);
      if (!isNaN(min)) {
        query.$expr = query.$expr || {};
        query.$expr.$and = query.$expr.$and || [];
        query.$expr.$and.push({
          $gte: [
            {
              $add: [
                { $ifNull: ["$maxGuestsSeated", 0] },
                { $ifNull: ["$maxGuestsStanding", 0] },
              ],
            },
            min,
          ],
        });
      }
    }
    if (maxCapacity !== undefined && !capacityRange) {
      const max = parseInt(maxCapacity);
      if (!isNaN(max)) {
        query.$expr = query.$expr || {};
        query.$expr.$and = query.$expr.$and || [];
        query.$expr.$and.push({
          $lte: [
            {
              $add: [
                { $ifNull: ["$maxGuestsSeated", 0] },
                { $ifNull: ["$maxGuestsStanding", 0] },
              ],
            },
            max,
          ],
        });
      }
    }

    // Category filter (support multiple categories)
    if (categoryId) {
      let categoryIds = categoryId;
      if (typeof categoryId === "string") {
        categoryIds = categoryId
          .split(",")
          .map((id) => id.trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
      } else if (Array.isArray(categoryId)) {
        categoryIds = categoryId.filter((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      }
      if (categoryIds.length > 0) {
        query.categories = {
          $elemMatch: {
            $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        };
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID(s)",
        });
      }
    }

    // Module filter
    if (moduleId) {
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid module ID",
        });
      }
      query.module = new mongoose.Types.ObjectId(moduleId);
    }

    // Package filter (support multiple package IDs)
    if (packageId) {
      let packageIds = packageId;
      if (typeof packageId === "string") {
        packageIds = packageId
          .split(",")
          .map((id) => id.trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
      } else if (Array.isArray(packageId)) {
        packageIds = packageId.filter((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      }
      if (packageIds.length > 0) {
        // Changed from $in to $all to ensure venues have ALL specified packages
        // If you want venues with ANY of the packages, keep $in
        // If you want venues with ALL specified packages, use $all
        query.packages = {
          $in: packageIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid package ID(s)",
        });
      }
    }

    // Rating filter
    if (minRating !== undefined) {
      const min = parseFloat(minRating);
      if (!isNaN(min)) {
        query.rating = { ...query.rating, $gte: min };
      }
    }
    if (maxRating !== undefined) {
      const max = parseFloat(maxRating);
      if (!isNaN(max)) {
        query.rating = { ...query.rating, $lte: max };
      }
    }

    // Boolean amenity filters
    if (parkingAvailability !== undefined) {
      query.parkingAvailability = parkingAvailability === "true";
    }
    if (wheelchairAccessibility !== undefined) {
      query.wheelchairAccessibility = wheelchairAccessibility === "true";
    }
    if (securityArrangements !== undefined) {
      query.securityArrangements = securityArrangements === "true";
    }
    if (foodCateringAvailability !== undefined) {
      query.foodCateringAvailability = foodCateringAvailability === "true";
    }
    if (wifiAvailability !== undefined) {
      query.wifiAvailability = wifiAvailability === "true";
    }
    if (stageLightingAudio !== undefined) {
      query.stageLightingAudio = stageLightingAudio === "true";
    }
    if (acAvailable !== undefined) {
      query.acAvailable = acAvailable === "true";
    }
    if (nonAcAvailable !== undefined) {
      query.nonAcAvailable = nonAcAvailable === "true";
    }

    // AC Type filter
    if (acType) {
      const validAcTypes = [
        "Central AC",
        "Split AC",
        "Window AC",
        "Coolers",
        "Not Specified",
      ];
      if (validAcTypes.includes(acType)) {
        query.acType = acType;
      }
    }

    // Text-based filters (partial match)
    if (parkingCapacity) {
      query.parkingCapacity = new RegExp(parkingCapacity, "i");
    }
    if (washroomsInfo) {
      query.washroomsInfo = new RegExp(washroomsInfo, "i");
    }
    if (dressingRooms) {
      query.dressingRooms = new RegExp(dressingRooms, "i");
    }

    // Location filter setup
    let useLocationFilter = false;
    let userLat, userLon, searchRadius;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);
      searchRadius = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude values",
        });
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10; // Default 10km
      }

      useLocationFilter = true;
      query.latitude = { $exists: true, $ne: null };
      query.longitude = { $exists: true, $ne: null };
    }

    // Fetch venues with populated fields
    let venues = await Venue.find(query).sort({ createdAt: -1 })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
        populate: { path: "module", select: "title moduleId" },
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate("packages") // FIXED - Returns ALL package fields
      .populate("createdBy", "name email phone")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .lean();

    // Calculate distance and add metadata
    if (useLocationFilter) {
      venues = venues
        .map((venue) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            venue.latitude,
            venue.longitude
          );
          return {
            ...venue,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((venue) => venue.distance <= searchRadius);
    }

    // Add calculated fields for filtering and sorting
    venues = venues.map((venue) => {
      const maxPrice = getMaxPrice(venue.pricingSchedule);
      const seated = Number(venue.maxGuestsSeated) || 0;
      const standing = Number(venue.maxGuestsStanding) || 0;
      const totalCapacity = seated + standing;
      if (isNaN(totalCapacity)) {
        console.log(
          `Invalid capacity for venue ${venue._id}: seated=${seated}, standing=${standing}`
        );
      }
      return {
        ...venue,
        maxPrice,
        totalCapacity,
      };
    });

    // Price range filter
    if (minPrice !== undefined) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        venues = venues.filter((venue) => {
          const price = venue.maxPrice || 0;
          return price >= min;
        });
      }
    }
    if (maxPrice !== undefined) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        venues = venues.filter((venue) => {
          const price = venue.maxPrice || 0;
          return price <= max;
        });
      }
    }

    // Sorting
    const sortField = sortBy.toLowerCase();
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    venues.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "price":
          aValue = a.maxPrice || 0;
          bValue = b.maxPrice || 0;
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "capacity":
          aValue = a.totalCapacity || 0;
          bValue = b.totalCapacity || 0;
          break;
        case "distance":
          if (useLocationFilter) {
            aValue = a.distance || 0;
            bValue = b.distance || 0;
          } else {
            aValue = 0;
            bValue = 0;
          }
          break;
        case "createdat":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      return (aValue - bValue) * order;
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVenues = venues.slice(skip, skip + parseInt(limit));
    const totalResults = venues.length;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    // Log filtered results
    console.log(`Filtered venues count: ${paginatedVenues.length}`);

    // Build response with applied filters summary
    const appliedFilters = {
      location: useLocationFilter
        ? {
          latitude: userLat,
          longitude: userLon,
          radius: searchRadius,
          unit: "km",
        }
        : null,
      categoryId: categoryId || null,
      moduleId: moduleId || null,
      packageId: packageId || null,
      capacityRange: capacityRange || null,
      capacity: {
        min: minCapacity || null,
        max: maxCapacity || null,
      },
      price: {
        min: minPrice || null,
        max: maxPrice || null,
      },
      rating: {
        min: minRating || null,
        max: maxRating || null,
      },
      amenities: {
        parkingAvailability: parkingAvailability || null,
        wheelchairAccessibility: wheelchairAccessibility || null,
        securityArrangements: securityArrangements || null,
        foodCateringAvailability: foodCateringAvailability || null,
        wifiAvailability: wifiAvailability || null,
        stageLightingAudio: stageLightingAudio || null,
        acAvailable: acAvailable || null,
        nonAcAvailable: nonAcAvailable || null,
        acType: acType || null,
      },
      sorting: {
        sortBy: sortField,
        sortOrder,
      },
    };

    // Standardize all providers
    const enhancedVenues = await Promise.all(
      paginatedVenues.map(async (venue) => {
        if (venue.provider) {
          venue.provider = await enhanceProviderDetails(venue.provider, req);
        }
        return venue;
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedVenues.length,
      totalResults,
      page: parseInt(page),
      totalPages,
      appliedFilters,
      data: enhancedVenues,
      message:
        enhancedVenues.length === 0
          ? "No venues found matching your filter criteria"
          : "Venues filtered successfully",
    });
  } catch (err) {
    console.error("Error in filterVenues:", err);
    res.status(500).json({
      success: false,
      message: "Failed to filter venues",
      error: err.message,
    });
  }
};

// Advanced Venue Search API
exports.searchVenues = async (req, res) => {
  try {
    const {
      keyword,
      date,
      latitude,
      longitude,
      radius = 10,
      limit = 50,
      page = 1,
      packageId,
    } = req.query;

    // Build search query
    const searchQuery = { isActive: true };

    // Keyword search (searches in multiple fields)
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword.trim(), "i");
      searchQuery.$or = [
        { venueName: keywordRegex },
        { shortDescription: keywordRegex },
        { venueAddress: keywordRegex },
        { searchTags: { $in: [keywordRegex] } },
        { language: keywordRegex },
        { seatingArrangement: keywordRegex },
      ];
    }

    // Package filter (support multiple package IDs)
    if (packageId) {
      let packageIds = packageId;
      if (typeof packageId === "string") {
        packageIds = packageId
          .split(",")
          .map((id) => id.trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
      } else if (Array.isArray(packageId)) {
        packageIds = packageId.filter((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      }
      if (packageIds.length > 0) {
        searchQuery.packages = {
          $in: packageIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid package ID(s)",
        });
      }
    }

    // Location filter
    let useLocationFilter = false;
    let userLat, userLon, searchRadius;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);
      searchRadius = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude values",
        });
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10; // Default 10km
      }

      useLocationFilter = true;
      searchQuery.latitude = { $exists: true, $ne: null };
      searchQuery.longitude = { $exists: true, $ne: null };
    }

    // Fetch venues
    let venues = await Venue.find(searchQuery).sort({ createdAt: -1 })

      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
        populate: { path: "module", select: "title moduleId" },
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate("createdBy", "name email phone")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .lean();

    // Apply location filtering and calculate distances
    if (useLocationFilter) {
      venues = venues
        .map((venue) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            venue.latitude,
            venue.longitude
          );
          return {
            ...venue,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((venue) => venue.distance <= searchRadius);

      // Sort by distance
      venues.sort((a, b) => a.distance - b.distance);
    }

    // Date-based availability filter
    if (date) {
      const dayOfWeek = getDayOfWeek(date);

      venues = venues.filter((venue) => {
        if (!venue.pricingSchedule || !venue.pricingSchedule[dayOfWeek]) {
          return false;
        }

        const daySchedule = venue.pricingSchedule[dayOfWeek];
        return (
          (daySchedule.morning &&
            Object.keys(daySchedule.morning).length > 0) ||
          (daySchedule.evening && Object.keys(daySchedule.evening).length > 0)
        );
      });

      venues = venues.map((venue) => ({
        ...venue,
        requestedDate: date,
        requestedDay: dayOfWeek,
        availableSlots: venue.pricingSchedule[dayOfWeek],
      }));
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVenues = venues.slice(skip, skip + parseInt(limit));
    // Enhance provider details
    await Promise.all(paginatedVenues.map(async (venue) => {
      if (venue.provider) {
        venue.provider = await enhanceProviderDetails(venue.provider, req);
      }
    }));

    const totalResults = venues.length;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    const response = {
      success: true,
      count: paginatedVenues.length,
      totalResults,
      page: parseInt(page),
      totalPages,
      searchParams: {
        keyword: keyword || null,
        date: date || null,
        dayOfWeek: date ? getDayOfWeek(date) : null,
        latitude: useLocationFilter ? userLat : null,
        longitude: useLocationFilter ? userLon : null,
        radius: useLocationFilter ? searchRadius : null,
        packageId: packageId || null,
      },
      data: paginatedVenues,
      message:
        paginatedVenues.length === 0
          ? "No venues found matching your search criteria"
          : "Venues fetched successfully",
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in searchVenues:", err);
    res.status(500).json({
      success: false,
      message: "Failed to search venues",
      error: err.message,
    });
  }
};
// Helper: apply consistent populates to a Mongoose query for venues
const applyVenuePopulates = (query) => {
  return query
    .populate({
      path: "categories",
      select: "title image categoryId module isActive",
      populate: { path: "module", select: "title moduleId" },
    })
    .populate({
      path: "module",
      select: "title moduleId icon isActive",
    })
    // IMPORTANT: populate packages WITHOUT select to include all package fields
    .populate({
      path: "packages",
      // no 'select' here — we want full package object (images, thumbnail, price, includes, createdAt, etc.)
    })
    .populate("createdBy", "name email phone")
    .populate("provider", "firstName lastName email phone profilePhoto");
};


// GET Venue Categories by Venue Module
exports.getModuleCategories = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    // Fetch parent categories for this module
    const parentCategories = await Category.find({
      module: moduleId,
      parentCategory: null,
    })
      .populate({
        path: "subCategories",
        select: "title image _id",
      })
      .lean();

    res.status(200).json({
      success: true,
      data: parentCategories,
      message: "Categories fetched successfully",
    });
  } catch (err) {
    console.error("Error in getModuleCategories:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: err.message,
    });
  }
};

// Get all venues
// exports.getVenues = async (req, res) => {
//   try {
//     const venues = await Venue.find().sort({ createdAt: -1 })
//       .populate({
//         path: "categories",
//         select: "title image categoryId module isActive",
//         populate: { path: "module", select: "title moduleId" },
//       })
//       .populate({
//         path: "module",
//         select: "title moduleId icon isActive",
//       })
//       .populate("packages") // FIXED - No select restriction
//       .populate("createdBy", "name email phone")
//       .populate({
//         path: "provider",
//         select: "userId firstName lastName email phone",
//         populate: {
//           path: "profile",
//           select: "mobileNumber socialLinks profilePhoto",
//         },
//       })
//       .lean();

//     if (!venues || venues.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No venues found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       count: venues.length,
//       data: venues,
//     });
//   } catch (error) {
//     console.error("Error fetching venues:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch venues",
//       error: error.message,
//     });
//   }
// };
// Get all venues (fixed - full package fields populated)
// Get all venues (fixed - full package fields populated)
exports.getVenues = async (req, res) => {
  try {
    let query = Venue.find().sort({ createdAt: -1 }).lean();
    query = applyVenuePopulates(query);

    const venues = await query.exec();

    if (!venues || venues.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No venues found",
      });
    }

    const enhancedVenues = await Promise.all(
      venues.map(async (venue) => {
        if (venue.provider) {
          venue.provider = await enhanceProviderDetails(venue.provider, req);
        }
        return venue;
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedVenues.length,
      data: enhancedVenues,
    });
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venues",
      error: error.message,
    });
  }
};

// Get venues by location
exports.getVenuesByLocation = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude (lat) and Longitude (lng) are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude values",
      });
    }

    const zoneRadiusKm = 10;

    const venues = await Venue.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      isActive: true,
    }).sort({ createdAt: -1 })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
        populate: { path: "module", select: "title moduleId" },
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate("packages") // FIXED
      .populate("createdBy", "name email phone")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .lean();
    const venuesInZone = [];

    venues.forEach((venue) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        venue.latitude,
        venue.longitude
      );

      if (distance <= zoneRadiusKm) {
        venuesInZone.push({
          ...venue,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: "km",
        });
      }
    });

    venuesInZone.sort((a, b) => a.distance - b.distance);

    // Standardize providers
    const enhancedVenues = await Promise.all(
      venuesInZone.map(async (venue) => {
        if (venue.provider) {
          venue.provider = await enhanceProviderDetails(venue.provider, req);
        }
        return venue;
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedVenues.length,
      searchParams: {
        latitude,
        longitude,
        zoneRadius: zoneRadiusKm,
        unit: "km",
      },
      data: enhancedVenues,
      message:
        enhancedVenues.length === 0
          ? `No venues found within ${zoneRadiusKm}km zone`
          : "Venues in zone fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching venues by location:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venues by location",
      error: err.message,
    });
  }
};

// Get venues by provider ID
exports.getVenuesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid provider ID" });
    }

    const providerObjectId = new mongoose.Types.ObjectId(providerId);

    const venues = await Venue.find({
      $or: [{ provider: providerObjectId }, { createdBy: providerObjectId }],
    })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate("packages") // FIXED
      .populate("createdBy", "name email")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Standardize providers
    const enhancedVenues = await Promise.all(
      venues.map(async (venue) => {
        if (venue.provider) {
          venue.provider = await enhanceProviderDetails(venue.provider, req);
        }
        return venue;
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedVenues.length,
      data: enhancedVenues,
      message:
        enhancedVenues.length === 0
          ? "No venues found for this provider"
          : "Venues fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching venues by provider:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venues by provider",
      error: err.message,
    });
  }
};

// Get single venue
// exports.getVenue = async (req, res) => {
//   try {
//     const venueId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(venueId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid venue ID",
//       });
//     }

//     const venue = await Venue.findById(venueId)
//       .populate({
//         path: "categories",
//         select: "title image categoryId module isActive",
//         populate: { path: "module", select: "title moduleId" },
//       })
//       .populate({
//         path: "module",
//         select: "title moduleId icon isActive",
//       })
//       .populate({
//         path: "packages",
//         select: "title subtitle description packageType priceRange isActive",
//       })
//       .populate({
//         path: "createdBy",
//         select: "name email phone",
//       })
//       .populate({
//         path: "provider",
//         select: "userId firstName lastName email phone",
//         populate: {
//           path: "profile",
//           select: "mobileNumber socialLinks profilePhoto",
//         },
//       })
//       .lean();

//     if (!venue) {
//       return res.status(404).json({
//         success: false,
//         message: "Venue not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: venue,
//     });
//   } catch (err) {
//     console.error("Error in getVenue:", err.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch venue",
//       error: err.message,
//     });
//   }
// };
// Get single venue (fixed - full package fields populated)
exports.getVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    // Build base query
    let query = Venue.findById(venueId).lean();
    // Apply consistent populates
    query = applyVenuePopulates(query);

    const venue = await query.exec();

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    // Enhance provider details
    if (venue.provider) {
      venue.provider = await enhanceProviderDetails(venue.provider, req);
    }

    res.status(200).json({
      success: true,
      data: venue,
    });
  } catch (err) {
    console.error("Error in getVenue:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venue",
      error: err.message,
    });
  }
};

// Update venue
exports.updateVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    let data = normalizeFormData(req.body);

    // Parse pricing schedule
    if (data.pricingSchedule && typeof data.pricingSchedule === "string") {
      const parsed = JSON.parse(data.pricingSchedule);
      data.pricingSchedule = Array.isArray(parsed)
        ? convertLegacyPricing(parsed)
        : parsed;
    }


    // Parse categories
    if (data.categories) {
      let categories = data.categories;

      if (typeof categories === "string") {
        try {
          categories = JSON.parse(categories);
        } catch {
          categories = categories
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
        }
      }

      if (Array.isArray(categories)) {
        data.categories = categories
          .flat()
          .filter((c) => c && mongoose.Types.ObjectId.isValid(c))
          .map((c) => new mongoose.Types.ObjectId(c));
      }
    }

    // Parse packages (support multiple package IDs)
    if (data.packages) {
      let packages = data.packages;

      if (typeof packages === "string") {
        try {
          packages = JSON.parse(packages);
        } catch {
          packages = packages
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p);
        }
      }

      if (Array.isArray(packages)) {
        data.packages = packages
          .flat()
          .filter((p) => p && mongoose.Types.ObjectId.isValid(p))
          .map((p) => new mongoose.Types.ObjectId(p));
      }
    }

    // Parse module
    if (data.module && mongoose.Types.ObjectId.isValid(data.module)) {
      data.module = new mongoose.Types.ObjectId(data.module);
    }

    // Parse search tags
    if (data.searchTags) {
      let tags = data.searchTags;
      if (typeof tags === "string") {
        try {
          const parsed = JSON.parse(tags);
          tags = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          tags = tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      }
      data.searchTags = Array.isArray(tags)
        ? tags
          .flat()
          .filter((t) => t && typeof t === "string")
          .map((t) => t.trim())
        : [];
    }

    // Parse FAQs
    if (data.faqs) {
      let faqs = data.faqs;

      if (Array.isArray(faqs)) {
        faqs = faqs[0];
      }

      if (typeof faqs === "string") {
        try {
          faqs = JSON.parse(faqs);
        } catch (err) {
          console.error("Error parsing FAQs:", err);
          faqs = [];
        }
      }

      if (Array.isArray(faqs)) {
        data.faqs = faqs
          .filter(
            (faq) =>
              faq &&
              typeof faq === "object" &&
              faq.question &&
              faq.answer &&
              typeof faq.question === "string" &&
              typeof faq.answer === "string"
          )
          .map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          }));
      }
    }

    // Handle file uploads and merge with existing images
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;

    let imagesData = [];
    if (req.body.images) {
      imagesData = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (req.files?.images) {
      const newImages = req.files.images.map((f) => f.path);
      imagesData = [...imagesData, ...newImages];
    }

    if (imagesData.length > 0) {
      data.images = imagesData;
    }

    const venue = await Venue.findByIdAndUpdate(venueId, data, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate({
        path: "createdBy",
        select: "name email phone",
      })
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: venue,
      message: "Venue updated successfully",
    });
  } catch (err) {
    console.error("Error in updateVenue:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update venue",
      error: err.message,
    });
  }
};

// Get venues by category
// Get venues by category - FIXED VERSION
exports.getVenuesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const venues = await Venue.find({
      categories: categoryId,
      isActive: true,
    })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate("packages") // FIXED - Removed select to return ALL package fields
      .populate("createdBy", "name email phone")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Enhance provider details
    const enhancedVenues = await Promise.all(
      venues.map(async (venue) => {
        if (venue.provider) {
          venue.provider = await enhanceProviderDetails(venue.provider, req);
        }
        return venue;
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedVenues.length,
      data: enhancedVenues,
      message:
        enhancedVenues.length === 0
          ? "No venues found for this category"
          : "Venues fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching venues by category:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venues by category",
      error: err.message,
    });
  }
};
// Get venues by module
exports.getVenuesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const venues = await Venue.find({
      module: moduleId,
      isActive: true,
    })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate("createdBy", "name email")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Enhance provider details
    const enhancedVenues = await Promise.all(
      venues.map(async (venue) => {
        if (venue.provider) {
          venue.provider = await enhanceProviderDetails(venue.provider, req);
        }
        return venue;
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedVenues.length,
      data: enhancedVenues,
      message:
        enhancedVenues.length === 0
          ? "No venues found for this module"
          : "Venues fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching venues by module:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venues by module",
      error: err.message,
    });
  }
};

// Update Pricing
exports.updatePricing = async (req, res) => {
  try {
    const venueId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const pricingSchedule = req.body.pricingSchedule
      ? typeof req.body.pricingSchedule === "string"
        ? JSON.parse(req.body.pricingSchedule)
        : req.body.pricingSchedule
      : null;

    if (!pricingSchedule) {
      return res.status(400).json({
        success: false,
        message: "pricingSchedule is required",
      });
    }

    const formattedPricing = Array.isArray(pricingSchedule)
      ? convertLegacyPricing(pricingSchedule)
      : pricingSchedule;

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { pricingSchedule: formattedPricing },
      { new: true, runValidators: true }
    );

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        pricingSchedule: venue.pricingSchedule,
      },
      message: "Pricing updated successfully",
    });
  } catch (err) {
    console.error("Error in updatePricing:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update venue pricing",
      error: err.message,
    });
  }
};

// Get Pricing
exports.getPricing = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await Venue.findById(venueId)
      .select("venueName pricingSchedule")
      .lean();

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        pricingSchedule: venue.pricingSchedule || {},
      },
    });
  } catch (err) {
    console.error("Error in getPricing:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venue pricing",
      error: err.message,
    });
  }
};

// Get Pricing for specific day and slot
exports.getPricingByDaySlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, slot } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await Venue.findById(id)
      .select("venueName pricingSchedule")
      .lean();

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    if (day && slot) {
      const dayLower = day.toLowerCase();
      const slotLower = slot.toLowerCase();

      const daySchedule = venue.pricingSchedule?.[dayLower];
      const slotPricing = daySchedule?.[slotLower];

      if (!slotPricing) {
        return res.status(404).json({
          success: false,
          message: `No pricing found for ${day} ${slot}`,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          venueId: venue._id,
          venueName: venue.venueName,
          day: dayLower,
          slot: slotLower,
          pricing: slotPricing,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        pricingSchedule: venue.pricingSchedule || {},
      },
    });
  } catch (err) {
    console.error("Error in getPricingByDaySlot:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venue pricing",
      error: err.message,
    });
  }
};

// Get FAQs
exports.getFAQs = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await Venue.findById(venueId).select("venueName faqs").lean();

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        faqs: venue.faqs || [],
      },
    });
  } catch (err) {
    console.error("Error in getFAQs:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQs",
      error: err.message,
    });
  }
};

// Update FAQs
exports.updateFAQs = async (req, res) => {
  try {
    const venueId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    let faqs = req.body.faqs;

    if (typeof faqs === "string") {
      try {
        faqs = JSON.parse(faqs);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid FAQ format. Must be a valid JSON array.",
        });
      }
    }

    if (!Array.isArray(faqs)) {
      return res.status(400).json({
        success: false,
        message: "FAQs must be an array",
      });
    }

    const validFAQs = faqs
      .filter(
        (faq) =>
          faq &&
          typeof faq === "object" &&
          faq.question &&
          faq.answer &&
          typeof faq.question === "string" &&
          typeof faq.answer === "string"
      )
      .map((faq) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      }));

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { faqs: validFAQs },
      { new: true, runValidators: true }
    ).select("venueName faqs");

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        faqs: venue.faqs,
      },
      message: "FAQs updated successfully",
    });
  } catch (err) {
    console.error("Error in updateFAQs:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update FAQs",
      error: err.message,
    });
  }
};

// Delete Venue
exports.deleteVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await Venue.findByIdAndDelete(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Venue deleted successfully",
      data: { deletedId: venueId },
    });
  } catch (err) {
    console.error("Error in deleteVenue:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete venue",
      error: err.message,
    });
  }
};

// Toggle Active Status
exports.toggleTopPickStatus = async (req, res) => {
  try {
    const venueId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    // Get current venue status - use collection.findOne to get raw document
    const venue = await Venue.collection.findOne({
      _id: new mongoose.Types.ObjectId(venueId)
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    const newStatus = !venue.isTopPick;

    // ✅ Prepare update object
    const updateData = { isTopPick: newStatus };

    // Fix discount if it's corrupted (not a proper object)
    if (!venue.discount ||
      typeof venue.discount !== 'object' ||
      venue.discount === null ||
      !venue.discount.packageDiscount === undefined) {
      updateData.discount = { packageDiscount: 0, nonAc: 0 };
    }

    // ✅ Use direct MongoDB update to bypass ALL validation
    await Venue.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(venueId) },
      { $set: updateData }
    );

    // Fetch updated venue for response
    const updatedVenue = await Venue.findById(venueId)
      .populate('categories', 'title image categoryId module isActive')
      .populate('module', 'title moduleId icon isActive')
      .populate('packages')
      .populate('createdBy', 'name email phone')
      .populate({
        path: 'provider',
        select: 'userId firstName lastName email phone',
        populate: {
          path: 'profile',
          select: 'mobileNumber socialLinks profilePhoto'
        }
      });

    res.status(200).json({
      success: true,
      data: updatedVenue,
      message: `Venue top pick status ${newStatus ? "enabled" : "disabled"} successfully`,
    });
  } catch (err) {
    console.error("Error in toggleTopPickStatus:", err);
    res.status(500).json({
      success: false,
      message: "Failed to toggle venue top pick status",
      error: err.message,
    });
  }
};

// ✅ FIXED: Toggle Active Status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const venueId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    // Get current venue status - use collection.findOne to get raw document
    const venue = await Venue.collection.findOne({
      _id: new mongoose.Types.ObjectId(venueId)
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    const newStatus = !venue.isActive;

    // ✅ Prepare update object
    const updateData = { isActive: newStatus };

    // Fix discount if it's corrupted (not a proper object)
    if (!venue.discount ||
      typeof venue.discount !== 'object' ||
      venue.discount === null ||
      venue.discount.packageDiscount === undefined) {
      updateData.discount = { packageDiscount: 0, nonAc: 0 };
    }

    // ✅ Use direct MongoDB update to bypass ALL validation
    await Venue.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(venueId) },
      { $set: updateData }
    );

    // Fetch updated venue for response
    const updatedVenue = await Venue.findById(venueId)
      .populate('categories', 'title image categoryId module isActive')
      .populate('module', 'title moduleId icon isActive')
      .populate('packages')
      .populate('createdBy', 'name email phone')
      .populate({
        path: 'provider',
        select: 'userId firstName lastName email phone',
        populate: {
          path: 'profile',
          select: 'mobileNumber socialLinks profilePhoto'
        }
      });

    res.status(200).json({
      success: true,
      data: updatedVenue,
      message: `Venue ${newStatus ? "activated" : "deactivated"} successfully`,
    });
  } catch (err) {
    console.error("Error in toggleActiveStatus:", err);
    res.status(500).json({
      success: false,
      message: "Failed to toggle venue active status",
      error: err.message,
    });
  }
};
// Venue Counts
exports.getVenueCounts = async (req, res) => {
  try {
    const total = await Venue.countDocuments();
    const active = await Venue.countDocuments({ isActive: true });
    const inactive = await Venue.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
      },
    });
  } catch (err) {
    console.error("Error in getVenueCounts:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venue counts",
      error: err.message,
    });
  }
};

// Sort Venues
exports.sortVenues = async (req, res) => {
  try {
    const { sortBy, latitude, longitude } = req.query;
    const validSortOptions = [
      "highPrice",
      "lowPrice",
      "topRated",
      "lowRated",
      "highCapacity",
      "lowCapacity",
    ];

    if (!sortBy || !validSortOptions.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing sortBy parameter. Use: highPrice, lowPrice, topRated, lowRated, highCapacity, lowCapacity",
      });
    }

    let venues = await Venue.find({ isActive: true })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
        populate: { path: "module", select: "title moduleId" },
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate("createdBy", "name email phone")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .lean();

    let useLocationFilter = false;
    let userLat,
      userLon,
      searchRadius = 10;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);

      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude values",
        });
      }

      useLocationFilter = true;
      venues = venues
        .map((venue) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            venue.latitude,
            venue.longitude
          );
          return {
            ...venue,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((venue) => venue.distance <= searchRadius);
    }

    const venuesWithData = venues.map((venue) => {
      const maxPrice = getMaxPrice(venue.pricingSchedule);
      const rating = Number(venue.rating) || 0;
      const capacity =
        (Number(venue.maxGuestsSeated) || 0) +
        (Number(venue.maxGuestsStanding) || 0);

      return { ...venue, maxPrice, rating, capacity };
    });

    let filteredVenues;
    if (sortBy === "lowCapacity") {
      filteredVenues = venuesWithData.filter((venue) => venue.capacity <= 500);
    } else if (sortBy === "highCapacity") {
      filteredVenues = venuesWithData.filter((venue) => venue.capacity > 500);
    } else {
      filteredVenues = venuesWithData;
    }

    let sortedVenues;
    switch (sortBy) {
      case "highPrice":
        sortedVenues = [...filteredVenues].sort(
          (a, b) => b.maxPrice - a.maxPrice
        );
        break;
      case "lowPrice":
        sortedVenues = [...filteredVenues].sort(
          (a, b) => a.maxPrice - b.maxPrice
        );
        break;
      case "topRated":
        sortedVenues = [...filteredVenues].sort((a, b) => b.rating - a.rating);
        break;
      case "lowRated":
        sortedVenues = [...filteredVenues].sort((a, b) => a.rating - b.rating);
        break;
      case "highCapacity":
        sortedVenues = [...filteredVenues].sort(
          (a, b) => b.capacity - a.capacity
        );
        break;
      case "lowCapacity":
        sortedVenues = [...filteredVenues].sort(
          (a, b) => a.capacity - b.capacity
        );
        break;
      default:
        sortedVenues = filteredVenues;
    }

    res.status(200).json({
      success: true,
      count: sortedVenues.length,
      sortBy: sortBy,
      searchParams: useLocationFilter
        ? {
          latitude: userLat,
          longitude: userLon,
          radius: searchRadius,
          unit: "km",
        }
        : null,
      data: sortedVenues,
      message: "Venues sorted successfully",
    });
  } catch (err) {
    console.error("Error in sortVenues:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to sort venues",
      error: err.message,
    });
  }
};

// Get Top Picks
exports.getTopPicks = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    const query = { isActive: true, isTopPick: true };

    let useLocationFilter = false;
    let userLat, userLon, searchRadius;

    if (lat && lng) {
      userLat = parseFloat(lat);
      userLon = parseFloat(lng);
      searchRadius = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude values",
        });
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10; // Default 10km
      }

      useLocationFilter = true;
      query.latitude = { $exists: true, $ne: null };
      query.longitude = { $exists: true, $ne: null };
    }

    let venues = await Venue.find(query).sort({ createdAt: -1 })
      .populate({
        path: "categories",
        select: "title image categoryId module isActive",
        populate: { path: "module", select: "title moduleId" },
      })
      .populate({
        path: "module",
        select: "title moduleId icon isActive",
      })
      .populate({
        path: "packages",
        select: "title subtitle description packageType priceRange isActive",
      })
      .populate("createdBy", "name email phone")
      .populate({
        path: "provider",
        select: "userId firstName lastName email phone",
        populate: {
          path: "profile",
          select: "mobileNumber socialLinks profilePhoto",
        },
      })
      .lean();

    if (useLocationFilter) {
      venues = venues
        .map((venue) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            venue.latitude,
            venue.longitude
          );
          return {
            ...venue,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((venue) => venue.distance <= searchRadius);

      // Sort by distance
      venues.sort((a, b) => a.distance - b.distance);
    }

    res.status(200).json({
      success: true,
      count: venues.length,
      searchParams: useLocationFilter
        ? {
          latitude: userLat,
          longitude: userLon,
          radius: searchRadius,
          unit: "km",
        }
        : null,
      data: venues,
      message:
        venues.length === 0
          ? "No top pick venues found"
          : "Top pick venues fetched successfully",
    });
  } catch (err) {
    console.error("Error in getTopPicks:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top pick venues",
      error: err.message,
    });
  }
};


