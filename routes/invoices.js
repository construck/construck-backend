const router = require("express").Router();
const Invoices = require("../controllers/invoices");

router.get("/", async (req, res) => {
  console.log('fetchInvoices')
  Invoices.fetchInvoices(req, res);
});


module.exports = router;