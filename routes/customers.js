const router = require("express").Router();
const custData = require("../models/customers");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const logData = require("../models/logs");
const workData = require("../models/workData");

router.get("/", async (req, res) => {
  try {
    const customers = await custData.model.find();
    res.status(200).send(customers);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const customer = await custData.model.findById(id);
    res.status(200).send(customer);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { name, phone, email, tinNumber } = req.body;
  try {
    let customerToCreate = new custData.model({
      name,
      phone,
      email,
      tinNumber,
    });
    let customerCreated = await customerToCreate.save();

    res.status(201).send(customerCreated);
  } catch (err) {
    let error = findError(err.code) ? findError(err.code) : err?.message;
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

router.post("/project", async (req, res) => {
  let { id, project } = req.body;
  try {
    let customer = await custData.model.findByIdAndUpdate(
      { _id: id },
      { $push: { projects: project } },
      function (error, success) {
        if (error) {
          res.status(201).send(id);
        } else {
        }
      }
    );
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
  let { name, phone, email, tinNumber } = req.body;
  try {
    const customer = await custData.model.findByIdAndUpdate(id, {
      name,
      phone,
      email,
      tinNumber,
    });

    res.status(200).send(customer);
  } catch (err) {
    res.send(err);
  }
});

router.put("/project/:id", async (req, res) => {
  let { id } = req.params;
  let { customerId, prjDescription } = req.body;
  let updatedProject = false;

  try {
    let customer = await custData.model.findOneAndUpdate(
      { _id: customerId, "projects._id": id },
      { $set: { "projects.$.prjDescription": prjDescription } },
      {
        new: true,
      }
    );

    await workData.model.updateMany(
      {
        "project._id": id,
      },
      { $set: { "project.prjDescription": prjDescription } }
    );

    res.status(201).send({ customer });
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

module.exports = router;
