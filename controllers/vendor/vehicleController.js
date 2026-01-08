// // const Vehicle = require('../../models/vendor/Vehicle');
// // const fs = require('fs').promises;
// // const path = require('path');

// // // Helper: delete files
// // const deleteFiles = async (files) => {
// //   if (!files || files.length === 0) return;
// //   for (const file of files) {
// //     const filePath = path.resolve(__dirname, '../../Uploads/vehicles', file);
// //     try {
// //       if (await fs.access(filePath)) {
// //         await fs.unlink(filePath);
// //       }
// //     } catch (error) {
// //       console.error(`Failed to delete file ${filePath}:`, error);
// //     }
// //   }
// // };

// // // ✅ Create Vehicle
// // exports.createVehicle = async (req, res) => {
// //   try {
// //     const { body } = req;

// //     // Ensure provider is the authenticated user (if provided)
// //     if (body.provider && (!req.user || body.provider.toString() !== req.user._id.toString())) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Invalid provider' });
// //     }

// //     // Handle uploaded files
// //     if (req.files?.images) {
// //       body.images = req.files.images.map((f) => f.filename);
// //     }
// //     if (req.files?.thumbnail && req.files.thumbnail[0]) {
// //       body.thumbnail = req.files.thumbnail[0].filename;
// //     }
// //     if (req.files?.documents) {
// //       body.documents = req.files.documents.map((f) => f.filename);
// //     }

// //     const vehicle = await Vehicle.create(body);
// //     res.status(201).json({ success: true, data: vehicle });
// //   } catch (error) {
// //     if (error.code === 11000) {
// //       return res.status(400).json({ success: false, message: 'VIN or license plate already exists' });
// //     }
// //     res.status(400).json({ success: false, message: error.message });
// //   }
// // };

// // // ✅ Get All Vehicles
// // exports.getVehicles = async (req, res) => {
// //   try {
// //     const vehicles = await Vehicle.find()
// //       .populate('brand category provider')
// //       .lean();
// //     res.json({ success: true, data: vehicles });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ✅ Get Single Vehicle
// // exports.getVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id)
// //       .populate('brand category provider')
// //       .lean();
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ✅ Update Vehicle
// // exports.updateVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check if the authenticated user is the provider (if provider exists)
// //     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     // Store old files for deletion after successful update
// //     const oldImages = vehicle.images.slice();
// //     const oldThumbnail = vehicle.thumbnail;
// //     const oldDocuments = vehicle.documents.slice();

// //     // Update fields
// //     if (req.files?.images) {
// //       vehicle.images = req.files.images.map((f) => f.filename);
// //     }
// //     if (req.files?.thumbnail && req.files.thumbnail[0]) {
// //       vehicle.thumbnail = req.files.thumbnail[0].filename;
// //     }
// //     if (req.files?.documents) {
// //       vehicle.documents = req.files.documents.map((f) => f.filename);
// //     }

// //     // Update other fields (sanitize req.body)
// //     const allowedFields = [
// //       'name', 'description', 'brand', 'category', 'model', 'type', 'engineCapacity',
// //       'enginePower', 'seatingCapacity', 'airCondition', 'fuelType', 'transmissionType',
// //       'pricing', 'discount', 'searchTags', 'vinNumber', 'licensePlateNumber', 'provider',
// //     ];
// //     for (const key of allowedFields) {
// //       if (req.body[key] !== undefined) {
// //         vehicle[key] = req.body[key];
// //       }
// //     }

// //     await vehicle.save();

// //     // Delete old files after successful update
// //     if (req.files?.images) await deleteFiles(oldImages);
// //     if (req.files?.thumbnail && oldThumbnail) await deleteFiles([oldThumbnail]);
// //     if (req.files?.documents) await deleteFiles(oldDocuments);

// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     if (error.code === 11000) {
// //       return res.status(400).json({ success: false, message: 'VIN or license plate already exists' });
// //     }
// //     res.status(400).json({ success: false, message: error.message });
// //   }
// // };

// // // ✅ Delete Vehicle
// // exports.deleteVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check if the authenticated user is the provider (if provider exists)
// //     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     await deleteFiles(vehicle.images);
// //     if (vehicle.thumbnail) await deleteFiles([vehicle.thumbnail]);
// //     await deleteFiles(vehicle.documents);

// //     await vehicle.deleteOne();
// //     res.json({ success: true, message: 'Vehicle deleted' });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ✅ Block Vehicle
// // exports.blockVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check if the authenticated user is the provider (if provider exists)
// //     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     vehicle.isActive = false;
// //     await vehicle.save();
// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ✅ Reactivate Vehicle
// // exports.reactivateVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check if the authenticated user is the provider (if provider exists)
// //     if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     vehicle.isActive = true;
// //     await vehicle.save();
// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // const Vehicle = require('../../models/vendor/Vehicle');
// // const fs = require('fs').promises;
// // const path = require('path');

// // // Helper: delete files
// // const deleteFiles = async (files) => {
// //   if (!files || files.length === 0) return;
// //   for (const file of files) {
// //     const filePath = path.resolve(__dirname, '../../Uploads/vehicles', file);
// //     try {
// //       await fs.access(filePath);
// //       await fs.unlink(filePath);
// //     } catch (error) {
// //       console.error(`Failed to delete file ${filePath}:`, error);
// //     }
// //   }
// // };

// // // ================= CREATE =================

// // exports.createVehicle = async (req, res) => {
// //   try {
// //     const { body } = req;

// //     // Set provider from authenticated user if not provided or validate if provided
// //     if (!body.provider) {
// //       body.provider = req.user._id;
// //     } else if (body.provider.toString() !== req.user._id.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Invalid provider' });
// //     }

// //     // Handle file uploads
// //     if (req.files?.images) body.images = req.files.images.map(f => f.filename);
// //     if (req.files?.thumbnail && req.files.thumbnail[0]) body.thumbnail = req.files.thumbnail[0].filename;
// //     if (req.files?.documents) body.documents = req.files.documents.map(f => f.filename);

// //     // Create vehicle
// //     const vehicle = await Vehicle.create(body);

// //     // Populate the provider field before sending response
// //     await vehicle.populate('brand category provider');

// //     res.status(201).json({ success: true, data: vehicle });
// //   } catch (error) {
// //     // Handle duplicate key errors
// //     if (error.code === 11000) {
// //       const field = Object.keys(error.keyPattern)[0];
// //       return res.status(400).json({
// //         success: false,
// //         message: `${field === 'vinNumber' ? 'VIN number' : 'License plate number'} already exists`
// //       });
// //     }
// //     res.status(400).json({ success: false, message: error.message });
// //   }
// // };

// // // ================= READ =================

// // // Get all vehicles (admin sees all, vendor sees only their own)
// // // exports.getVehicles = async (req, res) => {
// // //   try {
// // //     let vehicles;
// // //     if (req.user.role === 'vendor') {
// // //       vehicles = await Vehicle.find({ provider: req.user._id }).populate('brand category provider').lean();
// // //     } else {
// // //       vehicles = await Vehicle.find().populate('brand category provider').lean();
// // //     }
// // //     res.json({ success: true, count: vehicles.length, data: vehicles });
// // //   } catch (error) {
// // //     res.status(500).json({ success: false, message: error.message });
// // //   }
// // // };
// // // Get all vehicles (admin sees all, vendor sees only their own)
// // exports.getVehicles = async (req, res) => {
// //   try {
// //     const { page = 1, limit = 10, search } = req.query;

// //     // Convert page and limit to numbers
// //     const pageNum = parseInt(page, 10);
// //     const limitNum = parseInt(limit, 10);
// //     const skip = (pageNum - 1) * limitNum;

// //     // Build query
// //     let query = {};
// //     if (req.user.role === 'vendor') {
// //       query.provider = req.user._id;
// //     }

// //     // Add search functionality if search term is provided
// //     if (search) {
// //       query.$or = [
// //         { name: { $regex: search, $options: 'i' } },
// //         { model: { $regex: search, $options: 'i' } },
// //         { vinNumber: { $regex: search, $options: 'i' } },
// //         { licensePlateNumber: { $regex: search, $options: 'i' } },
// //       ];
// //     }

// //     // Fetch vehicles with pagination
// //     const vehicles = await Vehicle.find(query)
// //       .populate('brand category provider')
// //       .skip(skip)
// //       .limit(limitNum)
// //       .lean();

// //     // Get total count for pagination
// //     const totalItems = await Vehicle.countDocuments(query);

// //     // Calculate pagination metadata
// //     const totalPages = Math.ceil(totalItems / limitNum);

// //     // Send response with pagination data
// //     res.json({
// //       success: true,
// //       data: {
// //         vehicles,
// //         pagination: {
// //           currentPage: pageNum,
// //           totalPages,
// //           totalItems,
// //           itemsPerPage: limitNum,
// //         },
// //       },
// //     });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // Get all vehicles for a specific provider (admin or vendor)
// // exports.getVehiclesByProvider = async (req, res) => {
// //   try {
// //     const providerId = req.params.providerId;

// //     if (req.user.role === 'vendor' && req.user._id.toString() !== providerId) {
// //       return res.status(403).json({ success: false, message: 'Forbidden: Not your vehicles' });
// //     }

// //     const vehicles = await Vehicle.find({ provider: providerId })
// //       .populate('brand category provider')
// //       .lean();

// //     res.json({ success: true, count: vehicles.length, data: vehicles });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // Internal helper for vendor routes
// // exports.getVehiclesByProviderInternal = async (providerId) => {
// //   const vehicles = await Vehicle.find({ provider: providerId })
// //     .populate('brand category provider')
// //     .lean();
// //   return vehicles;
// // };

// // // Get single vehicle
// // exports.getVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id)
// //       .populate('brand category provider')
// //       .lean();
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ================= UPDATE =================

// // exports.updateVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check authorization - vendors can only update their own vehicles
// //     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     const oldImages = vehicle.images.slice();
// //     const oldThumbnail = vehicle.thumbnail;
// //     const oldDocuments = vehicle.documents.slice();

// //     // Handle file uploads - replace old files
// //     if (req.files?.images) vehicle.images = req.files.images.map(f => f.filename);
// //     if (req.files?.thumbnail && req.files.thumbnail[0]) vehicle.thumbnail = req.files.thumbnail[0].filename;
// //     if (req.files?.documents) vehicle.documents = req.files.documents.map(f => f.filename);

// //     // Update allowed fields
// //     const allowedFields = [
// //       'name', 'description', 'brand', 'category', 'model', 'type', 'engineCapacity',
// //       'enginePower', 'seatingCapacity', 'airCondition', 'fuelType', 'transmissionType',
// //       'pricing', 'discount', 'searchTags', 'vinNumber', 'licensePlateNumber',
// //     ];

// //     // Only allow admin to change provider
// //     if (req.user.role === 'admin' && req.body.provider) {
// //       allowedFields.push('provider');
// //     }

// //     for (const key of allowedFields) {
// //       if (req.body[key] !== undefined) vehicle[key] = req.body[key];
// //     }

// //     await vehicle.save();

// //     // Delete old files only after successful save
// //     if (req.files?.images) await deleteFiles(oldImages);
// //     if (req.files?.thumbnail && oldThumbnail) await deleteFiles([oldThumbnail]);
// //     if (req.files?.documents) await deleteFiles(oldDocuments);

// //     // Populate before sending response
// //     await vehicle.populate('brand category provider');

// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     if (error.code === 11000) {
// //       const field = Object.keys(error.keyPattern)[0];
// //       return res.status(400).json({
// //         success: false,
// //         message: `${field === 'vinNumber' ? 'VIN number' : 'License plate number'} already exists`
// //       });
// //     }
// //     res.status(400).json({ success: false, message: error.message });
// //   }
// // };

// // // ================= DELETE =================

// // exports.deleteVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check authorization - vendors can only delete their own vehicles
// //     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     // Delete associated files
// //     await deleteFiles(vehicle.images);
// //     if (vehicle.thumbnail) await deleteFiles([vehicle.thumbnail]);
// //     await deleteFiles(vehicle.documents);

// //     await vehicle.deleteOne();
// //     res.json({ success: true, message: 'Vehicle deleted' });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ================= BLOCK / REACTIVATE =================

// // exports.blockVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check authorization - vendors can only block their own vehicles
// //     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     vehicle.isActive = false;
// //     await vehicle.save();

// //     // Populate before sending response
// //     await vehicle.populate('brand category provider');

// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // exports.reactivateVehicle = async (req, res) => {
// //   try {
// //     const vehicle = await Vehicle.findById(req.params.id);
// //     if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

// //     // Check authorization - vendors can only reactivate their own vehicles
// //     if (req.user.role === 'vendor' && vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
// //       return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
// //     }

// //     vehicle.isActive = true;
// //     await vehicle.save();

// //     // Populate before sending response
// //     await vehicle.populate('brand category provider');

// //     res.json({ success: true, data: vehicle });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// const Vehicle = require("../../models/vendor/Vehicle");
// const fs = require("fs").promises;
// const path = require("path");
// const mongoose = require("mongoose");
// const Category = require("../../models/admin/category");

// // ================= HELPERS =================
// const deleteFiles = async (files = []) => {
//   if (!files.length) return;
//   await Promise.all(
//     files.map(async (file) => {
//       const filePath = path.resolve(__dirname, "../../Uploads/vehicles", file);
//       try {
//         await fs.unlink(filePath);
//       } catch (err) {
//         if (err.code !== "ENOENT")
//           console.error(`Failed to delete ${file}:`, err);
//       }
//     })
//   );
// };

// const sendResponse = (
//   res,
//   status,
//   success,
//   message,
//   data = null,
//   meta = null
// ) => {
//   const response = { success, message };
//   if (data) response.data = data;
//   if (meta) response.meta = meta;
//   return res.status(status).json(response);
// };

// const populateProvider = {
//   path: "provider",
//   select:
//     "-password -email -refreshToken -resetPasswordToken -resetPasswordExpire -firstName -lastName -vinNumber",
// };

// const parseCategories = (categories) => {
//   if (!categories) return [];

//   let parsed = categories;

//   if (typeof parsed === "string") {
//     parsed = parsed.trim();
//     try {
//       parsed = JSON.parse(parsed);
//       if (typeof parsed === "string") {
//         parsed = JSON.parse(parsed);
//       }
//     } catch {
//       parsed = parsed
//         .replace(/[\[\]"']/g, "")
//         .split(",")
//         .map((c) => c.trim())
//         .filter((c) => c);
//     }
//   }

//   if (Array.isArray(parsed)) {
//     const validIds = parsed
//       .flat()
//       .filter((c) => c && mongoose.Types.ObjectId.isValid(c))
//       .map((c) => new mongoose.Types.ObjectId(c));
//     return validIds;
//   }

//   return [];
// };

// // ================= CREATE =================
// exports.createVehicle = async (req, res) => {
//   const body = { ...req.body };

//   // Provider auto-fill
//   if (!body.provider && req.user) {
//     body.provider = req.user._id;
//   } else if (
//     req.user?.role === "vendor" &&
//     body.provider &&
//     body.provider.toString() !== req.user._id.toString()
//   ) {
//     return sendResponse(res, 403, false, "Unauthorized: Invalid provider");
//   }

//   // Trim and sanitize string fields
//   if (body.brand) body.brand = body.brand.trim();
//   if (body.type) body.type = body.type.trim().toLowerCase();
//   if (body.fuelType) body.fuelType = body.fuelType.trim().toLowerCase();
//   if (body.transmissionType)
//     body.transmissionType = body.transmissionType.trim().toLowerCase();
//   if (body.model) body.model = body.model.trim();
//   if (body.name) body.name = body.name.trim();
//   if (body.description) body.description = body.description.trim();
//   if (body.vinNumber) body.vinNumber = body.vinNumber.trim();
//   if (body.licensePlateNumber)
//     body.licensePlateNumber = body.licensePlateNumber.trim();
//   if (body.searchTags) {
//     body.searchTags = Array.isArray(body.searchTags)
//       ? body.searchTags.map((tag) => tag.trim())
//       : body.searchTags.split(",").map((tag) => tag.trim());
//   }

//   // Convert airCondition to boolean
//   if (body.airCondition !== undefined) {
//     if (typeof body.airCondition === "string") {
//       body.airCondition = body.airCondition.trim().toLowerCase() === "true";
//     } else {
//       body.airCondition = !!body.airCondition;
//     }
//   }

//   // Parse categories
//   if (body.categories) {
//     body.category = parseCategories(body.categories);
//     delete body.categories;
//   } else if (body.category) {
//     body.category = parseCategories(body.category);
//   } else {
//     body.category = [];
//   }

//   // Handle uploads
//   if (req.files?.images) body.images = req.files.images.map((f) => f.filename);
//   if (req.files?.thumbnail?.[0])
//     body.thumbnail = req.files.thumbnail[0].filename;
//   if (req.files?.documents)
//     body.documents = req.files.documents.map((f) => f.filename);

//   try {
//     // Verify categories exist
//     if (body.category && body.category.length > 0) {
//       const existingCategories = await Category.find({
//         _id: { $in: body.category },
//       }).select("_id title");

//       if (existingCategories.length === 0) {
//         console.warn(
//           "⚠️ WARNING: None of the provided category IDs exist in the database"
//         );
//       } else if (existingCategories.length < body.category.length) {
//         const foundIds = existingCategories.map((c) => c._id.toString());
//         const missingIds = body.category.filter(
//           (id) => !foundIds.includes(id.toString())
//         );
//         console.warn("⚠️ WARNING: Some category IDs not found:", missingIds);
//       }
//     }

//     // Verify brand exists
//     if (body.brand && !mongoose.Types.ObjectId.isValid(body.brand)) {
//       return sendResponse(res, 400, false, "Invalid brand ID");
//     }
//     if (body.brand) {
//       const existingBrand = await mongoose
//         .model("Brand")
//         .findById(body.brand)
//         .select("_id");
//       if (!existingBrand) {
//         return sendResponse(res, 400, false, "Brand does not exist");
//       }
//     }

//     const vehicle = await Vehicle.create(body);

//     // Populate after creation
//     const populatedVehicle = await Vehicle.findById(vehicle._id)
//       .populate("brand")
//       .populate({
//         path: "category",
//         model: "VehicleCategory",
//         select: "title image vehicleCategoryId module isActive",
//       })
//       .populate(populateProvider)
//       .populate("zone")
//       .lean();

//     sendResponse(
//       res,
//       201,
//       true,
//       "Vehicle created successfully",
//       populatedVehicle
//     );
//   } catch (error) {
//     console.error("Error creating vehicle:", error);
//     // Cleanup uploaded files if vehicle creation fails
//     if (body.images?.length) await deleteFiles(body.images);
//     if (body.thumbnail) await deleteFiles([body.thumbnail]);
//     if (body.documents?.length) await deleteFiles(body.documents);

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return sendResponse(
//         res,
//         400,
//         false,
//         `${
//           field === "vinNumber" ? "VIN number" : "License plate number"
//         } already exists`
//       );
//     }
//     sendResponse(res, 400, false, error.message);
//   }
// };

// // ================= GET ALL VEHICLES =================
// exports.getVehicles = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       brand,
//       category,
//       type,
//       fuelType,
//       transmissionType,
//       minPrice,
//       maxPrice,
//       search,
//       isActive,
//       zone,
//     } = req.query;

//     const query = {};

//     // Build filters
//     if (brand) query.brand = brand;
//     if (category) query.category = category;
//     if (type) query.type = type.toLowerCase();
//     if (fuelType) query.fuelType = fuelType.toLowerCase();
//     if (transmissionType) query.transmissionType = transmissionType.toLowerCase();
//     if (isActive !== undefined) query.isActive = isActive === "true";
//     if (zone) query.zone = zone;

//     // Price range filter
//     if (minPrice || maxPrice) {
//       query.$or = [
//         { "pricing.hourly": {} },
//         { "pricing.perDay": {} },
//         { "pricing.distanceWise": {} },
//       ];
//       if (minPrice) {
//         query.$or.forEach((priceQuery) => {
//           const key = Object.keys(priceQuery)[0];
//           priceQuery[key].$gte = Number(minPrice);
//         });
//       }
//       if (maxPrice) {
//         query.$or.forEach((priceQuery) => {
//           const key = Object.keys(priceQuery)[0];
//           priceQuery[key].$lte = Number(maxPrice);
//         });
//       }
//     }

//     // Search functionality
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//         { model: { $regex: search, $options: "i" } },
//         { searchTags: { $in: [new RegExp(search, "i")] } },
//       ];
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [vehicles, total] = await Promise.all([
//       Vehicle.find(query)
//         .populate("brand")
//         .populate({
//           path: "category",
//           model: "VehicleCategory",
//           select: "title image vehicleCategoryId module isActive",
//         })
//         .populate(populateProvider)
//         .populate("zone")
//         .skip(skip)
//         .limit(Number(limit))
//         .sort({ createdAt: -1 })
//         .lean(),
//       Vehicle.countDocuments(query),
//     ]);

//     const meta = {
//       total,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(total / Number(limit)),
//     };

//     sendResponse(res, 200, true, "Vehicles retrieved successfully", vehicles, meta);
//   } catch (error) {
//     console.error("Error fetching vehicles:", error);
//     sendResponse(res, 500, false, error.message);
//   }
// };

// // ================= GET SINGLE VEHICLE =================
// exports.getVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id)
//       .populate("brand")
//       .populate({
//         path: "category",
//         model: "VehicleCategory",
//         select: "title image vehicleCategoryId module isActive",
//       })
//       .populate(populateProvider)
//       .populate("zone")
//       .lean();

//     if (!vehicle) {
//       return sendResponse(res, 404, false, "Vehicle not found");
//     }

//     sendResponse(res, 200, true, "Vehicle retrieved successfully", vehicle);
//   } catch (error) {
//     console.error("Error fetching vehicle:", error);
//     sendResponse(res, 500, false, error.message);
//   }
// };

// // ================= GET VEHICLES BY PROVIDER =================
// exports.getVehiclesByProvider = async (req, res) => {
//   try {
//     const { providerId } = req.params;
//     const { page = 1, limit = 10, isActive } = req.query;

//     const query = { provider: providerId };
//     if (isActive !== undefined) query.isActive = isActive === "true";

//     const skip = (Number(page) - 1) * Number(limit);

//     const [vehicles, total] = await Promise.all([
//       Vehicle.find(query)
//         .populate("brand")
//         .populate({
//           path: "category",
//           model: "VehicleCategory",
//           select: "title image vehicleCategoryId module isActive",
//         })
//         .populate(populateProvider)
//         .populate("zone")
//         .skip(skip)
//         .limit(Number(limit))
//         .sort({ createdAt: -1 })
//         .lean(),
//       Vehicle.countDocuments(query),
//     ]);

//     const meta = {
//       total,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(total / Number(limit)),
//     };

//     sendResponse(
//       res,
//       200,
//       true,
//       "Provider vehicles retrieved successfully",
//       vehicles,
//       meta
//     );
//   } catch (error) {
//     console.error("Error fetching provider vehicles:", error);
//     sendResponse(res, 500, false, error.message);
//   }
// };

// // ================= UPDATE VEHICLE =================
// exports.updateVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);

//     if (!vehicle) {
//       return sendResponse(res, 404, false, "Vehicle not found");
//     }

//     // Authorization check
//     if (
//       req.user.role === "vendor" &&
//       vehicle.provider.toString() !== req.user._id.toString()
//     ) {
//       return sendResponse(res, 403, false, "Unauthorized to update this vehicle");
//     }

//     const body = { ...req.body };

//     // Trim and sanitize string fields
//     if (body.brand) body.brand = body.brand.trim();
//     if (body.type) body.type = body.type.trim().toLowerCase();
//     if (body.fuelType) body.fuelType = body.fuelType.trim().toLowerCase();
//     if (body.transmissionType)
//       body.transmissionType = body.transmissionType.trim().toLowerCase();
//     if (body.model) body.model = body.model.trim();
//     if (body.name) body.name = body.name.trim();
//     if (body.description) body.description = body.description.trim();
//     if (body.vinNumber) body.vinNumber = body.vinNumber.trim();
//     if (body.licensePlateNumber)
//       body.licensePlateNumber = body.licensePlateNumber.trim();
//     if (body.searchTags) {
//       body.searchTags = Array.isArray(body.searchTags)
//         ? body.searchTags.map((tag) => tag.trim())
//         : body.searchTags.split(",").map((tag) => tag.trim());
//     }

//     // Convert airCondition to boolean
//     if (body.airCondition !== undefined) {
//       if (typeof body.airCondition === "string") {
//         body.airCondition = body.airCondition.trim().toLowerCase() === "true";
//       } else {
//         body.airCondition = !!body.airCondition;
//       }
//     }

//     // Parse categories
//     if (body.categories) {
//       body.category = parseCategories(body.categories);
//       delete body.categories;
//     } else if (body.category) {
//       body.category = parseCategories(body.category);
//     }

//     // Track old files for cleanup
//     const filesToDelete = [];

//     // Handle new file uploads
//     if (req.files?.images) {
//       if (vehicle.images?.length) filesToDelete.push(...vehicle.images);
//       body.images = req.files.images.map((f) => f.filename);
//     }
//     if (req.files?.thumbnail?.[0]) {
//       if (vehicle.thumbnail) filesToDelete.push(vehicle.thumbnail);
//       body.thumbnail = req.files.thumbnail[0].filename;
//     }
//     if (req.files?.documents) {
//       if (vehicle.documents?.length) filesToDelete.push(...vehicle.documents);
//       body.documents = req.files.documents.map((f) => f.filename);
//     }

//     // Verify brand if changed
//     if (body.brand && body.brand !== vehicle.brand?.toString()) {
//       if (!mongoose.Types.ObjectId.isValid(body.brand)) {
//         return sendResponse(res, 400, false, "Invalid brand ID");
//       }
//       const existingBrand = await mongoose
//         .model("Brand")
//         .findById(body.brand)
//         .select("_id");
//       if (!existingBrand) {
//         return sendResponse(res, 400, false, "Brand does not exist");
//       }
//     }

//     // Update vehicle
//     Object.assign(vehicle, body);
//     await vehicle.save();

//     // Cleanup old files
//     if (filesToDelete.length) await deleteFiles(filesToDelete);

//     // Populate and return updated vehicle
//     const updatedVehicle = await Vehicle.findById(vehicle._id)
//       .populate("brand")
//       .populate({
//         path: "category",
//         model: "VehicleCategory",
//         select: "title image vehicleCategoryId module isActive",
//       })
//       .populate(populateProvider)
//       .populate("zone")
//       .lean();

//     sendResponse(res, 200, true, "Vehicle updated successfully", updatedVehicle);
//   } catch (error) {
//     console.error("Error updating vehicle:", error);

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return sendResponse(
//         res,
//         400,
//         false,
//         `${
//           field === "vinNumber" ? "VIN number" : "License plate number"
//         } already exists`
//       );
//     }
//     sendResponse(res, 500, false, error.message);
//   }
// };

// // ================= DELETE VEHICLE =================
// exports.deleteVehicle = async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);

//     if (!vehicle) {
//       return sendResponse(res, 404, false, "Vehicle not found");
//     }

//     // Authorization check
//     if (
//       req.user.role === "vendor" &&
//       vehicle.provider.toString() !== req.user._id.toString()
//     ) {
//       return sendResponse(res, 403, false, "Unauthorized to delete this vehicle");
//     }

//     // Collect all files to delete
//     const filesToDelete = [
//       ...(vehicle.images || []),
//       ...(vehicle.documents || []),
//     ];
//     if (vehicle.thumbnail) filesToDelete.push(vehicle.thumbnail);

//     // Delete vehicle
//     await vehicle.deleteOne();

//     // Cleanup files
//     if (filesToDelete.length) await deleteFiles(filesToDelete);

//     sendResponse(res, 200, true, "Vehicle deleted successfully");
//   } catch (error) {
//     console.error("Error deleting vehicle:", error);
//     sendResponse(res, 500, false, error.message);
//   }
// };

const Vehicle = require("../../models/vendor/Vehicle");
const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Category = require("../../models/admin/category");


// ================= HELPERS =================
const deleteFiles = async (files = []) => {
  if (!files.length) return;
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.resolve(__dirname, "../../Uploads/vehicles", file);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== "ENOENT")
          console.error(`Failed to delete ${file}:`, err);
      }
    })
  );
};


const VEHICLE_UPLOAD_PATH = "/uploads/vehicles";

const attachVehicleImageUrls = (vehicle) => {
  if (!vehicle) return vehicle;

  if (vehicle.thumbnail) {
    vehicle.thumbnail = `${VEHICLE_UPLOAD_PATH}/${vehicle.thumbnail}`;
  }

  if (Array.isArray(vehicle.images)) {
    vehicle.images = vehicle.images.map(
      (img) => `${VEHICLE_UPLOAD_PATH}/${img}`
    );
  }

  if (Array.isArray(vehicle.documents)) {
    vehicle.documents = vehicle.documents.map(
      (doc) => `${VEHICLE_UPLOAD_PATH}/${doc}`
    );
  }

  return vehicle;
};


const sendResponse = (
  res,
  status,
  success,
  message,
  data = null,
  meta = null
) => {
  const response = { success, message };
  if (data) response.data = data;
  if (meta) response.meta = meta;
  return res.status(status).json(response);
};

const populateProvider = {
  path: "provider",
  select:
    "-password -email -refreshToken -resetPasswordToken -resetPasswordExpire -firstName -lastName -vinNumber",
};

// Parse ObjectId arrays (for categories, brands)
const parseObjectIdArray = (value) => {
  if (!value) return [];

  let parsed = value;

  if (typeof parsed === "string") {
    parsed = parsed.trim();
    try {
      parsed = JSON.parse(parsed);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch {
      parsed = parsed
        .replace(/[\[\]"']/g, "")
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
    }
  }

  if (Array.isArray(parsed)) {
    const validIds = parsed
      .flat()
      .filter((c) => c && mongoose.Types.ObjectId.isValid(c))
      .map((c) => new mongoose.Types.ObjectId(c));
    return validIds;
  }

  return [];
};

// Parse string arrays (for connectivity, sensors, safety, etc.)
const parseStringArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter((item) => item);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim().toLowerCase())
          .filter((item) => item);
      }
    } catch (e) {
      // Not valid JSON, continue to CSV parsing
    }

    return trimmed
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) =>
        item
          .trim()
          .replace(/^["']|["']$/g, "")
          .toLowerCase()
      )
      .filter((item) => item);
  }

  return [];
};

const parseObjectId = (value) => {
  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    try {
      const parsed = JSON.parse(trimmed);
      if (mongoose.Types.ObjectId.isValid(parsed)) {
        return new mongoose.Types.ObjectId(parsed);
      }
    } catch (e) {
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        return new mongoose.Types.ObjectId(trimmed);
      }
    }
  }

  return null;
};

// Sanitize and parse request body
// Sanitize and parse request body - FIXED VERSION
const sanitizeVehicleData = (body) => {
  const sanitized = { ...body };

  // Parse brand as single ObjectId
  if (sanitized.brand) sanitized.brand = parseObjectId(sanitized.brand);

  // Parse fuelType and transmissionType as single strings with type safety
  if (sanitized.fuelType) {
    sanitized.fuelType =
      typeof sanitized.fuelType === "string"
        ? sanitized.fuelType.trim().toLowerCase()
        : String(sanitized.fuelType).toLowerCase();
  }
  if (sanitized.transmissionType) {
    sanitized.transmissionType =
      typeof sanitized.transmissionType === "string"
        ? sanitized.transmissionType.trim().toLowerCase()
        : String(sanitized.transmissionType).toLowerCase();
  }

  // ✅ FIXED: Add type checking for seatType
  if (sanitized.seatType) {
    sanitized.seatType =
      typeof sanitized.seatType === "string"
        ? sanitized.seatType.trim().toLowerCase()
        : String(sanitized.seatType).toLowerCase();
  }

  // ✅ FIXED: Add type checking for camera
  if (sanitized.camera) {
    sanitized.camera =
      typeof sanitized.camera === "string"
        ? sanitized.camera.trim().toLowerCase()
        : String(sanitized.camera).toLowerCase();
  }

  // ✅ FIXED: Add type checking for all string fields
  if (sanitized.model) {
    sanitized.model =
      typeof sanitized.model === "string"
        ? sanitized.model.trim()
        : String(sanitized.model);
  }
  if (sanitized.name) {
    sanitized.name =
      typeof sanitized.name === "string"
        ? sanitized.name.trim()
        : String(sanitized.name);
  }
  if (sanitized.description) {
    sanitized.description =
      typeof sanitized.description === "string"
        ? sanitized.description.trim()
        : String(sanitized.description);
  }
  if (sanitized.vinNumber) {
    sanitized.vinNumber =
      typeof sanitized.vinNumber === "string"
        ? sanitized.vinNumber.trim()
        : String(sanitized.vinNumber);
  }
  if (sanitized.licensePlateNumber) {
    sanitized.licensePlateNumber =
      typeof sanitized.licensePlateNumber === "string"
        ? sanitized.licensePlateNumber.trim()
        : String(sanitized.licensePlateNumber);
  }
  if (sanitized.audioSystem) {
    sanitized.audioSystem =
      typeof sanitized.audioSystem === "string"
        ? sanitized.audioSystem.trim()
        : String(sanitized.audioSystem);
  }

  // Parse string arrays
  if (sanitized.searchTags !== undefined) {
    sanitized.searchTags = parseStringArray(sanitized.searchTags);
  }
  if (sanitized.connectivity !== undefined) {
    sanitized.connectivity = parseStringArray(sanitized.connectivity);
  }
  if (sanitized.sensors !== undefined) {
    sanitized.sensors = parseStringArray(sanitized.sensors);
  }
  if (sanitized.safety !== undefined) {
    sanitized.safety = parseStringArray(sanitized.safety);
  }
  if (sanitized.insuranceIncluded !== undefined) {
    sanitized.insuranceIncluded = parseStringArray(sanitized.insuranceIncluded);
  }
  if (sanitized.insuranceExcluded !== undefined) {
    sanitized.insuranceExcluded = parseStringArray(sanitized.insuranceExcluded);
  }

  // Convert airCondition to boolean
  if (sanitized.airCondition !== undefined) {
    if (typeof sanitized.airCondition === "string") {
      sanitized.airCondition =
        sanitized.airCondition.trim().toLowerCase() === "true";
    } else if (typeof sanitized.airCondition === "boolean") {
      sanitized.airCondition = sanitized.airCondition;
    } else {
      sanitized.airCondition = !!sanitized.airCondition;
    }
  }

  // Advance booking amount parsing
  if (
    sanitized.advanceBookingAmount !== undefined &&
    sanitized.advanceBookingAmount !== ""
  ) {
    const parsed = Number(sanitized.advanceBookingAmount);
    if (!isNaN(parsed)) {
      sanitized.advanceBookingAmount = parsed;
    }
  } else if (sanitized.advanceBookingAmount === "") {
    delete sanitized.advanceBookingAmount;
  }

  // Parse numeric fields
  if (sanitized.airbags !== undefined)
    sanitized.airbags = Number(sanitized.airbags);
  if (sanitized.bootSpace !== undefined)
    sanitized.bootSpace = Number(sanitized.bootSpace);
  if (sanitized.fuelTank !== undefined)
    sanitized.fuelTank = Number(sanitized.fuelTank);
  if (sanitized.engineCapacity !== undefined)
    sanitized.engineCapacity = Number(sanitized.engineCapacity);
  if (sanitized.enginePower !== undefined)
    sanitized.enginePower = Number(sanitized.enginePower);
  if (sanitized.seatingCapacity !== undefined)
    sanitized.seatingCapacity = Number(sanitized.seatingCapacity);
  if (sanitized.discount !== undefined)
    sanitized.discount = Number(sanitized.discount);
  if (sanitized.latitude !== undefined)
    sanitized.latitude = Number(sanitized.latitude);
  if (sanitized.longitude !== undefined)
    sanitized.longitude = Number(sanitized.longitude);

  // Parse pricing object
  if (sanitized.pricing) {
    if (typeof sanitized.pricing === "string") {
      try {
        sanitized.pricing = JSON.parse(sanitized.pricing);
      } catch (e) {
        console.error("Failed to parse pricing:", e);
      }
    }
    if (sanitized.pricing && typeof sanitized.pricing === "object") {
      if (sanitized.pricing.hourly !== undefined) {
        sanitized.pricing.hourly = Number(sanitized.pricing.hourly);
      }
      if (sanitized.pricing.perDay !== undefined) {
        sanitized.pricing.perDay = Number(sanitized.pricing.perDay);
      }
      if (sanitized.pricing.distanceWise !== undefined) {
        sanitized.pricing.distanceWise = Number(sanitized.pricing.distanceWise);
      }
    }
  }

  // Parent category (SINGLE)
  if (sanitized.category) {
    sanitized.category = parseObjectId(sanitized.category);
  }

  // Sub categories (ARRAY)
  if (sanitized.subCategories) {
    sanitized.subCategories = parseObjectIdArray(sanitized.subCategories);
  }

  return sanitized;
};
// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
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

// Helper function to get effective price (min non-zero pricing)
const getEffectivePrice = (pricing) => {
  if (!pricing || typeof pricing !== "object") return 0;

  const prices = [];

  if (pricing.hourly && pricing.hourly > 0) prices.push(pricing.hourly);
  if (pricing.perDay && pricing.perDay > 0) prices.push(pricing.perDay);
  if (pricing.distanceWise && pricing.distanceWise > 0)
    prices.push(pricing.distanceWise);

  return prices.length > 0 ? Math.min(...prices) : 0;
};

// ================= CREATE =================
exports.createVehicle = async (req, res) => {
  const body = sanitizeVehicleData(req.body);

  // Provider auto-fill
  if (!body.provider && req.user) {
    body.provider = req.user._id;
  } else if (
    req.user?.role === "vendor" &&
    body.provider &&
    body.provider.toString() !== req.user._id.toString()
  ) {
    return sendResponse(res, 403, false, "Unauthorized: Invalid provider");
  }

  // Handle uploads
  if (req.files?.images) body.images = req.files.images.map((f) => f.filename);
  if (req.files?.thumbnail?.[0])
    body.thumbnail = req.files.thumbnail[0].filename;
  if (req.files?.documents)
    body.documents = req.files.documents.map((f) => f.filename);

  try {
    // Validate parent category
    if (body.category) {
      const parentExists = await Category.findById(body.category).select("_id");
      if (!parentExists) {
        return sendResponse(res, 400, false, "Invalid parent category");
      }
    }

    // ✅ FIXED: Validate subcategories properly
    if (body.subCategories?.length) {
      const parentCategory = await Category.findById(body.category).lean();

      console.log("📦 Parent category fetched:", parentCategory?.title);
      console.log("📦 Parent subCategories:", parentCategory?.subCategories);
      console.log("📦 Requested subCategories:", body.subCategories);

      if (!parentCategory) {
        return sendResponse(res, 400, false, "Invalid parent category");
      }

      // Extract valid subcategory IDs from parent's embedded subdocuments
     const validSubIds = Array.isArray(parentCategory.subCategories)
  ? parentCategory.subCategories.map((id) => id.toString())
  : [];


      console.log("✅ Valid subcategory IDs:", validSubIds);

      // Filter requested subcategories to only include valid ones
      const validRequestedSubs = body.subCategories.filter((id) =>
        validSubIds.includes(id.toString())
      );

      console.log("✅ Final valid subCategories:", validRequestedSubs);

      // Only set subcategories if there are valid ones
      if (validRequestedSubs.length > 0) {
        body.subCategories = validRequestedSubs;
      } else {
        console.warn("⚠️ No valid subcategories found, setting to empty array");
        body.subCategories = [];
      }
    }

    // Verify brand exists
    if (body.brand) {
      if (!mongoose.Types.ObjectId.isValid(body.brand)) {
        return sendResponse(res, 400, false, "Invalid brand ID format");
      }

      const existingBrand = await mongoose
        .model("Brand")
        .findById(body.brand)
        .select("_id");

      if (!existingBrand) {
        return sendResponse(
          res,
          400,
          false,
          "Brand does not exist in database"
        );
      }
    }

    const vehicle = await Vehicle.create(body);

    // Populate after creation
    // Populate after creation
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive subCategories",
      })
      .populate(populateProvider)
      .populate("zone")
      .lean();
      attachVehicleImageUrls(populatedVehicle);


    // ✅ MANUAL subCategory population (THIS IS THE KEY)
    // ✅ MANUAL subCategory population (CORRECT WAY)
    if (populatedVehicle.subCategories?.length) {
      const subCategoryIds = populatedVehicle.subCategories.map((id) =>
        id.toString()
      );

      const subCategoryDocs = await Category.find({
        _id: { $in: subCategoryIds },
        parentCategory: populatedVehicle.category._id,
        isActive: true,
      }).select("title image isActive");

      populatedVehicle.subCategories = subCategoryDocs;

 
    }

    // Remove nested subCategories from category (clean response)
    if (populatedVehicle.category) {
      delete populatedVehicle.category.subCategories;
    }

    sendResponse(
      res,
      201,
      true,
      "Vehicle created successfully",
      populatedVehicle
    );
  } catch (error) {
    console.error("Error creating vehicle:", error);
    // Cleanup uploaded files if vehicle creation fails
    if (body.images?.length) await deleteFiles(body.images);
    if (body.thumbnail) await deleteFiles([body.thumbnail]);
    if (body.documents?.length) await deleteFiles(body.documents);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(
        res,
        400,
        false,
        `${
          field === "vinNumber" ? "VIN number" : "License plate number"
        } already exists`
      );
    }
    sendResponse(res, 400, false, error.message);
  }
};

// ================= GET ALL VEHICLES =================
exports.getVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      brand,
      category,
      fuelType,
      transmissionType,
      seatType,
      camera,
      minPrice,
      maxPrice,
      search,
      isActive,
      zone,
    } = req.query;

    const query = {};

    // Build filters
    if (brand) query.brand = parseObjectIdArray(brand);
    if (category) query.category = { $in: parseObjectIdArray(category) };
    if (fuelType) query.fuelType = { $in: parseStringArray(fuelType) };
    if (transmissionType)
      query.transmissionType = { $in: parseStringArray(transmissionType) };
    if (seatType) query.seatType = seatType.toLowerCase();
    if (camera) query.camera = camera.toLowerCase();
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (zone) query.zone = zone;

    // Price range filter
    if (minPrice || maxPrice) {
      query.$or = [
        { "pricing.hourly": {} },
        { "pricing.perDay": {} },
        { "pricing.distanceWise": {} },
      ];
      if (minPrice) {
        const min = Number(minPrice);
        query.$or.forEach((priceQuery) => {
          const key = Object.keys(priceQuery)[0];
          priceQuery[key].$gte = min;
        });
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        query.$or.forEach((priceQuery) => {
          const key = Object.keys(priceQuery)[0];
          priceQuery[key].$lte = max;
        });
      }
    }

    // Search functionality
    if (search) {
      const keywordRegex = new RegExp(search, "i");
      query.$or = [
        { name: keywordRegex },
        { description: keywordRegex },
        { model: keywordRegex },
        { audioSystem: keywordRegex },
        { searchTags: { $in: [keywordRegex] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate("brand")
        .populate({
          path: "category",
          model: "Category",
          select: "title image isActive subCategories",
        })
        .populate(populateProvider)
        .populate("zone")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    // Manually populate subcategories for each vehicle
    for (let vehicle of vehicles) {
      if (vehicle.category && vehicle.subCategories?.length) {
        const subCategoryIds = vehicle.subCategories.map((id) => id.toString());

        const categorySubs = Array.isArray(vehicle.category?.subCategories)
  ? vehicle.category.subCategories
  : [];

vehicle.subCategories = categorySubs
  .filter((sub) => subCategoryIds.includes(sub._id.toString()))
  .map((sub) => ({
    _id: sub._id,
    title: sub.title,
    image: sub.image,
    isActive: sub.isActive,
  }));


        delete vehicle.category.subCategories;
      }
    }

    const meta = {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };

    sendResponse(
      res,
      200,
      true,
      "Vehicles retrieved successfully",
      vehicles,
      meta
    );
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= GET SINGLE VEHICLE =================
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive subCategories",
      })
      .populate(populateProvider)
      .populate("zone")
      .lean();

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Manually populate subcategories
    if (vehicle.category && vehicle.subCategories?.length) {
      const subCategoryIds = vehicle.subCategories.map((id) => id.toString());

   const categorySubs = Array.isArray(vehicle.category?.subCategories)
  ? vehicle.category.subCategories
  : [];

vehicle.subCategories = categorySubs
  .filter((sub) => subCategoryIds.includes(sub._id.toString()))
  .map((sub) => ({
    _id: sub._id,
    title: sub.title,
    image: sub.image,
    isActive: sub.isActive,
  }));

      delete vehicle.category.subCategories;
    }

    sendResponse(res, 200, true, "Vehicle retrieved successfully", vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= GET VEHICLES BY PROVIDER =================
exports.getVehiclesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    const query = { provider: providerId };
    if (isActive !== undefined) query.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate("brand")
        .populate({
          path: "category",
          model: "Category",
          select: "title image isActive subCategories",
        })
        .populate(populateProvider)
        .populate("zone")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    // Manually populate subcategories for each vehicle
    for (let vehicle of vehicles) {
      if (vehicle.category && vehicle.subCategories?.length) {
        const subCategoryIds = vehicle.subCategories.map((id) => id.toString());

      const categorySubs = Array.isArray(vehicle.category?.subCategories)
  ? vehicle.category.subCategories
  : [];

vehicle.subCategories = categorySubs
  .filter((sub) => subCategoryIds.includes(sub._id.toString()))
  .map((sub) => ({
    _id: sub._id,
    title: sub.title,
    image: sub.image,
    isActive: sub.isActive,
  }));

        delete vehicle.category.subCategories;
      }
    }

    const meta = {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };

    sendResponse(
      res,
      200,
      true,
      "Provider vehicles retrieved successfully",
      vehicles,
      meta
    );
  } catch (error) {
    console.error("Error fetching provider vehicles:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= UPDATE VEHICLE =================
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to update this vehicle"
      );
    }

    const body = sanitizeVehicleData(req.body);

    // Track old files for cleanup
    const filesToDelete = [];

    // Handle new file uploads
    if (req.files?.images) {
      if (vehicle.images?.length) filesToDelete.push(...vehicle.images);
      body.images = req.files.images.map((f) => f.filename);
    }
    if (req.files?.thumbnail?.[0]) {
      if (vehicle.thumbnail) filesToDelete.push(vehicle.thumbnail);
      body.thumbnail = req.files.thumbnail[0].filename;
    }
    if (req.files?.documents) {
      if (vehicle.documents?.length) filesToDelete.push(...vehicle.documents);
      body.documents = req.files.documents.map((f) => f.filename);
    }

    // Verify brand if changed
    if (body.brand && body.brand !== vehicle.brand?.toString()) {
      if (!mongoose.Types.ObjectId.isValid(body.brand)) {
        return sendResponse(res, 400, false, "Invalid brand ID");
      }
      const existingBrand = await mongoose
        .model("Brand")
        .findById(body.brand)
        .select("_id");
      if (!existingBrand) {
        return sendResponse(res, 400, false, "Brand does not exist");
      }
    }

    // Validate subcategories if being updated
    if (body.subCategories?.length && body.category) {
      const parentCategory = await Category.findById(body.category).lean();

      if (parentCategory) {
       const validSubIds = Array.isArray(parentCategory.subCategories)
  ? parentCategory.subCategories
      .filter((sub) => sub.isActive)
      .map((s) => s._id.toString())
  : [];


        body.subCategories = body.subCategories.filter((id) =>
          validSubIds.includes(id.toString())
        );
      }
    }

    // Update vehicle
    Object.assign(vehicle, body);
    await vehicle.save();

    // Cleanup old files
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    // Populate and return updated vehicle
    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive subCategories",
      })
      .populate(populateProvider)
      .populate("zone")
      .lean();

    // Manually populate subcategories
    if (updatedVehicle.category && updatedVehicle.subCategories?.length) {
      const subCategoryIds = updatedVehicle.subCategories.map((id) =>
        id.toString()
      );

      updatedVehicle.subCategories = updatedVehicle.category.subCategories
        .filter((sub) => subCategoryIds.includes(sub._id.toString()))
        .map((sub) => ({
          _id: sub._id,
          title: sub.title,
          image: sub.image,
          isActive: sub.isActive,
        }));

      delete updatedVehicle.category.subCategories;
    }

    sendResponse(
      res,
      200,
      true,
      "Vehicle updated successfully",
      updatedVehicle
    );
  } catch (error) {
    console.error("Error updating vehicle:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(
        res,
        400,
        false,
        `${
          field === "vinNumber" ? "VIN number" : "License plate number"
        } already exists`
      );
    }
    sendResponse(res, 500, false, error.message);
  }
};



// ================= DELETE VEHICLE =================
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to delete this vehicle"
      );
    }

    // Collect all files to delete
    const filesToDelete = [
      ...(vehicle.images || []),
      ...(vehicle.documents || []),
    ];
    if (vehicle.thumbnail) filesToDelete.push(vehicle.thumbnail);

    // Delete vehicle
    await vehicle.deleteOne();

    // Cleanup files
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    sendResponse(res, 200, true, "Vehicle deleted successfully");
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= BLOCK VEHICLE =================
exports.blockVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to block this vehicle"
      );
    }

    vehicle.isActive = false;
    await vehicle.save();

    // Populate before sending response
    const blockedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    sendResponse(
      res,
      200,
      true,
      "Vehicle blocked successfully",
      blockedVehicle
    );
  } catch (error) {
    console.error("Error blocking vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= REACTIVATE VEHICLE =================
exports.reactivateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to reactivate this vehicle"
      );
    }

    vehicle.isActive = true;
    await vehicle.save();

    // Populate before sending response
    const reactivatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    sendResponse(
      res,
      200,
      true,
      "Vehicle reactivated successfully",
      reactivatedVehicle
    );
  } catch (error) {
    console.error("Error reactivating vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// Advanced Filter Vehicles API
// Fixed Advanced Filter Vehicles API
exports.filterVehicles = async (req, res) => {
  try {
    const {
      // Location filters
      latitude,
      longitude,
      radius = 10,

      // Filters
      brandId,
      categoryId,
      type,
      fuelType,
      transmissionType,
      seatingCapacityRange,
      minSeatingCapacity,
      maxSeatingCapacity,
      airCondition,
      insuranceIncluded,

      // Price range
      minPrice,
      maxPrice,

      // Rating filter
      minRating,
      maxRating,

      // Pagination
      page = 1,
      limit = 50,

      // Sorting
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    console.log("=== FILTER REQUEST ===");
    console.log("minPrice:", minPrice, typeof minPrice);
    console.log("maxPrice:", maxPrice, typeof maxPrice);

    // Validate and parse seatingCapacityRange
    let capacityFilter = null;
    if (
      seatingCapacityRange &&
      minSeatingCapacity === undefined &&
      maxSeatingCapacity === undefined
    ) {
      const decodedCapacityRange = decodeURIComponent(seatingCapacityRange);

      let min, max;
      if (decodedCapacityRange.endsWith("+")) {
        min = parseInt(decodedCapacityRange.replace("+", ""));
        if (isNaN(min) || min < 0) {
          return sendResponse(res, 400, false, "Invalid seatingCapacityRange");
        }
      } else if (decodedCapacityRange.includes("-")) {
        [min, max] = decodedCapacityRange
          .split("-")
          .map((num) => parseInt(num));
        if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
          return sendResponse(res, 400, false, "Invalid seatingCapacityRange");
        }
      } else {
        return sendResponse(
          res,
          400,
          false,
          "Invalid seatingCapacityRange format"
        );
      }

      capacityFilter = { min, max };
    }

    // Build base query
    const query = { isActive: true };

    // Apply capacity range filter
    if (capacityFilter) {
      if (capacityFilter.min !== undefined) {
        query.seatingCapacity = {
          ...query.seatingCapacity,
          $gte: capacityFilter.min,
        };
      }
      if (capacityFilter.max !== undefined) {
        query.seatingCapacity = {
          ...query.seatingCapacity,
          $lte: capacityFilter.max,
        };
      }
    }

    // Manual capacity filters
    if (minSeatingCapacity !== undefined && !seatingCapacityRange) {
      const min = parseInt(minSeatingCapacity);
      if (!isNaN(min)) {
        query.seatingCapacity = { ...query.seatingCapacity, $gte: min };
      }
    }
    if (maxSeatingCapacity !== undefined && !seatingCapacityRange) {
      const max = parseInt(maxSeatingCapacity);
      if (!isNaN(max)) {
        query.seatingCapacity = { ...query.seatingCapacity, $lte: max };
      }
    }

    // Brand filter
    if (brandId) {
      let brandIds = parseObjectIdArray(brandId);
      if (brandIds.length > 0) {
        query.brand = { $in: brandIds };
      }
    }

    // Category filter
    if (categoryId) {
      let categoryIds = parseObjectIdArray(categoryId);
      if (categoryIds.length > 0) {
        query.category = { $in: categoryIds };
      }
    }

    // Type filter
    if (type) {
      query.type = { $in: parseStringArray(type).map((t) => t.toLowerCase()) };
    }

    // Fuel type filter
    if (fuelType) {
      query.fuelType = {
        $in: parseStringArray(fuelType).map((f) => f.toLowerCase()),
      };
    }

    // Transmission type filter
    if (transmissionType) {
      query.transmissionType = {
        $in: parseStringArray(transmissionType).map((t) => t.toLowerCase()),
      };
    }

    // Air condition filter
    if (airCondition !== undefined) {
      const hasAC = airCondition === "true" || airCondition === true;
      query.airCondition = hasAC;
    }

    // Insurance included filter
    if (insuranceIncluded !== undefined) {
      const hasInsurance =
        insuranceIncluded === "true" || insuranceIncluded === true;
      query["insuranceIncluded.0"] = { $exists: hasInsurance };
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

    // Location filter setup
    let useLocationFilter = false;
    let userLat, userLon, searchRadius;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);
      searchRadius = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon)) {
        return sendResponse(
          res,
          400,
          false,
          "Invalid latitude or longitude values"
        );
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10;
      }

      useLocationFilter = true;
      query.latitude = { $exists: true, $ne: null };
      query.longitude = { $exists: true, $ne: null };
    }

    console.log("MongoDB Query:", JSON.stringify(query, null, 2));

    // Fetch vehicles
    let vehicles = await Vehicle.find(query)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    console.log(`Found ${vehicles.length} vehicles from database`);

    // Calculate distance
    if (useLocationFilter) {
      vehicles = vehicles
        .map((vehicle) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            vehicle.latitude,
            vehicle.longitude
          );
          return {
            ...vehicle,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((vehicle) => vehicle.distance <= searchRadius);

      console.log(`${vehicles.length} vehicles after location filter`);
    }

    // Add calculated fields - IMPORTANT: Calculate effective price for ALL vehicles
    vehicles = vehicles.map((vehicle) => {
      const effectivePrice = getEffectivePrice(vehicle.pricing);
      const capacity = Number(vehicle.seatingCapacity) || 0;

      // Debug log for first few vehicles
      if (vehicles.indexOf(vehicle) < 3) {
        console.log(`Vehicle: ${vehicle.name}`);
        console.log(`  Pricing:`, vehicle.pricing);
        console.log(`  Effective Price:`, effectivePrice);
      }

      return {
        ...vehicle,
        effectivePrice,
        totalCapacity: capacity,
      };
    });

    // ===== CRITICAL: PRICE FILTER =====
    if (minPrice !== undefined || maxPrice !== undefined) {
      const beforePriceFilter = vehicles.length;

      vehicles = vehicles.filter((vehicle) => {
        const price = vehicle.effectivePrice;

        // Log for debugging
        console.log(`Checking vehicle: ${vehicle.name}, Price: ${price}`);

        // IMPORTANT: If price is 0 or null, exclude it
        if (!price || price <= 0) {
          console.log(`  ❌ Excluded (no valid price)`);
          return false;
        }

        let meetsMinPrice = true;
        let meetsMaxPrice = true;

        if (minPrice !== undefined) {
          const min = parseFloat(minPrice);
          if (!isNaN(min)) {
            meetsMinPrice = price >= min;
            if (!meetsMinPrice) {
              console.log(`  ❌ Below minPrice (${price} < ${min})`);
            }
          }
        }

        if (maxPrice !== undefined) {
          const max = parseFloat(maxPrice);
          if (!isNaN(max)) {
            meetsMaxPrice = price <= max;
            if (!meetsMaxPrice) {
              console.log(`  ❌ Above maxPrice (${price} > ${max})`);
            }
          }
        }

        const result = meetsMinPrice && meetsMaxPrice;
        if (result) {
          console.log(`  ✅ Included (${price} in range)`);
        }

        return result;
      });

      console.log(`\n=== PRICE FILTER SUMMARY ===`);
      console.log(`Before: ${beforePriceFilter} vehicles`);
      console.log(`After: ${vehicles.length} vehicles`);
      console.log(`Range: ${minPrice || "any"} - ${maxPrice || "any"}`);
    }

    // Sorting
    const sortField = sortBy.toLowerCase();
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    vehicles.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "price":
          aValue = a.effectivePrice || 0;
          bValue = b.effectivePrice || 0;
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
    const paginatedVehicles = vehicles.slice(skip, skip + parseInt(limit));
    const totalResults = vehicles.length;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total matching vehicles: ${totalResults}`);
    console.log(`Returning page ${page}: ${paginatedVehicles.length} vehicles`);

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
      brandId: brandId || null,
      categoryId: categoryId || null,
      type: type || null,
      fuelType: fuelType || null,
      transmissionType: transmissionType || null,
      seatingCapacityRange: seatingCapacityRange || null,
      capacity: {
        min: minSeatingCapacity || null,
        max: maxSeatingCapacity || null,
      },
      airCondition:
        airCondition !== undefined
          ? airCondition === "true" || airCondition === true
          : null,
      insuranceIncluded: insuranceIncluded || null,
      price: {
        min: minPrice || null,
        max: maxPrice || null,
      },
      rating: {
        min: minRating || null,
        max: maxRating || null,
      },
      sorting: {
        sortBy: sortField,
        sortOrder,
      },
    };

    sendResponse(
      res,
      200,
      true,
      paginatedVehicles.length === 0
        ? "No vehicles found matching your filter criteria"
        : "Vehicles filtered successfully",
      paginatedVehicles,
      {
        count: paginatedVehicles.length,
        totalResults,
        page: parseInt(page),
        totalPages,
        appliedFilters,
      }
    );
  } catch (err) {
    console.error("❌ Error in filterVehicles:", err);
    console.error("Stack:", err.stack);
    sendResponse(res, 500, false, `Failed to filter vehicles: ${err.message}`);
  }
};

// Advanced Vehicle Search API
exports.searchVehicles = async (req, res) => {
  try {
    const {
      keyword,
      latitude,
      longitude,
      radius = 10,
      limit = 50,
      page = 1,
      categoryId,
    } = req.query;

    // Build search query
    const searchQuery = { isActive: true };

    // Keyword search (searches in multiple fields)
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword.trim(), "i");
      searchQuery.$or = [
        { name: keywordRegex },
        { description: keywordRegex },
        { model: keywordRegex },
        { searchTags: { $in: [keywordRegex] } },
        { audioSystem: keywordRegex },
      ];
    }

    // Category filter
    if (categoryId) {
      let categoryIds = parseObjectIdArray(categoryId);
      if (categoryIds.length > 0) {
        searchQuery.category = { $in: categoryIds };
      } else {
        return sendResponse(res, 400, false, "Invalid category ID");
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
        return sendResponse(
          res,
          400,
          false,
          "Invalid latitude or longitude values"
        );
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10; // Default 10km
      }

      useLocationFilter = true;
      searchQuery.latitude = { $exists: true, $ne: null };
      searchQuery.longitude = { $exists: true, $ne: null };
    }

    // Fetch vehicles
    let vehicles = await Vehicle.find(searchQuery)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    // Apply location filtering and calculate distances
    if (useLocationFilter) {
      vehicles = vehicles
        .map((vehicle) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            vehicle.latitude,
            vehicle.longitude
          );
          return {
            ...vehicle,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((vehicle) => vehicle.distance <= searchRadius);

      // Sort by distance
      vehicles.sort((a, b) => a.distance - b.distance);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVehicles = vehicles.slice(skip, skip + parseInt(limit));
    const totalResults = vehicles.length;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    const response = {
      success: true,
      count: paginatedVehicles.length,
      totalResults,
      page: parseInt(page),
      totalPages,
      searchParams: {
        keyword: keyword || null,
        latitude: useLocationFilter ? userLat : null,
        longitude: useLocationFilter ? userLon : null,
        radius: useLocationFilter ? searchRadius : null,
        categoryId: categoryId || null,
      },
      data: paginatedVehicles,
      message:
        paginatedVehicles.length === 0
          ? "No vehicles found matching your search criteria"
          : "Vehicles fetched successfully",
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in searchVehicles:", err);
    sendResponse(res, 500, false, "Failed to search vehicles");
  }
};

// Get vehicles by location
exports.getVehiclesByLocation = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return sendResponse(
        res,
        400,
        false,
        "Latitude (lat) and Longitude (lng) are required"
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid latitude or longitude values"
      );
    }

    const zoneRadiusKm = 10;

    const vehicles = await Vehicle.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      isActive: true,
    })
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    const vehiclesInZone = [];

    vehicles.forEach((vehicle) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        vehicle.latitude,
        vehicle.longitude
      );

      if (distance <= zoneRadiusKm) {
        vehiclesInZone.push({
          ...vehicle,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: "km",
        });
      }
    });

    vehiclesInZone.sort((a, b) => a.distance - b.distance);

    sendResponse(
      res,
      200,
      true,
      vehiclesInZone.length === 0
        ? `No vehicles found within ${zoneRadiusKm}km zone`
        : "Vehicles in zone fetched successfully",
      vehiclesInZone,
      {
        count: vehiclesInZone.length,
        searchParams: {
          latitude,
          longitude,
          zoneRadius: zoneRadiusKm,
          unit: "km",
        },
      }
    );
  } catch (err) {
    console.error("Error fetching vehicles by location:", err);
    sendResponse(res, 500, false, "Failed to fetch vehicles by location");
  }
};

// Get vehicles by category
exports.getVehiclesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendResponse(res, 400, false, "Invalid category ID");
    }

    const vehicles = await Vehicle.find({
      category: categoryId,
      isActive: true,
    })
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .sort({ createdAt: -1 })
      .lean();

    sendResponse(
      res,
      200,
      true,
      vehicles.length === 0
        ? "No vehicles found for this category"
        : "Vehicles fetched successfully",
      vehicles,
      { count: vehicles.length }
    );
  } catch (err) {
    console.error("Error fetching vehicles by category:", err);
    sendResponse(res, 500, false, "Failed to fetch vehicles by category");
  }
};

// Sort Vehicles
exports.sortVehicles = async (req, res) => {
  try {
    const { sortBy, latitude, longitude } = req.query;
    const validSortOptions = [
      "highPrice",
      "lowPrice",
      "topRated",
      "lowRated",
      "highCapacity",
      "lowCapacity",
      "mostBooked",
      "newest",
    ];

    if (!sortBy || !validSortOptions.includes(sortBy)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid or missing sortBy parameter. Use: highPrice, lowPrice, topRated, lowRated, highCapacity, lowCapacity, mostBooked, newest"
      );
    }

    let vehicles = await Vehicle.find({ isActive: true })
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    let useLocationFilter = false;
    let userLat,
      userLon,
      searchRadius = 10;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);

      if (isNaN(userLat) || isNaN(userLon)) {
        return sendResponse(
          res,
          400,
          false,
          "Invalid latitude or longitude values"
        );
      }

      useLocationFilter = true;
      vehicles = vehicles
        .map((vehicle) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            vehicle.latitude,
            vehicle.longitude
          );
          return {
            ...vehicle,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((vehicle) => vehicle.distance <= searchRadius);
    }

    const vehiclesWithData = vehicles.map((vehicle) => {
      const effectivePrice = getEffectivePrice(vehicle.pricing);
      const rating = Number(vehicle.rating) || 0;
      const capacity = Number(vehicle.seatingCapacity) || 0;
      const popularity = Number(vehicle.totalTrips) || 0;

      return { ...vehicle, effectivePrice, rating, capacity, popularity };
    });

    let sortedVehicles;
    switch (sortBy) {
      case "highPrice":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.effectivePrice - a.effectivePrice
        );
        break;
      case "lowPrice":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => a.effectivePrice - b.effectivePrice
        );
        break;
      case "topRated":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.rating - a.rating
        );
        break;
      case "lowRated":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => a.rating - b.rating
        );
        break;
      case "highCapacity":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.capacity - a.capacity
        );
        break;
      case "lowCapacity":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => a.capacity - b.capacity
        );
        break;
      case "mostBooked":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.popularity - a.popularity
        );
        break;
      case "newest":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        sortedVehicles = vehiclesWithData;
    }

    sendResponse(
      res,
      200,
      true,
      "Vehicles sorted successfully",
      sortedVehicles,
      {
        count: sortedVehicles.length,
        sortBy: sortBy,
        searchParams: useLocationFilter
          ? {
              latitude: userLat,
              longitude: userLon,
              radius: searchRadius,
              unit: "km",
            }
          : null,
      }
    );
  } catch (err) {
    console.error("Error in sortVehicles:", err);
    sendResponse(res, 500, false, "Failed to sort vehicles");
  }
};

// Vehicle Counts
exports.getVehicleCounts = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    const active = await Vehicle.countDocuments({ isActive: true });
    const inactive = await Vehicle.countDocuments({ isActive: false });

    sendResponse(res, 200, true, "Vehicle counts fetched successfully", {
      total,
      active,
      inactive,
    });
  } catch (err) {
    console.error("Error in getVehicleCounts:", err);
    sendResponse(res, 500, false, "Failed to fetch vehicle counts");
  }
};
