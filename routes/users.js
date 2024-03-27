const router = require("express").Router();
const bcrypt = require("bcryptjs");
const userData = require("../models/users");
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

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
    let user = await userData.model.findById(id).populate("company");
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
    assignedProject,
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
      assignedProject,
    });

    let userCreated = await userToCreate.save();
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
    let user = await userData.model
      .findOne({ email: email })
      .populate("company");

    let vendor = await venData.model.findOne({ phone: email });

    if (user?.length === 0 || !user) {
      if (vendor?.length === 0 || !vendor) {
        res.status(404).send({
          message: "User not found!",
          error: true,
        });
        return;
      }
    }

    let userAllowed = user
      ? await bcrypt.compare(password, user?.password)
      : false;
    let vendorAllowed = vendor
      ? await bcrypt.compare(password, vendor?.password)
      : false;

    if (userAllowed) {
      if (user.status === "active") {
        // user.message = "Allowed";
        res.status(200).send({ user, message: "Allowed" });
      } else {
        res.status(401).send({
          message: "Not activated!",
          error: true,
        });
      }
    } else if (vendorAllowed) {
      res.status(200).send({
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
      res.status(401).send({
        message: "Not allowed!",
        error: true,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
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
    assignedProject,
  } = req.body;

  try {
    let user = await userData.model.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      userType,
      company,
      assignedProject,
    });

    res.status(200).send(user);
  } catch (err) {
    res.send(err);
  }
});

router.put("/resetPassword/:id", async (req, res) => {
  let newPassword = "password";
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
