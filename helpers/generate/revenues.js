const Work = require("./../../models/workData");
const _ = require("lodash");
const HOURS_IN_A_DAY = 8;
const TARGET_DURATION = 5;

async function generateGrandRevenues(id) {
  const dispatch = await Work.model.findById(id);
  let grandTotalRevenue = 0;
  let grandTotalExpenditure = 0;

  dispatch.dailyWork?.map((d, index) => {
    grandTotalRevenue += d.totalRevenue;
    if (dispatch.equipment.eqOwner !== "Construck") {
      grandTotalExpenditure += d.totalExpenditure;
    }
  });
  return {
    grandTotalRevenue,
    grandTotalExpenditure,
  };
}
function generateRevenues(dispatch, duration, comment) {
  let totalRevenue = 0;
  let totalExpenditure = 0;
  let projectedRevenue = 0;
  // IF UOM = HOUR
  try {
    if (dispatch.equipment.uom === "hour") {
      projectedRevenue = dispatch.equipment.rate * 5;
      if (comment === "Should never happen") {
        duration = duration > 0 ? duration * 3600000 : 0;
        totalRevenue = (dispatch.equipment.rate * duration) / 3600000;
        totalExpenditure =
          dispatch.equipment.eqOwner === "Construck"
            ? 0
            : (supplierRate * duration) / 3600000;
      } else {
        duration = duration > 0 ? duration : 0;
        totalRevenue = (dispatch.equipment.rate * duration) / 3600000;
        totalExpenditure =
          dispatch.equipment.eqOwner === "Construck"
            ? 0
            : (supplierRate * duration) / 3600000;
      }
    } else {
      if (comment === "Should neve happen") {
        //reason that does not exist
        duration = duration / HOURS_IN_A_DAY;
        totalRevenue = dispatch.equipment.rate * (duration >= 1 ? 1 : 0);
      } else {
        totalRevenue = getTotalRevenue(
          dispatch.equipment.rate,
          duration,
          comment,
          dispatch.equipment?.eqDescription
        );
        totalExpenditure = getTotalRevenue(
          dispatch.equipment.supplierRate,
          duration,
          comment,
          dispatch.equipment?.eqDescription
        );
      }
    }
  } catch (error) {
    console.log("@@@@err", error);
  }
  return {
    totalRevenue,
    totalExpenditure,
    projectedRevenue,
  };
}

const getTotalRevenue = (rate, duration, comment, eqType) => {
  let amount = 0;
  if (eqType === "TIPPER TRUCK" && comment === "Ibibazo bya panne") {
    if (duration >= TARGET_DURATION) {
      amount = rate;
    } else {
      amount = rate * _.round(duration / HOURS_IN_A_DAY, 2);
    }
  } else {
    amount = rate;
  }
  return amount;
};

module.exports = { generateRevenues, generateGrandRevenues };
