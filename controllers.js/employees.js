
const usersData = require("../models/users");

async function getDeviceToken(driverId) {

    try {
      let employee = await usersData.model.findById(driverId);
      return employee.deviceToken ? employee.deviceToken : "none";
    } catch (err) {
      return {
        error: true,
        message: err,
      };
    }
  }
  

  module.exports = {
    getDeviceToken
  }