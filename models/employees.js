import * as mongoose from "mongoose";
const EmployeeSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    password: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    type: {
        type: String,
    },
    title: {
        type: String,
    },
    status: {
        type: String,
        default: "inactive",
    },
    createdOn: {
        type: mongoose.SchemaTypes.Date,
        default: Date.now(),
    },
    assignedDate: {
        type: Date,
    },
    assignedShift: {
        type: String,
    },
    deviceToken: {
        type: String,
    },
    assignedToSiteWork: { type: Boolean, default: false },
    employmentStatus: {
        type: String,
    },
});

export const Employee = mongoose.model("employees", EmployeeSchema);
export default EmployeeSchema;
