import * as mongoose from "mongoose";

const EquipmentUtilizationSchema = new mongoose.Schema({
    type: {
        type: mongoose.Types.ObjectId,
        ref: "equipmenttypes",
    },
    total: {
        type: Number,
    },
    available: {
        type: Number,
    },
    maintenance: {
        type: Number,
    },
    createdOn: {
        type: mongoose.SchemaTypes.Date,
        default: Date.now(),
    },
});

export const EquipmentUtilization = mongoose.model("equipmentutilizations", EquipmentUtilizationSchema);
export default EquipmentUtilizationSchema;
