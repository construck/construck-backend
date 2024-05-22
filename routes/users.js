const router = require("express").Router();
const bcrypt = require("bcryptjs");
const userData = require("../models/users");
const Driver = require("../models/drivers");
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const token = require("../tokens/tokenGenerator");

router.get("/", async (req, res) => {
  try {
    let users = await userData.model.find().populate("company");
    res.status(200).send(users);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let user = await userData.model
      .findById(id)
      .populate("company")
      .populate("driver");
    res.status(200).send(user);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let {
    firstName,
    lastName,
    username,
    password,
    email,
    phone,
    userType,
    company,
    status,
    assignedProjects,
    permissions,
    vendor,
  } = req.body;

  try {
    let hashedPassword = await bcrypt.hash(password, 10);
    let userToCreate = new userData.model({
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
      permissions,
      vendor,
    });

    let userCreated = await userToCreate.save();
    res.status(201).send(userCreated);
  } catch (err) {
    console.log("err", err);
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
  let { email, password, phone } = req.body;

  try {
    let query = {};
    if (email) {
      query = { email };
    } else {
      query = { phone };
    }
    let user = await userData.model
      .findOne(query)
      .populate("customer")
      .populate("driver")
      .populate("vendor");

    // IMPLEMENT NEW LOGIN: SERVING ALL USER TYPES
    // CHECK IF PASSWORD IF CORRECT
    // GENERATE JWT TOKEN AND SEND IT TO CLIENT

    if (user) {
      const payload = {
        id: user._id,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
      };

      // GENERATE
      const generatedToken = await token.tokenGenerator(payload);
      delete user.password;

      res.status(200).send({
        user,
        message: "Allowed",
        token: generatedToken,
      });
    } else {
      res.status(401).send({
        message: "Not allowed!",
        error: true,
      });
    }
  } catch (err) {
    console.log("err", err);
    res.status(500).send({
      error: true,
    });
  }
});

router.put("/status", async (req, res) => {
  try {
    let { user, status } = req.body;
    let { _id } = user;
    let userD = await userData.model.findById(_id);
    userD.status = status;
    let updatedUser = await userD.save();
    res.status(201).send(updatedUser);
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});
router.put("/:id/disable-account", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await userData.model.findByIdAndUpdate(
      id,
      {
        status: "inactive",
      },
      {
        password: 0,
      }
    );
    res.status(201).send(response);
  } catch (err) {
    console.log("err");
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});
router.put("/:id/activate-account", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await userData.model.findByIdAndUpdate(
      id,
      {
        status: "active",
      },
      {
        password: 0,
      }
    );
    res.status(201).send(response);
  } catch (err) {
    console.log("err");
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

router.put("/", async (req, res) => {
  let { email, oldPassword, newPassword, reset } = req.body;

  try {
    let user = await userData.model.findOne({ email: email });
    if (!user) {
      res.status(401).send({
        message: "User not found!",
        error: true,
      });
    } else {
      let allowed = await bcrypt.compare(oldPassword, user?.password);
      if (allowed) {
        let hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.send({
          message: "Allowed",
          error: false,
          email: email,
          newPassword,
          companyName: user.company,
        });
      } else {
        res.status(401).send({
          message: "Not allowed. Please check the Old password.",
          error: true,
        });
      }
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
  let {
    firstName,
    lastName,
    email,
    phone,
    userType,
    company,
    assignedProjects,
    permissions,
  } = req.body;

  try {
    let user = await userData.model.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      userType,
      company,
      assignedProjects,
      permissions,
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
    let user = await userData.model.findById(id);
    if (!user) {
      res.status(401).send({
        message: "User not found!",
        error: true,
      });
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

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

module.exports = router;
