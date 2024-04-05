const Cronjobs = require("../models/cronjobs");

async function cronJobLogger(module, title) {
  const dataToSave = new Cronjobs.model({
    module,
    title,
  });
  await dataToSave.save();
}

module.exports = { cronJobLogger };
