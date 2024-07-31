const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  prjDescription: {
    type: String,
    required: true,
  },
  projectAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  customer: {
    type: String,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "customers",
  },
  siteManager: {
    type: mongoose.Schema.Types.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  invoiceAuthorizer: {
    type: mongoose.Schema.Types.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  startDate: {
    type: Date, 
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    default: "ongoing",
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("projects", ProjectSchema),
  schema: ProjectSchema,
};
