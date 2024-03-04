import cron from "node-cron";
import EquipmentController from "../controllers/equipments";

// All cronjobs related to equipments
const equipment = (req, res) => {
    cron.schedule(
        "*/10 * * * * *",
        async () => {
            await EquipmentController.captureEquipmentUtilization(req, res);
        },
        {
            scheduled: false,
            timezone: "Africa/Kigali",
        }
    );
};

export default equipment;
