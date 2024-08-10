const _ = require("lodash");
const User = require("../../../models/users");
const Project = require("../../../models/projects");
const ProjectInvoice = require("../../../models/projectInvoices");
const send = require("../../../utils/sendEmailNode");
const template = require("../template");
const { NODE_ENV } = process.env;
const signer = require("./signer");

async function notifyNextApprover(data) {
  const invoice = await ProjectInvoice.model
    .findOne({
      _id: data._id,
    })
    .populate("revenueAdmin", { lastName: 1, firstName: 1, email: 1, phone: 1 })
    .populate("accountManager", {
      lastName: 1,
      firstName: 1,
      email: 1,
      phone: 1,
    })
    .populate("siteManager", { lastName: 1, firstName: 1, email: 1, phone: 1 })
    .populate("projectManager", {
      lastName: 1,
      firstName: 1,
      email: 1,
      phone: 1,
    });

  // FETCH USERS TO NOTIFY
  let notifier = null;
  if (invoice.status === "created") {
    notifier = invoice.accountManager;
  } else if (invoice.status === "reviewed") {
    notifier = invoice.siteManager;
  } else if (invoice.status === "approved") {
    notifier = invoice.projectManager;
  } else if (invoice.status === "authorized") {
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

  // FIND PROJECT
  const project = await Project.model
    .findOne(
      {
        _id: invoice.project,
      },
      {
        prjDescription: 1,
        client: 1,
      }
    )
    .populate("client", { name: 1 });


  let to = [];
  let title = "";

  let htmlTable = "";

  switch (invoice.status) {
    case "created":
      to =
        NODE_ENV === "production"
          ? ["gkagarama@construck.rw"] //[invoice.accountManager.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | ${project.prjDescription} | Waiting for review`;
      htmlTable = await signer.accountManager(invoice, project, user);
      break;
    case "reviewed":
      to =
        NODE_ENV === "production"
          ? ["gkagarama@construck.rw"] //[invoice.siteManager.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | ${project.prjDescription} | Waiting for approval`;
      htmlTable = await signer.siteManager(invoice, project, user);
      break;
    case "approved":
      to =
        NODE_ENV === "production"
          ? ["gkagarama@construck.rw"] //[invoice.projectManager.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | ${project.prjDescription} | Waiting for authorization`;
      htmlTable = await signer.projectManager(invoice, project, user);
      break;
    case "authorized":
      to =
        NODE_ENV === "production"
          ? ["gkagarama@construck.rw"] //[invoice.accountManager.email, invoice.revenueAdmin.email]
          : ["gkagarama@construck.rw"];
      title = `Invoice ${invoice.year}-${invoice.month}-${invoice.increment} | ${project.prjDescription} | Authorized`;
      htmlTable = await signer.projectAdmin(invoice, project, user);
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
