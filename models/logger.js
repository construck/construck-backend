const mongoose = require("mongoose");
const LoggerSchema = mongoose.Schema(
  {
    method: {
      type: String,
    },
    url: {
      type: String,
    },
    os: {
      type: String,
    },
    browser: {
      type: String,
    },
    version: {
      type: String,
    },
    source: {
      type: String,
    },
    request: {
      type: Object,
    },
    createdOn: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

module.exports = {
  model: mongoose.model("logger", LoggerSchema),
  schema: LoggerSchema,
};
