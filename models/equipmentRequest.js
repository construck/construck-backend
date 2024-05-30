const mongoose = require("mongoose");

const EquipmentRequestSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
  },
  project: {
    type: mongoose.Types.ObjectId,
    ref: "projects",
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  shift: {
    type: String,
  },
  status: {
    type: String,
    default: "pending",
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

module.exports = {
  model: mongoose.model("requests", EquipmentRequestSchema),
  schema: EquipmentRequestSchema,
};
