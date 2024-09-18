const mongoose = require("mongoose");
const DeductionInvoiceSchema = mongoose.Schema({
  equipment: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "equipments",
    required: true,
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
  amount: {
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
