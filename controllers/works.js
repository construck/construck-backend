const _ = require("lodash");
const moment = require("moment");
const Work = require("./../models/workData");
const { Project } = require("../models/projects");
const Customer = require("./../models/customers");
const DispatchReport = require("./../models/dispatchReports");
const mongoose = require("mongoose");

async function captureDispatchDailyReport() {
  let date = moment()
    .subtract(1, "days")
    .startOf("day")
    .set("hour", 0)
    .set("minute", 0)
    .format("YYYY-MM-DD");
  console.log(
    "Run cron job every 10 seconds in the development environment",
    date
  );
  try {
    const snapshotExist = await DispatchReport.model.find({
      date,
    });
    if (snapshotExist?.length === 0) {
      // 1. GET ALL PROJECTS
      let customers = await Customer.model.find();
      let projects = [];
      customers.map(async (c) => {
        let cProjects = c.projects;
        if (cProjects && cProjects?.length > 0) {
          cProjects.map(async (p) => {
            let _p = { ...p._doc };
            _p.customer = c?.name;
            _p.customerId = c?._id;
            _p.description = p?.prjDescription;
            projects.push(_p);
          });
        }
      });
      const query = {
        $or: [
          { siteWork: false, workStartDate: date },
          {
            workStartDate: { $lte: date },
            workEndDate: { $gte: date },
            siteWork: true,
          },
        ],
      };
      const works = await Work.model.find(query, {
        status: 1,
        workStartDate: 1,
        workEndDate: 1,
        date: 1,
        siteWork: 1,
        "project._id": 1,
      });
      // 3. LOOP THROUGH PROJECT AND RECORD REPORT
      let report = await Promise.all(
        projects.map(async (project) => {
          let count = {
            stopped: 0,
            created: 0,
            inProgress: 0,
            recalled: 0,
          };
          const projectId = new mongoose.Types.ObjectId(project._id);
          const projectIdString = projectId.toString();
          works.map((work) => {
            if (projectIdString === work.project._id) {
              if (work.status === "stopped") {
                count.stopped = count.stopped + 1;
              } else if (work.status === "created") {
                count.created = count.created + 1;
              } else if (work.status === "in progress") {
                count.inProgress = count.inProgress + 1;
              } else if (work.status === "recalled") {
                count.recalled = count.recalled + 1;
              } else {
              }
            }
            return count;
          });
          return { projectId, project: project.prjDescription, date, ...count };
        })
      );
      // REMOVE PROJECTS WITHOUT RECORDS
      report = report.filter((r) => {
        return !(r.stopped === 0 && r.created === 0 && r.inProgress === 0);
      });
      // SORT PROJECTS BY DESCENDING ORDER(sum of stopped, created, and in progress)
      report.sort((a, b) => {
        return (
          b.stopped +
          b.created +
          b.inProgress -
          (a.stopped + a.created + a.inProgress)
        );
      });
      // SAVE DISPATCH REPORT ONE BY ONE
      await DispatchReport.model.insertMany(report);

      console.log("Cronjob: Dispatch report has been captured successfully");
    } else {
      console.log("Equipment utilization on the selected date exists already");
    }
  } catch (err) {
    console.log("Cronjob: Cannot capture dispatch report: ", err);
  }
}

async function getDispatchDailyReport(req, res) {
  const { date } = req.params;
  if (date === null || date === undefined || date === "") {
    return res
      .status(503)
      .send({ error: "Error occurred, Date should be provided" });
  }

  const query = {
    date: { $eq: date },
  };
  const report = await DispatchReport.model
    .find(query)
    .sort({ createdOn: -1, stopped: -1 });
  if (report.length === 0) {
    return res
      .status(404)
      .send({ count: 0, message: "No data found on the provided date" });
  } else {
    return res.status(200).send({ count: report.length, report });
  }
}

module.exports = {
  captureDispatchDailyReport,
  getDispatchDailyReport,
};
