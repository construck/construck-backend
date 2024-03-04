import * as mongoose from "mongoose";

const mechanicSchema = new mongoose.Schema({
    "# ": {
        type: String,
    },
    " FIRST NAME ": {
        type: String,
    },
    " LAST NAME ": {
        type: String,
    },
    " TITLE ": {
        type: String,
    },
    "CONTACT NUMBER": {
        type: String,
    },
});


export const Mechanics = mongoose.model("Mechanics", mechanicSchema);
export default mechanicSchema;
