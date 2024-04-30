const mongoose = require("mongoose");
const EmployeeSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  type: {
    type: String,
  },
  title: {
    type: String,
  },
  status: {
    type: String,
    default: "inactive",
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
  assignedDate: {
    type: Date,
  },
  assignedShift: {
    type: String,
  },
  deviceToken:{
    type: String,
  },
  assignedToSiteWork: { type: Boolean, default: false },
  employmentStatus:{
    type: String
  },
  source:{
    type: String,
    default: "web",
  },
});

module.exports = {
  model: mongoose.model("employees", EmployeeSchema),
  schema: EmployeeSchema,
};
