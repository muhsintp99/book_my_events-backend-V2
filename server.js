const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const connectDB = require('./config/db');
connectDB();

const app = express();

// ✅ Enable CORS for all origins (during development)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ✅ Parse JSON
app.use(express.json());

// Test route
app.get('/', (req, res) => res.send('BookMyEvent API Running 🚀'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= PUBLIC ROUTES =================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// ================= ADMIN ROUTES =================
app.use('/api/modules', require('./routes/admin/moduleRoutes'));
app.use('/api/secondary-modules', require('./routes/admin/secondaryModuleRoutes'));

app.use('/api/categories', require('./routes/admin/categoryRoutes'));
app.use('/api/brands', require('./routes/admin/brandRoutes'));
app.use('/api/coupons', require('./routes/admin/couponsRouters'));
app.use('/api/banners', require('./routes/admin/bannerRoutes'));
app.use('/api/zones', require('./routes/admin/zoneRoutes'));

// ================= VENDOR ROUTES =================
app.use('/api/vendorprofiles', require('./routes/vendor/vendorProfileRoutes'));
app.use('/api/reviews', require('./routes/vendor/reviewRouters'));
app.use('/api/venues', require('./routes/vendor/venueRoutes'));
app.use('/api/renters', require('./routes/vendor/renterRoutes'));
app.use('/api/vehicles', require('./routes/vendor/vehicleRouter'));
app.use('/api/venuecoupons', require('./routes/vendor/venueCouponRoutes'));


// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));