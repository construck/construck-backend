const _ = require("lodash");
const moment = require("moment");
const send = require("../../utils/sendEmailNode");
const template = require("./template");

const { FRONTEND_URL } = process.env;

async function resetPassword(email, token) {
  let htmlTable = `
  <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-collapse: collapse">
    <tr style="padding: 20px 20px 0 0px">
      <div style="text-align:left">
      Greetings,<br />
        <p>
          Please see below the equipment availability report </u></b>
        <br />
        </p>
      </div>
      <div style="margin-bottom: 32px">
        <a href="${FRONTEND_URL}/auth/reset-password/${token}">Link</a>
            hello: reset password
      </div>
    </tr>
  </table>
  `;
  send(
    "appinfo@construck.rw",
    email,
    `Reset password`,
    "Reset password",
    await template.layout(htmlTable)
  )
    .then(() => console.log("Sent"))
    .catch((err) => {
      return err;
    });
}

module.exports = {
  resetPassword,
};
