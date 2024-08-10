const ProjectInvoice = require("./../../models/projectInvoices");
const User = require("./../../models/users");
const { ACCOUNT_MANAGER } = process.env;

async function generateInvoice(id, month, year, aggregatedRevenue, project) {
  // FIND RECENT INVOICE

  const recentInvoice = await ProjectInvoice.model
    .findOne({ project: id, month, year })
    .sort({ increment: -1 });
  const increment = recentInvoice ? recentInvoice.increment + 1 : 1;

  const Invoice = new ProjectInvoice.model({
    project: id,
    month,
    year,
    increment,
    amount: aggregatedRevenue,
    revenueAdmin: project.projectAdmin || null,
    accountManager: ACCOUNT_MANAGER,
    siteManager: project.siteManager || null,
    projectManager: project.projectManager || project.invoiceAuthorizer || null,
  });
  const response = await Invoice.save();
  return response;
}

module.exports = { generateInvoice };
