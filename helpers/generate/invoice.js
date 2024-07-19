const ProjectInvoice = require("./../../models/projectInvoices");

async function generateInvoice(id, month, year, aggregatedRevenue) {
  // Find recent invoice
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
  });
  const response = await Invoice.save();
  return response;
}

module.exports = { generateInvoice };
