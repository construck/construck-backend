const _ = require("lodash");
const moment = require("moment");
const Work = require("./../models/workData");
const { Project } = require("../models/projects");
const Customer = require("./../models/customers");
const DispatchReport = require("./../models/dispatchReports");
const mongoose = require("mongoose");
const mailer = require("./../helpers/mailer/dispatchReport");

const isWorkNotPosted = (work, date) => {
  let start = moment(work?.workStartDate).format("YYYY-MM-DD");
  const diffDays = moment(date).diff(moment(start), "days");
  return diffDays >= work?.dailyWork?.length || false;
};

const getUnpostedDates = (work) => {
  const workedDates = work.dailyWork.map((d) => d.date);
  const startDate = moment(work.workStartDate);
  const endDate = moment(work.workEndDate);
  const workedDatesMoment = workedDates.map((date) => moment(date));

  const newDates = [];
  for (let currDate = startDate.clone(); currDate.isBefore(endDate); ) {
    if (
      !workedDatesMoment.some((workedDate) =>
        workedDate.isSame(currDate, "day")
      )
    ) {
      newDates.push(currDate.clone()); // Clone currDate to avoid mutation
    }
    currDate.add(1, "day"); // Increment after checking to avoid duplicates
  }
  return newDates.map((date) => date.format("YYYY-MM-DD"));
};

async function captureDispatchDailyReport(date) {
  const { NODE_ENV } = process.env;
  // THIS LINE SHOULD BE COMMENTED OUT IN PRODUCTION
  if (NODE_ENV === "development") {
    date = date;
  } else {
    date = moment()
      .subtract(1, "days")
      .startOf("day")
      .set("hour", 0)
      .set("minute", 0)
      .format("YYYY-MM-DD");
  }

  let fullDate = moment(date, "YYYY-MM-DD", "UTC");
  fullDate = fullDate.format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
  console.log("Cron job has started", date);
  try {
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
    // 2. GET DISPATCH REPORT
    const query = {
      $or: [
        {
          siteWork: false,
          workStartDate: date,
        },
        {
          siteWork: true,
          workStartDate: {
            $lte: date,
          },
          workEndDate: {
            $gte: date,
          },
        },
      ],
    };
    const works = await Work.model.find(query, {
      status: 1,
      workStartDate: 1,
      workEndDate: 1,
      workDurationDays: 1,
      date: 1,
      siteWork: 1,
      dailyWork: 1,
      "project._id": 1,
      "dispatch.shift": 1,
    });

    let report = await Promise.all(
      projects.map(async (project, index) => {
        const projectId = new mongoose.Types.ObjectId(project._id);
        const projectIdString = projectId.toString();
        let count = {
          stopped: 0,
          created: 0,
          inProgress: 0,
        };
        works.map((work) => {
          if (work?.siteWork) {
            if (projectIdString === work.project._id) {
              // DEAL WITH SITE WORKS
              if (work.status === "created") {
                count.created++;
              } else if (
                work.status === "on going" ||
                work.status === "in progress"
              ) {
                // 1. IS SITE WORK EMPTY: CREATED +
                work?.dailyWork?.map((d) => {
                  if (
                    moment(date).format("YYYY-MM-DD") ===
                      moment(d?.date).format("YYYY-MM-DD") &&
                    d.pending
                  ) {
                    count.inProgress++;
                  } else if (
                    moment(date).format("YYYY-MM-DD") ===
                      moment(d?.date).format("YYYY-MM-DD") &&
                    !d.pending
                  ) {
                    count.stopped++;
                  } else {
                  }
                });
                const unpostedDates = getUnpostedDates(work);
                if (unpostedDates.includes(moment(date).format("YYYY-MM-DD"))) {
                  count.created++;
                }
                // 2. IS SITE WORK NOT EMPTY: NESTED CONDITIONS
              }
            }
          } else {
            if (projectIdString === work.project._id) {
              if (work.status === "stopped") {
                count.stopped++;
              } else if (work.status === "created") {
                count.created++;
              } else if (work.status === "in progress") {
                count.inProgress++;
              } else {
              }
            }
          }
          return count;
        });
        // }
        return { projectId, project: project.prjDescription, date, ...count };
      })
    );
    if (report.length === 0) {
      console.log("No data found on the provided date");
    } else {
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
      // SEND EMAIL
      await mailer.dispatchReport(date, report);
      // return;
      console.log(
        `Cronjob: Dispatch report has been captured successfully: ${date}`
      );
    }
  } catch (err) {
    console.log("Cronjob: Cannot capture dispatch report: ", err);
  }
}

async function getDispatchDailyReport(req, res) {
  let { date } = req.params;
  date = moment(date, "YYYY-MM-DD", "UTC");
  date = date.format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
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
  // 2. GET DISPATCH REPORT
  const query = {
    $or: [
      {
        siteWork: false,
        workStartDate: date,
      },
      {
        siteWork: true,
        workStartDate: {
          $lte: date,
        },
        workEndDate: {
          $gte: date,
        },
      },
    ],
  };
  const works = await Work.model.find(query, {
    status: 1,
    workStartDate: 1,
    workEndDate: 1,
    workDurationDays: 1,
    date: 1,
    siteWork: 1,
    dailyWork: 1,
    "project._id": 1,
    "dispatch.shift": 1,
  });

  let report = await Promise.all(
    projects.map(async (project, index) => {
      const projectId = new mongoose.Types.ObjectId(project._id);
      const projectIdString = projectId.toString();
      let count = {
        stopped: 0,
        created: 0,
        inProgress: 0,
      };
      works.map((work) => {
        if (work?.siteWork) {
          if (projectIdString === work.project._id) {
            // DEAL WITH SITE WORKS
            if (work.status === "created") {
              count.created++;
            } else if (
              work.status === "on going" ||
              work.status === "in progress"
            ) {
              // 1. IS SITE WORK EMPTY: CREATED +
              work?.dailyWork?.map((d) => {
                if (
                  moment(date).format("YYYY-MM-DD") ===
                    moment(d?.date).format("YYYY-MM-DD") &&
                  d.pending
                ) {
                  count.inProgress++;
                } else if (
                  moment(date).format("YYYY-MM-DD") ===
                    moment(d?.date).format("YYYY-MM-DD") &&
                  !d.pending
                ) {
                  count.stopped++;
                } else {
                }
              });
              const unpostedDates = getUnpostedDates(work);
              if (unpostedDates.includes(moment(date).format("YYYY-MM-DD"))) {
                count.created++;
              }
              // 2. IS SITE WORK NOT EMPTY: NESTED CONDITIONS
            }
          }
        } else {
          if (projectIdString === work.project._id) {
            if (work.status === "stopped") {
              count.stopped++;
            } else if (work.status === "created") {
              count.created++;
            } else if (work.status === "in progress") {
              count.inProgress++;
            } else {
            }
          }
        }
        return count;
      });
      // }
      return { projectId, project: project.prjDescription, date, ...count };
    })
  );
  if (report.length === 0) {
    return res
      .status(404)
      .send({ count: 0, message: "No data found on the provided date" });
  } else {
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
    return res.status(200).send({ count: report.length, report });
  }
}

// FORCE STOP DISPATCHES, SHOULD BE DELETED AFTER ITS USE
async function forceStopDispatches(req, res) {
  return;
  const ids = [
    // new mongoose.Types.ObjectId("660d5c95f4269bdbd030addb"),
  ];
  let date = moment().format("YYYY-MM-DD");

  console.log("START CLEANING DISPATCHES:", date);
  // CHECK IF THERE ARE DISPATCHES SCHEDULED FOR TODAY
  const dispatches = await Work.model.find({
    _id: { $in: ids },
  });
  dispatches.map(async (dispatch) => {
    let workDurationDays = dispatch.workDurationDays;
    workDurationDays =
      moment(date).diff(moment(dispatch.workStartDate), "days") + 1;
    console.log(
      "id",
      workDurationDays,
      dispatch.workStartDate,
      dispatch.workEndDate,
      moment().format("YYYY-MM-DD")
    );
    await Work.model.updateOne(
      {
        _id: dispatch._id,
      },
      {
        $set: {
          workEndDate: moment().format("YYYY-MM-DD"),
          workDurationDays: workDurationDays,
        },
      }
    );
  });
  res.status(200).send({
    count: dispatches.length,
    dispatches,
  });
}
module.exports = {
  captureDispatchDailyReport,
  getDispatchDailyReport,
  forceStopDispatches,
};
