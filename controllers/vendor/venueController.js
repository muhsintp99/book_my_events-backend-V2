// venueController.js (Updated)

const mongoose = require('mongoose');
const Venue = require('../../models/vendor/Venue');

// Helper function to convert old format to new format
const convertLegacyPricing = (oldPricing) => {
  const newPricing = {
    monday: {}, tuesday: {}, wednesday: {}, thursday: {},
    friday: {}, saturday: {}, sunday: {}
  };

  if (Array.isArray(oldPricing)) {
    oldPricing.forEach(slot => {
      const day = slot.day.toLowerCase();
      const slotType = slot.slotType.toLowerCase();
      
      if (newPricing[day]) {
        newPricing[day][slotType] = {
          startTime: slot.startTime,
          startAmpm: slot.startAmpm,
          endTime: slot.endTime,
          endAmpm: slot.endAmpm,
          perDay: slot.price || 0,
          perHour: 0,
          perPerson: 0
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
    'watermarkProtection', 'parkingAvailability', 'wheelchairAccessibility',
    'securityArrangements', 'foodCateringAvailability', 'wifiAvailability',
    'stageLightingAudio', 'multipleHalls', 'dynamicPricing', 'isActive',
    'acAvailable', 'nonAcAvailable'
  ];
  
  // Number fields
  const numberFields = [
    'latitude', 'longitude', 'discount', 'advanceDeposit',
    'maxGuestsSeated', 'maxGuestsStanding', 'rating', 'reviewCount'
  ];
  
  // Normalize boolean fields
  booleanFields.forEach(field => {
    if (normalized[field] !== undefined) {
      if (Array.isArray(normalized[field])) {
        normalized[field] = normalized[field][0];
      }
      if (typeof normalized[field] === 'string') {
        normalized[field] = normalized[field].toLowerCase() === 'true';
      }
    }
  });
  
  // Normalize number fields
  numberFields.forEach(field => {
    if (normalized[field] !== undefined) {
      if (Array.isArray(normalized[field])) {
        normalized[field] = normalized[field][0];
      }
      if (typeof normalized[field] === 'string') {
        const num = parseFloat(normalized[field]);
        normalized[field] = isNaN(num) ? undefined : num;
      }
    }
  });
  
  // Normalize string fields
  const stringFields = [
    'venueName', 'shortDescription', 'venueAddress', 'language',
    'contactPhone', 'contactEmail', 'contactWebsite',
    'ownerManagerName', 'ownerManagerPhone', 'ownerManagerEmail',
    'openingHours', 'closingHours', 'holidaySchedule',
    'parkingCapacity', 'washroomsInfo', 'dressingRooms',
    'customPackages', 'cancellationPolicy', 'extraCharges',
    'seatingArrangement', 'nearbyTransport', 'accessibilityInfo',
    'module', 'acType'
  ];
  
  stringFields.forEach(field => {
    if (Array.isArray(normalized[field])) {
      normalized[field] = normalized[field][0];
    }
  });
  
  // Validate acType enum
  if (normalized.acType) {
    const validAcTypes = ['Central AC', 'Split AC', 'Window AC', 'Coolers', 'Not Specified'];
    if (!validAcTypes.includes(normalized.acType)) {
      normalized.acType = 'Not Specified';
    }
  }
  
  return normalized;
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Helper function to get day of week from date
const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// Helper function to get maximum price from pricing schedule
const getMaxPrice = (pricingSchedule) => {
  let maxPrice = 0;
  if (pricingSchedule) {
    Object.values(pricingSchedule).forEach(day => {
      if (day.morning && day.morning.perDay > maxPrice) maxPrice = day.morning.perDay;
      if (day.evening && day.evening.perDay > maxPrice) maxPrice = day.evening.perDay;
    });
  }
  return maxPrice;
};

// NEW: Advanced Filter Venues API
exports.filterVenues = async (req, res) => {
  try {
    const {
      // Location filters
      latitude,
      longitude,
      radius = 10,
      
      // Category and Module
      categoryId,
      moduleId,
      
      // Capacity filters
      capacityRange, // '0-100', '100-300', '300-500', '500+'
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
      sortBy = 'createdAt', // 'price', 'rating', 'capacity', 'distance', 'createdAt'
      sortOrder = 'desc' // 'asc' or 'desc'
    } = req.query;

    // Build base query
    const query = { isActive: true };

    // Category filter
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID',
        });
      }
      query.categories = new mongoose.Types.ObjectId(categoryId);
    }

    // Module filter
    if (moduleId) {
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid module ID',
        });
      }
      query.module = new mongoose.Types.ObjectId(moduleId);
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
      query.parkingAvailability = parkingAvailability === 'true';
    }
    if (wheelchairAccessibility !== undefined) {
      query.wheelchairAccessibility = wheelchairAccessibility === 'true';
    }
    if (securityArrangements !== undefined) {
      query.securityArrangements = securityArrangements === 'true';
    }
    if (foodCateringAvailability !== undefined) {
      query.foodCateringAvailability = foodCateringAvailability === 'true';
    }
    if (wifiAvailability !== undefined) {
      query.wifiAvailability = wifiAvailability === 'true';
    }
    if (stageLightingAudio !== undefined) {
      query.stageLightingAudio = stageLightingAudio === 'true';
    }
    if (acAvailable !== undefined) {
      query.acAvailable = acAvailable === 'true';
    }
    if (nonAcAvailable !== undefined) {
      query.nonAcAvailable = nonAcAvailable === 'true';
    }

    // AC Type filter
    if (acType) {
      const validAcTypes = ['Central AC', 'Split AC', 'Window AC', 'Coolers', 'Not Specified'];
      if (validAcTypes.includes(acType)) {
        query.acType = acType;
      }
    }

    // Text-based filters (partial match)
    if (parkingCapacity) {
      query.parkingCapacity = new RegExp(parkingCapacity, 'i');
    }
    if (washroomsInfo) {
      query.washroomsInfo = new RegExp(washroomsInfo, 'i');
    }
    if (dressingRooms) {
      query.dressingRooms = new RegExp(dressingRooms, 'i');
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
          message: 'Invalid latitude or longitude values',
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
    let venues = await Venue.find(query)
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email phone')
      .populate('provider', 'name email phone')
      .lean();

    // Calculate distance and add metadata
    if (useLocationFilter) {
      venues = venues.map(venue => {
        const distance = calculateDistance(
          userLat,
          userLon,
          venue.latitude,
          venue.longitude
        );
        return {
          ...venue,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: 'km'
        };
      }).filter(venue => venue.distance <= searchRadius);
    }

    // Add calculated fields for filtering and sorting
    venues = venues.map(venue => {
      const maxPrice = getMaxPrice(venue.pricingSchedule);
      const totalCapacity = (venue.maxGuestsSeated || 0) + (venue.maxGuestsStanding || 0);
      
      return {
        ...venue,
        maxPrice,
        totalCapacity
      };
    });

    // Capacity range filter
    if (capacityRange) {
      const ranges = {
        '0-100': { min: 0, max: 100 },
        '100-300': { min: 100, max: 300 },
        '300-500': { min: 300, max: 500 },
        '500+': { min: 500, max: Infinity }
      };

      const range = ranges[capacityRange];
      if (range) {
        venues = venues.filter(venue => 
          venue.totalCapacity >= range.min && venue.totalCapacity < range.max
        );
      }
    }

    // Manual capacity filters (override capacityRange)
    if (minCapacity !== undefined) {
      const min = parseInt(minCapacity);
      if (!isNaN(min)) {
        venues = venues.filter(venue => venue.totalCapacity >= min);
      }
    }
    if (maxCapacity !== undefined) {
      const max = parseInt(maxCapacity);
      if (!isNaN(max)) {
        venues = venues.filter(venue => venue.totalCapacity <= max);
      }
    }

    // Price range filter
    if (minPrice !== undefined) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        venues = venues.filter(venue => venue.maxPrice >= min);
      }
    }
    if (maxPrice !== undefined) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        venues = venues.filter(venue => venue.maxPrice <= max);
      }
    }

    // Sorting
    const sortField = sortBy.toLowerCase();
    const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;

    venues.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'price':
          aValue = a.maxPrice || 0;
          bValue = b.maxPrice || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'capacity':
          aValue = a.totalCapacity || 0;
          bValue = b.totalCapacity || 0;
          break;
        case 'distance':
          if (useLocationFilter) {
            aValue = a.distance || 0;
            bValue = b.distance || 0;
          } else {
            aValue = 0;
            bValue = 0;
          }
          break;
        case 'createdat':
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

    // Build response with applied filters summary
    const appliedFilters = {
      location: useLocationFilter ? { latitude: userLat, longitude: userLon, radius: searchRadius, unit: 'km' } : null,
      categoryId: categoryId || null,
      moduleId: moduleId || null,
      capacityRange: capacityRange || null,
      capacity: {
        min: minCapacity || null,
        max: maxCapacity || null
      },
      price: {
        min: minPrice || null,
        max: maxPrice || null
      },
      rating: {
        min: minRating || null,
        max: maxRating || null
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
        acType: acType || null
      },
      sorting: {
        sortBy: sortField,
        sortOrder: sortOrder
      }
    };

    res.status(200).json({
      success: true,
      count: paginatedVenues.length,
      totalResults,
      page: parseInt(page),
      totalPages,
      appliedFilters,
      data: paginatedVenues,
      message: paginatedVenues.length === 0 
        ? 'No venues found matching your filter criteria' 
        : 'Venues filtered successfully'
    });

  } catch (err) {
    console.error('Error in filterVenues:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to filter venues',
      error: err.message
    });
  }
};

// Advanced Venue Search API
exports.searchVenues = async (req, res) => {
  try {
    const { keyword, date, latitude, longitude, radius = 10, limit = 50, page = 1 } = req.query;

    // Build search query
    const searchQuery = { isActive: true };

    // Keyword search (searches in multiple fields)
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword.trim(), 'i');
      searchQuery.$or = [
        { venueName: keywordRegex },
        { shortDescription: keywordRegex },
        { venueAddress: keywordRegex },
        { searchTags: { $in: [keywordRegex] } },
        { language: keywordRegex },
        { seatingArrangement: keywordRegex }
      ];
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
          message: 'Invalid latitude or longitude values',
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
    let venues = await Venue.find(searchQuery)
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email phone')
      .populate('provider', 'name email phone')
      .lean();

    // Apply location filtering and calculate distances
    if (useLocationFilter) {
      venues = venues.map(venue => {
        const distance = calculateDistance(
          userLat,
          userLon,
          venue.latitude,
          venue.longitude
        );
        return {
          ...venue,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: 'km'
        };
      }).filter(venue => venue.distance <= searchRadius);

      // Sort by distance
      venues.sort((a, b) => a.distance - b.distance);
    }

    // Date-based availability filter
    if (date) {
      const dayOfWeek = getDayOfWeek(date);
      
      venues = venues.filter(venue => {
        if (!venue.pricingSchedule || !venue.pricingSchedule[dayOfWeek]) {
          return false;
        }

        const daySchedule = venue.pricingSchedule[dayOfWeek];
        return (daySchedule.morning && Object.keys(daySchedule.morning).length > 0) ||
               (daySchedule.evening && Object.keys(daySchedule.evening).length > 0);
      });

      venues = venues.map(venue => ({
        ...venue,
        requestedDate: date,
        requestedDay: dayOfWeek,
        availableSlots: venue.pricingSchedule[dayOfWeek]
      }));
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVenues = venues.slice(skip, skip + parseInt(limit));
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
        unit: useLocationFilter ? 'km' : null
      },
      data: paginatedVenues,
      message: paginatedVenues.length === 0 
        ? 'No venues found matching your search criteria' 
        : 'Venues fetched successfully'
    };

    res.status(200).json(response);

  } catch (err) {
    console.error('Error in searchVenues:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to search venues',
      error: err.message
    });
  }
};

// Create Venue
exports.createVenue = async (req, res) => {
  try {
    let data = normalizeFormData(req.body);

    // Parse pricing schedule
    if (data.pricingSchedule) {
      const parsed = typeof data.pricingSchedule === 'string' 
        ? JSON.parse(data.pricingSchedule) 
        : data.pricingSchedule;
      
      data.pricingSchedule = Array.isArray(parsed) 
        ? convertLegacyPricing(parsed) 
        : parsed;
    }

    // Parse categories
    if (data.categories) {
      let categories = data.categories;
      
      if (typeof categories === 'string') {
        try {
          categories = JSON.parse(categories);
        } catch {
          categories = categories.split(',').map(c => c.trim()).filter(c => c);
        }
      }
      
      if (Array.isArray(categories)) {
        data.categories = categories
          .flat()
          .filter(c => c && mongoose.Types.ObjectId.isValid(c))
          .map(c => new mongoose.Types.ObjectId(c));
      } else {
        data.categories = [];
      }
    } else {
      data.categories = [];
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
      if (typeof tags === 'string') {
        try {
          let parsed = JSON.parse(tags);
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          tags = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          tags = tags.split(',').map(t => t.trim()).filter(t => t);
        }
      }
      data.searchTags = Array.isArray(tags)
        ? tags.flat().filter(t => t && typeof t === 'string' && t.trim()).map(t => t.trim())
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
      
      if (typeof faqs === 'string') {
        try {
          faqs = JSON.parse(faqs);
        } catch (err) {
          console.error('Error parsing FAQs:', err);
          faqs = [];
        }
      }
      
      if (Array.isArray(faqs)) {
        data.faqs = faqs.filter(faq => 
          faq && 
          typeof faq === 'object' && 
          faq.question && 
          faq.answer &&
          typeof faq.question === 'string' &&
          typeof faq.answer === 'string'
        ).map(faq => ({
          question: faq.question.trim(),
          answer: faq.answer.trim()
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
    if (req.files?.images) data.images = req.files.images.map(f => f.path);
    
    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Please log in to create a venue',
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

    // Populate categories and module
    await venue.populate([
      { path: 'categories', select: 'title image categoryId module isActive' },
      { path: 'module', select: 'title moduleId icon isActive' },
      { path: 'createdBy', select: 'name email phone' },
      { path: 'provider', select: 'name email phone' }
    ]);

    res.status(201).json({
      success: true,
      data: venue,
      message: 'Venue created successfully',
    });
  } catch (err) {
    console.error('Error in createVenue:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create venue',
    });
  }
};

// Get all venues
exports.getVenues = async (req, res) => {
  try {
    const venues = await Venue.find()
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate({
        path: 'createdBy',
        select: 'name email phone',
      })
      .populate({
        path: 'provider',
        select: 'name email phone',
      })
      .lean();

    if (!venues || venues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No venues found',
      });
    }

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venues',
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
        message: 'Latitude (lat) and Longitude (lng) are required',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values',
      });
    }

    const zoneRadiusKm = 10;

    const venues = await Venue.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      isActive: true
    })
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email phone')
      .populate('provider', 'name email phone')
      .lean();

    const venuesInZone = [];
    
    venues.forEach(venue => {
      const distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);

      if (distance <= zoneRadiusKm) {
        venuesInZone.push({
          ...venue,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: 'km'
        });
      }
    });

    venuesInZone.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      count: venuesInZone.length,
      searchParams: {
        latitude,
        longitude,
        zoneRadius: zoneRadiusKm,
        unit: 'km'
      },
      data: venuesInZone,
      message: venuesInZone.length === 0 
        ? `No venues found within ${zoneRadiusKm}km zone` 
        : 'Venues in zone fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching venues by location:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch venues by location',
      error: err.message
    });
  }
};

// Get venues by provider ID
exports.getVenuesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ success: false, message: 'Invalid provider ID' });
    }

    const providerObjectId = new mongoose.Types.ObjectId(providerId);

    const venues = await Venue.find({
      $or: [{ provider: providerObjectId }, { createdBy: providerObjectId }],
    })
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive'
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
      message: venues.length === 0 ? 'No venues found for this provider' : 'Venues fetched successfully',
    });
  } catch (err) {
    console.error('Error fetching venues by provider:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch venues by provider', error: err.message });
  }
};

// Get single venue
exports.getVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findById(venueId)
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate({
        path: 'createdBy',
        select: 'name email phone',
      })
      .populate({
        path: 'provider',
        select: 'name email phone',
      })
      .lean();

    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: venue 
    });
  } catch (err) {
    console.error('Error in getVenue:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venue',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    let data = normalizeFormData(req.body);
    
    // Parse pricing schedule
    if (data.pricingSchedule && typeof data.pricingSchedule === 'string') {
      const parsed = JSON.parse(data.pricingSchedule);
      data.pricingSchedule = Array.isArray(parsed) 
        ? convertLegacyPricing(parsed) 
        : parsed;
    }

    // Parse categories
    if (data.categories) {
      let categories = data.categories;
      
      if (typeof categories === 'string') {
        try {
          categories = JSON.parse(categories);
        } catch {
          categories = categories.split(',').map(c => c.trim()).filter(c => c);
        }
      }
      
      if (Array.isArray(categories)) {
        data.categories = categories
          .flat()
          .filter(c => c && mongoose.Types.ObjectId.isValid(c))
          .map(c => new mongoose.Types.ObjectId(c));
      }
    }

    // Parse module
    if (data.module && mongoose.Types.ObjectId.isValid(data.module)) {
      data.module = new mongoose.Types.ObjectId(data.module);
    }
    
    // Parse search tags
    if (data.searchTags) {
      let tags = data.searchTags;
      if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          tags = Array.isArray(parsed) ? parsed.flat() : [tags];
        } catch {
          tags = [tags];
        }
      }
      data.searchTags = Array.isArray(tags)
        ? tags.flat().filter(t => t && typeof t === 'string').map(t => t.trim())
        : [];
    }

    // Parse FAQs
    if (data.faqs) {
      let faqs = data.faqs;
      
      if (Array.isArray(faqs)) {
        faqs = faqs[0];
      }
      
      if (typeof faqs === 'string') {
        try {
          faqs = JSON.parse(faqs);
        } catch (err) {
          console.error('Error parsing FAQs:', err);
          faqs = [];
        }
      }
      
      if (Array.isArray(faqs)) {
        data.faqs = faqs.filter(faq => 
          faq && 
          typeof faq === 'object' && 
          faq.question && 
          faq.answer &&
          typeof faq.question === 'string' &&
          typeof faq.answer === 'string'
        ).map(faq => ({
          question: faq.question.trim(),
          answer: faq.answer.trim()
        }));
      }
    }

    // Handle file uploads
    if (req.files?.thumbnail) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.images) data.images = req.files.images.map(f => f.path);

    const venue = await Venue.findByIdAndUpdate(venueId, data, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive'
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate({
        path: 'createdBy',
        select: 'name email phone',
      })
      .populate({
        path: 'provider',
        select: 'name email phone',
      });

    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: venue,
      message: 'Venue updated successfully'
    });
  } catch (err) {
    console.error('Error in updateVenue:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update venue',
      error: err.message
    });
  }
};

// Get venues by category
exports.getVenuesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category ID' 
      });
    }

    const venues = await Venue.find({ 
      categories: categoryId,
      isActive: true 
    })
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive'
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
      message: venues.length === 0 ? 'No venues found for this category' : 'Venues fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching venues by category:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venues by category',
      error: err.message
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
        message: 'Invalid module ID' 
      });
    }

    const venues = await Venue.find({ 
      module: moduleId,
      isActive: true 
    })
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive'
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
      message: venues.length === 0 ? 'No venues found for this module' : 'Venues fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching venues by module:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venues by module',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    const pricingSchedule = req.body.pricingSchedule
      ? (typeof req.body.pricingSchedule === 'string' 
          ? JSON.parse(req.body.pricingSchedule) 
          : req.body.pricingSchedule)
      : null;

    if (!pricingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'pricingSchedule is required',
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
        message: 'Venue not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        pricingSchedule: venue.pricingSchedule,
      },
      message: 'Pricing updated successfully'
    });
  } catch (err) {
    console.error('Error in updatePricing:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update venue pricing',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findById(venueId)
      .select('venueName pricingSchedule')
      .lean();

    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
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
    console.error('Error in getPricing:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venue pricing',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findById(id)
      .select('venueName pricingSchedule')
      .lean();

    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
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
    console.error('Error in getPricingByDaySlot:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venue pricing',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findById(venueId)
      .select('venueName faqs')
      .lean();

    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
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
    console.error('Error in getFAQs:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch FAQs',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    let faqs = req.body.faqs;
    
    if (typeof faqs === 'string') {
      try {
        faqs = JSON.parse(faqs);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid FAQ format. Must be a valid JSON array.',
        });
      }
    }

    if (!Array.isArray(faqs)) {
      return res.status(400).json({
        success: false,
        message: 'FAQs must be an array',
      });
    }

    const validFAQs = faqs.filter(faq => 
      faq && 
      typeof faq === 'object' && 
      faq.question && 
      faq.answer &&
      typeof faq.question === 'string' &&
      typeof faq.answer === 'string'
    ).map(faq => ({
      question: faq.question.trim(),
      answer: faq.answer.trim()
    }));

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { faqs: validFAQs },
      { new: true, runValidators: true }
    ).select('venueName faqs');

    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.venueName,
        faqs: venue.faqs,
      },
      message: 'FAQs updated successfully'
    });
  } catch (err) {
    console.error('Error in updateFAQs:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update FAQs',
      error: err.message
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
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findByIdAndDelete(venueId);
    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Venue deleted successfully',
      data: { deletedId: venueId }
    });
  } catch (err) {
    console.error('Error in deleteVenue:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete venue',
      error: err.message
    });
  }
};

// NEW: Toggle Active Status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }

    venue.isActive = !venue.isActive;
    await venue.save();
    
    res.status(200).json({ 
      success: true, 
      data: venue,
      message: `Venue ${venue.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err) {
    console.error('Error in toggleActiveStatus:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle venue active status',
      error: err.message
    });
  }
};

// NEW: Toggle Top Pick Status
exports.toggleTopPickStatus = async (req, res) => {
  try {
    const venueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid venue ID' 
      });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }

    venue.isTopPick = !venue.isTopPick;
    await venue.save();
    
    res.status(200).json({ 
      success: true, 
      data: venue,
      message: `Venue top pick status ${venue.isTopPick ? 'enabled' : 'disabled'} successfully`
    });
  } catch (err) {
    console.error('Error in toggleTopPickStatus:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle venue top pick status',
      error: err.message
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
        inactive
      }
    });
  } catch (err) {
    console.error('Error in getVenueCounts:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venue counts',
      error: err.message
    });
  }
};

// Sort Venues
exports.sortVenues = async (req, res) => {
  try {
    const { sortBy, latitude, longitude } = req.query;
    const validSortOptions = ['highPrice', 'lowPrice', 'topRated', 'lowRated', 'highCapacity', 'lowCapacity'];

    if (!sortBy || !validSortOptions.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing sortBy parameter. Use: highPrice, lowPrice, topRated, lowRated, highCapacity, lowCapacity',
      });
    }

    let venues = await Venue.find({ isActive: true })
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email phone')
      .populate('provider', 'name email phone')
      .lean();

    let useLocationFilter = false;
    let userLat, userLon, searchRadius = 10;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);

      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude values',
        });
      }

      useLocationFilter = true;
      venues = venues.map(venue => {
        const distance = calculateDistance(userLat, userLon, venue.latitude, venue.longitude);
        return {
          ...venue,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: 'km'
        };
      }).filter(venue => venue.distance <= searchRadius);
    }

    const venuesWithData = venues.map(venue => {
      const maxPrice = getMaxPrice(venue.pricingSchedule);
      const rating = venue.rating || 0;
      const capacity = (venue.maxGuestsSeated || 0) + (venue.maxGuestsStanding || 0);

      return { ...venue, maxPrice, rating, capacity };
    });

    let filteredVenues;
    if (sortBy === 'lowCapacity') {
      filteredVenues = venuesWithData.filter(venue => venue.capacity <= 500);
    } else if (sortBy === 'highCapacity') {
      filteredVenues = venuesWithData.filter(venue => venue.capacity > 500);
    } else {
      filteredVenues = venuesWithData;
    }

    let sortedVenues;
    switch (sortBy) {
      case 'highPrice':
        sortedVenues = [...filteredVenues].sort((a, b) => b.maxPrice - a.maxPrice);
        break;
      case 'lowPrice':
        sortedVenues = [...filteredVenues].sort((a, b) => a.maxPrice - b.maxPrice);
        break;
      case 'topRated':
        sortedVenues = [...filteredVenues].sort((a, b) => b.rating - a.rating);
        break;
      case 'lowRated':
        sortedVenues = [...filteredVenues].sort((a, b) => a.rating - b.rating);
        break;
      case 'highCapacity':
        sortedVenues = [...filteredVenues].sort((a, b) => b.capacity - a.capacity);
        break;
      case 'lowCapacity':
        sortedVenues = [...filteredVenues].sort((a, b) => a.capacity - b.capacity);
        break;
      default:
        sortedVenues = filteredVenues;
    }

    res.status(200).json({
      success: true,
      count: sortedVenues.length,
      sortBy: sortBy,
      searchParams: useLocationFilter ? { latitude: userLat, longitude: userLon, radius: searchRadius, unit: 'km' } : null,
      data: sortedVenues,
      message: 'Venues sorted successfully',
    });
  } catch (err) {
    console.error('Error in sortVenues:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sort venues',
      error: err.message,
    });
  }
};

// NEW: Get Top Picks
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
          message: 'Invalid latitude or longitude values',
        });
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10; // Default 10km
      }

      useLocationFilter = true;
      query.latitude = { $exists: true, $ne: null };
      query.longitude = { $exists: true, $ne: null };
    }

    let venues = await Venue.find(query)
      .populate({
        path: 'categories',
        select: 'title image categoryId module isActive',
        populate: { path: 'module', select: 'title moduleId' }
      })
      .populate({
        path: 'module',
        select: 'title moduleId icon isActive'
      })
      .populate('createdBy', 'name email phone')
      .populate('provider', 'name email phone')
      .lean();

    if (useLocationFilter) {
      venues = venues.map(venue => {
        const distance = calculateDistance(
          userLat,
          userLon,
          venue.latitude,
          venue.longitude
        );
        return {
          ...venue,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: 'km'
        };
      }).filter(venue => venue.distance <= searchRadius);

      // Sort by distance
      venues.sort((a, b) => a.distance - b.distance);
    }

    res.status(200).json({
      success: true,
      count: venues.length,
      searchParams: useLocationFilter ? { latitude: userLat, longitude: userLon, radius: searchRadius, unit: 'km' } : null,
      data: venues,
      message: venues.length === 0 
        ? 'No top pick venues found' 
        : 'Top pick venues fetched successfully'
    });
  } catch (err) {
    console.error('Error in getTopPicks:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top pick venues',
      error: err.message
    });
  }
};