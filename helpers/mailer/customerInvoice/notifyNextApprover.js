const _ = require("lodash");
const User = require("../../../models/users");
const Project = require("../../../models/projects");
const VendorInvoice = require("../../../models/vendorInvoices");
const CustomerInvoice = require("../../../models/customerInvoices");
const send = require("../../../utils/sendEmailNode");
const template = require("../template");
const { NODE_ENV } = process.env;
const signer = require("./signer");

async function notifyNextApprover(data) {
  const invoice = await CustomerInvoice.model
    .findOne({
      _id: data._id,
    })
    .populate("customer")
    .populate("reviewer", { lastName: 1, firstName: 1, email: 1, phone: 1 })
    .populate("accountManager", {
      lastName: 1,
      firstName: 1,
      email: 1,
      phone: 1,
    });

  // FETCH USERS TO NOTIFY
  let notifier = null;
  if (invoice.status === "created") {
    notifier = invoice.reviewer;
  } else if (invoice.status === "reviewed") {
    notifier = invoice.accountManager;
  } else {
    return;
  }

  const user = await User.model.findOne(
    {
      _id: notifier,
    },
    {
      firstName: 1,
      lastName: 1,
      email: 1,
      userType: 1,
      phone: 1,
    }
  );

  let to = [];
  let title = "";

  let htmlTable = "";

  switch (invoice.status) {
    case "created":
      to =
        NODE_ENV === "production"
          ? [invoice.reviewer.email]
          : ["gkagarama@construck.rw"];
      title = `Consolidated Invoice for ${invoice.customer.name} - ${invoice.year}-${invoice.month}-${invoice.increment} | Waiting for review`;
      htmlTable = await signer.reviewer(invoice, user);
      break;
    case "reviewed":
      to =
        NODE_ENV === "production"
          ? [invoice.accountManager.email]
          : ["gkagarama@construck.rw"];
      title = `Consolidated Invoice for ${invoice.customer.name} - ${invoice.year}-${invoice.month}-${invoice.increment} | Waiting for approval`;
      htmlTable = await signer.accountManager(invoice, user);
      break;
    default:
      break;
  }

  send(
    "appinfo@construck.rw",
    to,
    title,
    title,
    await template.layout(htmlTable)
  )
    .then(() => console.log("Sent"))
    .catch((err) => {
      return err;
    });
  return;
}

module.exports = {
  notifyNextApprover,
};
