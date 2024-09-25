const mongoose = require("mongoose");
const DeductionInvoiceSchema = mongoose.Schema({
  equipment: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "equipments",
    required: true,
  },
  vendor: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "vendors",
    required: false,
  },
  projectInvoice: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "projectInvoices",
    required: true,
  },
  vendorInvoice: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "vendorInvoices",
    required: false,
  },
  dispatch: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "work",
    required: false,
    unique: true,
    index: { unique: true },
  },
  driver: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
    required: false,
  },
  amount: {
    type: Number,
  },
  year: {
    type: Number,
  },
  month: {
    type: Number,
  },
  type: {
    type: String,
    enum: ["fuel", "damage"],
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("deductionInvoices", DeductionInvoiceSchema),
  schema: DeductionInvoiceSchema,
};
