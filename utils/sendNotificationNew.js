const FCM = require("fcm-node");

var serverKey = 'c4b50d731f650fc5b3c77ac5154a7d457b0627b554912286b9658ed9c2c49cb2a37b8a1f87cc2254'

var fcm = new FCM(serverKey);

var message = {
  //this may vary according to the message type (single recipient, multicast, topic, et cetera)
  to: "registration_token",
//   collapse_key: "your_collapse_key",

  notification: {
    title: "Title of your push notification",
    body: "Body of your push notification",
  },

  data: {
    //you can send only notification or only data(or include both)
    my_key: "my value",
    my_another_key: "my another value",
  },
};

function sendNot(){
    fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!"+err);
        } else {
          console.log("Successfully sent with response: ", response);
        }
      });
      
}

module.exports = {
    sendNot
}