const Joi = require("joi");

const createDispatchSchema = Joi.object({
  projectId: Joi.string().required(),
  equipmentId: Joi.string().required(),
  driver: Joi.string().required(),
  createdBy: Joi.string().required(),
  dispatch: Joi.object({
    shift: Joi.any().required().valid("dayShift", "nightShift"),
    date: Joi.any().required(),
  }).unknown(true),
}).unknown(true);

const validateCreateDispatch = (body) => {
  const validationResult = createDispatchSchema.validate(body);
  if (validationResult.error) {
    return validationResult.error.details[0].message;
  }
  return null;
};

module.exports = validateCreateDispatch;
