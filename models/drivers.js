const mongoose = require("mongoose");
const DriverSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    // user: {
    //   type: mongoose.SchemaTypes.ObjectId,
    //   transform: (v) => (v === "" ? null : v),
    //   ref: "users",
    // },
    employment: {
      type: String,
    },
    
  },
  { timestamp: true }
);

module.exports = {
  model: mongoose.model("Driver", DriverSchema),
  schema: DriverSchema,
};
