const router = require("express").Router();
const Invoices = require("../controllers/invoices");

router.get("/vendor/:vendor/preview", async (req, res) => {
  Invoices.vendorInvoicePreview(req, res);
});
router.get("/vendor/:id/list", async (req, res) => {
  Invoices.fetchVendorInvoices(req, res);
});
router.get("/customer/:id/preview", async (req, res) => {
  Invoices.fetchPreviewInvoicesByCustomer(req, res);
});
router.get("/customer/list", async (req, res) => {
  Invoices.fetchCustomerInvoices(req, res);
});
router.post("/customer/:id/create", async (req, res) => {
  Invoices.createConsolidatedInvoice(req, res);
});
router.get("/:id/vendor/details", async (req, res) => {
  Invoices.fetchInvoiceDetailsPerVendor(req, res);
});
router.get("/:id/customer/details", async (req, res) => {
  Invoices.fetchInvoiceDetailsPerCustomer(req, res);
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
router.put("/customer/sign/:id", async (req, res) => {
  Invoices.signCustomerInvoice(req, res);
});

module.exports = router;
