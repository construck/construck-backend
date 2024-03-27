const mongoose = require("mongoose");

const mechanicSchema = new mongoose.Schema({
    '# ': {
        type: String
    },
    " FIRST NAME ": {
        type: String
    },
    " LAST NAME ": {
        type: String
    },
    " TITLE ": {
        type: String
    },
    "CONTACT NUMBER": {
        type: String
    }
})

const Mechanics = mongoose.model('Mechanics', mechanicSchema);

exports.Mechanics = Mechanics;