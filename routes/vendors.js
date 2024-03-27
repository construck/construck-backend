const router = require("express").Router();
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const workData = require("../models/workData");

router.get("/", async (req, res) => {
  try {
    const vendors = await venData.model.find();
    res.status(200).send(vendors);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let vendorToCreate = new venData.model(req.body);
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    vendorToCreate.password = hashedPassword;
    let vendorCreated = await vendorToCreate.save();
    res.status(201).send(vendorCreated);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.send({
      error,
      key,
    });
  }
});

router.put("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let vendor = await venData.model.findByIdAndUpdate(id, req.body);

    await workData.model.updateMany(
      {
        "equipment.eqOwner": vendor?.name,
      },
      { $set: { "equipment.eqOwner": req?.body?.name } }
    );

    res.status(200).send(vendor);
  } catch (err) {
    res.send(err);
  }
});

router.put("/resetPassword/:id", async (req, res) => {
  let newPassword = "password";
  let { id } = req.params;

  try {
    let vendor = await venData.model.findById(id);
    if (!vendor) {
      res.status(401).send({
        message: "Vendor not found!",
        error: true,
      });
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      vendor.password = hashedPassword;
      await vendor.save();

      res.send({
        message: "Allowed",
        error: false,
        newPassword,
        vendor,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

module.exports = router;
