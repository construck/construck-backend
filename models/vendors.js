import * as mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  phone: {
    type: String,
  },
  mobile: {
    type: String,
  },
  password: {
    type: String,
  },
  tinNumber: {
    type: String,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

export const Vendor = mongoose.model("vendors", VendorSchema);
export default VendorSchema; 