import express from "express";
import { EquipmentType } from "../models/equipmentTypes";
import equipmenTData from "../models/equipments";
import findError from "../utils/errorCodes";
import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const types = await EquipmentType.find().sort("description");
        res.status(200).send(types);
    } catch (err) {
        res.send(err);
    }
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        const type = await EquipmentType.findById(id);
        res.status(200).send(type);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    let { description } = req.body;
    try {
        let typeToCreate = {
            description,
        };
        let typeCreated = await EquipmentType.create(typeToCreate);

        res.status(201).send(typeCreated);
    } catch (err) {
        let error = findError(err.code);
        let keyPattern = err.keyPattern;
        let key = _.findKey(keyPattern, function (key) {
            return key === 1;
        });
        res.send({
            error,
            key,
        });
    }
});

router.put("/updateEqTypes/:name", async (req, res) => {
    let { name } = req.params;

    let updates = await updateEqType(name);

    res.send({ updates });
});

router.put("/bulkUpdateEqTypes", async (req, res) => {
    let eqTypes = await EquipmentType.find();
    let results = eqTypes?.map(async eqType => {
        let name = eqType.description;
        return await updateEqType(name);
    });

    return res.send({ results });
});
export default router;

async function updateEqType(name) {
    let eqType = await EquipmentType.findOne({ description: name });
    let id = eqType?._id;

    let updates = await EquipmentType.updateMany({ eqDescription: name }, { $set: { equipmentType: id } });
    return updates;
}
