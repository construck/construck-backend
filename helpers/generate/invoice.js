const ProjectInvoice = require("./../../models/projectInvoices");
const User = require("./../../models/users");
const { ACCOUNT_MANAGER } = process.env;

async function generateInvoice(id, month, year, aggregatedRevenue) {
  // FIND RECENT INVOICE

  const recentInvoice = await ProjectInvoice.model
    .findOne({ project: id, month, year })
    .sort({ increment: -1 });
  // FIND REVENUE ADMIN
  const revenueAdmin = await User.model.findOne(
    {
      userType: "revenue",
      assignedProjects: {
        $elemMatch: {
          _id: id.toString(),
        },
      },
    },
    {
      firstName: 1,
      lastName: 1,
      userType: 1,
    }
  );
  // FIND SITE MANAGER
  const siteManager = await User.model.findOne(
    {
      userType: "customer-site-manager",
      assignedProjects: {
        $elemMatch: {
          _id: id.toString(),
        },
      },
    },
    {
      firstName: 1,
      lastName: 1,
      userType: 1,
    }
  );
  // FIND PROJECT MANAGER
  const projectManager = await User.model.findOne(
    {
      userType: "customer-project-manager",
      assignedProjects: {
        $elemMatch: {
          _id: id.toString(),
        },
      },
    },
    {
      firstName: 1,
      lastName: 1,
      userType: 1,
    }
  );
  const increment = recentInvoice ? recentInvoice.increment + 1 : 1;

  // console.log("@@@really", revenueAdmin);
  // console.log("@@@really", siteManager);
  // console.log("@@@really", projectManager);
  // return;
  const Invoice = new ProjectInvoice.model({
    project: id,
    month,
    year,
    increment,
    amount: aggregatedRevenue,
    revenueAdmin: revenueAdmin._id,
    accountManager: ACCOUNT_MANAGER,
    siteManager: siteManager ? siteManager._id : null,
    projectManager: projectManager ? projectManager._id : null,
  });
  const response = await Invoice.save();
  return response;
}

module.exports = { generateInvoice };
