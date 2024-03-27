
const dotenv = require("dotenv").config();
const _ = require("lodash");
const moment = require("moment");
const send = require("../../utils/sendEmailNode");
const template = require("./template");
async function dispatchReport(date, dispatches) {
  const { EMAIL_DISPATCH_REPORT_RECEIVER } = process.env;
  let to = EMAIL_DISPATCH_REPORT_RECEIVER;
  const tableBody = dispatches.reduce((acc, item, currentIndex) => {
    return (
      acc +
      `
      <tr style="text-align: left;border-bottom:1px solid #CDCDCD;padding:5px;" bgcolor="${
        currentIndex < 5 ? "#E7F3DD" : ""
      }">
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:left"> ${
          item.project
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.created + item.inProgress + item.stopped
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.created !== 0 ? item.created : "-"
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.inProgress !== 0 ? item.inProgress : "-"
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">${
          item.stopped !== 0 ? item.stopped : "-"
        }</td>
        <td style="	border: 1px solid #BABABA;padding: 10px;text-align:right">
        
        ${
          item.stopped !== 0
            ? `${_.round(
                (item.stopped * 100) /
                  (item.created + item.inProgress + item.stopped),
                1
              )} %`
            : "-"
        }
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
          Daily dispatch report as of date: <b><u>${moment(date).format("MMM DD, YYYY")}</u></b>,
        <br />
        </p>
      </div>
      <div style="margin-bottom: 32px">
        <table border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse: collapse">
          <tr style="padding:5px;text-align: left;border-bottom:1px solid #CDCDCD">
            <td style="background-color: #FBD487;color:#504438;width:160px;padding: 10px;font-size:12px;text-align:left;font-weight:normal">Project name</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">Total</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">Open</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">In progress</td>
            <td style="background-color: #FBD487;color:#504438;width: 50px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">Stopped</td>
            <td style="background-color: #FBD487;color:#504438;width: 60px;padding: 10px;font-size:12px;text-align:right;font-weight:normal">% Stopped</td>
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
    `Dispatch report - ${moment(date).format("MMM DD, YYYY")}`,
    "Daily dispatch report",
    await template.layout(htmlTable)
  )
    .then(() => console.log("Sent"))
    .catch((err) => {
      console.log("err", err);
      return err;
    });
}

module.exports = {
  dispatchReport,
};
