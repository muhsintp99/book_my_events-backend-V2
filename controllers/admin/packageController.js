const mongoose = require('mongoose');
const Package = require('../../models/admin/Package');

// ================== STATS ==================
exports.getPackageCounts = async (req, res, next) => {
  try {
    const total = await Package.countDocuments();
    const active = await Package.countDocuments({ isActive: true });
    res.status(200).json({ success: true, total, active });
  } catch (err) {
    next(err);
  }
};

// ================== FEATURED ==================
exports.getFeaturedPackages = async (req, res, next) => {
  try {
    const featured = await Package.find({ isFeatured: true });
    res.status(200).json({ success: true, data: featured });
  } catch (err) {
    next(err);
  }
};

// ================== CREATE ==================
exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create({ ...req.body, provider: req.user._id });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
};

exports.createPackageForProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const pkg = await Package.create({ ...req.body, provider: providerId });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
};

// ================== LISTING ==================
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await Package.find()
      .populate('provider', 'name email phone')
      .populate('linkedVenue', 'venueName venueAddress')
      .select('-__v');
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    next(err);
  }
};

exports.getPackagesByProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const packages = await Package.find({ provider: providerId })
      .populate('provider', 'name email phone')
      .populate('linkedVenue', 'venueName venueAddress')
      .select('-__v');
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    next(err);
  }
};

// Internal use only
exports.getPackagesByProviderInternal = async (providerId) => {
  return await Package.find({ provider: providerId });
};

// ================== PACKAGES BY VENUE ==================
exports.getPackagesByVenue = async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const packages = await Package.find({ linkedVenue: venueId, isActive: true })
      .populate('provider', 'name email phone')
      .populate('linkedVenue', 'venueName venueAddress')
      .select('-__v');
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    next(err);
  }
};

// Internal use only
exports.getPackagesByVenueInternal = async (venueId) => {
  return await Package.find({ linkedVenue: venueId, isActive: true });
};

// ================== SINGLE PACKAGE ==================
exports.getPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    let pkg = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      pkg = await Package.findById(id)
        .populate('provider', 'name email phone')
        .populate('linkedVenue', 'venueName venueAddress')
        .select('-__v');
    }

    if (!pkg) {
      pkg = await Package.findOne({ packageId: id })
        .populate('provider', 'name email phone')
        .populate('linkedVenue', 'venueName venueAddress')
        .select('-__v');
    }

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.status(200).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
};

// ================== UPDATE ==================
exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('provider', 'name email phone')
      .populate('linkedVenue', 'venueName venueAddress')
      .select('-__v');

    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    res.status(200).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
};

// ================== TOGGLE STATUS ==================
exports.togglePackageStatus = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    pkg.isActive = !pkg.isActive;
    await pkg.save();

    res.status(200).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
};

// ================== DELETE ==================
exports.deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    res.status(200).json({ success: true, message: 'Package deleted' });
  } catch (err) {
    next(err);
  }
};

// ================== MODULE BY ID ==================
exports.getPackageByModuleId = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const pkg = await Package.findOne({ 'modules._id': moduleId })
      .populate('provider', 'name email phone')
      .populate('linkedVenue', 'venueName venueAddress')
      .select('-__v');

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found for this module' });
    }

    // Return only the matched module separately
    const module = pkg.modules.id(moduleId);

    res.status(200).json({ success: true, package: pkg, module });
  } catch (err) {
    next(err);
  }
};
