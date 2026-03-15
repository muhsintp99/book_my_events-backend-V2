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

/**
 * ➤ Get Premium Vendors (Aggregated from all modules)
 */
exports.getPremiumHighlights = async (req, res) => {
    try {
        // 1. Identify all premium providers
        const premiumProvidersRaw = await VendorProfile.find({
            subscriptionStatus: { $in: ["active", "trial"] },
            isActive: true
        }).distinct("user");
        
        const premiumProviders = premiumProvidersRaw.filter(id => id);

        console.log(`📡 [PremiumHighlights] Found ${premiumProviders.length} active premium vendors.`);

        // 2. Define modules to check
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

        // 3. Parallel fetch
        await Promise.all(modulesToCheck.map(async ({ model, name, pType }) => {
            try {
                if (!model) return;

                // Build query - STRICTLY only vendors with active/trial subscriptions
                const query = { 
                    isActive: true,
                    provider: { $in: premiumProviders }
                };

                const items = await model.find(query)
                    .populate({
                        path: "provider",
                        select: "firstName lastName email phone role",
                        populate: { 
                            path: "vendorProfile",
                            select: "storeName logo coverImage subscriptionStatus isTopPick"
                        }
                    })
                    .lean();

                // Manually populate module/secondaryModule to avoid Mongoose virtual errors
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
