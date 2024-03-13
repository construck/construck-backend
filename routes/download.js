const router = require("express").Router();
const workData = require("../models/workData");
const _ = require("lodash");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;

router.get("/dailyworks/all", async (req, res) => {
  //download/dailyworks/all
  // 1. GET ALL SITE WORKS IN JANUARY
  const works = await workData.model.find(
    {
      // _id: {
      //   $in: [
      //     new mongoose.Types.ObjectId("65ccd6dbeb34db1f20e2e2a6"),
      //     new mongoose.Types.ObjectId("65b8b4de93f04c9985c70a0a"),
      //     new mongoose.Types.ObjectId("65bb9c507f9790b68f14a455"),
      //   ],
      // },
      siteWork: true,
      workStartDate: {
        $gte: new Date("Sun, 01 Jan 2023 00:00:00 GMT"),
      },
      workEndDate: {
        $lte: new Date("Wed, 31 Jan 2024 23:59:00 GMT"),
      },
    }
    // { $set: { totalRevenue: 0 } }
  );
  // .limit(100);

  // 2. GET ALL SITE WORKS THAT HAS DURATION 0
  console.log("works length", works.length);
  // try {
  works.map(async (work) => {
    let allworks = [];
    work?.dailyWork &&
      work?.dailyWork.length > 0 &&
      work?.dailyWork.map((d) => {
        if (
          d.duration === 0 &&
          (d.totalRevenue > 0 || d.totalExpenditure > 0)
        ) {
          d.totalRevenue = 0;
          d.totalExpenditure = 0;
          console.log("@@@@dispatch_id", work._id);
        }
        allworks.push(d);
      });
    // console.log("array", allworks.length, allworks);

    // console.log("allworks: ", allworks);
    // const result = await workData.model.updateOne(
    //   { _id: new mongoose.Types.ObjectId(work._id) },
    //   {
    //     $set: {
    //       dailyWork: allworks,
    //     },
    //   }
    // );
    // console.log("result: ", result);
    return;
  });
  return res.send(
    { message: "00" }
    // dailworks
  );
  // 3. UPDATE TOTALREVENUE AND TOTALEXPENDITURE IF DURATION IS 0
  // return res.send({ count: works.length, works });
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
router.get("/allrevenues", async (req, res) => {
  try {
    const querySiteWorks = {
      siteWork: true,
      // workStartDate: { $lte: "2024-01-01" },
      // workEndDate: { $gte: "2024-01-31" },
      workStartDate: {
        $gte: new Date("Sun, 01 Jan 2023 00:00:00 GMT"),
      },
      workEndDate: {
        $lte: new Date("Wed, 31 Jan 2024 23:59:00 GMT"),
      },
    };
    const queryOthers = {
      siteWork: false,
      // "dispatch.date": {
      //     $gte: "2024-01-01",
      //     $lte: "2024-01-31",
      // },
    };
    const responseSiteWorks = await workData.model.find(querySiteWorks).limit(20);
    // console.log('responseSiteWorks: ', responseSiteWorks.length);
    // const responseOthers = await workData.model.find(queryOthers);
    let dailyWorkData = [];
    let revenueSumOfSiteworks = 0;
    responseSiteWorks.map((r) => {
      let revenues = 0
      r.dailyWork &&
        r.dailyWork.map((d) => {
          if(d.duration > 0){
            // console.log('total revenue', _.round(d.duration * d?.rate).toFixed(2))
            revenues = revenues + _.round(d.duration * d?.rate).toFixed(2)
          }
        });
        console.log('total revenue', revenues)
    });

    // let revenueSumOfOthers = 0;
    // let others = responseOthers.map((r) => {
    //   if (r.duration > 0) {
    //     revenueSumOfOthers = revenueSumOfOthers + r.totalRevenue;
    //   }
    // });

    return res.status(200).send({
      revenue: {
        siteworks: "",
        // others: revenueSumOfOthers,
      },
      expected: {
        siteworks: "",
        others: "",
      },
    });
  } catch (err) {
    console.log("err: ", err);
    return res.send(err);
  }
});

module.exports = router;
