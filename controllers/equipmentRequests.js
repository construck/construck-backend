const { Types } = require("mongoose");
const {
  checkExistEquipmentRequest,
} = require("../helpers/checkExistEquipmentRequest");
const requestData = require("../models/equipmentRequest");
const equipmentRequestDetails = require("../models/equipmentRequestDetails");

async function createEquipmentRequest(requestBody) {
  let { project, referenceNumber, startDate, endDate, shift, owner } =
    requestBody;

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

async function updateRequestDetails(id, updates) {
  let updatedRequest = await equipmentRequestDetails.model.findByIdAndUpdate(
    id,
    updates
  );
  return updatedRequest;
}

module.exports = {
  createEquipmentRequest,
  createEquipmentRequestDetails,
  updateRequestDetails,
};
