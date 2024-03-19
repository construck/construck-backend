const { Employee } = require("../models/employees");

export default async function getDeviceToken(driverId) {
  try {
    let employee = await Employee.findById(driverId);
    return employee.deviceToken ? employee.deviceToken : "none";
  } catch (err) {
    return {
      error: true,
      message: err,
    };
  }
}
