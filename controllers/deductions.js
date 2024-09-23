const ProjectInvoice = require("../models/projectInvoices");
const Deduction = require("../models/deductionInvoices");
const { default: mongoose, Types } = require("mongoose");
const moment = require("moment");
const _ = require("lodash");

async function createDeduction(req, res) {
  const { id } = req.params;
  const { type, equipment, amount, dispatch, driver } = req.body;
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

    const query = new Deduction.model({
      type,
      equipment,
      amount,
      projectInvoice: id,
      dispatch,
      driver,
    });
    const response = await query.save();
    console.log("response", response);

    return res.status(201).send({
      message: "Invoice is successfully created",
      response,
    });
  } catch (err) {
    console.log(err);
    return res.status(503).send(err);
  }
}

async function removeDeduction(req, res) {
  const { id } = req.params;
  try {
    // CHECK IF INVOICE ALREADY EXISTS
    const response = await Deduction.model.deleteOne({
      _id: id,
    });

    return res.status(201).send({
      message: "Deduction is successfully removed",
      response,
    });
  } catch (err) {
    console.log(err);
    return res.status(503).send(err);
  }
}

module.exports = {
  createDeduction,
  removeDeduction,
};
