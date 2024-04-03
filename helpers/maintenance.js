const Work = require("../models/workData");
const moment = require("moment");

async function findAndUpdateDispatchByEquipment(plateNumber, date) {
  try {
    // check if there is single dispatch scheduled to this equipment before creating a new job card
    const query = {
      $or: [
        {
          "equipment.plateNumber": plateNumber,
          siteWork: false,
          status: { $in: ["created", "in progress"] },
          workStartDate: { $gt: moment(date).format("YYYY-MM-DD") },
        },
        {
          "equipment.plateNumber": plateNumber,
          siteWork: true,
          status: { $in: ["created", "on going", "in progress"] },

          workStartDate: { $lte: moment(date, "YYYY-MM-DD", "UTC") },
          workEndDate: { $gt: moment(date, "YYYY-MM-DD", "UTC") },
        },
      ],
    };
    const works = await Work.model.find(query, {
      status: 1,
      workStartDate: 1,
      workEndDate: 1,
      workDurationDays: 1,
      date: 1,
      siteWork: 1,
      dailyWork: 1,
    });
    // return;
    works.map(async (work) => {
      if (work?.siteWork) {
        let workDurationDays = work.workDurationDays;
        workDurationDays =
          moment(date).diff(moment(work.workStartDate), "days") + 1;
        await Work.model.updateOne(
          { _id: work._id },
          {
            $set: {
              workDurationDays,
              workEndDate: moment(date).utc().format("YYYY-MM-DD"),
            },
          }
        );
      } else {
        await Work.model.updateOne(
          { _id: work._id },
          { $set: { status: "stopped" } }
        );
      }
    });
    return;
  } catch (error) {
    console.log("@@error:", error);
  }
  return;
}

module.exports = {
  findAndUpdateDispatchByEquipment,
};
