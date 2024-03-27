const mongoose = require("mongoose");
const prSchema = require("./projects");

const EquipmentSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  eqDescription: {
    type: String,
  },
  assetClass: {
    type: String,
  },
  eqtype: {
    type: String,
  },
  eqOwner: {
    type: String, // can refer to vendors
  },
  eqStatus: {
    type: String,
  },
  rate: {
    type: Number,
    default: 0,
  },
  supplierRate: {
    type: Number,
    default: 0,
  },
  uom: {
    type: String,
    required: true,
  },
  assignedDate: {
    type: Date,
  },
  assignedEndDate: {
    type: Date,
  },
  assignedShift: {
    type: String,
  },
  millage: {
    type: Number,
  },
  assignedToSiteWork: { type: Boolean, default: false },
  vendor: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "vendors",
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("equipments", EquipmentSchema),
  schema: EquipmentSchema,
};
