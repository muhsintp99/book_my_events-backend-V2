const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const connectDB = require("./config/db");
connectDB();

const app = express();

// ✅ Enable CORS for all origins (during development)
// app.use(
//   cors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

const allowedOrigins = [
  "http://localhost:5001",
  "http://localhost:5002",
  "https://dashboard.bookmyevent.ae",
  "https://vendor.bookmyevent.ae",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed from this origin: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // if you need cookies/sessions
  })
);

// ✅ Parse JSON
app.use(express.json());

// Test route
app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

app.use(express.urlencoded({ extended: true }));

// Static uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= PUBLIC ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// ================= ADMIN ROUTES =================
app.use("/api/modules", require("./routes/admin/moduleRoutes"));
app.use(
  "/api/secondary-modules",
  require("./routes/admin/secondaryModuleRoutes")
);

app.use("/api/categories", require("./routes/admin/categoryRoutes"));
app.use("/api/brands", require("./routes/admin/brandRoutes"));
app.use("/api/coupons", require("./routes/admin/couponsRouters"));
app.use("/api/banners", require("./routes/admin/bannerRoutes"));
app.use("/api/zones", require("./routes/admin/zoneRoutes"));

// ================= VENDOR ROUTES =================
app.use("/api/vendorprofiles", require("./routes/vendor/vendorProfileRoutes"));
app.use("/api/reviews", require("./routes/vendor/reviewRouters"));
app.use("/api/venues", require("./routes/vendor/venueRoutes"));
app.use("/api/packages", require("./routes/admin/packageRoutes"));
app.use("/api/renters", require("./routes/vendor/renterRoutes"));
app.use("/api/vehicles", require("./routes/vendor/vehicleRouter"));
app.use("/api/venuecoupons", require("./routes/vendor/venueCouponRoutes"));

// Server listen
const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);

