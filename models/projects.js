import * as mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  prjDescription: {
    type: String,
    required: true,
  },
  projectAdmin: {
    type: mongoose.SchemaTypes.ObjectId,
  },
  customer: {
    type: String,
  },
  startDate: {
    type: Date, // can refer to vendors
  },
  endDate: {
    type: Date, // can refer to vendors
  },
  status: {
    type: String,
    default: "ongoing",
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

export const Project = mongoose.model("projects", ProjectSchema);
export default ProjectSchema; 
