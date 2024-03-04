import mongoose from "mongoose";
import 'dotenv/config'

const { CONS_MONGO_DB } = process.env;

mongoose
    .connect(CONS_MONGO_DB)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.error("Error connecting to MongoDB:", err));
