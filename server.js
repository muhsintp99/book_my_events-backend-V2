  // const express = require("express");
  // const cors = require("cors");
  // require("dotenv").config();
  // const path = require("path");

  // const connectDB = require("./config/db");
  // connectDB();

  // const app = express();

  // // CORS Configuration
  // const allowedOrigins = [
  //   "http://localhost:5001",
  //   "http://localhost:5002",
  //   "http://localhost:5000",
  //   "http://localhost:5173",
  //   "https://dashboard.bookmyevent.ae",
  //   "https://vendor.bookmyevent.ae",
  // ];

  // app.use(
  //   cors({
  //     origin: function (origin, callback) {
  //       if (!origin) return callback(null, true); // Allow requests with no origin (e.g., Postman)
  //       if (allowedOrigins.includes(origin)) {
  //         callback(null, true);
  //       } else {
  //         callback(new Error("CORS not allowed from this origin: " + origin));
  //       }
  //     },
  //     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //     credentials: true,
  //   })
  // );

  // // Middleware
  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));

  // // Static uploads
  // // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  // app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

  // // Routes
  // app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

  // // Public Routes
  // app.use("/api/auth", require("./routes/authRoutes"));
  // app.use("/api/users", require("./routes/userRoutes"));

  // // Admin Routes
  // app.use("/api/modules", require("./routes/admin/moduleRoutes"));
  // app.use("/api/secondary-modules", require("./routes/admin/secondaryModuleRoutes"));
  // app.use("/api/categories", require("./routes/admin/categoryRoutes"));
  // app.use("/api/vehicle-categories", require("./routes/admin/vehiclecategoryRoutes"));
  // app.use("/api/brands", require("./routes/admin/brandRoutes"));
  // app.use("/api/coupons", require("./routes/admin/couponsRouters"));
  // app.use("/api/banners", require("./routes/admin/bannerRoutes"));
  // app.use("/api/vehicle-banners", require("./routes/admin/vehicleBannerRoutes"));
  // app.use("/api/zones", require("./routes/admin/zoneRoutes"));

  // // Vendor Routes
  // app.use("/api/vendorprofiles", require("./routes/vendor/vendorProfileRoutes"));
  // app.use("/api/reviews", require("./routes/vendor/reviewRouters"));
  // app.use("/api/venues", require("./routes/vendor/venueRoutes"));
  // app.use("/api/packages", require("./routes/admin/packageRoutes"));
  // app.use("/api/renters", require("./routes/vendor/renterRoutes"));
  // app.use("/api/vehicles", require("./routes/vendor/vehicleRouter"));
  // app.use("/api/venuecoupons", require("./routes/vendor/venueCouponRoutes"));
  // app.use("/api/catering", require("./routes/vendor/cateringRoutes")); // ✅ Added this line

  // app.use("/api/profile", require("./routes/vendor/profileRoutes"));

  // // Server listen
  // const PORT = process.env.PORT || 5000;
  // app.listen(PORT, () => console   .log(`✅ Server running on port ${PORT}`));








  // const express = require("express");
  // const cors = require("cors");
  // require("dotenv").config();
  // const path = require("path");

  // const connectDB = require("./config/db");
  // connectDB();

  // require("./models/vendor/Profile");  // Load Profile FIRST
  // require("./models/User");  

  // // delete require.cache[require.resolve("./models/vendor/PhotographyPackage")];
  // // require("./models/vendor/PhotographyPackage");

  // const app = express();

  // // CORS Configuration
  // const allowedOrigins = [
  //   "http://localhost:5001",
  //   "http://localhost:5002",
  //  "http://127.0.0.1:5500",
  //   "http://localhost:5000",
  //   "http://localhost:5173",
  //   "https://dashboard.bookmyevent.ae",
  //   "https://www.bookmyevent.ae",
  //   "https://vendor.bookmyevent.ae",
  //   "https://api.bookmyevent.ae", 
  //   "https://book-my-events-website.vercel.app"
  // ];

  // app.use(
  //   cors({
  //     origin: function (origin, callback) {
  //       // ✅ Allow requests with no origin (e.g., same-origin requests, Postman)
  //       if (!origin) return callback(null, true);

  //       if (allowedOrigins.includes(origin)) {
  //         callback(null, true);
  //       } else {
  //         // ✅ Log the blocked origin for debugging
  //         console.log("❌ CORS blocked origin:", origin);
  //         callback(new Error("CORS not allowed from this origin: " + origin));
  //       }
  //     },
  //     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //     credentials: true,
  //   })
  // );

  // // ✅ Add this BEFORE your routes - handles CORS preflight requests
  // app.options("*", cors());

  // // Middleware
  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true })); // ✅ This is already here - good!

  // // Static uploads
  // app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
  // // app.use("/uploads", express.static(path.join(__dirname, "..", "Uploads")));


  // // Routes
  // app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

  // // Public Routes
  // app.use("/api/auth", require("./routes/authRoutes"));
  // app.use("/api/users", require("./routes/userRoutes"));
  // app.use("/api/delete-user", require("./routes/userDeleteRoutes"));

  // // Admin Routes
  // app.use("/api/modules", require("./routes/admin/moduleRoutes"));
  // app.use(
  //   "/api/secondary-modules",
  //   require("./routes/admin/secondaryModuleRoutes")
  // );
  // app.use("/api/categories", require("./routes/admin/categoryRoutes"));
  // app.use(
  //   "/api/vehicle-categories",
  //   require("./routes/admin/vehiclecategoryRoutes")
  // );
  // app.use("/api/brands", require("./routes/admin/brandRoutes"));
  // app.use("/api/coupons", require("./routes/admin/couponsRouters"));
  // app.use("/api/banners", require("./routes/admin/bannerRoutes"));
  // app.use("/api/vehicle-banners", require("./routes/admin/vehicleBannerRoutes"));
  // app.use("/api/zones", require("./routes/admin/zoneRoutes"));

  // // Vendor Routes
  // app.use("/api/vendorprofiles", require("./routes/vendor/vendorProfileRoutes"));
  // app.use("/api/reviews", require("./routes/vendor/reviewRouters"));
  // app.use("/api/venues", require("./routes/vendor/venueRoutes"));
  // app.use("/api/packages", require("./routes/admin/packageRoutes"));
  // app.use("/api/renters", require("./routes/vendor/renterRoutes"));
  // app.use("/api/vehicles", require("./routes/vendor/vehicleRouter"));
  // app.use("/api/venuecoupons", require("./routes/vendor/venueCouponRoutes"));
  // app.use("/api/catering", require("./routes/vendor/cateringRoutes"));
  // app.use("/api/profile", require("./routes/vendor/profileRoutes"));
  // app.use("/api/bookings", require("./routes/vendor/bookingRoutes"));
  // app.use("/api/payment", require("./routes/payment.routes"));
  // app.use(
  //   "/api/vehicle-attributes",
  //   require("./routes/admin/vehicleAttributeRoutes")
  // );
  // app.use("/api/makeup-packages", require("./routes/admin/makeupPackageRoutes"));
  // app.use("/api/makeup-types", require("./routes/admin/makeupTypeRoutes"));
  // app.use("/api/portfolio", require("./routes/vendor/portfolioRoutes"));
  // app.use("/api/photography-packages", require("./routes/vendor/photographyPackageRoutes"));

  // // ✅ Global Error Handler (add this at the end)
  // app.use((err, req, res, next) => {
  //   console.error("❌ Error:", err.message);
  //   res.status(err.status || 500).json({
  //     message: err.message || "Internal Server Error",
  //     error: process.env.NODE_ENV === "development" ? err : {},
  //   });
  // });

  // // Server listen
  // const PORT = process.env.PORT || 5000;
  // app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));



  const express = require("express");
  const cors = require("cors");
  require("dotenv").config();
  const path = require("path");
const subscriptionRoutes = require("./routes/admin/subscriptionRoutes");

  // DB Connection
  const connectDB = require("./config/db");
  connectDB();

  // Load essential models
  require("./models/vendor/Profile");
  require("./models/User");

  const app = express();

  /* -------------------------------------------
    CORS CONFIGURATION (Supports Local + Production)
  -------------------------------------------- */

  const allowedOrigins = [
    // Local Dev
    "http://localhost:5000",
    "http://localhost:5001",
    "http://localhost:5002",
    "http://localhost:5173",
    "http://127.0.0.1:5500",

    // Production Dashboard
    "https://vendor.bookmyevent.ae",
    "https://dashboard.bookmyevent.ae",

    // Main Website
    "https://www.bookmyevent.ae",
    "https://bookmyevent.ae",

    // API Domain (self)
    "https://api.bookmyevent.ae",
    "https://bookmyevents-v2.vercel.app"
  ];

  // Enable wildcard for any *.bookmyevent.ae subdomain
  const originCheck = (origin, callback) => {
    if (!origin) return callback(null, true); // allow same-origin & mobile apps

    const allowed = allowedOrigins.includes(origin);

    const wildcardMatch =
      /\.bookmyevent\.ae$/.test(origin) || /\.book-my-events\.vercel\.app$/.test(origin);

    if (allowed || wildcardMatch) {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked origin:", origin);
      callback(new Error("CORS not allowed from this origin: " + origin));
    }
  };

  app.use(
    cors({
      origin: originCheck,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Preflight handler
  app.options("*", cors());

  /* -------------------------------------------
    STANDARD MIDDLEWARES
  -------------------------------------------- */
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  /* -------------------------------------------
    STATIC FILES
  -------------------------------------------- */
  app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

  /* -------------------------------------------
    ROUTES
  -------------------------------------------- */
  app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

  // Public Routes
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/users", require("./routes/userRoutes"));
  app.use("/api/delete-user", require("./routes/userDeleteRoutes"));

  // Admin Routes
  app.use("/api/modules", require("./routes/admin/moduleRoutes"));
  app.use("/api/secondary-modules", require("./routes/admin/secondaryModuleRoutes"));
  app.use("/api/categories", require("./routes/admin/categoryRoutes"));
  app.use("/api/vehicle-categories", require("./routes/admin/vehiclecategoryRoutes"));
  app.use("/api/brands", require("./routes/admin/brandRoutes"));
  app.use("/api/coupons", require("./routes/admin/couponsRouters"));
  app.use("/api/banners", require("./routes/admin/bannerRoutes"));
  app.use("/api/vehicle-banners", require("./routes/admin/vehicleBannerRoutes"));
  app.use("/api/zones", require("./routes/admin/zoneRoutes"));

  // Vendor Routes
  app.use("/api/vendorprofiles", require("./routes/vendor/vendorProfileRoutes"));
  app.use("/api/reviews", require("./routes/vendor/reviewRouters"));
  app.use("/api/venues", require("./routes/vendor/venueRoutes"));
  app.use("/api/packages", require("./routes/admin/packageRoutes"));
  app.use("/api/renters", require("./routes/vendor/renterRoutes"));
  app.use("/api/vehicles", require("./routes/vendor/vehicleRouter"));
  app.use("/api/venuecoupons", require("./routes/vendor/venueCouponRoutes"));
  app.use("/api/catering", require("./routes/vendor/cateringRoutes"));
  app.use("/api/profile", require("./routes/vendor/profileRoutes"));
  app.use("/api/bookings", require("./routes/vendor/bookingRoutes"));
  app.use("/api/payment", require("./routes/payment.routes"));
  app.use("/api/vehicle-attributes", require("./routes/admin/vehicleAttributeRoutes"));
  app.use("/api/makeup-packages", require("./routes/admin/makeupPackageRoutes"));
  app.use("/api/makeup-types", require("./routes/admin/makeupTypeRoutes"));
  app.use("/api/portfolio", require("./routes/vendor/portfolioRoutes"));
  app.use("/api/photography-packages", require("./routes/vendor/photographyPackageRoutes"));
  app.use("/api/subscription", require("./routes/admin/subscriptionRoutes"));

  /* -------------------------------------------
    GLOBAL ERROR HANDLER
  -------------------------------------------- */
  app.use((err, req, res, next) => {
    console.error("❌ Error:", err.message);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });

  /* -------------------------------------------
    START SERVER
  -------------------------------------------- */
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
