const _ = require("lodash");
const mongoose = require("mongoose");
const prjSchema = require("./projects").schema;
const dispSchema = require("./dispatches").schema;
const eqSchema = require("./equipments").schema;
const LogDispatch = require("./logDispatch");

const WorkSchema = new mongoose.Schema(
  {
    project: {
      type: Object,
    },
    projectId: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "projects",
    },
    equipment: {
      type: Object,
    },
    equipmentId: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "equipments",
    },
    dispatch: {
      type: Object,
      date: {
        type: Date,
      },
    },
    driver: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    workDone: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "jobTypes",
    },
    startIndex: {
      type: Number,
    },
    endIndex: {
      type: Number,
    },
    startTime: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
    endTime: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
    date: {
      type: mongoose.SchemaTypes.Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    tripsDone: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalExpenditure: {
      type: Number,
      default: 0,
    },
    projectedRevenue: {
      type: Number,
      default: 0,
    },
    comment: {
      type: String,
    },

    moreComment: {
      type: String,
    },
    status: {
      type: String,
    },
    uom: {
      type: String,
    },
    rate: {
      type: Number,
    },
    reasonForRejection: {
      type: String,
    },
    siteWork: {
      type: Boolean,
    },
    workStartDate: {
      type: Date,
    },
    workEndDate: {
      type: Date,
    },
    workDurationDays: { type: Number, default: 0 },
    dailyWork: [
      {
        date: Date,
        startIndex: Number,
        endIndex: Number,
        duration: Number,
        rate: Number,
        uom: String,
        totalRevenue: Number,
        totalExpenditure: Number,
        projectedRevenue: Number,
        comment: String,
        moreComment: String,
        pending: Boolean,
        rejectedReason: String,
        status: String,
        fuel: {
          type: Number,
          default: null,
        },
      },
    ],
    appovedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    createdOn: {
      type: mongoose.SchemaTypes.Date,
      default: Date.now(),
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    approvedRevenue: {
      type: Number,
      default: 0,
    },
    approvedExpenditure: {
      type: Number,
      default: 0,
    },
    approvedDuration: {
      type: Number,
      default: 0,
    },
    rejectedRevenue: {
      type: Number,
      default: 0,
    },
    rejectedEpenditure: {
      type: Number,
      default: 0,
    },
    rejectedDuration: {
      type: Number,
      default: 0,
    },
    rejectedReason: {
      type: String,
      default: "",
    },
    fuel: {
      type: Number,
      default: null,
    },
    stoppedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    releasedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    approvedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    validatedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "users",
    },
    invoice: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "projectInvoices",
    },
    vendorInvoice: {
      type: mongoose.SchemaTypes.ObjectId,
      transform: (v) => (v === "" ? null : v),
      ref: "vendorInvoices",
    },
  },
  {
    timestamps: true,
  }
);
WorkSchema.pre("save", async function (next) {
  const dispatch = this;
  const idNotEmpty = !_.isEmpty(dispatch._id);
  const statusCreated = dispatch.status === "created";
  const totalRevenuePositive = dispatch.totalRevenue > 0;
  const durationZero = dispatch.duration === 0;

  if (
    idNotEmpty &&
    dispatch.status === "created" &&
    totalRevenuePositive &&
    durationZero
  ) {
    const LogData = new LogDispatch.model({
      request: dispatch,
      status: "checked",
      action: "save",
    });
    await LogData.save();
    return next(
      new Error("Validation error occurred(save), contact administrator")
    );
  } else if (
    idNotEmpty &&
    dispatch.status === "stopped" &&
    totalRevenuePositive &&
    durationZero
  ) {
    const LogData = new LogDispatch.model({
      request: dispatch,
      status: "stopped",
      action: "save",
    });
    await LogData.save();
    return next(
      new Error("Validation error occurred(save), contact administrator")
    );
  } else {
    const LogData = new LogDispatch.model({
      request: dispatch,
      status: "other",
      action: "save",
    });
    await LogData.save();
    next();
  }
});

module.exports = {
  model: mongoose.model("work", WorkSchema),
  schema: WorkSchema,
};
