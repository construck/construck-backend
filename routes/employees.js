const router = require("express").Router();
const bcrypt = require("bcryptjs");
const employeeData = require("../models/employees");
const venData = require("../models/vendors");
const userData = require("../models/users");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const { getDeviceToken } = require("../controllers.js/employees");
const { fetchProjects } = require("./projects");
const { default: mongoose } = require("mongoose");

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
    let query = {
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
    };
    const employee = await employeeData.model.find(
      {},
      {
        password: 0,
      }
    );
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
    res.status(503).send({
      error,
      key,
    });
  }
});
router.post("/drivers", async (req, res) => {
  // COMMENT THIS CODES IF APP IS APPROVED
  // return res.status(500).send({
  //   message: "Try again later",
  // });
  try {
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    let employeeToCreate = new employeeData.model(req.body);
    employeeToCreate.password = hashedPassword;
    employeeToCreate.status = "active";
    let employeeCreated = await employeeToCreate.save();

    res.status(201).send(employeeCreated);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.status(503).send({
      error,
      key,
    });
  }
  return;
});

router.post("/login", async (req, res) => {
  let { phone, password } = req.body;
  let projects = await fetchProjects();
  let defaultPassword = "12345";

  try {
    let employee = await employeeData.model.findOne({
      phone: phone,
      status: { $nin: ["deleted", "inactive"] },
    });
    // console.log("employee", employee);
    // return;
    // let vendor = await venData.model.findOne({ phone: phone });
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
    }
    if (user && user.userType === 'vendor') {
      userType = "vendor";
      isDefaultPassword = await bcrypt.compare(
        defaultPassword,
        user.password
      );
    } // vendor
    if (user && user.userType !== 'vendor') {
      userType = "consUser";
      isDefaultPassword = await bcrypt.compare(defaultPassword, user.password);
    } // cons User

    if (userType === null) {
      console.log('@@@null', userType);
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
     
      allowed = await bcrypt.compare(password, user.password);
      return res.status(200).send({
        employee: {
          _id: user._id,
          firstName: user.firstName,
          lastName: "-",
          userId: user._id,
          // assignedProject: "na",
          // assignedProjects: []
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
                : projects[0]["description"],
            assignedProjects:
              user.userType.includes("customer") && _projects?.length > 0
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

  } catch (err) {
    console.log('@@err', err)
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

router.delete("/delete-account/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    const isDeletedOrInactive = await employeeData.model.findOne({
      _id: new mongoose.Types.ObjectId(id),
      status: { $nin: ["deleted", "inactive"] },
    });
    if (_.isEmpty(isDeletedOrInactive)) {
      return res.status(404).send({
        code: "USER_ACCOUNT_NOT_FOUND",
        message: "Account not found",
      });
    }
    isDefaultPassword = await bcrypt.compare(
      password,
      isDeletedOrInactive.password
    );
    if (!isDefaultPassword) {
      return res.status(401).send({
        code: "USER_PASSWORD_INCORRECT",
        message: "Password is incorrect, try again",
      });
    }
    const response = await employeeData.model.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        status: "deleted",
      },
      { new: true }
    );
    if (_.isNull(response)) {
      return res.status(403).send({
        code: "USER_DELETE_ERROR",
        message: "Error occurred, Try again later or contact support",
      });
    }

    return res.status(200).send({
      code: "USER_DELETE_SUCCESS",
      message: "Your account has been schedule to be deleted after 30 days.",
    });
  } catch (error) {
    console.log("error", error);
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
