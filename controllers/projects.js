const mongoose = require("mongoose");
const moment = require("moment");
const _ = require("lodash");
const ProjectInvoice = require("./../models/projectInvoices");
const Work = require("./../models/workData");
const Project = require("../models/projects");
const User = require("../models/users");

async function getInvoicesByProject(req, res) {
  const { id } = req.params;
  try {
    const response = await ProjectInvoice.model
      .find({ project: id })
      .populate("project")
      .sort({ _id: -1 });
    return res.status(200).send(response);
  } catch (err) {
    return res.status(404).send(err);
  }
}

async function getInvoicePerProject(req, res) {
  const { id } = req.params;
  try {
    const pipeline = [
      {
        $match: {
          invoice: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $addFields: {
          amount: "$totalRevenue",
        },
      },
      {
        $group: {
          _id: "$equipment.plateNumber",
          amount: {
            $sum: "$amount",
          },
          duration: {
            $sum: "$duration",
          },
          equipment: {
            $first: "$equipment",
          },
          project: {
            $first: "$project",
          },
        },
      },
      {
        $project: {
          _id: 1,
          "equipment.eqDescription": 1,
          "equipment.plateNumber": 1,
          "equipment.uom": 1,
          "equipment.rate": 1,
          "dispatch.date": 1,
          "dispatch.shift": 1,
          "project.prjDescription": 1,
          duration: 1,
          status: 1,
          date: 1,
          totalRevenue: 1,
          siteWork: 1,
          workStartDate: 1,
          amount: 1,
          siteWork: 1,
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ];
    const response = await Work.model.aggregate(pipeline);
    // GET INVOICE INFORMATION
    const invoice = await ProjectInvoice.model
      .findOne({
        _id: new mongoose.Types.ObjectId(id),
      })
      .populate("project", { _id: 1, prjDescription: 1 })
      .populate("revenueAdmin", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("accountManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("siteManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      })
      .populate("projectManager", {
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
        signature: 1,
      });
    if (_.isEmpty(invoice)) {
      return res.status(404).send({
        message: "Invoice not found",
      });
    }
    // GET PROJECT ID:
    const project = await Project.model
      .findOne({
        _id: invoice.project,
      })
      .populate("client", { _id: 1, name: 1, tinNumber: 1 })
      .populate("invoiceAuthorizer", {
        _id: 1,
        firstName: 1,
        lastName: 1,
        phone: 1,
        email: 1,
      });
    let siteManager = null;
    siteManager = await User.model.findOne(
      {
        userType: "customer-site-manager",
        assignedProjects: {
          $elemMatch: {
            _id: project._id.toString(),
          },
        },
      },
      {
        firstName: 1,
        lastName: 1,
      }
    );
    let projectManager = null;
    projectManager = await User.model.findOne(
      {
        userType: "customer-project-manager",
        assignedProjects: {
          $elemMatch: {
            _id: project._id.toString(),
          },
        },
      },
      {
        firstName: 1,
        lastName: 1,
      }
    );
    let revenueAdmin = null;
    revenueAdmin = await User.model.findOne(
      {
        userType: "revenue",
        assignedProjects: {
          $elemMatch: {
            _id: project._id.toString(),
          },
        },
      },
      {
        firstName: 1,
        lastName: 1,
      }
    );
    return res.status(200).send({
      meta: {
        project,
        invoice,
        // siteManager: siteManager || null,
        // projectManager: projectManager || null,
        // revenueAdmin: revenueAdmin || null,
      },
      invoice: response,
    });
  } catch (err) {
    console.log("ee", err);
    return res.status(500).send(err);
  }
}

async function getInvoicePreviewPerProject(req, res) {
  const { id, month, year } = req.params;
  const startDate = moment([year, month - 1, 1]).format(
    "YYYY-MM-DDTHH:mm:ss.SSS"
  );
  const endDate = moment([year, month - 1, 1])
    .endOf("month")
    .format("YYYY-MM-DD");
  try {
    const pipeline = [
      {
        $match: {
          "project._id": new mongoose.Types.ObjectId(id),
          status: "validated",
          siteWork: false,
          workStartDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          // workStartDate: {
          //   // $gte: moment("2024-01-01").format("YYYY-MM-DD"),
          //   $eq: startDate,

          // },
          // workStartDate: {
          //   $lte: moment(endDate).format("YYYY-MM-DD"),
          // },
        },
      },
      {
        $addFields: {
          amount: "$totalRevenue",
        },
      },
      {
        $group: {
          _id: "$equipment.plateNumber",
          amount: {
            $sum: "$amount",
          },
          duration: {
            $sum: "$duration",
          },
          equipment: {
            $first: "$equipment",
          },
          project: {
            $first: "$project",
          },
          workStartDate: {
            $first: "$workStartDate",
          },
          siteWork: {
            $first: "$siteWork",
          },
        },
      },
      {
        $project: {
          _id: 1,
          "equipment.eqDescription": 1,
          "equipment.plateNumber": 1,
          "equipment.uom": 1,
          "equipment.rate": 1,
          "dispatch.date": 1,
          "dispatch.shift": 1,
          project: 1,
          duration: 1,
          status: 1,
          date: 1,
          totalRevenue: 1,
          siteWork: 1,
          workStartDate: 1,
          amount: 1,
          siteWork: 1,
        },
      },
      {
        $sort: {
          workStartDate: -1,
        },
      },
    ];
    const response = await Work.model.aggregate(pipeline);
    // GET INVOICE INFORMATION
    // const invoice = await ProjectInvoice.model
    //   .findOne({
    //     _id: new mongoose.Types.ObjectId(id),
    //   })
    //   .populate("project", { _id: 1, prjDescription: 1 })
    //   .populate("revenueAdmin", {
    //     firstName: 1,
    //     lastName: 1,
    //     phone: 1,
    //     email: 1,
    //     signature: 1,
    //   })
    //   .populate("accountManager", {
    //     firstName: 1,
    //     lastName: 1,
    //     phone: 1,
    //     email: 1,
    //     signature: 1,
    //   })
    //   .populate("siteManager", {
    //     firstName: 1,
    //     lastName: 1,
    //     phone: 1,
    //     email: 1,
    //     signature: 1,
    //   })
    //   .populate("projectManager", {
    //     firstName: 1,
    //     lastName: 1,
    //     phone: 1,
    //     email: 1,
    //     signature: 1,
    //   });
    // GET PROJECT ID:
    // const project = await Project.model
    //   .findOne({
    //     _id: invoice.project._id,
    //   })
    //   .populate("client", { _id: 1, name: 1, tinNumber: 1 });
    let siteManager = null;
    // siteManager = await User.model.findOne(
    //   {
    //     userType: "customer-site-manager",
    //     assignedProjects: {
    //       $elemMatch: {
    //         _id: project._id.toString(),
    //       },
    //     },
    //   },
    //   {
    //     firstName: 1,
    //     lastName: 1,
    //   }
    // );
    // let projectManager = null;
    // projectManager = await User.model.findOne(
    //   {
    //     userType: "customer-project-manager",
    //     assignedProjects: {
    //       $elemMatch: {
    //         _id: project._id.toString(),
    //       },
    //     },
    //   },
    //   {
    //     firstName: 1,
    //     lastName: 1,
    //   }
    // );
    // let revenueAdmin = null;
    // revenueAdmin = await User.model.findOne(
    //   {
    //     userType: "revenue",
    //     assignedProjects: {
    //       $elemMatch: {
    //         _id: project._id.toString(),
    //       },
    //     },
    //   },
    //   {
    //     firstName: 1,
    //     lastName: 1,
    //   }
    // );
    return res.status(200).send(response);
  } catch (err) {
    console.log("##err", err);
    return res.status(500).send(err);
  }
}

async function signInvoice(req, res) {
  const { id } = req.params;
  const { type } = req.query;
  const { signer } = req.body;
  let data = {};
  if (type === "reviewer") {
    data = {
      accountManager: signer,
      reviewedAt: new Date(),
      status: "reviewed",
    };
  } else if (type === "approver") {
    data = {
      siteManager: signer,
      approvedAt: new Date(),
      status: "approved",
    };
  } else if (type === "authorizer") {
    data = {
      projectManager: signer,
      authorizedAt: new Date(),
      status: "authorized",
    };
  } else {
    return res.status(400).send({
      message: "Signer is invalid or not authorized",
    });
  }
  try {
    const invoice = await ProjectInvoice.model.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
      },
      {
        $set: data,
      }
    );
    if (type === "authorizer") {
      // TODO: UPDATE STATUS AND INVOICE ID OF ALL WORKS WITH VALIDATED STATUS
      const updatedDispatches = await Work.model.updateMany(
        {
          invoice: id,
          status: "validated",
        },
        {
          status: "released",
        }
      );
    }
    return res.status(200).send({
      message: "Signed",
      invoice,
    });
  } catch (err) {
    console.log("##err", err);
    return res.status(500).send(err);
  }
}

module.exports = {
  getInvoicesByProject,
  getInvoicePerProject,
  getInvoicePreviewPerProject,
  signInvoice,
};
