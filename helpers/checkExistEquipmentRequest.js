const _ = require("lodash");
const moment = require("moment");
const EquipmentRequest = require("../models/equipmentRequest");
async function checkExistEquipmentRequest(data) {
  const query = {
    project: data?.project,
    startDate: data?.startDate,
    endDate: data?.endDate,
    shift: data?.shift,
  };
  const isExist = await EquipmentRequest.model.find(query);
  return isExist;
}

module.exports = {
  checkExistEquipmentRequest,
};
