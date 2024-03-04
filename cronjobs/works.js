import cron from "node-cron";
import WorkController from "../controllers/works";

// All cronjobs related to equipments
const works = (req, res) => {
    cron.schedule(
        "*/10 * * * * *",
        async () => {
            await WorkController.captureDispatchDailyReport(req, res);
        },
        {
            scheduled: false,
            timezone: "Africa/Kigali",
        }
    );
};

export default works;
