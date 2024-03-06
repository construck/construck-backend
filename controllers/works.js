import _ from "lodash";
import moment from "moment";
import { Work } from "../models/works";
import { Project } from "../models/projects";
import { Customer } from "../models/customers";
import { DispatchReport } from "../models/dispatchReports";
import mongoose from "mongoose";

// Equipment Controller will hosted here
export default class WorkController {
    static async captureDispatchDailyReport(req, res) {
        let { date } = req.query;
        console.log("Run cron job every 10 seconds in the development environment");
        try {
            // 1. GET ALL PROJECTS
            let customers = await Customer.find();
            let projects = [];
            customers.map(async c => {
                let cProjects = c.projects;
                if (cProjects && cProjects?.length > 0) {
                    cProjects.map(async p => {
                        let _p = { ...p._doc };
                        _p.customer = c?.name;
                        _p.customerId = c?._id;
                        _p.description = p?.prjDescription;
                        projects.push(_p);
                    });
                }
            });
            console.log("@@project", projects.length);
            // 2. GET DISPATCHES THAT MATCHES WITH DATE
            const yesterday = moment()
                .subtract(1, "days")
                .startOf("day")
                .set("hour", 0)
                .set("minute", 0)
                .format("YYYY-MM-DD");
            date = !_.isEmpty(date) ? date : yesterday;
            // const querySitework = {
            //     workStartDate: { $lte: date }, // Less than or equal to
            //     workEndDate: { $gte: date },
            //     siteWork: true,
            // };
            // const queryOthers = {
            //     siteWork: false,
            //     workStartDate: date,
            // };
            const query = {
                $or: [
                    { siteWork: false, workStartDate: date },
                    {
                        workStartDate: { $lte: date },
                        workEndDate: { $gte: date },
                        siteWork: true,
                    },
                ],
            };
            const works = await Work.find(query, {
                status: 1,
                workStartDate: 1,
                workEndDate: 1,
                date: 1,
                siteWork: 1,
                "project._id": 1,
            });
            // 3. LOOP THROUGH PROJECT AND RECORD REPORT

            let report = await Promise.all(
                projects.map(async project => {
                    let count = {
                        stopped: 0,
                        created: 0,
                        inProgres: 0,
                        recalled: 0,
                    };
                    const projectId = new mongoose.Types.ObjectId(project._id);
                    const projectIdString = projectId.toString();
                    works.map(work => {
                        if (projectIdString === work.project._id) {
                            if (work.status === "stopped") {
                                count.stopped = count.stopped + 1;
                            } else if (work.status === "created") {
                                count.created = count.created + 1;
                            } else if (work.status === "in progress") {
                                count.inProgres = count.inProgres + 1;
                            } else if (work.status === "recalled") {
                                count.recalled = count.recalled + 1;
                            } else {
                            }
                        }
                        return count;
                    });
                    return { projectId, project: project.prjDescription, date, ...count };
                })
            );

            // projects.map(async project => {
            //     console.log('####project', project)
            //     works.map(async work => {
            //     if(work){
            //         console.log('=>work', work)
            //     }
            //         // report.push(work)
            //   })
            // })
            await DispatchReport.insertMany(report);

            // const response = await Work.find();
            return res.status(201).send({
                total: report.length,
                report,
                // projects: projects,
                message: "Dispatch repport has been captured successfully",
            });
        } catch (err) {
            console.log("err: ", err);
            return res.status(503).send(err);
        }
    }
}
