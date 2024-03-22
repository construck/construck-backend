const cron = require("node-cron");
const EquipmentController = require("../controllers/equipments");

// All cronjobs related to equipments
async function equipmentCronjobs(req, res) {
  cron.schedule(
    "0 18 * * *", // Run every day at 6:00 PM
    async () => {
      await EquipmentController.captureEquipmentUtilization(req, res);
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
}
module.exports = { equipmentCronjobs };
