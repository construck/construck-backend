const nodemailer = require("nodemailer");

// create transporter object with smtp server details
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: process.env.CTK_SENDER_EMAIL,
    pass: process.env.CTK_SENDER_PASSWORD,
  },
});

// send email
async function send(from, to, subject, text, html) {
  return await transporter.sendMail({
    from: process.env.CTK_SENDER_EMAIL,
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
}

module.exports = send;
