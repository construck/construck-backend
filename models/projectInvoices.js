const mongoose = require("mongoose");
const ProjectInvoicesSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "projects",
    },
    date: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
  },
  { timestamp: true }
);

module.exports = {
  model: mongoose.model("projectInvoices", ProjectInvoicesSchema),
  schema: ProjectInvoicesSchema,
};
