import * as mongoose from "mongoose";

const EquipmentTypeSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            unique: true,
            dropDups: true,
        },
    },
    { timestamps: true }
);

export const EquipmentType = mongoose.model("equipmenttypes", EquipmentTypeSchema);
export default EquipmentTypeSchema;
