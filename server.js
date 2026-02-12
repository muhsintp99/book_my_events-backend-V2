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


































//   const express = require("express");
//   const cors = require("cors");
//   require("dotenv").config();
//   const path = require("path");
//   const subscriptionRoutes = require("./routes/admin/subscriptionRoutes");

// // DB Connection
// const connectDB = require("./config/db");
// connectDB();

// // Load essential models
// require("./models/vendor/Profile");
// require("./models/User");

// const app = express();

// /* -------------------------------------------
//   CORS CONFIGURATION (Local + Production)
// -------------------------------------------- */

// const allowedOrigins = [
//   // Local Dev
//   "http://localhost:5000",
//   "http://localhost:5001",
//   "http://localhost:5002",
//   "http://localhost:5173",
//   "http://127.0.0.1:5500",

//   // Production Dashboard
//   "https://vendor.bookmyevent.ae",
//   "https://dashboard.bookmyevent.ae",

//   // Main Website
//   "https://www.bookmyevent.ae",
//   "https://bookmyevent.ae",

//   // API Domain (self)
//   "https://api.bookmyevent.ae",

//   //payment 
//   "https://smartgateway.hdfcuat.bank.in",
//   "https://securepayments.hdfcbank.com",
//   "https://paynetzuat.hdfcbank.com",
//   "https://paynet.hdfcbank.com" 
// ];

// // Enable wildcard for *.bookmyevent.ae ONLY — all Vercel removed
// const originCheck = (origin, callback) => {
//   if (!origin) return callback(null, true); // allow mobile apps & same-origin

//   const allowed = allowedOrigins.includes(origin);

//   const wildcardMatch = /\.bookmyevent\.ae$/.test(origin);

//   if (allowed || wildcardMatch) {
//     callback(null, true);
//   } else {
//     console.log("❌ CORS blocked origin:", origin);
//     callback(new Error("CORS not allowed from this origin: " + origin));
//   }
// };

// app.use(
//   cors({
//     origin: originCheck,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// // Preflight
// app.options("*", cors());


// /* -------------------------------------------
//   STANDARD MIDDLEWARES
// -------------------------------------------- */
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* -------------------------------------------
//   STATIC FILES
// -------------------------------------------- */
// app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

// /* -------------------------------------------
//   ROUTES
// -------------------------------------------- */
// app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

// // Public Routes
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/users", require("./routes/userRoutes"));
// app.use("/api/delete-user", require("./routes/userDeleteRoutes"));

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
// app.use("/api/catering", require("./routes/vendor/cateringRoutes"));
// app.use("/api/profile", require("./routes/vendor/profileRoutes"));
// app.use("/api/bookings", require("./routes/vendor/bookingRoutes"));
// app.use("/api/payment", require("./routes/payment.routes"));


// // app.use("/api/payment", require("./routes/payment"));

// app.use("/api/vehicle-attributes", require("./routes/admin/vehicleAttributeRoutes"));
// app.use("/api/makeup-packages", require("./routes/admin/makeupPackageRoutes"));
// app.use("/api/makeup-types", require("./routes/admin/makeupTypeRoutes"));
// app.use("/api/portfolio", require("./routes/vendor/portfolioRoutes"));
// app.use("/api/photography-packages", require("./routes/vendor/photographyPackageRoutes"));
// app.use("/api/subscription", require("./routes/admin/subscriptionRoutes"));

// app.use("/api/enquiries", require("./routes/vendor/enquiryRoutes"));

// app.use("/api/availability", require("./routes/vendor/availabilityRoutes"));

// /* -------------------------------------------
//   GLOBAL ERROR HANDLER
// --------------------------------------- */
// app.use((err, req, res, next) => {
//   console.error("❌ Error:", err.message);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//   });
// });

// /* -------------------------------------------
//   START SERVER
// -------------------------------------------- */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));




































const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

/**********************************************************
 * DB CONNECTION
 **********************************************************/
const connectDB = require("./config/db");
connectDB();

/**********************************************************
 * LOAD MODELS
 **********************************************************/
require("./models/vendor/Profile");
require("./models/User");

/**********************************************************
 * APP & HTTP SERVER
 **********************************************************/
const app = express();
const server = http.createServer(app);

/**********************************************************
 * CORS CONFIGURATION
 **********************************************************/
const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  "https://vendor.bookmyevent.ae",
  "https://dashboard.bookmyevent.ae",
  "https://www.bookmyevent.ae",
  "https://bookmyevent.ae",
  "https://api.bookmyevent.ae",
  "https://smartgateway.hdfcuat.bank.in",
  "https://securepayments.hdfcbank.com",
  "https://paynetzuat.hdfcbank.in",
  "https://paynet.hdfcbank.com"
];

const originCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  const allowed =
    allowedOrigins.includes(origin) ||
    /\.bookmyevent\.ae$/.test(origin);
  allowed
    ? callback(null, true)
    : callback(new Error("CORS not allowed"));
};

app.use(
  cors({
    origin: originCheck,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

/**********************************************************
 * MIDDLEWARES
 **********************************************************/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**********************************************************
 * STATIC FILES
 **********************************************************/
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

/**********************************************************
 * ROUTES
 **********************************************************/
app.get("/", (req, res) => {
  res.send("BookMyEvent API Running 🚀");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/delete-user", require("./routes/userDeleteRoutes"));
app.use("/api/modules", require("./routes/admin/moduleRoutes"));
app.use("/api/secondary-modules", require("./routes/admin/secondaryModuleRoutes"));
app.use("/api/vehicle-categories", require("./routes/admin/vehiclecategoryRoutes"));
app.use("/api/brands", require("./routes/admin/brandRoutes"));
app.use("/api/coupons", require("./routes/admin/couponsRouters"));
app.use("/api/categories", require("./routes/admin/categoryRoutes"));
app.use("/api/banners", require("./routes/admin/bannerRoutes"));
app.use("/api/vehicle-banners", require("./routes/admin/vehicleBannerRoutes"));
app.use("/api/zones", require("./routes/admin/zoneRoutes"));
app.use("/api/subscription", require("./routes/admin/subscriptionRoutes"));
app.use("/api/vehicle-attributes", require("./routes/admin/vehicleAttributeRoutes"));
app.use("/api/makeup-packages", require("./routes/admin/makeupPackageRoutes"));
app.use("/api/makeup-types", require("./routes/admin/makeupTypeRoutes"));
app.use("/api/packages", require("./routes/admin/packageRoutes"));
app.use("/api/admin/kyc", require("./routes/admin/kycRoutes"));
app.use("/api/vendorprofiles", require("./routes/vendor/vendorProfileRoutes"));
app.use("/api/reviews", require("./routes/vendor/reviewRouters"));
app.use("/api/venues", require("./routes/vendor/venueRoutes"));
app.use("/api/renters", require("./routes/vendor/renterRoutes"));
app.use("/api/vehicles", require("./routes/vendor/vehicleRouter"));
app.use("/api/venuecoupons", require("./routes/vendor/venueCouponRoutes"));
app.use("/api/catering", require("./routes/vendor/cateringRoutes"));
app.use("/api/profile", require("./routes/vendor/profileRoutes"));
app.use("/api/bookings", require("./routes/vendor/bookingRoutes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/portfolio", require("./routes/vendor/portfolioRoutes"));
app.use("/api/photography-packages", require("./routes/vendor/photographyPackageRoutes"));
app.use("/api/enquiries", require("./routes/vendor/enquiryRoutes"));
app.use("/api/availability", require("./routes/vendor/availabilityRoutes"));
app.use("/api/cakes", require("./routes/vendor/cakePackageRoutes"));
app.use("/api/cake-addons", require("./routes/vendor/cakeAddonRoutes"));
app.use("/api/ornaments", require("./routes/vendor/ornamentPackageRoutes"));
app.use("/api/boutiques", require("./routes/vendor/boutiqueRoutes"));
app.use("/api/razorpay/subscription", require("./routes/vendor/razorpaySubscription.routes"));
app.use("/api/brand-platform", require("./routes/admin/brandPlatformRoutes"));
app.use("/api/vendor/subscription", require("./routes/vendor/subscriptionRequest.routes"));
app.use("/api/admin/subscription", require("./routes/admin/subscriptionRoutes"));
app.use("/api/admin/subscription-request/payment", require("./routes/admin/subscriptionRequestPayment.routes"));

/**********************************************************
 * SOCKET.IO (LIVE CHAT) - FIXED VERSION
 **********************************************************/
const io = new Server(server, {
  cors: {
    origin: originCheck,
    credentials: true
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

const ChatMessage = require("./models/chat/ChatMessage");

// Track active users in enquiry rooms
const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // --- JOIN ROOM ---
  socket.on("join_enquiry", async ({ enquiryId, userId, vendorId }) => {
    try {
      const Enquiry = require("./models/vendor/Enquiry");
      const enquiry = await Enquiry.findById(enquiryId);

      if (!enquiry) {
        return socket.emit("error", "Enquiry not found");
      }

      // 🔐 Authorization
      const isCustomer = userId && String(enquiry.userId) === String(userId);
      const isVendor = vendorId && String(enquiry.vendorId) === String(vendorId);

      if (!isCustomer && !isVendor) {
        console.log("❌ Unauthorized join attempt for enquiry:", enquiryId);
        return socket.emit("error", "Unauthorized access to this chat");
      }

      // Join the room
      socket.join(enquiryId);
      
      // Track active user
      if (!activeUsers.has(enquiryId)) {
        activeUsers.set(enquiryId, []);
      }
      const users = activeUsers.get(enquiryId);
      if (!users.find(u => u.id === socket.id)) {
        users.push({ id: socket.id, role: isVendor ? "vendor" : "customer" });
      }

      console.log(
        `✅ ${isVendor ? "Vendor" : "Customer"} joined enquiry room: ${enquiryId}`
      );

      // 📜 Fetch and send message history
      const history = await ChatMessage.find({ enquiryId })
        .sort({ createdAt: 1 })
        .lean();

      console.log(`📨 Sending ${history.length} messages to user`);
      socket.emit("message_history", history);

      // Notify others that user joined
      socket.broadcast.to(enquiryId).emit("user_joined", {
        role: isVendor ? "vendor" : "customer",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Socket join error:", err);
      socket.emit("error", "Failed to join chat room");
    }
  });

  // --- SEND MESSAGE ---
  socket.on("send_message", async (data) => {
    try {
      const { enquiryId, senderId, receiverId, text, senderRole } = data;

      // Validate required fields
      if (!enquiryId || !senderId || !text || !senderRole) {
        console.warn("❌ Missing required message data:", {
          enquiryId,
          senderId,
          senderRole,
          hasText: !!text,
        });
        return socket.emit("error", "Invalid message data");
      }

      console.log("💾 Saving message to database...");

      // Save to database
      const newMessage = new ChatMessage({
        enquiryId,
        senderId,
        receiverId: receiverId || null,
        message: text,
        senderRole,
      });

      const savedMessage = await newMessage.save();
      const messageObj = savedMessage.toObject();

      console.log("✅ Message saved:", messageObj._id);

      // Emit to ALL users in the room (sender + receiver)
      io.to(String(enquiryId)).emit("receive_message", {
        ...messageObj,
        timestamp: messageObj.createdAt,
        time: new Date(messageObj.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      console.log(`📤 Broadcasted message to room: ${enquiryId}`);
    } catch (err) {
      console.error("❌ Socket message error:", err);
      socket.emit("error", "Failed to send message");
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    
    // Clean up active users
    for (const [enquiryId, users] of activeUsers.entries()) {
      const remaining = users.filter(u => u.id !== socket.id);
      if (remaining.length > 0) {
        activeUsers.set(enquiryId, remaining);
      } else {
        activeUsers.delete(enquiryId);
      }
    }
  });
});

/**********************************************************
 * GLOBAL ERROR HANDLER
 **********************************************************/
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

/**********************************************************
 * START SERVER
 **********************************************************/
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
});

module.exports = { io };