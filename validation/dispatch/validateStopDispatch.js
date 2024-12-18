const Joi = require("joi");

const stopDispatchSchema = Joi.object({
  duration: Joi.string().required(),
  tripsDone: Joi.string().optional(),
  comment: Joi.string().allow(null, "").optional(),
  stoppedBy: Joi.string().required(),
  postingDate: Joi.string().required(),
  fuel: Joi.string().required(),
  startIndex: Joi.string().required(),
  endIndex: Joi.string().required(),
});

const validateStopDispatch = (body) => {
  const validationResult = stopDispatchSchema.validate(body);
  if (validationResult.error) {
    return validationResult.error.details[0].message;
  }
  return null;
};

module.exports = validateStopDispatch;
