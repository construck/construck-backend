const router = require("express").Router();
const Invoices = require("../controllers/invoices");

router.get("/vendor/:vendor/preview", async (req, res) => {
  Invoices.vendorInvoicePreview(req, res);
});
router.get("/vendor/:id/list", async (req, res) => {
  Invoices.fetchVendorInvoices(req, res);
});
router.get("/:id/vendor/details", async (req, res) => {
  Invoices.fetchInvoiceDetailsPerVendor(req, res);
});
router.get("/list/outgoing/from-construck", async (req, res) => {
  Invoices.fetchInvoices(req, res);
});
router.get("/list/ingoing/from-vendors", async (req, res) => {
  Invoices.fetchAllVendorInvoices(req, res);
});

router.post("/create-invoice/vendor/:vendor", (req, res) => {
  Invoices.createVendorInvoice(req, res);
});

router.put("/vendor/sign/:id", async (req, res) => {
  Invoices.signVendorInvoice(req, res);
});

module.exports = router;
