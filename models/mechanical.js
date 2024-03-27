const mongoose = require("mongoose");

const mechanicalSchema = new mongoose.Schema({
    'SERVICE': {
        type: String
    }
})

const Mechanicals = mongoose.model('Mechanicals', mechanicalSchema);

exports.Mechanicals = Mechanicals;