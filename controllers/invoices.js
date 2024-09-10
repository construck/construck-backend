const ProjectInvoice = require("../models/projectInvoices");
const Work = require("../models/workData");
const Vendor = require("../models/vendors");
const VendorInvoice = require("../models/vendorInvoices");
const MonthlyVendorInvoice = require("../models/monthlyVendorInvoices");
const { default: mongoose, Types } = require("mongoose");
const moment = require("moment");
const _ = require("lodash");
const { generateVendorInvoice } = require("../helpers/generate/vendorInvoice");
const {
  generateCustomerConsolidatedInvoice,
} = require("../helpers/generate/generateCustomerConsolidatedInvoice");
const {
  generateVendorConsolidatedInvoice,
} = require("../helpers/generate/generateVendorConsolidatedInvoice");
const getInvoicedDispatchesByVendors = require("../helpers/generate/getInvoicedDispatchesByVendors");
const vendorInvoiceHelper = require("../helpers/mailer/vendorInvoice/notifyNextApprover");
const customerInvoiceHelper = require("../helpers/mailer/customerInvoice/notifyNextApprover");
const { revenueAdmin } = require("../helpers/mailer/vendorInvoice/signer");
const Project = require("../models/projects");
const CustomerInvoice = require("../models/customerInvoices");

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
    return res.status(404).send(err);
  }
}
async function vendorInvoicePreview(req, res) {
  const { month, year } = req.query;
  const { vendor } = req.params;
  try {
    const response = await getInvoicedDispatchesByVendors(vendor, year, month);

    return res.status(200).send(response);
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function createVendorInvoice(req, res) {
  const { month, year } = req.query;
  const vendorName = req.params.vendor;
  const { amount, vendorAdmin, revenueAdmin } = req.body;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  try {
    // FIND VENDOR BY NAME
    const vendor = await Vendor.model
      .findOne({
        name: vendorName,
      })
      .populate("revenueAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      });
    if (!vendor) {
      return res.status(404).send({ message: "Vendor not found" });
    }
    //
    // FIND DISPATCHES TO ASSIGN INVOICE TO
    const query = {
      "equipment.eqOwner": vendorName,
      status: "released",
      totalExpenditure: { $gt: 0 },
      siteWork: false,
      workStartDate: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
      vendorInvoice: { $exists: false },
      vendorInvoice: { $eq: "" },
      vendorInvoice: { $eq: null },
    };

    const dispatches = await Work.model.find(query, {
      _id: 1,
      totalExpenditure: 1,
    });

    let dispatchIds = [];
    let totalExpenditure = 0;
    dispatches.map((dispatch) => {
      dispatchIds.push(new mongoose.Types.ObjectId(dispatch._id));
      totalExpenditure += dispatch.totalExpenditure;
    });

    if (_.isEmpty(dispatches)) {
      return res.status(404).send({ message: "No validated dispatched found" });
    }

    // GENERATE INVOICE FOR GIVEN MONTH/YEAR
    const invoice = await generateVendorInvoice(
      vendor._id,
      month,
      year,
      totalExpenditure,
      vendorAdmin,
      vendor?.revenueAdmin?._id || null
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
    console.log(err);
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
async function fetchPreviewInvoicesByCustomer(req, res) {
  const { id } = req.params;
  const { month, year } = req.query;
  try {
    const projects = await Project.model.find(
      {
        client: new mongoose.Types.ObjectId(id),
      },
      {
        _id: 1,
        client: 1,
      }
    );
    // get all projects ids in array
    const projectIds = projects.map((project) => project._id);

    // GET INVOICES BY PROJECTS IDS
    const invoices = await ProjectInvoice.model
      .find({
        project: { $in: projectIds },
        customerInvoice: { $exists: false },
        customerInvoice: { $eq: "" },
        customerInvoice: { $eq: null },
        year,
        month,
      })
      .populate("project", { prjDescription: 1 });

    return res.status(200).send(invoices);
  } catch (err) {
    console.log("err", err);
    return res.status(404).send(err);
  }
}
async function fetchPreviewVendorInvoicesPerPeriod(req, res) {
  const { month, year } = req.query;
  try {
    const invoices = await VendorInvoice.model
      .find({
        month,
        year,
        // status: "approved",
        monthlyInvoiceId: { $exists: false },
        monthlyInvoiceId: { $eq: "" },
        monthlyInvoiceId: { $eq: null },
      })
      .populate("vendor", { name: 1 });
    return res.status(200).send(invoices);
  } catch (err) {
    console.log("err", err);
    return res.status(404).send(err);
  }
}
async function createConsolidatedInvoice(req, res) {
  const { id } = req.params;
  const { month, year, amount, invoices } = req.body;
  try {
    const projects = await Project.model.find(
      {
        client: new mongoose.Types.ObjectId(id),
      },
      {
        _id: 1,
        client: 1,
      }
    );

    // CREATE CONSOLIDATED INVOICE/CUSTOMER/MONTH/YEAR
    const invoice = await generateCustomerConsolidatedInvoice(
      id,
      month,
      year,
      amount,
      invoices
    );

    let ids = [];
    // LOOP AND CREATE ARRAY OF INVOICE IDS WITH MOONGOSE OBJECT ID
    invoices.forEach((invoice) => {
      ids.push(new mongoose.Types.ObjectId(invoice));
    });

    //  UPDATE PROJECT INVOICE OF THE CLIENT
    await ProjectInvoice.model.updateMany(
      {
        _id: { $in: ids },
      },
      {
        customerInvoice: invoice._id,
      }
    );

    await customerInvoiceHelper.notifyNextApprover(invoice);

    return res.status(200).send(invoice);
  } catch (err) {
    return res.status(404).send(err);
  }
}
async function createConsolidatedVendorInvoice(req, res) {
  const { month, year, amount, invoices } = req.body;
  try {
    // CREATE CONSOLIDATED INVOICE/CUSTOMER/MONTH/YEAR
    const invoice = await generateVendorConsolidatedInvoice(
      month,
      year,
      amount
    );

    console.log("@@@invoice", invoice);

    let ids = [];
    // LOOP AND CREATE ARRAY OF INVOICE IDS WITH MOONGOSE OBJECT ID
    invoices.forEach((invoice) => {
      ids.push(new mongoose.Types.ObjectId(invoice));
    });

    //  UPDATE PROJECT INVOICE OF THE CLIENT
    await VendorInvoice.model.updateMany(
      {
        _id: { $in: ids },
      },
      {
        monthlyInvoiceId: invoice._id,
      }
    );

    await customerInvoiceHelper.notifyNextApprover(invoice);

    return res.status(200).send(invoice);
  } catch (err) {
    console.log("err", err);
    return res.status(404).send(err);
  }
}

async function fetchCustomerInvoices(req, res) {
  try {
    const response = await CustomerInvoice.model
      .find()
      .sort({ _id: -1 })
      .populate("customer", { _id: 1, name: 1 })
      .populate("accountManager", {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
      })
      .populate("reviewer", { _id: 1, firstName: 1, lastName: 1, email: 1 });
    return res.status(200).send(response);
  } catch (err) {
    return res.status(404).send(err);
  }
}
async function fetchVendorSummaryInvoices(req, res) {
  console.log("@@fetchVendorSummaryInvoices");
  try {
    const response = await MonthlyVendorInvoice.model
      .find()
      .sort({ _id: -1 })
      .populate("businessManager", { _id: 1, lastName: 1, firstName: 1 })
      .populate("accountManager", {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
      });
    console.log("fetchVendorSummaryInvoices", response);
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
      .populate("revenueAdmin", {
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
    const pipeline = [
      {
        $match: {
          vendorInvoice: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $addFields: {
          amount: "$totalExpenditure",
        },
      },
      {
        $group: {
          _id: "$equipment.plateNumber",
          amount: {
            $sum: "$amount",
          },
          duration: {
            $sum: "$duration",
          },
          equipment: {
            $first: "$equipment",
          },
          project: {
            $first: "$project",
          },
          workStartDate: {
            $first: "$workStartDate",
          },
          siteWork: {
            $first: "$siteWork",
          },
        },
      },
      {
        $project: {
          _id: 1,
          "equipment.eqDescription": 1,
          "equipment.plateNumber": 1,
          "equipment.uom": 1,
          "equipment.supplierRate": 1,
          "dispatch.date": 1,
          "dispatch.shift": 1,
          project: 1,
          duration: 1,
          status: 1,
          date: 1,
          totalExpenditure: 1,
          siteWork: 1,
          workStartDate: 1,
          amount: 1,
          siteWork: 1,
        },
      },
    ];
    const response = await Work.model.aggregate(pipeline);
    return res.status(200).send({ meta: vendorInvoice, response });
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function signVendorInvoice(req, res) {
  const { id } = req.params;
  const { signer, type } = req.body;

  let data = {};
  if (type === "reviewer") {
    data = {
      revenueAdmin: signer,
      reviewedAt: new Date(),
      status: "reviewed",
    };
  } else if (type === "approver") {
    data = {
      accountManager: signer,
      approvedAt: new Date(),
      status: "approved",
    };
  } else {
    return res.status(400).send({
      message: "Signer is invalid or not authorized",
    });
  }
  try {
    const invoice = await VendorInvoice.model.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
      },
      {
        $set: data,
      },
      { new: true }
    );
    await vendorInvoiceHelper.notifyNextApprover(invoice);
    return res.status(200).send({
      message: "Signed",
      invoice,
    });
  } catch (err) {
    console.log("err", err);
    return res.status(500).send(err);
  }
}

async function fetchInvoiceDetailsPerCustomer(req, res) {
  const { id } = req.params;
  try {
    const customerInvoice = await CustomerInvoice.model
      .findById(id)
      .populate("customer", { name: 1 })
      .populate("reviewer", {
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
      })
      .populate("reviewer", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      });
    const projectInvoices = await ProjectInvoice.model
      .find({
        customerInvoice: id,
      })
      .populate("project", {
        prjDescription: 1,
      });
    return res
      .status(200)
      .send({ meta: customerInvoice, response: projectInvoices });
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function signCustomerInvoice(req, res) {
  const { id } = req.params;
  const { signer, type } = req.body;

  let data = {};
  if (type === "reviewer") {
    data = {
      reviewer: new mongoose.Types.ObjectId(signer),
      reviewedAt: new Date(),
      status: "reviewed",
    };
  } else {
    return res.status(400).send({
      message: "Signer is invalid or not authorized",
    });
  }
  try {
    const invoice = await CustomerInvoice.model
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
        },
        {
          $set: data,
        },
        { new: true }
      )
      .populate("customer", {
        name: 1,
      });
    await customerInvoiceHelper.notifyNextApprover(invoice);
    return res.status(200).send({
      message: "Signed",
      invoice,
    });
  } catch (err) {
    console.log("err", err);
    return res.status(500).send(err);
  }
}

async function fetchVendorSummaryInvoiceDetails(req, res) {
  const { id } = req.params;
  try {
    const summary = await MonthlyVendorInvoice.model
      .findById(id)
      .populate("businessManager", {
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
    const response = await VendorInvoice.model
      .find({
        monthlyInvoiceId: new mongoose.Types.ObjectId(id),
      })
      .populate("vendor");
    return res.status(200).send({
      meta: summary,
      response,
    });
  } catch (err) {
    console.log("error", err);
    return res.status(404).send(err);
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
  fetchPreviewInvoicesByCustomer,
  createConsolidatedInvoice,
  fetchCustomerInvoices,
  fetchInvoiceDetailsPerCustomer,
  signCustomerInvoice,
  fetchPreviewVendorInvoicesPerPeriod,
  createConsolidatedVendorInvoice,
  fetchVendorSummaryInvoices,
  fetchVendorSummaryInvoiceDetails,
};
