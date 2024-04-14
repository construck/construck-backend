const mongoose = require("mongoose");
const CronjobSchema = mongoose.Schema(
  {
    module: {
      type: String,
    },
    title: {
      type: String,
    },
    time: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
    payload: {
      type: Object,
    },
  },
  { timestamp: true }
);

module.exports = {
  model: mongoose.model("cronjobs", CronjobSchema),
  schema: CronjobSchema,
};
