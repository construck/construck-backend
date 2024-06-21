const mongoose = require("mongoose");
const PasswordResetSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: null,
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
  },

  { timestamps: true }
);

module.exports = {
  model: mongoose.model("passwordReset", PasswordResetSchema),
  schema: PasswordResetSchema,
};
