const dotenv = require("dotenv").config();
const nodemailer = require("nodemailer");

const { CTK_SENDER_EMAIL, CTK_SENDER_PASSWORD } = process.env;
console.log("Cred", CTK_SENDER_EMAIL, CTK_SENDER_PASSWORD);

// create transporter object with smtp server details
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: CTK_SENDER_EMAIL,
    pass: CTK_SENDER_PASSWORD,
  },
});

// send email
async function send(from, to, subject, text, html) {
  return await transporter.sendMail({
    from: CTK_SENDER_EMAIL,
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
}

module.exports = send;
