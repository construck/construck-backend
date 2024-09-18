const mongoose = require("mongoose");
const AdditionInvoiceSchema = mongoose.Schema({
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
  note: {
    type: String,
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("additionInvoices", AdditionInvoiceSchema),
  schema: AdditionInvoiceSchema,
};
