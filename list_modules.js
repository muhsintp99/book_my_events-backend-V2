const mongoose = require("mongoose");
const Module = require("./models/admin/module");
require("dotenv").config();

async function list() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const modules = await Module.find({}).lean();
        console.log("--- MODULE LIST ---");
        modules.forEach(m => {
            console.log(`Title: "${m.title}", ID: ${m._id}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

list();
