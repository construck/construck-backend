const mongoose = require("mongoose");
const UserSchema = mongoose.Schema(
  {
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
      type: String,
    },
    assignedProjects: {
      type: [],
    },
    status: {
      type: String,
      default: "inactive",
    },
    createdOn: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
    permissions: {
      type: Object,
    },
    source: {
      type: String,
      default: "web",
    },
  },

  { timestamps: true }
);

module.exports = {
  model: mongoose.model("users", UserSchema),
  schema: UserSchema,
};
