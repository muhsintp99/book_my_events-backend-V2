const mongoose = require("mongoose");

const CakeAddonTemplateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        addonGroups: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "CakeAddon",
            },
        ],
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CakeAddonTemplate", CakeAddonTemplateSchema);
