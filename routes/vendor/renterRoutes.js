const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/upload");
const renterController = require("../../controllers/vendor/renterController");

const setRenterFolder = (req, res, next) => {
  req.folder = "renter";
  next();
};

router
  .route("/")
  .get(renterController.getRenters)
  .post(
    setRenterFolder,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "vehicleImages", maxCount: 10 },
    ]),
    renterController.createRenter
  );

router.get("/count", renterController.getRenterCounts);

router
  .route("/:id")
  .get(renterController.getRenter)
  .put(
    setRenterFolder,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "vehicleImages", maxCount: 10 },
    ]),
    renterController.updateRenter
  )
  .delete(renterController.deleteRenter);

router.patch("/:id/toggle", renterController.toggleRenterStatus);

module.exports = router;
