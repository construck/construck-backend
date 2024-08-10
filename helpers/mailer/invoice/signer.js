const { NODE_ENV, FRONTEND_URL } = process.env;

async function projectAdmin(invoice, project, user) {
  try {
    const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Invoice #${invoice.year}-${invoice.month}-${
      invoice.increment
    } has been authorized.</p>

      <h3>Invoice Details:</h3>
      <ul style="list-style-type: none; padding-left: 0;">
          <li>Project: ${project.prjDescription} / ${project.client.name}</li>
          <li>Status: Authorized</li>
          <li>Invoice number: ${invoice.year}-${invoice.month}-${
      invoice.increment
    }</li>
      </ul>

      <div style="margin: 24px 0;">
          <a href="${FRONTEND_URL}/projects/invoice/${invoice._id}" style="
              color: #202020;
              background-color: #FBD487;
              padding: 8px 24px;
              display: inline-block;
              border-radius: 4px;
              font-weight: 600;
              text-decoration: none;
              text-align: center;
          ">Go to invoice</a>
      </div>

      <p>Best regards,<br>
      Shabika Team</p>

      ${
        NODE_ENV !== "production"
          ? `<p style="color:#787878;font-size:10px">[${NODE_ENV} - ${user.email}]</p>`
          : ""
      }
  </div>
  `;
    return htmlBody;
  } catch (error) {
    console.log("err", err);
    return;
  }
}
async function accountManager(invoice, project, user) {
  try {
    const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Greetings ${user.firstName},</p>
      <p>Invoice #${invoice.year}-${invoice.month}-${
      invoice.increment
    } has been generated. Your approval is required to proceed with the billing process.</p>

      <h3>Invoice Details:</h3>
      <ul style="list-style-type: none; padding-left: 0;">
          <li>Project: ${project.prjDescription} / ${project.client.name}</li>
          <li>Status: Waiting for review</li>
          <li>Invoice number: ${invoice.year}-${invoice.month}-${
      invoice.increment
    }</li>
      </ul>

      <div style="margin: 24px 0;">
          <a href="${FRONTEND_URL}/projects/invoice/${invoice._id}" style="
              color: #202020;
              background-color: #FBD487;
              padding: 8px 24px;
              display: inline-block;
              border-radius: 4px;
              font-weight: 600;
              text-decoration: none;
              text-align: center;
          ">Go to invoice</a>
      </div>

      <h3>Action Required:</h3>
      <p>Please review the invoice by clicking on the button above. After your review, kindly approve the invoice through the Shabika Platform.</p>

      <p>If you have any questions or concerns regarding the invoice, please don't hesitate to reach out to:</p>
      <p>${invoice.revenueAdmin.firstName} ${
      invoice.revenueAdmin.lastName
    }, Project Admin<br>
      Phone: ${invoice.revenueAdmin.phone}</p>

      <p>Best regards,<br>
      Shabika Team</p>

      ${
        NODE_ENV !== "production"
          ? `<p style="color:#787878;font-size:10px">[${NODE_ENV} - ${user.email}]</p>`
          : ""
      }
  </div>
  `;
    return htmlBody;
  } catch (error) {
    console.log("err", err);
    return;
  }
}
async function siteManager(invoice, project, user) {
  try {
    const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Greetings ${user.firstName},</p>
      <p>Invoice #${invoice.year}-${invoice.month}-${
      invoice.increment
    } is ready to be approved. Your approval is required to proceed with the billing process.</p>

      <h3>Invoice Details:</h3>
      <ul style="list-style-type: none; padding-left: 0;">
          <li>Project: ${project.prjDescription} / ${project.client.name}</li>
          <li>Status: Waiting for review</li>
          <li>Invoice number: ${invoice.year}-${invoice.month}-${
      invoice.increment
    }</li>
      </ul>

      <div style="margin: 24px 0;">
          <a href="${FRONTEND_URL}/projects/invoice/${invoice._id}" style="
              color: #202020;
              background-color: #FBD487;
              padding: 8px 24px;
              display: inline-block;
              border-radius: 4px;
              font-weight: 600;
              text-decoration: none;
              text-align: center;
          ">Go to invoice</a>
      </div>

      <h3>Action Required:</h3>
      <p>Please review the invoice by clicking on the button above. After your review, kindly approve the invoice through the Shabika Platform.</p>

      <p>If you have any questions or concerns regarding the invoice, please don't hesitate to reach out to:</p>
      <p>${invoice.revenueAdmin.firstName} ${
      invoice.revenueAdmin.lastName
    }, Project Admin<br>
      Phone: ${invoice.revenueAdmin.phone}</p>
      <p>or</p>
      <p>${invoice.accountManager.firstName} ${
      invoice.accountManager.lastName
    }, Account Manager<br>
      Phone: ${invoice.accountManager.phone}</p>

      <p>Best regards,<br>
      Shabika Team</p>

      ${
        NODE_ENV !== "production"
          ? `<p style="color:#787878;font-size:10px">[${NODE_ENV} - ${user.email}]</p>`
          : ""
      }
  </div>
  `;
    return htmlBody;
  } catch (error) {
    console.log("err", err);
    return;
  }
}
async function projectManager(invoice, project, user) {
  try {
    const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Greetings ${user.firstName},</p>
      <p>Invoice #${invoice.year}-${invoice.month}-${
      invoice.increment
    } is ready to be authorized. Your approval is required to proceed with the billing process.</p>

      <h3>Invoice Details:</h3>
      <ul style="list-style-type: none; padding-left: 0;">
          <li>Project: ${project.prjDescription} / ${project.client.name}</li>
          <li>Status: Waiting for review</li>
          <li>Invoice number: ${invoice.year}-${invoice.month}-${
      invoice.increment
    }</li>
      </ul>

      <div style="margin: 24px 0;">
          <a href="${FRONTEND_URL}/projects/invoice/${invoice._id}" style="
              color: #202020;
              background-color: #FBD487;
              padding: 8px 24px;
              display: inline-block;
              border-radius: 4px;
              font-weight: 600;
              text-decoration: none;
              text-align: center;
          ">Go to invoice</a>
      </div>

      <h3>Action Required:</h3>
      <p>Please review the invoice by clicking on the button above. After your review, kindly approve the invoice through the Shabika Platform.</p>

      <p>If you have any questions or concerns regarding the invoice, please don't hesitate to reach out to:</p>
      <p>${invoice.siteManager.firstName} ${
      invoice.siteManager.lastName
    }, Site Manager<br>
      Phone: ${invoice.siteManager.phone}</p>

      <p>Best regards,<br>
      Shabika Team</p>

      ${
        NODE_ENV !== "production"
          ? `<p style="color:#787878;font-size:10px">[${NODE_ENV} - ${user.email}]</p>`
          : ""
      }
  </div>
  `;
    return htmlBody;
  } catch (error) {
    console.log("err", err);
    return;
  }
}

module.exports = {
  projectAdmin,
  accountManager,
  siteManager,
  projectManager,
};
