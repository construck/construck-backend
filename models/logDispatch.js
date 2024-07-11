const mongoose = require("mongoose");
const LogDispatchSchema = mongoose.Schema(
  {
    request: {
      type: Object,
    },
    action: {
      type: String,
    },
    status: {
      type: String,
    },
    createdOn: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

module.exports = {
  model: mongoose.model("LogDispatch", LogDispatchSchema),
  schema: LogDispatchSchema,
};
