const router = require("express").Router();
const NodeCache = require("node-cache");
const reasonData = require("../models/reasons");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const cache = new NodeCache({ stdTTL: 7200 });

router.get("/", async (req, res) => {
  const cacheKey = "get-reasons-cache-key";
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  try {
    const reasons = await reasonData.model.find();
    cache.set(cacheKey, reasons);
    return res.status(200).send(reasons);
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const reason = await reasonData.model.findById(id);
    return res.status(200).send(reason);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { description } = req.body;
  try {
    const reasonToCreate = new reasonData.model({
      description,
    });
    const reasonCreated = await reasonToCreate.save();
    return res.status(201).send(reasonCreated);
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
