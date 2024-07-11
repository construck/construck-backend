const LogDispatch = require("./../../../models/logDispatch");

async function findOneAndUpdate(dispatch) {
    const logData = new LogDispatch.model({
      request: dispatch,
      status: "this",
      action: "findOneAndUpdate",
    });
    await logData.save();
    return;
  }

module.exports = {
  findOneAndUpdate,
};
