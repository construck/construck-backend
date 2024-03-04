import express from "express";
import { Activity } from "../models/activities";
import findError from "../utils/errorCodes";
import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const activities = await Activity.find();
        res.status(200).send(activities);
    } catch (err) {
        res.send(err);
    }
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        const activity = await Activity.findById(id);
        res.status(200).send(activity);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    let { activityDescription } = req.body;
    try {
        let activityToCreate = {
            activityDescription,
        };
        let activityCreated = await Activity.create(activityToCreate);

        return res.status(201).send(activityCreated);
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
