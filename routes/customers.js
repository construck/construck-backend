const router = require("express").Router();
const custData = require("../models/customers");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const logData = require("../models/logs");
const workData = require("../models/workData");
const { updateCustomerRecord } = require("./workData");
const { default: mongoose } = require("mongoose");

router.get("/", async (req, res) => {
  await getAllCustomers(res);
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  await getCustomerById(id, res);
});

router.post("/", async (req, res) => {
  let { name, phone, email, tinNumber } = req.body;
  await createCustomer(name, phone, email, tinNumber, res);
});

router.post("/project", async (req, res) => {
  let { id, project } = req.body;
  await createProject(id, project, res);
});

router.put("/:id", async (req, res) => {
  let { id } = req.params;
  let { name, phone, email, tinNumber } = req.body;
  await updateCustomer(id, name, phone, email, tinNumber, res);
});

router.put("/project/:id", async (req, res) => {
  let { id } = req.params;
  let { customerId, prjDescription,projectAdmin } = req.body;

  let updatedProject = false;

  await updateCustomerProject(customerId, id, prjDescription,projectAdmin, res);
});

module.exports = router;

async function getAllCustomers(res) {
  try {
    const customers = await custData.model.find();
    res.status(200).send(customers);
  } catch (err) {
    res.send(err);
  }
}

async function getCustomerById(id, res) {
  try {
    const customer = await custData.model.findById(id);
    res.status(200).send(customer);
  } catch (err) {
    res.send(err);
  }
}

async function createCustomer(name, phone, email, tinNumber, res) {
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
}

async function createProject(id, project, res) {
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
}

async function updateCustomerProject(customerId, id, prjDescription,projectAdmin, res) {
  try {
    let customer = await custData.model.findOneAndUpdate(
      { _id: customerId, "projects._id": id },
      { $set: { "projects.$.prjDescription": prjDescription, "projects.$.projectAdmin": new mongoose.Types.ObjectId(projectAdmin)} },
      {
        new: true,
      }
    );

    await workData.model.updateMany(
      {
        "project._id": id,
      },
      { $set: { "project.prjDescription": prjDescription, "project.projectAdmin": new mongoose.Types.ObjectId(projectAdmin) } }
    );

    res.status(201).send({ customer });
  } catch (err) {
    console.log(err)
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
}

async function updateCustomer(id, name, phone, email, tinNumber, res) {
  try {
    const customer = await custData.model.findByIdAndUpdate(id, {
      name,
      phone,
      email,
      tinNumber,
    });

    await updateCustomerRecord(customer.name,name)

    res.status(200).send(customer);
  } catch (err) {
    res.send(err);
  }
}

