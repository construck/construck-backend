const ProjectInvoice = require("../models/projectInvoices");
const Work = require("../models/workData");
const Vendor = require("../models/vendors");
const VendorInvoice = require("../models/vendorInvoices");
const { default: mongoose, Types } = require("mongoose");
const moment = require("moment");
const _ = require("lodash");
const { generateVendorInvoice } = require("../helpers/generate/vendorInvoice");
const vendorInvoiceHelper = require("../helpers/mailer/vendorInvoice/notifyNextApprover");

async function fetchInvoices(req, res) {
  try {
    const response = await ProjectInvoice.model
      .find()
      .sort({ _id: -1 })
      .populate("project", { _id: 1, prjDescription: 1 })
      .populate("revenueAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("accountManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("siteManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("projectManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      });
    return res.status(200).send(response);
  } catch (err) {
    return res.status(404).send(err);
  }
}
async function fetchAllVendorInvoices(req, res) {
  try {
    const response = await VendorInvoice.model
      .find()
      .sort({ _id: -1 })
      .populate("vendor")
      .populate("vendorAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("accountManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      });
    return res.status(200).send(response);
  } catch (err) {
    console.log("err", err);
    return res.status(404).send(err);
  }
}
async function vendorInvoicePreview(req, res) {
  const { month, year } = req.query;
  const { vendor } = req.params;
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  try {
    const response = await Work.model.find({
      workStartDate: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
      totalRevenue: { $gt: 0 },
      status: "released",
      "equipment.eqOwner": vendor,
      invoice: { $exists: true },
      vendorInvoice: { $exists: false },
      vendorInvoice: { $eq: "" },
      vendorInvoice: { $eq: null },
    });
    return res.status(200).send(response);
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function createVendorInvoice(req, res) {
  const { month, year } = req.query;
  const vendorName = req.params.vendor;
  const { dispatches, amount, vendorAdmin } = req.body;
  try {
    // FIND VENDOR BY NAME
    const vendor = await Vendor.model.findOne({
      name: vendorName,
    });
    if (!vendor) {
      return res.status(404).send({ message: "Vendor not found" });
    }
    let dispatchIds = [];
    let aggregatedRevenue = 0;
    dispatches.map((dispatch) => {
      dispatchIds.push(new mongoose.Types.ObjectId(dispatch));
    });

    if (_.isEmpty(dispatches)) {
      return res.status(404).send({ message: "No validated dispatched found" });
    }

    // GENERATE INVOICE FOR GIVEN MONTH/YEAR
    const invoice = await generateVendorInvoice(
      vendor._id,
      month,
      year,
      amount,
      vendorAdmin
    );

    // UPDATE STATUS AND INVOICE ID OF ALL WORKS WITH VALIDATED STATUS
    const updatedDispatches = await Work.model.updateMany(
      {
        _id: { $in: dispatchIds },
      },
      {
        vendorInvoice: invoice._id,
      }
    );
    await vendorInvoiceHelper.notifyNextApprover(invoice);
    return res.status(201).send({
      message: "Invoice is successfully created",
    });
  } catch (err) {
    return res.status(503).send(err);
  }
}

async function fetchVendorInvoices(req, res) {
  const { id } = req.params;
  try {
    const response = await VendorInvoice.model
      .find({
        vendor: new mongoose.Types.ObjectId(id),
      })
      .sort({ _id: -1 })
      .populate("vendor")
      .populate("vendorAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("accountManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      });
    return res.status(200).send(response);
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function fetchInvoiceDetailsPerVendor(req, res) {
  const { id } = req.params;
  try {
    const vendorInvoice = await VendorInvoice.model
      .findById(id)
      .populate("vendor", { name: 1, phone: 1, email: 1 })
      .populate("vendorAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      })
      .populate("accountManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      });
    const response = await Work.model.find({
      vendorInvoice: new mongoose.Types.ObjectId(id),
    });
    return res.status(200).send({ meta: vendorInvoice, response });
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function signVendorInvoice(req, res) {
  const { id } = req.params;
  const { signer } = req.body;
  try {
    const invoice = await VendorInvoice.model.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
      },
      {
        $set: {
          accountManager: signer,
          approvedAt: new Date(),
          status: "approved",
        },
      },
      { new: true }
    );
    await vendorInvoiceHelper.notifyNextApprover(invoice);
    return res.status(200).send({
      message: "Signed",
      invoice,
    });
  } catch (err) {
    console.log("error", err);
    return res.status(500).send(err);
  }
}

module.exports = {
  fetchInvoices,
  vendorInvoicePreview,
  createVendorInvoice,
  fetchVendorInvoices,
  fetchInvoiceDetailsPerVendor,
  fetchAllVendorInvoices,
  signVendorInvoice,
};
