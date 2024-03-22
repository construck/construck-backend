const mongoose = require("mongoose");

// "projectId": "643e9312d0a10e189bd603d8",
// "stopped": 0,
// "created": 6,
// "inProgress": 0,
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
        inProgress: {
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

// export const DispatchReport = mongoose.model("dispatchreports", DispatchReportSchema);
// export default DispatchReportSchema;

module.exports = {
    model: mongoose.model("dispatchreports", DispatchReportSchema),
    schema: DispatchReportSchema,
  };
