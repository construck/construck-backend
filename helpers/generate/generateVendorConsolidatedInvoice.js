const mongoose = require("mongoose");
const VendorInvoice = require("../../models/vendorInvoices");
const MonthlyVendorInvoice = require("../../models/monthlyVendorInvoices");
const { ACCOUNT_MANAGER, BUSINESS_MANAGER } = process.env;

async function generateVendorConsolidatedInvoice(
  month,
  year,
  amount,
) {
  const recentInvoice = await MonthlyVendorInvoice.model
    .findOne({ month, year })
    .sort({ increment: -1 });
  const increment = recentInvoice ? recentInvoice.increment + 1 : 1;

  const Invoice = new MonthlyVendorInvoice.model({
    month,
    year,
    increment,
    amount: parseInt(amount, 10),
    accountManager: ACCOUNT_MANAGER,
    businessManager: BUSINESS_MANAGER,
    approvedAt: null,
  });
  const response = await Invoice.save();
  return response;
}

module.exports = { generateVendorConsolidatedInvoice };
