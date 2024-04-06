const _ = require("lodash");
const moment = require("moment");
const EquipmentType = require("./../models/equipmentTypes");
const Work = require("../models/workData");
const Equipment = require("../models/equipments");
const EquipmentUtilization = require("../models/equipmentUtilization");
const mongoose = require("mongoose");
const mailer = require("./../helpers/mailer/equipmentReport");
const helper = require("./../helpers/generateEquipmentTable");
const Maintenance = require("../models/maintenance");

const getStatus = (status) => {
  switch (status) {
    case "standby":
      return "available";
    case "dispatched":
      return "available";
    case "workshop":
      return "workshop";
    default:
      return;
  }
};
// Equipment Controller will hosted here
async function captureEquipmentUtilization(req, res) {
  let date;
  if (req?.query?.date) {
    date = req?.query?.date;
  } else {
    date = moment()
      .startOf("day")
      .set("hour", 0)
      .set("minute", 0)
      .format("YYYY-MM-DD");
  }

  try {
    console.log("date", date);
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
        eqStatus: { $ne: "disposed" },
      });

      const utilization = equipments.map((equipment) => {
        let data = {
          equipment: new mongoose.Types.ObjectId(equipment._id),
          type: equipment.eqtype,
          plateNumber: equipment.plateNumber,
          assetClass: equipment.assetClass,
          equipmentCategory: equipment.eqDescription,
          owner: "Construck",
          status: getStatus(equipment.eqStatus),
          date,
        };
        return data;
      });
      // SAVE DATA IN DATABASE
      // await EquipmentUtilization.model.insertMany(utilization);
      const data = await EquipmentType.model.find();
      const table = await helper.generateEquipmentTable(data, utilization);

      await mailer.equipmentReport(date, table);
      console.log(
        `Cronjob: Equipment utilization captured successfully: ${date}`
      );
    } else {
      console.log("Equipment utilization on the selected date exists already");
    }
  } catch (err) {
    console.log("Cronjob: Cannot capture equipment report:", err);
  }
}

// GET EQUIPMENT UTILIZATION BY A SPECIFIC DATE
async function getEquipmentUtilizationByDate(req, res) {
  let { date } = req.params;
  let { eqtypes } = req.query;
  eqtypes = !_.isEmpty(eqtypes) ? eqtypes.split(",") : [];
  if (date === moment().format("YYYY-MM-DD")) {
    const equipments = await Equipment.model.find({
      eqOwner: "Construck",
      eqStatus: { $ne: "disposed" },
    });

    const utilization = equipments.map((equipment) => {
      let data = {
        equipment: new mongoose.Types.ObjectId(equipment._id),
        type: equipment.eqtype,
        plateNumber: equipment.plateNumber,
        assetClass: equipment.assetClass,
        equipmentCategory: equipment.eqDescription,
        owner: "Construck",
        status: getStatus(equipment.eqStatus),
        date,
      };
      return data;
    });

    const data = await EquipmentType.model.find();
    const table = await helper.generateEquipmentTable(
      data,
      utilization,
      eqtypes
    );

    return res.status(200).send({ count: table.length, response: table });
  }

  // types = JSON.parse(`${types}`);
  date = moment(date, "YYYY-MM-DD", "UTC");
  date = date.format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
  // return;
  try {
    // GET ALL EQUIPMENT TYPES
    const types = await EquipmentType.model.find();
    // GET UTILIZATION
    const query = {
      date,
    };

    const response = await EquipmentUtilization.model.find(query);
    // GET NUMBER OF EQUIPMENT BY TYPES
    const table = await helper.generateEquipmentTable(types, response, eqtypes);

    return res.status(200).send({ count: table.length, response: table });
  } catch (error) {
    return res.status(503).send({
      error: "Something went wrong, try again",
    });
  }
}
// GET AVERAGE EQUIPMENT UTILIZATION BY DATE RANGE
async function downloadEquipmentUtilizationByDates(req, res) {
  let { startdate, enddate } = req.params;
  let { eqtypes } = req.query;
  eqtypes = !_.isEmpty(eqtypes) ? eqtypes.split(",") : [];
  startdate = new Date(startdate);
  enddate = new Date(enddate);
  startdate.setHours(0, 0, 0, 0);
  enddate.setHours(23, 59, 59, 0);

  // return;
  try {
    let response;
    response = await EquipmentUtilization.model
      .find({
        date: { $gte: startdate, $lte: enddate },
        equipmentCategory: { $in: eqtypes },
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
    return res.status(503).send({
      error: "Something went wrong, try again",
    });
  }
}

// CHANGE EQUIPMENT STATUS IF THERE IS DISPATCH SCHEDULED ON TODAY
async function changeEquipmentStatus(req, res) {
  let date = moment()
    .startOf("day")
    .set("hour", 0)
    .set("minute", 0)
    .format("YYYY-MM-DD");

  console.log("Cron job has started: updating equipment status for:", date);
  // CHECK IF THERE ARE DISPATCHES SCHEDULED FOR TODAY
  const query = {
    $or: [
      {
        siteWork: false,
        status: { $in: ["in progress"] },
        workStartDate: date,
      },
      {
        siteWork: true,
        status: { $in: ["created", "on going", "in progress"] },
        workStartDate: {
          $lte: date,
        },
        workEndDate: {
          $gte: date,
        },
      },
    ],
  };

  // CHECK DISPATCHES SCHEDULED FOR TODAY
  let dispatches = {};
  dispatches = await Work.model.find(query, {
    _id: 0,
    "equipment.plateNumber": 1,
  });
  // FILTER PLATE NUMBERS ONLY
  dispatches = dispatches
    .map((d) => d?.equipment?.plateNumber)
    .filter((p) => p);
  // CHECK EQUIPMENTS THAT ARE NOT IN MAINTENANCE
  const jobcards = await Maintenance.model.find(
    {
      "plate.text": {
        $in: ["RAC 128 Y"],
      },
      jobCard_status: "opened"
    },
    {
      "plate.text": 1,
      status: 1,
    }
  );
  res.status(200).send(jobcards);
  return;
  if (dispatches.length > 0) {
    dispatches.map(async (work) => {
      // find its equip, if standby, make it dispatched
      // const equip = await Equipment.model.findOneAndUpdate(
      //   {
      //     _id: work?.equipment?._id,
      //   },
      //   {
      //     $set: {
      //       eqStatus: "dispatched",
      //     },
      //   }
      // );
      // }
    });
  }
  return;
}
module.exports = {
  changeEquipmentStatus,
  captureEquipmentUtilization,
  getEquipmentUtilizationByDate,
  downloadEquipmentUtilizationByDates,
};
