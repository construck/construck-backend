import * as mongoose from "mongoose";
const ActivitySchema = new mongoose.Schema({
  activityDescription: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

export const Activity = mongoose.model("activities", ActivitySchema);
export default ActivitySchema; 
