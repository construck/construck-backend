import * as mongoose from "mongoose";
const JobTypeSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    eqType: {
        type: String,
    },
    createdOn: {
        type: mongoose.SchemaTypes.Date,
        default: Date.now(),
    },
});

export const JobType = mongoose.model("jobTypes", JobTypeSchema);
export default JobTypeSchema;
