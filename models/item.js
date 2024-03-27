const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    '#': {
        type: String
    },
    "ITEM & PART": {
        type: String
    },
    "UOM": {
        type: String
    },
    "ITEM CATEGORY": {
        type: String
    }
})

const Items = mongoose.model('Items', itemSchema);

exports.Items = Items;