const _ = require("lodash");
const User = require("../../../models/users");
const Project = require("../../../models/projects");
const VendorInvoice = require("../../../models/vendorInvoices");
const send = require("../../../utils/sendEmailNode");
const template = require("../template");
const { NODE_ENV } = process.env;
const signer = require("./signer");

async function notifyNextApprover(data) {
  const invoice = await VendorInvoice.model
    .findOne({
      _id: data._id,
    })
    .populate("vendor")
    .populate("vendorAdmin", { lastName: 1, firstName: 1, email: 1, phone: 1 })
    .populate("revenueAdmin", { lastName: 1, firstName: 1, email: 1, phone: 1 })
    .populate("accountManager", {
      lastName: 1,
      firstName: 1,
      email: 1,
      phone: 1,
    });
  // CHECK IF VENDOR HAS EMAIL, OTHERWISE, RETURN
  if (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice?.vendorAdmin?.email) === false &&
    invoice.status === "approved"
  ) {
    console.log("Cant notify vendor, No email provided for vendor admin");
    return;
  }

  // FETCH USERS TO NOTIFY
  let notifier = null;
  if (invoice.status === "created") {
    notifier = invoice.revenueAdmin;
  } else if (invoice.status === "reviewed") {
    notifier = invoice.accountManager;
  } else if (invoice.status === "approved") {
    notifier = invoice.vendorAdmin;
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
          ? [invoice.revenueAdmin.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | Waiting for review`;
      htmlTable = await signer.revenueAdmin(invoice, user);
      break;
    case "reviewed":
      to =
        NODE_ENV === "production"
          ? [invoice.accountManager.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | Waiting for approval`;
      htmlTable = await signer.accountManager(invoice, user);
      break;
    case "approved":
      to =
        NODE_ENV === "production"
          ? [invoice.vendorAdmin.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | Approved`;
      htmlTable = await signer.vendorAdmin(invoice, user);
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
