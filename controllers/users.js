const bcrypt = require("bcryptjs");
const _ = require("lodash");
const User = require("../models/users");
const Driver = require("../models/drivers");
const token = require("../tokens/tokenGenerator");
const findError = require("../utils/errorCodes");
const ObjectId = require("mongoose").Types.ObjectId;

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
};
