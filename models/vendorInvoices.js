const mongoose = require("mongoose");
const moment = require("moment");
const VendorInvoicesSchema = mongoose.Schema({
  vendor: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "vendors",
    required: true,
  },
  date: {
    type: mongoose.SchemaTypes.Date,
    default: () => {
      const date = new Date();
      date.setUTCHours(date.getUTCHours());
      return date;
    },
  },
  increment: {
    type: Number,
    default: 1,
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
  },
  totalRevenue: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["created", "reviewed", "approved"],
    default: "created",
  },
  revenueAdmin: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  reviewedAt: {
    type: mongoose.SchemaTypes.Date,
    default: null,
  },
  accountManager: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  approvedAt: {
    type: mongoose.SchemaTypes.Date,
    default: null,
  },
  vendorAdmin: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
  monthlyInvoiceId: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "monthlyVendorInvoices",
  },
});

module.exports = {
  model: mongoose.model("vendorInvoices", VendorInvoicesSchema),
  schema: VendorInvoicesSchema,
};
