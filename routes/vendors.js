const router = require("express").Router();
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const workData = require("../models/workData");

router.get("/", async (req, res) => {
  try {
    const vendors = await venData.model
      .find()
      .populate("revenueAdmin", {
        firstName: 1,
        lastName: 1,
      })
      .sort({ name: 1 });
    return res.status(200).send(vendors);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let vendorToCreate = new venData.model(req.body);
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
router.put("/:id/set-vat", async (req, res) => {
  let { id } = req.params;
  try {
    let vendor = await venData.model.findByIdAndUpdate(id, {
      vat: true,
    });

    return res.status(200).send({
      response: vendor,
      message: "VAT was set successfully",
    });
  } catch (err) {
    return res.send(err);
  }
});

module.exports = router;
