const userData = require("../models/users");
const workData = require("../models/workData");
const moment = require("moment");

const send = require("../utils/sendEmailNode");
const mjml2html = require("mjml");

let link = process.env.CTK_APP_URL
  ? process.env.CTK_APP_URL
  : "https://shabika.construck.rw/";

async function getDispatchOfficers() {
  try {
    let dispatchOfficers = await userData.model.find(
      {
        userType: "dispatch",
      },
      { email: 1, _id: 0 }
    );
    return dispatchOfficers;
  } catch (err) {}
}

async function getWorksToExpireToday() {
  let list = await getDispatchOfficers();
  let emailList = list?.map(($) => {
    return $.email;
  });

  try {
    let worksToExpireToday = await workData.model.aggregate([
      {
        $addFields: {
          workEndDateStr: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$workEndDate",
            },
          },
        },
      },
      {
        $match: {
          workEndDateStr: moment().format("YYYY-MM-DD"),
          status: { $nin: ["stopped", "recalled"] },
          siteWork: true,
        },
      },
      {
        $project: {
          "equipment.plateNumber": 1,
          "equipment.eqDescription": 1,
          "project.prjDescription": 1,
        },
      },
    ]);

    let emailBody = `
        <mjml>
          <mj-head>
              <mj-attributes>
              <mj-text font-family="Ubuntu, Helvetica, Arial, sans-serif" color="#000000"></mj-text>
              <mj-class name="description"></mj-class>
              <mj-class name="preheader" color="#000000" font-size="11px" padding-left="25px" padding-right="25px"></mj-class>
              <mj-class name="button" background-color="#fcc245" color="#000000" font-size="18px" border-radius="3px" font-family="Ubuntu, Helvetica, Arial, sans-serif"></mj-class>
              </mj-attributes>
              <mj-style inline="inline">a { text-decoration: none!important; }
              </mj-style>
          </mj-head>
          <mj-body>
              <!-- Company Header -->
              <mj-section background-color="#FBD588">
                  <mj-column>
                      <mj-text  font-style=""
                              font-size="25px"
                              color="#000000" align="center">
                      Construck - SHABIKA.
                      </mj-text>
                  </mj-column>
              </mj-section>
        
              <!-- Image Header -->
              <mj-section  background-color="#fafafa" >
              <mj-column width="600px">
                      <mj-text  align="center"
                          color="#000000"
                          font-size="20px"
                      >Jobs to expires TODAY.</mj-text>
              </mj-column>
              </mj-section>
              
        
              <!-- Intro text -->
              <mj-section background-color="#fafafa">
                  <mj-column width="400px">
                      <mj-text color="#525252">
                          Good day, <br/>
                          This is to notify you that we found jobs that are ending today.<br>
                          Please see the list below of the equipment that will be free for new dispatch and decide accordingly:
                      </mj-text>
                      ${worksToExpireToday.map((w) => {
                        return `<mj-text font-weight="bold">
                        ${w?.equipment.eqDescription} - ${w?.equipment?.plateNumber} @ ${w?.project?.prjDescription}
                    </mj-text>`;
                      })}        
        
                      <mj-button background-color="#000000" color="#fcc245" font-size="16px" border-radius="0px" href=${link} padding="10px 25px">GO TO SHABIKA</mj-button>
                      
              </mj-column>
              </mj-section>
        
          </mj-body>
        </mjml>`;

    if (worksToExpireToday.length > 0)
      send(
        "appinfo@construck.rw",
        emailList, //TO CHANGE
        "Jobs to expire today.",
        "",
        mjml2html(emailBody, {
          keepComments: false,
        }).html
      )
        .then(() => console.log("Sent"))
        .catch((err) => {
          (err);
        });
  } catch (err) {
    (err);
  }
}

module.exports = {
  getWorksToExpireToday,
};
