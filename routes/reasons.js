import express from "express";
import { Reason } from "../models/reasons";
import findError from "../utils/errorCodes";
import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const reasons = await Reason.find();
        res.status(200).send(reasons);
    } catch (err) {}
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        const reason = await Reason.findById(id);
        res.status(200).send(reason);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    let { description, descriptionRw } = req.body;
    try {
        const reasonCreated = await Reason.create({
            description,
            descriptionRw,
        });
        res.status(201).send(reasonCreated);
    } catch (err) {
        let error = findError(err.code);
        let keyPattern = err.keyPattern;
        let key = _.findKey(keyPattern, function (key) {
            return key === 1;
        });
        return res.send({
            error,
            key,
        });
    }
});

export default router;
