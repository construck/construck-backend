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
      // required: true,
      sparse: true,
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
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "customers",
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "vendors",
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
    accountType: {
      type: Object,
      default: "internal",
    },
    source: {
      type: String,
      default: "web",
    },
    setpassword: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

module.exports = {
  model: mongoose.model("users", UserSchema),
  schema: UserSchema,
};
