const Vehicle = require('../../models/vendor/Vehicle');
const fs = require('fs').promises;
const path = require('path');

// Helper: delete files
const deleteFiles = async (files) => {
  if (!files || files.length === 0) return;
  for (const file of files) {
    const filePath = path.resolve(__dirname, '../../Uploads/vehicles', file);
    try {
      if (await fs.access(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
};

// ✅ Create Vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { body } = req;

    // Ensure provider is the authenticated user (if provided)
    if (body.provider && (!req.user || body.provider.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid provider' });
    }

    // Handle uploaded files
    if (req.files?.images) {
      body.images = req.files.images.map((f) => f.filename);
    }
    if (req.files?.thumbnail && req.files.thumbnail[0]) {
      body.thumbnail = req.files.thumbnail[0].filename;
    }
    if (req.files?.documents) {
      body.documents = req.files.documents.map((f) => f.filename);
    }

    const vehicle = await Vehicle.create(body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'VIN or license plate already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get All Vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('brand category provider')
      .lean();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Vehicle
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('brand category provider')
      .lean();
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Check if the authenticated user is the provider (if provider exists)
    if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
    }

    // Store old files for deletion after successful update
    const oldImages = vehicle.images.slice();
    const oldThumbnail = vehicle.thumbnail;
    const oldDocuments = vehicle.documents.slice();

    // Update fields
    if (req.files?.images) {
      vehicle.images = req.files.images.map((f) => f.filename);
    }
    if (req.files?.thumbnail && req.files.thumbnail[0]) {
      vehicle.thumbnail = req.files.thumbnail[0].filename;
    }
    if (req.files?.documents) {
      vehicle.documents = req.files.documents.map((f) => f.filename);
    }

    // Update other fields (sanitize req.body)
    const allowedFields = [
      'name', 'description', 'brand', 'category', 'model', 'type', 'engineCapacity',
      'enginePower', 'seatingCapacity', 'airCondition', 'fuelType', 'transmissionType',
      'pricing', 'discount', 'searchTags', 'vinNumber', 'licensePlateNumber', 'provider',
    ];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        vehicle[key] = req.body[key];
      }
    }

    await vehicle.save();

    // Delete old files after successful update
    if (req.files?.images) await deleteFiles(oldImages);
    if (req.files?.thumbnail && oldThumbnail) await deleteFiles([oldThumbnail]);
    if (req.files?.documents) await deleteFiles(oldDocuments);

    res.json({ success: true, data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'VIN or license plate already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Check if the authenticated user is the provider (if provider exists)
    if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
    }

    await deleteFiles(vehicle.images);
    if (vehicle.thumbnail) await deleteFiles([vehicle.thumbnail]);
    await deleteFiles(vehicle.documents);

    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Block Vehicle
exports.blockVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Check if the authenticated user is the provider (if provider exists)
    if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
    }

    vehicle.isActive = false;
    await vehicle.save();
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Reactivate Vehicle
exports.reactivateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Check if the authenticated user is the provider (if provider exists)
    if (vehicle.provider && req.user._id.toString() !== vehicle.provider.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Not your vehicle' });
    }

    vehicle.isActive = true;
    await vehicle.save();
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};