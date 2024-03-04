import * as mongoose from "mongoose";
const LogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
        },
        doneBy: {
            type: mongoose.SchemaTypes.ObjectId,
            transform: v => (v === "" ? null : v),
            ref: "users",
        },
        request: {
            type: Object,
        },
        payload: {
            type: Object,
        },
        createdOn: {
            type: mongoose.SchemaTypes.Date,
            default: Date.now(),
        },
    },
    { timestamps: true }
);

export const Log = mongoose.model("logs", LogSchema);
export default LogSchema;
