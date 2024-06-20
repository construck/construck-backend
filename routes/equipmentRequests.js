const router = require("express").Router();
const { Types } = require("mongoose");
const {
  createEquipmentRequest,
  createEquipmentRequestDetails,
} = require("../controllers/equipmentRequests");
const requestData = require("../models/equipmentRequest");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const equipmentRequestDetails = require("../models/equipmentRequestDetails");

router.get("/", async (req, res) => {
  try {
    let pipeline = [
      {
        $lookup: {
          from: "requestsdetails",
          localField: "_id",
          foreignField: "request",
          as: "details",
        },
      },
      {
        $unwind: {
          path: "$details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "equipmenttypes",
          localField: "details.equipmentType",
          foreignField: "_id",
          as: "details.equipmentType",
        },
      },
      {
        $lookup: {
          from: "jobtypes",
          localField: "details.workToBeDone",
          foreignField: "_id",
          as: "details.workToBeDone",
        },
      },
      {
        $unwind: {
          path: "$details.equipmentType",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$details.workToBeDone",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          referenceNumber: {
            $first: "$referenceNumber",
          },
          project: {
            $first: "$project",
          },
          startDate: {
            $first: "$startDate",
          },
          endDate: {
            $first: "$endDate",
          },
          shift: {
            $first: "$shift",
          },
          status: {
            $first: "$status",
          },
          owner: {
            $first: "$owner",
          },
          details: {
            $push: "$details",
          },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          project: "$project.description",
          projectId: "$project._id",
        },
      },
    ];

    // const requests = await requestData.model
    //   .find()
    //   .populate("equipmentType")
    //   .populate("workToBeDone");

    const requests = await requestData.model
      .aggregate(pipeline)
      .sort({ startDate: 1 });

    return res.status(200).send(requests);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;

  try {
    const jobType = await requestData.model
      .findById(id)
      .populate("equipmentType")
      .populate("workToBeDone");
    return res.status(200).send(jobType);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/byOwner/:id", async (req, res) => {
  let { id } = req.params;
  let pipeline = [
    {
      $match: {
        owner: new Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "requestsdetails",
        localField: "_id",
        foreignField: "request",
        as: "details",
      },
    },
    {
      $unwind: {
        path: "$details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "equipmenttypes",
        localField: "details.equipmentType",
        foreignField: "_id",
        as: "details.equipmentType",
      },
    },
    {
      $lookup: {
        from: "jobtypes",
        localField: "details.workToBeDone",
        foreignField: "_id",
        as: "details.workToBeDone",
      },
    },
    {
      $unwind: {
        path: "$details.equipmentType",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$details.workToBeDone",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        referenceNumber: {
          $first: "$referenceNumber",
        },
        project: {
          $first: "$project",
        },
        startDate: {
          $first: "$startDate",
        },
        endDate: {
          $first: "$endDate",
        },
        shift: {
          $first: "$shift",
        },
        status: {
          $first: "$status",
        },
        owner: {
          $first: "$owner",
        },
        details: {
          $push: "$details",
        },
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },
    {
      $unwind: {
        path: "$project",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        project: "$project.description",
        projectId: "$project._id",
      },
    },
  ];
  try {
    const requests = await requestData.model
      .aggregate(pipeline)
      .sort({ startDate: 1 });

    return res.status(200).send(requests);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    // let requestToCreate = new requestData.model(req.body);
    // let requestCreated = await requestToCreate.save();

    let created = await createEquipmentRequest(req.body);

    res.status(201).send({ _id: created?._id });
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

router.post("/details", async (req, res) => {
  try {
    let created = await createEquipmentRequestDetails(req.body);

    res.status(201).send({ created });
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

  console.log(id);
  try {
    let updatedRequest = await equipmentRequestDetails.model.findByIdAndUpdate(
      id,
      {
        approvedQuantity: quantity,
        // status: "approved",
      },
      { new: true }
    );

    res.status(201).send(updatedRequest);
  } catch (err) {
    console.log(err)
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

    return res.send(aggregatedRequests);
  } catch (err) {
    return res.status(500).send(err);
  }
});

module.exports = router;
