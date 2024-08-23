const Work = require("./../../models/workData");

async function getInvoicedDispatchesByVendors(vendor, year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const pipeline = [
    {
      $match: {
        "equipment.eqOwner": vendor,
        status: "released",
        totalExpenditure: { $gt: 0 },
        siteWork: false,
        workStartDate: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
        vendorInvoice: { $exists: false },
        vendorInvoice: { $eq: "" },
        vendorInvoice: { $eq: null },
      },
    },
    {
      $addFields: {
        amount: "$totalExpenditure",
      },
    },
    {
      $group: {
        _id: "$equipment.plateNumber",
        amount: {
          $sum: "$amount",
        },
        duration: {
          $sum: "$duration",
        },
        equipment: {
          $first: "$equipment",
        },
        project: {
          $first: "$project",
        },
        workStartDate: {
          $first: "$workStartDate",
        },
        siteWork: {
          $first: "$siteWork",
        },
      },
    },
    {
      $project: {
        _id: 1,
        "equipment.eqDescription": 1,
        "equipment.plateNumber": 1,
        "equipment.uom": 1,
        "equipment.rate": 1,
        "dispatch.date": 1,
        "dispatch.shift": 1,
        project: 1,
        duration: 1,
        status: 1,
        date: 1,
        totalExpenditure: 1,
        siteWork: 1,
        workStartDate: 1,
        amount: 1,
        siteWork: 1,
      },
    },
  ];
  const response = await Work.model.aggregate(pipeline);
  return response;
}

module.exports = getInvoicedDispatchesByVendors ;
