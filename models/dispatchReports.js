const mongoose = require("mongoose");

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
        approved: {
            type: Number,
        },
        rejected: {
            type: Number,
        },
        validated: {
            type: Number,
        },
        released: {
            type: Number,
        },
        date: {
            type: mongoose.SchemaTypes.Date,
        },
    },
    { timestamps: true }
);

module.exports = {
    model: mongoose.model("dispatchreports", DispatchReportSchema),
    schema: DispatchReportSchema,
  };
