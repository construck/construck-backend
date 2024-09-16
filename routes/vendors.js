const router = require("express").Router();
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const workData = require("../models/workData");

router.get("/", async (req, res) => {
  try {
    const vendors = await venData.model.find().populate("revenueAdmin", {
      firstName: 1,
      lastName: 1,
    } );
    return res.status(200).send(vendors);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let vendorToCreate = new venData.model(req.body);
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    vendorToCreate.password = hashedPassword;
    let vendorCreated = await vendorToCreate.save();
    return res.status(201).send(vendorCreated);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    return res.send({
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

    return res.status(200).send(vendor);
  } catch (err) {
    return res.send(err);
  }
});

router.put("/resetPassword/:id", async (req, res) => {
  let newPassword = "password";
  let { id } = req.params;

  try {
    let vendor = await venData.model.findById(id);
    if (!vendor) {
      return res.status(401).send({
        message: "Vendor not found!",
        error: true,
      });
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      vendor.password = hashedPassword;
      await vendor.save();

      return res.send({
        message: "Allowed",
        error: false,
        newPassword,
        vendor,
      });
    }
  } catch (err) {
    return res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

module.exports = router;
