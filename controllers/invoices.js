const ProjectInvoice = require("../models/projectInvoices");

async function fetchInvoices(req, res) {
  try {
    const response = await ProjectInvoice.model
      .find()
      .sort({ _id: -1 })
      .limit(20)
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

module.exports = {
  fetchInvoices,
};
