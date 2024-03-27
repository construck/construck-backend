const mongoose = require("mongoose");
const LogSchema = mongoose.Schema({
  action: {
    type: String,
  },
  doneBy: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  request: {
    type: Object,
  },
  payload: {
    type: Object,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("logs", LogSchema),
  schema: LogSchema,
};
