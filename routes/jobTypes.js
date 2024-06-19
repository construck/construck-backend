const router = require("express").Router();
const NodeCache = require("node-cache");
const jobTypeData = require("../models/jobTypes");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const cache = new NodeCache({ stdTTL: 7200 });

router.get("/", async (req, res) => {
  const cacheKey = "get-job-types-cache-key";
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  try {
    const jobTypes = await jobTypeData.model.find();
    cache.set(cacheKey, jobTypes);
    return res.status(200).send(jobTypes);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const jobType = await jobTypeData.model.findById(id);
    return res.status(200).send(jobType);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/eqType/:eqType", async (req, res) => {
  let { eqType } = req.params;
  try {
    const jobType = await jobTypeData.model.find({ eqType });
    return res.status(200).send(jobType);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let jobTypeToCreate = new jobTypeData.model(req.body);
    let jobTypeCreated = await jobTypeToCreate.save();

    return res.status(201).send(jobTypeCreated);
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

module.exports = router;
