import mongoose from "mongoose";

import projectSchema from "./projects";

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    tinNumber: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    projects: [projectSchema],
    createdOn: {
        type: mongoose.SchemaTypes.Date,
        default: Date.now(),
    },
});

export const Customer = mongoose.model("customers", CustomerSchema);
export default CustomerSchema; 
