const _ = require("lodash");
const moment = require("moment");
const Equipment = require("./../../models/equipments");
const Work = require("./../../models/workData");
const Maintenance = require("./../../models/maintenance");

async function getListOfEquipmentOnDuty(startDate, endDate, shift, siteWork) {
  siteWork = siteWork === "true";
  let formattedStartDate = moment(startDate).format("YYYY-MM-DD");
  let query = [];
  query = {
    $or: [
      {
        status: { $ne: "recalled" },
        "dispatch.shift": shift,
        siteWork: false,
        workStartDate: formattedStartDate,
      },
      {
        status: { $ne: "recalled" },
        "dispatch.shift": shift,
        siteWork: true,
        workStartDate: {
          $lte: moment(startDate).format("YYYY-MM-DD"),
        },
        workEndDate: {
          $gte: moment(endDate).format("YYYY-MM-DD"),
        },
      },
    ],
  };

  const response = await Work.model.find(query, {
    workStartDate: 1,
    workEndDate: 1,
    siteWork: 1,
    "dispatch.shift": 1,
    "equipment.plateNumber": 1,
  });
  return response || [];
}

async function getListOfEquipmentInWorkshop(workStartDate) {
  const maintenance = await Maintenance.model.find(
    {
      jobCard_status: "opened",
      entryDate: { $gte: workStartDate },
    },
    {
      plate: 1,
      status: 1,
      jobCard_status: 1,
      entryDate: 1,
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

  let maintenance = [];
  maintenance = await Maintenance.model.findOne(
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
  if (
    moment(maintenance?.entryDate).format("YYYY-MM-DD") ===
    moment(maintenance?.endRepair).format("YYYY-MM-DD")
  ) {
    maintenance = [];
  }
  return maintenance || [];
}
module.exports = {
  getListOfEquipmentOnDuty,
  getListOfEquipmentInWorkshop,
  getListOfDisposedEquipments,
  checkIfEquipmentWasInWorkshop,
};
