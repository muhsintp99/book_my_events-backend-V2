// const Vehicle = require('../../models/vendor/Vehicle');
// const fs = require('fs').promises;
// const path = require('path');

// // Helper: delete files
// const deleteFiles = async (files) => {
//   if (!files || files.length === 0) return;
//   for (const file of files) {
//     const filePath = path.resolve(__dirname, '../../Uploads/vehicles', file);
//     try {
//       if (await fs.access(filePath)) {
//         await fs.unlink(filePath);
//       }
//     } catch (error) {
//       console.error(`Failed to delete file ${filePath}:`, error);
//     }
//   }
// };

// // ✅ Create Vehicle
// exports.createVehicle = async (req, res) => {
//   try {
//     const { body } = req;

//     // Ensure provider is the authenticated user (if provided)
//     if (body.provider && (!req.user || body.provider.toString() !== req.user._id.toString())) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Invalid provider' });
//     }

//     // Handle uploaded files
//     if (req.files?.images) {
//       body.images = req.files.images.map((f) => f.filename);
//     }
//     if (req.files?.thumbnail && req.files.thumbnail[0]) {
//       body.thumbnail = req.files.thumbnail[0].filename;
//     }
//     if (req.files?.documents) {
//       body.documents = req.files.documents.map((f) => f.filename);
//     }

//     const vehicle = await Vehicle.create(body);
//     res.status(201).json({ success: true, data: vehicle });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ success: false, message: 'VIN or license plate already exists' });
//     }
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ✅ Get All Vehicles
// exports.getVehicles = async (req, res) => {
//   try {
//     const vehicles = await Vehicle.find()
//       .populate('brand category provider')
//       .lean();
//     res.json({ success: true, data: vehicles });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



// // ✅ Get Single Vehicle
// exports.getVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id)
//       .populate('brand category provider')
//       .lean();
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ✅ Update Vehicle
// exports.updateVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check if the authenticated user is the provider (if provider exists)
//     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     // Store old files for deletion after successful update
//     const oldImages = vehicle.images.slice();
//     const oldThumbnail = vehicle.thumbnail;
//     const oldDocuments = vehicle.documents.slice();

//     // Update fields
//     if (req.files?.images) {
//       vehicle.images = req.files.images.map((f) => f.filename);
//     }
//     if (req.files?.thumbnail && req.files.thumbnail[0]) {
//       vehicle.thumbnail = req.files.thumbnail[0].filename;
//     }
//     if (req.files?.documents) {
//       vehicle.documents = req.files.documents.map((f) => f.filename);
//     }

//     // Update other fields (sanitize req.body)
//     const allowedFields = [
//       'name', 'description', 'brand', 'category', 'model', 'type', 'engineCapacity',
//       'enginePower', 'seatingCapacity', 'airCondition', 'fuelType', 'transmissionType',
//       'pricing', 'discount', 'searchTags', 'vinNumber', 'licensePlateNumber', 'provider',
//     ];
//     for (const key of allowedFields) {
//       if (req.body[key] !== undefined) {
//         vehicle[key] = req.body[key];
//       }
//     }

//     await vehicle.save();

//     // Delete old files after successful update
//     if (req.files?.images) await deleteFiles(oldImages);
//     if (req.files?.thumbnail && oldThumbnail) await deleteFiles([oldThumbnail]);
//     if (req.files?.documents) await deleteFiles(oldDocuments);

//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ success: false, message: 'VIN or license plate already exists' });
//     }
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ✅ Delete Vehicle
// exports.deleteVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check if the authenticated user is the provider (if provider exists)
//     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     await deleteFiles(vehicle.images);
//     if (vehicle.thumbnail) await deleteFiles([vehicle.thumbnail]);
//     await deleteFiles(vehicle.documents);

//     await vehicle.deleteOne();
//     res.json({ success: true, message: 'Vehicle deleted' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ✅ Block Vehicle
// exports.blockVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check if the authenticated user is the provider (if provider exists)
//     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     vehicle.isActive = false;
//     await vehicle.save();
//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ✅ Reactivate Vehicle
// exports.reactivateVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check if the authenticated user is the provider (if provider exists)
//     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     vehicle.isActive = true;
//     await vehicle.save();
//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const Vehicle = require('../../models/vendor/Vehicle'); 
// const fs = require('fs').promises;
// const path = require('path');

// // Helper: delete files
// const deleteFiles = async (files) => {
//   if (!files || files.length === 0) return;
//   for (const file of files) {
//     const filePath = path.resolve(__dirname, '../../Uploads/vehicles', file);
//     try {
//       await fs.access(filePath);
//       await fs.unlink(filePath);
//     } catch (error) {
//       console.error(`Failed to delete file ${filePath}:`, error);
//     }
//   }
// };

// // ================= CREATE =================

// exports.createVehicle = async (req, res) => {
//   try {
//     const { body } = req;

//     // Set provider from authenticated user if not provided or validate if provided
//     if (!body.provider) {
//       body.provider = req.user._id;
//     } else if (body.provider.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Invalid provider' });
//     }

//     // Handle file uploads
//     if (req.files?.images) body.images = req.files.images.map(f => f.filename);
//     if (req.files?.thumbnail && req.files.thumbnail[0]) body.thumbnail = req.files.thumbnail[0].filename;
//     if (req.files?.documents) body.documents = req.files.documents.map(f => f.filename);

//     // Create vehicle
//     const vehicle = await Vehicle.create(body);
    
//     // Populate the provider field before sending response
//     await vehicle.populate('brand category provider');
    
//     res.status(201).json({ success: true, data: vehicle });
//   } catch (error) {
//     // Handle duplicate key errors
//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({ 
//         success: false, 
//         message: `${field === 'vinNumber' ? 'VIN number' : 'License plate number'} already exists` 
//       });
//     }
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ================= READ =================

// // Get all vehicles (admin sees all, vendor sees only their own)
// // exports.getVehicles = async (req, res) => {
// //   try {
// //     let vehicles;
// //     if (req.user.role === 'vendor') {
// //       vehicles = await Vehicle.find({ provider: req.user._id }).populate('brand category provider').lean();
// //     } else {
// //       vehicles = await Vehicle.find().populate('brand category provider').lean();
// //     }
// //     res.json({ success: true, count: vehicles.length, data: vehicles });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };
// // Get all vehicles (admin sees all, vendor sees only their own)
// exports.getVehicles = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search } = req.query;

//     // Convert page and limit to numbers
//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     // Build query
//     let query = {};
//     if (req.user.role === 'vendor') {
//       query.provider = req.user._id;
//     }

//     // Add search functionality if search term is provided
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { model: { $regex: search, $options: 'i' } },
//         { vinNumber: { $regex: search, $options: 'i' } },
//         { licensePlateNumber: { $regex: search, $options: 'i' } },
//       ];
//     }

//     // Fetch vehicles with pagination
//     const vehicles = await Vehicle.find(query)
//       .populate('brand category provider')
//       .skip(skip)
//       .limit(limitNum)
//       .lean();

//     // Get total count for pagination
//     const totalItems = await Vehicle.countDocuments(query);

//     // Calculate pagination metadata
//     const totalPages = Math.ceil(totalItems / limitNum);

//     // Send response with pagination data
//     res.json({
//       success: true,
//       data: {
//         vehicles,
//         pagination: {
//           currentPage: pageNum,
//           totalPages,
//           totalItems,
//           itemsPerPage: limitNum,
//         },
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get all vehicles for a specific provider (admin or vendor)
// exports.getVehiclesByProvider = async (req, res) => {
//   try {
//     const providerId = req.params.providerId;

//     if (req.user.role === 'vendor' && req.user._id.toString() !== providerId) {
//       return res.status(403).json({ success: false, message: 'Forbidden: Not your vehicles' });
//     }

//     const vehicles = await Vehicle.find({ provider: providerId })
//       .populate('brand category provider')
//       .lean();

//     res.json({ success: true, count: vehicles.length, data: vehicles });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Internal helper for vendor routes
// exports.getVehiclesByProviderInternal = async (providerId) => {
//   const vehicles = await Vehicle.find({ provider: providerId })
//     .populate('brand category provider')
//     .lean();
//   return vehicles;
// };

// // Get single vehicle
// exports.getVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id)
//       .populate('brand category provider')
//       .lean();
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ================= UPDATE =================

// exports.updateVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check authorization - vendors can only update their own vehicles
//     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     const oldImages = vehicle.images.slice();
//     const oldThumbnail = vehicle.thumbnail;
//     const oldDocuments = vehicle.documents.slice();

//     // Handle file uploads - replace old files
//     if (req.files?.images) vehicle.images = req.files.images.map(f => f.filename);
//     if (req.files?.thumbnail && req.files.thumbnail[0]) vehicle.thumbnail = req.files.thumbnail[0].filename;
//     if (req.files?.documents) vehicle.documents = req.files.documents.map(f => f.filename);

//     // Update allowed fields
//     const allowedFields = [
//       'name', 'description', 'brand', 'category', 'model', 'type', 'engineCapacity',
//       'enginePower', 'seatingCapacity', 'airCondition', 'fuelType', 'transmissionType',
//       'pricing', 'discount', 'searchTags', 'vinNumber', 'licensePlateNumber',
//     ];
    
//     // Only allow admin to change provider
//     if (req.user.role === 'admin' && req.body.provider) {
//       allowedFields.push('provider');
//     }
    
//     for (const key of allowedFields) {
//       if (req.body[key] !== undefined) vehicle[key] = req.body[key];
//     }

//     await vehicle.save();

//     // Delete old files only after successful save
//     if (req.files?.images) await deleteFiles(oldImages);
//     if (req.files?.thumbnail && oldThumbnail) await deleteFiles([oldThumbnail]);
//     if (req.files?.documents) await deleteFiles(oldDocuments);

//     // Populate before sending response
//     await vehicle.populate('brand category provider');

//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({ 
//         success: false, 
//         message: `${field === 'vinNumber' ? 'VIN number' : 'License plate number'} already exists` 
//       });
//     }
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ================= DELETE =================

// exports.deleteVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check authorization - vendors can only delete their own vehicles
//     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     // Delete associated files
//     await deleteFiles(vehicle.images);
//     if (vehicle.thumbnail) await deleteFiles([vehicle.thumbnail]);
//     await deleteFiles(vehicle.documents);

//     await vehicle.deleteOne();
//     res.json({ success: true, message: 'Vehicle deleted' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ================= BLOCK / REACTIVATE =================

// exports.blockVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check authorization - vendors can only block their own vehicles
//     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     vehicle.isActive = false;
//     await vehicle.save();
    
//     // Populate before sending response
//     await vehicle.populate('brand category provider');
    
//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// exports.reactivateVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

//     // Check authorization - vendors can only reactivate their own vehicles
//     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
//       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
//     }

//     vehicle.isActive = true;
//     await vehicle.save();
    
//     // Populate before sending response
//     await vehicle.populate('brand category provider');
    
//     res.json({ success: true, data: vehicle });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



const Vehicle = require('../../models/vendor/Vehicle');
const fs = require('fs').promises;
const path = require('path');

// ================= HELPERS =================
const deleteFiles = async (files = []) => {
  if (!files.length) return;
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.resolve(__dirname, '../../uploads/vehicles', file);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') console.error(`Failed to delete ${file}:`, err);
      }
    })
  );
};

const sendResponse = (res, status, success, message, data = null, meta = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (meta) response.meta = meta;
  return res.status(status).json(response);
};

// ✅ Provider population with excluded sensitive fields
const populateProvider = {
  path: 'provider',
  select: '-password -email -refreshToken -resetPasswordToken -resetPasswordExpire -firstName -lastName -vinNumber'
};

// ================= CREATE =================
exports.createVehicle = async (req, res) => {
  const body = { ...req.body };

  // ✅ Provider auto-fill
  if (!body.provider && req.user) {
    body.provider = req.user._id;
  } else if (req.user?.role === 'vendor' && body.provider && body.provider.toString() !== req.user._id.toString()) {
    return sendResponse(res, 403, false, 'Unauthorized: Invalid provider');
  }

  // Handle uploads
  if (req.files?.images) body.images = req.files.images.map((f) => f.filename);
  if (req.files?.thumbnail?.[0]) body.thumbnail = req.files.thumbnail[0].filename;
  if (req.files?.documents) body.documents = req.files.documents.map((f) => f.filename);

  try {
    const vehicle = await Vehicle.create(body);
    await vehicle.populate([
      'brand',
      'category',
      populateProvider,
      'zone'
    ]);
    sendResponse(res, 201, true, 'Vehicle created successfully', vehicle);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(res, 400, false, `${field === 'vinNumber' ? 'VIN number' : 'License plate number'} already exists`);
    }
    sendResponse(res, 400, false, error.message);
  }
};

// ================= READ =================
exports.getVehicles = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  let query = {};
  
  // ✅ FIX: Filter by provider for vendors
  if (req.user?.role === 'vendor') {
    query.provider = req.user._id;
  }

  if (search) {
    const searchConditions = [
      { name: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { vinNumber: { $regex: search, $options: 'i' } },
      { licensePlateNumber: { $regex: search, $options: 'i' } },
    ];

    // ✅ FIX: Properly combine provider filter with search
    if (query.provider) {
      query.$and = [
        { provider: query.provider },
        { $or: searchConditions }
      ];
      delete query.provider; // Remove from root since it's in $and
    } else {
      query.$or = searchConditions;
    }
  }

  try {
    const [vehicles, totalItems] = await Promise.all([
      Vehicle.find(query)
        .populate('brand')
        .populate('category')
        .populate(populateProvider)
        .populate('zone')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    sendResponse(res, 200, true, 'Vehicles fetched successfully', vehicles, {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
    });
  } catch (error) {
    sendResponse(res, 400, false, error.message);
  }
};

exports.getVehicle = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // ✅ FIX: Vendors can only view their own vehicles
    if (req.user?.role === 'vendor') {
      query.provider = req.user._id;
    }

    const vehicle = await Vehicle.findOne(query)
      .populate('brand')
      .populate('category')
      .populate(populateProvider)
      .populate('zone')
      .lean();
    
    if (!vehicle) return sendResponse(res, 404, false, 'Vehicle not found');
    sendResponse(res, 200, true, 'Vehicle fetched successfully', vehicle);
  } catch (error) {
    sendResponse(res, 400, false, error.message);
  }
};

// ✅ Get vehicles by provider ID
exports.getVehiclesByProvider = async (req, res) => {
  const { providerId } = req.params;
  const { page = 1, limit = 10, search } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  let query = { provider: providerId };
  
  if (search) {
    query.$and = [
      { provider: providerId },
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { vinNumber: { $regex: search, $options: 'i' } },
          { licensePlateNumber: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  try {
    const [vehicles, totalItems] = await Promise.all([
      Vehicle.find(query)
        .populate('brand')
        .populate('category')
        .populate(populateProvider)
        .populate('zone')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    sendResponse(res, 200, true, 'Provider vehicles fetched successfully', vehicles, {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
    });
  } catch (error) {
    sendResponse(res, 400, false, error.message);
  }
};

// ================= UPDATE =================
exports.updateVehicle = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // ✅ FIX: Vendors can only update their own vehicles
    if (req.user?.role === 'vendor') {
      query.provider = req.user._id;
    }

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) return sendResponse(res, 404, false, 'Vehicle not found');

    const oldImages = [...vehicle.images];
    const oldThumbnail = vehicle.thumbnail;
    const oldDocuments = [...vehicle.documents];

    if (req.files?.images) vehicle.images = req.files.images.map((f) => f.filename);
    if (req.files?.thumbnail?.[0]) vehicle.thumbnail = req.files.thumbnail[0].filename;
    if (req.files?.documents) vehicle.documents = req.files.documents.map((f) => f.filename);

    const allowedFields = [
      'name', 'description', 'brand', 'category', 'zone', 'model', 'type',
      'engineCapacity', 'enginePower', 'seatingCapacity', 'airCondition',
      'fuelType', 'transmissionType', 'pricing', 'discount', 'searchTags',
      'vinNumber', 'licensePlateNumber', 'latitude', 'longitude'
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) vehicle[key] = req.body[key];
    }

    await vehicle.save();
    if (req.files?.images) await deleteFiles(oldImages);
    if (req.files?.thumbnail && oldThumbnail) await deleteFiles([oldThumbnail]);
    if (req.files?.documents) await deleteFiles(oldDocuments);
    await vehicle.populate([
      'brand',
      'category',
      populateProvider,
      'zone'
    ]);
    sendResponse(res, 200, true, 'Vehicle updated successfully', vehicle);
  } catch (error) {
    sendResponse(res, 400, false, error.message);
  }
};

// ================= DELETE =================
exports.deleteVehicle = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // ✅ FIX: Vendors can only delete their own vehicles
    if (req.user?.role === 'vendor') {
      query.provider = req.user._id;
    }

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) return sendResponse(res, 404, false, 'Vehicle not found');

    await Promise.all([
      deleteFiles(vehicle.images),
      vehicle.thumbnail ? deleteFiles([vehicle.thumbnail]) : null,
      deleteFiles(vehicle.documents),
    ]);

    await vehicle.deleteOne();
    sendResponse(res, 200, true, 'Vehicle deleted successfully');
  } catch (error) {
    sendResponse(res, 400, false, error.message);
  }
};