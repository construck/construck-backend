const mongoose = require("mongoose");

const UserRolesSchema = new mongoose.Schema(
  {
    accountType: {
      type: 'String',
      required: true,
    },
    type: {
      type: 'String',
      required: true,
    },
    department: {
      type: 'String',
      required: true,
    },
    role: {
      type: 'String',
      required: true,
    },
  },
  { timestamps: true },
)
module.exports = {
  model: mongoose.model("userRoles", UserRolesSchema),
  schema: UserRolesSchema,
};

