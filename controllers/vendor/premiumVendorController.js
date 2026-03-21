const Venue = require("../../models/vendor/Venue");
const Catering = require("../../models/vendor/Catering");
const Photography = require("../../models/vendor/PhotographyPackage");
const Makeup = require("../../models/admin/makeupPackageModel");
const CakePackage = require("../../models/vendor/cakePackageModel");
const MehandiPackage = require("../../models/vendor/mehandiPackageModel");
const InvitationPackage = require("../../models/vendor/invitationPackageModel");
const FloristPackage = require("../../models/vendor/floristPackageModel");
const LightAndSoundPackage = require("../../models/vendor/lightAndSoundPackageModel");
const BouncerPackage = require("../../models/vendor/bouncerPackageModel");
const EmceePackage = require("../../models/vendor/emceePackageModel");
const PanthalDecorationPackage = require("../../models/vendor/panthalDecorationPackageModel");
const EventProfessionalPackage = require("../../models/vendor/eventProfessionalPackageModel");
const Vehicle = require("../../models/vendor/Vehicle");
const OrnamentPackage = require("../../models/vendor/ornamentPackageModel");
const BoutiquePackage = require("../../models/vendor/boutiquePackageModel");
const User = require("../../models/User");
const Module = require("../../models/admin/module");
const SecondaryModule = require("../../models/admin/secondarymodule");
const VendorProfile = require("../../models/vendor/vendorProfile");
const Subscription = require("../../models/admin/Subscription");

/**
 * ➤ Get Premium Vendors (Aggregated from all modules)
 * 
 * Checks BOTH sources of subscription truth:
 *   1. VendorProfile.subscriptionStatus ("active" or "trial")
 *   2. Subscription model (status: "active", isCurrent: true)
 * Merges results so ALL premium vendors are included.
 */
exports.getPremiumHighlights = async (req, res) => {
    try {
        // ──────────────────────────────────────────────────────────────
        // 1. Identify ALL premium providers from BOTH sources
        // ──────────────────────────────────────────────────────────────

        // Source A: VendorProfile with active/trial subscriptionStatus
        const vpPremiumIds = await VendorProfile.find({
            subscriptionStatus: { $in: ["active", "trial", "pending"] },
            isActive: { $ne: false }
        }).distinct("user");

        // Source B: Subscription model with active/trial status & isCurrent
        const subPremiumIds = await Subscription.find({
            status: { $in: ["active", "trial"] },
            isCurrent: { $ne: false }
        }).distinct("userId");

        // Merge both sets (deduplicate using a Set of string IDs)
        const mergedIdSet = new Set();
        vpPremiumIds.filter(id => id).forEach(id => mergedIdSet.add(id.toString()));
        subPremiumIds.filter(id => id).forEach(id => mergedIdSet.add(id.toString()));

        // Convert back to ObjectId-compatible array
        const mongoose = require("mongoose");
        const premiumProviders = Array.from(mergedIdSet).map(
            id => new mongoose.Types.ObjectId(id)
        );

        console.log(`📡 [PremiumHighlights] Found ${premiumProviders.length} active premium vendors.`);
        console.log(`   ↳ From VendorProfile: ${vpPremiumIds.length}, From Subscription: ${subPremiumIds.length}`);

        if (premiumProviders.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No premium vendors found",
                count: 0,
                data: {}
            });
        }

        // ──────────────────────────────────────────────────────────────
        // 2. Define modules to check
        // ──────────────────────────────────────────────────────────────
        const modulesToCheck = [
            { model: Venue, name: "Venues", pType: 'module' },
            { model: Photography, name: "Photography", pType: 'module' },
            { model: Makeup, name: "Makeup Artist", pType: 'module' },
            { model: Catering, name: "Catering", pType: 'module' },
            { model: CakePackage, name: "Cake", pType: 'module' },
            { model: MehandiPackage, name: "Mehandi Artist", pType: 'secondary' },
            { model: InvitationPackage, name: "Invitation & Printing", pType: 'secondary' },
            { model: FloristPackage, name: "Florist & Stage", pType: 'secondary' },
            { model: LightAndSoundPackage, name: "Light & Sounds", pType: 'secondary' },
            { model: BouncerPackage, name: "Bouncers & Security", pType: 'secondary' },
            { model: EmceePackage, name: "Event Host / Emcee", pType: 'secondary' },
            { model: PanthalDecorationPackage, name: "Panthal & Decorations", pType: 'secondary' },
            { model: EventProfessionalPackage, name: "Event Professionals", pType: 'secondary' },
            { model: Vehicle, name: "Transport", pType: 'module' },
            { model: OrnamentPackage, name: "Ornaments", pType: 'module' },
            { model: BoutiquePackage, name: "Boutique", pType: 'module' }
        ];

        const premiumData = {};

        // ──────────────────────────────────────────────────────────────
        // 3. Parallel fetch across all modules
        // ──────────────────────────────────────────────────────────────
        await Promise.all(modulesToCheck.map(async ({ model, name, pType }) => {
            try {
                if (!model) return;

                // Query packages belonging to premium providers
                // Use $ne: false instead of true so docs without isActive field are included
                const query = { 
                    isActive: { $ne: false },
                    provider: { $in: premiumProviders }
                };

                const allItems = await model.find(query)
                    .populate({
                        path: "provider",
                        select: "firstName lastName email phone role",
                        populate: { 
                            path: "vendorProfile",
                            select: "storeName logo coverImage subscriptionStatus isTopPick"
                        }
                    })
                    .lean();

                // Deduplicate by Provider (show only one package per vendor)
                const uniqueVendors = new Map();
                for (const item of allItems) {
                    const providerId = item.provider?._id?.toString() || item.provider?.toString();
                    if (!providerId) continue;

                    // Prefer "Top Pick" items when deduplicating
                    if (!uniqueVendors.has(providerId) || (item.isTopPick && !uniqueVendors.get(providerId).isTopPick)) {
                        uniqueVendors.set(providerId, item);
                    }
                }

                const items = Array.from(uniqueVendors.values());

                // Manually populate module/secondaryModule
                for (let item of items) {
                    if (pType === 'module' && item.module) {
                        item.module = await Module.findById(item.module).select("title icon moduleId").lean();
                    } else if (pType === 'secondary' && item.secondaryModule) {
                        item.secondaryModule = await SecondaryModule.findById(item.secondaryModule).select("title icon moduleId").lean();
                    }
                }

                if (items.length > 0) {
                    premiumData[name] = items;
                    console.log(`✅ [PremiumHighlights] ${name}: ${items.length} items found.`);
                }
            } catch (err) {
                console.error(`❌ [PremiumHighlights] Error fetching ${name}:`, err.message);
            }
        }));

        res.status(200).json({
            success: true,
            message: "Premium highlights fetched successfully",
            count: Object.values(premiumData).reduce((acc, curr) => acc + curr.length, 0),
            data: premiumData
        });

    } catch (error) {
        console.error("Critical error in getPremiumHighlights:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
