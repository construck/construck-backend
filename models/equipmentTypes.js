const mongoose = require("mongoose");
const EquipmentTypeSchema = mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      unique: true,
      dropDups: true,
    },

  },
  { timestamps: true }
);

module.exports = {
  model: mongoose.model("equipmenttypes", EquipmentTypeSchema),
  schema: EquipmentTypeSchema,
};
