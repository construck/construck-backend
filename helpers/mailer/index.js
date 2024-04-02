const nodemailer = require("nodemailer");
const templates = require("./../../utils/emailTemplates");

const {
  EMAIL_DISPATCH_REPORT_RECEIVER,
  CTK_SENDER_PASSWORD,
  CTK_SENDER_EMAIL,
} = process.env;

// create transporter object with smtp server details
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: process.env.CTK_SENDER_EMAIL,
    pass: process.env.CTK_SENDER_PASSWORD,
  },
});

async function send(from, to, subject, messageType, password, workPayload) {
  transporter.sendMail(
    {
      from: process.env.CTK_SENDER_EMAIL,
      to: process.env.EMAIL_DISPATCH_REPORT_RECEIVER,
      subject: "Hello Testing EMail",
      text: "Hello",
      html: "<div>Hello</div>",
    },
    function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: ");
      }
    }
  );
  console.log("Email sending...");
}
send().catch(console.error);

module.exports = {
  send,
};
