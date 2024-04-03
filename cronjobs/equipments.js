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
async function equipmentStatus(req, res) {
  cron.schedule(
    // cron job every 10 seconds to update equipment status
    "0 0 * * *", // "*/30 * * * * *"(for testing(30secs)), // Run every day at 00:00AM
    async () => {
      console.log("jobs...");
      await EquipmentController.changeEquipmentStatus(req, res);
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
}
module.exports = { equipmentCronjobs, equipmentStatus };
