const cron = require("node-cron");
const WorkController = require("../controllers/works");

// All cronjobs related to dispatches
async function dispatchCronjobs(req, res) {
  cron.schedule(
    "0 8 * * *", // Run every day at 8:00 AM
    async () => {
      await WorkController.captureDispatchDailyReport(req, res);
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
}

module.exports = { dispatchCronjobs };