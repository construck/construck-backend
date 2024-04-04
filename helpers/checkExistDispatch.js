const _ = require("lodash");
const moment = require("moment");
const Work = require("../models/workData");
async function checkExistDispatch(data) {
  const query = {
    $or: [
      {
        "equipment.plateNumber": data?.equipment?.plateNumber,
        "dispatch.shift": data?.dispatch?.shift,
        status: { $in: ["created", "on going", "in progress"] },
        siteWork: false,
        workStartDate: {
          $gte: moment(data.workStartDate).format("YYYY-MM-DD"),
          $lte: moment(data.workEndDate).format("YYYY-MM-DD"),
        }
      },
      {
        "equipment.plateNumber":  data?.equipment?.plateNumber,
        "dispatch.shift": data?.dispatch?.shift,
        status: { $in: ["created", "on going", "in progress"] },
        siteWork: true,
        workStartDate: {
          $gte: moment(data.workStartDate).format("YYYY-MM-DD"),
        },
        workEndDate: {
          $lte: moment(data.workEndDate).format("YYYY-MM-DD"),
        },
      },
    ],
  };
  const isExist = await Work.model.find(query, {
    siteWork: 1,
    workStartDate: 1,
    workEndDate: 1,
    "equipment.plateNumber": 1,
  });
  console.log('##isExist', isExist.length, isExist)
  return isExist;
}

module.exports = {
  checkExistDispatch,
};
