const ProjectInvoice = require("../models/projectInvoices");
const Addition = require("../models/additionInvoices");
const { default: mongoose, Types } = require("mongoose");
const moment = require("moment");
const _ = require("lodash");

async function createAddition(req, res) {
  const { id } = req.params;
  const { note, equipment, amount } = req.body;
  try {
    // CHECK IF INVOICE ALREADY EXISTS
    const invoiceExists = await ProjectInvoice.model.findOne({
      _id: id,
    });
    if (_.isEmpty(invoiceExists)) {
      return res
        .status(404)
        .send({ message: "No validated invoice found found" });
    }

    const query = new Addition.model({
      note,
      amount,
      projectInvoice: id,
    });
    const response = await query.save();

    return res.status(201).send({
      message: "Addition is successfully created",
      response,
    });
  } catch (err) {
    console.log(err);
    return res.status(503).send(err);
  }
}
async function removeAddition(req, res) {
  const { id } = req.params;
  try {
    // CHECK IF INVOICE ALREADY EXISTS
    const response = await Addition.model.deleteOne({
      _id: id,
    });

    return res.status(201).send({
      message: "Addition is successfully removed",
      response,
    });
  } catch (err) {
    console.log(err);
    return res.status(503).send(err);
  }
}

module.exports = {
  createAddition,
  removeAddition,
};
