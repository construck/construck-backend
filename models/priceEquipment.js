const mongoose = require("mongoose");

const pricePerEquipmentSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === '' ? null : v),
      ref: 'equipments',
      required: true,
    },
    priceList: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === '' ? null : v),
      ref: 'price_lists',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    createdAt: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

const PriceEquipment = mongoose.model('price_equipments', pricePerEquipmentSchema);

exports.PriceEquipment = PriceEquipment;
