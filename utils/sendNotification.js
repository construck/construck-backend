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
  };

  admin
    .messaging()
    .send(payload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

module.exports = {sendPushNotification};
