import express from "express";
import bcrypt from "bcryptjs";
import { Employee } from "../models/employees";
import venData from "../models/vendors";
import { User } from "../models/users";
import findError from "../utils/errorCodes";
import getDeviceToken from "../helpers/getEmployee";
import { fetchProjects } from "./projects";

import _ from "lodash";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let employees = await Employee.find({}, { password: 0 });
        return res.status(200).send(employees);
    } catch (err) {
        return res.send(err);
    }
});

router.get("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        let employee = await Employee.findById(id, { password: 0 });
        return res.status(200).send(employee);
    } catch (err) {
        return res.send(err);
    }
});

router.get("/token/:id", async (req, res) => {
    let { id } = req.params;
    let result = await getDeviceToken(id);
    if (result.error) {
    } else {
        res.send(result);
    }
});

router.get("/:date/:shift", async (req, res) => {
    let { type, date, shift } = req.params;
    try {
        const employee = await Employee.find(
            {
                $or: [
                    { status: "active" },
                    {
                        status: "busy",
                        assignedShift: { $ne: shift },
                        assignedToSiteWork: { $ne: true },
                    },
                    {
                        status: "busy",
                        assignedDate: { $ne: date },
                        assignedToSiteWork: { $ne: true },
                    },
                    {
                        status: "dispatched",
                        assignedShift: { $ne: shift },
                        assignedToSiteWork: { $ne: true },
                    },
                    {
                        status: "dispatched",
                        assignedDate: { $ne: date },
                        assignedToSiteWork: { $ne: true },
                    },
                ],
            },
            { password: 0 }
        );
        res.status(200).send(employee);
    } catch (err) {
        res.send(err);
    }
});

router.post("/", async (req, res) => {
    try {
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        let employeeToCreate = req.body;
        employeeToCreate.password = hashedPassword;
        let employeeCreated = await Employee.create(employeeToCreate);

        res.status(201).send(employeeCreated);
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
    let { phone, password } = req.body;
    let projects = await fetchProjects();
    let defaultPassword = "12345";

    try {
        let employee = await Employee.findOne({ phone: phone });
        let vendor = await venData.model.findOne({ phone: phone });
        let user = await User.findOne({ phone: phone });
        let allowed = false;
        let userType = null;
        let isDefaultPassword = false;

        if (employee) {
            userType = "employee";
            isDefaultPassword = await bcrypt.compare(defaultPassword, employee.password);
        } //driver
        if (vendor) {
            userType = "vendor";
            isDefaultPassword = await bcrypt.compare(defaultPassword, vendor.password);
        } // vendor
        if (user) {
            userType = "consUser";
            isDefaultPassword = await bcrypt.compare(defaultPassword, user.password);
        } // cons User

        if (userType === null) {
            allowed = false;
            res.status(401).send({
                message: "Not allowed!",
                error: true,
            });
        }

        if (userType === "employee") {
            if (!isDefaultPassword) {
                allowed = bcrypt.compare(password, employee.password);
                if (employee.status !== "inactive" && allowed) {
                    // employee.message = "Allowed";
                    res.status(200).send({
                        employee: {
                            _id: employee._id,
                            firstName: employee.firstName,
                            lastName: employee.lastName,
                            userId: employee._id,
                            assignedProject: projects[0].prjDescription,
                            assignedProjects: projects,
                        },
                        message: "Allowed",
                        vendor: false,
                        userType,
                    });
                } else {
                    if (employee.status === "inactive")
                        res.status(401).send({
                            message: "Not activated!",
                            error: true,
                        });
                    else
                        res.status(401).send({
                            message: "Not allowed!",
                            error: true,
                        });
                }
            } else {
                let hashedPassword = await bcrypt.hash(password, 10);
                employee.password = hashedPassword;
                await Employee.create(employee);

                if (employee.status !== "inactive") {
                    // employee.message = "Allowed";
                    res.status(200).send({
                        employee: {
                            _id: employee._id,
                            firstName: employee.firstName,
                            lastName: employee.lastName,
                            userId: employee._id,
                            assignedProject: projects[0].prjDescription,
                            assignedProjects: projects,
                        },
                        message: "Allowed",
                        vendor: false,
                        userType,
                    });
                } else {
                    res.status(401).send({
                        message: "Not activated!",
                        error: true,
                    });
                }
            }
        }

        if (userType === "vendor") {
            allowed = await bcrypt.compare(password, vendor.password);
            res.status(200).send({
                employee: {
                    _id: vendor.name,
                    firstName: vendor.name,
                    lastName: vendor.name[1],
                    userId: vendor._id,
                    assignedProject: "na",
                },
                message: "Allowed",
                vendor: true,
                userType,
            });
        }

        if (userType === "consUser") {
            allowed = bcrypt.compare(password, user.password);
            if (user.status !== "inactive") {
                let _projects = user.assignedProjects?.map(p => {
                    let _p = { ...p };
                    _p.id = p?._id;
                    _p.description = p?.prjDescription;
                    return _p;
                });
                return res.status(200).send({
                    employee: {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        userId: user._id,
                        assignedProject:
                            user.assignedProjects?.length > 0
                                ? user.assignedProjects[0]?.prjDescription
                                : projects[0]["description"],
                        assignedProjects:
                            user.userType.includes("customer") && _projects?.length > 0 ? _projects : projects,
                    },
                    message: "Allowed",
                    vendor: false,
                    userType: user.userType,
                });
            } else {
                return res.status(401).send({
                    message: "Not activated!",
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

router.put("/status", async (req, res) => {
    try {
        let { employee, status } = req.body;
        let { _id } = employee;
        let employeeD = await Employee.findById(_id, { password: 0 });
        employeeD.status = status;
        let updatedEmployee = await Employee.create(employeeD);
        return res.status(201).send(updatedEmployee);
    } catch (err) {
        return res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

router.put("/token/:id", async (req, res) => {
    try {
        let { employee, token } = req.body;
        let { id } = req.params;
        let employeeD = await Employee.findById(id);
        employeeD.deviceToken = token;
        await Employee.create(employeeD);
        res.status(201).send({ tokenUpdated: true });
    } catch (err) {
        res.status(500).send({
            message: `${err}`,
            error: true,
            tokenUpdated: false,
        });
    }
});

router.put("/resetPassword/:id", async (req, res) => {
    let newPassword = "12345";
    let { id } = req.params;

    try {
        let employee = await Employee.findById(id);
        if (!employee) {
            res.status(401).send({
                message: "Driver not found!",
                error: true,
            });
        } else {
            let hashedPassword = await bcrypt.hash(newPassword, 10);
            employee.password = hashedPassword;
            await Employee.create(employee);

            res.send({
                message: "Allowed",
                error: false,
                newPassword,
                employee,
            });
        }
    } catch (err) {
        res.status(500).send({
            message: `${err}`,
            error: true,
        });
    }
});

router.put("/:id", async (req, res) => {
    let { id } = req.params;
    try {
        let employee = await Employee.findByIdAndUpdate(id, req.body);
        res.status(200).send(employee);
    } catch (err) {
        res.send(err);
    }
});

export default router;
