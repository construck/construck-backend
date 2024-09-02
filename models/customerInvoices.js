const mongoose = require("mongoose");
const moment = require("moment");
const CustomerInvoicesSchema = mongoose.Schema({
  customer: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "customers",
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
    enum: ["created", "reviewed", "approved", "authorized"],
    default: "created",
  },
  accountManager: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  reviewer: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  reviewedAt: {
    type: mongoose.SchemaTypes.Date,
    default: null,
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("customerInvoices", CustomerInvoicesSchema),
  schema: CustomerInvoicesSchema,
};
