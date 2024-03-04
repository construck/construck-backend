import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cron from "node-cron";
import morgan from "morgan";
import "dotenv/config";
import "./config/database";
import routes from "./routes";
import fun from "./utils/cron-functions";
import cronjobs from "./cronjobs"

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan("dev"));
app.get("/", (req, res) => {
    res.send("Welcome");
});

app.use(routes);

const { PORT } = process.env;
app.listen(PORT || 9000, async () => {
    console.log(`Listening on Port ${PORT}`);
    cron.schedule("0 8 * * *", () => {
        fun.getWorksToExpireToday().then(res => {});
    });

    // load all cronjobs
    cronjobs.equipment(); // cronjobs for equipments
    cronjobs.works(); // cronjobs for equipments
});
