const cron = require("node-cron");
const EquipmentController = require("../controllers/equipments");
const helper = require("../helpers/cronJob");

// All cronjobs related to equipments
async function equipmentCronjobs(req, res) {
  cron.schedule(
    "0 18 * * *", // Run every day at 18:00
    async () => {
      await EquipmentController.captureEquipmentUtilization(req, res);
      await helper.cronJobLogger("Equipment", "Equipment availability report");
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
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
      scheduled: false,
      timezone: "Africa/Kigali",
    }
  );
}
module.exports = { equipmentCronjobs, equipmentStatus };
