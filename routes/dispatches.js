const router = require("express").Router();
const dispatchData = require("../models/dispatches");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const dispatches = await dispatchData.model.find().populate({
      path: "project",
      populate: {
        path: "customer",
        model: "customers",
      },
    });
    return res.status(200).send(dispatches);
  } catch (err) {
    return res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const dispatch = await dispatchData.model.findById(id);
    return res.status(200).send(dispatch);
  } catch (err) {
    return res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let dispatchToCreate = new dispatchData.model(req.body);
    let dispatchCreated = await dispatchToCreate.save();

    return res.status(201).send(dispatchCreated);
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
