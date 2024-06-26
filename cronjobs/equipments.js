const cron = require("node-cron");
const EquipmentController = require("../controllers/equipments");
const helper = require("../helpers/cronJob");

// All cronjobs related to equipments
async function equipmentCronjobs(req, res) {
  const EVERY_6PM = "0 19 * * *";
  const scheduleEvery6PM = cron.schedule(
    EVERY_6PM,
    async () => {
      console.log("running a task every day at 18:00");
      await EquipmentController.captureEquipmentUtilization(req, res);
      await helper.cronJobLogger("Equipment", "Equipment availability report");
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
  scheduleEvery6PM.start();
}
async function equipmentStatus(req, res) {
  cron.schedule(
    "0 0 * * *", // Run every day at 00:00 PM
    async () => {
      await EquipmentController.changeEquipmentStatus(req, res);
      await helper.cronJobLogger(
        "Equipment",
        "Change equipment status for equipments with dispatch on the same day"
      );
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
}
module.exports = { equipmentCronjobs, equipmentStatus };
