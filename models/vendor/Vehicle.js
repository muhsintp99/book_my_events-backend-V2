// const mongoose = require('mongoose');

// const VehicleSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Please add a vehicle name'],
//       trim: true,
//       maxlength: [100, 'Name cannot be more than 100 characters'],
//       validate: {
//         validator: function (v) {
//           return /^[a-zA-Z0-9\s\-\(\)]+$/.test(v); // Allow letters, numbers, spaces, hyphens, parentheses
//         },
//         message: 'Name can only contain letters, numbers, spaces, hyphens, and parentheses',
//       },
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: [500, 'Description cannot be more than 500 characters'],
//     },
//     brand: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Brand',
//     },
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Category',
//     },
//     model: {
//       type: String,
//       trim: true,
//     },
//     type: {
//       type: String,
//       enum: ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'motorcycle'],
//     },
//     engineCapacity: {
//       type: Number,
//       min: [0, 'Engine capacity cannot be negative'],
//     },
//     enginePower: {
//       type: Number,
//       min: [0, 'Engine power cannot be negative'],
//     },
//     seatingCapacity: {
//       type: Number,
//       min: [1, 'Seating capacity must be at least 1'],
//     },
//     airCondition: {
//       type: Boolean,
//       default: false,
//     },
//     fuelType: {
//       type: String,
//       enum: ['petrol', 'diesel', 'electric', 'hybrid'],
//     },
//     transmissionType: {
//       type: String,
//       enum: ['manual', 'automatic'],
//     },
//     pricing: {
//       hourly: { type: Number, default: 0, min: 0 },
//       perDay: { type: Number, default: 0, min: 0 },
//       distanceWise: { type: Number, default: 0, min: 0 },
//     },
//     discount: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 100,
//     },
//     images: [
//       {
//         type: String,
//       },
//     ],
//     thumbnail: {
//       type: String,
//     },
//     searchTags: [
//       {
//         type: String,
//       },
//     ],
//     vinNumber: {
//       type: String,
//       trim: true,
//       unique: true,
//       sparse: true,
//       validate: {
//         validator: (v) => !v || v.length === 17,
//         message: 'VIN must be 17 characters if provided',
//       },
//     },
//     licensePlateNumber: {
//       type: String,
//       trim: true,
//       unique: true,
//       sparse: true,
//       validate: {
//         validator: (v) => !v || /^[A-Z0-9-]{1,10}$/.test(v),
//         message: 'Invalid license plate number',
//       },
//     },
//     documents: [
//       {
//         type: String,
//       },
//     ],
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     isAvailable: {
//       type: Boolean,
//       default: true,
//     },
//     totalTrips: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     rating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5,
//     },
//     provider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Pre-save hook to normalize enum fields
// VehicleSchema.pre('save', function (next) {
//   if (this.type) this.type = this.type.toLowerCase();
//   if (this.fuelType) this.fuelType = this.fuelType.toLowerCase();
//   if (this.transmissionType) this.transmissionType = this.transmissionType.toLowerCase();
//   next();
// });

// // Indexes
// VehicleSchema.index({ provider: 1, isActive: 1 });
// VehicleSchema.index({ brand: 1, category: 1 });
// VehicleSchema.index({ isAvailable: 1, createdAt: -1 });
// VehicleSchema.index({ vinNumber: 1 }, { unique: true, sparse: true });
// VehicleSchema.index({ licensePlateNumber: 1 }, { unique: true, sparse: true });

// module.exports = mongoose.model('Vehicle', VehicleSchema);

const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a vehicle name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
      validate: {
        validator: (v) => /^[a-zA-Z0-9\s\-\(\)]+$/.test(v),
        message: 'Name can only contain letters, numbers, spaces, hyphens, and parentheses',
      },
    },
    description: { type: String, trim: true, maxlength: [500, 'Description cannot be more than 500 characters'] },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: [true, 'Zone is required'] }, // ✅ Added
    model: { type: String, trim: true },
    type: {
      type: String,
      enum: ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'motorcycle'],
    },
    engineCapacity: { type: Number, min: [0, 'Engine capacity cannot be negative'] },
    enginePower: { type: Number, min: [0, 'Engine power cannot be negative'] },
    seatingCapacity: { type: Number, min: [1, 'Seating capacity must be at least 1'] },
    airCondition: { type: Boolean, default: false },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
    transmissionType: { type: String, enum: ['manual', 'automatic'] },
    pricing: {
      hourly: { type: Number, default: 0, min: 0 },
      perDay: { type: Number, default: 0, min: 0 },
      distanceWise: { type: Number, default: 0, min: 0 },
    },
    discount: { type: Number, default: 0, min: 0, max: 100 },
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
        message: 'VIN must be 17 characters if provided',
      },
    },
    licensePlateNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => !v || /^[A-Z0-9-]{1,10}$/.test(v),
        message: 'Invalid license plate number',
      },
    },
    documents: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    totalTrips: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

VehicleSchema.pre('save', function (next) {
  if (this.type) this.type = this.type.toLowerCase();
  if (this.fuelType) this.fuelType = this.fuelType.toLowerCase();
  if (this.transmissionType) this.transmissionType = this.transmissionType.toLowerCase();
  next();
});

VehicleSchema.index({ provider: 1, isActive: 1 });
VehicleSchema.index({ brand: 1, category: 1 });
VehicleSchema.index({ zone: 1 }); // ✅ Added
VehicleSchema.index({ vinNumber: 1 }, { unique: true, sparse: true });
VehicleSchema.index({ licensePlateNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
