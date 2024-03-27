const mongoose = require("mongoose");
const prSchema = require("./projects");

const EquipmentRequestSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
  },
  project: String,
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
  tripFrom:{
    type: String
  },
  tripTo:{
    type: String
  },
  quantity: {
    type: Number,
  },
  approvedQuantity: {
    type: Number,
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
