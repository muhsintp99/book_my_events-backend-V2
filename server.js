const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const connectDB = require("./config/db");
connectDB();

const app = express();

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:5000",
  "http://localhost:5173", 
  "https://dashboard.bookmyevent.ae",
  "https://vendor.bookmyevent.ae",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow requests with no origin (e.g., Postman)
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed from this origin: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));


// Routes
app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

// Public Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

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
app.use("/api/catering", require("./routes/vendor/cateringRoutes")); // ✅ Added this line


app.use("/api/profile", require("./routes/vendor/profileRoutes"));


// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));