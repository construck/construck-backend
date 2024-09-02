const { NODE_ENV, FRONTEND_URL } = process.env;

async function reviewer(invoice, user) {
  try {
    const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Greetings ${user.firstName},</p>
      <p>Invoice #${invoice.year}-${invoice.month}-${
      invoice.increment
    } has been created.</p>

      <h3>Invoice Details:</h3>
      <ul style="list-style-type: none; padding-left: 0;">
      <li>Customer: ${invoice.customer.name}</li>
      <li>Status: Reviewed</li>
          <li>Invoice number: ${invoice.year}-${invoice.month}-${
      invoice.increment
    }</li>
      </ul>

      <div style="margin: 24px 0;">
          <a href="${FRONTEND_URL}/invoices/customer/${invoice._id}" style="
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
    return;
  }
}
async function accountManager(invoice, user) {
  try {
    const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Greetings ${user.firstName},</p>
      <p>Invoice #${invoice.year}-${invoice.month}-${
      invoice.increment
    } has been reviewed.</p>

      <h3>Invoice Details:</h3>
      <ul style="list-style-type: none; padding-left: 0;">
      <li>Status: Waiting for review</li>
      <li>Customer: ${invoice.customer.name}</li>
          <li>Invoice number: ${invoice.year}-${invoice.month}-${
      invoice.increment
    }</li>
      </ul>

      <div style="margin: 24px 0;">
          <a href="${FRONTEND_URL}/invoices/customer/${invoice._id}" style="
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
    return;
  }
}

module.exports = {
  reviewer,
  accountManager,
};
