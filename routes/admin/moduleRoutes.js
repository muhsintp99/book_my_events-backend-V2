const express = require("express");
const router = express.Router();
const {upload} = require("../../middlewares/upload");
const moduleController = require("../../controllers/admin/moduleController");

// const upload = createUpload('modules', {
//   fileSizeMB: 2,
//   allowedTypes: ['image/png', 'image/jpeg']
// });

const setModuleFolder = (req, res, next) => {
  req.folder = "module";
  next();
};

router.post(
  "/",
  setModuleFolder,
  upload.single("icon"),
  // upload.single("icon"),
  moduleController.createModule
);
router.put(
  "/:id",
  setModuleFolder,
  upload.single("icon"),
  // upload.single("icon"),
  moduleController.updateModule
);
router.delete("/:id", moduleController.deleteModule);
router.get("/", moduleController.getModules);
router.get("/:id", moduleController.getModule);
router.patch("/:id/block", moduleController.blockModule);
router.patch("/:id/reactivate", moduleController.reactivateModule);

module.exports = router;
