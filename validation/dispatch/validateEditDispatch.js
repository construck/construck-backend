const Joi = require("joi");

const editDispatchSchema = Joi.object({
  project: Joi.object().required(),
  dispatch: Joi.object({
    shift: Joi.any().required().valid("dayShift", "nightShift"),
    date: Joi.any().required(),
    targetTrips: Joi.any().optional(),
  }).unknown(true),
  equipment: Joi.object().required(),
  equipmentId: Joi.string().required(),
  driver: Joi.string().required(),
  workDone: Joi.string().required(),
  workStartDate: Joi.string().required(),
  workEndDate: Joi.string().required(),
  uom: Joi.string().required(),
});

const validateEditDispatch = (body) => {
  const validationResult = editDispatchSchema.validate(body);
  if (validationResult.error) {
    return validationResult.error.details[0].message;
  }
  return null;
};

module.exports = validateEditDispatch;
