import * as mongoose from "mongoose";
const AssetAvbltySchema = new mongoose.Schema({
  date: {
    type: mongoose.SchemaTypes.Date,
  },
  available: {
    type: Number,
  },
  unavailable: {
    type: Number,
  },
  dispatched: {
    type: Number,
  },
  standby: {
    type: Number,
  },
});

export const Asset = mongoose.model("asset_availalabilities", AssetAvbltySchema);
export default AssetAvbltySchema; 
