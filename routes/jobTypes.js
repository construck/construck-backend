import express from "express";
import jobTypeData from "../models/jobTypes";
import findError from "../utils/errorCodes";
import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const jobTypes = await jobTypeData.model.find();
        res.status(200).send(jobTypes);
    } catch (err) {
        res.send(err);
    }
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        const jobType = await jobTypeData.model.findById(id);
        res.status(200).send(jobType);
    } catch (err) {
        res.send(err);
    }
});

router.get("/eqType/:eqType", async (req, res) => {
    let { eqType } = req.params;
    try {
        const jobType = await jobTypeData.model.find({ eqType });
        res.status(200).send(jobType);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    try {
        let jobTypeToCreate = new jobTypeData.model(req.body);
        let jobTypeCreated = await jobTypeToCreate.save();

        res.status(201).send(jobTypeCreated);
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
