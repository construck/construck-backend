const mongoose = require("mongoose");

const EquipmentRequestDetailsSchema = new mongoose.Schema({
  request: {
    type: mongoose.Types.ObjectId,
    ref: "requests",
  },
  equipmentType: {
    type: mongoose.Types.ObjectId,
    ref: "equipmenttypes",
  },
  workToBeDone: {
    type: mongoose.Types.ObjectId,
    ref: "jobTypes",
    required: true,
  },
  tripsToBeMade: {
    type: Number,
  },
  tripFrom: {
    type: String,
  },
  tripTo: {
    type: String,
  },
  quantity: {
    type: Number,
  },
  approvedQuantity: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: "pending",
  },
});

module.exports = {
  model: mongoose.model(
    "equip-requests-details",
    EquipmentRequestDetailsSchema
  ),
  schema: EquipmentRequestDetailsSchema,
};
