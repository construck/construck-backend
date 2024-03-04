import express from "express";
import dispatchData from "../models/dispatches";
import findError from "../utils/errorCodes";
import _ from "lodash";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const dispatches = await dispatchData.model.find().populate({
            path: "project",
            populate: {
                path: "customer",
                model: "customers",
            },
        });
        res.status(200).send(dispatches);
    } catch (err) {
        res.send(err);
    }
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        const dispatch = await dispatchData.model.findById(id);
        res.status(200).send(dispatch);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    try {
        let dispatchToCreate = new dispatchData.model(req.body);
        let dispatchCreated = await dispatchToCreate.save();

        res.status(201).send(dispatchCreated);
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

export default router;
