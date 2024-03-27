const router = require("express").Router();
const prjData = require("../models/projects");
const custData = require("../models/customers");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const { default: mongoose } = require("mongoose");

router.get("/", async (req, res) => {
  try {
    let projects = await prjData.model.find().populate("customer");
    res.status(200).send(projects);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v2", async (req, res) => {
  try {
    let customers = await custData.model.find().populate({
      path: "projects",
      populate: {
        path: "projectAdmin",
        model: "users",
      },
    });
    let projects = [];
    customers.forEach((c) => {
      let cProjects = c.projects;
      if (cProjects && cProjects?.length > 0) {
        cProjects.forEach((p) => {
          let _p = { ...p._doc };
          _p.customer = c?.name;
          _p.customerId = c?._id;
          projects.push(_p);
        });
      }
    });
    res.send(projects);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let project = await prjData.model.find(id).populate("customer");
    res.status(200).send(project);
  } catch (err) {
    res.send(err);
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
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
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
      // {
      //   $addFields:
      //     /**
      //      * newField: The new field name.
      //      * expression: The new field expression.
      //      */
      //     {
      //       totalRevenue: {
      //         $add: [
      //           "$totalRevenueSw",
      //           "$totalRevenueSd",
      //         ],
      //       },
      //     },
      // }
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
        $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            totalRevenue: 1,
          },
      },
      {
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
            _id: "approved",
          },
      },
    ];

    let worksCursor = await workData.model.aggregate(aggr);

    console.log(worksCursor);
    res.send(worksCursor);
  } catch (err) {
    res.send(err);
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
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
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
      // {
      //   $addFields:
      //     /**
      //      * newField: The new field name.
      //      * expression: The new field expression.
      //      */
      //     {
      //       totalRevenue: {
      //         $add: [
      //           "$totalRevenueSw",
      //           "$totalRevenueSd",
      //         ],
      //       },
      //     },
      // }
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
        $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            totalRevenue: 1,
          },
      },
      {
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
            _id: "rejected",
          },
      },
    ];

    let worksCursor = await workData.model.aggregate(aggr);

    console.log(worksCursor);
    res.send(worksCursor);
  } catch (err) {
    res.send(err);
  }
});

router.get("/worksToBeValidated/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    /*
     * Requires the MongoDB Node.js Driver
     * https://mongodb.github.io/node-mongodb-native
     */
    console.log(prjDescription);
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
        $sort:
          /**
           * Provide any number of field/order pairs.
           */
          {
            transactionDate: 1,
          },
      },
      {
        $group:
          /**
           * _id: The id of the group.
           * fieldN: The first field name.
           */
          {
            _id: "$_id",
            doc: {
              $first: "$$ROOT",
            },
          },
      },
      {
        $replaceRoot:
          /**
           * replacementDocument: A document or string.
           */
          {
            newRoot: "$doc",
          },
      },
    ];

    let worksCursor = await workData.model.aggregate(pipeline);

    res.send(worksCursor);
  } catch (err) {
    res.send(err);
  }
});

router.get("/releasedRevenue/:projectName", async (req, res) => {
  let { projectName } = req.params;
  let { month, year } = req.query;

  let result = await getReleasedPerMonth(projectName, month, year);

  res.send(result);
});

router.post("/", async (req, res) => {
  let { prjDescription, customer, startDate, endDate, status } = req.body;
  try {
    let prjToCreate = new prjData.model({
      prjDescription,
      customer,
      startDate,
      endDate,
      status,
    });
    let prjCreated = await prjToCreate.save();
    res.status(201).send(prjCreated);
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

router.get("/:customerName/:prjId", async (req, res) => {
  let { customerName, prjId } = req.params;
  let project = await getProject(customerName, prjId);

  res.send(project);
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
      $addFields: {
        month: {
          $month: "$transactionDate",
        },
        year: {
          $year: "$transactionDate",
        },
      },
    },
    // {
    //   $match: {
    //     month: parseInt(month),
    //     year: parseInt(year),
    //   },
    // },
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
      // .sort((a,b)=> a?.prjDescription.localeCompare(b?.prjDescription));
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
