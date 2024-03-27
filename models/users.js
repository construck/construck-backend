const mongoose = require("mongoose");
const UserSchema = mongoose.Schema({
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
  userType: {
    type: String,
  },
  company: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "customers",
  },
  assignedProject: {
    type: Object,
  },
  status: {
    type: String,
    default: "inactive",
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("users", UserSchema),
  schema: UserSchema,
};
