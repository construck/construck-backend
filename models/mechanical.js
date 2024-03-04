import * as mongoose from "mongoose";

const mechanicalSchema = new mongoose.Schema({
    'SERVICE': {
        type: String
    }
})

// const Mechanicals = mongoose.model('Mechanicals', mechanicalSchema);

// exports.Mechanicals = Mechanicals;

export const Mechanicals = mongoose.model("Mechanicals", mechanicalSchema);
export default mechanicalSchema; 