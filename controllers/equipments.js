const _ = require("lodash");
const moment = require("moment");
const EquipmentType = require("./../models/equipmentTypes");
const Equipment = require("../models/equipments");
const EquipmentUtilization = require("../models/equipmentUtilization");
const mongoose = require("mongoose");

const getStatus = (status) => {
  switch (status) {
    case "standby":
      return "Open";
    case "dispatched":
      return "Open";
    case "workshop":
      return "Workshop";
    case "disposed":
      return "Disposed";
    default:
      return;
  }
};
// Equipment Controller will hosted here
async function captureEquipmentUtilization(req, res) {
  let date = moment()
    .subtract(1, "days")
    .startOf("day")
    .set("hour", 0)
    .set("minute", 0)
    .format("YYYY-MM-DD");
  // date = moment(date, "YYYY-MM-DD", "UTC");
  // date = date.format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";

  // console.log(
  //   date,
  //   "Run cron job every 10 seconds in the development environment"
  // );
  try {
    // 1. CHECK IF THERE IS DATA FOR SELECTED DATE
    const snapshotExist = await EquipmentUtilization.model.find({
      date,
    });
    let types = [];
    let equipments = [];
    if (snapshotExist?.length === 0) {
      // 2. FIND SNAPSHOT OF EQUIPMENTS ON A GIVEN DATE
      equipments = await Equipment.model.find({
        eqOwner: "Construck",
      });

      const utilization = equipments.map((equipment) => {
        let data = {
          equipment: "",
          type: "",
          plateNumber: "",
          assetClass: "",
          equipmentCategory: "",
          owner: "",
          status: "",
          date,
        };
        if (equipment.eqOwner === "Construck") {
          data.equipment = new mongoose.Types.ObjectId(equipment._id);
          data.type = equipment.eqtype;
          data.plateNumber = equipment.plateNumber;
          data.assetClass = equipment.assetClass;
          data.equipmentCategory = equipment.eqDescription;
          data.owner = "Construck";
          data.status = getStatus(equipment.eqStatus);
        }
        return data;
      });
      // SAVE DATA IN DATABASE
      await EquipmentUtilization.model.insertMany(utilization);
      return res.status(201).send({
        message: "Equipment utilization captured successfully",
      });
    } else {
      return res.status(409).send({
        error: "Equipment utilization on the selected date exists already",
      });
    }
  } catch (err) {
    return res.status(503).send(err);
  }
}

// GET DAILY EQUIPMENT UTILIZATION: ACCEPT FILTERS TOO
async function getEquipmentUtilization(req, res) {
  console.log("Get equipment utilization");
}
// GET EQUIPMENT UTILIZATION BY A SPECIFIC DATE
async function getEquipmentUtilizationByDate(req, res) {
  let { date } = req.params;
  let { eqtypes } = req.query;
  eqtypes = !_.isEmpty(eqtypes) ? eqtypes.split(",") : [];
  // types = JSON.parse(`${types}`);
  date = moment(date, "YYYY-MM-DD", "UTC");
  date = date.format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
  try {
    // GET ALL EQUIPMENT TYPES
    const types = await EquipmentType.model.find();
    // GET UTILIZATION
    const query = {
      date,
    };

    const response = await EquipmentUtilization.model.find(query);
    // .populate("equipment", { createdAt: 0, updatedAt: 0, eqStatus: 0 });
    // GET NUMBER OF EQUIPMENT BY TYPES
    let utilization = [];
    if (_.isEmpty(eqtypes)) {
      utilization = types.map((type) => {
        let count = {
          date: "",
          type: type.description,
          total: 0,
          open: 0,
          availablePercent: 0,
          workshop: 0,
          workshopPercent: 0,
        };
        response.map((r) => {
          if (r.equipmentCategory === type.description) {
            count = {
              ...count,
              date: r.date,
              total: 0,
              open: r.status === "Open" ? count.open + 1 : count.open,
              openPercent: 0,
              workshop:
                r.status === "Workshop" ? count.workshop + 1 : count.workshop,
              workshopPercent: 0,
            };
            return count;
          }
        });
        return count;
      });
    } else {
      utilization = types.map((type) => {
        let count = {
          date: "",
          type: type.description,
          total: 0,
          open: 0,
          openPercent: 0,
          workshop: 0,
          workshopPercent: 0,
        };
        response.map((r) => {
          if (
            r.equipmentCategory === type.description &&
            eqtypes.includes(r.equipmentCategory)
          ) {
            count = {
              ...count,
              date: r.date,
              total: 0,
              open: r.status === "Open" ? count.open + 1 : count.open,
              openPercent: 0,
              workshop:
                r.status === "Workshop" ? count.workshop + 1 : count.workshop,
              workshopPercent: 0,
            };
            return count;
          }
        });
        return count;
      });
    }
    // REMOVE EQUIPMENT TYPES WITHOUT DATA
    utilization = utilization.filter((r) => {
      return !(r.open === 0 && r.workshop === 0);
    });
    utilization.sort((a, b) => {
      return b.open + b.workshop - (a.open + a.workshop);
    });
    return res
      .status(200)
      .send({ count: utilization.length, response: utilization });
  } catch (error) {
    return res.status(503).send({
      error: "Something went wrong, try again",
    });
  }
}
// GET AVERAGE EQUIPMENT UTILIZATION BY DATE RANGE
async function downloadEquipmentUtilizationByDates(req, res) {
  let { startdate, enddate } = req.params;
  console.log("range", startdate, enddate);
  startdate = new Date(startdate);
  enddate = new Date(enddate);
  startdate.setHours(0, 0, 0, 0);
  enddate.setHours(23, 59, 59, 0);

  try {
    let response;
    response = await EquipmentUtilization.model
      .find({
        date: { $gte: startdate, $lte: enddate },
      })
      .populate("type", { createdAt: 0, updatedAt: 0 });
    // Convert to data for Excel
    response = response.map((r) => {
      let data = {
        Date: moment(r.date).format("YYYY-MM-DD"),
        "Plate number": r.plateNumber,
        "Equipment type": r.equipmentCategory,
        "Asset class": r.assetClass,
        "Equipment category": r.type,
        Owner: r.owner,
        Status: r.status,
      };
      return data;
    });
    return res.status(200).send(response);
  } catch (error) {
    console.log("error", error);
    return res.status(503).send({
      error: "Something went wrong, try again",
    });
  }
}

module.exports = {
  captureEquipmentUtilization,
  getEquipmentUtilization,
  getEquipmentUtilizationByDate,
  downloadEquipmentUtilizationByDates,
};
