const mjml2html = require("mjml2html");
const templates = require("../utils/emailTemplates");

export default async function sendEmail(
  from,
  to,
  subject,
  messageType,
  password,
  workPayload
) {
  let link = process.env.CTK_APP_URL
    ? process.env.CTK_APP_URL
    : "https://playground-construck.vercel.app/";
  if (messageType === "accountCreated") {
    templates.accountCreated = `<mjml>
                    <mj-body>
                        <!-- Company Header -->
                        <mj-section background-color="#f0f0f0">
                        <mj-column>
                            <mj-text  font-style=""
                                    font-size="20px"
                                    color="#626262">
                            Crystal Ventures - Risk Management App
                            </mj-text>
                        </mj-column>
                        </mj-section>

                        <!-- Image Header -->
                        <mj-section>
                        <mj-column width="600px">
                                <mj-text  align="center"
                                    color="#626262"
                                    font-size="30px"
                                    font-family="Helvetica Neue">Your account was created.</mj-text>
                        </mj-column>
                        </mj-section>
                        

                        <!-- Intro text -->
                        <mj-section background-color="#fafafa">
                            <mj-column width="400px">
                                
                                <mj-text color="#525252">
                                    Good day, <br/>
                                    This is to notify you that your account has been created in the CVL Risk management tool.<br><br>

                                    Please go to the application by clicking the below button and use the below credentials to reset your password.
                                </mj-text>
                                <mj-text>
                                 Username: ${to}
                                </mj-text>
                                
                                <mj-button background-color="#053566" href=${link}>Go to the Application</mj-button>
                        </mj-column>
                        </mj-section>

                        <!-- Social icons -->
                        <mj-section background-color="#f0f0f0"></mj-section>

                    </mj-body>
                    </mjml>`;
  }

  if (messageType === "passwordReset") {
    templates.passwordReset = `
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
                    ConsTruck - SHABIKA
                    </mj-text>
                </mj-column>
            </mj-section>

            <!-- Image Header -->
            <mj-section  background-color="#fafafa" >
            <mj-column width="600px">
                    <mj-text  align="center"
                        color="#000000"
                        font-size="20px"
                    >Your password has been reset.</mj-text>
            </mj-column>
            </mj-section>
            

            <!-- Intro text -->
            <mj-section background-color="#fafafa">
                <mj-column width="400px">
                    <mj-text color="#525252">
                        Good day, <br/>
                        This is to notify you that your password to access the ConsTruck - SHABIKA has been reset.<br>
                    </mj-text>
                    <mj-text font-weight="bold">
                        Username: ${to}
                    </mj-text>

                        <mj-text color="#525252">
                        Please following the link below to reset your password. Use the provided password as the current one.
                    </mj-text>

                    <mj-button background-color="#000000" color="#fcc245" font-size="16px" border-radius="0px" href=${link} padding="10px 25px">GO TO APPLICATION</mj-button>
                    
            </mj-column>
            </mj-section>

        </mj-body>
    </mjml>`;
  }

  if (messageType === "workRejected") {
    templates.workRejected = `
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
                    ConsTruck - SHABIKA
                    </mj-text>
                </mj-column>
            </mj-section>

            <!-- Image Header -->
            <mj-section  background-color="#fafafa" >
            <mj-column width="600px">
                    <mj-text  align="center"
                        color="#000000"
                        font-size="20px"
                    >Some of the posted revenues were rejected.</mj-text>
            </mj-column>
            </mj-section>
            

            <!-- Intro text -->
            <mj-section background-color="#fafafa">
                <mj-column width="400px">
                    <mj-text color="#525252">
                        Good day, <br/>
                        This is to notify you that some of the posted revenues were rejected by the customer.<br>
                        Please see the details below:
                    </mj-text>
                    <mj-text font-weight="bold">
                        Plate number: ${workPayload?.equipment?.plateNumber}<br>
                        Project: ${workPayload?.project?.prjDescription}<br>
                        Posting date: ${workPayload?.postingDate}<br>
                        Reason for rejection:${workPayload?.reasonForRejection}<br>
                    </mj-text>

                    <mj-button background-color="#000000" color="#fcc245" font-size="16px" border-radius="0px" href=${link} padding="10px 25px">GO TO APPLICATION</mj-button>
                    
            </mj-column>
            </mj-section>

        </mj-body>
    </mjml>`;
  }

  return send(
    from,
    to,
    subject,
    "",
    mjml2html(templates[messageType], {
      keepComments: false,
    }).html
  );
  // .then(() =>
  //   res.send({
  //     error: false,
  //     message: "Email Sent!",
  //   })
  // )
  // .catch((err) => {
  //   res.status(500).send({
  //     error: true,
  //     errorMessage: err.response,
  //   });
  // });
}
