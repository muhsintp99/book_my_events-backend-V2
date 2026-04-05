const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/secondaryModulePackageAdminController');

/* =====================================================
   ADMIN ROUTES (Filtered by Module ID)
   Used for: /api/admin/secondary-package/:moduleId/...
===================================================== */

// 1. Module Specific Dashboard (Earnings, Total Counts)
router.get('/:moduleId/dashboard', ctrl.getModuleDashboard);

// 2. Provider Management (List all, Add new)
router.get('/:moduleId/providers', ctrl.getModuleProviders);
router.post('/add-provider', ctrl.addProviderToModule);

// 3. Enquiry Management
router.get('/:moduleId/enquiries', ctrl.getModuleEnquiries);

// 4. Category Management
router.get('/:moduleId/categories', ctrl.getModuleCategories);

module.exports = router;
