const mongoose = require("mongoose");
const Booking = require("./models/vendor/Booking");
require("dotenv").config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const dates = ["2026-06-18", "2026-10-15", "2026-12-18"];
        const ids = ["6978a225c5562e585f415200"]; // From user screenshot

        for (const dateStr of dates) {
            const startOfDay = new Date(dateStr);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(dateStr);
            endOfDay.setUTCHours(23, 59, 59, 999);

            console.log(`\n--- Checking Date: ${dateStr} ---`);

            const bookings = await Booking.find({
                bookingDate: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ["Pending", "Accepted"] }
            }).lean();

            console.log(`Found ${bookings.length} potential bookings for this date.`);
            bookings.forEach(b => {
                console.log(`ID: ${b._id}, Module: ${b.moduleType}, Status: ${b.status}, BoutiqueId: ${b.boutiqueId}, PackageId: ${b.packageId}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
