const mongoose = require("mongoose");
const CronjobSchema = mongoose.Schema({
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
});

module.exports = {
  model: mongoose.model("cronjobs", CronjobSchema),
  schema: CronjobSchema,
};
