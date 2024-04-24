const Maintenance = require("../models/maintenance");
const Work = require("../models/workData");
const moment = require("moment");
const express = require("express");
const router = express.Router();
const MaintenanceController = require("../controllers/maintenance");

router.get("/maintenance/repair", async (req, res) => {
  const jobCards = await Maintenance.model.find();

  if (!jobCards)
    return res.status(404).json({ message: "No job cards available" });

  res.status(200).send(jobCards);
});

router.get("/maintenance", async (req, res) => {
  let { limit, page, status, search, download, startDate, endDate } = req.query;
  if (search?.length == 0) search = null;
  if (startDate == "null") startDate = null;
  if (endDate == "null") endDate = null;

  let query = {};
  query = {
    ...(status === "open" && !search && { status: { $nin: ["pass"] } }),
    ...(status !== "open" && status !== "all" && { status: { $eq: status } }),
    // ...(status == "all" && { status: { $eq: status } }),
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
  };

  let qStatus = status == "open" ? { $nin: ["pass"] } : { $eq: status };

  let openDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
    status: { $ne: "pass" },
  };

  let requisitionDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    status: { $eq: "requisition" },
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
  };

  let entryDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    status: { $eq: "entry" },
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
  };

  let diagnosisDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    status: { $eq: "diagnosis" },
  };
  let repairDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    status: { $eq: "repair" },
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
  };

  let testingDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    status: { $eq: "testing" },
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
  };
  let closedDataQuery = {
    ...(search && {
      $or: [
        {
          "plate.text": { $regex: search, $options: "i" },
        },
        {
          "plate.eqDescription": { $regex: search, $options: "i" },
        },
      ],
    }),
    status: { $eq: "pass" },
    ...(startDate && {
      entryDate: {
        $gte: moment(startDate).startOf("day"),
        $lte: moment(endDate).endOf("day"),
      },
    }),
  };

  const dataCount = await Maintenance.model.find(query).count({});
  const openDataCount = await Maintenance.model.find(openDataQuery).count({});
  const requisitionDataCount = await Maintenance.model
    .find(requisitionDataQuery)
    .count({});
  const entryDataCount = await Maintenance.model.find(entryDataQuery).count({});
  const diagnosisDataCount = await Maintenance.model
    .find(diagnosisDataQuery)
    .count({});
  const repairDataCount = await Maintenance.model
    .find(repairDataQuery)
    .count({});
  const testingDataCount = await Maintenance.model
    .find(testingDataQuery)
    .count({});
  const closedDataCount = await Maintenance.model
    .find(closedDataQuery)
    .count({});

  const jobCards =
    status !== "all" && download !== "1"
      ? await Maintenance.model
          .find(query)
          .sort({ jobCard_Id: -1 })
          .limit(limit)
          .skip(parseInt(page - 1) * limit)
      : await Maintenance.model.find(query).sort({ jobCard_Id: -1 });
  if (!jobCards)
    return res.status(404).json({ message: "No JobCards Available" });

  res.status(200).send({
    jobCards,
    dataCount,
    openDataCount,
    entryDataCount,
    diagnosisDataCount,
    repairDataCount,
    testingDataCount,
    closedDataCount,
    requisitionDataCount,
  });
  // res.status(200).send(jobCards)
});
router.post("/maintenance", async (req, res) => {
  MaintenanceController.createJobCard(req, res);
});

router.put("/maintenance/:id", async (req, res) => {
  MaintenanceController.updateJobCard(req, res);
});

router.get("/maintenance/inworkshop/:id", (req, res) => {
  MaintenanceController.equipmentWasInWorkshop(req, res);
});

module.exports = router;
