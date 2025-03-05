const _ = require("lodash");
const moment = require("moment");
const Equipment = require("./../../models/equipments");
const Work = require("./../../models/workData");
const Maintenance = require("./../../models/maintenance");
const WorkshopCard = require("../../models/workshop_cards");

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
  const maintenance = await WorkshopCard.model
    .find(
      {
        status: "open",
        entryDate: { $gte: workStartDate },
      },
      {
        equipment: 1,
        status: 1,
        entryDate: 1,
      }
    )
    .populate("equipment");
  return maintenance || [];
}

async function getListOfDisposedEquipments() {
  const response = await Equipment.model.find(
    {
      eqStatus: "disposed",
    },
    { plateNumber: 1 }
  );
  return response;
}

async function checkIfEquipmentWasInWorkshop(id, entrydate, endrepair) {
  entrydate = moment(entrydate).startOf("day");
  endrepair = moment(endrepair).endOf("day");

  let query = {
    "equipment": id,
    status: "closed",
  };
  // DISPATCH(entrydate & endrepair) FALLS BETWEEN JOB CARD(entryDate, exitDate)
  const queryOne = {
    entryDate: { $lte: entrydate },
    exitDate: { $gte: endrepair },
  };
  // DISPATCH(entrydate) FALLS BETWEEN JOB CARD(entryDate, exitDate), but endrepair is above exitDate
  const queryTwo = {
    $and: [
      {
        entryDate: { $lt: entrydate },
      },
      {
        exitDate: { $gt: moment(entrydate).add(1, "days") },
      },
      {
        exitDate: { $lte: endrepair },
      },
    ],
  };
  // DISPATCH(endrepair) FALLS BETWEEN JOB CARD(entryDate, exitDate), but entryDate is less than entrydate
  const queryThree = {
    $and: [
      {
        entryDate: { $lt: moment(endrepair).startOf("day") },
      },
      {
        exitDate: { $gte: moment(endrepair).subtract(1, "days") },
      },
      {
        entryDate: { $gt: entrydate },
      },
    ],
  };
  // DISPATCH(entrydate & endrepair) FALLS OUTSIDE JOB CARD(entryDate, exitDate)
  const queryFour = {
    entryDate: { $gt: entrydate },
    exitDate: { $lt: endrepair },
  };

  let maintenance = [];
  maintenance = await WorkshopCard.model.findOne(
    {
      ...query,
      $or: [queryOne, queryTwo, queryThree, queryFour],
    },
    {
      entryDate: 1,
      exitDate: 1,
      plate: 1,
    }
  );
  if (
    moment(maintenance?.entryDate).format("YYYY-MM-DD") ===
    moment(maintenance?.exitDate).format("YYYY-MM-DD")
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
