const router = require("express").Router();
const Deduction = require("../controllers/deductions");

router.post("/invoice/:id/create", async (req, res) => {
  Deduction.createDeduction(req, res);
});
router.delete("/:id/remove", async (req, res) => {
  Deduction.removeDeduction(req, res);
});
router.get("/invoice/:id/list", async (req, res) => {
  Deduction.fetchDeductionPerInvoice(req, res);
});
module.exports = router;
