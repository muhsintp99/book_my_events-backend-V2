const express = require('express');
require('dotenv').config();
const path = require('path');

const connectDB = require('./config/db');
connectDB();

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("BookMyEvent API Running 🚀"));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Admin Routes
app.use('/api/modules', require('./routes/admin/moduleRoutes'));
app.use('/api/categories', require('./routes/admin/categoryRoutes'));
app.use('/api/brands', require('./routes/admin/brandRoutes'));
app.use('/api/coupons', require('./routes/admin/couponsRouters'));
app.use('/api/banners', require('./routes/admin/bannerRoutes'));
app.use('/api/zones', require('./routes/admin/zoneRoutes'));

// Admin Routes
app.use('/api/vendorprofiles', require('./routes/vendor/vendorProfileRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
