const mongoose = require("mongoose");

const EquipmentUtilizationSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Types.ObjectId,
      ref: "equipments",
    },
    type: {
      type: String,
    },
    plateNumber: {
      type: String,
    },
    assetClass: {
      type: String,
    },
    equipmentCategory: {
      type: String,
    },
    owner: {
      type: String,
      default: "Construck",
    },
    status: {
      type: String,
      enum: ["Open", "Workshop", "Disposed"],
      default: "Open",
    },
    date: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = {
  model: mongoose.model("equipmentutilizations", EquipmentUtilizationSchema),
  schema: EquipmentUtilizationSchema,
};
