const mongoose = require("mongoose");
const MonthlyVendorInvoicesSchema = mongoose.Schema({
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
  expenditureRevenue: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["created", "approved"],
    default: "created",
  },
  accountManager: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  businessManager: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  approvedAt: {
    type: mongoose.SchemaTypes.Date,
    default: null,
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("monthlyVendorInvoices", MonthlyVendorInvoicesSchema),
  schema: MonthlyVendorInvoicesSchema,
};
