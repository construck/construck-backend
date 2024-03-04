import express from "express";
import "dotenv/config";
import equipments from "./equipments";
import downtimes from "./downtimes";
import users from "./users";
import customers from "./customers";
import vendors from "./vendors";
import projects from "./projects";
import works from "./works";
import activities from "./activities";
import dispatches from "./dispatches";
import jobTypes from "./jobTypes";
import reasons from "./reasons";
import logs from "./logs";
import employees from "./employees";
import equipmentTypes from "./equipmentTypes";
import equipmentRequests from "./equipmentRequests";
import assetAvailability from "./assetAvailability";
import sendEmail from "./sendEmail";
import maintenance from "./maintenances";
import maintenanceLogs from "./maintenanceLogs";
import item from "./items";
import mechanics from "./mechanics";
import mechanical from "./mechanicals";
import send from "./../utils/sendEmailNode";

const router = express.Router();

let auth = (req, res, next) => {
    const auth = {
        login: process.env.CONS_API_USER,
        password: process.env.CONS_API_PASS,
    }; // change this
    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
    const [login, password] = Buffer.from(b64auth, "base64").toString().split(":");
    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="401"'); // change this
    res.status(401).send("Authentication required."); // custom message
};

router.use("/assetAvailability", assetAvailability); // CONVERTED TO ES6 => "VERIFY": router.post("/");
router.use("/downtimes", downtimes); // CONVERTED TO ES6:
router.use("/works", works); // CONVERTED TO ES6: NOT COMPLETED, FILE IS TOO LARGE
router.use("/email", sendEmail.router);
router.use("/employees", employees); // CONVERTED TO ES6 => PUT & POST MUST BE VERIFIED
router.use("/users", users); // CONVERTED TO ES6
router.use("/equipments", equipments); // CONVERTED TO ES6:
router.use("/customers", customers);
router.use("/vendors", vendors); // CONVERTED TO ES6
router.use("/projects", projects.router);
router.use("/activities", activities); // CONVERTED TO ES6
router.use("/reasons", reasons); // CONVERTED TO ES6
router.use("/logs", logs); // CONVERTED TO ES6
router.use("/dispatches", dispatches);
router.use("/jobtypes", jobTypes);
router.use("/requests", equipmentRequests);
router.use("/api", maintenanceLogs);
router.use("/api", maintenance);
router.use("/api", item);
router.use("/api", mechanics);
router.use("/api", mechanical);
router.use("/equipmentTypes", equipmentTypes);

export default router;
