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

  let isExist = await checkExistEquipmentRequest({
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
  });

  if ((await isExist).length <= 0) {
    try {
      let requestToCreate = new requestData.model({
        project,
        referenceNumber,
        shift,
        owner,
        startDate,
        endDate,
      });
      let requestCreated = await requestToCreate.save();

      try {
        let requestDetailsToCreate = new equipmentRequestDetails.model({
          request: requestCreated,
          equipmentType,
          quantity,
          startDate,
          endDate,
          workToBeDone,
          tripsToBeMade,
          tripFrom,
          tripTo,
        });

        let requestDetailsCreated = requestDetailsToCreate.save();

        console.log(requestCreated);
        console.log(requestDetailsCreated);
        return requestCreated;
      } catch (err) {
        await requestData.delete({ _id: requestCreated._id });
      }
    } catch (err) {}
  } else {
    //get request Id
    let request = await requestData.model.findById(
      new Types.ObjectId(isExist[0]?._id)
    );

    try {
      let requestDetailsToCreate = new equipmentRequestDetails.model({
        request: request?._id,
        equipmentType,
        quantity,
        startDate,
        endDate,
        workToBeDone,
        tripsToBeMade,
        tripFrom,
        tripTo,
      });

      let requestDetailsCreated = requestDetailsToCreate.save();

      console.log(requestCreated);
      console.log(requestDetailsCreated);
      return requestCreated;
    } catch (err) {
      // await requestData.delete({ _id: requestCreated._id });
    }
    return;
  }

  return;
}

module.exports = {
  createEquipmentRequest,
};
