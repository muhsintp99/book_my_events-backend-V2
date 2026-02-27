const mongoose = require("mongoose");

const invitationPackageSchema = new mongoose.Schema(
    {
        packageId: {
            type: String,
            required: true,
            unique: true,
        },

        secondaryModule: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SecondaryModule",
            required: true,
            alias: "module"
        },

        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        packageName: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        packagePrice: {
            type: Number,
            required: true,
            default: 0,
        },

        advanceBookingAmount: {
            type: Number,
            default: 0,
        },

        thumbnail: {
            type: String,
            default: null,
        },

        images: {
            type: [String],
            default: [],
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isTopPick: {
            type: Boolean,
            default: false,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                if (ret.module && !ret.secondaryModule) {
                    ret.secondaryModule = ret.module;
                }
                delete ret.module;
                return ret;
            },
            virtuals: true
        },
        toObject: {
            transform: function (doc, ret) {
                if (ret.module && !ret.secondaryModule) {
                    ret.secondaryModule = ret.module;
                }
                delete ret.module;
                return ret;
            },
            virtuals: true
        }
    }
);

module.exports = mongoose.model("InvitationPackage", invitationPackageSchema);
