const express = require("express");
var cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const cron = require("node-cron");

const PORT = process.env.PORT ? process.env.PORT : 9000;

var mongoose = require("mongoose");
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
const avblty = require("./routes/assetAvailability");
const sendEmail = require("./routes/sendEmailRoute");
const send = require("./utils/sendEmailNode");
const fun = require("./utils/cron-functions");

//Set up default mongoose connection
// var mongoDB =
//   "mongodb://dbAdmin:Adm1n%402023@localhost:27017/construck?authSource=admin";

// var mongoDB =
  // "mongodb+srv://mongo-admin:2tij6e0anAgKU6tb@myfreecluster.kxvgw.mongodb.net/construck-playground?retryWrites=true&w=majority";
// "mongodb+srv://root:Beniyak1@cluster0.8ycbagi.mongodb.net/construck?retryWrites=true&w=majority";

var mongoDB = "";

mongoDB = process.env.CONS_MONGO_DB;

mongoose.connect(mongoDB, { useNewUrlParser: true });
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => console.log("connected to db"));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
  }
  res.set("WWW-Authenticate", 'Basic realm="401"'); // change this
  res.status(401).send("Authentication required."); // custom message
};

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.use("/assetAvailability", avblty);
app.use("/downtimes", downtimes);
app.use("/works", works);
app.use("/email", sendEmail.router);
app.use("/employees", employees);
app.use("/users", users);
app.use("/equipments", auth, equipments);
app.use("/customers", auth, customers);
app.use("/vendors", auth, vendors);
app.use("/projects", auth, projects);
app.use("/activities", auth, activities);
app.use("/reasons", reasons);
app.use("/logs", auth, logs);
app.use("/dispatches", auth, dispatches);
app.use("/jobtypes", auth, jobTypes);

app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
  cron.schedule("0 8 * * *", () => {
    fun.getWorksToExpireToday().then((res) => {});
  });
});
