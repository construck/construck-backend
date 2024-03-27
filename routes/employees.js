const router = require("express").Router();
const bcrypt = require("bcryptjs");
const employeeData = require("../models/employees");
const venData = require("../models/vendors");
const userData = require("../models/users");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const { getDeviceToken } = require("../controllers.js/employees");
const { fetchProjects } = require("./projects");

router.get("/", async (req, res) => {
  try {
    let employees = await employeeData.model.find();
    res.status(200).send(employees);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let employee = await employeeData.model.findById(id);
    res.status(200).send(employee);
  } catch (err) {
    res.send(err);
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
    const employee = await employeeData.model.find({
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
    });
    res.status(200).send(employee);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    let employeeToCreate = new employeeData.model(req.body);
    employeeToCreate.password = hashedPassword;
    let employeeCreated = await employeeToCreate.save();

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
    let employee = await employeeData.model.findOne({ phone: phone });
    let vendor = await venData.model.findOne({ phone: phone });
    let user = await userData.model.findOne({ phone: phone });
    let allowed = false;
    let userType = null;
    let isDefaultPassword = false;

    if (employee) {
      userType = "employee";
      isDefaultPassword = await bcrypt.compare(
        defaultPassword,
        employee.password
      );
    } //driver
    if (vendor) {
      userType = "vendor";
      isDefaultPassword = await bcrypt.compare(
        defaultPassword,
        vendor.password
      );
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
        allowed = await bcrypt.compare(password, employee.password);
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
        await employee.save();

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
      allowed = await bcrypt.compare(password, user.password);
      if (user.status !== "inactive") {
        let _projects = user.assignedProjects?.map((p) => {
          let _p = { ...p };
          _p.id = p?._id;
          _p.description = p?.prjDescription;
          return _p;
        });
        res.status(200).send({
          employee: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            userId: user._id,
            assignedProject:
              user.assignedProjects?.length > 0
                ? user.assignedProjects[0]?.prjDescription
                : projects[0]['description'],
            assignedProjects: user.userType.includes("customer") && _projects?.length>0
              ? _projects
              : projects,
          },
          message: "Allowed",
          vendor: false,
          userType: user.userType,
        });
      } else {
        res.status(401).send({
          message: "Not activated!",
          error: true,
        });
      }
    }

    // if (!employee) {
    //   if (!vendor) {
    //     res.status(404).send({
    //       message: "User not found",
    //       error: true,
    //     });
    //     return;
    //   } else {
    //     allowed = await bcrypt.compare(password, vendor.password);
    //   }
    // } else {
    //   allowed = await bcrypt.compare(password, employee.password);
    // }

    // if (employee && (await bcrypt.compare("password", employee?.password))) {
    //   employee.password = await bcrypt.hash(password, 10);
    //   allowed = true;
    //   await employee.save();
    // }

    // if (vendor && (await bcrypt.compare("password", vendor?.password))) {
    //   vendor.password = await bcrypt.hash(password, 10);
    //   allowed = true;
    //   await vendor.save();
    // }

    // if (allowed) {
    //   if (employee) {
    //     if (employee.status !== "inactive") {
    //       // employee.message = "Allowed";
    //       res.status(200).send({
    //         employee: {
    //           _id: employee._id,
    //           firstName: employee.firstName,
    //           lastName: employee.lastName,
    //           userId: employee._id,
    //         },
    //         message: "Allowed",
    //         vendor: false,
    //       });
    //     } else {
    //       res.status(401).send({
    //         message: "Not activated!",
    //         error: true,
    //       });
    //     }
    //   }

    //   if (vendor) {
    //     res.status(200).send({
    //       employee: {
    //         _id: vendor.name,
    //         firstName: vendor.name,
    //         lastName: "",
    //         userId: vendor._id,
    //       },
    //       message: "Allowed",
    //       vendor: true,
    //     });
    //   }
    // } else {
    // res.status(401).send({
    //   message: "Not allowed!",
    //   error: true,
    // });
    // }
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

router.put("/status", async (req, res) => {
  try {
    let { employee, status } = req.body;
    let { _id } = employee;
    let employeeD = await employeeData.model.findById(_id);
    employeeD.status = status;
    let updatedEmployee = await employeeD.save();
    res.status(201).send(updatedEmployee);
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

router.put("/token/:id", async (req, res) => {
  try {
    let { employee, token } = req.body;
    let { id } = req.params;
    let employeeD = await employeeData.model.findById(id);
    employeeD.deviceToken = token;
    await employeeD.save();
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
    let employee = await employeeData.model.findById(id);
    if (!employee) {
      res.status(401).send({
        message: "Driver not found!",
        error: true,
      });
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      employee.password = hashedPassword;
      await employee.save();

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
    let employee = await employeeData.model.findByIdAndUpdate(id, req.body);
    res.status(200).send(employee);
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
