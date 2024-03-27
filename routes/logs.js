const router = require("express").Router();
const bcrypt = require("bcryptjs");
const logData = require("../models/logs");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    let logs = await (
      await logData.model
        .find({
          "payload.equipment.plateNumber": "RAB 791 L",
          // action: "DISPATCH STOPPED",
        })
        .populate("doneBy")
    ).filter((l) => l.doneBy !== null);

    let newObjs = logs.map((l, i) => {
      return {
        action: l.action,
        id: l._id,
        doneby: l.doneBy?.firstName + " " + l.doneBy?.lastName,
        project: l.payload?.project?.prjDescription,
        platenumber: l.payload?.equipment?.platenumber,
        createdOn: l.createdOn,
        duration: l.payload?.duration / (1000 * 60 * 60) + "hours",
        totalRevenue: l.payload?.totalRevenue,
      };
    });
    res.status(200).send(newObjs);
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
