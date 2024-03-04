import express from "express";
import { Vendor } from "../models/vendors";
import findError from "../utils/errorCodes";
import bcrypt from "bcryptjs";
import { Work } from "../models/works";
import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.status(200).send(vendors);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    try {
        let vendorToCreate = req.body;
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        vendorToCreate.password = hashedPassword;
        let vendorCreated = await Vendor.create(vendorToCreate);
        res.status(201).send(vendorCreated);
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

router.put("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        let vendor = await Vendor.findByIdAndUpdate(id, req.body);

        await Work.updateMany(
            {
                "equipment.eqOwner": vendor?.name,
            },
            { $set: { "equipment.eqOwner": req?.body?.name } }
        );

        res.status(200).send(vendor);
    } catch (err) {
        res.send(err);
    }
});

router.put("/resetPassword/:id", async (req, res) => {
    let newPassword = "password";
    let { id } = req.params;

    try {
        let vendor = await Vendor.findById(id);
        if (!vendor) {
            res.status(401).send({
                message: "Vendor not found!",
                error: true,
            });
        } else {
            let hashedPassword = await bcrypt.hash(newPassword, 10);
            vendor.password = hashedPassword;
            await Vendor.create({
                vendor,
            });

            return res.send({
                message: "Allowed",
                error: false,
                newPassword,
                vendor,
            });
        }
    } catch (err) {
        return res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

export default router;
