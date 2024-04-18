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

const {
  getListOfEquipmentOnDuty,
  getListOfEquipmentInWorkshop,
  getListOfDisposedEquipments,
  checkIfEquipmentWasInWorkshop,
} = require("./../helpers/availability/equipment");

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
  const { NODE_ENV } = process.env;
  let date;
  if (NODE_ENV === "production") {
    date = moment()
      .startOf("day")
      .set("hour", 0)
      .set("minute", 0)
      .format("YYYY-MM-DD");
  } else {
    date = req?.query?.date;
    if (_.isEmpty(date)) {
      res.status(503).send({
        error:
          "This automation is designed to be run in production otherwise specify the date in the query string",
      });
      return;
    }
  }
  try {
    // 1. CHECK IF THERE IS DATA FOR SELECTED DATE
    const snapshotExist = await EquipmentUtilization.model.find({
      date,
    });
    let types = [];
    if (snapshotExist?.length === 0) {
      // 2. FIND SNAPSHOT OF EQUIPMENTS ON A GIVEN DATE
      const response = await Equipment.model.find({
        eqOwner: { $in: ["Construck", "MUTUMISHI COMPANY LTD"] },
        eqStatus: { $ne: "disposed" },
      });

      let plateNumbers = response.map((e) => {
        return {
          id: e._id, // new mongoose.Types.ObjectId(e.value),
          equipmentCategory: e.eqDescription,
          plateNumber: e.plateNumber,
        };
      });
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
      let plateNumbersInMaintenance = maintenance.map((e) => {
        return {
          id: new mongoose.Types.ObjectId(e.plate.value),
          equipmentCategory: e.plate.eqDescription,
          plateNumber: e.plate.text,
          status: "workshop",
          date,
        };
      });
      let plateNumbersNotInMaintenance = plateNumbers
        .filter((x) => {
          return !plateNumbersInMaintenance.some(
            (item) => item.plateNumber === x.plateNumber
          );
        })
        .map((availableEquipment) => ({
          id: new mongoose.Types.ObjectId(availableEquipment.id),
          equipmentCategory: availableEquipment.equipmentCategory,
          plateNumber: availableEquipment.plateNumber,
          status: "available",
          date,
        }));
      let makeOneArray = [
        ...plateNumbersInMaintenance,
        ...plateNumbersNotInMaintenance,
      ];

      makeOneArray = makeOneArray.filter(
        (e) =>
          e.equipmentCategory !== "WALK-BEHIND" &&
          e.equipmentCategory !== "COMPRESSOR" &&
          e.equipmentCategory !== "STUMPER"
      );
      // SAVE DATA IN DATABASE
      await EquipmentUtilization.model.insertMany(makeOneArray);
      const data = await EquipmentType.model.find();
      const table = await helper.generateEquipmentTable(data, makeOneArray);

      await mailer.equipmentReport(date, table);
      if (NODE_ENV === "production") {
        console.log(
          `Cronjob: Equipment utilization captured successfully: ${date}`
        );
      } else {
        return res.status(200).send({
          error: `Cronjob: Equipment utilization captured successfully: ${date}`,
        });
      }
      return table;
    } else {
      if (NODE_ENV === "production") {
        console.log(
          "Equipment utilization on the selected date exists already"
        );
        return;
      } else {
        return res.status(409).send({
          error: "Equipment utilization on the selected date exists already",
        });
      }
    }
  } catch (error) {
    if (NODE_ENV === "production") {
      console.log("Cronjob: Cannot capture equipment report:", error);
    } else {
      return res.status(503).send({
        message: "Cronjob: Cannot capture equipment report",
        error,
      });
    }
  }
}

// GET EQUIPMENT UTILIZATION BY A SPECIFIC DATE
async function getEquipmentUtilizationByDate(req, res) {
  let { date } = req.params;
  let { eqtypes } = req.query;
  eqtypes = !_.isEmpty(eqtypes) ? eqtypes.split(",") : [];
  if (date === moment().format("YYYY-MM-DD")) {
    // 2. FIND SNAPSHOT OF EQUIPMENTS ON A GIVEN DATE
    const response = await Equipment.model.find({
      eqOwner: { $in: ["Construck", "MUTUMISHI COMPANY LTD"] },
      eqStatus: { $ne: "disposed" },
    });

    let plateNumbers = response.map((e) => {
      return {
        id: e._id,
        equipmentCategory: e.eqDescription,
        plateNumber: e.plateNumber,
      };
    });
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
    let plateNumbersInMaintenance = maintenance.map((e) => {
      return {
        id: new mongoose.Types.ObjectId(e.plate.value),
        equipmentCategory: e.plate.eqDescription,
        plateNumber: e.plate.text,
        status: "workshop",
      };
    });
    let plateNumbersNotInMaintenance = plateNumbers
      .filter((x) => {
        return !plateNumbersInMaintenance.some(
          (item) => item.plateNumber === x.plateNumber
        );
      })
      .map((availableEquipment) => ({
        id: new mongoose.Types.ObjectId(availableEquipment.id),
        equipmentCategory: availableEquipment.equipmentCategory,
        plateNumber: availableEquipment.plateNumber,
        status: "available",
      }));
    let makeOneArray = [
      ...plateNumbersInMaintenance,
      ...plateNumbersNotInMaintenance,
    ];

    // filter makeOneArray without tipper truck
    makeOneArray = makeOneArray.filter(
      (e) =>
        e.equipmentCategory !== "WALK-BEHIND" &&
        e.equipmentCategory !== "COMPRESSOR" &&
        e.equipmentCategory !== "STUMPER"
    );
    // SAVE DATA IN DATABASE
    // await EquipmentUtilization.model.insertMany(makeOneArray);
    const data = await EquipmentType.model.find();
    const table = await helper.generateEquipmentTable(data, makeOneArray);

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
  const start = moment(startdate).format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
  let { eqtypes } = req.query;
  eqtypes = !_.isEmpty(eqtypes) ? eqtypes.split(",") : [];
  startdate = new Date(startdate);
  enddate = new Date(enddate);
  startdate.setHours(0, 0, 0, 0);
  enddate.setHours(23, 59, 59, 0);

  console.log("@@@", startdate, enddate);
  try {
    let query;
    if (_.isEmpty(eqtypes)) {
      if (
        moment(startdate).format("YYYY-MM-DD") ===
        moment(enddate).format("YYYY-MM-DD")
      ) {
        console.log("1");
        query = {
          date: { $eq: start },
        };
      } else {
        console.log("2");
        query = {
          date: { $gte: startdate, $lte: enddate },
        };
      }
    } else {
      if (
        moment(startdate).format("YYYY-MM-DD") ===
        moment(enddate).format("YYYY-MM-DD")
      ) {
        console.log("3");
        query = {
          date: { $gte: startdate, $lte: enddate },
          equipmentCategory: { $in: eqtypes },
        };
      } else {
        console.log("4");
        query = {
          date: startdate,
          equipmentCategory: { $in: eqtypes },
        };
      }
    }
    let response;
    response = await EquipmentUtilization.model
      .find(query)
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

// CHANGE EQUIPMENT STATUS IF THERE IS DISPATCH SCHEDULED ON TODAY
async function changeEquipmentStatus(req, res) {
  const { NODE_ENV } = process.env;
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
  let dispatches = [];
  dispatches = await Work.model.find(query, {
    _id: 0,
    "equipment.plateNumber": 1,
    workStartDate: 1,
    workEndDate: 1,
  });
  // FILTER PLATE NUMBERS ONLY
  let plates = [];
  await Promise.all(
    dispatches.map(async (d, index) => {
      const card = await Maintenance.model.findOne(
        {
          "plate.text": d?.equipment?.plateNumber,
          jobCard_status: "opened",
        },
        {
          "plate.text": 1,
          status: 1,
        }
      );
      if (_.isNull(card)) {
        // IF THERE IS NO OPEN JOB CARD FOUND: GET EQUIPS TO BE UPDATED"
        plates.push(d?.equipment?.plateNumber);
      }
    })
  );
  if (plates.length > 0) {
    const equip = await Equipment.model.updateMany(
      {
        plateNumber: plates,
      },
      {
        $set: {
          eqStatus: "dispatched",
        },
      }
    );
  }
  if (NODE_ENV === "production") {
    console.log("Equipment status automatically updated to 'dispatched'");
  } else {
    return res.status(200).send(plates);
  }
}

async function checkEquipmentAvailabilityForDispatch(req, res) {
  let { date, shift } = req.params;
  let { workStartDate, workEndDate, siteWork } = req.query;
  if (siteWork !== "true") {
    workStartDate = date;
    workEndDate = date;
  }

  try {
    // 0. CHECK IF EQUIPMENT HAS
    // 1: GET A LIST OF DISPOSED EQUIPMENT
    let listDisposed = await getListOfDisposedEquipments();
    let listDisposedEquip = listDisposed?.map((e) => {
      return e.plateNumber;
    });
    // 3. GET LIST OF EQUIPMENT ON DUTY
    let equipmentOnDuty = await getListOfEquipmentOnDuty(
      new Date(workStartDate),
      new Date(workEndDate),
      shift,
      siteWork
    );
    let listEquipOnDuty = [];
    listEquipOnDuty = equipmentOnDuty?.map((e) => {
      return e.equipment.plateNumber;
    });
    // 2. GET LIST OF EQUIPMENT IN WORKSHOP
    let equipmentInWorkshop = await getListOfEquipmentInWorkshop();

    let listEquipInWorkshop = equipmentInWorkshop?.map((e) => {
      return e.plate.text;
    });

    // 4. COMBINED ALL LISTS
    let combined = _.uniq([
      ...listDisposedEquip,
      ...listEquipOnDuty,
      ...listEquipInWorkshop,
    ]);
    let availableEquipment = await Equipment.model.find({
      plateNumber: { $nin: combined },
    });
    res.status(200).send(availableEquipment);
  } catch (err) {
    console.log("ERR:", err);
    res.send(err);
  }
}

module.exports = {
  changeEquipmentStatus,
  captureEquipmentUtilization,
  getEquipmentUtilizationByDate,
  downloadEquipmentUtilizationByDates,
  checkEquipmentAvailabilityForDispatch,
};
