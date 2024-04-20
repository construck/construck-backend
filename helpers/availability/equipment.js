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

async function checkIfEquipmentWasInWorkshop(id, entrydate, endrepair) {
  entrydate = moment(entrydate).startOf("day");
  endrepair = moment(endrepair).endOf("day");
  console.log("@@@entrydate", entrydate);
  console.log("@@@endrepair", endrepair);
  console.log("@@dates@@:", moment(entrydate).endOf("day"));
  //TODO: check if there is job card with same entry and endrepair dates, return with empty array

  let query = {
    "plate.value": id,
    jobCard_status: "closed",
  };
  // DISPATCH(entrydate & endrepair) FALLS BETWEEN JOB CARD(entryDate, endRepair)
  const queryOne = {
    entryDate: { $lte: entrydate },
    endRepair: { $gte: endrepair },
  };
  // DISPATCH(entrydate) FALLS BETWEEN JOB CARD(entryDate, endRepair), but endrepair is above endRepair
  // entryDate is less than entrydate
  // endRepair is greater than entrydate
  // endRepair is less than endrepair
  const queryTwo = {
    $and: [
      {
        entryDate: { $lt: entrydate },
      },
      {
        endRepair: { $gt: moment(entrydate).add(1, "days") },
      },
      {
        endRepair: { $lte: endrepair },
      },
    ],
  };
  // DISPATCH(endrepair) FALLS BETWEEN JOB CARD(entryDate, endRepair), but entryDate is less than entrydate
  // entryDate(02) is less than endrepair(03)
  // endRepair(10) is greater than endrepair(03)
  // entryDate(02) is greater than entrydate(01)
  const queryThree = {
    $and: [
      {
        entryDate: { $lt: moment(endrepair).startOf("day") },
      },
      {
        endRepair: { $gte: moment(endrepair).subtract(1, "days") },
      },
      {
        entryDate: { $gt: entrydate },
      },
    ],
  };
  // DISPATCH(entrydate & endrepair) FALLS OUTSIDE JOB CARD(entryDate, endRepair)
  const queryFour = {
    entryDate: { $gt: entrydate },
    endRepair: { $lt: endrepair },
  };

  const maintenance = await Maintenance.model.findOne(
    {
      ...query,
      $or: [queryOne, queryTwo, queryThree, queryFour],
    },
    {
      entryDate: 1,
      endRepair: 1,
      plate: 1,
    }
  );
  console.log("maintenance", maintenance);
  return maintenance || [];
}
module.exports = {
  getListOfEquipmentOnDuty,
  getListOfEquipmentInWorkshop,
  getListOfDisposedEquipments,
  checkIfEquipmentWasInWorkshop,
};
