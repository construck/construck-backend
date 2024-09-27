const mongoose = require("mongoose");
const projectSchema = require("./projects").schema;
const CustomerSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  tinNumber: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  projects: [projectSchema],
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
  vat: {
    type: Boolean,
    default: false,
  },
});

module.exports = {
  model: mongoose.model("customers", CustomerSchema),
  schema: CustomerSchema,
};
