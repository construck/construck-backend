const mongoose = require("mongoose");
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
      default: Date.now(),
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
  },
  { timestamp: true }
);

module.exports = {
  model: mongoose.model("projectInvoices", ProjectInvoicesSchema),
  schema: ProjectInvoicesSchema,
};
