const router = require("express").Router();
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const employeeData = require("../models/employees");
const assetAvblty = require("../models/assetAvailability");
const userData = require("../models/users");
const logData = require("../models/logs");
const eqData = require("../models/equipments");
const moment = require("moment");
const e = require("express");
const { isNull, intersection } = require("lodash");
const { default: mongoose } = require("mongoose");
const send = require("../utils/sendEmailNode");
const { sendEmail } = require("./sendEmailRoute");
const logs = require("../models/logs");
const { getDeviceToken } = require("../controllers.js/employees");
const MS_IN_A_DAY = 86400000;
const HOURS_IN_A_DAY = 8;
const ObjectId = require("mongoose").Types.ObjectId;

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
    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
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
    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
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

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
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

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
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
  } = req.query;
  let { page } = req.params;
  let perPage = 15;
  let query = {};
  let searchByPlateNumber = searchText && searchText.length >= 1;
  let searchByProject = project && project.length >= 1;

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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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

              "project.prjDescription": userProject,
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
      .limit(perPage)
      .skip(parseInt(page - 1) * perPage)
      .sort([["_id", "descending"]]);

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));

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

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));

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
  // console.log(isValidObjectId(driverId));
  try {
    let workList = await workData.model
      .find(
        {
          $or: [
            {
              "equipment.eqOwner": driverId,
              status: { $ne: "stopped" },
            },
            {
              driver: isValidObjectId(driverId) ? driverId : "123456789011",
              status: { $ne: "stopped" },
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

    let listToSend = workList
      .filter(
        (w) =>
          w.siteWork === false ||
          (w.siteWork === true &&
            (w.status === "in progress" || w.status === "on going")) ||
          (w.siteWork === true &&
            _.filter(w.dailyWork, (dW) => {
              return dW.date === moment().format("DD-MMM-YYYY");
            }).length === 0)
      )
      .filter(
        (w) =>
          // !isNull(w.driver) &&
          !isNull(w.workDone) && w.status !== "recalled"
      );

    let siteWorkList = [];

    let l = listToSend.map((w) => {
      let work = null;

      if (w.siteWork && w.status !== "stopped" && w.status !== "recalled") {
        let dailyWorks = w.dailyWork;

        let datesPosted = dailyWorks
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
            !_.includes(datesPosted, d) &&
            !_.includes(datesPendingPosted, d) &&
            moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
        );

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
            dispatchDate: new Date(dP).toISOString(),
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

        dateNotPosted.map((dNP) => {
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
            // millage: w.equipment.millage ? w.equipment.millage : 0,
          });
        });
      } else {
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
          // millage: w.equipment.millage ? w.equipment.millage : 0,
        };
      }

      return work;
    });

    let finalList = l.concat(siteWorkList);

    let orderedList = _.orderBy(finalList, "dispatchDate", "desc");

    res.status(200).send(orderedList.filter((d) => !isNull(d)));
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3/toreverse/:plateNumber", async (req, res) => {
  let { plateNumber } = req.params;
  let { startDate, endDate } = req.query;
  // console.log(isValidObjectId(driverId));
  if (plateNumber && startDate && endDate) {
    try {
      let workList = await workData.model
        .find(
          {
            "equipment.plateNumber": { $regex: plateNumber.toUpperCase() },
            workStartDate: { $gte: moment(startDate) },
            workStartDate: { $lte: moment(endDate).add(23, "hours") },
            $or: [
              { status: "stopped" },
              { status: "rejected" },
              { status: "on going", "dailyWork.pending": false },
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

      let listToSend = workList;

      let siteWorkList = [];

      let l = listToSend.map((w) => {
        let work = null;

        if (w.siteWork === true) {
          let dailyWorks = w.dailyWork;

          let datesPosted = dailyWorks
            .filter((d) => d.pending === false && d.date!=='Invalid date')
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
          // console.log(datesPosted);

          let datesPendingPosted = dailyWorks
            .filter((d) => d.pending === true)

            .map((d) => {
              return d.date;
            });
          // let workStartDate = moment(w.workStartDate);
          // let workDurationDays = w.workDurationDays;

          // let datesToPost = [workStartDate.format("DD-MMM-YYYY")];
          // for (let i = 0; i < workDurationDays - 1; i++) {
          //   datesToPost.push(workStartDate.add(1, "days").format("DD-MMM-YYYY"));
          // }

          datesPosted.map((dP) => {
            siteWorkList.push({
              _id: dP._id,
              driverName: w.driver
                ? w.driver?.firstName + " " + w.driver?.lastName
                : w.equipment?.eqOwner,
              owner: w.equipment?.eqOwner,
              totalRevenue: parseFloat(dP.totalRevenue).toFixed(2),
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

          // dateNotPosted.map((dNP) => {
          //   siteWorkList.push({
          //     workDone: w.workDone
          //       ? w.workDone
          //       : {
          //           _id: "62690b67cf45ad62aa6144d8",
          //           jobDescription: "Others",
          //           eqType: "Truck",
          //           createdOn: "2022-04-27T09:20:50.911Z",
          //           __v: 0,
          //         },
          //     _id: w._id,
          //     status: "created",
          //     project: w.project,
          //     createdOn: w.createdOn,
          //     equipment: w.equipment,
          //     siteWork: w.siteWork,
          //     targetTrips: w.dispatch.targetTrips
          //       ? w.dispatch.targetTrips
          //       : "N/A",
          //     workStartDate: w.workStartDate,
          //     dispatchDate: new Date(dNP).toISOString(),
          //     shift: w.dispatch.shift === "nightShift" ? "N" : "D",
          //     startIndex: w.startIndex
          //       ? parseFloat(w.startIndex).toFixed(2)
          //       : // ?
          //         //   w.startIndex
          //         "0.0",
          //     millage: parseFloat(
          //       w.equipment.millage ? w.equipment.millage : 0
          //     ).toFixed(2),
          //   });
          // });

          // datesPendingPosted.map((dPP) => {
          //   siteWorkList.push({
          //     workDone: w.workDone
          //       ? w.workDone
          //       : {
          //           _id: "62690b67cf45ad62aa6144d8",
          //           jobDescription: "Others",
          //           eqType: "Truck",
          //           createdOn: "2022-04-27T09:20:50.911Z",
          //           __v: 0,
          //         },
          //     _id: w._id,
          //     status: "in progress",
          //     project: w.project,
          //     createdOn: w.createdOn,
          //     equipment: w.equipment,
          //     siteWork: w.siteWork,
          //     targetTrips: w.dispatch.targetTrips
          //       ? w.dispatch.targetTrips
          //       : "N/A",
          //     workStartDate: w.workStartDate,
          //     dispatchDate: new Date(dPP).toISOString(),
          //     shift: w.dispatch.shift === "nightShift" ? "N" : "D",
          //     startIndex: w.startIndex
          //       ? parseFloat(w.startIndex).toFixed(2)
          //       : //  ? w.startIndex
          //         "0.0",
          //     millage: parseFloat(
          //       w.equipment.millage ? w.equipment.millage : 0
          //     ).toFixed(2),
          //     // millage: w.equipment.millage ? w.equipment.millage : 0,
          //   });
          // });
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
            // millage: w.equipment.millage ? w.equipment.millage : 0,
          };
        }

        return work;
      });

      let finalList = l.concat(siteWorkList);

      let orderedList = _.orderBy(finalList, "dispatchDate", "desc");

      res.status(200).send(orderedList.filter((d) => !isNull(d)));
    } catch (err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res
      .send({
        error: true,
        message: "Please give all the query parameters!",
      })
      .status(204);
  }
});

router.get("/detailed/:canViewRevenues", async (req, res) => {
  let { canViewRevenues } = req.params;
  let { startDate, endDate, searchText, project } = req.query;
  
  let query = {};
  let searchByPlateNumber = searchText && searchText.length >= 1;
  let searchByProject = project && project.length >= 1;

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

   try {
      let workList = await workData.model
        .find(query, {
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
        })
        .populate("driver")
        .populate("appovedBy")
        .populate("createdBy")
        .populate("workDone")
        .sort([["_id", "descending"]]);

      let listToSend = workList;

      let siteWorkList = [];

      let l = listToSend.map((w, index) => {
        let work = null;

        if (w.siteWork && w.status !== "stopped" && w.status !== 'recalled') {
          let dailyWorks = w.dailyWork;

          let datesPosted = dailyWorks
            .filter((d) => d.pending === false)
            .map((d) => {
              return {
                date: d.date,
                duration: d.duration,
                actualRevenue: d.totalRevenue,
                expenditure: d.totalExpenditure,
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
            datesToPost.push(
              workStartDate.add(1, "days").format("DD-MMM-YYYY")
            );
          }

          let dateNotPosted = datesToPost.filter(
            (d) =>
              !_.includes(datePosted_Dates, d) &&
              !_.includes(datesPendingPosted, d) &&
              moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
          );
          // {
          //     'Dispatch date': moment(Date.parse(w.dispatch?.date),
          //     'Dispatch Shift': w.dispatch?.shift?.toLocaleUpperCase(),
          //     'Site work': w.siteWork ? 'YES' : 'NO',
          //     'Project Description': w.project.prjDescription,
          //     'Equipment-PlateNumber': w.equipment?.plateNumber,
          //     'Equipment Type': w.equipment?.eqDescription,
          //     'Duration (HRS)':
          //       w.equipment?.uom === 'hour' ? msToTime(w.duration) : 0,
          //     'Duration (DAYS)':
          //       w.equipment?.uom === 'day'
          //         ? Math.round(w.duration * 100) / 100
          //         : 0,
          //     'Work done': w?.workDone?.jobDescription,
          //     'Other work description': w.dispatch?.otherJobType,
          // 'Driver Names': w.driver
          //   ? w?.driver?.firstName + ' ' + w?.driver?.lastName
          //   : w.equipment?.eqOwner,
          //     'Driver contacts': w.driver?.phone,
          //     'Target trips': w.dispatch?.targetTrips,
          //     'Trips done': w?.tripsDone,
          //     "Driver's/Operator's Comment": w.comment,
          //     Customer: w.project?.customer,
          //     Status: w.status,
          //   }

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
                "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
                "Site work?": w.siteWork,
                "Project Description": w.project?.prjDescription,
                "Equipment Plate number": w.equipment.plateNumber,
                "Equipment Type": w.equipment?.eqDescription,
                "Unit of measurement": w.equipment?.uom,
                "Duration (HRS)":
                  w.equipment?.uom === "hour"
                    ? dP.duration / (60 * 60 * 1000)
                    : 0,
                "Duration (DAYS)": w.equipment?.uom === "day" ? dP.duration : 0,
                "Work done": w?.workDone
                  ? w?.workDone?.jobDescription
                  : "Others",
                "Other work description": w.dispatch?.otherJobType,
                ...(canViewRevenues==='true' || canViewRevenues===true) && {
                  "Projected Revenue":
                    w.equipment?.uom === "hour"
                      ? w.equipment?.rate * 5
                      : w.equipment?.rate,
                  "Actual Revenue": dP.actualRevenue,
                  "Vendor payment": dP.expenditure,
                },

                "Driver Names": w.driver
                  ? w?.driver?.firstName + " " + w?.driver?.lastName
                  : w.equipment?.eqOwner,
                "Driver contacts": w.driver?.phone,
                "Target trips": w.dispatch?.targetTrips
                  ? w.dispatch?.targetTrips
                  : 0,
                "Trips done": w?.tripsDone ? w?.tripsDone : 0,
                "Driver's/Operator's Comment": dP.comment
                  ? dP.comment + " - " + (dP.moreComment ? dP.moreComment : "")
                  : " ",
                Customer: w.project?.customer,
                Status: "stopped",
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
                "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
                "Site work?": w.siteWork,
                "Project Description": w.project.prjDescription,
                "Equipment Plate number": w.equipment.plateNumber,
                "Equipment Type": w.equipment?.eqDescription,
                "Unit of measurement": w.equipment?.uom,
                "Duration (HRS)": 0,
                "Duration (DAYS)": 0,
                "Work done": w?.workDone
                  ? w?.workDone?.jobDescription
                  : "Others",
                "Other work description": w.dispatch?.otherJobType,
                ...(canViewRevenues==='true' || canViewRevenues===true) && {"Projected Revenue":
                w.equipment?.uom === "hour"
                  ? w.equipment?.rate * 5
                  : w.equipment?.rate,
              "Actual Revenue": 0,
              "Vendor payment": 0,},
                
                "Driver Names": w.driver
                  ? w?.driver?.firstName + " " + w?.driver?.lastName
                  : w.equipment?.eqOwner,
                "Driver contacts": w.driver?.phone ? w.driver?.phone : " ",
                "Target trips": w.dispatch?.targetTrips
                  ? w.dispatch?.targetTrips
                  : 0,
                "Trips done": 0,
                "Driver's/Operator's Comment": dNP.comment
                  ? dNP.comment +
                    " - " +
                    (dNP.moreComment ? dNP.moreComment : "")
                  : " ",
                Customer: w.project?.customer,
                Status: "created",
              });
            }
          });

          // console.log(siteWorkList);

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
                "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
                "Site work?": w.siteWork,
                "Project Description": w.project.prjDescription,
                "Equipment Plate number": w.equipment.plateNumber,
                "Equipment Type": w.equipment?.eqDescription,
                "Unit of measurement": w.equipment?.uom,
                "Duration (HRS)": 0,
                "Duration (DAYS)": 0,
                "Work done": w?.workDone
                  ? w?.workDone?.jobDescription
                  : "Others",
                "Other work description": w.dispatch?.otherJobType,
                ...(canViewRevenues==='true' || canViewRevenues===true) && {"Projected Revenue":
                w.equipment?.uom === "hour"
                  ? w.equipment?.rate * 5
                  : w.equipment?.rate,
              "Actual Revenue": 0,
              "Vendor payment": 0,},
                
                "Driver Names": w.driver
                  ? w?.driver?.firstName + " " + w?.driver?.lastName
                  : w.equipment?.eqOwner,
                "Driver contacts": w.driver?.phone ? w.driver?.phone : " ",
                "Target trips": w.dispatch?.targetTrips
                  ? w.dispatch?.targetTrips
                  : 0,
                "Trips done": 0,
                "Driver's/Operator's Comment": dPP.comment
                  ? dPP.comment +
                    " - " +
                    (dPP.moreComment ? dPP.moreComment : "")
                  : " ",
                Customer: w.project?.customer,
                Status: "in progress",
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
            datesToPost.push(
              workStartDate.add(1, "days").format("DD-MMM-YYYY")
            );
          }

          let dateNotPosted = datesToPost.filter(
            (d) =>
              !_.includes(datePosted_Dates, d) &&
              !_.includes(datesPendingPosted, d) &&
              moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
          );
          // {
          //     'Dispatch date': moment(Date.parse(w.dispatch?.date),
          //     'Dispatch Shift': w.dispatch?.shift?.toLocaleUpperCase(),
          //     'Site work': w.siteWork ? 'YES' : 'NO',
          //     'Project Description': w.project.prjDescription,
          //     'Equipment-PlateNumber': w.equipment?.plateNumber,
          //     'Equipment Type': w.equipment?.eqDescription,
          //     'Duration (HRS)':
          //       w.equipment?.uom === 'hour' ? msToTime(w.duration) : 0,
          //     'Duration (DAYS)':
          //       w.equipment?.uom === 'day'
          //         ? Math.round(w.duration * 100) / 100
          //         : 0,
          //     'Work done': w?.workDone?.jobDescription,
          //     'Other work description': w.dispatch?.otherJobType,
          // 'Driver Names': w.driver
          //   ? w?.driver?.firstName + ' ' + w?.driver?.lastName
          //   : w.equipment?.eqOwner,
          //     'Driver contacts': w.driver?.phone,
          //     'Target trips': w.dispatch?.targetTrips,
          //     'Trips done': w?.tripsDone,
          //     "Driver's/Operator's Comment": w.comment,
          //     Customer: w.project?.customer,
          //     Status: w.status,
          //   }

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
                "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
                "Site work?": w.siteWork,
                "Project Description": w.project?.prjDescription,
                "Equipment Plate number": w.equipment.plateNumber,
                "Equipment Type": w.equipment?.eqDescription,
                "Unit of measurement": w.equipment?.uom,
                "Duration (HRS)":
                  w.equipment?.uom === "hour"
                    ? dP.duration / (60 * 60 * 1000)
                    : 0,
                "Duration (DAYS)": w.equipment?.uom === "day" ? dP.duration : 0,
                "Work done": w?.workDone
                  ? w?.workDone?.jobDescription
                  : "Others",
                "Other work description": w.dispatch?.otherJobType,
                ...(canViewRevenues==='true' || canViewRevenues===true) && {"Projected Revenue":
                w.equipment?.uom === "hour"
                  ? w.equipment?.rate * 5
                  : w.equipment?.rate,
              "Actual Revenue": dP.actualRevenue,
              "Vendor payment": dP.expenditure,},
                
                "Driver Names": w.driver
                  ? w?.driver?.firstName + " " + w?.driver?.lastName
                  : w.equipment?.eqOwner,
                "Driver contacts": w.driver?.phone,
                "Target trips": w.dispatch?.targetTrips
                  ? w.dispatch?.targetTrips
                  : 0,
                "Trips done": w?.tripsDone ? w?.tripsDone : 0,
                "Driver's/Operator's Comment": dP.comment
                  ? dP.comment + " - " + (dP.moreComment ? dP.moreComment : "")
                  : " ",
                Customer: w.project?.customer,
                Status: "stopped",
              });
            }
          });

          // dateNotPosted.map((dNP) => {
          //   if (
          //     moment(Date.parse(dNP)).isSameOrAfter(moment(startDate)) &&
          //     moment(Date.parse(dNP)).isSameOrBefore(
          //       moment(endDate)
          //         .add(23, "hours")
          //         .add(59, "minutes")
          //         .add(59, "seconds")
          //     )
          //   ) {
          //     siteWorkList.push({
          //       "Dispatch date": moment(Date.parse(dNP)).format("M/D/YYYY"),
          //       "Posted On": "",
          //       "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
          //       "Site work?": w.siteWork,
          //       "Project Description": w.project.prjDescription,
          //       "Equipment Plate number": w.equipment.plateNumber,
          //       "Equipment Type": w.equipment?.eqDescription,
          //       "Unit of measurement": w.equipment?.uom,
          //       "Duration (HRS)": 0,
          //       "Duration (DAYS)": 0,
          //       "Work done": w?.workDone
          //         ? w?.workDone?.jobDescription
          //         : "Others",
          //       "Other work description": w.dispatch?.otherJobType,
          //       "Projected Revenue":
          //         w.equipment?.uom === "hour"
          //           ? w.equipment?.rate * 5
          //           : w.equipment?.rate,
          //       "Actual Revenue": 0,
          //       "Vendor payment": 0,
          //       "Driver Names": w.driver
          //         ? w?.driver?.firstName + " " + w?.driver?.lastName
          //         : w.equipment?.eqOwner,
          //       "Driver contacts": w.driver?.phone ? w.driver?.phone : " ",
          //       "Target trips": w.dispatch?.targetTrips
          //         ? w.dispatch?.targetTrips
          //         : 0,
          //       "Trips done": 0,
          //       "Driver's/Operator's Comment": dNP.comment
          //         ? dNP.comment +
          //           " - " +
          //           (dNP.moreComment ? dNP.moreComment : "")
          //         : " ",
          //       Customer: w.project?.customer,
          //       Status: "created",
          //     });
          //   }
          // });

          // console.log(siteWorkList);

          // datesPendingPosted.map((dPP) => {
          //   if (
          //     moment(Date.parse(dPP)).isSameOrAfter(moment(startDate)) &&
          //     moment(Date.parse(dPP)).isSameOrBefore(
          //       moment(endDate)
          //         .add(23, "hours")
          //         .add(59, "minutes")
          //         .add(59, "seconds")
          //     )
          //   ) {
          //     siteWorkList.push({
          //       "Dispatch date": moment(Date.parse(dPP)).format("M/D/YYYY"),
          //       "Posted On": "",
          //       "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
          //       "Site work?": w.siteWork,
          //       "Project Description": w.project.prjDescription,
          //       "Equipment Plate number": w.equipment.plateNumber,
          //       "Equipment Type": w.equipment?.eqDescription,
          //       "Unit of measurement": w.equipment?.uom,
          //       "Duration (HRS)": 0,
          //       "Duration (DAYS)": 0,
          //       "Work done": w?.workDone
          //         ? w?.workDone?.jobDescription
          //         : "Others",
          //       "Other work description": w.dispatch?.otherJobType,
          //       "Projected Revenue":
          //         w.equipment?.uom === "hour"
          //           ? w.equipment?.rate * 5
          //           : w.equipment?.rate,
          //       "Actual Revenue": 0,
          //       "Vendor payment": 0,
          //       "Driver Names": w.driver
          //         ? w?.driver?.firstName + " " + w?.driver?.lastName
          //         : w.equipment?.eqOwner,
          //       "Driver contacts": w.driver?.phone ? w.driver?.phone : " ",
          //       "Target trips": w.dispatch?.targetTrips
          //         ? w.dispatch?.targetTrips
          //         : 0,
          //       "Trips done": 0,
          //       "Driver's/Operator's Comment": dPP.comment
          //         ? dPP.comment +
          //           " - " +
          //           (dPP.moreComment ? dPP.moreComment : "")
          //         : " ",
          //       Customer: w.project?.customer,
          //       Status: "in progress",
          //     });
          //   }
          // });
        } else if (w.siteWork === false || (w.siteWork && w.status ==='recalled')) {
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
              "Dispatch Shift": w.dispatch.shift === "nightShift" ? "N" : "D",
              "Site work?": w.siteWork,
              "Project Description": w.project.prjDescription,
              "Equipment Plate number": w.equipment.plateNumber,
              "Equipment Type": w.equipment?.eqDescription,
              "Unit of measurement": w.equipment?.uom,
              "Duration (HRS)":
                w.equipment?.uom === "hour" ? w.duration / (60 * 60 * 1000) : 0,
              "Duration (DAYS)": w.equipment?.uom === "day" ? w.duration : 0,
              "Work done": w?.workDone ? w?.workDone?.jobDescription : "Others",
              "Other work description": w.dispatch?.otherJobType,
              ...(canViewRevenues==='true' || canViewRevenues===true) && {
                "Projected Revenue":
                w.equipment?.uom === "hour"
                  ? w.equipment?.rate * 5
                  : w.equipment?.rate,
              "Actual Revenue": w.totalRevenue,
              "Vendor payment": w.totalExpenditure,
              },
              
              "Driver Names": w.driver
                ? w?.driver?.firstName + " " + w?.driver?.lastName
                : w.equipment?.eqOwner,
              "Driver contacts": w.driver?.phone,
              "Target trips": w.dispatch?.targetTrips,
              "Trips done": w?.tripsDone,
              "Driver's/Operator's Comment": w.comment
                ? w.comment
                : "" + " - " + (w.moreComment ? w.moreComment : ""),
              Customer: w.project?.customer,
              Status: w.status,
            };
          }
        }

        return work;
      });

      let finalList = l.concat(siteWorkList);

      let orderedList = _.orderBy(finalList, "Dispatch date", "desc");

      res.status(200).send(orderedList.filter((w) => w !== null));
    } catch (err) {
      res.send(err);
    }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model
      .findById(id)
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
      .populate("workDone");

    res.status(200).send(work);
  } catch (err) {
    res.send(err);
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
    res.send(monthlyRevenues);
  } catch (err) {
    res.send(err);
  }
});

router.get("/monthlyValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let result = await getValidatedRevenuesByProject(projectName);

  res.send(result);
});

router.get("/monthlyNonValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let result = await getNonValidatedRevenuesByProject(projectName);

  res.send(result);
});

router.get("/dailyValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  let result = await getDailyValidatedRevenues(projectName, month, year);

  res.send(result);
});

router.get("/dailyNonValidatedRevenues/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  let result = await getDailyNonValidatedRevenues(projectName, month, year);

  res.send(result);
});

router.get("/validatedList/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  let result = await getValidatedListByProjectAndMonth(
    projectName,
    month,
    year
  );

  res.send(result);
});

router.get("/nonValidatedList/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  let result = await getNonValidatedListByProjectAndMonth(
    projectName,
    month,
    year
  );

  res.send(result);
});

router.get("/validatedByDay/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { transactionDate } = req.query;
  let result = await getValidatedListByDay(projectName, transactionDate);

  res.send(result);
});

router.get("/nonValidatedByDay/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { transactionDate } = req.query;
  let result = await getNonValidatedListByDay(projectName, transactionDate);

  res.send(result);
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
      res.send(monthlyRevenues);
    } catch (err) {
      res.send(err);
    }
  }
);

router.post("/", async (req, res) => {
  try {
    let workToCreate = new workData.model(req.body);

    let equipment = await eqData.model.findById(workToCreate?.equipment?._id);
    equipment.eqStatus = "dispatched";
    equipment.assignedToSiteWork = req.body?.siteWork;
    equipment.assignedDate = moment(req.body?.workStartDate).format(
      "YYYY-MM-DD"
    );
    equipment.assignedEndDate = moment(req.body?.workEndDate).format(
      "YYYY-MM-DD"
    );
    equipment.assignedShift = req.body?.dispatch?.shift;
    let driver = req.body?.driver === "NA" ? null : req.body?.driver;

    let employee = await employeeData.model.findById(driver);
    if (employee) {
      employee.status = "dispatched";
      employee.assignedToSiteWork = req.body?.siteWork;
      employee.assignedDate = moment(req.body?.dispatch?.date);
      employee.assignedShift = req.body?.dispatch?.shift;
    }

    let rate = parseInt(equipment.rate);
    let uom = equipment.uom;
    let revenue = 0;
    let siteWork = req.body?.siteWork;
    let workDurationDays = req.body?.workDurationDays;

    await equipment.save();
    if (employee) await employee.save();

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
      employee?.firstName + " " + employee?.lastName
    } Muhawe akazi kuri ${req.body?.project?.prjDescription} taliki ${moment(
      req.body?.workStartDate
    ).format("DD-MMM-YYYY")} - ${req.body?.dispatch?.shift}, muzakoresha ${
      workToCreate?.equipment?.eqDescription
    } ${workToCreate?.equipment?.plateNumber}`;

    let driverToken = await getDeviceToken(driver);

    if (driverToken !== "none") {
      // sendPushNotification(driverToken, "New Dispatch!", driverNotification);
    }

    res.status(201).send(workCreated);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.send({
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

      res.status(201).send(workCreated);
    } else {
      res.status(201).send(bodyData);
    }
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.send({
      error,
      key,
    });
  }
});

router.post("/getAnalytics", async (req, res) => {
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
    let workList = await workData.model
      .find({
        // status:
        //   status === "final"
        //     ? { $in: ["approved", "stopped"] }
        //     : {
        //         $in: [
        //           "created",
        //           "in progress",
        //           "rejected",
        //           "stopped",
        //           "on going",
        //         ],
        //       },
      })
      .or([
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

      if (customer) {
        list = workList.filter((w) => {
          let nameLowerCase = w?.project?.customer?.toLowerCase();
          return nameLowerCase.includes(customer?.toLowerCase());
        });
      } else {
        list = workList;
      }

      if (project) {
        list = list.filter((w) => {
          let descLowerCase = w?.project?.prjDescription?.toLowerCase();
          return descLowerCase.includes(project.toLowerCase());
        });
      }

      if (equipment) {
        list = list.filter((w) => {
          let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
          return plateLowerCase.includes(equipment.toLowerCase());
        });
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

    if (customer) {
      listDays = workListByDay.filter((w) => {
        let nameLowerCase = w?.project?.customer?.toLowerCase();
        return nameLowerCase.includes(customer?.toLowerCase());
      });
    } else {
      listDays = workListByDay;
    }

    if (project) {
      listDays = listDays.filter((w) => {
        let descLowerCase = w?.project?.prjDescription?.toLowerCase();
        return descLowerCase.includes(project.toLowerCase());
      });
    }

    if (equipment) {
      listDays = listDays.filter((w) => {
        let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
        return plateLowerCase.includes(equipment.toLowerCase());
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

    // let dispatches = await workData.model.find({
    //   createdOn: { $gte: startDate, $lte: endDate },
    // });

    // let listDispaches = [];
    // if (customer) {
    //   listDispaches = dispatches.filter((w) => {
    //     let nameLowerCase = w?.project?.customer?.toLowerCase();
    //     return nameLowerCase.includes(customer?.toLowerCase());
    //   });
    // } else {
    //   listDispaches = dispatches;
    // }
    console.log(totalRevenue, projectedRevenue, totalDays);
    res.status(200).send({
      totalRevenue: totalRevenue ? _.round(totalRevenue, 0).toFixed(2) : "0.00",
      projectedRevenue: projectedRevenue ? projectedRevenue.toFixed(2) : "0.00",
      totalDays: totalDays ? _.round(totalDays, 1).toFixed(1) : "0.0",
    });
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.send({
      error,
      key,
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
    res.status(201).send(savedRecord);
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

    res.status(201).send(work);
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
    doneBy: req.body.validatedBy,
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
    doneBy: req.body.validatedBy,
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

  try {
    let workRec = await workData.model.findById(id);

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
      doneBy: req.body.rejectedBy,
      request: req.body,
      payload: workRec,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    res.send(work);

    // let receipts = await getReceiverEmailList(["admin"]);
    let receipts = ["bhigiro@cvl.co.rw"];

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
  } catch (err) {
    res.send(err);
  }
});

router.put("/releaseValidated/:projectName", async (req, res) => {
  let { month, year } = req.query;
  let { projectName } = req.params;
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
          status: "released",
        },
      }
    );

    let q2 = await workData.model.updateMany(
      {
        siteWork: true,
        "project.prjDescription": projectName,
      },
      {
        $set: {
          "dailyWork.$[elemX].status": "released",
        },
      },
      {
        arrayFilters: [
          {
            "elemX.date": new RegExp(`${monthHelper(month)}-${year}`),
            "elemX.status": "validated",
          },
        ],
      }
    );

    res.send({ q2 });
  } catch (err) {
    err;
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

    let q2 = await workData.model.updateMany(
      {
        siteWork: true,
        "project.prjDescription": projectName,
      },
      {
        $set: {
          "dailyWork.$[elemX].status": "rejected",
          "dailyWork.$[elemX].rejectedReason": reason,
        },
      },
      {
        arrayFilters: [
          {
            "elemX.date": new RegExp(`${monthHelper(month)}-${year}`),
            "elemX.status": "validated",
          },
        ],
      }
    );

    res.send({ q2 });
  } catch (err) {
    err;
    res.send(err);
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
      equipment.eqStatus = "standby";
      equipment.assignedDate = null;
      equipment.assignedShift = "";
      equipment.assignedToSiteWork = false;
      work.equipment = equipment;
      if (equipment) await equipment.save();
    } else {
      let equipment = await eqData.model.findById(work?.equipment?._id);
      equipment.eqStatus = "standby";
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

    // let receipts = await getReceiverEmailList(["admin"]);

    let receipts = ["bhigiro@cvl.co.rw"];

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
    err;
    res.send("Error occured!!");
  }
});

router.put("/start/:id", async (req, res) => {
  let { id } = req.params;
  let { startIndex, postingDate } = req.body;

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
        moment(postingDate).isSameOrAfter(moment(work.workStartDate)) &&
        moment(postingDate).isSameOrBefore(moment(work.workEndDate)))
    ) {
      let eqId = work?.equipment?._id;

      await workData.model.updateMany(
        { "equipment._id": eqId },
        {
          $set: {
            eqStatus: "in progress",
            assignedDate: Date.now(),
            millage: startIndex,
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
  let { endIndex, tripsDone, comment, moreComment, postingDate, stoppedBy } =
    req.body;
  let duration = Math.abs(req.body.duration);
  if (duration > 12) duration = 12;

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
      work.status === "in progress" ||
      (work.siteWork &&
        moment(postingDate).isSameOrAfter(moment(work.workStartDate)) &&
        moment(postingDate).isSameOrBefore(moment(work.workEndDate)))
    ) {
      let equipment = await eqData.model.findById(work?.equipment?._id);
      let workEnded = equipment.eqStatus === "standby" ? true : false;

      //get jobs being done by the same equipment
      let eqBusyWorks = await workData.model.find({
        "equipment.plateNumber": equipment._id,
        _id: { $ne: work._id },
        status: { $in: ["in progress", "on going", "created"] },
      });

      if (work?.dailyWork?.length >= work.workDurationDays) {
        equipment.eqStatus = eqBusyWorks.length >= 1 ? "dispatched" : "standby";
        equipment.assignedToSiteWork = false;
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

        work.status =
          workEnded || work?.dailyWork?.length >= work.workDurationDays
            ? "stopped"
            : "on going";

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
          // work.duration = duration;
          // revenue = rate * duration;
          if (comment !== "Ibibazo bya panne") {
            dailyWork.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate * (duration >= 1 ? 1 : 0);
          } else {
            dailyWork.duration = duration / HOURS_IN_A_DAY;

            let targetDuration = 5;
            let durationRation =
              duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
            dailyWork.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate;
          }
        }

        dailyWork.rate = rate;
        dailyWork.uom = uom;
        dailyWork.date = moment(postingDate).isValid()
          ? moment(postingDate).format("DD-MMM-YYYY")
          : moment(postingDate, "DD.MM.YYYY").format("DD-MMM-YYYY");
        dailyWork.totalRevenue = revenue ? revenue : 0;
        dailyWork.totalExpenditure = expenditure ? expenditure : 0;

        dailyWork.comment = comment;
        dailyWork.moreComment = moreComment;
        dailyWork.pending = false;

        let dailyWorks = [...work.dailyWork];

        let indexToUpdate = -1;
        let workToUpdate = dailyWorks.find((d, index) => {
          d.day == moment().diff(moment(work.workStartDate), "days");
          indexToUpdate = index;
        });

        dailyWorks[indexToUpdate] = dailyWork;

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
        equipment.eqStatus = eqBusyWorks.length >= 1 ? "dispatched" : "standby";
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
          if (comment !== "Ibibazo bya panne") {
            work.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (rate * work.duration) / 3600000;
            expenditure = (supplierRate * work.duration) / 3600000;
          } else {
            work.duration = duration > 0 ? duration * 3600000 : 0;
            revenue = (tripsRatio * (rate * work.duration)) / 3600000;
            expenditure =
              (tripsRatio * (supplierRate * work.duration)) / 3600000;
          }
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

        res.status(201).send(savedRecord);
      }
    } else {
      res.status(200).send(work);
    }
  } catch (err) {}
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
      if (comment !== "Ibibazo bya panne") {
        work.duration = duration > 0 ? duration * 3600000 : 0;
        revenue = (rate * work.duration) / 3600000;
        expenditure = (supplierRate * work.duration) / 3600000;
      } else {
        work.duration = duration > 0 ? duration * 3600000 : 0;
        revenue = (tripsRatio * (rate * work.duration)) / 3600000;
        expenditure = (tripsRatio * (supplierRate * work.duration)) / 3600000;
      }
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
  if (duration > 12) duration = 12;

  let dd = postingDate?.split(".")[0];
  let mm = postingDate?.split(".")[1];
  let yyyy = postingDate?.split(".")[2];
  if (dd?.length < 2) dd = "0" + dd;
  if (mm?.length < 2) mm = "0" + mm;
  if (dd && mm && yyyy) postingDate = `${yyyy}-${mm}-${dd}`;
  try {
    let work = await workData.model.findOne({
      _id: id,
      "dailyWork.date": postingDate,
      status: { $in: ["on going", "stopped"] },
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
      // work.duration = duration;
      // revenue = rate * duration;
      if (comment !== "Ibibazo bya panne") {
        dailyWork.duration = duration / HOURS_IN_A_DAY;
        revenue = rate * (duration >= 1 ? 1 : 0);
        expenditure = supplierRate * (duration >= 1 ? 1 : 0);
      } else {
        dailyWork.duration = duration / HOURS_IN_A_DAY;

        let targetDuration = 5;
        let durationRation =
          duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
        dailyWork.duration = duration / HOURS_IN_A_DAY;
        revenue = rate * (duration >= 1 ? 1 : 0);
        expenditure = supplierRate;
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
        status: { $in: ["on going", "stopped"] },
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
  } catch (err) {}
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
    let work = await workData.model.findOne({
      _id: id,
      "dailyWork.date": moment(date).format("DD-MMM-YYYY"),
      status: { $in: ["on going", "stopped"] },
    });

    let updatedDuration = work.duration - duration;
    let updatedRevenue = work.totalRevenue - totalRevenue;
    let updatedExpenditure = work.totalExpenditure - totalExpenditure;

    work = await workData.model.findOneAndUpdate(
      {
        _id: id,
        "dailyWork.date": moment(date).format("DD-MMM-YYYY"),
        status: { $in: ["on going", "stopped"] },
      },
      {
        $pull: {
          dailyWork: {
            date: moment(date).format("DD-MMM-YYYY"),
          },
        },
      }
    );

    work.totalRevenue = updatedRevenue;
    work.totalExpenditure = updatedExpenditure;
    work.duration = updatedDuration;

    if (updatedDuration === 0) {
      work.status = "created";
    }

    // let _dailyWorks = work.dailyWork;

    // _.remove(_dailyWorks, function (d) {
    //   return d.date === moment(date).format("DD-MMM-YYYY");
    // });

    // work.dailyWork = _dailyWorks;

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
          "Unit of measurement": w._id.uom,
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
      $limit: 4,
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
          { "dailyWork.status": { $exists: false }, siteWork: true },
          { "dailyWork.status": { $exists: true, $eq: "" }, siteWork: true },
          { status: "stopped", siteWork: false },
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
      $limit: 4,
    },
  ];

  try {
    let nonValidatedJobs = await workData.model.aggregate(pipeline);
    let list = nonValidatedJobs.map(($) => {
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
          date: "$transactionDate",
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
    {
      $match: {
        $or: [
          {
            "dailyWork.status": {
              $exists: false,
            },
            siteWork: true,
          },
          { "dailyWork.status": { $exists: true, $eq: "" }, siteWork: true },
          {
            status: "stopped",
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
          date: "$transactionDate",
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
            else: {
              $dateFromString: {
                dateString: "$dailyWork.date",
              },
            },
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

    let __val = _validated.map((v) => {
      let strRevenue = v.newTotalRevenue.toLocaleString();
      v.strRevenue = strRevenue;
      return v;
    });

    return __val;
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
    {
      $match: {
        $or: [
          {
            "dailyWork.status": {
              $exists: false,
            },
            siteWork: true,
          },
          { "dailyWork.status": { $exists: true, $eq: "" }, siteWork: true },
          {
            status: "stopped",
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
            else: {
              $dateFromString: {
                dateString: "$dailyWork.date",
              },
            },
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

    let __jobs = _jobs.map((v) => {
      let strRevenue = v.newTotalRevenue.toLocaleString();
      v.strRevenue = strRevenue;
      return v;
    });

    return __jobs;
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
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);

    let _jobs = [...jobs];

    let __jobs = _jobs.map((v) => {
      let strRevenue = v.newTotalRevenue.toLocaleString();
      v.strRevenue = strRevenue;
      return v;
    });

    return __jobs;
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
          { "dailyWork.status": { $exists: true, $eq: "" }, siteWork: true },
          {
            status: "stopped",
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
  ];

  try {
    let jobs = await workData.model.aggregate(pipeline);

    let _jobs = [...jobs];

    let __jobs = _jobs.map((v) => {
      let strRevenue = v.newTotalRevenue.toLocaleString();
      v.strRevenue = strRevenue;
      return v;
    });

    return __jobs;
  } catch (err) {
    err;
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

module.exports = router;
