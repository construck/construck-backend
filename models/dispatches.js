import * as mongoose from "mongoose";
import ProjectSchema from "./projects";
// import projectSchema from "./projects";

const DispatchSchema = new mongoose.Schema({
    dispatchDescription: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    project: {
        type: ProjectSchema,
    },
    jobType: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        transform: v => (v === "" ? null : v),
        ref: "jobTypes",
    },

    status: {
        type: String,
        default: "on going",
    },
    fromSite: {
        type: String,
    },
    toSite: {
        type: String,
    },
    targetTrips: {
        type: Number,
        default: 1,
    },
    equipments: {
        type: Array,
    },
    shift: {
        type: String,
        required: true,
    },
    drivers: {
        type: Array,
    },
    createdOn: {
        type: mongoose.SchemaTypes.Date,
        default: Date.now(),
    },
});

export default mongoose.model("dispatches", DispatchSchema);
