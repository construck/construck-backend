import _ from "lodash";
import moment from "moment";
import { EquipmentType } from "./../models/equipmentTypes";
import { Equipment } from "../models/equipments";
import { EquipmentUtilization } from "../models/equipmentUtilization";

// Equipment Controller will hosted here
export default class EquipmentController {
    static async captureEquipmentUtilization(req, res) {
        console.log("Run cron job every 10 seconds in the development environment");
        // 1. GET ALL EQUIPMENT TYPES
        try {
            let types = [];
            let equipments = [];

            types = await EquipmentType.find();
            // 2. LOOP THROUGH ALL TYPES AND GET EQUIPMENTS BY THEIR TYPES
            types.map(async type => {
                equipments = await Equipment.find({
                    eqDescription: type.description,
                    eqOwner: "Construck",
                });

                // RESET DATA VALUES BEFORE LOOPING AGAIN
                let data = {
                    total: 0,
                    maintenance: 0,
                    available: 0,
                    type: type._id,
                };
                equipments.map(equipment => {
                    if (equipment.eqStatus !== "disposed") data.total++; // calculate total except disposed
                    if (equipment.eqStatus === "workshop") data.maintenance++;
                    if (equipment.eqStatus === "standby" || equipment.eqStatus === "dispatched") data.available++;
                });
                // 3. SAVE EQUIPMENT UTILIZATION
                await EquipmentUtilization.create(data);
            });
            return res.status(201).send({
                message: "Equipment utilization captured successfully",
            });
        } catch (err) {
            return res.status(503).send(err);
        }
    }

    // GET DAILY EQUIPMENT UTILIZATION: ACCEPT FILTERS TOO
    static async getEquipmentUtilization(req, res) {
        console.log("Get equipment utilization");
    }
    // GET EQUIPMENT UTILIZATION BY A SPECIFIC DATE
    static async getEquipmentUtilizationByDate(req, res) {
        let { date } = req.params;
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        try {
            const response = await EquipmentUtilization.find({
                createdOn: {
                    $gte: date,
                    $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                },
            }).populate("type", { createdAt: 0, updatedAt: 0 });
            return res.status(200).send(response);
        } catch (error) {
            console.log("error", error);
            return res.status(503).send({
                error: "Something went wrong, try again",
            });
        }
    }
    // GET AVERAGE EQUIPMENT UTILIZATION BY DATE RANGE
    static async getEquipmentUtilizationAverageByDates(req, res) {
        let { startdate, enddate } = req.params;
        startdate = new Date(startdate);
        enddate = new Date(enddate);
        startdate.setHours(0, 0, 0, 0);
        enddate.setHours(23, 59, 59, 0);

        try {
            const response = await EquipmentUtilization.find({
                createdOn: { $gte: startdate, $lte: enddate },
            }).populate("type", { createdAt: 0, updatedAt: 0 });
            return res.status(200).send(response);
        } catch (error) {
            console.log("error", error);
            return res.status(503).send({
                error: "Something went wrong, try again",
            });
        }
    }
}
