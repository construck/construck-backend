const _ = require("lodash");
const mongoose = require("mongoose");
const prjSchema = require("./projects").schema;
const dispSchema = require("./dispatches").schema;
const eqSchema = require("./equipments").schema;
// const { findOneAndUpdate } = require("./../helpers/hooks/dispatches/findOneAndUpdate");
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
  },
  {
    timestamps: true,
  }
);
// WorkSchema.pre("update", async function (next) {
//   const dispatch = this;

//   if (dispatch.status === "stopped" && dispatch.totalRevenue === 0) {
//     console.log("update:stopped");
//     const LogData = new LogDispatch.model({
//       request: dispatch,
//       status: "stopped",
//       action: "update",
//     });
//     await LogData.save();
//   } else if (dispatch.status === "created" && dispatch.totalRevenue > 0) {
//     console.log("update:created");
//     const LogData = new LogDispatch.model({
//       request: dispatch,
//       status: "created",
//       action: "update",
//     });
//     await LogData.save();
//   } else {
//     console.log("update:others");
//     const LogData = new LogDispatch.model({
//       request: dispatch,
//       status: "others",
//       action: "update",
//     });
//     await LogData.save();
//   }

//   next();
// });
WorkSchema.pre("save", async function (next) {
  const dispatch = this;

  if (
    !_.isEmpty(dispatch._id) &&
    dispatch.status === "created" &&
    dispatch.totalRevenue > 0
  ) {
    const LogData = new LogDispatch.model({
      request: dispatch,
      status: "others",
      action: "save",
    });
    await LogData.save();
  }

  // if (dispatch.status === "stopped" && dispatch.totalRevenue === 0) {
  //   console.log("save:stopped");
  //   const LogData = new LogDispatch.model({
  //     request: dispatch,
  //     status: "stopped",
  //     action: "save",
  //   });
  //   await LogData.save();
  // } else if (dispatch.status === "created" && dispatch.totalRevenue > 0) {
  //   console.log("save:created");
  //   const LogData = new LogDispatch.model({
  //     request: dispatch,
  //     status: "created",
  //     action: "save",
  //   });
  //   await LogData.save();
  // } else {
  //   console.log("save:others", _.isNull(dispatch._id), _.isEmpty(dispatch._id));
  //   const LogData = new LogDispatch.model({
  //     request: dispatch,
  //     status: "others",
  //     action: "save",
  //   });
  //   await LogData.save();
  // }

  next();
});
// WorkSchema.pre("findOneAndUpdate", async function (next) {
//   const dispatch = this.getUpdate();

//   if (dispatch.status === "stopped" && dispatch.totalRevenue === 0) {
//     console.log("findOneAndUpdate:stopped");
//     const LogData = new LogDispatch.model({
//       request: dispatch,
//       status: "stopped",
//       action: "findOneAndUpdate",
//     });
//     await LogData.save();
//   } else if (dispatch.status === "created" && dispatch.totalRevenue > 0) {
//     console.log("findOneAndUpdate:created");
//     const LogData = new LogDispatch.model({
//       request: dispatch,
//       status: "created",
//       action: "findOneAndUpdate",
//     });
//     await LogData.save();
//   } else {
//     console.log("findOneAndUpdate:others");
//     const LogData = new LogDispatch.model({
//       request: dispatch,
//       status: "others",
//       action: "findOneAndUpdate",
//     });
//     await LogData.save();
//   }

//   next();
// });

module.exports = {
  model: mongoose.model("work", WorkSchema),
  schema: WorkSchema,
};
