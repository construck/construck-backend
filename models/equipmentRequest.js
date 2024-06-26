const mongoose = require("mongoose");

const EquipmentRequestSchema = new mongoose.Schema(
  {
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
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    date: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  model: mongoose.model("equipment-requests", EquipmentRequestSchema),
  schema: EquipmentRequestSchema,
};
