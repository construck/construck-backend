const NodeCache = require("node-cache");
const router = require("express").Router();
const downTimeData = require("../models/downtimes");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const moment = require("moment");
const workData = require("../models/workData");
const equipments = require("../models/equipments");
const { Maintenance } = require("../models/maintenance");

const cache = new NodeCache({ stdTTL: 7200 });

router.get("/", async (req, res) => {
  // const cacheKey = "downtime-cache-key";
  // const cachedData = cache.get(cacheKey);
  // if (cachedData) {
  //   console.log("Serving cached data");
  //   return res.json(cachedData);
  // }
  try {
    let pipeline = [
      {
        $addFields: {
          downtime: {
            $dateDiff: {
              startDate: {
                $cond: {
                  if: {
                    $lte: [
                      "$entryDate",
                      new Date("Mon, 01 May 2023 00:00:00 GMT"),
                    ],
                  },
                  then: new Date("Mon, 01 May 2023 00:00:00 GMT"),
                  else: "$entryDate",
                },
              },
              endDate: {
                $cond: {
                  if: {
                    $lte: ["$endRepair", null],
                  },
                  then: new Date(),
                  else: "$endRepair",
                },
              },
              unit: "hour",
            },
          },
        },
      },
      {
        $addFields: {
          downtimeInDays: {
            $divide: ["$downtime", 24],
          },
        },
      },
      {
        $addFields: {
          equipment: {
            $toObjectId: "$plate.value",
          },
        },
      },
      {
        $lookup: {
          from: "equipments",
          localField: "equipment",
          foreignField: "_id",
          as: "equipment",
        },
      },
      {
        $unwind: {
          path: "$equipment",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$equipment.eqtype",
          fieldN: {
            $avg: "$downtimeInDays",
          },
        },
      },
    ];
    // let downtimes = await downTimeData.model.find().populate("equipment");
    // let downtimes = await Maintenance.aggregate(pipeline);
    // console.log('downtimes', downtimes)
    // cache.set(cacheKey, data);
    return res.status(400).send({});
  } catch (err) {
    // return res.status(500).send(err);
  }
});

router.post("/getAnalytics", async (req, res) => {
  const cacheKey = "downtime-analytics-cache-key";
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  let { startDate, endDate } = req.body;
  let avgFromWorkshop = 0;
  let avgInWorkshop = 0;

  try {
    let downtimes = await downTimeData.model.find({
      $or: [
        {
          dateFromWorkshop: { $gte: startDate },
        },
        {
          dateFromWorkshop: null,
        },
      ],
    });

    let moveFromWorkshop = downtimes.filter((d) => {
      return d?.dateFromWorkshop;
    });

    let len_moveFromWorkshop =
      moveFromWorkshop?.length > 0 ? moveFromWorkshop?.length : 1;

    moveFromWorkshop?.map((r) => {
      avgFromWorkshop = avgFromWorkshop + r.durationInWorkshop;
    });

    let stillInWorkshop = downtimes.filter((d) => {
      return !d?.dateFromWorkshop;
    });

    let len_stillInWorkshop =
      stillInWorkshop.length > 0 ? stillInWorkshop.length : 1;

    stillInWorkshop?.forEach((r) => {
      avgInWorkshop =
        avgInWorkshop + moment().diff(moment(r.dateToWorkshop), "hours");
    });
    const data = {
      avgInWorkshop: (avgInWorkshop / len_stillInWorkshop).toFixed(2),
      avgFromWorkshop: _.round(
        avgFromWorkshop / len_moveFromWorkshop,
        1
      ).toFixed(2),
      avgHours: _.round(
        _.mean([
          avgFromWorkshop / len_moveFromWorkshop,
          avgInWorkshop / len_stillInWorkshop,
        ]),
        1
      ).toFixed(2),
    };
    cache.set(cacheKey, data);
    return res.send(data);
  } catch (err) {}
});

router.post("/trucks", async (req, res) => {
  let { startDate, endDate } = req.body;
  let result = await getAvgDowntime(startDate, "Truck");

  res.send(result);
});

router.post("/machines", async (req, res) => {
  let { startDate, endDate } = req.body;
  let result = await getAvgDowntime(startDate, "Machine");

  res.send(result);
});

async function getAvgDowntime(startDate, eqType) {
  try {
    let pipeline = [
      {
        $match: {
          $or: [
            {
              dateFromWorkshop: {
                $gte: new Date(
                  moment(startDate).format("YYYY-MM-DD").toString()
                ),
              },
            },
            {
              dateFromWorkshop: { $exists: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "equipments",
          localField: "equipment",
          foreignField: "_id",
          as: "equipmentOb",
        },
      },
      {
        $project: {
          date: 1,
          dateToWorkshop: 1,
          dateFromWorkshop: 1,
          durationInWorkshop: 1,
          equipmentOb: 1,
        },
      },
      {
        $unwind: {
          path: "$equipmentOb",
        },
      },
      {
        $addFields: {
          duration: {
            $cond: {
              if: {
                $not: ["$durationInWorkshop"],
              },
              then: {
                $dateDiff: {
                  startDate: "$dateToWorkshop",
                  endDate: new Date(),
                  unit: "hour",
                },
              },
              else: "$durationInWorkshop",
            },
          },
        },
      },
      {
        $match: {
          // $or: [
          //   {
          //     dateFromWorkshop: {
          //       $exists: true,
          //     },
          //   },
          // ],
          "equipmentOb.eqtype": eqType,
        },
      },
      {
        $group: {
          _id: "avgDowntime",
          downtime: {
            $avg: "$duration",
          },
        },
      },
    ];

    let avgDowntimeObj = await downTimeData.model.aggregate(pipeline);

    return avgDowntimeObj;
  } catch (err) {
    return {
      _id: "avgDownTime",
      downtime: 0,
    };
  }
}

module.exports = router;
