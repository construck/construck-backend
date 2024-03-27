const router = require("express").Router();
const requestData = require("../models/equipmentRequest");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const requests = await requestData.model.find().populate("equipmentType").populate('workToBeDone');
    res.status(200).send(requests);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const jobType = await requestData.model.findById(id).populate("equipmentType").populate('workToBeDone');
    res.status(200).send(jobType);
  } catch (err) {
    res.send(err);
  }
});

router.get("/byOwner/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const jobType = await requestData.model.find({owner:id}).populate("equipmentType").populate('workToBeDone');
    res.status(200).send(jobType);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let requestToCreate = new requestData.model(req.body);
    let requestCreated = await requestToCreate.save();

    res.status(201).send(requestCreated);
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

router.put("/assignQuantity/:id", async (req, res) => {
  let { quantity } = req.body;
  let { id } = req.params;

  try {
    let updatedRequest = await requestData.model.findByIdAndUpdate(id, {
      approvedQuantity: quantity,
      status: 'approved'
    }, {new:true});

    res.status(201).send(updatedRequest);
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

router.get("/aggregated/:status", async (req, res) => {
  let { status } = req.params;
  let pipeline = [
    {
      $match: {
        status: status,
      },
    },
    {
      $group: {
        _id: {
          project: "$project",
          date: "$startDate",
          equipmentType: "$equipmentType",
        },
        total: {
          $sum: "$quantity",
        },
      },
    },
    {
      $lookup: {
        from: "equipmenttypes",
        localField: "_id.equipmentType",
        foreignField: "_id",
        as: "equipmentType",
      },
    },
    {
      $unwind: {
        path: "$equipmentType",
        preserveNullAndEmptyArrays: false,
      },
    },
  ];

  try {
    let aggregatedRequests = await requestData.model.aggregate(pipeline);

    res.send(aggregatedRequests);
  } catch (err) {}
});

module.exports = router;
