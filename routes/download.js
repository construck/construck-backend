const router = require("express").Router();
const workData = require("../models/workData");
const _ = require("lodash");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;

router.get("/dailyworks/all", async (req, res) => {
  //download/dailyworks/all
  const works = await workData.model.find(
    { _id: { $in: [new mongoose.Types.ObjectId("659e9193bd4ebf87a86c3d0a")] } }
    // {
    //   siteWork: true,
    //   //   "dailyWork.duration": 0,
    //   dailyWork: {
    //     $elemMatch: {
    //       duration: 0,
    //     },
    //   },
    // },
    // { $set: { totalRevenue: 0 } }
  );
  //   const current = works;
  console.log("current", works[0]);
  works.map(async (work) => {
    const d = work.dailyWork.map((d) => {
      let totalRevenue = 0;
      let totalExpenditure = 0;
      if (d.duration === 0) {
        totalRevenue = 0;
        totalExpenditure = 0;
      }
      d.totalRevenue = totalRevenue;
      d.totalExpenditure = totalExpenditure;
      return d;
    });
    console.log("new", d);
    // return res.send({
    //   d,
    // });
    await d.save();
  });
  return;
  //   return res.send(works);
});

router.get("/dispatches", async (req, res) => {
  try {
    const querySiteWorks = {
      siteWork: true,
      workStartDate: { $lte: "2024-01-01" },
      workEndDate: { $gte: "2024-01-31" },
    };
    const queryOthers = {
      siteWork: false,
      // "dispatch.date": {
      //     $gte: "2024-01-01",
      //     $lte: "2024-01-31",
      // },
    };
    const responseSiteWorks = await workData.model.find(querySiteWorks);
    // console.log('responseSiteWorks: ', responseSiteWorks.length);
    const responseOthers = await workData.model.find(queryOthers);
    console.log("responseOthers: ", responseOthers.length);
    let dailyWorkData = [];
    responseSiteWorks.map((r) => {
      r.dailyWork &&
        r.dailyWork.map((d) => {
          console.log("###", d);
          dailyWorkData.push({
            id: r._id,
            "Dispatch date": moment(Date.parse(d.date)).format("YYYY-MM-DD"),
            "Posted On": moment(Date.parse(d.date)).format("YYYY-MM-DD"),
            "Work dates": `${moment(r.workStartDate).format(
              "YYYY-MM-DD"
            )} - ${moment(r.workEndDate).format("YYYY-MM-DD")}`,
            "Dispatch Shift": r.dispatch.shift === "nightShift" ? "N" : "D",
            "Site work": true,
            "Project Description": r.project.prjDescription,
            "Equipment Plate number": r.equipment.plateNumber,
            "Equipment Type": r.equipment?.eqDescription,
            "Unit of measurement": r.equipment?.uom,
            "Duration (HRS)": d.uom === "hour" ? d.duration : "",
            "Duration (DAYS)": d.uom === "day" ? d.duration : "",
            "Work done": r?.workDone ? r?.workDone?.jobDescription : "Others",
            "Other work description": r.dispatch?.otherJobType,
            "Projected Revenue":
              d.equipment?.uom === "hour"
                ? d.equipment?.rate * 5
                : d.equipment?.rate, // TIERRY SHOULD DOUBLE CHECK
            "Duration(Daily work)": d.duration,
            "Daily work Revenue": d.totalRevenue,
            "Vendor payment": 0,

            "Driver Names":
              r.driver && r.driver !== null
                ? r?.driver[0]?.firstName + " " + r?.driver[0]?.lastName
                : r.equipment?.eqOwner,
            // "Turn boy 1":
            //     w?.turnBoy?.length >= 1 ? w?.turnBoy[0]?.firstName + " " + w?.turnBoy[0]?.lastName : "",
            // "Turn boy 2":
            //     w?.turnBoy?.length >= 2 ? w?.turnBoy[1]?.firstName + " " + w?.turnBoy[1]?.lastName : "",
            // "Turn boy 3":
            //     w?.turnBoy?.length >= 3 ? w?.turnBoy[2]?.firstName + " " + w?.turnBoy[2]?.lastName : "",
            // "Turn boy 4":
            //     w?.turnBoy?.length >= 4 ? w?.turnBoy[3]?.firstName + " " + w?.turnBoy[3]?.lastName : "",
            "Driver contacts": r.driver?.phone ? r.driver?.phone : " ",
            // "Target trips": r.dispatch?.targetTrips ? r.dispatch?.targetTrips : 0,
            "Trips done": r.tripsDone || "",
            // "Driver's/Operator's Comment": dNP.comment
            //     ? dNP.comment + " - " + (dNP.moreComment ? dNP.moreComment : "")
            //     : " ",
            Customer: r.project?.customer,
            Status: r.status,
            // "Project Admin": (w.projectAdmin?.firstName || "") + " " + (w.projectAdmin?.lastName || ""),
            "Start index": d?.startIndex || 0,
            "End index": d?.endIndex || 0,
          });
        });
    });

    let others = responseOthers.map((r) => {
      return {
        id: r._id,
        "Dispatch date": moment(Date.parse(r.workStartDate)).format(
          "YYYY-MM-DD"
        ),
        "Posted On": "",
        "Work dates": `${moment(r.workStartDate).format(
          "YYYY-MM-DD"
        )} - ${moment(r.workEndDate).format("YYYY-MM-DD")}`,
        "Dispatch Shift": r.dispatch.shift === "nightShift" ? "N" : "D",
        "Site work": false,
        "Project Description": r.project.prjDescription,
        "Equipment Plate number": r?.equipment?.plateNumber,
        "Equipment Type": r.equipment?.eqDescription,
        "Unit of measurement": r.equipment?.uom,
        "Duration (HRS)": r.uom === "hour" ? r.duration / (60 * 60 * 1000) : "",
        "Duration (DAYS)": r.uom === "day" ? r.duration : "",
        "Work done": "",
        "Other work description": "",
        "Projected Revenue": r.projectedRevenue,
        "Duration(Daily work)": "",
        "Daily work Revenue": r.totalRevenue,
        "Vendor payment": "",
        "Driver Names":
          r.driver && r.driver !== null
            ? r?.driver?.firstName + " " + r?.driver?.lastName
            : r.equipment?.eqOwner,
        // "Turn boy 1":
        //     w?.turnBoy?.length >= 1 ? w?.turnBoy[0]?.firstName + " " + w?.turnBoy[0]?.lastName : "",
        // "Turn boy 2":
        //     w?.turnBoy?.length >= 2 ? w?.turnBoy[1]?.firstName + " " + w?.turnBoy[1]?.lastName : "",
        // "Turn boy 3":
        //     w?.turnBoy?.length >= 3 ? w?.turnBoy[2]?.firstName + " " + w?.turnBoy[2]?.lastName : "",
        // "Turn boy 4":
        //     w?.turnBoy?.length >= 4 ? w?.turnBoy[3]?.firstName + " " + w?.turnBoy[3]?.lastName : "",
        "Driver contacts": r.driver && r.driver !== null ? r.driver.phone : " ",
        // "Target trips": r.dispatch?.targetTrips ? r.dispatch?.targetTrips : 0,
        "Trips done": r.tripsDone || "",
        // "Driver's/Operator's Comment": dNP.comment
        //     ? dNP.comment + " - " + (dNP.moreComment ? dNP.moreComment : "")
        //     : " ",
        Customer: "",
        Status: r.status,
        // "Project Admin": (w.projectAdmin?.firstName || "") + " " + (w.projectAdmin?.lastName || ""),
        "Start index": r?.startIndex || 0,
        "End index": r?.endIndex || 0,
      };
    });

    const combined = [...dailyWorkData, ...others];
    // console.log("###", combined.length);
    return res.status(200).send(combined);
  } catch (err) {
    console.log("err: ", err);
    return res.send(err);
  }
});

module.exports = router;
