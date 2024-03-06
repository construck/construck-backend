import * as mongoose from "mongoose";

// "projectId": "643e9312d0a10e189bd603d8",
// "stopped": 0,
// "created": 6,
// "inProgres": 0,
// "recalled": 0

const DispatchReportSchema = new mongoose.Schema(
    {
        project: {
            type: String,
        },
        projectId: {
            type: String,
        },
        stopped: {
            type: Number,
        },
        created: {
            type: Number,
        },
        inProgres: {
            type: Number,
        },
        recalled: {
            type: Number,
        },
        date: {
            type: mongoose.SchemaTypes.Date,
        },
    },
    { timestamps: true }
);

export const DispatchReport = mongoose.model("dispatchreports", DispatchReportSchema);
export default DispatchReportSchema;
