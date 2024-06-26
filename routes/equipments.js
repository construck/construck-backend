const router = require("express").Router();
const NodeCache = require("node-cache");
const User = require("../models/users");
const eqData = require("../models/equipments");
const assetAvblty = require("../models/assetAvailability");
const downTimeData = require("../models/downtimes");
const workData = require("../models/workData");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const moment = require("moment");
const { eq } = require("lodash");
const { default: mongoose, Types } = require("mongoose");
const { getListOfEquipmentOnDuty, stopWork } = require("./workData");
const EquipmentController = require("./../controllers/equipments");
const cache = new NodeCache({ stdTTL: 7200 });

router.get("/", async (req, res) => {
  const cacheKey = "equipment-types-cache-key";
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  try {
    const equipments = await eqData.model
      .find()
      .populate("vendor")
      .populate("equipmentType");

    const data = {
      equipments,
      nrecords: equipments.length,
      available: equipments.filter((w) => {
        return (
          (w.eqStatus === "standby" || w.eqStatus === "dispatched") &&
          w.eqOwner === "Construck"
        );
      }).length,
      workshop: equipments.filter((w) => {
        return w.eqStatus === "workshop" && w.eqOwner === "Construck";
      }).length,
      dispatched: equipments.filter((w) => {
        return w.eqStatus === "dispatched" && w.eqOwner === "Construck";
      }).length,
      standby: equipments.filter((w) => {
        return w.eqStatus === "standby" && w.eqOwner === "Construck";
      }).length,
      disposed: equipments.filter((w) => {
        return w.eqStatus === "disposed" && w.eqOwner === "Construck";
      }).length,
      ct: equipments.filter((w) => {
        return w.eqStatus === "ct" && w.eqOwner === "Construck";
      }).length,
    };
    cache.set(cacheKey, data);
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(error);
  }
});
router.get("/enter-workshop", async (req, res) => {
  try {
    const equipments = await eqData.model
      .find({
        eqStatus: {
          $nin: ["disposed"],
        },
      })
      .populate("vendor")
      .populate("equipmentType");
    return res.status(200).send({
      equipments,
      nrecords: equipments.length,
      available: equipments.filter((w) => {
        return (
          (w.eqStatus === "standby" || w.eqStatus === "dispatched") &&
          w.eqOwner === "Construck"
        );
      }).length,
      workshop: equipments.filter((w) => {
        return w.eqStatus === "workshop" && w.eqOwner === "Construck";
      }).length,
      dispatched: equipments.filter((w) => {
        return w.eqStatus === "dispatched" && w.eqOwner === "Construck";
      }).length,
      standby: equipments.filter((w) => {
        return w.eqStatus === "standby" && w.eqOwner === "Construck";
      }).length,
      disposed: equipments.filter((w) => {
        return w.eqStatus === "disposed" && w.eqOwner === "Construck";
      }).length,
      ct: equipments.filter((w) => {
        return w.eqStatus === "ct" && w.eqOwner === "Construck";
      }).length,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.get("/types", async (req, res) => {
  try {
    let pipeline = [
      {
        $group: {
          _id: {
            id: "$eqDescription",
          },
          count: {
            $count: {},
          },
        },
      },
    ];
    const equipmentTypes = await eqData.model.aggregate(pipeline);
    return res.status(200).send(equipmentTypes);
  } catch (err) {
    return res.status(500).send(error);
  }
});

router.get("/v2", async (req, res) => {
  try {
    const equipments = await eqData.model
      .find()
      .populate("vendor")
      .populate("equipmentType");
    return res.status(200).send(equipments);
  } catch (err) {
    return res.status(500).send(error);
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // find owner
    const owner = await User.model.findById(id);
    const equipments = await eqData.model
      .find(
        {
          eqOwner: owner.firstName,
        },
        {
          _id: 1,
          eqDescription: 1,
          plateNumber: 1,
          eqtype: 1,
        }
      )
      .sort({
        createdOn: -1,
      });
    return res.status(200).send(equipments);
  } catch (err) {
    return res.status(500).send(error);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const equipment = await eqData.model
      .findById(id)
      .populate("vendor")
      .populate("equipmentType");
    return res.status(200).send(equipment);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/type/:type", async (req, res) => {
  let { type } = req.params;
  try {
    const equipment = await eqData.model.find({
      eqtype: type,
      eqStatus: "standby",
    });
    return res.status(200).send(equipment);
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.get("/type/:type/:date/:shift", async (req, res) => {
  let { type, date, shift } = req.params;
  try {
    const equipment = await eqData.model.find({
      eqtype: type,
      $or: [
        { eqStatus: "standby" },
        //Assigned to sitework
        {
          eqStatus: "dispatched",
          assignedShift: { $ne: shift },
          assignedToSiteWork: { $ne: true },
        },
        {
          eqStatus: "dispatched",
          assignedDate: { $ne: date },
          assignedToSiteWork: { $ne: true },
        },
        {
          eqStatus: "dispatched",
          assignedToSiteWork: true,
          assignedShift: { $ne: shift },
        },
        //Not assigned to sitework
        {
          eqStatus: "dispatched",
          assignedToSiteWork: false,
          assignedShift: { $ne: shift },
          assignedDate: { $eq: date },
        },
        {
          eqStatus: "dispatched",
          assignedToSiteWork: false,
          assignedDate: { $ne: date },
        },
      ],
    });
    return res.status(200).send(equipment);
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.get("/:date/:shift", async (req, res) => {
  EquipmentController.checkEquipmentAvailabilityForDispatch(req, res);
});

router.post("/", async (req, res) => {
  try {
    eqData.model.findOne(
      {
        plateNumber: req.body.plateNumber,
      },
      async (err, eq) => {
        if (err) {
          return res.status(509).send({
            code: "EQUIPMENT_ERROR",
            error: "Duplicate key",
            message: "Equipment can not be created",
            key: "Plate number",
          });
        }
        if (eq) {
          return res.status(409).send({
            code: "EQUIPMENT_EXIST",
            error: "Duplicate key",
            message: "Equipment can not be created",
            key: "Plate number",
          });
        } else {
          try {
            const eqToCreate = new eqData.model(req.body);
            const eqCreated = await eqToCreate.save();
            return res.status(201).send({
              code: "EQUIPMENT_CREATED",
              message: "Equipment has been created successfully.",
            });
          } catch (err) {
            let error = findError(err.code);
            let keyPattern = err.keyPattern;
            let key = _.findKey(keyPattern, function (key) {
              return key === 1;
            });
            return res.status(409).send({
              code: "EQUIPMENT_ERROR",
              error,
              message: "Something when wrong, try again",
              key,
            });
          }
        }
      }
    );
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

router.put("/makeAvailable/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "standby";

    let savedRecord = await equipment.save();

    //We can save how long the equipment has been in workshop
    let _eqDowntime = await downTimeData.model.findOne({
      equipment: id,
      durationInWorkshop: 0,
      dateFromWorkshop: null,
    });

    if (_eqDowntime) {
      _eqDowntime.dateFromWorkshop = Date.now();
      _eqDowntime.durationInWorkshop = moment().diff(
        moment(_eqDowntime.dateToWorkshop),
        "hours"
      );
      _eqDowntime.save();
    } else {
      await downTimeData
        .model({
          date: moment("2022-07-01"),
          dateToWorkshop: moment("2022-07-01"),
          dateFromWorkshop: moment(),
          durationInWorkshop: moment().diff(moment("2022-07-01"), "hours"),
          equipment: id,
        })
        .save();
    }

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
      dateData.available = currentAvailable + 1;
      dateData.unavailable = currentUnavailable - 1;
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

router.put("/dispose/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "disposed";

    let savedRecord = await equipment.save();

    res.status(201).send(savedRecord);
  } catch (err) {}
});

router.put("/sendToWorkshop/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);
    equipment.eqStatus = "workshop";
    let savedRecord = await equipment.save();

    //We can start tracking how long the equipment has been in workshop
    await downTimeData
      .model({
        date: Date.now(),
        dateToWorkshop: Date.now(),
        equipment: savedRecord?._id,
      })
      .save();

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
      dateData.available = currentAvailable - 1;
      dateData.unavailable = currentUnavailable + 1;
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

router.put("/makeAllAvailable/", async (req, res) => {
  try {
    let equipment = await eqData.model.updateMany({}, { eqStatus: "standby" });
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
    res.status(202).send(equipment);
  } catch (err) {}
});

router.put("/syncWorkshopStatus/", async (req, res) => {
  //get all equipments in workshop
  let inWorkshop = await eqData.model.find({
    eqStatus: "workshop",
  });

  //loop through them (id) and create the downtime records
  await inWorkshop?.map(async (eq) => {
    await downTimeData
      .model({
        date: new Date("2022-07-01"),
        dateToWorkshop: new Date("2022-07-01"),
        equipment: eq._id,
      })
      .save();
  });

  res.send("Done");
});

router.put("/assignToJob/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "dispatched";

    let savedRecord = await equipment.save();

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

router.put("/makeDispatched/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "dispatched";

    let savedRecord = await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {}
});

router.put("/release/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "standby";

    let savedRecord = await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {}
});

router.delete("/hired", async (req, res) => {
  try {
    await eqData.model.deleteMany({ eqOwner: { $ne: "Construck" } });
    res.send("Done");
  } catch (err) {}
});

router.delete("/ctk", async (req, res) => {
  try {
    await eqData.model.deleteMany({ eqOwner: "Construck" });
    res.send("Done");
  } catch (err) {}
});

router.put("/resetIndices", async (req, res) => {
  try {
    let update = await eqData.model.updateMany({
      $set: {
        millage: 0,
      },
    });
    res.send(update);
  } catch (err) {}
});

router.put("/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let {
      plateNumber,
      eqDescription,
      assetClass,
      eqtype,
      eqOwner,
      rate,
      supplierRate,
      uom,
      effectiveDate,
      millage,
    } = req.body;
    let oldEquipment = await eqData.model.findById(id);
    let oldRate = oldEquipment.rate;
    let oldSupplierRate = oldEquipment.supplierRate;

    let equipment = await eqData.model.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    let toUpdate = await workData.model.find({
      $or: [
        {
          "equipment._id": new mongoose.Types.ObjectId(id),
        },
        {
          "equipment._id": id,
        },
      ],
      $or: [
        { workStartDate: { $gte: moment(effectiveDate) } },
        { "dailyWork.date": { $gte: moment(effectiveDate) } },
      ],
    });

    toUpdate?.forEach(async (work) => {
      await stopWork(
        work?._id,
        work?.endIndex,
        work?.tripsDone,
        work?.comment,
        work?.moreComment,
        effectiveDate,
        work?.createdBy,
        work?.duration
      );
    });

    // await workData.model.updateMany(
    //   {
    //     "equipment._id": id,
    //     $or: [
    //       { workStartDate: { $gte: effectiveDate } },
    //       { "dailyWork.date": { $gte: effectiveDate } },
    //     ],
    //   },
    //   {
    //     $set: {
    //       "equipment.plateNumber": plateNumber,
    //       "equipment.eqDescription": eqDescription,
    //       "equipment.assetClass": assetClass,
    //       "equipment.eqtype": eqtype,
    //       "equipment.eqOwner": eqOwner,
    //       "equipment.rate": parseInt(rate),
    //       "equipment.supplierRate": supplierRate,
    //       "equipment.uom": uom,
    //     },
    //   }
    // );

    // await workData.model.updateMany(
    //   {
    //     "equipment._id": id,
    //     $or: [
    //       { workStartDate: { $gte: effectiveDate } },
    //       { "dailyWork.date": { $gte: effectiveDate } },
    //     ],
    //   },
    //   {
    //     $mul: {
    //       totalRevenue: rate / oldRate,
    //     },
    //   }
    // );

    // await workData.model.updateMany(
    //   {
    //     "equipment._id": id,
    //     $or: [
    //       { workStartDate: { $gte: effectiveDate } },
    //       { "dailyWork.date": { $gte: effectiveDate } },
    //     ],
    //   },

    //   {
    //     $set: {
    //       $toDouble: {
    //         "dailyWork.$[].totalRevenue": {
    //           $multiply: ["$dailyWork.$[].rate", "$dailyWork.$[].duration"],
    //         },
    //       },
    //     },
    //     // $mul: {
    //     //   "dailyWork.$[element].totalRevenue": rate / oldRate,
    //     // },
    //   },
    //   { arrayFilters: [{ "element.date": { $gte: effectiveDate } }] }
    // );

    // await workData.model.updateMany(
    //   {
    //     "equipment._id": id,
    //     $or: [
    //       { workStartDate: { $gte: effectiveDate } },
    //       { "dailyWork.date": { $gte: effectiveDate } },
    //     ],
    //   },
    //   {
    //     $set: {
    //       "dailyWork.$[element].rate": parseInt(rate),
    //     },
    //   },

    //   { arrayFilters: [{ "element.date": { $gte: effectiveDate } }] }
    // );

    res.status(200).send(equipment);
  } catch (err) {
    console.log(err);
    res.status(500);
  }
});

router.post("/availability", (req, res) => {
  EquipmentController.captureEquipmentUtilization(req, res);
});
router.get("/utilization/date/:date", (req, res) => {
  EquipmentController.getEquipmentUtilizationByDate(req, res);
});
router.get("/utilization/:startdate/:enddate/download", (req, res) => {
  EquipmentController.downloadEquipmentUtilizationByDates(req, res);
});
// router.post("/utilization/:date", (req, res) => {
//   EquipmentController.captureEquipmentUtilization(req, res);
// });
router.patch("/type/dispatched", (req, res) => {
  EquipmentController.changeEquipmentStatus(req, res);
});

module.exports = router;
