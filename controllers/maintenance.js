const express = require("express");
const moment = require("moment");
const _ = require("lodash");
const Maintenance = require("../models/maintenance");
const Work = require("../models/workData");
const router = express.Router();
const MaintenanceController = require("../controllers/maintenance");
const helper = require("./../helpers/maintenance");
const Equipment = require("../models/equipments");

const {
  checkIfEquipmentWasInWorkshop,
} = require("./../helpers/availability/equipment");

async function createJobCard(req, res) {
  const { entryDate, driver, carPlate, mileages, location, status } =
    req.body.payload;

  const jobCards = await Maintenance.model.find();

  // Checking if it's still in the repair mode
  const stillInRepair = jobCards.find((item) => {
    if (item.plate.value == carPlate.value && item.status == "Checking")
      return item;
  });

  if (stillInRepair)
    return res.status(400).json({
      message: "The equipment is still in repair or Issues with Mileages",
    });

  try {
    // FIND DISPATCH BY EQUIPMENT AND UPDATE THEM
    await helper.findAndUpdateDispatchByEquipment(carPlate.text, entryDate);
    // return;
    // FIND EQUIPMENT AND UPDATE ITS STATUS
    await Equipment.model.updateOne(
      {
        plateNumber: carPlate.text,
      },
      {
        $set: {
          eqStatus: "workshop",
        },
      }
    );

    // Saving the Job Card
    const jobCard = new Maintenance.model({
      jobCard_Id:
        (jobCards.length + 1 < 10
          ? `000${jobCards.length + 1}`
          : jobCards.length + 1 < 100
          ? `00${jobCards.length + 1}`
          : jobCards.length + 1 < 1000
          ? `0${jobCards.length + 1}`
          : `${jobCards.length + 1}`) +
        "-" +
        (new Date().getUTCMonth() < 10
          ? `0${new Date().getMonth() + 1}`
          : new Date().getUTCMonth()) +
        "-" +
        new Date().getFullYear().toString().substr(2),
      entryDate,
      driver,
      plate: carPlate,
      mileage: mileages,
      location,
      status,
      jobCard_status: "opened",
    });

    await jobCard.save();

    return res.status(200).send(jobCard);
  } catch (error) {
    console.log("error:", error);
  }
}

async function updateJobCard(req, res) {
  const {
    jobCard_id,
    entryDate,
    driver,
    plate,
    mileages,
    location,
    startRepair,
    endRepair,
    status,
    inspectionTools,
    mechanicalInspections,
    assignIssue,
    operator,
    sourceItem,
    operatorApproval,
    supervisorApproval,
    inventoryItems,
    inventoryData,
    transferData,
    teamApproval,
    transferParts,
    isViewed,
    reason,
    operatorNotApplicable,
    mileagesNotApplicable,
    requestParts,
    receivedParts,
  } = req.body.payload;

  const jobCard = await Maintenance.model.findByIdAndUpdate(
    req.params.id,
    {
      jobCard_Id: jobCard_id,
      entryDate,
      driver,
      plate,
      mileage: mileages,
      location,
      startRepair,
      endRepair: supervisorApproval == true ? moment() : "",
      status:
        supervisorApproval == true
          ? "pass"
          : sourceItem == "No Parts Required" && status == "repair"
          ? "repair"
          : status,
      inspectionTools,
      mechanicalInspections,
      assignIssue,
      operator,
      transferData,
      inventoryData,
      inventoryItems,
      sourceItem,
      operatorApproval,
      teamApproval,
      transferParts,
      isViewed,
      reason,
      jobCard_status: supervisorApproval == true ? "closed" : "opened",
      updated_At: moment(),
      operatorNotApplicable,
      mileagesNotApplicable,
      requestParts,
      receivedParts,
    },
    { new: true }
  );

  if (!jobCard)
    return res.status(404).send("The Job Card with the given ID was not found");
  // update equipment status
  if (supervisorApproval) {
    await Equipment.model.updateOne(
      {
        plateNumber: jobCard.plate.text,
      },
      {
        $set: {
          eqStatus: "workshop",
        },
      }
    );
  } else {
    console.log("no supervisor approval");
  }

  await jobCard.save();

  return res.status(200).send(jobCard);
}

async function equipmentWasInWorkshop(req, res) {
  const { id } = req.params;
  const { startdate, enddate } = req.query;
  const response = await checkIfEquipmentWasInWorkshop(id, startdate, enddate);
  if (!_.isEmpty(response)) {
    res.status(409).send({
      error: `Equipment with "${response?.plate?.text}" plate number was in the workshop between ${moment(response?.entryDate).format("MMMM DD, YYYY")} and ${moment(response?.endRepair).format("MMMM DD, YYYY")}`,
    });
  } else {
    res.status(200).send({
      message: "You can dispatch this equipment",
    });
  }
  return;
}

module.exports = {
  createJobCard,
  updateJobCard,
  equipmentWasInWorkshop,
};
