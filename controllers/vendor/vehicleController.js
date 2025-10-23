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








const Vehicle = require('../../models/vendor/Vehicle');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const Category = require('../../models/admin/category');

// ================= HELPERS =================
const deleteFiles = async (files = []) => {
  if (!files.length) return;
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.resolve(__dirname, '../../Uploads/vehicles', file);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT')
          console.error(`Failed to delete ${file}:`, err);
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

const populateProvider = {
  path: 'provider',
  select: '-password -email -refreshToken -resetPasswordToken -resetPasswordExpire -firstName -lastName -vinNumber',
};

// Parse ObjectId arrays (for categories)
const parseCategories = (categories) => {
  if (!categories) return [];

  let parsed = categories;

  if (typeof parsed === 'string') {
    parsed = parsed.trim();
    try {
      parsed = JSON.parse(parsed);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch {
      parsed = parsed
        .replace(/[\[\]"']/g, '')
        .split(',')
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

  // If already an array, trim each item
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter((item) => item);
  }

  // If string, try to parse as JSON first
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Try JSON parse
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter((item) => item);
      }
    } catch (e) {
      // Not valid JSON, continue to CSV parsing
    }

    // Parse as comma-separated values
    return trimmed
      .replace(/^\[|\]$/g, '') // Remove outer brackets if present
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, '')) // Remove quotes
      .filter((item) => item);
  }

  return [];
};

// Sanitize and parse request body
const sanitizeVehicleData = (body) => {
  const sanitized = { ...body };

  // Trim string fields
  if (sanitized.brand) sanitized.brand = sanitized.brand.trim();
  if (sanitized.type) sanitized.type = sanitized.type.trim().toLowerCase();
  if (sanitized.fuelType) sanitized.fuelType = sanitized.fuelType.trim().toLowerCase();
  if (sanitized.transmissionType)
    sanitized.transmissionType = sanitized.transmissionType.trim().toLowerCase();
  if (sanitized.seatType) sanitized.seatType = sanitized.seatType.trim().toLowerCase();
  if (sanitized.camera) sanitized.camera = sanitized.camera.trim().toLowerCase();
  if (sanitized.model) sanitized.model = sanitized.model.trim();
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.vinNumber) sanitized.vinNumber = sanitized.vinNumber.trim();
  if (sanitized.licensePlateNumber)
    sanitized.licensePlateNumber = sanitized.licensePlateNumber.trim();
  if (sanitized.audioSystem) sanitized.audioSystem = sanitized.audioSystem.trim();

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
    if (typeof sanitized.airCondition === 'string') {
      sanitized.airCondition = sanitized.airCondition.trim().toLowerCase() === 'true';
    } else {
      sanitized.airCondition = !!sanitized.airCondition;
    }
  }

  // Parse numeric fields
  if (sanitized.airbags !== undefined) sanitized.airbags = Number(sanitized.airbags);
  if (sanitized.bootSpace !== undefined) sanitized.bootSpace = Number(sanitized.bootSpace);
  if (sanitized.fuelTank !== undefined) sanitized.fuelTank = Number(sanitized.fuelTank);
  if (sanitized.engineCapacity !== undefined) sanitized.engineCapacity = Number(sanitized.engineCapacity);
  if (sanitized.enginePower !== undefined) sanitized.enginePower = Number(sanitized.enginePower);
  if (sanitized.seatingCapacity !== undefined) sanitized.seatingCapacity = Number(sanitized.seatingCapacity);
  if (sanitized.discount !== undefined) sanitized.discount = Number(sanitized.discount);
  if (sanitized.latitude !== undefined) sanitized.latitude = Number(sanitized.latitude);
  if (sanitized.longitude !== undefined) sanitized.longitude = Number(sanitized.longitude);

  // Parse pricing object
  if (sanitized.pricing) {
    if (typeof sanitized.pricing === 'string') {
      try {
        sanitized.pricing = JSON.parse(sanitized.pricing);
      } catch (e) {
        console.error('Failed to parse pricing:', e);
      }
    }
    if (sanitized.pricing && typeof sanitized.pricing === 'object') {
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

  // Parse categories (ObjectId array)
  if (sanitized.categories) {
    sanitized.category = parseCategories(sanitized.categories);
    delete sanitized.categories;
  } else if (sanitized.category) {
    sanitized.category = parseCategories(sanitized.category);
  }

  return sanitized;
};

// ================= CREATE =================
exports.createVehicle = async (req, res) => {
  const body = sanitizeVehicleData(req.body);

  // Provider auto-fill
  if (!body.provider && req.user) {
    body.provider = req.user._id;
  } else if (
    req.user?.role === 'vendor' &&
    body.provider &&
    body.provider.toString() !== req.user._id.toString()
  ) {
    return sendResponse(res, 403, false, 'Unauthorized: Invalid provider');
  }

  // Handle uploads
  if (req.files?.images) body.images = req.files.images.map((f) => f.filename);
  if (req.files?.thumbnail?.[0])
    body.thumbnail = req.files.thumbnail[0].filename;
  if (req.files?.documents)
    body.documents = req.files.documents.map((f) => f.filename);

  try {
    // Verify categories exist
    if (body.category && body.category.length > 0) {
      const existingCategories = await Category.find({
        _id: { $in: body.category },
      }).select('_id title');

      if (existingCategories.length === 0) {
        // console.warn(
        //   '⚠️ WARNING: None of the provided category IDs exist in the database'
        // );
      } else if (existingCategories.length < body.category.length) {
        const foundIds = existingCategories.map((c) => c._id.toString());
        const missingIds = body.category.filter(
          (id) => !foundIds.includes(id.toString())
        );
        console.warn('⚠️ WARNING: Some category IDs not found:', missingIds);
      }
    }

    // Verify brand exists
    if (body.brand && !mongoose.Types.ObjectId.isValid(body.brand)) {
      return sendResponse(res, 400, false, 'Invalid brand ID');
    }
    if (body.brand) {
      const existingBrand = await mongoose
        .model('Brand')
        .findById(body.brand)
        .select('_id');
      if (!existingBrand) {
        return sendResponse(res, 400, false, 'Brand does not exist');
      }
    }

    const vehicle = await Vehicle.create(body);

    // Populate after creation
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('brand')
      .populate({
        path: 'category',
        model: 'VehicleCategory',
        select: 'title image vehicleCategoryId module isActive',
      })
      .populate(populateProvider)
      .populate('zone')
      .lean();

    sendResponse(
      res,
      201,
      true,
      'Vehicle created successfully',
      populatedVehicle
    );
  } catch (error) {
    console.error('Error creating vehicle:', error);
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
          field === 'vinNumber' ? 'VIN number' : 'License plate number'
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
      type,
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
    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (type) query.type = type.toLowerCase();
    if (fuelType) query.fuelType = fuelType.toLowerCase();
    if (transmissionType) query.transmissionType = transmissionType.toLowerCase();
    if (seatType) query.seatType = seatType.toLowerCase();
    if (camera) query.camera = camera.toLowerCase();
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (zone) query.zone = zone;

    // Price range filter
    if (minPrice || maxPrice) {
      query.$or = [
        { 'pricing.hourly': {} },
        { 'pricing.perDay': {} },
        { 'pricing.distanceWise': {} },
      ];
      if (minPrice) {
        query.$or.forEach((priceQuery) => {
          const key = Object.keys(priceQuery)[0];
          priceQuery[key].$gte = Number(minPrice);
        });
      }
      if (maxPrice) {
        query.$or.forEach((priceQuery) => {
          const key = Object.keys(priceQuery)[0];
          priceQuery[key].$lte = Number(maxPrice);
        });
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { audioSystem: { $regex: search, $options: 'i' } },
        { searchTags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate('brand')
        .populate({
          path: 'category',
          model: 'VehicleCategory',
          select: 'title image vehicleCategoryId module isActive',
        })
        .populate(populateProvider)
        .populate('zone')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    const meta = {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };

    sendResponse(res, 200, true, 'Vehicles retrieved successfully', vehicles, meta);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= GET SINGLE VEHICLE =================
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('brand')
      .populate({
        path: 'category',
        model: 'VehicleCategory',
        select: 'title image vehicleCategoryId module isActive',
      })
      .populate(populateProvider)
      .populate('zone')
      .lean();

    if (!vehicle) {
      return sendResponse(res, 404, false, 'Vehicle not found');
    }

    sendResponse(res, 200, true, 'Vehicle retrieved successfully', vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= GET VEHICLES BY PROVIDER =================
exports.getVehiclesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    const query = { provider: providerId };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate('brand')
        .populate({
          path: 'category',
          model: 'VehicleCategory',
          select: 'title image vehicleCategoryId module isActive',
        })
        .populate(populateProvider)
        .populate('zone')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query),
    ]);

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
      'Provider vehicles retrieved successfully',
      vehicles,
      meta
    );
  } catch (error) {
    console.error('Error fetching provider vehicles:', error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= UPDATE VEHICLE =================
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, 'Vehicle not found');
    }

    // Authorization check
    if (
      req.user.role === 'vendor' &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, 'Unauthorized to update this vehicle');
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
        return sendResponse(res, 400, false, 'Invalid brand ID');
      }
      const existingBrand = await mongoose
        .model('Brand')
        .findById(body.brand)
        .select('_id');
      if (!existingBrand) {
        return sendResponse(res, 400, false, 'Brand does not exist');
      }
    }

    // Update vehicle
    Object.assign(vehicle, body);
    await vehicle.save();

    // Cleanup old files
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    // Populate and return updated vehicle
    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('brand')
      .populate({
        path: 'category',
        model: 'VehicleCategory',
        select: 'title image vehicleCategoryId module isActive',
      })
      .populate(populateProvider)
      .populate('zone')
      .lean();

    sendResponse(res, 200, true, 'Vehicle updated successfully', updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(
        res,
        400,
        false,
        `${
          field === 'vinNumber' ? 'VIN number' : 'License plate number'
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
      return sendResponse(res, 404, false, 'Vehicle not found');
    }

    // Authorization check
    if (
      req.user.role === 'vendor' &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, 'Unauthorized to delete this vehicle');
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

    sendResponse(res, 200, true, 'Vehicle deleted successfully');
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= BLOCK VEHICLE =================
exports.blockVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, 'Vehicle not found');
    }

    // Authorization check
    if (
      req.user.role === 'vendor' &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, 'Unauthorized to block this vehicle');
    }

    vehicle.isActive = false;
    await vehicle.save();

    // Populate before sending response
    const blockedVehicle = await Vehicle.findById(vehicle._id)
      .populate('brand')
      .populate({
        path: 'category',
        model: 'VehicleCategory',
        select: 'title image vehicleCategoryId module isActive',
      })
      .populate(populateProvider)
      .populate('zone')
      .lean();

    sendResponse(res, 200, true, 'Vehicle blocked successfully', blockedVehicle);
  } catch (error) {
    console.error('Error blocking vehicle:', error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= REACTIVATE VEHICLE =================
exports.reactivateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, 'Vehicle not found');
    }

    // Authorization check
    if (
      req.user.role === 'vendor' &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, 'Unauthorized to reactivate this vehicle');
    }

    vehicle.isActive = true;
    await vehicle.save();

    // Populate before sending response
    const reactivatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('brand')
      .populate({
        path: 'category',
        model: 'VehicleCategory',
        select: 'title image vehicleCategoryId module isActive',
      })
      .populate(populateProvider)
      .populate('zone')
      .lean();

    sendResponse(res, 200, true, 'Vehicle reactivated successfully', reactivatedVehicle);
  } catch (error) {
    console.error('Error reactivating vehicle:', error);
    sendResponse(res, 500, false, error.message);
  }
};