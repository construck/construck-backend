const bcrypt = require("bcryptjs");
const _ = require("lodash");
const User = require("../models/users");
const PasswordRequest = require("../models/passwordReset");
const Driver = require("../models/drivers");
const token = require("../tokens/tokenGenerator");
const findError = require("../utils/errorCodes");
const mailer = require("./../helpers/mailer/resetPassword");
const ObjectId = require("mongoose").Types.ObjectId;
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

async function requestChangePassword(req, res) {
  let { email } = req.body;
  try {
    // 1. check if user exists,
    const user = await User.model.findOne({ email });
    if (!user) {
      return res.status(404).send({
        error: "User not found",
      });
    }
    console.log("user", user);
    // 2. create password reset requests
    const token = uuidv4();
    const response = await PasswordRequest.model.create({ email, token });
    console.log("response", response);
    // 3. send email
    await mailer.resetPassword(email, user.firstName, token);
    return res.status(200).send({
      message: "Go to email",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(error);
  }
}
async function changePassword(req, res) {
  const { token } = req.params;
  const { password } = req.body;
  try {
    // 1. CHECK IF TOKEN IS VALID
    const response = await PasswordRequest.model.findOne({
      token,
    });
    if (!response) {
      return res.status(404).send({
        error: "Token has expired, request to reset password again",
      });
    }
    // 2. USING MOMENT, CHECK IF token has created in the last 10 minutes
    const time = moment().subtract(2, "hours").utc();
    if (moment.utc(response.createdAt) < time) {
      return res.status(404).send({
        error: "Token has expired, request to reset password again",
      });
    }
    // 3. CREATE HASHED PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.model.findOneAndUpdate(
      { email: response.email },
      {
        $set: {
          password: hashedPassword,
        },
      },
      {
        new: true,
      }
    );
    // 4. DELETE TOKEN AFTER BEING USED
    await PasswordRequest.model.deleteOne({
      token,
    });
    // 5. RETURN DATA TO CLIENTS
    return res
      .status(200)
      .send({ message: "You have changed your password successfully" });
  } catch (error) {
    return res.status(404).send({
      error: "Token has expired, request to reset password again",
    });
  }
}
async function createUser(req, res) {
  let {
    firstName,
    lastName,
    username,
    email,
    phone,
    userType,
    accountType,
    company,
    status,
    assignedProjects,
    permissions,
    vendor,
    driver,
  } = req.body;

  const password = "12345"; // Default password

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userToCreate = new User.model({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      email: email || null,
      phone,
      userType,
      accountType,
      status,
      assignedProjects,
      permissions,
      company: company ? new ObjectId(company) : null,
      vendor: vendor ? new ObjectId(vendor) : null,
    });
    let response = await userToCreate.save();

    // IF DRIVER, CREATE DRIVER PROJECT
    if (userType === "driver") {
      const driverResponse = await Driver.model.create({
        title: driver.title,
        employment: driver.employment,
        user: response._id,
      });
      // UPDATE USER WITH DRIVER ID
      response = await User.model.findByIdAndUpdate(
        { _id: response._id },
        { driver: driverResponse._id },
        { new: true }
      );
      console.log("driverResponse", driverResponse);
    }

    return res.status(201).send(response);
  } catch (err) {
    console.log("err", err);
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    if (error === "DuplicateKey") {
      return res.status(409).send({
        error: "Whaat??",
        key,
      });
    }
    return res.status(500).send({
      error,
      key,
    });
  }
}

module.exports = {
  createUser,
  requestChangePassword,
  changePassword,
};
