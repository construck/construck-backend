import * as mongoose from "mongoose";

const ReasonSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    descriptionRw: {
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

export const Reason = mongoose.model("reasons", ReasonSchema);
export const reasonSchema = ReasonSchema;
