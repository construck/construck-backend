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
  status: {
    type: String,
    enum: ["created", "approved"],
    default: "created",
  },
  revenueAdmin: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  revenueAt: {
    type: mongoose.SchemaTypes.Date,
    default: () => {
      const date = new Date();
      date.setUTCHours(date.getUTCHours());
      return date;
    },
  },
  accountManager: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  approvedAt: {
    type: mongoose.SchemaTypes.Date,
    default: () => {
      const date = new Date();
      date.setUTCHours(date.getUTCHours());
      return date;
    },
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
});

module.exports = {
  model: mongoose.model("vendorInvoices", VendorInvoicesSchema),
  schema: VendorInvoicesSchema,
};
