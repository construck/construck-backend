const admin = require("firebase-admin");
const serviceAccount = require("../config/service-acount-file.json");
// var serviceAccount = require("../config/service-acount-file.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = (token, message) => {
  const payload = {
    notification: {
      title: message.title,
      body: message.body,
    },
    token: token,
    apns: {
      payload: {
        aps: {
          alert: {
            title: message.title,
            body: message.body,
          },
          sound: "default",
        },
      },
    },
  };

  admin
    .messaging()
    .send(payload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
      console.log("Error sending message:", error.stack);
    });
};

module.exports = { sendPushNotification };
