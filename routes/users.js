import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/users";
import { Vendor } from "../models/vendors";
import findError from "../utils/errorCodes";
import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let users = await User.find().populate("company");
        res.status(200).send(users);
    } catch (err) {
        res.send(err);
    }
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        let user = await User.findById(id).populate("company");
        res.status(200).send(user);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    let { firstName, lastName, username, password, email, phone, userType, company, status, assignedProjects } =
        req.body;

    try {
        let hashedPassword = await bcrypt.hash(password, 10);
        let userToCreate = {
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            phone,
            userType,
            company,
            status,
            assignedProjects,
        };

        let userCreated = await User.create(userToCreate);
        res.status(201).send(userCreated);
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

router.post("/login", async (req, res) => {
    let { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email }).populate("company");

        let vendor = await Vendor.findOne({ phone: email });

        console.log(vendor);

        if (user?.length === 0 || !user) {
            if (vendor?.length === 0 || !vendor) {
                res.status(404).send({
                    message: "User not found!",
                    error: true,
                });
                return;
            }
        }

        let userAllowed = user ? bcrypt.compare(password, user?.password) : false;
        let vendorAllowed = vendor ? bcrypt.compare(password, vendor?.password) : false;

        if (userAllowed) {
            if (user.status === "active") {
                // user.message = "Allowed";
                res.status(200).send({ user, message: "Allowed" });
            } else {
                return res.status(401).send({
                    message: "Not activated!",
                    error: true,
                });
            }
        } else if (vendorAllowed) {
            return res.status(200).send({
                user: {
                    _id: vendor._id,
                    firstName: vendor.name,
                    lastName: "",
                    status: "active",
                    userType: "vendor",
                },
                message: "Allowed",
            });
        } else {
            return res.status(401).send({
                message: "Not allowed!",
                error: true,
            });
        }
    } catch (err) {
        console.log("err: ", err);
        return res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

router.put("/status", async (req, res) => {
    try {
        let { user, status } = req.body;
        let { _id } = user;
        let userD = await User.findById(_id);
        userD.status = status;
        let updatedUser = await User.create(userD);
        return res.status(201).send(updatedUser);
    } catch (err) {
        return res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

router.put("/", async (req, res) => {
    let { email, oldPassword, newPassword, reset } = req.body;

    try {
        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).send({
                message: "User not found!",
                error: true,
            });
        } else {
            let allowed = await bcrypt.compare(oldPassword, user?.password);
            if (allowed) {
                let hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
                await User.create(user);

                return res.send({
                    message: "Allowed",
                    error: false,
                    email: email,
                    newPassword,
                    companyName: user.company,
                });
            } else {
                return res.status(401).send({
                    message: "Not allowed. Please check the Old password.",
                    error: true,
                });
            }
        }
    } catch (err) {
        return res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

router.put("/:id", async (req, res) => {
    let { id } = req.params;
    let { firstName, lastName, email, phone, userType, company, assignedProjects } = req.body;

    try {
        let user = await User.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email,
            phone,
            userType,
            company,
            assignedProjects,
        });

        res.status(200).send(user);
    } catch (err) {
        res.send(err);
    }
});

router.put("/resetPassword/:id", async (req, res) => {
    let newPassword = "12345";
    let { id } = req.params;

    try {
        let user = await User.findById(id);
        if (!user) {
            res.status(401).send({
                message: "User not found!",
                error: true,
            });
        } else {
            let hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await User.create(user);

            res.send({
                message: "Allowed",
                error: false,
                newPassword,
                user,
            });
        }
    } catch (err) {
        res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

export default router;
