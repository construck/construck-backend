import * as mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
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
        userType: {
            type: String,
        },
        company: {
            type: mongoose.SchemaTypes.ObjectId,
            transform: v => (v === "" ? null : v),
            ref: "customers",
        },
        assignedProjects: {
            type: [],
        },
        status: {
            type: String,
            default: "inactive",
        },
        createdOn: {
            type: mongoose.SchemaTypes.Date,
            default: Date.now(),
        },
    },

    { timestamps: true }
);

export const User = mongoose.model("users", UserSchema);
export const userSchema = UserSchema;

