const VendorInvoice = require("../../models/vendorInvoices");
const { ACCOUNT_MANAGER } = process.env;

async function generateVendorInvoice(
  id,
  month,
  year,
  amount,
  vendorAdmin,
  revenueAdmin
) {
  // FIND RECENT INVOICE

  const recentInvoice = await VendorInvoice.model
    .findOne({ vendor: id, month, year })
    .sort({ increment: -1 });
  const increment = recentInvoice ? recentInvoice.increment + 1 : 1;

  const Invoice = new VendorInvoice.model({
    vendor: id,
    month,
    year,
    increment,
    amount: parseInt(amount, 10),
    vendorAdmin,
    revenueAdmin,
    accountManager: ACCOUNT_MANAGER,
    reviewedAt: null,
    approvedAt: null,
  });
  const response = await Invoice.save();
  return response;
}

module.exports = { generateVendorInvoice };
