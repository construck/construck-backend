import _ from "lodash";
import moment from "moment";
import { Work } from "../models/works";
import { Project } from "../models/projects";
import { Customer } from "../models/customers";

// Equipment Controller will hosted here
export default class WorkController {
    static async captureDispatchDailyReport(req, res) {
        console.log("Run cron job every 10 seconds in the development environment");
        try {
            let works = [];
            let equipments = [];

            // 1. GET ALL PROJECTS
            // const projects = await Project.find().limit(20);
            let customers = await Customer.find().limit(20);
            let projects = [];
            customers.map(async c => {
                let cProjects = c.projects;
                if (cProjects && cProjects?.length > 0) {
                    cProjects.map(p => {
                        let _p = { ...p._doc };
                        _p.customer = c?.name;
                        _p.customerId = c?._id;
                        _p.description = p?.prjDescription;
                        projects.push(_p);
                    });
                    // .sort((a,b)=> a?.prjDescription.localeCompare(b?.prjDescription));
                }
            });
            // 2.GET WORK OF PREVIOUS
            // DATE:FOR SITE WORK: CHECK dailywork[].date
            // DATE:FOR OTHER : CHECK dispatch.date

            // const response = await Work.find();
            return res.status(201).send({
                count: projects.length,
                projects,
                message: "Dispatch repport has been captured successfully",
            });
        } catch (err) {
            return res.status(503).send(err);
        }
    }
}
