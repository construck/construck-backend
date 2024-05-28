const mongoose = require("mongoose");
const moment = require("moment");

const DriverSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    employment: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: moment(),
    },
    updatedAt: {
      type: Date,
      default: moment(),
    },
  },
  { timestamp: true }
);

module.exports = {
  model: mongoose.model("Driver", DriverSchema),
  schema: DriverSchema,
};
