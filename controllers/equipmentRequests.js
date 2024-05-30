const { Types } = require("mongoose");
const {
  checkExistEquipmentRequest,
} = require("../helpers/checkExistEquipmentRequest");
const requestData = require("../models/equipmentRequest");
const equipmentRequestDetails = require("../models/equipmentRequestDetails");

async function createEquipmentRequest(requestBody) {
  let {
    project,
    referenceNumber,
    equipmentType,
    quantity,
    startDate,
    endDate,
    shift,
    owner,
    workToBeDone,
    tripsToBeMade,
    tripFrom,
    tripTo,
  } = requestBody;

  let requestToCreate = new requestData.model({
    project,
    referenceNumber,
    shift,
    owner,
    startDate,
    endDate,
  });
  let requestCreated = await requestToCreate.save();
  return requestCreated;
}

async function createEquipmentRequestDetails(requestBody) {
  let {
    requestId,
    equipmentType,
    quantity,
    workToBeDone,
    tripsToBeMade,
    tripFrom,
    tripTo,
  } = requestBody;

  let requestDetailsToCreate = new equipmentRequestDetails.model({
    request: requestId,
    equipmentType,
    quantity,
    workToBeDone,
    tripsToBeMade,
    tripFrom,
    tripTo,
  });

  let requestDetailsCreated = requestDetailsToCreate.save();
  return requestDetailsCreated;
}

module.exports = {
  createEquipmentRequest,
  createEquipmentRequestDetails,
};
