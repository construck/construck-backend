const ProjectInvoice = require("./../models/projectInvoices");

async function getInvoicesByProject(req, res) {
  const { id } = req.params;
  try {
    const response = await ProjectInvoice.model
      .find({ project: id })
      .populate("project")
      .sort({ _id: -1 });
    return res.status(200).send(response);
  } catch (err) {
    return res.send(err);
  }
}

module.exports = {
  getInvoicesByProject,
};
