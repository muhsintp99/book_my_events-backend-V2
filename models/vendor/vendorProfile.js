// const mongoose = require("mongoose");

// const vendorProfileSchema = new mongoose.Schema(
//   {
//     storeName: {
//       type: String,
//       trim: true,
//       maxlength: [100, "Store name cannot exceed 100 characters"],
//       default: ""
//     },
//     storeAddress: {
//       street: { type: String, trim: true, default: "" },
//       city: { type: String, trim: true, default: "" },
//       state: { type: String, trim: true, default: "" },
//       zipCode: { type: String, trim: true, default: "" },
//       fullAddress: {
//         type: String,
//         trim: true,
//         maxlength: [500, "Address cannot exceed 500 characters"],
//         default: ""
//       }
//     },
//     logo: { type: String, trim: true, default: "" },
//     coverImage: { type: String, trim: true, default: "" },
//     tinCertificate: { type: String, trim: true, default: "" },
//     ownerFirstName: {
//       type: String,
//       required: [true, "Owner first name is required"],
//       trim: true,
//       maxlength: [50, "First name cannot exceed 50 characters"]
//     },
//     ownerLastName: {
//       type: String,
//       required: [true, "Owner last name is required"],
//       trim: true,
//       maxlength: [50, "Last name cannot exceed 50 characters"]
//     },
//     ownerPhone: {
//       type: String,
//       trim: true,
//       default: ""
//     },
//     ownerEmail: {
//       type: String,
//       required: [true, "Owner email is required"],
//       lowercase: true,
//       match: [
//         /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//         "Please enter a valid email"
//       ]
//     },


//     // ⭐ Subscription System
// isFreeTrial: {
//   type: Boolean,
//   default: false
// },

// subscriptionPlan: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "SubscriptionPlan",
//   default: null
// },

// subscriptionStatus: {
//   type: String,
//   enum: ["trial", "active", "expired", "none"],
//   default: "none"
// },

// trialStartDate: {
//   type: Date,
//   default: null
// },

// trialEndDate: {
//   type: Date,
//   default: null
// },

//     businessTIN: {
//       type: String,
//       trim: true,
//       default: ""
//     },
//     tinExpireDate: {
//       type: Date,
//       default: null
//     },
//     module: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Module",
//       default: null
//     },
//     zone: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Zone",
//       default: null
//     },
//     status: {
//       type: String,
//       enum: ["pending", "under_review", "approved", "rejected"],
//       default: "pending"
//     },
//     reviewedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },
//     reviewedAt: Date,
//     rejectionReason: String,
//     adminNotes: String,
//     isActive: {
//       type: Boolean,
//       default: true
//     },
//     approvedProvider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "User reference is required"]
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("VendorProfile", vendorProfileSchema);





















// const mongoose = require("mongoose");

// const vendorProfileSchema = new mongoose.Schema(
//   {
//     // ----------------------- BASIC STORE INFO -----------------------
//     storeName: {
//       type: String,
//       trim: true,
//       maxlength: [100, "Store name cannot exceed 100 characters"],
//       default: ""
//     },

//     storeAddress: {
//       street: { type: String, trim: true, default: "" },
//       city: { type: String, trim: true, default: "" },
//       state: { type: String, trim: true, default: "" },
//       zipCode: { type: String, trim: true, default: "" },
//       fullAddress: {
//         type: String,
//         trim: true,
//         maxlength: [500, "Address cannot exceed 500 characters"],
//         default: ""
//       }
//     },

//     logo: { type: String, trim: true, default: "" },
//     coverImage: { type: String, trim: true, default: "" },
//     tinCertificate: { type: String, trim: true, default: "" },

//     // ----------------------- OWNER DETAILS -----------------------
//     ownerFirstName: {
//       type: String,
//       required: [true, "Owner first name is required"],
//       trim: true,
//       maxlength: [50, "First name cannot exceed 50 characters"]
//     },

//     ownerLastName: {
//       type: String,
//       required: [true, "Owner last name is required"],
//       trim: true,
//       maxlength: [50, "Last name cannot exceed 50 characters"]
//     },

//     ownerPhone: {
//       type: String,
//       trim: true,
//       default: ""
//     },

//     ownerEmail: {
//       type: String,
//       required: [true, "Owner email is required"],
//       lowercase: true,
//       match: [
//         /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//         "Please enter a valid email"
//       ]
//     },

//     // ----------------------- BUSINESS INFO -----------------------
//     businessTIN: {
//       type: String,
//       trim: true,
//       default: ""
//     },

//     tinExpireDate: {
//       type: Date,
//       default: null
//     },

//     // ----------------------- MODULE & ZONE -----------------------
//     module: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Module",
//       default: null
//     },

//     zone: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Zone",
//       default: null
//     },

//     // ----------------------- APPROVAL SYSTEM -----------------------
//     status: {
//       type: String,
//       enum: ["pending", "under_review", "approved", "rejected"],
//       default: "pending"
//     },

//     reviewedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },

//     reviewedAt: Date,
//     rejectionReason: String,
//     adminNotes: String,

//     isActive: {
//       type: Boolean,
//       default: true
//     },

//     approvedProvider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },

//     // ----------------------- USER RELATION -----------------------
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "User reference is required"]
//     }
//   },
//   { timestamps: true }
// );

// // ----------------------- REMOVE OLD FIELDS FROM RESPONSE -----------------------
// vendorProfileSchema.methods.toJSON = function () {
//   const obj = this.toObject();

//   // These fields previously existed — now removed completely from DB,
//   // but in case of old records, we remove them from output:
//   delete obj.isFreeTrial;
//   delete obj.subscriptionPlan;
//   delete obj.subscriptionStatus;
//   delete obj.trialStartDate;
//   delete obj.trialEndDate;

//   return obj;
// };

// module.exports = mongoose.model("VendorProfile", vendorProfileSchema);





































// const mongoose = require("mongoose");

// const vendorProfileSchema = new mongoose.Schema(
//   {
//     // ----------------------- BASIC STORE INFO -----------------------
//     storeName: {
//       type: String,
//       trim: true,
//       maxlength: [100, "Store name cannot exceed 100 characters"],
//       default: ""
//     },

//     storeAddress: {
//       street: { type: String, trim: true, default: "" },
//       city: { type: String, trim: true, default: "" },
//       state: { type: String, trim: true, default: "" },
//       zipCode: { type: String, trim: true, default: "" },
//       fullAddress: {
//         type: String,
//         trim: true,
//         maxlength: [500, "Address cannot exceed 500 characters"],
//         default: ""
//       }
//     },

//     logo: { type: String, trim: true, default: "" },
//     coverImage: { type: String, trim: true, default: "" },
//     tinCertificate: { type: String, trim: true, default: "" },


//     // ----------------------- BANK DETAILS -----------------------
// bankDetails: {
//   accountHolderName: { type: String, default: '' },
//   accountNumber: { type: String, default: '' },
//   ifscCode: { type: String, default: '' },
//   bankName: { type: String, default: '' },
//   branchName: { type: String, default: '' },
//   accountType: {
//     type: String,
//     enum: ['savings', 'current'],
//     default: 'savings'
//   },
//   upiId: { type: String, default: '' }
// },

//     // ----------------------- OWNER DETAILS -----------------------
//     ownerFirstName: {
//       type: String,
//       required: [true, "Owner first name is required"],
//       trim: true,
//       maxlength: [50, "First name cannot exceed 50 characters"]
//     },

//     ownerLastName: {
//       type: String,
//       required: [true, "Owner last name is required"],
//       trim: true,
//       maxlength: [50, "Last name cannot exceed 50 characters"]
//     },

//     ownerPhone: {
//       type: String,
//       trim: true,
//       default: ""
//     },

//     ownerEmail: {
//       type: String,
//       required: [true, "Owner email is required"],
//       lowercase: true,
//       match: [
//         /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//         "Please enter a valid email"
//       ]
//     },

//     // ----------------------- BUSINESS INFO -----------------------
//     businessTIN: {
//       type: String,
//       trim: true,
//       default: ""
//     },

//     tinExpireDate: {
//       type: Date,
//       default: null
//     },

//     // ----------------------- MODULE & ZONE -----------------------
//     module: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Module",
//       default: null
//     },

//     zone: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Zone",
//       default: null
//     },

//     // ----------------------- SUBSCRIPTION FIELDS -----------------------
//     isFreeTrial: {
//       type: Boolean,
//       default: false,
//       index: true
//     },

//     subscriptionPlan: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SubscriptionPlan",
//       default: null
//     },

//     subscriptionStatus: {
//       type: String,
//       enum: ["none", "trial", "pending_payment", "active", "expired", "cancelled", "suspended"],
//       default: "none",
//       index: true
//     },

//     trialStartDate: {
//       type: Date,
//       default: null
//     },

//     trialEndDate: {
//       type: Date,
//       default: null
//     },

//     subscriptionStartDate: {
//       type: Date,
//       default: null
//     },

//     subscriptionEndDate: {
//       type: Date,
//       default: null
//     },

//     lastPaymentDate: {
//       type: Date,
//       default: null
//     },

//     nextBillingDate: {
//       type: Date,
//       default: null
//     },

//     autoRenew: {
//       type: Boolean,
//       default: false
//     },

//     paymentHistory: [{
//       orderId: String,
//       amount: Number,
//       status: String,
//       paymentDate: Date,
//       paymentMethod: String,
//       transactionId: String
//     }],


//     bio: {
//   title: { type: String, default: "" },
//   subtitle: { type: String, default: "" },
//   description: { type: String, default: "" }
// },

// vendorType: {
//   type: String,
//   enum: ["individual", "company"],
//   default: "individual"
// },

//     // ----------------------- APPROVAL SYSTEM -----------------------
//     status: {
//       type: String,
//       enum: ["pending", "under_review", "approved", "rejected"],
//       default: "pending",
//       index: true
//     },

//     reviewedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },

//     reviewedAt: Date,
//     rejectionReason: String,
//     adminNotes: String,

//     isActive: {
//       type: Boolean,
//       default: true,
//       index: true
//     },

//     approvedProvider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },

//     // ----------------------- USER RELATION -----------------------
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "User reference is required"],
//       index: true
//     },

//     // ----------------------- ADDITIONAL METADATA -----------------------
//     features: {
//       type: [String],
//       default: []
//     },

//     limitations: {
//       maxListings: { type: Number, default: null },
//       maxPhotos: { type: Number, default: null },
//       canUseAdvancedFeatures: { type: Boolean, default: false }
//     }
//   },
//   { 
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true }
//   }
// );

// // ----------------------- INDEXES FOR PERFORMANCE -----------------------
// vendorProfileSchema.index({ user: 1 });
// vendorProfileSchema.index({ module: 1, status: 1 });
// vendorProfileSchema.index({ subscriptionStatus: 1, isActive: 1 });
// vendorProfileSchema.index({ trialEndDate: 1, subscriptionStatus: 1 });
// vendorProfileSchema.index({ subscriptionEndDate: 1, subscriptionStatus: 1 });

// // ----------------------- VIRTUAL: IS TRIAL EXPIRED -----------------------
// vendorProfileSchema.virtual("isTrialExpired").get(function () {
//   if (!this.isFreeTrial || !this.trialEndDate) return false;
//   return new Date() > this.trialEndDate;
// });

// // ----------------------- VIRTUAL: IS SUBSCRIPTION EXPIRED -----------------------
// vendorProfileSchema.virtual("isSubscriptionExpired").get(function () {
//   if (!this.subscriptionEndDate) return false;
//   return new Date() > this.subscriptionEndDate;
// });

// // ----------------------- VIRTUAL: DAYS LEFT IN TRIAL -----------------------
// vendorProfileSchema.virtual("daysLeftInTrial").get(function () {
//   if (!this.isFreeTrial || !this.trialEndDate) return 0;
//   const diff = this.trialEndDate - new Date();
//   return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
// });

// // ----------------------- VIRTUAL: DAYS LEFT IN SUBSCRIPTION -----------------------
// vendorProfileSchema.virtual("daysLeftInSubscription").get(function () {
//   if (!this.subscriptionEndDate) return 0;
//   const diff = this.subscriptionEndDate - new Date();
//   return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
// });

// // ----------------------- METHODS -----------------------

// // Check if vendor can access features
// vendorProfileSchema.methods.canAccessFeature = function (featureName) {
//   // If subscription is active or in trial
//   if (this.subscriptionStatus === "active" || this.subscriptionStatus === "trial") {
//     // Check if trial is not expired
//     if (this.isFreeTrial && this.trialEndDate && new Date() > this.trialEndDate) {
//       return false;
//     }
//     // Check if subscription is not expired
//     if (this.subscriptionEndDate && new Date() > this.subscriptionEndDate) {
//       return false;
//     }
//     return true;
//   }
//   return false;
// };

// // Activate subscription
// vendorProfileSchema.methods.activateSubscription = async function (planId, startDate, endDate) {
//   this.subscriptionPlan = planId;
//   this.subscriptionStatus = "active";
//   this.subscriptionStartDate = startDate || new Date();
//   this.subscriptionEndDate = endDate;
//   this.isFreeTrial = false;
//   this.trialStartDate = null;
//   this.trialEndDate = null;
//   this.lastPaymentDate = new Date();

//   return await this.save();
// };

// // Cancel subscription
// vendorProfileSchema.methods.cancelSubscription = async function () {
//   this.subscriptionStatus = "cancelled";
//   this.autoRenew = false;
//   return await this.save();
// };

// // Suspend subscription
// vendorProfileSchema.methods.suspendSubscription = async function (reason) {
//   this.subscriptionStatus = "suspended";
//   this.adminNotes = (this.adminNotes || "") + `\nSuspended: ${reason}`;
//   return await this.save();
// };

// // Add payment to history
// vendorProfileSchema.methods.addPayment = async function (paymentData) {
//   this.paymentHistory.push({
//     orderId: paymentData.orderId,
//     amount: paymentData.amount,
//     status: paymentData.status,
//     paymentDate: paymentData.paymentDate || new Date(),
//     paymentMethod: paymentData.paymentMethod || "card",
//     transactionId: paymentData.transactionId
//   });
//   this.lastPaymentDate = paymentData.paymentDate || new Date();
//   return await this.save();
// };

// // ----------------------- STATIC METHODS -----------------------

// // Find vendors with expiring trials
// vendorProfileSchema.statics.findExpiringTrials = function (daysThreshold = 3) {
//   const thresholdDate = new Date();
//   thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

//   return this.find({
//     isFreeTrial: true,
//     subscriptionStatus: "trial",
//     trialEndDate: {
//       $gte: new Date(),
//       $lte: thresholdDate
//     }
//   }).populate("user", "firstName lastName email");
// };

// // Find vendors with expiring subscriptions
// vendorProfileSchema.statics.findExpiringSubscriptions = function (daysThreshold = 7) {
//   const thresholdDate = new Date();
//   thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

//   return this.find({
//     subscriptionStatus: "active",
//     subscriptionEndDate: {
//       $gte: new Date(),
//       $lte: thresholdDate
//     }
//   }).populate("user", "firstName lastName email").populate("subscriptionPlan");
// };

// // Find expired trials
// vendorProfileSchema.statics.findExpiredTrials = function () {
//   return this.find({
//     isFreeTrial: true,
//     subscriptionStatus: "trial",
//     trialEndDate: { $lt: new Date() }
//   }).populate("user", "firstName lastName email");
// };

// // Find expired subscriptions
// vendorProfileSchema.statics.findExpiredSubscriptions = function () {
//   return this.find({
//     subscriptionStatus: "active",
//     subscriptionEndDate: { $lt: new Date() }
//   }).populate("user", "firstName lastName email").populate("subscriptionPlan");
// };

// // ----------------------- PRE-SAVE HOOKS -----------------------

// // Auto-expire trials and subscriptions
// vendorProfileSchema.pre("save", function (next) {
//   // Check if trial has expired
//   if (
//     this.isFreeTrial &&
//     this.subscriptionStatus === "trial" &&
//     this.trialEndDate &&
//     new Date() > this.trialEndDate
//   ) {
//     this.subscriptionStatus = "expired";
//   }

//   // Check if subscription has expired
//   if (
//     this.subscriptionStatus === "active" &&
//     this.subscriptionEndDate &&
//     new Date() > this.subscriptionEndDate &&
//     !this.autoRenew
//   ) {
//     this.subscriptionStatus = "expired";
//   }

//   next();
// });

// // ----------------------- JSON TRANSFORMATION -----------------------
// vendorProfileSchema.methods.toJSON = function () {
//   const obj = this.toObject();

//   // Add computed fields
//   obj.isTrialExpired = this.isTrialExpired;
//   obj.isSubscriptionExpired = this.isSubscriptionExpired;
//   obj.daysLeftInTrial = this.daysLeftInTrial;
//   obj.daysLeftInSubscription = this.daysLeftInSubscription;
//   obj.canAccess = this.canAccessFeature();

//   return obj;
// };

// module.exports = mongoose.model("VendorProfile", vendorProfileSchema);




























const mongoose = require("mongoose");

const vendorProfileSchema = new mongoose.Schema(
  {
    // ----------------------- BASIC STORE INFO -----------------------
    storeName: {
      type: String,
      trim: true,
      maxlength: [100, "Store name cannot exceed 100 characters"],
      default: ""
    },

    storeAddress: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      zipCode: { type: String, trim: true, default: "" },
      fullAddress: {
        type: String,
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"],
        default: ""
      }
    },
    latitude: { type: String, default: "" },
    longitude: { type: String, default: "" },

    logo: { type: String, trim: true, default: "" },
    coverImage: { type: String, trim: true, default: "" },
    tinCertificate: { type: String, trim: true, default: "" },

    // ----------------------- BANK DETAILS -----------------------
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branchName: { type: String, default: '' },
      accountType: {
        type: String,
        enum: ['savings', 'current'],
        default: 'savings'
      },
      upiId: { type: String, default: '' }
    },

    // ----------------------- OWNER DETAILS -----------------------
    ownerFirstName: {
      type: String,
      required: [true, "Owner first name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"]
    },

    ownerLastName: {
      type: String,
      required: [true, "Owner last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"]
    },

    ownerPhone: {
      type: String,
      trim: true,
      default: ""
    },

    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email"
      ]
    },

    // ----------------------- BUSINESS INFO -----------------------
    businessTIN: {
      type: String,
      trim: true,
      default: ""
    },

    tinExpireDate: {
      type: Date,
      default: null
    },

    // ----------------------- MODULE & ZONE -----------------------
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      default: null
    },

    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      default: null
    },

    // ----------------------- SUBSCRIPTION FIELDS -----------------------
    isFreeTrial: {
      type: Boolean,
      default: false,
      index: true
    },

    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null
    },

    subscriptionStatus: {
      type: String,
      enum: ["none", "trial", "pending", "pending_payment", "active", "expired", "cancelled", "suspended"],
      default: "none",
      index: true
    },

    subscriptionStartDate: {
      type: Date,
      default: null
    },

    subscriptionEndDate: {
      type: Date,
      default: null
    },

    lastPaymentDate: {
      type: Date,
      default: null
    },

    autoRenew: {
      type: Boolean,
      default: false
    },

    paymentHistory: [{
      orderId: String,
      amount: Number,
      status: String,
      paymentDate: Date,
      paymentMethod: String,
      transactionId: String
    }],
    // ----------------------- CAKE MODULE FIELDS -----------------------
    estimatedDeliveryTime: {
      minDays: {
        type: Number,
        default: null
      },
      maxDays: {
        type: Number,
        default: null
      },
      unit: {
        type: String,
        enum: ["hours", "days"],
        default: "days"
      }
    },

    bio: {
      title: { type: String, default: "" },
      subtitle: { type: String, default: "" },
      description: { type: String, default: "" }
    },

    vendorType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual"
    },

    // ----------------------- APPROVAL SYSTEM -----------------------
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true
    },
    registrationSource: {
      type: String,
      enum: ["website", "admin"],
      index: true
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    reviewedAt: Date,
    rejectionReason: String,
    adminNotes: String,

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    approvedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // ----------------------- USER RELATION -----------------------
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true
    },

    // ----------------------- ADDITIONAL METADATA -----------------------
    features: {
      type: [String],
      default: []
    },

    limitations: {
      maxListings: { type: Number, default: null },
      maxPhotos: { type: Number, default: null },
      canUseAdvancedFeatures: { type: Boolean, default: false }
    },

    // ----------------------- DELIVERY PROFILE -----------------------
    deliveryProfile: {
      deliveryConfigurations: [{
        mode: {
          type: String,
          required: true
        },
        coverageType: {
          type: String,
          enum: ['entire_zone', 'radius_based', 'selected_pincodes'],
          default: 'entire_zone'
        },
        radius: { type: Number, default: 0 }, // in km
        selectedPincodes: [{ type: String }], // Array of pincode strings
        shippingPrice: { type: Number, default: 0 },
        status: { type: Boolean, default: true }
      }]
    }
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ----------------------- INDEXES FOR PERFORMANCE -----------------------
vendorProfileSchema.index({ user: 1 });
vendorProfileSchema.index({ module: 1, status: 1 });
vendorProfileSchema.index({ subscriptionStatus: 1, isActive: 1 });
vendorProfileSchema.index({ subscriptionEndDate: 1, subscriptionStatus: 1 });

// ----------------------- VIRTUAL: IS TRIAL EXPIRED -----------------------
vendorProfileSchema.virtual("isTrialExpired").get(function () {
  if (!this.isFreeTrial || this.subscriptionStatus !== "trial") return false;
  if (!this.subscriptionEndDate) return false;
  return new Date() > this.subscriptionEndDate;
});

// ----------------------- VIRTUAL: IS SUBSCRIPTION EXPIRED -----------------------
vendorProfileSchema.virtual("isSubscriptionExpired").get(function () {
  if (!this.subscriptionEndDate) return false;
  return new Date() > this.subscriptionEndDate;
});

// ----------------------- VIRTUAL: DAYS LEFT IN SUBSCRIPTION -----------------------
vendorProfileSchema.virtual("daysLeftInSubscription").get(function () {
  if (!this.subscriptionEndDate) return 0;
  const diff = this.subscriptionEndDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// ----------------------- METHODS -----------------------

// Check if vendor can access features
vendorProfileSchema.methods.canAccessFeature = function (featureName) {
  // If subscription is active or in trial
  if (this.subscriptionStatus === "active" || this.subscriptionStatus === "trial") {
    // Check if subscription is not expired
    if (this.subscriptionEndDate && new Date() > this.subscriptionEndDate) {
      return false;
    }
    return true;
  }
  return false;
};

// Activate subscription
vendorProfileSchema.methods.activateSubscription = async function (planId, startDate, endDate) {
  this.subscriptionPlan = planId;
  this.subscriptionStatus = "active";
  this.subscriptionStartDate = startDate || new Date();
  this.subscriptionEndDate = endDate;
  this.isFreeTrial = false;
  this.lastPaymentDate = new Date();

  return await this.save();
};

// Cancel subscription
vendorProfileSchema.methods.cancelSubscription = async function () {
  this.subscriptionStatus = "cancelled";
  this.autoRenew = false;
  return await this.save();
};

// Suspend subscription
vendorProfileSchema.methods.suspendSubscription = async function (reason) {
  this.subscriptionStatus = "suspended";
  this.adminNotes = (this.adminNotes || "") + `\nSuspended: ${reason}`;
  return await this.save();
};

// Add payment to history
vendorProfileSchema.methods.addPayment = async function (paymentData) {
  this.paymentHistory.push({
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    status: paymentData.status,
    paymentDate: paymentData.paymentDate || new Date(),
    paymentMethod: paymentData.paymentMethod || "card",
    transactionId: paymentData.transactionId
  });
  this.lastPaymentDate = paymentData.paymentDate || new Date();
  return await this.save();
};

// ----------------------- STATIC METHODS -----------------------

// Find vendors with expiring subscriptions
vendorProfileSchema.statics.findExpiringSubscriptions = function (daysThreshold = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return this.find({
    subscriptionStatus: "active",
    subscriptionEndDate: {
      $gte: new Date(),
      $lte: thresholdDate
    }
  }).populate("user", "firstName lastName email").populate("subscriptionPlan");
};

// Find expired subscriptions
vendorProfileSchema.statics.findExpiredSubscriptions = function () {
  return this.find({
    subscriptionStatus: "active",
    subscriptionEndDate: { $lt: new Date() }
  }).populate("user", "firstName lastName email").populate("subscriptionPlan");
};

// ----------------------- PRE-SAVE HOOKS -----------------------

// Auto-expire subscriptions
vendorProfileSchema.pre("save", function (next) {
  // Check if subscription has expired
  if (
    this.subscriptionStatus === "active" &&
    this.subscriptionEndDate &&
    new Date() > this.subscriptionEndDate &&
    !this.autoRenew
  ) {
    this.subscriptionStatus = "expired";
  }

  next();
});

// ----------------------- JSON TRANSFORMATION -----------------------
vendorProfileSchema.methods.toJSON = function () {
  const obj = this.toObject();

  // Remove fields that should not be in response
  delete obj.trialStartDate;
  delete obj.trialEndDate;
  delete obj.nextBillingDate;

  // Add computed fields
  obj.isTrialExpired = this.isTrialExpired;
  obj.isSubscriptionExpired = this.isSubscriptionExpired;
  obj.daysLeftInSubscription = this.daysLeftInSubscription;
  obj.canAccess = this.canAccessFeature();

  return obj;
};

module.exports = mongoose.model("VendorProfile", vendorProfileSchema);