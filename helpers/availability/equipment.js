const _ = require("lodash");
const moment = require("moment");
const Equipment = require("./../../models/equipments");
const Work = require("./../../models/workData");
const Maintenance = require("./../../models/maintenance");

async function getListOfEquipmentOnDuty(startDate, endDate, shift, siteWork) {
  let query = [];
  query = {
    $or: [
      {
        siteWork: false,
        shift,
        workStartDate: endDate,
      },
      {
        siteWork: true,
        shift,
        workStartDate: {
          $lte: startDate,
        },
        workEndDate: {
          $gte: endDate,
        },
      },
    ],
  };

  const response = Work.model.find(query);
  return response;
}

async function getListOfEquipmentInWorkshop() {
  const maintenance = await Maintenance.model.find(
    {
      jobCard_status: "opened",
    },
    {
      plate: 1,
      status: 1,
      jobCard_status: 1,
    }
  );

  return maintenance || [];
}

async function getListOfDisposedEquipments() {
  const response = await Equipment.model.find(
    {
      eqStatus: "disposed",
    },
    { plateNumber: 1 }
  );
  //   console.log("response", response.length);
  return response;
}

async function checkIfEquipmentWasInWorkshop(
  plateNumber,
  workStartDate,
  workEndDate
) {
  let dates = [];
  let query = {
    $or: [
      {
        entryRepair: { $lte: workEndDate }, // Entry date <= work end date
        endRepair: { $gte: workStartDate }, // Exit date >= work start date
      },
      {
        entryRepair: { $gte: workStartDate }, // Entry date >= work start date
        endRepair: { $lte: null }, // Exit date is null (car is still in workshop)
      },
    ],
    plateNumber,
  };
  const maintenance = await Maintenance.model.find(query, {
    plate: 1,
    status: 1,
    jobCard_status: 1,
  });
  return maintenance || [];
}
module.exports = {
  getListOfEquipmentOnDuty,
  getListOfEquipmentInWorkshop,
  getListOfDisposedEquipments,
  checkIfEquipmentWasInWorkshop,
};
