const _ = require("lodash");
const moment = require("moment");
const Equipment = require("./../../models/equipments");
const Work = require("./../../models/workData");
const Maintenance = require("./../../models/maintenance");

async function getListOfEquipmentOnDuty(startDate, endDate, shift, siteWork) {
  let query = [];
  query = {
    $or: [
      {
        siteWork: false,
        shift,
        workStartDate: endDate,
      },
      {
        siteWork: true,
        shift,
        workStartDate: {
          $lte: startDate,
        },
        workEndDate: {
          $gte: endDate,
        },
      },
    ],
  };

  const response = Work.model.find(query);
  return response;
}

async function getListOfEquipmentInWorkshop() {
  const maintenance = await Maintenance.model.find(
    {
      jobCard_status: "opened",
    },
    {
      plate: 1,
      status: 1,
      jobCard_status: 1,
    }
  );

  return maintenance || [];
}

async function getListOfDisposedEquipments() {
  const response = await Equipment.model.find(
    {
      eqStatus: "disposed",
    },
    { plateNumber: 1 }
  );
  //   console.log("response", response.length);
  return response;
}

async function checkIfEquipmentWasInWorkshop(id, entrydate, endrepair) {
  entrydate = moment(entrydate)
    // .add(1, "day")
    .startOf("day");
  endrepair = moment(endrepair)
    // .subtract(1, "day")
    .endOf("day");
  console.log("@@@days", entrydate, endrepair);
  let dates = [];
  let query = {};
  // query = {
  //   "plate.value": id,
  //   entryDate: { $gte: entrydate },
  //   endRepair: { $lte: endrepair },
  // };
  // query = {
  //   "plate.value": id,
  //   $or: [
  //     {
  //       entryDate: { $gt: entrydate },
  //       endRepair: { $lt: entrydate },
  //     },
  //     {
  //       entryDate: { $gt: endrepair },
  //       endRepair: { $lt: endrepair },
  //     },
  //     {
  //       entryDate: { $gt: entrydate },
  //       endRepair: { $lt: endrepair },
  //     },
  //   ],
  // };
  // query = {
  //   $and: [
  //     {
  //       "plate.value": id,
  //       $or: [
  //         {
  //           entryDate: {
  //             $lt: { $and: [{ $gt: entrydate }, { $gt: endrepair }] },
  //           },
  //         },
  //         {
  //           endRepair: { $gt: entrydate, $lt: endrepair },
  //         },
  //         {
  //           entryDate: { $lt: entrydate },
  //           endRepair: { $gt: endrepair },
  //         },
  //       ],
  //     },
  //   ],
  // };
  // const maintenance = await Maintenance.model.findOne(query, {
  //   "plate.text": 1,
  //   "plate.value": 1,
  //   status: 1,
  //   jobCard_status: 1,
  //   entryDate: 1,
  //   endRepair: 1,
  // });
  const maintenance = await Maintenance.model.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              { entryDate: { $gt: entrydate } },
              { endRepair: { $gt: entrydate } },
            ],
          },
          {
            $and: [
              { entryDate: { $gt: endrepair } },
              { endRepair: { $lt: endrepair } },
            ],
          },
          {
            $and: [
              { entryDate: { $gt: entrydate } },
              { endRepair: { $lt: endrepair } },
            ],
          },
        ],
      },
    },
  ]);
  console.log("@@maintenance", maintenance);
  return maintenance || [];
}
module.exports = {
  getListOfEquipmentOnDuty,
  getListOfEquipmentInWorkshop,
  getListOfDisposedEquipments,
  checkIfEquipmentWasInWorkshop,
};
