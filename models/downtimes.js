import * as mongoose from "mongoose";
const DowntimeSchema = new mongoose.Schema({
    date: {
        type: mongoose.SchemaTypes.Date,
    },
    dateToWorkshop: {
        type: mongoose.SchemaTypes.Date,
    },
    dateFromWorkshop: {
        type: mongoose.SchemaTypes.Date,
    },
    durationInWorkshop: {
        type: Number,
        default: 0,
    },
    equipment: {
        type: mongoose.SchemaTypes.ObjectId,
        transform: v => (v === "" ? null : v),
        ref: "equipments",
    },
});

export const Downtime = mongoose.model("downtimes", DowntimeSchema);
export default DowntimeSchema;
