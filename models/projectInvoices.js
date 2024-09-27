const mongoose = require("mongoose");
const moment = require("moment");
const ProjectInvoicesSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "projects",
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
    revenueAdmin: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    accountManager: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    reviewedAt: {
      type: mongoose.SchemaTypes.Date,
      default: null,
    },
    siteManager: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    approvedAt: {
      type: mongoose.SchemaTypes.Date,
      default: null,
    },
    projectManager: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    authorizedAt: {
      type: mongoose.SchemaTypes.Date,
      default: null,
    },
    createdAt: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
    customerInvoice: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "customerInvoices",
      required: false,
    },
    vat: {
      type: Boolean,
      default: false,
    },
  }
  // { timestamp: true }
);

module.exports = {
  model: mongoose.model("projectInvoices", ProjectInvoicesSchema),
  schema: ProjectInvoicesSchema,
};
