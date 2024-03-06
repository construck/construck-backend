import mongoose from "mongoose";
import "dotenv/config";

const { CONS_MONGO_DB, CONS_MONGO_DB_LIVE, DATABASE } = process.env;
console.log("NODE_ENV: ", DATABASE);

mongoose
    .connect(DATABASE === "live" ? CONS_MONGO_DB_LIVE : CONS_MONGO_DB)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.error("Error connecting to MongoDB:", err));
