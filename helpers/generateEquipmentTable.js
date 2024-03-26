const _ = require("lodash");

async function generateEquipmentTable(types, response, eqtypes) {
  let utilization = [];
  if (_.isEmpty(eqtypes)) {
    utilization = types.map((type) => {
      let count = {
        date: "",
        type: type.description,
        total: 0,
        available: 0,
        availablePercent: 0,
        workshop: 0,
        workshopPercent: 0,
      };
      response.map((r) => {
        if (r.equipmentCategory === type.description) {
          count = {
            ...count,
            date: r.date,
            total: 0,
            available:
              r.status === "available" ? count.available + 1 : count.available,
            availablePercent: null,
            workshop:
              r.status === "workshop" ? count.workshop + 1 : count.workshop,
            workshopPercent: null,
          };
          return count;
        }
      });
      return count;
    });
  } else {
    utilization = types.map((type) => {
      let count = {
        date: "",
        type: type.description,
        total: 0,
        available: 0,
        availablePercent: 0,
        workshop: 0,
        workshopPercent: 0,
      };
      response.map((r) => {
        if (
          r.equipmentCategory === type.description &&
          eqtypes.includes(r.equipmentCategory)
        ) {
          count = {
            ...count,
            date: r.date,
            total: 0,
            available:
              r.status === "available" ? count.available + 1 : count.available,
            availablePercent: 0,
            workshop:
              r.status === "workshop" ? count.workshop + 1 : count.workshop,
            workshopPercent: 0,
          };
          return count;
        }
      });
      return count;
    });
  }
  // REMOVE EQUIPMENT TYPES WITHOUT DATA
  utilization = utilization.filter((r) => {
    return !(r.available === 0 && r.workshop === 0);
  });
  utilization.sort((a, b) => {
    return b.available + b.workshop - (a.available + a.workshop);
  });
  return utilization
}
module.exports = { generateEquipmentTable };
