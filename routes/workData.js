const router = require("express").Router();
const NodeCache = require("node-cache");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const employeeData = require("../models/employees");
const assetAvblty = require("../models/assetAvailability");
const userData = require("../models/users");
const logData = require("../models/logs");
const eqData = require("../models/equipments");
const prjData = require("../models/projects");
const moment = require("moment");
const e = require("express");
const { default: mongoose, Types } = require("mongoose");
const send = require("../utils/sendEmailNode");
const { sendEmail } = require("./sendEmailRoute");
const logs = require("../models/logs");
const { getDeviceToken } = require("../controllers.js/employees");
const { getProject } = require("./projects");
const customers = require("../models/customers");
const MS_IN_A_DAY = 86400000;
const HOURS_IN_A_DAY = 8;
const ObjectId = require("mongoose").Types.ObjectId;
const works = require("../controllers/works");
const helper = require("./../helpers/checkExistDispatch");
const {
  checkIfEquipmentWasInWorkshop,
} = require("../helpers/availability/equipment");

const MaintenanceController = require("./../controllers/maintenance");
const { sendPushNotification } = require("../utils/sendNotification");

const DURATION_LIMIT = 16;
const cache = new NodeCache({ stdTTL: 7200 });

function isValidObjectId(id) {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
}

router.get("/", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    // res.status(200).send(workList.filter((w) => !_.isNull(w.driver)));
    res.status(200).send(
      workList.filter((w) => {
        w.workDone !== null;
      })
    );
  } catch (err) {
    res.send(err);
  }
});

router.get("/v2", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    // res.status(200).send(workList.filter((w) => !_.isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3", async (req, res) => {
  try {
    let workList = await workData.model
      .find({ workStartDate: { $gte: "2022-07-01" } })
      .select(
        `dispatch.targetTrips dispatch.drivers dispatch.astDrivers  dispatch.shift dispatch.date dispatch.otherJobType
        project.prjDescription project.customer
        equipment.plateNumber equipment.eqDescription equipment.assetClass equipment.eqtype equipment.eqOwner
        equipment.eqStatus equipment.millage equipment.rate equipment.supplieRate equipment.uom
        startTime endTime duration tripsDone totalRevenue totalExpenditure projectedRevenue status siteWork workStartDate workEndDate
        workDurationDays dailyWork startIndex endIndex comment moreComment rate uom _id 
        `
      )

      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("driver")
      .populate("createdBy", "firstName lastName")
      .populate("workDone", "jobDescription")
      .sort([["_id", "descending"]]);

    // res.status(200).send(workList.filter((w) => !_.isNull(w.driver)));
    return res.status(200).send(workList);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/filtered2", async (req, res) => {
  let { startDate, endDate, searchText } = req.query;

  try {
    let workList = await workData.model
      .find({
        $or: [
          {
            siteWork: true,
            workEndDate: {
              $gte: moment(startDate),
            },
          },

          {
            siteWork: false,
            workStartDate: {
              $gte: moment(startDate),
              $lte: moment(endDate)
                .add(23, "hours")
                .add(59, "minutes")
                .add(59, "seconds"),
            },
          },
        ],
      })
      .select(
        `dispatch.targetTrips dispatch.drivers dispatch.astDrivers  dispatch.shift dispatch.date dispatch.otherJobType
        project.prjDescription project.customer
        equipment.plateNumber equipment.eqDescription equipment.assetClass equipment.eqtype equipment.eqOwner
        equipment.eqStatus equipment.millage equipment.rate equipment.supplieRate equipment.uom
        startTime endTime duration tripsDone totalRevenue totalExpenditure projectedRevenue status siteWork workStartDate workEndDate
        workDurationDays dailyWork startIndex endIndex comment moreComment rate uom _id 
        `
      )
      .populate("driver")
      .populate("createdBy", "firstName lastName")
      .populate("workDone", "jobDescription")
      .sort([["_id", "descending"]]);

    return res.status(200).send(workList);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/filtered/:page", async (req, res) => {
  let {
    startDate,
    endDate,
    searchText,
    project,
    isVendor,
    vendorName,
    userType,
    companyName,
    userProject,
    userProjects,
  } = req.query;
  let { page } = req.params;
  let perPage = 15;
  let query = {};
  let searchByPlateNumber = searchText && searchText.length >= 1;
  let searchByProject = project && project.length >= 1;

  let projects =
    userType !== "vendor" ? userProjects && JSON.parse(userProjects) : [];
  let prjs = projects?.map((p) => {
    return p?.prjDescription;
  });
  switch (userType) {
    case "vendor":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },
              "equipment.eqOwner": vendorName,
            },
            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.eqOwner": vendorName,
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      }
      break;

    case "customer-admin":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },
              "project.customer": companyName,
            },
            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.customer": companyName,
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "project.customer": companyName,
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "project.customer": companyName,
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },
          ],
        };
      }
      break;

    case "customer-project-manager":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": { $in: prjs },
            },
            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      }
      break;

    case "customer-site-manager":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": { $in: prjs },
            },
            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      }
      break;

    default:
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },
            },
            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              workEndDate: {
                $gte: moment(startDate),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds"),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },
          ],
        };
      }
      break;
  }

  try {
    let fullWorkList = await workData.model.find(query).select(`workStartDate`);

    let dataCount = fullWorkList.length;

    let workList = await workData.model
      .find(query)
      .select(
        `dispatch.targetTrips dispatch.drivers dispatch.astDriver dispatch.shift dispatch.date dispatch.otherJobType
        project.prjDescription project.customer project._id
        equipment._id equipment.plateNumber equipment.eqDescription equipment.assetClass equipment.eqtype equipment.eqOwner
        equipment.eqStatus equipment.millage equipment.rate equipment.supplierRate equipment.uom
        startTime endTime duration tripsDone totalRevenue totalExpenditure projectedRevenue status siteWork workStartDate workEndDate
        workDurationDays dailyWork startIndex endIndex comment moreComment rate uom _id driver
        `
      )
      .populate("driver", "firstName lastName phone userType driver")
      .populate("createdBy", "firstName lastName")
      .populate("workDone", "jobDescription _id")
      .limit(perPage)
      .skip(parseInt(page - 1) * perPage)
      .sort([["_id", "descending"]]);

    res.status(200).send({ workList, dataCount });
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3/:vendorName", async (req, res) => {
  let { vendorName } = req.params;
  try {
    let workList = await workData.model
      .find(
        {},
        {
          "project.createdOn": false,
          "equipment.__v": false,
          "equipment.createdOn": false,
          "dispatch.project": false,
          "dispatch.equipments": false,
          "driver.password": false,
          "driver.email": false,
          "driver.createdOn": false,
          "driver.__v": false,
          "driver._id": false,
        }
      )

      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);

    // res.status(200).send(workList.filter((w) => !_.isNull(w.driver)));

    let filteredByVendor = workList.filter((w) => {
      return (
        // w.equipment.eqOwner === vendorName ||
        _.trim(w.driver.firstName) === _.trim(vendorName)
      );
    });
    res.status(200).send(filteredByVendor);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3/driver/:driverId", async (req, res) => {
  let { driverId } = req.params;
  try {
    let workList = await workData.model
      .find(
        {
          $or: [
            {
              "equipment.vendor": Types.ObjectId(driverId),
              status: { $nin: ["recalled", "released"] },
            },
            {
              driver: isValidObjectId(driverId) ? driverId : "123456789011",
              status: { $nin: ["recalled", "released"] },
            },
          ],
        },
        {
          "project.createdOn": false,
          "equipment.__v": false,
          "equipment.createdOn": false,
          "dispatch.project": false,
          "dispatch.equipments": false,
          "driver.password": false,
          "driver.email": false,
          "driver.createdOn": false,
          "driver.__v": false,
          "driver._id": false,
        }
      )
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);

    let listToSend = workList.filter(
      (w) =>
        w.siteWork === false ||
        (w.siteWork === true &&
          (w.status === "in progress" || w.status === "on going")) ||
        (w.siteWork === true &&
          _.filter(w.dailyWork, (dW) => {
            return dW.date === moment().format("DD-MMM-YYYY");
          }).length === 0)
    );
    // .filter(
    //   (w) =>
    //     // !_.isNull(w.driver) &&
    //     !_.isNull(w.workDone) && w.status !== "recalled"
    // );
    let siteWorkList = [];

    let l = listToSend.map((w) => {
      let work = null;

      if (w.siteWork && w.status !== "stopped" && w.status !== "recalled") {
        let dailyWorks = w.dailyWork;

        let datesPosted = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return {
              date: moment(d.date).startOf("day").format(),
              duration: d.duration,
              uom: d.uom,
            };
          });

        let datesPostedDatesOnly = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return moment(d.date).startOf("day").format();
          });

        let datesPendingPosted = dailyWorks
          .filter((d) => d.pending === true)
          .map((d) => {
            return moment(d.date).startOf("day").format();
          });

        let workStartDate = moment(w.workStartDate).startOf("day");
        let workDurationDays = w.workDurationDays;

        let datesArray = [];
        var endDate = workStartDate.clone().add(workDurationDays, "days");
        if (endDate.isAfter(moment())) endDate = moment().startOf("day");

        while (workStartDate.isSameOrBefore(endDate)) {
          datesArray.push(workStartDate.startOf("day").format());
          workStartDate.add(1, "day");
        }

        // let datesToPost = [workStartDate];
        // for (let i = 0; i < workDurationDays - 1; i++) {
        //   newDate = workStartDate.add(1, 'day');
        //   datesToPost.push(workStartDate.add(1, "days"));
        // }

        let dateNotPosted = datesArray.filter(
          (d) =>
            !_.includes(datesPostedDatesOnly, d) &&
            !_.includes(datesPendingPosted, d)
        );

        var uniqueDatesNotPosted = Array.from(new Set(dateNotPosted));
        uniqueDatesNotPosted.map((d) => {});

        datesPosted.map((dP) => {
          siteWorkList.push({
            workDone: w.workDone
              ? w.workDone
              : {
                  _id: "62690b67cf45ad62aa6144d8",
                  jobDescription: "Others",
                  eqType: "Truck",
                  createdOn: "2022-04-27T09:20:50.911Z",
                  __v: 0,
                },
            _id: w._id,
            status: "stopped",
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: new Date(dP.date).toISOString(),
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex
              ? parseFloat(w.startIndex).toFixed(2)
              : //  ? w.startIndex
                "0.0",
            millage: parseFloat(
              w.equipment.millage ? w.equipment.millage : 0
            ).toFixed(2),
            duration:
              dP.uom == "hour"
                ? _.round(dP.duration / (1000 * 60 * 60), 2) +
                  " " +
                  dP.uom +
                  "s"
                : dP.duration + " " + dP.uom + "s",
            dispatch: w.dispatch,
            // millage: w.equipment.millage ? w.equipment.millage : 0,
          });
        });

        uniqueDatesNotPosted.map((dNP) => {
          siteWorkList.push({
            workDone: w.workDone
              ? w.workDone
              : {
                  _id: "62690b67cf45ad62aa6144d8",
                  jobDescription: "Others",
                  eqType: "Truck",
                  createdOn: "2022-04-27T09:20:50.911Z",
                  __v: 0,
                },
            _id: w._id,
            status: "created",
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: new Date(dNP).toISOString(),
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex
              ? parseFloat(w.startIndex).toFixed(2)
              : // ?
                //   w.startIndex
                "0.0",
            millage: parseFloat(
              w.equipment.millage ? w.equipment.millage : 0
            ).toFixed(2),
            duration: 0 + " hours",
            dispatch: w.dispatch,
          });
        });

        datesPendingPosted.map((dPP) => {
          siteWorkList.push({
            workDone: w.workDone
              ? w.workDone
              : {
                  _id: "62690b67cf45ad62aa6144d8",
                  jobDescription: "Others",
                  eqType: "Truck",
                  createdOn: "2022-04-27T09:20:50.911Z",
                  __v: 0,
                },
            _id: w._id,
            status: "in progress",
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: new Date(dPP).toISOString(),
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex
              ? parseFloat(w.startIndex).toFixed(2)
              : //  ? w.startIndex
                "0.0",
            millage: parseFloat(
              w.equipment.millage ? w.equipment.millage : 0
            ).toFixed(2),
            duration: 0 + " hours",
            dispatch: w.dispatch,
            // millage: w.equipment.millage ? w.equipment.millage : 0,
          });
        });
      } else if (!w.siteWork) {
        work = {
          workDone: w.workDone
            ? w.workDone
            : {
                _id: "62690b67cf45ad62aa6144d8",
                jobDescription: "Others",
                eqType: "Truck",
                createdOn: "2022-04-27T09:20:50.911Z",
                __v: 0,
              },
          _id: w._id,
          status: w.status,
          project: w.project,
          createdOn: w.createdOn,
          equipment: w.equipment,
          siteWork: w.siteWork,
          targetTrips: w.dispatch.targetTrips ? w.dispatch.targetTrips : "N/A",
          workStartDate: w.workStartDate,
          dispatchDate: w.siteWork ? moment().toISOString() : w.dispatch.date,
          shift: w.dispatch.shift === "nightShift" ? "N" : "D",
          startIndex: w.startIndex
            ? parseFloat(w.startIndex).toFixed(2)
            : //  ? w.startIndex
              "0.0",
          millage: parseFloat(
            w.equipment.millage ? w.equipment.millage : 0
          ).toFixed(2),
          duration:
            w?.uom === "hour"
              ? _.round(w.duration / (1000 * 60 * 60), 2) + " " + w.uom + "s"
              : w.duration.toFixed(2) + " " + w.uom + "s",
          tripsDone: w.tripsDone,
          dispatch: w.dispatch,
          // millage: w.equipment.millage ? w.equipment.millage : 0,
        };
      }

      return work;
    });

    let finalList = l.concat(siteWorkList);

    let orderedList = _.orderBy(finalList, "dispatchDate", "desc");

    res.status(200).send(orderedList.filter((d) => !_.isNull(d)));
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3/toreverse/:plateNumber", async (req, res) => {
  let { plateNumber } = req.params;
  let { startDate, endDate } = req.query;
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 0);

  if (plateNumber && startDate && endDate) {
    try {
      let query = {
        $and: [
          {
            "equipment.plateNumber": { $regex: plateNumber.toUpperCase() },
            workStartDate: { $gte: moment(startDate) },
            workEndDate: { $lte: endDate },
          },
        ],
      };

      let workList = await workData.model
        .find(
          {
            "equipment.plateNumber": { $regex: plateNumber.toUpperCase() },
            workStartDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            "project.createdOn": false,
            "equipment.__v": false,
            "equipment.createdOn": false,
            "dispatch.project": false,
            "dispatch.equipments": false,
            "driver.password": false,
            "driver.email": false,
            "driver.createdOn": false,
            "driver.__v": false,
            "driver._id": false,
          }
        )
        .populate("equipment")
        .populate("driver")
        .populate("dispatch")
        .populate("appovedBy")
        .populate("createdBy")
        .populate("workDone")
        .sort([["_id", "descending"]]);

      let listToSend = workList;

      let siteWorkList = [];

      let l = listToSend.map((w) => {
        let work = null;

        if (w.siteWork === true) {
          let dailyWorks = w.dailyWork;

          let datesPosted = dailyWorks
            .filter((d) => d.pending === false && d.date !== "Invalid date")
            .map((d) => {
              return {
                _id: w._id,
                date: d.date,
                totalRevenue: d.totalRevenue,
                totalExpenditure: d.totalExpenditure,
                duration: d.duration,
                uom: d.uom,
                status: d.status ? d.status : "stopped",
              };
            });

          let datesPendingPosted = dailyWorks
            .filter((d) => d.pending === true)

            .map((d) => {
              return d.date;
            });
          datesPosted.map((dP) => {
            siteWorkList.push({
              _id: dP._id,
              driverName: w.driver
                ? w.driver?.firstName + " " + w.driver?.lastName
                : w.equipment?.eqOwner,
              owner: w.equipment?.eqOwner,
              totalRevenue:
                w?.equipment?.eqDescription === "TIPPER TRUCK"
                  ? // CHECK IBIBAZO BYA Panne
                    // CHECK uom = day
                    dP.duration * w?.equipment?.rate
                  : parseFloat(dP.totalRevenue).toFixed(2),
              totalExpenditure: parseFloat(dP.totalExpenditure).toFixed(2),
              duration:
                dP.uom === "hour"
                  ? dP.duration / (1000 * 60 * 60)
                  : dP.duration,
              status: dP.status,
              project: w.project,
              createdOn: w.createdOn,
              equipment: w.equipment,
              siteWork: w.siteWork,
              targetTrips: w.dispatch.targetTrips
                ? w.dispatch.targetTrips
                : "N/A",
              workStartDate: w.workStartDate,
              dispatchDate: new Date(dP.date).toISOString(),
              shift: w.dispatch.shift === "nightShift" ? "N" : "D",
              startIndex: w.startIndex
                ? parseFloat(w.startIndex).toFixed(2)
                : //  ? w.startIndex
                  "0.0",
              millage: parseFloat(
                w.equipment.millage ? w.equipment.millage : 0
              ).toFixed(2),
              // millage: w.equipment.millage ? w.equipment.millage : 0,
            });
          });
        } else {
          work = {
            _id: w._id,
            driverName: w.driver?.firstName + " " + w.driver?.lastName,
            owner: w.equipment.eqOwner,
            totalRevenue: parseFloat(w.totalRevenue).toFixed(2),
            totalExpenditure: parseFloat(w.totalExpenditure).toFixed(2),
            duration:
              w.equipment.uom === "hour"
                ? w.duration / (1000 * 60 * 60)
                : w.duration,
            status: w.status,
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: w.siteWork ? moment().toISOString() : w.dispatch.date,
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex
              ? parseFloat(w.startIndex).toFixed(2)
              : //  ? w.startIndex
                "0.0",
            millage: parseFloat(
              w.equipment.millage ? w.equipment.millage : 0
            ).toFixed(2),
          };
        }

        return work;
      });

      let finalList = l.concat(siteWorkList);

      let orderedList = _.orderBy(finalList, "dispatchDate", "desc");

      return res.status(200).send(orderedList.filter((d) => !_.isNull(d)));
    } catch (err) {
      return res.status(500).send(err);
    }
  } else {
    return res
      .send({
        error: true,
        message: "Please give all the query parameters!",
      })
      .status(204);
  }
});

router.get("/detailed/:canViewRevenues", async (req, res) => {
  let { canViewRevenues } = req.params;
  let {
    startDate,
    endDate,
    searchText,
    project,
    userType,
    userProject,
    userProjects,
    vendorName,
  } = req.query;

  let query = {
    $or: [
      {
        siteWork: true,
        status: { $ne: "recalled" },
        workEndDate: {
          $gte: new Date(startDate),
        },
      },
      {
        siteWork: false,
        status: { $ne: "recalled" },
        workStartDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    ],
  };
  let searchByPlateNumber = searchText && searchText.length >= 1;
  let searchByProject = project && project.length >= 1;

  let projects =
    userType !== "vendor" ? userProjects && JSON.parse(userProjects) : [];
  let prjs = projects?.map((p) => {
    return p?.prjDescription;
  });

  switch (userType) {
    case "vendor":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },
              "equipment.eqOwner": vendorName,
            },
            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.eqOwner": vendorName,
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "equipment.eqOwner": vendorName,
            },
          ],
        };
      }
      break;

    case "customer-admin":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },
              "project.customer": companyName,
            },
            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.customer": companyName,
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "project.customer": companyName,
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "project.customer": companyName,
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
              "project.customer": companyName,
            },
          ],
        };
      }
      break;

    case "customer-project-manager":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": { $in: prjs },
            },
            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      }
      break;

    case "customer-site-manager":
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": { $in: prjs },
            },
            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },

              "project.prjDescription": { $in: prjs },
            },
          ],
        };
      }
      break;

    default:
      if (!searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },
            },
            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
            },
          ],
        };
      } else if (searchByPlateNumber && !searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },
          ],
        };
      } else if (!searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
            },

            {
              siteWork: false,
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
            },
          ],
        };
      } else if (searchByPlateNumber && searchByProject) {
        query = {
          $or: [
            {
              siteWork: true,
              status: { $ne: "recalled" },
              workEndDate: {
                $gte: moment(startDate).toDate(),
              },

              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },

            {
              siteWork: false,
              status: { $ne: "recalled" },
              workStartDate: {
                $gte: moment(startDate).toDate(),
                $lte: moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
                  .toDate(),
              },
              "project.prjDescription": {
                $regex: project,
              },
              "equipment.plateNumber": {
                $regex: searchText.toUpperCase(),
              },
            },
          ],
        };
      }
      break;
  }

  try {
    let pipeline = [];

    pipeline = [
      {
        $match: query,
      },
      {
        $unwind: {
          path: "$dispatch.astDriver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$dispatch.astDriver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          turnboy: {
            $toObjectId: "$dispatch.astDriver",
          },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "turnboy",
          foreignField: "_id",
          as: "turnboy",
        },
      },
      {
        $unwind: {
          path: "$turnboy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          astDriver: {
            $addToSet: "$turnboy",
          },
          doc: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$doc",
              {
                turnBoy: "$astDriver",
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "driver",
          foreignField: "_id",
          as: "driver",
        },
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "jobtypes",
          localField: "workDone",
          foreignField: "_id",
          as: "workDone",
        },
      },
      {
        $unwind: {
          path: "$workDone",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "project.projectAdmin",
          foreignField: "_id",
          as: "projectAdmin",
        },
      },
      {
        $unwind: {
          path: "$projectAdmin",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    let workList = await workData.model.aggregate(pipeline);

    let listToSend = workList;

    let siteWorkList = [];

    let l = listToSend.map((w, index) => {
      let work = null;

      if (w.siteWork && w.status !== "stopped") {
        let dailyWorks = w.dailyWork;

        let datesPosted = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return {
              date: d.date,
              duration: d.duration,
              actualRevenue: d.totalRevenue,
              expenditure: d.totalExpenditure,
              status: d.status,
              rate: d.rate,
              fuel: d.fuel,
              comment: d.comment,
            };
          });

        let datePosted_Dates = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return d.date;
          });

        let datesPendingPosted = dailyWorks
          .filter((d) => d.pending === true)

          .map((d) => {
            return d.date;
          });
        let workStartDate = moment(w.workStartDate);
        let workDurationDays = w.workDurationDays;

        let datesToPost = [workStartDate.format("DD-MMM-YYYY")];
        for (let i = 0; i < workDurationDays - 1; i++) {
          datesToPost.push(workStartDate.add(1, "days").format("DD-MMM-YYYY"));
        }

        let dateNotPosted = datesToPost.filter(
          (d) =>
            !_.includes(datePosted_Dates, d) &&
            !_.includes(datesPendingPosted, d) &&
            moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
        );

        datesPosted.map((dP) => {
          if (
            moment(Date.parse(dP.date)).isSameOrAfter(moment(startDate)) &&
            moment(Date.parse(dP.date)).isSameOrBefore(
              moment(endDate)
                .add(23, "hours")
                .add(59, "minutes")
                .add(59, "seconds")
            )
          ) {
            siteWorkList.push({
              "Dispatch date": moment(Date.parse(dP.date)).format("M/D/YYYY"),
              "Posted On": moment(Date.parse(dP.date)).format("M/D/YYYY"),
              Shift: w.dispatch.shift === "nightShift" ? "N" : "D",
              "Site work": w.siteWork,
              Project: w.project?.prjDescription,
              "Plate number": w.equipment.plateNumber,
              "Equipment type": w.equipment?.eqDescription,
              Owner: w.equipment?.eqOwner,
              UOM: w.equipment?.uom,
              "Duration (HRS)":
                w.equipment?.uom === "hour"
                  ? _.round(dP.duration / (60 * 60 * 1000), 2)
                  : 0,
              "Duration (DAYS)":
                w.equipment?.uom === "day" ? _.round(dP.duration, 2) : 0,
              "Work done": w?.workDone ? w?.workDone?.jobDescription : "Others",
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Projected Revenue":
                  w.equipment?.uom === "hour" ? dP?.rate * 5 : dP?.rate,
                "Actual Revenue":
                  w.equipment?.uom === "hour"
                    ? _.round(dP.duration / (60 * 60 * 1000), 2) * dP.rate
                    : w?.equipment?.eqDescription === "TIPPER TRUCK" &&
                      dP.comment === "Ibibazo bya panne"
                    ? dP.duration * w?.equipment?.rate
                    : (dP.duration > 0 ? 1 : 0) * dP.rate,
                "Vendor payment": dP.expenditure,
              }),
              "Driver Names": w.driver
                ? w?.driver?.firstName + " " + w?.driver?.lastName
                : "",
              "Driver contacts": w.driver ? w.driver.phone : "",
              Comment: dP.comment
                ? dP.comment + " - " + (dP.moreComment ? dP.moreComment : "")
                : " ",
              "Target trips": w.dispatch?.targetTrips
                ? w.dispatch?.targetTrips
                : 0,
              "Trips done": w?.tripsDone ? w?.tripsDone : 0,
              Customer: w.project?.customer,
              Status: dP.status || "stopped",
              Fuel: dP?.fuel || "",
              "Start index": w?.startIndex || 0,
              "End index": w?.endIndex || 0,
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Project Admin":
                  (w.projectAdmin?.firstName || "") +
                  " " +
                  (w.projectAdmin?.lastName || ""),
              }),
            });
          }
        });

        dateNotPosted.map((dNP) => {
          if (
            moment(Date.parse(dNP)).isSameOrAfter(moment(startDate)) &&
            moment(Date.parse(dNP)).isSameOrBefore(
              moment(endDate)
                .add(23, "hours")
                .add(59, "minutes")
                .add(59, "seconds")
            )
          ) {
            siteWorkList.push({
              "Dispatch date": moment(Date.parse(dNP)).format("M/D/YYYY"),
              "Posted On": "",
              Shift: w.dispatch.shift === "nightShift" ? "N" : "D",
              "Site work": w.siteWork,
              Project: w?.project?.prjDescription,
              "Plate number": w.equipment.plateNumber,
              "Equipment type": w.equipment?.eqDescription,
              Owner: w.equipment?.eqOwner,
              UOM: w.equipment?.uom,
              "Duration (HRS)": 0,
              "Duration (DAYS)": 0,
              "Work done": w?.workDone ? w?.workDone?.jobDescription : "Others",
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Projected Revenue":
                  w.equipment?.uom === "hour"
                    ? w.equipment?.rate * 5
                    : w.equipment?.rate,
                "Actual Revenue": 0,
                "Vendor payment": 0,
              }),
              "Driver Names": w.driver
                ? w?.driver?.firstName + " " + w?.driver?.lastName
                : "",
              "Driver contacts": w.driver?.phone ? w.driver?.phone : " ",
              Comment: dNP.comment
                ? dNP.comment + " - " + (dNP.moreComment ? dNP.moreComment : "")
                : " ",
              "Target trips": w.dispatch?.targetTrips
                ? w.dispatch?.targetTrips
                : 0,
              "Trips done": 0,
              Customer: w.project?.customer,
              Status: "created",
              Fuel: dNP?.fuel || "",
              "Start index": w?.startIndex || 0,
              "End index": w?.endIndex || 0,
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Project Admin":
                  (w.projectAdmin?.firstName || "") +
                  " " +
                  (w.projectAdmin?.lastName || ""),
              }),
            });
          }
        });

        datesPendingPosted.map((dPP) => {
          if (
            moment(Date.parse(dPP)).isSameOrAfter(moment(startDate)) &&
            moment(Date.parse(dPP)).isSameOrBefore(
              moment(endDate)
                .add(23, "hours")
                .add(59, "minutes")
                .add(59, "seconds")
            )
          ) {
            siteWorkList.push({
              "Dispatch date": moment(Date.parse(dPP)).format("M/D/YYYY"),
              "Posted On": "",
              Shift: w.dispatch.shift === "nightShift" ? "N" : "D",
              "Site work": w.siteWork,
              Project: w.project.prjDescription,
              "Plate number": w.equipment.plateNumber,
              "Equipment type": w.equipment?.eqDescription,
              UOM: w.equipment?.uom,
              "Duration (HRS)": 0,
              "Duration (DAYS)": 0,
              "Work done": w?.workDone ? w?.workDone?.jobDescription : "Others",
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Projected Revenue":
                  w.equipment?.uom === "hour"
                    ? w.equipment?.rate * 5
                    : w.equipment?.rate,
                "Actual Revenue": 0,
                "Vendor payment": 0,
              }),
              "Driver Names": w.driver
                ? w?.driver?.firstName + " " + w?.driver?.lastName
                : "",
              "Driver contacts": w.driver ? w.driver?.phone : " ",
              "Target trips": w.dispatch?.targetTrips
                ? w.dispatch?.targetTrips
                : 0,
              "Trips done": 0,
              Comment: dPP.comment
                ? dPP.comment + " - " + (dPP.moreComment ? dPP.moreComment : "")
                : " ",
              Customer: w.project?.customer,
              Status: "in progress",
              Fuel: dPP?.fuel || "",
              "Start index": w?.startIndex || 0,
              "End index": w?.endIndex || 0,
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Project Admin":
                  (w.projectAdmin?.firstName || "") +
                  " " +
                  (w.projectAdmin?.lastName || ""),
              }),
            });
          }
        });
      } else if (w.siteWork === true && w.status === "stopped") {
        let dailyWorks = w.dailyWork;

        let datesPosted = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return {
              date: d.date,
              duration: d.duration,
              actualRevenue: d.totalRevenue,
              expenditure: d.totalExpenditure,
              rate: d.rate,
              fuel: d.fuel,
              comment: d.comment,
            };
          });

        let datePosted_Dates = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return d.date;
          });

        let datesPendingPosted = dailyWorks
          .filter((d) => d.pending === true)

          .map((d) => {
            return d.date;
          });
        let workStartDate = moment(w.workStartDate);
        let workDurationDays = w.workDurationDays;

        let datesToPost = [workStartDate.format("DD-MMM-YYYY")];
        for (let i = 0; i < workDurationDays - 1; i++) {
          datesToPost.push(workStartDate.add(1, "days").format("DD-MMM-YYYY"));
        }

        let dateNotPosted = datesToPost.filter(
          (d) =>
            !_.includes(datePosted_Dates, d) &&
            !_.includes(datesPendingPosted, d) &&
            moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
        );
        datesPosted.map((dP) => {
          if (
            moment(Date.parse(dP.date)).isSameOrAfter(moment(startDate)) &&
            moment(Date.parse(dP.date)).isSameOrBefore(
              moment(endDate)
                .add(23, "hours")
                .add(59, "minutes")
                .add(59, "seconds")
            )
          ) {
            siteWorkList.push({
              "Dispatch date": moment(Date.parse(dP.date)).format("M/D/YYYY"),
              "Posted On": moment(Date.parse(dP.date)).format("M/D/YYYY"),
              Shift: w.dispatch.shift === "nightShift" ? "N" : "D",
              "Site work": w.siteWork,
              Project: w.project?.prjDescription,
              "Plate number": w.equipment.plateNumber,
              "Equipment type": w.equipment?.eqDescription,
              Owner: w.equipment?.eqOwner,
              UOM: w.equipment?.uom,
              "Duration (HRS)":
                w.equipment?.uom === "hour"
                  ? _.round(dP.duration / (60 * 60 * 1000), 2)
                  : 0,
              "Duration (DAYS)":
                w.equipment?.uom === "day" ? _.round(dP.duration, 2) : 0,
              "Work done": w?.workDone ? w?.workDone?.jobDescription : "Others",
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Projected Revenue":
                  w.equipment?.uom === "hour" ? dP.rate * 5 : dP.rate,
                "Actual Revenue":
                  w.equipment?.uom === "hour"
                    ? _.round(dP.duration / (60 * 60 * 1000), 2) * dP.rate
                    : w?.equipment?.eqDescription === "TIPPER TRUCK" &&
                      dP.comment === "Ibibazo bya panne"
                    ? dP.duration * w?.equipment?.rate
                    : (dP.duration > 0 ? 1 : 0) * dP.rate,
                "Vendor payment":
                  w.equipment?.uom === "hour"
                    ? _.round(dP.duration / (60 * 60 * 1000), 2) *
                      w?.equipment?.supplierRate
                    : (dP.duration > 0 ? 1 : 0) * w?.equipment?.supplierRate,
              }),
              "Driver Names": w.driver
                ? w?.driver?.firstName + " " + w?.driver?.lastName
                : "",
              "Driver contacts": w.driver ? w.driver?.phone : "",
              "Target trips": w.dispatch?.targetTrips
                ? w.dispatch?.targetTrips
                : 0,
              "Trips done": w?.tripsDone ? w?.tripsDone : 0,
              Comment: dP.comment
                ? dP.comment + " - " + (dP.moreComment ? dP.moreComment : "")
                : " ",
              Customer: w.project?.customer,
              Status: "stopped",
              Fuel: dP?.fuel || "",
              "Start index": w?.startIndex || 0,
              "End index": w?.endIndex || 0,
              ...((canViewRevenues === "true" || canViewRevenues === true) && {
                "Project Admin":
                  (w.projectAdmin?.firstName || "") +
                  " " +
                  (w.projectAdmin?.lastName || ""),
              }),
            });
          }
        });
      } else if (w.siteWork === false) {
        if (
          moment(Date.parse(w.dispatch.date)).isSameOrAfter(
            moment(startDate)
          ) &&
          moment(Date.parse(w.dispatch.date)).isSameOrBefore(
            moment(endDate)
              .add(23, "hours")
              .add(59, "minutes")
              .add(59, "seconds")
          )
        ) {
          work = {
            "Dispatch date": w.siteWork
              ? moment().format("M/D/YYYY")
              : moment(Date.parse(w.dispatch.date)).format("M/D/YYYY"),
            "Posted On": moment(Date.parse(w.createdOn)).format("M/D/YYYY"),
            Shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            "Site work": w.siteWork,
            Project: w.project.prjDescription,
            "Plate number": w.equipment.plateNumber,
            "Equipment type": w.equipment?.eqDescription,
            Owner: w.equipment?.eqOwner,
            UOM: w.equipment?.uom,
            "Duration (HRS)":
              w.equipment?.uom === "hour"
                ? _.round(w.duration / (60 * 60 * 1000), 2)
                : 0,
            "Duration (DAYS)":
              w.equipment?.uom === "day" ? _.round(w.duration, 2) : 0,
            "Work done": w?.workDone ? w?.workDone?.jobDescription : "Others",
            ...((canViewRevenues === "true" || canViewRevenues === true) && {
              "Projected Revenue":
                w.equipment?.uom === "hour"
                  ? w.equipment?.rate * 5
                  : w.equipment?.rate,
              "Actual Revenue": w.totalRevenue,
              "Vendor payment": w.totalExpenditure,
            }),
            "Driver Names": w.driver
              ? w?.driver?.firstName + " " + w?.driver?.lastName
              : "",
            "Driver contacts": w.driver ? w.driver?.phone : "",
            "Target trips": w.dispatch?.targetTrips,
            "Trips done": w?.tripsDone,
            Fuel: w?.fuel || "",
            Comment: w.comment
              ? w.comment
              : "" + " - " + (w.moreComment ? w.moreComment : ""),
            Customer: w.project?.customer,
            Status: w.status,
            "Start index": w?.startIndex || 0,
            "End index": w?.endIndex || 0,
            ...((canViewRevenues === "true" || canViewRevenues === true) && {
              "Project Admin":
                (w.projectAdmin?.firstName || "") +
                " " +
                (w.projectAdmin?.lastName || ""),
            }),
          };
        }
      }

      return work;
    });
    let finalList = l.concat(siteWorkList);

    let orderedList = _.orderBy(finalList, "Dispatch date", "desc");

    return res.status(200).send(orderedList.filter((w) => w !== null));
  } catch (err) {
    return res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  // return;
  try {
    let work = await workData.model
      .findById(id)
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone");

    return res.status(200).send(work);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/monthlyRevenuePerProject/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { status } = req.query;

  let pipeline = [
    {
      $match: {
        "project.prjDescription": projectName,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            "dailyWork.status": status,
          },
          {
            status: status,
          },
        ],
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          month: {
            $month: "$transactionDate",
          },
          year: {
            $year: "$transactionDate",
          },
        },
        validatedValue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
      },
    },
    {
      $sort: {
        "_id.month": 1,
      },
    },
  ];

  try {
    let monthlyRevenues = await workData.model.aggregate(pipeline);
    return res.send(monthlyRevenues);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/monthlyValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  try {
    let result = await getValidatedRevenuesByProject(projectName);
    return res.send(result);
  } catch (error) {
    return res.status(503).send({ error: "Error occurred, try again later" });
  }
});

router.get("/monthlyNonValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  try {
    let result = await getNonValidatedRevenuesByProject(projectName);
    return res.status(200).send(result);
  } catch (error) {
    return res.status(503).send({ error: "Error occurred, try again later" });
  }
});

router.get("/monthlyNotPosted/:vendorId", async (req, res) => {
  let { vendorId } = req.params;
  // let result = await getNotPostedRevenuedByProject(vendorId);
  try {
    let result = await getNotPostedRevenuedByVendor(vendorId);

    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/dailyValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  try {
    let result = await getDailyValidatedRevenues(projectName, month, year);

    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/dailyNonValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  try {
    let result = await getDailyNonValidatedRevenues(projectName, month, year);

    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/dailyNotPostedRevenues/:userId", async (req, res) => {
  let { userId } = req.params;
  let { month, year } = req.query;

  try {
    let result = await getDailyNotPostedRevenues(month, year, userId);
    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/validatedList/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  try {
    let result = await getValidatedListByProjectAndMonth(
      projectName,
      month,
      year
    );

    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/nonValidatedList/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  try {
    let result = await getNonValidatedListByProjectAndMonth(
      projectName,
      month,
      year
    );

    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/validatedByDay/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { transactionDate } = req.query;
  try {
    let result = await getValidatedListByDay(projectName, transactionDate);

    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/nonValidatedByDay/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { transactionDate } = req.query;
  try {
    let result = await getNonValidatedListByDay(projectName, transactionDate);
    return res.status(200).send(result);
  } catch (error) {
    return res.status(503).status({
      error: "Some error occurred, try again later or contact administrator",
    });
  }
});

router.get("/notPostedByDay/:userId", async (req, res) => {
  let { userId } = req.params;
  let { transactionDate } = req.query;
  try {
    let result = await getNotPostedListByDay(userId, transactionDate);
    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get(
  "/detailed/monthlyRevenuePerProject/:projectName",
  async (req, res) => {
    let { projectName } = req.params;
    let { status } = req.body;

    let pipeline = [
      {
        $match: {
          "project.prjDescription": projectName,
        },
      },
      {
        $unwind: {
          path: "$dailyWork",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              "dailyWork.status": status,
            },
            {
              status: status,
            },
          ],
        },
      },
      {
        $addFields: {
          transactionDate: {
            $cond: {
              if: {
                $eq: ["$siteWork", false],
              },
              then: "$workStartDate",
              else: {
                $dateFromString: {
                  dateString: "$dailyWork.date",
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          newTotalRevenue: {
            $cond: {
              if: {
                $eq: ["$siteWork", false],
              },
              then: "$totalRevenue",
              else: "$dailyWork.totalRevenue",
            },
          },
        },
      },
    ];

    try {
      let monthlyRevenues = await workData.model.aggregate(pipeline);
      return res.send(monthlyRevenues);
    } catch (err) {
      return res.status(500).send(err);
    }
  }
);

router.get("/monthlyNotPosted/:vendorId", async (req, res) => {
  let { vendorId } = req.params;
  try {
    let result = await getNotPostedRevenuedByVendor(vendorId);

    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.get("/dailyNotPostedRevenues/:userId", async (req, res) => {
  let { userId } = req.params;
  let { month, year } = req.query;

  try {
    let result = await getDailyNotPostedRevenues(month, year, userId);
    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: "Error occurred, try again later" });
  }
});

router.post("/", async (req, res) => {
  const isExist = await helper.checkExistDispatch(req.body);
  console.log("init:1", isExist);
  if (isExist.length > 0) {
    let message = [];
    isExist.map((e) => {
      if (e.siteWork) {
        message.push(
          `Site work from ${moment(e.workStartDate).format(
            "MMM DD, YYYY"
          )} to ${moment(e.workEndDate).format("MMM DD, YYYY")}`
        );
      } else {
        message.push(
          `Single dispatch on ${moment(e.workStartDate).format("MMM DD, YYYY")}`
        );
      }
    });
    return res.status(409).send({
      error: `We can not create a dispatch when there is one or more dispatches with same equipment, shift and date: Please check the following dates: ${message.toString()}`,
    });
  }
  try {
    // start creating a dispatch
    let workToCreate = new workData.model(req.body);
    // IF EQUIPMENT IS STANDBY OR DISPATCHED, PROCEED
    let equipment = await eqData.model.findOne({
      _id: workToCreate?.equipment?._id,
      eqStatus: { $ne: "disposed" },
    });
    if (_.isEmpty(equipment)) {
      return res.status(404).send({
        error: `Equipment is not available to be dispatched, contact administrator`,
      });
    }
    if (moment(req.body.workStartDate).isSame(moment(), "day")) {
      equipment.eqStatus = "dispatched";
    }
    equipment.assignedToSiteWork = req.body?.siteWork;
    equipment.assignedDate = moment(req.body?.workStartDate).format(
      "YYYY-MM-DD"
    );
    equipment.assignedEndDate = moment(req.body?.workEndDate).format(
      "YYYY-MM-DD"
    );
    equipment.assignedShift = req.body?.dispatch?.shift;
    let driver = req.body?.driver === "NA" ? null : req.body?.driver;
    let driverData = await userData.model.findById(driver);

    let rate = parseInt(equipment.rate);
    let uom = equipment.uom;
    let revenue = 0;
    let siteWork = req.body?.siteWork;
    let workDurationDays = req.body?.workDurationDays;

    await equipment.save();

    workToCreate.equipment = equipment;
    if (uom === "hour") revenue = rate * 5;
    if (uom === "day") revenue = rate;

    // workToCreate.totalRevenue = revenue;
    workToCreate.projectedRevenue = siteWork
      ? revenue * workDurationDays
      : revenue;

    workToCreate.driver = driver;
    let workCreated = await workToCreate.save();

    //log saving
    let log = {
      action: "DISPATCH CREATED",
      doneBy: req.body.createdBy,
      payload: workToCreate,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    let today = moment().format("DD-MMM-YYYY");
    let dateData = await assetAvblty.model.findOne({ date: today });
    let dispatched = await eqData.model.find({
      eqStatus: "dispatched",
      eqOwner: "Construck",
    });

    let standby = await eqData.model.find({
      eqStatus: "standby",
      eqOwner: "Construck",
    });

    if (dateData) {
      dateData.dispatched = dispatched.length;
      dateData.standby = standby.length;

      await dateData.save();
    } else {
      let dateDataToSave = new assetAvblty.model({
        date: today,
        dispatched: dispatched.length,
        standby: standby.length,
      });

      await dateDataToSave.save();
    }

    let driverNotification = `${
      driverData?.firstName + " " + driverData?.lastName
    } Muhawe akazi kuri ${req.body?.project?.prjDescription} taliki ${moment(
      req.body?.workStartDate
    ).format("DD-MMM-YYYY")} - ${req.body?.dispatch?.shift}, muzakoresha ${
      workToCreate?.equipment?.eqDescription
    } ${workToCreate?.equipment?.plateNumber}`;

    let driverToken = await getDeviceToken(driver);
    console.log("driverNotification", driverNotification);

    if (driverToken !== "none") {
      sendPushNotification(driverToken, {
        title: "New Dispatch!",
        body: driverNotification,
      });
    }

    return res.status(201).send(workCreated);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    return res.status(500).send({
      error,
      key,
    });
  }
});

router.post("/mobileData", async (req, res) => {
  try {
    let bodyData = {
      project: JSON.parse(req.body.project),
      equipment: JSON.parse(req.body.equipment),
      workDone: req.body.workDone,
      startIndex: req.body.startIndex,
      endIndex: req.body.endIndex,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      rate: req.body.rate,
      driver: req.body.driver,
      status: req.body.status,
      duration: req.body.duration,
      comment: req.body.comment,
      siteWork: req.body.siteWork === "yes" ? true : false,
    };
    let workToCreate = new workData.model(bodyData);

    let equipment = await eqData.model.findById(workToCreate?.equipment?._id);
    if (equipment.eqStatus === "standby") {
      // Save data only when equipment is available
      equipment.eqStatus = "dispatched";
      equipment.assignedToSiteWork = true;
      equipment.assignedDate = req.body?.dispatch?.date;
      equipment.assignedShift = req.body?.dispatch?.shift;

      let driver = req.body?.driver === "NA" ? null : req.body?.driver;

      let employee = await employeeData.model.findById(driver);
      if (employee) employee.status = "dispatched";

      let rate = parseInt(equipment.rate);
      let uom = equipment.uom;
      let revenue = 0;
      let siteWork = bodyData?.siteWork;
      let workDurationDays =
        moment(bodyData.endTime).diff(moment(bodyData.startTime)) / MS_IN_A_DAY;

      await equipment.save();
      if (employee) await employee.save();

      workToCreate.equipment = equipment;
      workToCreate.workDurationDays = workDurationDays;
      if (uom === "hour") revenue = rate * 5;
      if (uom === "day") revenue = rate;

      // workToCreate.totalRevenue = revenue;
      workToCreate.projectedRevenue = siteWork
        ? revenue * workDurationDays
        : revenue;

      workToCreate.driver = driver;
      let workCreated = await workToCreate.save();

      //log saving
      let log = {
        action: "DISPATCH CREATED",
        doneBy: req.body.createdBy,
        payload: req.body,
      };

      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      return res.status(201).send(workCreated);
    } else {
      return res.status(201).send(bodyData);
    }
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    return res.status(500).send({
      error,
      key,
    });
  }
});

router.post("/getAnalytics", async (req, res) => {
  let { ignoreCache } = req.query;
  ignoreCache = parseInt(ignoreCache) || 0;
  const cacheKey = "dispatches-analytics-dashboard-cache-key";
  const cachedData = cache.get(cacheKey);
  console.log("ignoreCache", ignoreCache);
  if (ignoreCache !== 1 && !_.isEmpty(cachedData)) {
    return res.status(200).send(cachedData);
  }

  let { startDate, endDate, status, customer, project, equipment, owner } =
    req.body;

  let total = 0;
  let totalRevenue = 0;
  let projectedRevenue = 0;
  let totalDays = 0;
  let daysDiff = _.round(
    moment(endDate).diff(moment(startDate)) / MS_IN_A_DAY,
    0
  );
  try {
    let workList = await workData.model.find({}).or([
      {
        siteWork: true,
        workEndDate: {
          $gte: moment(startDate),
        },
      },
      {
        siteWork: false,
        workStartDate: {
          $gte: moment(startDate),
          $lte: moment(endDate)
            .add(23, "hours")
            .add(59, "minutes")
            .add(59, "seconds"),
        },
      },
    ]);

    if (workList && workList.length > 0) {
      total = 0;

      let list = [];

      if (customer?.length >= 1) {
        customer.map((c) => {
          let l = workList.filter((w) => {
            let nameLowerCase = w?.project?.customer?.toLowerCase();
            return nameLowerCase.includes(c?.toLowerCase());
          });

          list.push(...l);
        });
      } else {
        list = workList;
      }

      if (project?.length >= 1) {
        let pList = [];
        project.map((p) => {
          let l = list.filter((w) => {
            let descLowerCase = w?.project?.prjDescription;
            return descLowerCase.includes(p);
          });
          pList.push(...l);
        });
        list = pList;
      }

      if (equipment?.length >= 1) {
        let eList = [];
        equipment.map((e) => {
          let l = list.filter((w) => {
            let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
            return plateLowerCase.includes(e.toLowerCase());
          });
          eList.push(...l);
        });
        list = eList;
      }

      if (owner) {
        list = list.filter((w) => {
          let ownerLowercase = w?.equipment?.eqOwner?.toLowerCase();
          if (owner.toLowerCase() === "construck")
            return ownerLowercase === "construck";
          else if (owner.toLowerCase() === "hired")
            return ownerLowercase !== "construck";
          else return true;
        });
      }

      list.map((w) => {
        //PStart and PEnd are before range start
        //days diff=0
        let case1 =
          moment(w.workStartDate).diff(moment(startDate)) < 0 &&
          moment(w.workEndDate).diff(
            moment(endDate)
              .add(23, "hours")
              .add(59, "minutes")
              .add(59, "seconds")
          ) < 0;

        //PStart before RangeStart and PEnd after RangeStart and PEnd before RangeEnd
        //day diff = PEnd - RangeStart
        let case2 =
          moment(w.workStartDate).diff(moment(startDate)) < 0 &&
          moment(w.workEndDate).diff(moment(startDate)) > 0 &&
          moment(w.workEndDate).diff(
            moment(endDate)
              .add(23, "hours")
              .add(59, "minutes")
              .add(59, "seconds")
          ) < 0;

        //PStart before to RangeStart and PEnd After RangeEnd
        // OR
        //PStart equal to RangeStart and PEnd equal RangeEnd
        //OR
        //PStart equal to RangeStart and PEnd after RangeEnd
        //days diff = RangeEnd - RangeStart
        let case3 =
          moment(w.workStartDate).diff(moment(startDate)) <= 0 &&
          moment(w.workEndDate).diff(
            moment(endDate)
              .add(23, "hours")
              .add(59, "minutes")
              .add(59, "seconds")
          ) >= 0;

        //PStart after RangeStart and PEnd before RangeEnd
        //days diff = PEnd-PStart
        let case4 =
          moment(w.workStartDate).diff(moment(startDate)) > 0 &&
          moment(w.workEndDate).diff(
            moment(endDate)
              .add(23, "hours")
              .add(59, "minutes")
              .add(59, "seconds")
          ) < 0;

        //PStart after RangeStart and PEnd after RangeEnd
        //days diff = RangeEnd - PStart
        let case5 =
          moment(w.workStartDate).diff(moment(startDate)) > 0 &&
          moment(w.workEndDate).diff(
            moment(endDate)
              .add(23, "hours")
              .add(59, "minutes")
              .add(59, "seconds")
          ) > 0 &&
          moment(endDate).diff(moment(w.workStartDate)) > 0;

        if (case1) {
          daysDiff = 0;
        } //days diff=0
        else if (case2) {
          //day diff = PEnd - RangeStart
          daysDiff = _.round(
            moment(w.workEndDate).diff(moment(startDate), "days"),
            0
          );
        } else if (case3) {
          //days diff = RangeEnd - RangeStart
          daysDiff = _.round(
            moment(endDate).diff(moment(startDate), "days"),
            0
          );
        } else if (case4) {
          {
            //days diff = PEnd-PStart
            daysDiff = _.round(
              moment(w.workEndDate).diff(moment(w.workStartDate), "days"),
              0
            );
          }
        } else if (case5) {
          //days diff = RangeEnd - PStart
          daysDiff = _.round(
            moment(endDate).diff(moment(w.workStartDate), "days"),
            0
          );
        } else {
          daysDiff = _.round(
            moment(endDate).diff(moment(startDate), "days"),
            0
          );
        }

        if (daysDiff < 0) daysDiff = 0;

        let isSiteWork = w.siteWork;
        let datesWithRevenue = [];
        let logs = [];
        if (isSiteWork) {
          let dailyWork = w.dailyWork;

          let datesPosted = dailyWork
            .filter((d) => d.pending === false)
            .map((d) => {
              return {
                date: d.date,
                duration: d.duration,
                totalRevenue: d.totalRevenue,
                expenditure: d.totalExpenditure,
              };
            });

          let datePosted_Dates = dailyWork
            .filter((d) => d.pending === false)
            .map((d) => {
              return d.date;
            });

          let datesPendingPosted = dailyWork
            .filter((d) => d.pending === true)

            .map((d) => {
              return d.date;
            });
          let workStartDate = moment(w.workStartDate);
          let workDurationDays = w.workDurationDays;

          let datesToPost = [workStartDate.format("DD-MMM-YYYY")];
          for (let i = 0; i < workDurationDays - 1; i++) {
            datesToPost.push(
              workStartDate.add(1, "days").format("DD-MMM-YYYY")
            );
          }

          let dateNotPosted = datesToPost.filter((d) => {
            return (
              !_.includes(datePosted_Dates, d) &&
              !_.includes(datesPendingPosted, d) &&
              moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
            );
          });

          let postedDates = dailyWork.filter((d) => d.pending === false);

          datesPosted?.map((p) => {
            if (
              moment(p.date, "DD-MMM-YYYY").isSameOrAfter(moment(startDate)) &&
              moment(p.date, "DD-MMM-YYYY").isSameOrBefore(
                moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
              )
            ) {
              totalRevenue = totalRevenue + p.totalRevenue;
              if (w.status !== "recalled") {
                projectedRevenue =
                  projectedRevenue +
                  parseInt(
                    w.equipment?.uom === "hour"
                      ? w.equipment?.rate * 5
                      : w.equipment?.rate
                  );
                logs.push({
                  seq: 1,
                  id: w._id,
                  date: p.date,
                  totalRevenue: p.totalRevenue,
                  plate: w.equipment.plateNumber,
                  projectedRevenue:
                    w.equipment?.uom === "hour"
                      ? w.equipment?.rate * 5
                      : w.equipment?.rate,
                });
              }
            }
          });

          dateNotPosted?.map((p) => {
            if (
              moment(p, "DD-MMM-YYYY").isSameOrAfter(moment(startDate)) &&
              moment(p, "DD-MMM-YYYY").isSameOrBefore(
                moment(endDate)
                  .add(23, "hours")
                  .add(59, "minutes")
                  .add(59, "seconds")
              )
            ) {
              totalRevenue = totalRevenue + 0;
              if (w.status !== "recalled") {
                projectedRevenue =
                  projectedRevenue +
                  parseInt(
                    w.equipment?.uom === "hour"
                      ? w.equipment?.rate * 5
                      : w.equipment?.rate
                  );

                logs.push({
                  seq: 2,
                  id: w._id,
                  date: p,
                  totalRevenue: 0,
                  plate: w.equipment.plateNumber,
                  projectedRevenue:
                    w.equipment?.uom === "hour"
                      ? w.equipment?.rate * 5
                      : w.equipment?.rate,
                });
              }
            }
          });
        } else {
          if (
            moment(w.dispatch.date).isSameOrAfter(moment(startDate)) &&
            moment(w.dispatch.date).isSameOrBefore(
              moment(endDate)
                .add(23, "hours")
                .add(59, "minutes")
                .add(59, "seconds")
            )
          ) {
            totalRevenue = totalRevenue + w.totalRevenue;
            if (w.status !== "recalled") {
              projectedRevenue =
                projectedRevenue +
                parseInt(
                  w.equipment?.uom === "hour"
                    ? w.equipment?.rate * 5
                    : w.equipment?.rate
                );
              logs.push({
                seq: 3,
                id: w._id,
                date: w.dispatch.date,
                totalRevenue: w.totalRevenue,
                plate: w.equipment.plateNumber,
                projectedRevenue:
                  w.equipment?.uom === "hour"
                    ? w.equipment?.rate * 5
                    : w.equipment?.rate,
              });
            }
          }
        }

        if (isNaN(projectedRevenue)) projectedRevenue = 0;
      });
    }

    let workListByDay = await workData.model.find({ uom: "day" }).and([
      {
        "dispatch.date": {
          $gte: startDate,
          $lte: moment(endDate)
            .add(23, "hours")
            .add(59, "minutes")
            .add(59, "seconds"),
        },
      },
    ]);

    let listDays = [];

    if (customer >= 1) {
      customer.map((c) => {
        let l = workListByDay.filter((w) => {
          let nameLowerCase = w?.project?.customer?.toLowerCase();
          return nameLowerCase.includes(c?.toLowerCase());
        });
        listDays.push(...l);
      });
    } else {
      listDays = workListByDay;
    }

    if (project?.length >= 1) {
      project.map((p) => {
        let l = listDays.filter((w) => {
          let descLowerCase = w?.project?.prjDescription?.toLowerCase();
          return descLowerCase.includes(p.toLowerCase());
        });
        listDays.push(...l);
      });
    }

    if (equipment?.length >= 1) {
      equipment.map((e) => {
        let l = listDays.filter((w) => {
          let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
          return plateLowerCase.includes(e.toLowerCase());
        });
        listDays.push(...l);
      });
    }

    if (owner) {
      listDays = listDays.filter((w) => {
        let ownerLowercase = w?.equipment?.eqOwner?.toLowerCase();
        if (owner.toLowerCase() === "construck")
          return ownerLowercase === "construck";
        else if (owner.toLowerCase() === "hired")
          return ownerLowercase !== "construck";
        else return true;
      });
    }

    listDays.map((w) => {
      totalDays = totalDays + w.duration;
    });
    const data = {
      totalRevenue: totalRevenue ? _.round(totalRevenue, 0).toFixed(2) : "0.00",
      projectedRevenue: projectedRevenue ? projectedRevenue.toFixed(2) : "0.00",
      totalDays: totalDays ? _.round(totalDays, 1).toFixed(1) : "0.0",
    };
    // IF ignoreCache is 0, then cache the data, otherwise, skip
    ignoreCache !== 1 && cache.set(cacheKey, data);
    return res.status(200).send(data);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    return res.send({
      error,
      key,
    });
  }
});

router.put("/:id", async (req, res) => {
  let { id } = req.params;
  let projectId = req.body?.project?._id;
  let customerName = req.body?.project?.customer;
  let equipmentOwner = req.body?.equipment?.eqOwner;
  let driver = req.body?.driver;

  let updateObj = {};
  if (equipmentOwner.toLowerCase() === "construck") {
    updateObj = req.body;
  } else {
    delete req.body.driver;
    updateObj = req.body;
  }
  delete updateObj.driver;
  try {
    updateObj.equipment._id = new mongoose.Types.ObjectId(
      req?.body?.equipment?._id
    );
    let currentWork = await workData.model.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      updateObj
    );
    // IF DISPATCH IS SCHEDULE THE CURRENT DATE, CHANGE EQUIP STATUS TO DISPATCHED
    let todayDate = moment()
      .startOf("day")
      .set("hour", 0)
      .set("minute", 0)
      .format("YYYY-MM-DD");

    const isBetween = moment(todayDate).isBetween(
      moment(req.body.workStartDate),
      moment(req.body.workEndDate),
      "day",
      "[]"
    );

    if (isBetween) {
      await eqData.model.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req?.body?.equipment?._id) },
        {
          eqStatus: "dispatched",
        }
      );
    }
    {
      returnNewDocument: true;
    }

    await employeeData.model.findOneAndUpdate(
      { _id: currentWork?.driver },
      {
        status: "active",
        assignedToSiteWork: null,
        assignedDate: null,
        assignedShift: null,
      }
    );

    await employeeData.model.findOneAndUpdate(
      { _id: driver },
      {
        status: "dispatched",
        assignedToSiteWork: req.body?.siteWork,
        assignedDate: moment(req.body?.dispatch?.date),
        assignedShift: req.body?.dispatch?.shift,
      }
    );

    res.send({ message: "done" });
  } catch (err) {
    return res.send({
      error: true,
    });
  }
});

router.put("/approve/:id", async (req, res) => {
  let { id } = req.params;

  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy");

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "standby", assignedDate: null, assignedShift: "" },
      }
    );

    work.status = "approved";
    work.approvedRevenue = work.totalRevenue;
    work.approvedDuration = work.duration;
    work.approvedExpenditure = work.totalExpenditure;
    work.rejectedReason = "";

    let savedRecord = await work.save();

    //log saving
    let log = {
      action: "DISPATCH APPROVED",
      doneBy: req.body.approvedBy,
      request: req.body,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();
    return res.status(201).send(savedRecord);
  } catch (err) {}
});

router.put("/approveDailyWork/:id", async (req, res) => {
  let { id } = req.params;
  let {
    postingDate,
    approvedBy,
    approvedRevenue,
    approvedDuration,
    approvedExpenditure,
  } = req.body;

  try {
    let workRec = await workData.model.findById(id);

    let _approvedRevenue = workRec.approvedRevenue
      ? workRec.approvedRevenue
      : 0;
    let _approvedExpenditure = workRec.approvedExpenditure
      ? workRec.approvedExpenditure
      : 0;
    let _approvedDuration = workRec.approvedDuration
      ? workRec.approvedDuration
      : 0;

    let work = await workData.model.findOneAndUpdate(
      {
        _id: id,
        $or: [
          {
            "dailyWork.date": moment(postingDate).format("DD-MMM-YYYY"),
          },
          {
            "dailyWork.date": postingDate,
          },
        ],
        pending: false,
      },
      {
        $set: {
          "dailyWork.$.status": "approved",
          "dailyWork.$.rejectedReason": "",
          rejectedReason: "",
          approvedRevenue: _approvedRevenue + parseFloat(approvedRevenue),
          approvedDuration: _approvedDuration + parseFloat(approvedDuration),
          approvedExpenditure:
            _approvedExpenditure + parseFloat(approvedExpenditure),
        },
      }
    );

    //log saving
    let log = {
      action: "DISPATCH APPROVED",
      doneBy: req.body.approvedBy,
      request: req.body,
      payload: workRec,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    return res.status(201).send(work);
  } catch (err) {
    res.status(500).send({
      error: err,
    });
  }
});

router.put("/validateDailyWork/:id", async (req, res) => {
  let { id } = req.params;
  let {
    postingDate,
    approvedBy,
    approvedRevenue,
    approvedDuration,
    approvedExpenditure,
  } = req.body;

  let workRec = await workData.model.findById(id);
  let _approvedRevenue = workRec.approvedRevenue ? workRec.approvedRevenue : 0;
  let _approvedExpenditure = workRec.approvedExpenditure
    ? workRec.approvedExpenditure
    : 0;
  let _approvedDuration = workRec.approvedDuration
    ? workRec.approvedDuration
    : 0;

  let work = await workData.model.findOneAndUpdate(
    {
      _id: id,
      "dailyWork.date": postingDate,
      pending: false,
    },
    {
      $set: {
        "dailyWork.$.status": "validated",
        approvedRevenue: _approvedRevenue - approvedRevenue,
        approvedDuration: _approvedDuration - approvedDuration,
        approvedExpenditure: _approvedExpenditure - approvedExpenditure,
      },
    }
  );

  //log saving
  let log = {
    action: "DISPATCH VALIDATED",
    doneBy: approvedBy,
    request: req.body,
    payload: workRec,
  };
  let logTobeSaved = new logData.model(log);
  await logTobeSaved.save();
  res.send(workRec);
});

router.put("/validateWork/:id", async (req, res) => {
  let { id } = req.params;
  let {
    postingDate,
    approvedBy,
    approvedRevenue,
    approvedDuration,
    approvedExpenditure,
  } = req.body;

  let workRec = await workData.model.findById(id);
  let _approvedRevenue = workRec.approvedRevenue ? workRec.approvedRevenue : 0;
  let _approvedExpenditure = workRec.approvedExpenditure
    ? workRec.approvedExpenditure
    : 0;
  let _approvedDuration = workRec.approvedDuration
    ? workRec.approvedDuration
    : 0;

  let work = await workData.model.findOneAndUpdate(
    {
      _id: id,
      "dispatch.date": postingDate,
      status: "approved",
    },
    {
      $set: {
        status: "validated",
        approvedRevenue: _approvedRevenue - approvedRevenue,
        approvedDuration: _approvedDuration - approvedDuration,
        approvedExpenditure: _approvedExpenditure - approvedExpenditure,
      },
    }
  );

  //log saving
  let log = {
    action: "DISPATCH VALIDATED",
    doneBy: approvedBy,
    request: req.body,
    payload: workRec,
  };
  let logTobeSaved = new logData.model(log);
  await logTobeSaved.save();

  res.send(workRec);
});

router.put("/rejectDailyWork/:id", async (req, res) => {
  let { id } = req.params;
  let {
    postingDate,
    rejectedBy,
    rejectedRevenue,
    rejectedDuration,
    rejectedExpenditure,
    reason,
  } = req.body;

  // return
  try {
    let workRec = await workData.model.findById(id);
    let ownedByConstruck = workRec.equipment.eqOwner == "Construck";

    let _totalRevenue = workRec.totalRevenue || 0;
    let _totalExpenditure = workRec.totalExpenditure || 0;

    let _rejectedRevenue = workRec.rejectedRevenue
      ? workRec.rejectedRevenue
      : 0;
    let _rejectedExpenditure = workRec.rejectedExpenditure
      ? workRec.rejectedExpenditure
      : 0;
    let _rejectedDuration = workRec.rejectedDuration
      ? workRec.rejectedDuration
      : 0;

    let work = await workData.model.findOneAndUpdate(
      {
        _id: id,
        $or: [
          {
            "dailyWork.date": moment(postingDate).format("DD-MMM-YYYY"),
          },
          {
            "dailyWork.date": postingDate,
          },
        ],
        pending: false,
      },
      {
        $set: {
          "dailyWork.$.status": "rejected",
          "dailyWork.$.rejectedReason": reason,
          "dailyWork.$.totalRevenue": 0,
          totalRevenue: parseFloat(_totalRevenue) - parseFloat(rejectedRevenue),
          totalExpenditure: !ownedByConstruck
            ? _totalExpenditure - parseFloat(rejectedExpenditure)
            : 0,
          rejectedRevenue: _rejectedRevenue + parseFloat(rejectedRevenue),
          rejectedDuration: _rejectedDuration + parseFloat(rejectedDuration),
          rejectedExpenditure:
            _rejectedExpenditure + parseFloat(rejectedExpenditure),
        },
      }
    );

    //log saving
    let log = {
      action: "DISPATCH REJECTED",
      doneBy: rejectedBy,
      request: req.body,
      payload: workRec,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    let receipts =
      false && (await getProjectAdminEmail(workRec.project.prjDescription));
    // let receipts = ["bhigiro@cvl.co.rw"];

    if (receipts.length > 0) {
      await sendEmail(
        "appinfo@construck.rw",
        receipts,
        "Work Rejected",
        "workRejected",
        "",
        {
          equipment: work?.equipment,
          project: work?.project,
          postingDate: moment(postingDate).format("DD-MMM-YYYY"),
          reasonForRejection: reason,
        }
      );
    }
    return res.status(200).send(work);
  } catch (err) {
    console.log("err", err);
    return res.status(503).send(err);
  }
});

router.put("/reject/:id", async (req, res) => {
  let { id } = req.params;
  let { reasonForRejection } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    work.status = "rejected";
    // work.reasonForRejection = reasonForRejection;
    work.reasonForRejection = "Reason";
    work.rejectedRevenue = work.totalRevenue;
    work.rejectedDuration = work.duration;
    work.rejectedExpenditure = work.totalExpenditure;
    // work.projectedRevenue = 0;

    let savedRecord = await work.save();

    let log = {
      action: "DISPATCH REJECTED",
      doneBy: req.body.rejectedBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    let receipts = await getProjectAdminEmail(work.project.prjDescription);
    // let receipts = ["bhigiro@cvl.co.rw"];

    if (receipts.length > 0) {
      await sendEmail(
        "appinfo@construck.rw",
        receipts,
        "Work Rejected",
        "workRejected",
        "",
        {
          equipment: work?.equipment,
          project: work?.project,
          postingDate: moment(work?.workStartDate).format("DD-MMM-YYYY"),
          reasonForRejection: reasonForRejection,
        }
      );
    }
    res.status(201).send(savedRecord);
  } catch (err) {
    res.send("Error occured!!");
  }
});

router.put("/releaseValidated/:projectName", async (req, res) => {
  let { month, year } = req.query;
  let { projectName } = req.params;
  // month = month - 1;
  try {
    if (month < 10) month = "0" + month;
    const startOfMonth = moment()
      .startOf("month")
      .format(`${year}-${month}-DD`);
    const endOfMonth = moment()
      .endOf("month")
      .format(
        `${year}-${month}-${moment(`${year}-${month}-01`).daysInMonth(month)}`
      );

    let q2 = await workData.model.updateMany(
      {
        siteWork: true,
        "project.prjDescription": projectName,
      },
      {
        $set: {
          "dailyWork.$[elem].status": "released",
        },
      },
      {
        arrayFilters: [
          {
            "elem.date": {
              $gte: new Date(year, month - 1, 1),
              $lt: new Date(year, month, 1),
            },
          },
        ],
        multi: true,
      }
    );

    res.send({ q2 });
  } catch (err) {
    res.send(err);
  }
});

router.put("/rejectValidated/:projectName", async (req, res) => {
  let { month, year } = req.query;
  let { projectName } = req.params;
  let { reason } = req.body;
  try {
    let monthDigit = month;
    if (month < 10) month = "0" + month;
    const startOfMonth = moment()
      .startOf("month")
      .format(`${year}-${month}-DD`);
    const endOfMonth = moment()
      .endOf("month")
      .format(
        `${year}-${month}-${moment(`${year}-${month}-01`).daysInMonth(month)}`
      );

    let q1 = await workData.model.updateMany(
      {
        siteWork: false,
        "project.prjDescription": projectName,
        status: "validated",
        workStartDate: { $gte: startOfMonth },
        workStartDate: { $lte: endOfMonth },
      },
      {
        $set: {
          status: "rejected",
        },
      }
    );

    return res.send({});
  } catch (err) {
    err;
    return res.send(err);
  }
});

router.put("/recall/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model.findById(id);

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) {
      employee.status = "active";
      employee.assignedToSiteWork = false;
      employee.assignedDate = null;
      employee.assignedShift = "";
    }

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "standby", assignedDate: null, assignedShift: "" },
      }
    );

    let worksInProgress = await workData.model.find({
      "equipment._id": eqId,
      status: { $in: ["on going", "in progress", "created"] },
    });

    if (worksInProgress.length <= 1) {
      let equipment = await eqData.model.findById(work?.equipment?._id);
      equipment.eqStatus = equipment?.eqStatus !== "workshop" && "standby";
      equipment.assignedDate = null;
      equipment.assignedShift = "";
      equipment.assignedToSiteWork = false;
      work.equipment = equipment;
      if (equipment) await equipment.save();
    } else {
      let equipment = await eqData.model.findById(work?.equipment?._id);
      equipment.eqStatus = equipment?.eqStatus !== "workshop" && "standby";
      equipment.assignedDate = worksInProgress[0].equipment.assignedDate;
      equipment.assignedShift = worksInProgress[0].equipment.assignedShift;
      equipment.assignedToSiteWork =
        worksInProgress[0].equipment.assignedToSiteWork;
      work.equipment = equipment;
      if (equipment) await equipment.save();
    }

    work.status = "recalled";
    work.projectedRevenue = 0;
    work.totalRevenue = 0;

    let savedRecord = await work.save();
    if (employee) await employee.save();

    //log saving
    let log = {
      action: "DISPATCH RECALLED",
      doneBy: req.body.recalledBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    let today = moment().format("DD-MMM-YYYY");
    const dateData = await assetAvblty.model.findOne({ date: today });
    let availableAssets = await eqData.model.find({
      eqStatus: { $ne: "workshop" },
      eqOwner: "Construck",
    });
    let unavailableAssets = await eqData.model.find({
      eqStatus: "workshop",
      eqOwner: "Construck",
    });
    let dispatched = await eqData.model.find({
      eqStatus: "dispatched",
      eqOwner: "Construck",
    });

    let standby = await eqData.model.find({
      eqStatus: "standby",
      eqOwner: "Construck",
    });

    if (dateData) {
      let currentAvailable = dateData.available;
      let currentUnavailable = dateData.unavailable;
      dateData.available = currentAvailable;
      dateData.unavailable = currentUnavailable;
      dateData.dispatched = dispatched.length;
      dateData.standby = standby.length;

      await dateData.save();
    } else {
      let dateDataToSave = new assetAvblty.model({
        date: today,
        available: availableAssets.length,
        unavailable: unavailableAssets.length,
        dispatched: dispatched.length,
        standby: standby.length,
      });
      await dateDataToSave.save();
    }

    res.status(201).send(savedRecord);
  } catch (err) {}
});

router.put("/reject/:id", async (req, res) => {
  let { id } = req.params;
  let { reasonForRejection } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    let ownedByConstruck = workRec.equipment.eqOwner == "Construck";

    work.status = "rejected";
    // work.reasonForRejection = reasonForRejection;
    work.reasonForRejection = "Reason";
    work.rejectedRevenue = work.totalRevenue;
    work.totalRevenue = 0;
    work.totalExpenditure = 0;
    work.rejectedDuration = work.duration;
    work.rejectedExpenditure = work.totalExpenditure;
    // work.projectedRevenue = 0;

    let savedRecord = await work.save();

    let log = {
      action: "DISPATCH REJECTED",
      doneBy: req.body.rejectedBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();
    const { NODE_ENV } = process.env;
    let receipts =
      NODE_ENV === "production"
        ? await getProjectAdminEmail(work.project.prjDescription)
        : [];
    if (receipts.length > 0) {
      await sendEmail(
        "appinfo@construck.rw",
        "receipts",
        "Work Rejected",
        "workRejected",
        "",
        {
          equipment: work?.equipment,
          project: work?.project,
          postingDate: moment(work?.workStartDate).format("DD-MMM-YYYY"),
          reasonForRejection: reasonForRejection,
        }
      );
    }
    res.status(201).send(savedRecord);
  } catch (err) {
    res.send("Error occured!!");
  }
});

router.put("/start/:id", async (req, res) => {
  let { id } = req.params;
  let { fuel, startIndex, postingDate } = req.body;

  let dd = postingDate?.split(".")[0];
  let mm = postingDate?.split(".")[1];
  let yyyy = postingDate?.split(".")[2];

  if (dd?.length < 2) dd = "0" + dd;
  if (mm?.length < 2) mm = "0" + mm;

  if (dd && mm && yyyy) postingDate = `${yyyy}-${mm}-${dd}`;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    if (
      work.status === "created" ||
      (work.status === "on going" &&
        work.siteWork &&
        moment(postingDate).isSameOrAfter(moment(work.workStartDate), "day") &&
        moment(postingDate).isSameOrBefore(moment(work.workEndDate), "day"))
    ) {
      let eqId = work?.equipment?._id;

      await workData.model.updateMany(
        { "equipment._id": eqId },
        {
          $set: {
            eqStatus: "in progress",
            assignedDate: Date.now(),
            millage: startIndex,
            fuel: fuel,
          },
        }
      );

      let equipment = await eqData.model.findById(work?.equipment?._id);
      equipment.assignedToSiteWork = true;
      equipment.millage = startIndex;

      let employee = await employeeData.model.findById(work?.driver);
      if (employee) {
        employee.status = "busy";
      }

      if (work.siteWork) {
        let dailyWork = {
          day: moment(postingDate).isValid()
            ? moment(postingDate).diff(moment(work.workStartDate), "days")
            : moment(postingDate, "DD.MM.YYYY").diff(
                moment(work.workStartDate),
                "days"
              ),
          startTime: postingDate,
          date: moment(postingDate).isValid()
            ? moment(postingDate).format("DD-MMM-YYYY")
            : moment(postingDate, "DD.MM.YYYY").format("DD-MMM-YYYY"),
          startIndex,
          pending: true,
        };

        work.dailyWork.push(dailyWork);
        work.status = "in progress";
        work.startIndex = startIndex;
        work.equipment = equipment;
        let savedRecord = await work.save();
        if (employee) await employee.save();

        //log saving
        let log = {
          action: "DISPATCH STARTED",
          doneBy: req.body.startedBy,
          request: req.body,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        res.status(201).send(savedRecord);
      } else {
        work.status = "in progress";
        work.startTime = Date.now();
        work.startIndex = startIndex;
        work.equipment = equipment;
        let savedRecord = await work.save();

        if (employee) await employee.save();
        await equipment.save();

        //log saving
        let log = {
          action: "DISPATCH STARTED",
          doneBy: req.body.startedBy,
          request: req.body,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        res.status(201).send(savedRecord);
      }
    } else {
      res.status(200).send(work);
    }
  } catch (err) {}
});

router.put("/stop/:id", async (req, res) => {
  let { id } = req.params;

  let {
    endIndex,
    tripsDone,
    comment,
    moreComment,
    postingDate,
    stoppedBy,
    fuel,
    startIndex,
  } = req.body;

  let duration = Math.abs(req.body.duration);

  if (duration > DURATION_LIMIT) duration = DURATION_LIMIT;
  let dd = postingDate?.split(".")[0];
  let mm = postingDate?.split(".")[1];
  let yyyy = postingDate?.split(".")[2];
  if (dd?.length < 2) dd = "0" + dd;
  if (mm?.length < 2) mm = "0" + mm;
  if (dd && mm && yyyy) postingDate = `${yyyy}-${mm}-${dd}`;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    //You can only stop jobs in progress
    if (
      work?.status === "created" ||
      work?.status === "on going" ||
      work?.status === "in progress" ||
      (work?.siteWork &&
        moment(postingDate).isSameOrAfter(moment(work?.workStartDate), "day") &&
        moment(postingDate).isSameOrBefore(moment(work?.workEndDate), "day"))
    ) {
      let equipment = await eqData.model.findById(work?.equipment?._id);
      let workEnded = false;

      //get jobs being done by the same equipment
      let eqBusyWorks = await workData.model.find({
        "equipment.plateNumber": equipment._id,
        _id: { $ne: work._id },
        status: { $in: ["in progress", "on going", "created"] },
      });

      if (work?.dailyWork?.length >= work.workDurationDays) {
        equipment.eqStatus =
          equipment?.eqStatus !== "workshop" && eqBusyWorks.length >= 1
            ? "dispatched"
            : "standby";
        equipment.assignedToSiteWork = false;
        workEnded = true;
      }

      let employee = await employeeData.model.findById(work?.driver);
      if (employee) {
        employee.status = "active";
        employee.assignedToSiteWork = false;
        employee.assignedDate = null;
        employee.assignedShift = "";
      }

      if (work.siteWork) {
        let dailyWork = {};
        let currentTotalRevenue = work.totalRevenue;
        let currentDuration = Math.abs(work.duration);
        let currentTotalExpenditure = work.totalExpenditure;

        // work.status = workEnded ? "stopped" : "on going";

        let _duration = Math.abs(work.endTime - work.startTime);

        let startIndex = work.startIndex ? work.startIndex : 0;
        dailyWork.endIndex = endIndex
          ? parseInt(endIndex)
          : parseInt(startIndex);
        dailyWork.startIndex = parseInt(startIndex);

        equipment.millage =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);

        let uom = equipment?.uom;
        let rate = equipment?.rate;
        let supplierRate = equipment?.supplierRate;
        let revenue = 0;
        let expenditure = 0;

        // if rate is per hour and we have target trips to be done
        if (uom === "hour") {
          dailyWork.projectedRevenue = rate * 5;
          if (comment === "Should never happen") {
            dailyWork.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * dailyWork.duration) / 3600000;
            expenditure = (supplierRate * dailyWork.duration) / 3600000;
          } else {
            dailyWork.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * dailyWork.duration) / 3600000;
            expenditure = (supplierRate * dailyWork.duration) / 3600000;
          }
        }

        //if rate is per day
        if (uom === "day") {
          // work.duration = duration;
          // revenue = rate * duration;
          if (comment === "Should neve happen") {
            //reason that does not exist
            dailyWork.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate * (duration >= 1 ? 1 : 0);
          } else {
            dailyWork.duration = duration / HOURS_IN_A_DAY;

            let targetDuration = 5;
            let durationRation =
              duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
            dailyWork.duration = duration / HOURS_IN_A_DAY;
            revenue =
              equipment?.eqDescription === "TIPPER TRUCK" &&
              comment === "Ibibazo bya panne"
                ? duration >= 5
                  ? rate
                  : rate * _.round(duration / HOURS_IN_A_DAY, 2)
                : rate;
            expenditure =
              supplierRate * (duration > 0 ? duration / HOURS_IN_A_DAY : 0);
          }
        }
        dailyWork.rate = rate;
        dailyWork.uom = uom;
        dailyWork.date = postingDate;
        dailyWork.totalRevenue = revenue ? revenue : 0;
        dailyWork.totalExpenditure = expenditure ? expenditure : 0;

        dailyWork.comment = comment;
        dailyWork.moreComment = moreComment;
        dailyWork.pending = false;
        dailyWork.fuel = parseFloat(fuel);
        let dailyWorks = [...work.dailyWork];
        let indexToUpdate = -1;
        let workToUpdate = dailyWorks.find((d, index) => {
          d.day == moment().diff(moment(work.workStartDate), "days");
          indexToUpdate = index;
        });

        dailyWorks.push(dailyWork);

        work.startIndex =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);
        work.dailyWork = dailyWorks;
        work.duration = dailyWork.duration + currentDuration;
        work.totalRevenue = currentTotalRevenue + revenue;
        // if (workEnded) work.projectedRevenue = currentTotalRevenue + revenue;
        work.totalExpenditure = currentTotalExpenditure + expenditure;
        work.equipment = equipment;
        work.moreComment = moreComment;
        work.status = workEnded ? "stopped" : "on going";
        work.startIndex = parseInt(startIndex);
        await equipment.save();
        if (employee) await employee.save();
        let savedRecord = await work.save();

        //log saving
        let log = {
          action: "DISPATCH STOPPED",
          doneBy: stoppedBy,
          request: req.body,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        res.status(201).send(savedRecord);
      } else {
        let eqId = work?.equipment?._id;
        await workData.model.updateMany(
          { "equipment._id": eqId },
          {
            $set: {
              eqStatus: "standby",
              assignedDate: null,
              assignedShift: "",
            },
          }
        );
        let startIndex = work.startIndex ? work.startIndex : 0;
        let equipment = await eqData.model.findById(work?.equipment?._id);
        equipment.eqStatus =
          eqBusyWorks.length >= 1 && equipment?.eqStatus !== "workshop"
            ? "dispatched"
            : "standby";
        equipment.assignedDate =
          eqBusyWorks.length >= 1 ? equipment.assignedDate : null;
        equipment.assignedShift =
          eqBusyWorks.length >= 1 ? equipment.assignedShift : "";
        equipment.assignedToSiteWork =
          eqBusyWorks.length >= 1 ? equipment.assignedToSiteWork : false;
        equipment.millage =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);

        work.status = "stopped";
        work.endTime = Date.now();
        let _duration = Math.abs(work.endTime - work.startTime);

        work.endIndex =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);
        work.startIndex = parseInt(startIndex);
        work.fuel = fuel;
        work.tripsDone = parseInt(tripsDone);
        let uom = equipment?.uom;

        let rate = equipment?.rate;
        let supplierRate = equipment?.supplierRate;
        let targetTrips = parseInt(work?.dispatch?.targetTrips); //TODO

        let tripsRatio = tripsDone / (targetTrips ? targetTrips : 1);
        let revenue = 0;
        let expenditure = 0;

        // if rate is per hour and we have target trips to be done
        if (uom === "hour") {
          if (comment === "Should never happen") {
            work.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * work.duration) / 3600000;
            expenditure = (supplierRate * work.duration) / 3600000;
          } else {
            work.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * work.duration) / 3600000;
            expenditure =
              tripsRatio > 0
                ? (tripsRatio * (supplierRate * work.duration)) / 3600000
                : (supplierRate * work.duration) / 3600000;
          }
        }

        //if rate is per day
        if (uom === "day") {
          // work.duration = duration;
          // revenue = rate * duration;
          if (comment == "Should never happen") {
            work.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate * (duration >= 1 ? 1 : 0);
          } else {
            let tripRatio = tripsDone / targetTrips;
            work.duration = tripRatio;
            if (
              tripsDone &&
              targetTrips &&
              equipment?.eqDescription === "TIPPER TRUCK"
            ) {
              if (tripRatio >= 1) {
                revenue = rate * tripRatio;
                expenditure = supplierRate;
                // revenue = rate;
              } else {
                revenue = rate * tripRatio;
                expenditure = supplierRate * tripRatio;
              }
            }
            if (
              !targetTrips ||
              targetTrips == "0" ||
              equipment?.eqDescription !== "TIPPER TRUCK"
            ) {
              {
                let targetDuration = 5;
                let durationRation =
                  duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
                work.duration = duration / HOURS_IN_A_DAY;
                revenue = rate * (duration > 0 ? duration / HOURS_IN_A_DAY : 0);
                expenditure =
                  supplierRate * (duration > 0 ? duration / HOURS_IN_A_DAY : 0);
              }
            }
          }
        }

        work.rate = rate;
        work.uom = uom;
        work.totalRevenue = revenue ? revenue : 0;
        work.totalExpenditure = expenditure ? expenditure : 0;
        work.comment = comment;
        work.moreComment = moreComment;
        work.equipment = equipment;

        let savedRecord = await work.save();
        if (employee) await employee.save();
        await equipment.save();

        //log saving
        let log = {
          action: "DISPATCH STOPPED",
          doneBy: stoppedBy,
          request: req.body,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        let today = moment().format("DD-MMM-YYYY");
        const dateData = await assetAvblty.model.findOne({ date: today });
        let availableAssets = await eqData.model.find({
          eqStatus: { $ne: "workshop" },
          eqOwner: "Construck",
        });
        let unavailableAssets = await eqData.model.find({
          eqStatus: "workshop",
          eqOwner: "Construck",
        });
        let dispatched = await eqData.model.find({
          eqStatus: "dispatched",
          eqOwner: "Construck",
        });

        let standby = await eqData.model.find({
          eqStatus: "standby",
          eqOwner: "Construck",
        });

        if (dateData) {
          let currentAvailable = dateData.available;
          let currentUnavailable = dateData.unavailable;
          dateData.available = currentAvailable;
          dateData.unavailable = currentUnavailable;
          dateData.dispatched = dispatched.length;
          dateData.standby = standby.length;

          await dateData.save();
        } else {
          let dateDataToSave = new assetAvblty.model({
            date: today,
            available: availableAssets.length,
            unavailable: unavailableAssets.length,
            dispatched: dispatched.length,
            standby: standby.length,
          });
          await dateDataToSave.save();
        }

        return res.status(201).send(savedRecord);
      }
    } else {
      return res.status(200).send(work);
    }
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.put("/update-stopped-work/:id", async (req, res) => {
  await stopWork(req, res);
});

router.put("/end/:id", async (req, res) => {
  let { id } = req.params;

  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    let equipment = await eqData.model.findById(work?.equipment?._id);

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) {
      employee.status = "active";
      employee.assignedToSiteWork = false;
      employee.assignedDate = null;
      employee.assignedShift = "";
    }

    if (work.siteWork) {
      // work.status = "stopped";
      equipment.eqStatus = "standby";
      equipment.assignedDate = null;
      equipment.assignedShift = "";

      // work.projectedRevenue = work.totalRevenue;
      work.equipment = equipment;

      await equipment.save();
      if (employee) await employee.save();
      let savedRecord = await work.save();

      //log saving
      let log = {
        action: "SITE WORK ENDED",
        doneBy: req.body.stoppedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      let today = moment().format("DD-MMM-YYYY");
      const dateData = await assetAvblty.model.findOne({ date: today });
      let availableAssets = await eqData.model.find({
        eqStatus: { $ne: "workshop" },
        eqOwner: "Construck",
      });
      let unavailableAssets = await eqData.model.find({
        eqStatus: "workshop",
        eqOwner: "Construck",
      });
      let dispatched = await eqData.model.find({
        eqStatus: "dispatched",
        eqOwner: "Construck",
      });

      let standby = await eqData.model.find({
        eqStatus: "standby",
        eqOwner: "Construck",
      });

      if (dateData) {
        let currentAvailable = dateData.available;
        let currentUnavailable = dateData.unavailable;
        dateData.available = currentAvailable;
        dateData.unavailable = currentUnavailable;
        dateData.dispatched = dispatched.length;
        dateData.standby = standby.length;

        await dateData.save();
      } else {
        let dateDataToSave = new assetAvblty.model({
          date: today,
          available: availableAssets.length,
          unavailable: unavailableAssets.length,
          dispatched: dispatched.length,
          standby: standby.length,
        });
        await dateDataToSave.save();
      }
      res.status(201).send(savedRecord);
    }
  } catch (err) {}
});

router.put("/resetStartIndices", async (req, res) => {
  try {
    let updates = await workData.model.updateMany({
      $set: {
        startIndex: 0,
        endIndex: 0,
      },
    });

    res.send(updates);
  } catch (err) {}
});

router.put("/reverse/:id", async (req, res) => {
  // reset duration
  // reset totalRevenue
  // only those that are not site works
  // set status to "in progress"
  // create a log to mention that it is a reverse

  let { id } = req.params;
  let { reversedBy } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    work.duration = 0;
    work.totalRevenue = 0;
    work.totalExpenditure = 0;
    work.tripsDone = 0;
    work.status = "created";

    //log saving
    let log = {
      action: "DISPATCH REVERSED",
      doneBy: reversedBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);

    await logTobeSaved.save();
    await work.save();

    res.send(work).status(201);
  } catch (err) {}
});

router.put("/amend/:id", async (req, res) => {
  // reset duration
  // reset totalRevenue
  // only those that are not site works
  // set status to "in progress"
  // create a log to mention that it is a reverse

  let { id } = req.params;
  let { tripsDone, comment, moreComment, stoppedBy, duration } = req.body;

  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");
    let equipment = await eqData.model.findById(work?.equipment?._id);

    work.status = "stopped";
    work.tripsDone = parseInt(tripsDone);
    let uom = equipment?.uom;

    let rate = equipment?.rate;
    let supplierRate = equipment?.supplierRate;
    let targetTrips = parseInt(work?.dispatch?.targetTrips); //TODO

    let tripsRatio = tripsDone / (targetTrips ? targetTrips : 1);
    let revenue = 0;
    let expenditure = 0;

    // if rate is per hour and we have target trips to be done
    if (uom === "hour") {
      // if (comment !== "Ibibazo bya panne") {
      work.duration = duration > 0 ? duration * 3600000 : 0;
      revenue = (rate * work.duration) / 3600000;
      expenditure = (supplierRate * work.duration) / 3600000;
      // } else {
      //   work.duration = duration > 0 ? duration * 3600000 : 0;
      //   revenue = (tripsRatio * (rate * work.duration)) / 3600000;
      //   expenditure = (tripsRatio * (supplierRate * work.duration)) / 3600000;
      // }
    }

    //if rate is per day
    if (uom === "day") {
      // work.duration = duration;
      // revenue = rate * duration;
      if (comment !== "Ibibazo bya panne") {
        work.duration = duration / HOURS_IN_A_DAY;
        revenue = rate * (duration >= 1 ? 1 : 0);
        expenditure = supplierRate * (duration >= 1 ? 1 : 0);
      } else {
        work.duration = duration / HOURS_IN_A_DAY;
        let tripRatio = tripsDone / targetTrips;
        if (tripsDone && targetTrips) {
          if (tripRatio > 1) {
            revenue = rate;
            expenditure = supplierRate;
            // revenue = rate;
          } else {
            revenue = rate * tripRatio;
            expenditure = supplierRate * tripRatio;
          }
        }
        if (!targetTrips || targetTrips == "0") {
          {
            let targetDuration = 5;
            let durationRation =
              duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
            work.duration = duration / HOURS_IN_A_DAY;
            revenue = rate || 0;
            // revenue = rate * (duration >= 1 ? rate : 0);

            expenditure = supplierRate;
          }
        }
      }
    }
    work.rate = rate;
    work.uom = uom;
    work.totalRevenue = revenue ? revenue : 0;
    work.totalExpenditure = expenditure ? expenditure : 0;
    work.comment = comment;
    work.moreComment = moreComment;
    let savedRecord = await work.save();
    //log saving
    let log = {
      action: "DISPATCH AMENDED",
      doneBy: req.body.amendedBy,
      request: req.body,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    res.status(201).send(savedRecord);
  } catch (err) {
    res.send(err);
  }
});

router.put("/swamend/:id", async (req, res) => {
  let { id } = req.params;
  let {
    tripsDone,
    comment,
    moreComment,
    postingDate,
    prevDuration,
    prevTotalRevenue,
    prevTotalExpenditure,
  } = req.body;
  let duration = Math.abs(req.body.duration);
  if (duration > DURATION_LIMIT) duration = DURATION_LIMIT;
  postingDate = moment(postingDate, "DD-MMM-YYYY").format("YYYY-MM-DD");

  try {
    let work = await workData.model.findOne({
      _id: id,
      "dailyWork.date": postingDate,
      status: { $in: ["created", "on going", "stopped"] },
    });

    let equipment = await eqData.model.findById(work?.equipment?._id);

    let dailyWork = {};
    let currentTotalRevenue = work.totalRevenue;
    let currentDuration = Math.abs(work.duration);
    let currentTotalExpenditure = work.totalExpenditure;

    let _duration = Math.abs(work.endTime - work.startTime);

    let uom = equipment?.uom;
    let rate = equipment?.rate;
    let supplierRate = equipment?.supplierRate;
    let revenue = 0;
    let expenditure = 0;

    // if rate is per hour and we have target trips to be done
    if (uom === "hour") {
      if (comment !== "Ibibazo bya panne") {
        dailyWork.duration = duration > 0 ? duration * 3600000 : 0;

        revenue = (rate * dailyWork.duration) / 3600000;
        expenditure = (supplierRate * dailyWork.duration) / 3600000;
      } else {
        dailyWork.duration = duration > 0 ? duration * 3600000 : 0;
        revenue = (rate * dailyWork.duration) / 3600000;
        expenditure = (supplierRate * dailyWork.duration) / 3600000;
      }
    }

    //if rate is per day
    if (uom === "day") {
      if (comment !== "Ibibazo bya panne") {
        dailyWork.duration = duration / HOURS_IN_A_DAY;
        revenue = rate * (duration >= 1 ? 1 : 0);
        expenditure = supplierRate * (duration >= 1 ? 1 : 0);
      } else {
        dailyWork.duration = duration / HOURS_IN_A_DAY;

        let targetDuration = 5;
        let durationRation =
          duration >= 5 ? 1 : _.round(duration / HOURS_IN_A_DAY, 2);
        dailyWork.duration = duration / HOURS_IN_A_DAY;
        expenditure = supplierRate;
        if (equipment?.eqDescription === "TIPPER TRUCK") {
          revenue = rate * durationRation;
        } else {
          revenue = rate;
        }
      }
    }

    dailyWork.totalRevenue = revenue ? revenue : 0;
    dailyWork.totalExpenditure = expenditure ? expenditure : 0;
    dailyWork.comment = comment;
    dailyWork.moreComment = moreComment;

    work = await workData.model.findOneAndUpdate(
      {
        _id: id,
        "dailyWork.date": postingDate,
        status: { $in: ["created", "on going", "stopped"] },
      },
      {
        $set: {
          "dailyWork.$.totalRevenue": dailyWork.totalRevenue,
          "dailyWork.$.duration": dailyWork.duration,
          "dailyWork.$.totalExpenditure": dailyWork.totalExpenditure,
          "dailyWork.$.comment": dailyWork.comment,
          "dailyWork.$.moreComment": dailyWork.moreComment,
          "dailyWork.$.status": "",
        },
      }
    );

    work.duration = currentDuration - prevDuration + dailyWork.duration;
    work.totalRevenue = currentTotalRevenue - prevTotalRevenue + revenue;
    work.totalExpenditure =
      currentTotalExpenditure - prevTotalExpenditure + expenditure;
    work.moreComment = moreComment;

    let savedRecord = await work.save();

    //log saving
    let log = {
      action: "DISPATCH AMENDED",
      doneBy: req.body.amendedby,
      request: req.body,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    res.status(201).send(savedRecord);
  } catch (err) {
    return res.status(503).send({
      error: err,
    });
  }
});

router.put("/swreverse/:id", async (req, res) => {
  // reset duration
  // reset totalRevenue
  // only those that are not site works
  // set status to "in progress"
  // create a log to mention that it is a reverse

  let { id } = req.params;
  let { date, duration, totalRevenue, totalExpenditure } = req.query;
  let { reversedBy } = req.body;

  try {
    const filter = { _id: id };
    const update = {
      $pull: {
        dailyWork: { date: date },
      },
    };
    const work = await workData.model.findOneAndUpdate(filter, update);
    let updatedDuration = work.duration - duration;
    let updatedRevenue = work.totalRevenue - totalRevenue;
    let updatedExpenditure = work.totalExpenditure - totalExpenditure;

    work.totalRevenue = updatedRevenue;
    work.totalExpenditure = updatedExpenditure;
    work.duration = updatedDuration;

    if (updatedDuration === 0) {
      work.status = "created";
    }
    //log saving
    let log = {
      action: "DISPATCH REVERSED",
      doneBy: reversedBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);

    await logTobeSaved.save();
    await work.save();

    res.send(work).status(201);
  } catch (err) {
    res.send(err);
  }
});

router.post("/gethoursperdriver/", async (req, res) => {
  let { startDate, endDate } = req.body;

  try {
    let works = await workData.model.aggregate([
      {
        $match: {
          $and: [
            { driver: { $ne: null } },
            { workStartDate: { $gte: new Date(startDate) } },
            { workEndDate: { $lte: new Date(endDate) } },
          ],
          // workEndDate: { $lte: endDate },
        },
      },
      // {
      //   $unwind: "$dispatch.drivers",
      // },
      {
        $group: {
          _id: {
            driver: "$driver",
            assistants: "$dispatch.astDriver",
            uom: "$equipment.uom",
          },
          totalDuration: { $sum: "$duration" },
        },
      },

      {
        $lookup: {
          from: "employees",
          let: { driverObjId: { $toObjectId: "$_id.driver" } },
          pipeline: [
            { $addFields: { employeeId: "$_id" } },
            { $match: { $expr: { $eq: ["$employeeId", "$$driverObjId"] } } },
          ],
          as: "driverDetails",
        },
      },

      {
        $lookup: {
          from: "employees",
          let: { assistants: "$_id.assistants" },
          pipeline: [
            { $addFields: { assistantId: { $toString: "$_id" } } },
            {
              $match: {
                $expr: {
                  $in: ["$assistantId", "$$assistants"],
                },
              },
            },
            { $project: { firstName: 1, lastName: 1 } },
          ],
          as: "assistantDetails",
        },
      },
    ]);

    let refinedData = works
      .map((w) => {
        return {
          "Main Driver":
            w.driverDetails[0]?.firstName + " " + w.driverDetails[0]?.lastName,
          Drivers: w.assistantDetails,
          Phone: w.driverDetails[0]?.phone,
          "Total Duration":
            w._id.uom === "day"
              ? w.totalDuration
              : w.totalDuration / (1000 * 60 * 60),
          UOM: w._id.uom,
        };
      })
      .filter((w) => w["Main Driver"] !== "undefined undefined");

    res.send(refinedData);
  } catch (err) {
    res.send(err);
  }
});

router.put("/driverassistants/", async (req, res) => {
  try {
    let driversData = await workData.model.find(
      { driver: { $ne: null } },
      { "dispatch.drivers": 1 }
    );
    let allAssistants = [];

    driversData.map((d) => {
      let assisList = d.dispatch.drivers;
      allAssistants = allAssistants.concat(assisList);
    });
    let uniqueAssistants = [...new Set(allAssistants)];
    let list = await getEmployees(uniqueAssistants);
    res.send(list);
  } catch (err) {}
});

router.post("/reports/generate", (req, res) => {
  works.captureDispatchDailyReport(req.query.date);
});
router.get("/reports/:date", (req, res) => {
  works.getDispatchDailyReport(req, res);
});
router.post("/force-stop-dispatches", (req, res) => {
  works.forceStopDispatches(req, res);
});
router.get("/details/:id", (req, res) => {
  works.getSingleDispatch(req, res);
});
router.patch("/post/:id/sitework", (req, res) => {
  works.postWorkForSitework(req, res);
});
router.get("/sd/equipment/:id/:startdate/:enddate", (req, res) => {
  works.worksByEquipment(req, res);
});
router.patch("/post/singledispatches", (req, res) => {
  works.bulkPostSingleDispatch(req, res);
});

async function getEmployees(listIds) {
  let list = [];
  for (let i = 0; i < listIds.length; i++) {
    if (listIds[i] !== "NA") {
      try {
        let employee = await employeeData.model.findById(listIds[i]);
        list.push({
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
        });
      } catch (err) {}
    }
  }

  return list;
}

async function getReceiverEmailList(userType) {
  try {
    let reipts = await userData.model.find(
      {
        userType: { $in: userType },
      },
      { email: 1, _id: 0 }
    );
    return reipts?.map(($) => {
      return $.email;
    });
  } catch (err) {}
}

async function getProjectAdminEmail(project) {
  try {
    let pipeline = [
      {
        $unwind: {
          path: "$projects",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "projects.prjDescription": project,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "projects.projectAdmin",
          foreignField: "_id",
          as: "projectAdmin",
        },
      },
      {
        $unwind: {
          path: "$projectAdmin",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          projectAdminEmail: "$projectAdmin.email",
        },
      },
      {
        $project: {
          _id: 0,
          projectAdminEmail: 1,
        },
      },
    ];

    let emails = await customers.model.aggregate(pipeline);

    let _emails = emails.map((e) => {
      return e.projectAdminEmail;
    });

    return _emails;
  } catch (err) {
    console.log(err);
  }
}

async function getValidatedRevenuesByProject(prjDescription) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
        status: { $nin: ["recalled", "created"] },
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            "dailyWork.status": "validated",
            siteWork: true,
          },
          {
            status: "validated",
            siteWork: false,
          },
        ],
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
      },
    },

    {
      $group: {
        _id: {
          month: {
            $month: "$transactionDate",
          },
          year: {
            $year: "$transactionDate",
          },
        },
        totalRevenue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $match: {
        $or: [
          {
            "_id.month": { $gte: 5 },
            "_id.year": { $gte: 2024 },
          },
          {
            "_id.year": { $gt: 2024 },
          },
        ],
      },
    },
    {
      $sort: {
        "_id.year": 1,
      },
    },
    {
      $sort: {
        "_id.month": 1,
      },
    },
    {
      $limit: 5,
    },
  ];

  try {
    let validatedJobs = await workData.model.aggregate(pipeline);
    let list = validatedJobs.map(($) => {
      return {
        monthYear: monthHelper($?._id.month) + "-" + $?._id.year,
        totalRevenue: $?.totalRevenue.toLocaleString(),
        id: $?._id,
      };
    });
    return list;
  } catch (err) {
    err;
    return err;
  }
}

async function getNonValidatedRevenuesByProject(prjDescription) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
        status: {
          $nin: ["recalled", "created"],
        },
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          month: {
            $month: "$transactionDate",
          },
          year: {
            $year: "$transactionDate",
          },
        },
        totalRevenue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $match: {
        $or: [
          {
            "_id.month": {
              $gte: 6,
            },
            "_id.year": {
              $gte: 2024,
            },
          },
          {
            "_id.year": {
              $gt: 2024,
            },
          },
        ],
      },
    },
    {
      $sort: {
        "_id.year": 1,
      },
    },
    {
      $sort: {
        "_id.month": 1,
      },
    },
  ];

  try {
    let nonValidatedJobs = await workData.model.aggregate(pipeline);
    let list = nonValidatedJobs
      .filter(($) => $?._id.month)
      .map(($) => {
        return {
          monthYear: monthHelper($?._id.month) + "-" + $?._id.year,
          totalRevenue: $?.totalRevenue.toLocaleString(),
          id: $?._id,
        };
      });
    // SORT RESULTS BASED ON RECENT MONTHS AND YEAR
    list.sort((a, b) => {
      if (b.id.year !== a.id.year) {
        return b.id.year - a.id.year;
      }
      return b.id.month - a.id.month;
    });
    return list;
  } catch (err) {
    err;
    return err;
  }
}

async function getDailyValidatedRevenues(prjDescription, month, year) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            "dailyWork.status": "validated",
            siteWork: true,
          },
          {
            status: "validated",
            siteWork: false,
          },
        ],
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        month: parseInt(month),
        year: parseInt(year),
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" },
          },
        },
        totalRevenue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ];

  try {
    let validatedJobs = await workData.model.aggregate(pipeline);
    let list = validatedJobs.map(($) => {
      return {
        totalRevenue: $?.totalRevenue.toLocaleString(),
        id: $?._id,
      };
    });
    return list;
  } catch (err) {
    err;
    return err;
  }
}

async function getDailyNonValidatedRevenues(prjDescription, month, year) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    // {
    //   $match: {
    //     $or: [
    //       {
    //         "dailyWork.status": {
    //           $exists: false,
    //         },
    //         siteWork: true,
    //       },
    //       { "dailyWork.status": { $exists: true, $eq: "" }, siteWork: true },
    //       {
    //         status: "stopped",
    //         siteWork: false,
    //       },
    //     ],
    //   },
    // },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        month: parseInt(month),
        year: parseInt(year),
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" },
          },
        },
        totalRevenue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ];

  try {
    let validatedJobs = await workData.model.aggregate(pipeline);
    let list = validatedJobs.map(($) => {
      return {
        totalRevenue: $?.totalRevenue.toLocaleString(),
        id: $?._id,
      };
    });
    return list;
  } catch (err) {
    return err;
  }
}

async function getValidatedListByProjectAndMonth(prjDescription, month, year) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            "dailyWork.status": "validated",
            siteWork: true,
          },
          {
            status: "validated",
            siteWork: false,
          },
        ],
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
      },
    },
    {
      $addFields: {
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        month: parseInt(month),
        year: parseInt(year),
      },
    },
    {
      $project: {
        "project.prjDescription": 1,
        "equipment.plateNumber": 1,
        dailyWork: 1,
        transactionDate: 1,
        siteWork: 1,
        newTotalRevenue: 1,
      },
    },
    {
      $sort: {
        transactionDate: 1,
      },
    },
  ];

  try {
    let validatedJobs = await workData.model.aggregate(pipeline);

    let _validated = [...validatedJobs];

    // let __val = _validated.map((v) => {
    //   let strRevenue = v.newTotalRevenue.toLocaleString();
    //   v.strRevenue = strRevenue;
    //   return v;
    // });

    return _validated;
  } catch (err) {
    return err;
  }
}

async function getNonValidatedListByProjectAndMonth(
  prjDescription,
  month,
  year
) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    // {
    //   $match: {
    //     $or: [
    //       {
    //         "dailyWork.status": {
    //           $exists: false,
    //         },
    //         siteWork: true,
    //       },
    //       { "dailyWork.status": { $exists: true, $eq: "" }, siteWork: true },
    //       {
    //         status: "stopped",
    //         siteWork: false,
    //       },
    //     ],
    //   },
    // },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
      },
    },
    {
      $addFields: {
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        month: parseInt(month),
        year: parseInt(year),
      },
    },
    {
      $project: {
        "project.prjDescription": 1,
        "equipment.plateNumber": 1,
        transactionDate: 1,
        dailyWork: 1,
        siteWork: 1,
        newTotalRevenue: 1,
      },
    },
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);

    let _jobs = [...jobs];

    // let __jobs = _jobs.map((v) => {
    //   let strRevenue = v.newTotalRevenue.toLocaleString();
    //   v.strRevenue = strRevenue;
    //   return v;
    // });

    return _jobs;
  } catch (err) {
    err;
    return err;
  }
}

async function getValidatedListByDay(prjDescription, transactionDate) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            "dailyWork.status": "validated",
            siteWork: true,
          },
          {
            status: "validated",
            siteWork: false,
          },
        ],
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        transactionDate: new Date(transactionDate),
      },
    },
    {
      $lookup: {
        from: "drivers",
        localField: "driver",
        foreignField: "user",
        as: "driver",
      },
    },
    {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "driver.user",
        foreignField: "_id",
        as: "driver",
      },
    },
    {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);

    let _jobs = [...jobs];

    // let __jobs = _jobs.map((v) => {
    //   let strRevenue = v.newTotalRevenue.toLocaleString();
    //   v.strRevenue = strRevenue;
    //   return v;
    // });

    return _jobs;
  } catch (err) {
    err;
    return err;
  }
}

async function getNonValidatedListByDay(prjDescription, transactionDate) {
  let pipeline = [
    {
      $match: {
        "project.prjDescription": prjDescription,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            "dailyWork.status": {
              $exists: false,
            },
            siteWork: true,
          },
          { "dailyWork.status": { $exists: true, $nin: ["created", "recalled"] }, siteWork: true },
          {
            status: "stopped",
            siteWork: false,
          },
          {
            status: "approved",
            siteWork: false,
          },
          {
            status: "validated",
            siteWork: false,
          },
        ],
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        transactionDate: new Date(transactionDate),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "driver",
        foreignField: "_id",
        as: "driver",
      },
    },
    {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        "equipment.eqDescription": 1,
      },
    },
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);
    console.log('@@jobs', jobs.length)
    let _jobs = [...jobs];

    return _jobs;
  } catch (err) {
    err;
    return err;
  }
}

async function getNotPostedListByDay(userId, transactionDate) {
  let pipeline = [
    {
      $match: {
        "equipment.vendor": new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        originalWorkEndDate: "$workEndDate",
        workEndDate: {
          $cond: {
            if: { $gt: ["$workEndDate", new Date()] },
            then: new Date(),
            else: "$workEndDate",
          },
        },
        dailyWork: 1,
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        allDates: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $add: [
                    {
                      $dateDiff: {
                        startDate: "$workStartDate",
                        endDate: "$workEndDate",
                        unit: "day",
                      },
                    },
                    1,
                  ],
                },
              ],
            },
            as: "dayOffset",
            in: {
              $add: [
                "$workStartDate",
                {
                  $multiply: ["$$dayOffset", 24 * 60 * 60 * 1000],
                },
              ],
            },
          },
        },
        existingDates: {
          $map: {
            input: "$dailyWork",
            as: "dw",
            in: "$$dw.date",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        missingDates: {
          $filter: {
            input: "$allDates",
            as: "date",
            cond: {
              $not: {
                $in: ["$$date", "$existingDates"],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        dailyWork: {
          $concatArrays: [
            "$dailyWork",
            {
              $map: {
                input: "$missingDates",
                as: "missingDate",
                in: {
                  date: "$$missingDate",
                  totalRevenue: 0,
                  pending: false,
                  duration: 0,
                  tripsDone: 0,
                  totalExpenditure: 0,
                  projectedRevenue: 0,
                  startIndex: 0,
                  endIndex: 0,
                  status: "created",
                },
              },
            },
          ],
        },
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project:
        /**
         * specifications: The fields to
         *   include or exclude.
         */
        {
          _id: 1,
          workStartDate: 1,
          equipment: 1,
          workEndDate: 1,
          dailyWork: 1,
          // status: "$dailyWork.status",
          status: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.status", // Keep status as "pending"
              else: "$status", // Change status to "approved"
            },
          },
          dispatch: 1,
          driver: 1,
          duration: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.duration", // Keep status as "pending"
              else: "$duration", // Change status to "approved"
            },
          },
          tripsDone: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.tripsDone", // Keep status as "pending"
              else: "$tripsDone", // Change status to "approved"
            },
          },
          totalExpenditure: 1,
          totalRevenue: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.totalRevenue", // Keep status as "pending"
              else: "$totalRevenue", // Change status to "approved"
            },
          },
          projectedRevenue: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.projectedRevenue", // Keep status as "pending"
              else: "$projectedRevenue", // Change status to "approved"
            },
          },
          startIndex: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.startIndex", // Keep status as "pending"
              else: "$startIndex", // Change status to "approved"
            },
          },
          endIndex: {
            $cond: {
              if: { $eq: ["$siteWork", true] }, // Check if status is "pending"
              then: "$dailyWork.endIndex", // Keep status as "pending"
              else: "$endIndex", // Change status to "approved"
            },
          },
          siteWork: 1,
          dailyWork: 1,
        },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        transactionDate: new Date(transactionDate),
      },
    },
    {
      $lookup: {
        from: "drivers",
        localField: "driver",
        foreignField: "user",
        as: "driver",
      },
    },
    {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "driver.user",
        foreignField: "_id",
        as: "driver",
      },
    },
    {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        status: {
          $ifNull: ["$status", "stopped"],
        },
      },
    },
    {
      $sort: {
        "equipment.eqDescription": 1,
      },
    },
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);

    let _jobs = [...jobs];

    // let __jobs = _jobs.map((v) => {
    //   let strRevenue = v?.newTotalRevenue?.toLocaleString() || "0";
    //   v.strRevenue = strRevenue;
    //   return v;
    // });

    return _jobs;
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function getDailyNotPostedRevenues(month, year, userId) {
  let pipeline = [
    {
      $match: {
        "equipment.vendor": new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        originalWorkEndDate: "$workEndDate",
        workEndDate: {
          $cond: {
            if: { $gt: ["$workEndDate", new Date()] },
            then: new Date(),
            else: "$workEndDate",
          },
        },
        dailyWork: 1,
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        allDates: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $add: [
                    {
                      $dateDiff: {
                        startDate: "$workStartDate",
                        endDate: "$workEndDate",
                        unit: "day",
                      },
                    },
                    1,
                  ],
                },
              ],
            },
            as: "dayOffset",
            in: {
              $add: [
                "$workStartDate",
                {
                  $multiply: ["$$dayOffset", 24 * 60 * 60 * 1000],
                },
              ],
            },
          },
        },
        existingDates: {
          $map: {
            input: "$dailyWork",
            as: "dw",
            in: "$$dw.date",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        missingDates: {
          $filter: {
            input: "$allDates",
            as: "date",
            cond: {
              $not: {
                $in: ["$$date", "$existingDates"],
              },
            },
          },
        },
      },
    },

    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        dailyWork: {
          $concatArrays: [
            "$dailyWork",
            {
              $map: {
                input: "$missingDates",
                as: "missingDate",
                in: {
                  date: "$$missingDate",
                  details: "No details yet",
                },
              },
            },
          ],
        },
      },
    },

    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $match: {
        month: parseInt(month),
        year: parseInt(year),
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$transactionDate",
            },
          },
        },
        totalRevenue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ];
  try {
    let validatedJobs = await workData.model.aggregate(pipeline);

    let list = validatedJobs.map(($) => {
      return {
        totalRevenue: $?.totalRevenue.toLocaleString(),
        id: $?._id,
      };
    });
    return list;
  } catch (err) {
    return err;
  }
}

async function getNotPostedRevenuedByVendor(userId) {
  //get vendor from name

  let pipeline = [
    {
      $match: {
        "equipment.vendor": new ObjectId(userId),
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        status: 1,
        dispatch: 1,
        driver: 1,
        duration: 1,
        tripsDone: 1,
        totalExpenditure: 1,
        totalRevenue: 1,
        projectedRevenue: 1,
        startIndex: 1,
        endIndex: 1,
        siteWork: 1,
        originalWorkEndDate: "$workEndDate",
        workEndDate: {
          $cond: {
            if: { $gt: ["$workEndDate", new Date()] },
            then: new Date(),
            else: "$workEndDate",
          },
        },
        dailyWork: 1,
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        equipment: 1,
        workEndDate: 1,
        dailyWork: 1,
        allDates: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $add: [
                    {
                      $dateDiff: {
                        startDate: "$workStartDate",
                        endDate: "$workEndDate",
                        unit: "day",
                      },
                    },
                    1,
                  ],
                },
              ],
            },
            as: "dayOffset",
            in: {
              $add: [
                "$workStartDate",
                {
                  $multiply: ["$$dayOffset", 24 * 60 * 60 * 1000],
                },
              ],
            },
          },
        },
        existingDates: {
          $map: {
            input: "$dailyWork",
            as: "dw",
            in: "$$dw.date",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        workEndDate: 1,
        equipment: 1,
        dailyWork: 1,
        missingDates: {
          $filter: {
            input: "$allDates",
            as: "date",
            cond: {
              $not: {
                $in: ["$$date", "$existingDates"],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        workStartDate: 1,
        workEndDate: 1,
        equipment: 1,
        dailyWork: {
          $concatArrays: [
            "$dailyWork",
            {
              $map: {
                input: "$missingDates",
                as: "missingDate",
                in: {
                  date: "$$missingDate",
                  details: "No details yet",
                },
              },
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "driver",
        foreignField: "_id",
        as: "driver",
      },
    },
    {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$dailyWork",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        transactionDate: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$workStartDate",
            else: "$dailyWork.date",
          },
        },
      },
    },
    {
      $addFields: {
        newTotalRevenue: {
          $cond: {
            if: {
              $eq: ["$siteWork", false],
            },
            then: "$totalRevenue",
            else: "$dailyWork.totalRevenue",
          },
        },
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    {
      $project: {
        "driver.password": 0,
      },
    },
    {
      $sort: {
        "equipment.eqDescription": 1,
      },
    },
    {
      $group: {
        _id: {
          month: {
            $month: "$transactionDate",
          },
          year: {
            $year: "$transactionDate",
          },
        },
        totalRevenue: {
          $sum: "$newTotalRevenue",
        },
      },
    },
    {
      $match: {
        $or: [
          {
            "_id.month": {
              $gte: 6,
            },
            "_id.year": {
              $gte: 2024,
            },
          },
          {
            "_id.year": {
              $gt: 2024,
            },
          },
        ],
      },
    },
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);

    let _jobs = [...jobs];
    let list = _jobs.map((v) => {
      // let strRevenue = v?.newTotalRevenue?.toLocaleString() || "0";
      // v.strRevenue = strRevenue;
      v.monthYear = monthHelper(v?._id.month) + "-" + v?._id.year;
      v.id = v?._id;
      return v;
    });
    list.sort((a, b) => {
      if (b.id.year !== a.id.year) {
        return b.id.year - a.id.year;
      }
      return b.id.month - a.id.month;
    });
    return list;
  } catch (err) {
    console.log(err);
    return err;
  }
}

function monthHelper(mon) {
  switch (parseInt(mon)) {
    case 1:
      return "Jan";
      break;

    case 2:
      return "Feb";
      break;

    case 3:
      return "Mar";
      break;

    case 4:
      return "Apr";
      break;

    case 5:
      return "May";
      break;

    case 6:
      return "Jun";
      break;

    case 7:
      return "Jul";
      break;

    case 8:
      return "Aug";
      break;

    case 9:
      return "Sep";
      break;

    case 10:
      return "Oct";
      break;

    case 11:
      return "Nov";
      break;

    case 12:
      return "Dec";
      break;

    default:
      break;
  }
}

async function updateCustomerRecord(oldCustomerName, newCustomerName) {
  try {
    return await workData.model.updateMany(
      {
        "project.customer": oldCustomerName,
      },
      { $set: { "project.customer": newCustomerName } }
    );
  } catch (err) {}
}

async function getListOfEquipmentOnDuty(startDate, endDate, shift, siteWork) {
  let pipeline_siteWork = [
    {
      $addFields: {
        workDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$workStartDate",
          },
        },
        workEndingDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$workEndDate",
          },
        },
      },
    },
    {
      $addFields: {
        workDate2: {
          $dateFromString: {
            dateString: "$workDate",
          },
        },
        workEndDate2: {
          $dateFromString: {
            dateString: "$workEndingDate",
          },
        },
      },
    },
    {
      $match: {
        $and: [
          {
            status: {
              $in: ["in progress", "on going", "created"],
            },
          },
          {
            "dispatch.shift": {
              $eq: shift,
            },
          },
          {
            $or: [
              {
                $or: [
                  {
                    $and: [
                      {
                        siteWork: true,
                      },
                      {
                        workDate2: {
                          $gte: moment(startDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                      {
                        workEndDate2: {
                          $lte: moment(endDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        siteWork: true,
                      },
                      {
                        workDate2: {
                          $gte: moment(startDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                      {
                        workDate2: {
                          $lte: moment(endDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                      {
                        workEndDate2: {
                          $gte: moment(endDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        siteWork: true,
                      },
                      {
                        workDate2: {
                          $lte: moment(startDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                      {
                        workDate2: {
                          $lte: moment(endDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                      {
                        workEndDate2: {
                          $gte: moment(endDate)
                            .utcOffset(0)
                            .set({
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0,
                            })
                            .toDate(),
                        },
                      },
                    ],
                  },
                ],
              },
              {
                $and: [
                  { siteWork: false },
                  {
                    workDate2: {
                      $eq: moment(startDate)
                        .utcOffset(0)
                        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                        .toDate(),
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      $project: {
        "equipment.plateNumber": 1,
      },
    },
    {
      $group: {
        _id: "$equipment.plateNumber",
        fieldN: {
          $count: {},
        },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ];

  let pipeline_NormalWork = [
    {
      $match: {
        status: {
          $in: ["in progress", "on going", "created"],
        },

        "dispatch.shift": {
          $eq: shift,
        },

        $or: [
          // {
          //   $and:[
          //     {
          //       workDate2: {
          //         $eq: moment(startDate)
          //           .utcOffset(0)
          //           .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          //           .toDate(),
          //       },
          //     },
          //     {
          //       workEndDate: {
          //         $eq: moment(startDate)
          //           .utcOffset(0)
          //           .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          //           .toDate(),
          //       },
          //     },
          //   ]
          // },
          {
            $and: [
              {
                workStartDate: {
                  $gte: moment(startDate)
                    .utcOffset(0)
                    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                    .toDate(),
                },
              },
              {
                workEndDate: {
                  $lte: moment(startDate)
                    .utcOffset(0)
                    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                    .toDate(),
                },
              },
            ],
          },
        ],
      },
    },
    {
      $project: {
        "equipment.plateNumber": 1,
      },
    },
    {
      $group: {
        _id: "$equipment.plateNumber",
        fieldN: {
          $count: {},
        },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ];

  let pipeline_oneDayWork = [
    {
      $addFields: {
        workDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$workStartDate",
          },
        },
      },
    },
    {
      $addFields: {
        workDate2: {
          $dateFromString: {
            dateString: "$workDate",
          },
        },
      },
    },
    {
      $match: {
        status: {
          $in: ["in progress", "on going", "created"],
        },
        workDate2: {
          $eq: moment(startDate)
            .utcOffset(0)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate(),
        },
        "dispatch.shift": {
          $eq: shift,
        },
      },
    },
    {
      $project: {
        "equipment.plateNumber": 1,
      },
    },
    {
      $group: {
        _id: "$equipment.plateNumber",
        fieldN: {
          $count: {},
        },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ];

  return workData.model.aggregate(pipeline_siteWork);
}

async function stopWork(
  id,
  endIndex,
  tripsDone,
  comment,
  moreComment,
  postingDate,
  stoppedBy,
  duration
) {
  // let dd = postingDate?.split(".")[0];
  // let mm = postingDate?.split(".")[1];
  // let yyyy = postingDate?.split(".")[2];
  // if (dd?.length < 2) dd = "0" + dd;
  // if (mm?.length < 2) mm = "0" + mm;
  // if (dd && mm && yyyy) postingDate = `${yyyy}-${mm}-${dd}`;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    duration = _.round(duration, 2);

    //You can only stop jobs in progress

    let equipment = await eqData.model.findById(work?.equipment?._id);
    let workEnded = false;

    duration = equipment?.uom == "hour" ? duration / 3600000 : duration;

    if (duration > DURATION_LIMIT) duration = DURATION_LIMIT;

    if (work.siteWork) {
      let dailyWorks = [...work.dailyWork];
      let indexToUpdate = -1;
      let initDuration = 0;
      let savedRecord;

      let worksAfterEffectiveDate = dailyWorks?.filter((d) =>
        moment(d?.date).isSameOrAfter(moment(postingDate))
      );

      worksAfterEffectiveDate.map(async (dailyWork) => {
        let currentTotalRevenue = work.totalRevenue;
        let currentDuration = work.duration;
        let currentTotalExpenditure = work.totalExpenditure;
        duration =
          equipment?.uom == "hour"
            ? dailyWork?.duration / 3600000
            : dailyWork?.duration;
        // work.status = workEnded ? "stopped" : "on going";
        if (duration > DURATION_LIMIT) duration = DURATION_LIMIT;

        let _duration = Math.abs(work.endTime - work.startTime);

        let startIndex = work.startIndex ? work.startIndex : 0;
        dailyWork.endIndex = endIndex
          ? parseInt(endIndex)
          : parseInt(startIndex);
        dailyWork.startIndex = parseInt(startIndex);

        let uom = equipment?.uom;
        let rate = equipment?.rate;
        let supplierRate = equipment?.supplierRate;
        let revenue = 0;
        let expenditure = 0;

        // if rate is per hour and we have target trips to be done
        if (uom === "hour") {
          dailyWork.projectedRevenue = rate * 5;
          if (comment === "Should never happen") {
            dailyWork.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * dailyWork.duration) / 3600000;
            expenditure = (supplierRate * dailyWork.duration) / 3600000;
          } else {
            dailyWork.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * dailyWork.duration) / 3600000;
            expenditure = (supplierRate * dailyWork.duration) / 3600000;
          }
        }

        //if rate is per day
        if (uom === "day") {
          // work.duration = duration;
          // revenue = rate * duration;
          if (comment === "Should neve happen") {
            //reason that does not exist
            dailyWork.duration = duration;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate * (duration >= 1 ? 1 : 0);
          } else {
            dailyWork.duration = duration;

            let targetDuration = 5;
            let durationRation =
              duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
            dailyWork.duration = duration;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate;
          }
        }

        dailyWork.rate = rate;
        dailyWork.uom = uom;
        dailyWork.totalRevenue = revenue ? revenue : 0;
        dailyWork.totalExpenditure = expenditure ? expenditure : 0;

        dailyWork.comment = comment;
        dailyWork.moreComment = moreComment;
        // dailyWork.pending = false;

        indexToUpdate = dailyWorks.find((d, i) => {
          if (moment(d.date).isSameOrAfter(moment(postingDate))) {
            return i;
          }
        });
        dailyWorks[indexToUpdate] = dailyWork;
        work.startIndex =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);
        work.dailyWork = dailyWorks;
        work.duration = dailyWork.duration + currentDuration;
        work.totalRevenue = currentTotalRevenue + revenue;
        work.totalExpenditure = currentTotalExpenditure + expenditure;
        work.moreComment = moreComment;
        work.equipment = equipment;

        //log saving
        let log = {
          action: "DISPATCH STOPPED",
          doneBy: stoppedBy,
          request: {
            endIndex,
            tripsDone,
            comment,
            moreComment,
            postingDate,
            stoppedBy,
            duration,
          },
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();
      });

      savedRecord = await work.save();

      return savedRecord;
      // let dailyWork = {};
    } else {
      let startIndex = work.startIndex ? work.startIndex : 0;
      let equipment = await eqData.model.findById(work?.equipment?._id);

      work.endTime = Date.now();
      let _duration = Math.abs(work.endTime - work.startTime);

      work.endIndex =
        endIndex || startIndex !== 0
          ? parseInt(endIndex)
          : parseInt(startIndex);
      work.startIndex = parseInt(startIndex);
      work.tripsDone = parseInt(tripsDone);
      let uom = equipment?.uom;

      let rate = equipment?.rate;
      let supplierRate = equipment?.supplierRate;
      let targetTrips = parseInt(work?.dispatch?.targetTrips); //TODO

      let tripsRatio = tripsDone / (targetTrips ? targetTrips : 1);
      let revenue = 0;
      let expenditure = 0;

      // if rate is per hour and we have target trips to be done
      if (uom === "hour") {
        if (comment === "Should never happen") {
          work.duration = duration > 0 ? duration * 3600000 : 0;
          revenue = (rate * work.duration) / 3600000;
          expenditure = (supplierRate * work.duration) / 3600000;
        } else {
          work.duration = duration > 0 ? duration * 3600000 : 0;
          revenue =
            tripsRatio > 0
              ? (tripsRatio * (rate * work.duration)) / 3600000
              : (rate * work.duration) / 3600000;
          expenditure =
            tripsRatio > 0
              ? (tripsRatio * (supplierRate * work.duration)) / 3600000
              : (supplierRate * work.duration) / 3600000;
        }
      }

      //if rate is per day
      if (uom === "day") {
        // work.duration = duration;
        // revenue = rate * duration;
        if (comment == "Should never happen") {
          work.duration = duration / HOURS_IN_A_DAY;
          revenue = rate * (duration >= 1 ? 1 : 0);
          expenditure = supplierRate * (duration >= 1 ? 1 : 0);
        } else {
          let tripRatio = tripsDone / targetTrips;
          work.duration = tripRatio;
          if (
            tripsDone &&
            targetTrips &&
            equipment?.eqDescription === "TIPPER TRUCK"
          ) {
            if (tripRatio >= 1) {
              revenue = rate * tripRatio;
              expenditure = supplierRate;
              // revenue = rate;
            } else {
              revenue = rate * tripRatio;
              expenditure = supplierRate * tripRatio;
            }
          }
          if (
            !targetTrips ||
            targetTrips == "0" ||
            equipment?.eqDescription !== "TIPPER TRUCK"
          ) {
            {
              let targetDuration = 5;
              let durationRation =
                duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
              work.duration = duration / HOURS_IN_A_DAY;
              revenue = rate;
              expenditure = supplierRate;
            }
          }
        }
      }

      work.rate = rate;
      work.uom = uom;
      work.totalRevenue = revenue ? revenue : 0;
      work.totalExpenditure = expenditure ? expenditure : 0;
      work.comment = comment;
      work.moreComment = moreComment;
      equipment._id = new ObjectId(equipment?._id);
      work.equipment = equipment;

      let savedRecord = await work.save();

      // await equipment.save();

      //log saving
      let log = {
        action: "DISPATCH STOPPED",
        doneBy: stoppedBy,
        request: {
          endIndex,
          tripsDone,
          comment,
          moreComment,
          postingDate,
          stoppedBy,
          duration,
        },
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      return savedRecord;
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  router,
  updateCustomerRecord,
  getListOfEquipmentOnDuty,
  stopWork,
};
