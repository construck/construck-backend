const nodemailer = require("nodemailer");

// create transporter object with smtp server details
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: "appinfo@construck.rw",
    pass: "ConsApp@20",
  },
});

// send email
async function send(from, to, subject, text, html) {
  return await transporter.sendMail({
    from: "appinfo@construck.rw",
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
}

module.exports = send;
