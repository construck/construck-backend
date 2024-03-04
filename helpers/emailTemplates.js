const templates = {
  riskMapUpdated: `
                    <mjml>
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
                                    font-family="Helvetica Neue">Risk Map data was updated.</mj-text>
                        </mj-column>
                        </mj-section>
                        

                        <!-- Intro text -->
                        <mj-section background-color="#fafafa">
                            <mj-column width="400px">
                                
                                <mj-text color="#525252">
                                    Good day, <br/>
                                    Please find time to check on the updated Risk Map of your company, and do the needfull.    
                                </mj-text>
                                <mj-button background-color="#053566" href="http://${process.env.NODE_LOCAL_HOST}:3000/">Learn more</mj-button>
                        </mj-column>
                        </mj-section>

                        <!-- Social icons -->
                        <mj-section background-color="#f0f0f0"></mj-section>

                    </mj-body>
                    </mjml>`,
  riskToleranceUploaded: `
                    <mjml>
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
                                    font-family="Helvetica Neue">Risk Tolerance values were updated.</mj-text>
                        </mj-column>
                        </mj-section>
                        

                        <!-- Intro text -->
                        <mj-section background-color="#fafafa">
                            <mj-column width="400px">
                                
                                <mj-text color="#525252">
                                    Good day, <br/>
                                    Please find time to check on the updated Risk Tolerance, and do the needfull.    
                                </mj-text>
                                <mj-button background-color="#053566" href="http://${process.env.NODE_LOCAL_HOST}:3000">Learn more</mj-button>
                        </mj-column>
                        </mj-section>

                        <!-- Social icons -->
                        <mj-section background-color="#f0f0f0"></mj-section>

                    </mj-body>
                    </mjml>`,

  passwordUpdated: `<mjml>
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
                                    font-family="Helvetica Neue">Your password was updated.</mj-text>
                        </mj-column>
                        </mj-section>
                        

                        <!-- Intro text -->
                        <mj-section background-color="#fafafa">
                            <mj-column width="400px">
                                
                                <mj-text color="#525252">
                                    Good day, <br/>
                                    Your password to the CVL Risk Management Tool was updated.    
                                </mj-text>
                                <mj-button background-color="#053566" href="http://${process.env.NODE_LOCAL_HOST}:3000">Go to the Application</mj-button>
                        </mj-column>
                        </mj-section>

                        <!-- Social icons -->
                        <mj-section background-color="#f0f0f0"></mj-section>

                    </mj-body>
                    </mjml>`,
};

export default templates;
