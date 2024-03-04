import * as mongoose from "mongoose";

const WorkReportSchema = new mongoose.Schema({
    work: {
        type: mongoose.Types.ObjectId,
        ref: "works",
    },
    total: {
        type: Number,
    },
    created: {
        type: Number,
    },
    stopped: {
        type: Number,
    },
    recalled: {
        type: Number,
    },
    createdOn: {
        type: mongoose.SchemaTypes.Date,
        default: Date.now(),
    },
});

export const DispatchReport = mongoose.model("workreports", WorkReportSchema);
export default WorkReportSchema;
