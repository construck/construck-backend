const router = require("express").Router();
const NodeCache = require("node-cache");
const equipmenTypeData = require("../models/equipmentTypes");
const equipmenTData = require("../models/equipments");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const cache = new NodeCache({ stdTTL: 7200 });

router.get("/", async (req, res) => {
  const cacheKey = "get-equipment-types-cache-key";
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  try {
    const types = await equipmenTypeData.model.find().sort("description");
    cache.set(cacheKey, types);
    return res.status(200).send(types);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const type = await equipmenTypeData.model.findById(id);
    return res.status(200).send(type);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { description } = req.body;
  try {
    let typeToCreate = new equipmenTypeData.model({
      description,
    });
    let typeCreated = await typeToCreate.save();

    return res.status(201).send(typeCreated);
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

router.put("/updateEqTypes/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let updates = await updateEqType(name);

    return res.send({ updates });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.put("/bulkUpdateEqTypes", async (req, res) => {
  let eqTypes = await equipmenTypeData.model.find();
  let results = await eqTypes?.map(async (eqType) => {
    let name = eqType.description;
    return await updateEqType(name);
  });

  return res.send({ results });
});
module.exports = router;

async function updateEqType(name) {
  let eqType = await equipmenTypeData.model.findOne({ description: name });
  let id = eqType?._id;

  let updates = await equipmenTData.model.updateMany(
    { eqDescription: name },
    { $set: { equipmentType: id } }
  );
  return updates;
}
