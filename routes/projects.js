const router = require("express").Router();
const moment = require("moment");
const NodeCache = require("node-cache");
const prjData = require("../models/projects");
const custData = require("../models/customers");
const userData = require("../models/users");
const ProjectInvoice = require("../models//projectInvoices");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const projects = require("../controllers/projects");
const { default: mongoose } = require("mongoose");
const cache = new NodeCache({ stdTTL: 7200 });

router.get("/", async (req, res) => {
  const cacheKey = "get-projects-customers-cache-key";
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  try {
    const projects = await prjData.model
      .find()
      .populate("client", { _id: 1, name: 1, tinNumber: 1 });

    cache.set(cacheKey, projects);
    return res.status(200).send(projects);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/v2", async (req, res) => {
  try {
    const projects = await prjData.model
      .find()
      .populate("client", { _id: 1, name: 1, tinNumber: 1 })
      .populate("projectAdmin", { firstName: 1, lastName: 1 })
      .populate("siteManager", { firstName: 1, lastName: 1 })
      .populate("projectManager", { firstName: 1, lastName: 1 })
      .sort({
        prjDescription: 1,
      });
    return res.status(200).send(projects);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/:id/details", async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prjData.model
      .findOne({ _id: id })
      .populate("client", { _id: 1, name: 1, tinNumber: 1 })
      .populate("projectAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      })
      .populate("siteManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      })
      .populate("invoiceAuthorizer", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      })
      .populate("projectManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      });
    return res.status(200).send({ project });
  } catch (err) {
    console.log("eer", err);
    return res.status(500).send(err);
  }
});

router.get("/approvedRevenue/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    let aggr = [
      {
        $match: {
          "project.prjDescription": prjDescription,
          $or: [
            {
              approvedRevenue: {
                $gt: 0,
              },
            },
            {
              rejectedRevenue: {
                $gt: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "employees",
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
        $addFields: {
          dailyWorkNew: "$dailyWork",
        },
      },
      {
        $unwind: {
          path: "$dailyWork",
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
              else: {
                $dateFromString: {
                  dateString: {
                    $toString: "$dailyWork.date",
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $month: "$transactionDate",
          },
        },
      },
      {
        $addFields: {
          year: {
            $year: "$transactionDate",
          },
        },
      },
      {
        $match: {
          $or: [
            {
              month: {
                $gt: 4,
              },
              year: {
                $gte: 2023,
              },
            },
            {
              year: {
                $gt: 2023,
              },
            },
          ],
        },
      },
      {
        $project: {
          "project.prjDescription": 1,
          "dailyWork.totalRevenue": 1,
          "dailyWork.duration": 1,
          "dailyWork.totalExpenditure": 1,
          "dailyWork.rejectedReason": 1,
          "dailyWork.date": 1,
          "dailyWork.status": 1,
          "dailyWork.uom": 1,
          totalRevenue: 1,
          status: 1,
          approvedDuration: 1,
          approvedExpenditure: 1,
          approvedRevenue: 1,
          reasonForRejection: 1,
          rejectedDuration: 1,
          rejectedEpenditure: 1,
          rejectedReason: 1,
          rejectedRevenue: 1,
          siteWork: 1,
          workStartDate: 1,
          "dispatch.date": 1,
          "equipment.uom": 1,
          "dispatch.shift": 1,
          "equipment.plateNumber": 1,
          "equipment.eqDescription": 1,
          driver: 1,
          dailyWorkNew: 1,
        },
      },
      {
        $group: {
          _id: {
            dailyWork: "$dailyWork.status",
            singleDispathch: "$status",
            siteWork: "$siteWork",
          },
          totalRevenueSw: {
            $sum: "$dailyWork.totalRevenue",
          },
          totalRevenueSd: {
            $sum: "$totalRevenue",
          },
        },
      },
      {
        $addFields: {
          totalRevenue: {
            $cond: {
              if: {
                $eq: ["$_id.siteWork", false],
              },
              then: "$totalRevenueSd",
              else: "$totalRevenueSw",
            },
          },
        },
      },
      {
        $match: {
          $or: [
            {
              "_id.dailyWork": "approved",
            },
            {
              "_id.singleDispathch": "approved",
            },
          ],
        },
      },
      {
        $project: {
          totalRevenue: 1,
        },
      },
      {
        $addFields: {
          _id: "approved",
        },
      },
    ];

    let worksCursor = await workData.model.aggregate(aggr);

    return res.status(200).send(worksCursor);
  } catch (err) {
    return res.status(503).send(err);
  }
});

router.get("/rejectedRevenue/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    let aggr = [
      {
        $match: {
          "project.prjDescription": prjDescription,
          $or: [
            {
              approvedRevenue: {
                $gt: 0,
              },
            },
            {
              rejectedRevenue: {
                $gt: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "employees",
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
        $addFields: {
          dailyWorkNew: "$dailyWork",
        },
      },
      {
        $unwind: {
          path: "$dailyWork",
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
              else: {
                $dateFromString: {
                  dateString: {
                    $toString: "$dailyWork.date",
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $month: "$transactionDate",
          },
        },
      },
      {
        $addFields: {
          year: {
            $year: "$transactionDate",
          },
        },
      },
      {
        $match: {
          $or: [
            {
              month: {
                $gt: 4,
              },
              year: {
                $gte: 2023,
              },
            },
            {
              year: {
                $gt: 2023,
              },
            },
          ],
        },
      },
      {
        $project: {
          "project.prjDescription": 1,
          "dailyWork.totalRevenue": 1,
          "dailyWork.duration": 1,
          "dailyWork.totalExpenditure": 1,
          "dailyWork.rejectedReason": 1,
          "dailyWork.date": 1,
          "dailyWork.status": 1,
          "dailyWork.uom": 1,
          totalRevenue: 1,
          status: 1,
          approvedDuration: 1,
          approvedExpenditure: 1,
          approvedRevenue: 1,
          reasonForRejection: 1,
          rejectedDuration: 1,
          rejectedEpenditure: 1,
          rejectedReason: 1,
          rejectedRevenue: 1,
          siteWork: 1,
          workStartDate: 1,
          "dispatch.date": 1,
          "equipment.uom": 1,
          "dispatch.shift": 1,
          "equipment.plateNumber": 1,
          "equipment.eqDescription": 1,
          driver: 1,
          dailyWorkNew: 1,
        },
      },
      {
        $group: {
          _id: {
            dailyWork: "$dailyWork.status",
            singleDispathch: "$status",
            siteWork: "$siteWork",
          },
          totalRevenueSw: {
            $sum: "$dailyWork.totalRevenue",
          },
          totalRevenueSd: {
            $sum: "$totalRevenue",
          },
        },
      },
      {
        $addFields: {
          totalRevenue: {
            $cond: {
              if: {
                $eq: ["$_id.siteWork", false],
              },
              then: "$totalRevenueSd",
              else: "$totalRevenueSw",
            },
          },
        },
      },
      {
        $match: {
          $or: [
            {
              "_id.dailyWork": "rejected",
            },
            {
              "_id.singleDispathch": "rejected",
            },
          ],
        },
      },
      {
        $project: {
          totalRevenue: 1,
        },
      },
      {
        $addFields: {
          _id: "rejected",
        },
      },
    ];

    let worksCursor = await workData.model.aggregate(aggr);

    return res.send(worksCursor);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/worksToBeValidated/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    let pipeline = [
      {
        $match: {
          "project.prjDescription": prjDescription,
          status: {
            $nin: ["recalled"],
          },
          $or: [
            {
              approvedRevenue: {
                $gt: 0,
              },
            },
            {
              rejectedRevenue: {
                $gt: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "employees",
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
        $addFields: {
          dailyWorkNew: "$dailyWork",
        },
      },
      {
        $unwind: {
          path: "$dailyWork",
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
              else: {
                $dateFromString: {
                  dateString: {
                    $toString: "$dailyWork.date",
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $month: "$transactionDate",
          },
        },
      },
      {
        $addFields: {
          year: {
            $year: "$transactionDate",
          },
        },
      },
      {
        $match: {
          $or: [
            {
              month: {
                $gt: 4,
              },
              year: {
                $gte: 2023,
              },
            },
            {
              year: {
                $gt: 2023,
              },
            },
          ],
        },
      },
      {
        $project: {
          "project.prjDescription": 1,
          "dailyWork.totalRevenue": 1,
          "dailyWork.duration": 1,
          "dailyWork.totalExpenditure": 1,
          "dailyWork.rejectedReason": 1,
          "dailyWork.date": 1,
          "dailyWork.status": 1,
          "dailyWork.uom": 1,
          status: 1,
          approvedDuration: 1,
          approvedExpenditure: 1,
          approvedRevenue: 1,
          reasonForRejection: 1,
          rejectedDuration: 1,
          rejectedEpenditure: 1,
          rejectedReason: 1,
          rejectedRevenue: 1,
          siteWork: 1,
          workStartDate: 1,
          "dispatch.date": 1,
          "equipment.uom": 1,
          "dispatch.shift": 1,
          "equipment.plateNumber": 1,
          "equipment.eqDescription": 1,
          driver: 1,
          dailyWorkNew: 1,
        },
      },
      {
        $sort: {
          transactionDate: 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          doc: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$doc",
        },
      },
    ];

    let worksCursor = await workData.model.aggregate(pipeline);

    return res.send(worksCursor);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/releasedRevenue/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;
  try {
    let result = await getReleasedPerMonth(projectName, month, year);

    return res.send(result);
  } catch (err) {
    return res.status(500).send(err);
  }
});
router.get("/:id/invoices", async (req, res) => {
  projects.getInvoicesByProject(req, res);
});
router.put("/:id/authorizer", async (req, res) => {
  projects.assignAuthorizer(req, res);
});
router.get("/invoice/:id", async (req, res) => {
  projects.getInvoicePerProject(req, res);
});
router.put("/invoice/sign/:id", async (req, res) => {
  projects.signInvoice(req, res);
});
router.get("/invoice/preview/:id/:month/:year", async (req, res) => {
  projects.getInvoicePreviewPerProject(req, res);
});

router.post("/", async (req, res) => {
  let { prjDescription, customer, client, startDate, endDate, status } =
    req.body;
  try {
    let prjToCreate = new prjData.model({
      prjDescription,
      customer,
      client,
      startDate,
      endDate,
      status,
    });
    let prjCreated = await prjToCreate.save();
    return res.status(201).send(prjCreated);
  } catch (err) {
    console.log("22", err);
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    return res.status(400).send({
      error,
      key,
    });
  }
});

router.get("/:customerName/:prjId", async (req, res) => {
  let { customerName, prjId } = req.params;
  try {
    let project = await getProject(customerName, prjId);

    return res.send(project);
  } catch (err) {
    return res.status(500).send(err);
  }
});

async function getReleasedPerMonth(prjDescription, month, year) {
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
            "dailyWork.status": "released",
            siteWork: true,
          },
          {
            status: "released",
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

async function fetchProjects() {
  let customers = await custData.model.find();
  let projects = [];
  customers.forEach((c) => {
    let cProjects = c.projects;
    if (cProjects && cProjects?.length > 0) {
      cProjects.forEach((p) => {
        let _p = { ...p._doc };
        _p.customer = c?.name;
        _p.customerId = c?._id;
        _p.id = p?._id;
        _p.description = p?.prjDescription;
        projects.push(_p);
      });
    }
  });
  //
  return projects.sort((a, b) =>
    a?.prjDescription.localeCompare(b?.prjDescription)
  );
}

async function getProject(customerName, prjId) {
  let pipeline = [
    {
      $match: {
        name: customerName,
      },
    },
    {
      $unwind: {
        path: "$projects",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "projects._id": new mongoose.Types.ObjectId(prjId),
      },
    },
  ];

  let project = await custData.model.aggregate(pipeline);
  if (project.length >= 1) return project[0].projects;
  else return {};
}

module.exports = {
  router,
  fetchProjects,
  getProject,
};
