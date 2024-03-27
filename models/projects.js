const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  prjDescription: {
    type: String,
    required: true,
  },
  customer: {
    type: String,
  },
  startDate: {
    type: Date, // can refer to vendors
  },
  endDate: {
    type: Date, // can refer to vendors
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
