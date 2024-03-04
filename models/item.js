import * as mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    "#": {
        type: String,
    },
    "ITEM & PART": {
        type: String,
    },
    UOM: {
        type: String,
    },
    "ITEM CATEGORY": {
        type: String,
    },
});

// const Items = mongoose.model('Items', itemSchema);

// export default Items;

export const Items = mongoose.model("Items", itemSchema);
export default itemSchema;
