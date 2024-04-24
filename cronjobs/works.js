const cron = require("node-cron");
const WorkController = require("../controllers/works");
const helper = require("../helpers/cronJob");

// All cronjobs related to dispatches
async function dispatchCronjobs(req, res) {
  const scheduleEvery8AM = cron.schedule(
    "0 8 * * *", // Run every day at 8:00 AM
    async () => {
      await WorkController.captureDispatchDailyReport(req, res);
      await helper.cronJobLogger(
        "Dispatch",
        "Dispatch daily report"
      );
    },
    {
      scheduled: true,
      timezone: "Africa/Kigali",
    }
  );
  scheduleEvery8AM.start();
}

module.exports = { dispatchCronjobs };
