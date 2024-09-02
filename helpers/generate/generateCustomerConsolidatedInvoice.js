const mongoose = require("mongoose");
const VendorInvoice = require("../../models/vendorInvoices");
const CustomerInvoices = require("../../models/customerInvoices");
const { ACCOUNT_MANAGER, BUSINESS_MANAGER } = process.env;

async function generateCustomerConsolidatedInvoice(
  customer,
  month,
  year,
  amount,
  invoices
) {
  console.log("id", customer);
  // FIND RECENT INVOICE

  const recentInvoice = await CustomerInvoices.model
    .findOne({ customer, month, year })
    .sort({ increment: -1 });
  const increment = recentInvoice ? recentInvoice.increment + 1 : 1;

  const Invoice = new CustomerInvoices.model({
    customer: new mongoose.Types.ObjectId(customer),
    month,
    year,
    increment,
    amount: parseInt(amount, 10),
    accountManager: ACCOUNT_MANAGER,
    reviewer: BUSINESS_MANAGER,
    reviewedAt: null,
    approvedAt: null,
  });
  const response = await Invoice.save();
  return response;
}

module.exports = { generateCustomerConsolidatedInvoice };
