const mongoose = require("mongoose");

const workshopCardSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_testing", "on_hold", "closed"],
      default: "open",
    },
    equipment: {
      type: mongoose.Types.ObjectId,
      ref: "equipments",
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    authorizedBy: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    testedBy: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    garage: {
      type: mongoose.Types.ObjectId,
      ref: "workshop_garages",
      required: true,
    },
    ref: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v >= 24 && v <= 100;
        },
        message: "Year must be between 2024 and 2100",
      },
    },
    month: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v >= 1 && v <= 12;
        },
        message: "Month must be between 1 and 12",
      },
    },
    entryDate: {
      type: Date,
      required: true,
    },
    exitDate: {
      type: mongoose.SchemaTypes.Date,
    },
    approvedBy: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: false,
      default: null,
    },
    approvedAt: {
      type: mongoose.SchemaTypes.Date,
      default: null,
    },
    gatePass: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  model: mongoose.model("workshop_cards", workshopCardSchema),
  schema: workshopCardSchema,
};
