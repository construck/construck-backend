const _ = require("lodash");
const moment = require("moment");
const send = require("../../utils/sendEmailNode");
const template = require("./template");

const { FRONTEND_URL } = process.env;

async function resetPassword(email, name, token) {
  let htmlTable = `
  <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-collapse: collapse">
    <tr style="padding: 20px 20px 0 0px">
      <div style="text-align:left;padding:32px">
      <div>
        Hello ${name},
      </div>
      <div style="margin: 12px 0">
        Follow this link to reset your Shabika password for your ${email} account.
      </div >
      <div style="margin: 12px 0">
        ${FRONTEND_URL}/auth/reset-password/${token}
      </div>
      <div style="margin: 12px 0">
        This link will expire in 2 hours. If you didn't request this, please ignore this email.
      </div>
      <div style="margin: 12px 0">
        Thanks,
      </div>
      <div style="margin: 12px 0">
        ConsTruck Team
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
