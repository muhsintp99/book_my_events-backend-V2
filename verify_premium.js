const mongoose = require('mongoose');
require('dotenv').config();
const { getPremiumHighlights } = require('./controllers/vendor/premiumVendorController');

async function testController() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        const mockReq = {};
        const mockRes = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) {
                console.log('📦 Status:', this.statusCode);
                console.log('📦 Total Count:', data.count);
                console.log('📦 Modules:', Object.keys(data.data));
                process.exit(0);
            }
        };

        await getPremiumHighlights(mockReq, mockRes);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testController();
