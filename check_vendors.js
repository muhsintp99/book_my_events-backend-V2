const mongoose = require("mongoose");
require("dotenv").config();
const VendorProfile = require("./models/vendor/vendorProfile");
const MehandiPackage = require("./models/vendor/mehandiPackageModel");
const User = require("./models/User");

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const moduleId = "68e78b706a1614cf448a35a3";
        
        const profiles = await VendorProfile.find({ 
            $or: [
                { module: new mongoose.Types.ObjectId(moduleId) },
                { secondaryModule: new mongoose.Types.ObjectId(moduleId) }
            ]
        }).populate("user", "firstName lastName email");

        console.log(`Found ${profiles.length} profiles for module ${moduleId}`);
        for (const p of profiles) {
            const count = await MehandiPackage.countDocuments({ 
                provider: p.user._id,
                $or: [
                    { secondaryModule: new mongoose.Types.ObjectId(moduleId) },
                    { module: new mongoose.Types.ObjectId(moduleId) }
                ]
            });
            console.log(`Vendor: ${p.user.firstName} ${p.user.lastName}, Status: ${p.status}, Active: ${p.isActive}, Packages: ${count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
