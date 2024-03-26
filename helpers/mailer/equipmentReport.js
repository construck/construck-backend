const _ = require("lodash");
const moment = require("moment");
const send = require("./../../utils/sendEmailNode");
// const mjml2html = require("mjml");
const template = require("./template");

const getPercentWorkshop = (row) => {
  let percent = 0;
  percent = _.round((row.workshop * 100) / (row.workshop + row.available), 1);
  return percent === 0 ? "-" : `${percent}%`;
};
const getPercentAvailable = (row) => {
  let percent = 0;
  percent = _.round((row.available * 100) / (row.workshop + row.available), 1);
  return percent === 0 ? "-" : `${percent}%`;
};

async function equipmentReport(date, utilization) {
  const { EMAIL_EQUIPMENT_REPORT_RECEIVER } = process.env;
  let to = EMAIL_EQUIPMENT_REPORT_RECEIVER;
  const tableBody = utilization.reduce((acc, item, currentIndex) => {
    return (
      acc +
      `
      <tr style="text-align: left;border-bottom:1px solid #CDCDCD;padding:5px;" bgcolor="${
        currentIndex < 5 ? "#FFF4EB" : ""
      }">
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:left"> ${
          item.type
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.available + item.workshop
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.available !== 0 ? item.available : "-"
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">
        ${getPercentAvailable(item)}
        </td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.workshop !== 0 ? item.workshop : "-"
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">
        ${getPercentWorkshop(item)}
        </td>
      </tr>
     `
    );
  }, "");

  let htmlTable = `
  <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-collapse: collapse">
    <tr style="padding: 20px 20px 0 0px">
      <div style="text-align:left">
        Hello,<br />
        <p>
          Daily equipment utilization report as of date: <b><u>${date}</u></b>,
        <br />
        </p>
      </div>
      <div style="margin-bottom: 32px">
        <table border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse: collapse">
          <tr style="padding:5px;text-align: left;border-bottom:1px solid #CDCDCD">
            <td style="background-color: #FBD487;color:#504438;width:160px;padding: 10px;font-size:12px;text-align:left;font-weight:normal">Equipment type</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">Total</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">Available</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">%</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">Workshop</td>
            <td style="background-color: #FBD487;color:#504438;width: 60px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">%</td>
          </tr>
            ${tableBody}
        </table>
      </div>
    </tr>
  </table>
  `;
  send(
    "appinfo@construck.rw",
    to,
    `Equipment utilization report - ${moment(date).format("MM DD, YYYY")}`,
    "Daily equipment utilization",
    await template.layout(htmlTable)
  )
    .then(() => console.log("Sent"))
    .catch((err) => {
      console.log("err", err);
      return err;
    });
}

module.exports = {
  equipmentReport,
};
