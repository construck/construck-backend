const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const bodyParser = require("body-parser");
const cron = require("node-cron");
const PORT = process.env.PORT ? process.env.PORT : 9000;
const dotenv = require("dotenv").config();
const _ = require("lodash");
const mongoose = require("mongoose");
const equipments = require("./routes/equipments");
const downtimes = require("./routes/downtimes");
const users = require("./routes/users");
const customers = require("./routes/customers");
const vendors = require("./routes/vendors");
const projects = require("./routes/projects");
const works = require("./routes/workData");
const activities = require("./routes/activities");
const dispatches = require("./routes/dispatches");
const jobTypes = require("./routes/jobTypes");
const reasons = require("./routes/reasons");
const logs = require("./routes/logs");
const employees = require("./routes/employees");
const equipmentTypes = require("./routes/equipmentTypes");
const equipmentRequests = require("./routes/equipmentRequests");
const avblty = require("./routes/assetAvailability");
const sendEmail = require("./routes/sendEmailRoute");
const maintenance = require("./routes/maintenances");
const maintenanceLogs = require("./routes/maintenanceLogs");
const item = require("./routes/items");
const mechanics = require("./routes/mechanics");
const mechanical = require("./routes/mechanicals");
const download = require("./routes/download");
const send = require("./utils/sendEmailNode");
const fun = require("./utils/cron-functions");
const dispatchCronjobs = require("./cronjobs/works");
const equipmentCronjobs = require("./cronjobs/equipments");

const { NODE_ENV, CONS_MONGO_DB, PLATFORM_TOKEN } = process.env;

mongoDB = CONS_MONGO_DB;

console.log("CONS_MONGO_DB", mongoDB);

mongoose.connect(mongoDB, { useNewUrlParser: true });
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => console.log("connected to db"));

app.use(morgan("tiny"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// CHECK IF THE APP OR WEB IS ALLOWED TO MAKE CALLS ON BACKEND:
app.use((req, res, next) => {
  const apiSecret = req.headers["x-api-secret"];
  // ONLY ALLOWING CLIENTS APPS WITH SUPPLIED PLATFORM TOKEN
  // NOTE: THIS SHOULD BE ENABLE WHEN MOBILE APP IS ROLLED OUT
  // if (!apiSecret || apiSecret !== PLATFORM_TOKEN) {
  //   return res.status(401).json({ error: "Invalid API secret" });
  // }
  next();
});

//Basic Authorization
let auth = (req, res, next) => {
  // const auth = { login: "sh4b1k4", password: "@9T4Tr73%62l!iHqdhWv" }; // change this
  const auth = {
    login: process.env.CONS_API_USER,
    password: process.env.CONS_API_PASS,
  }; // change this
  const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
  const [login, password] = Buffer.from(b64auth, "base64")
    .toString()
    .split(":");
  if (login && password && login === auth.login && password === auth.password) {
    return next();
  } else {
    if (NODE_ENV === "development") {
      return next();
    }
  }
  res.set("WWW-Authenticate", 'Basic realm="401"'); // change this
  res.status(401).send("Authentication required."); // custom message
};

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.use("/assetAvailability", avblty);
app.use("/downtimes", downtimes);
app.use("/works", works.router);
app.use("/email", sendEmail.router);
app.use("/employees", employees);
app.use("/users", users);
app.use("/equipments", auth, equipments);
app.use("/customers", auth, customers);
app.use("/vendors", auth, vendors);
app.use("/projects", auth, projects.router);
app.use("/activities", auth, activities);
app.use("/reasons", reasons);
app.use("/logs", auth, logs);
app.use("/dispatches", auth, dispatches);
app.use("/jobtypes", auth, jobTypes);
app.use("/requests", auth, equipmentRequests);
app.use("/api", maintenanceLogs);
app.use("/api", maintenance);
app.use("/api", auth, item);
app.use("/api", auth, mechanics);
app.use("/api", auth, mechanical);
app.use("/equipmentTypes", auth, equipmentTypes);
app.use("/download", download);

app.listen(PORT, async () => {
  console.log(`Listening on Port ${PORT}`);
  cron.schedule("0 9 * * *", () => {
    // cron jobs will be running every day at 9:00AM
    fun.getWorksToExpireToday().then((res) => {});
  });
  dispatchCronjobs.dispatchCronjobs();
  equipmentCronjobs.equipmentCronjobs();
  equipmentCronjobs.equipmentStatus();
  cron.schedule("0 0 * * *", () => {
    console.log(''); // run every hour
  });
});
