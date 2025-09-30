const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    packageName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    packageDescription: { 
      type: String, 
      trim: true 
    },
    packageType: { 
      type: String, 
      enum: ['venue', 'photographer', 'catering', 'decoration', 'combo', 'custom'],
      required: true 
    },
    
    // Pricing
    basePrice: { 
      type: Number, 
      required: true 
    },
    discountedPrice: Number,
    discountPercentage: { 
      type: Number, 
      default: 0 
    },
    
    // Package Details
    duration: String, // e.g., "4 hours", "Full day", "2 days"
    guestCapacity: {
      min: Number,
      max: Number
    },
    
    // Modules/Services included in the package
    modules: [{
      moduleName: { 
        type: String, 
        required: true 
      },
      moduleDescription: String,
      moduleType: { 
        type: String,
        enum: ['venue', 'photography', 'catering', 'decoration', 'entertainment', 'transport', 'other']
      },
      quantity: { 
        type: Number, 
        default: 1 
      },
      unitPrice: Number,
      isOptional: { 
        type: Boolean, 
        default: false 
      },
      additionalCost: { 
        type: Number, 
        default: 0 
      }
    }],
    
    // Inclusions
    inclusions: [String], // Array of what's included
    exclusions: [String], // Array of what's not included
    
    // Terms & Conditions
    termsAndConditions: String,
    cancellationPolicy: String,
    advancePayment: {
      percentage: { 
        type: Number, 
        default: 30 
      },
      amount: Number
    },
    
    // Availability
    availableDays: [{ 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    blackoutDates: [Date], // Dates when package is not available
    minimumBookingDays: { 
      type: Number, 
      default: 1 
    },
    
    // Customization
    isCustomizable: { 
      type: Boolean, 
      default: false 
    },
    customizationOptions: [String],
    
    // Provider
    provider: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    
    // Linked Resources (optional)
    linkedVenue: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Venue' 
    },
    linkedPhotographer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Photographer' 
    },
    
    // Media
    thumbnail: String,
    images: [String],
    
    // Ratings & Reviews
    rating: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5 
    },
    reviewCount: { 
      type: Number, 
      default: 0 
    },
    
    // Status
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isFeatured: { 
      type: Boolean, 
      default: false 
    },
    
    // SEO & Search
    searchTags: [String],
    popularity: { 
      type: Number, 
      default: 0 
    }, // Based on views/bookings
    
    // Booking Stats
    totalBookings: { 
      type: Number, 
      default: 0 
    },
    lastBookedAt: Date
  },
  { 
    timestamps: true 
  }
);

// Index for search performance
packageSchema.index({ packageName: 'text', packageDescription: 'text', searchTags: 'text' });
packageSchema.index({ provider: 1, isActive: 1 });
packageSchema.index({ packageType: 1, isActive: 1 });
packageSchema.index({ basePrice: 1 });

module.exports = mongoose.model('Package', packageSchema);