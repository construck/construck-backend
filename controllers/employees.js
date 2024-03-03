
const employeeData = require("../models/employees");

async function getDeviceToken(driverId) {

    try {
      let employee = await employeeData.model.findById(driverId);
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